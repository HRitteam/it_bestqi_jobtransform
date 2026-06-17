import { Router, Request, Response } from "express";
import multer from "multer";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { reports, files as filesTable } from "../drizzle/schema";
import { eq, and, gte, sql, ne } from "drizzle-orm";
import { runAnalysisChain, STEP_DEFINITIONS, sanitizeStepData } from "./analysis";
import { getFilteredToolsForJob, formatFilteredTools, generateProhibitionRules } from "./toolCatalog";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";
import { invokeLLM } from "./_core/llm";
import { authenticateAdmin } from "./_core/adminIdentity";
import type { User } from "../drizzle/schema";
import mammoth from "mammoth";
import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
const AdmZip = require("adm-zip");
const iconv = require("iconv-lite");

/** Decode ZIP entry filename: if not UTF-8 flagged, try GBK decoding */
function decodeZipEntryName(entry: any): string {
  const raw = entry.entryName;
  // Check if UTF-8 flag (bit 11) is set in general purpose bit flag
  const header = entry.header;
  const isUtf8 = header && (header.flags & 0x800) !== 0;
  if (isUtf8) return raw;
  // Use rawEntryName buffer (original bytes before any decoding by adm-zip)
  const rawBuf: Buffer | undefined = entry.rawEntryName;
  if (!rawBuf || !Buffer.isBuffer(rawBuf)) return raw;
  // Check if it's pure ASCII — no decoding needed
  if (rawBuf.every((b: number) => b < 0x80)) return rawBuf.toString('ascii');
  // Try GBK decode from raw bytes
  try {
    const decoded = iconv.decode(rawBuf, 'gbk');
    if (/[\u4e00-\u9fff]/.test(decoded)) return decoded;
  } catch { /* ignore */ }
  // Fallback to original
  return raw;
}

/** 每人每天最多分析次数 */
const DAILY_ANALYSIS_LIMIT = 10;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// In-memory SSE connections map
const sseConnections = new Map<string, Response[]>();

/**
 * 统一的 REST 接口用户身份识别
 * 优先级：iframe 身份 > 平台管理员 cookie > OAuth 会话 cookie
 */
async function resolveUser(req: Request): Promise<User | null> {
  // 1. iframe 身份（中间件已注入）
  const iframeUser = (req as any).iframeUser;
  if (iframeUser) return iframeUser;

  // 2. 平台管理员 cookie
  const adminUser = await authenticateAdmin(req);
  if (adminUser) return adminUser;

  // 3. OAuth 会话 cookie
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

export function registerApiRoutes(app: Router) {
  // Submit analysis
  app.post("/api/analysis/submit", upload.array("files", 10), async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const companyId = (req as any).companyId || user.companyId || null;

      // ===== 每人每日分析次数限制（管理员不受限） =====
      let dailyRemaining = DAILY_ANALYSIS_LIMIT;
      if (user.role !== "admin") {
        const db = await getDb();
        if (db) {
          // 使用SQL原生CURDATE()避免JS Date时区转换问题
          const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(reports)
            .where(
              and(
                eq(reports.userId, user.id),
                sql`DATE(${reports.createdAt}) = CURDATE()`,
                ne(reports.status, "pending")
              )
            );
          const todayCount = Number(countResult[0]?.count ?? 0);
          dailyRemaining = Math.max(0, DAILY_ANALYSIS_LIMIT - todayCount);
          if (dailyRemaining <= 0) {
            res.status(429).json({
              error: "daily_limit_exceeded",
              message: `今日分析次数已达上限（${DAILY_ANALYSIS_LIMIT}次），请明日再试`,
              limit: DAILY_ANALYSIS_LIMIT,
              used: todayCount,
            });
            return;
          }
        }
      } else {
        dailyRemaining = 9999; // admin unlimited
      }

      const text = req.body.text || "";
      const uploadedFiles = (req.files as any[]) || [];
      const db = await getDb();

      // Determine processing mode:
      // - If only text (no files): create one report from text
      // - If files: create one report PER file (each file = one job position)
      // - If text + files: text is appended to each file's content as context

      const createdReports: { reportId: string; filename: string | null }[] = [];

      if (uploadedFiles.length === 0 && text.trim()) {
        // Text-only mode: directly start analysis (no confirmation needed)
        const reportId = nanoid(12);
        let extractedInfo: any = null;
        extractedInfo = await extractJobInfoViaAI(text, { companyId, userId: user.id, phone: user.phone || undefined });

        const jobTitle = extractedInfo?.jobTitle || "";
        const company = extractedInfo?.company || "";
        const industry = extractedInfo?.industry || "";

        if (db) {
          await db.insert(reports).values({
            reportId,
            userId: user.id,
            companyId,
            jobTitle: jobTitle || null,
            company: company || null,
            industry: industry || null,
            inputText: text,
            extractedInfo: extractedInfo || null,
            status: "analyzing",
          });
        }

        // Build input and start analysis immediately
        const input = {
          jobTitle,
          company,
          industry,
          inputText: text,
          fileContents: [] as string[],
        };
        startAnalysis(reportId, input, { companyId, userId: user.id, phone: user.phone || undefined });

        // Return with needsConfirmation=false so frontend goes to analysis page directly
        res.json({
          needsConfirmation: false,
          reportId,
          reportIds: [reportId],
          filenames: [null],
        });
        return;
      } else {
        // File mode: one report per file (ZIP files are expanded into individual sub-files)
        // First, expand the file list: ZIP files become their contained sub-files
        interface FileItem {
          buffer: Buffer;
          originalname: string;
          mimetype: string;
          size: number;
        }
        const expandedFiles: FileItem[] = [];

        for (const file of uploadedFiles) {
          // Fix Chinese filename encoding: multer may decode UTF-8 bytes as Latin-1
          try {
            const raw = Buffer.from(file.originalname, 'latin1');
            const decoded = raw.toString('utf8');
            if (!decoded.includes('\ufffd')) {
              file.originalname = decoded;
            }
          } catch {}

          const ext = file.originalname.toLowerCase().split(".").pop() || "";
          if (ext === "zip" || file.mimetype === "application/zip" || file.mimetype === "application/x-zip-compressed") {
            // Expand ZIP: extract each supported sub-file as an independent item
            console.log(`[Submit] Expanding ZIP file: ${file.originalname}`);
            try {
              const zip = new AdmZip(file.buffer);
              const entries = zip.getEntries();
              let subFileCount = 0;
              for (const entry of entries) {
                if (entry.isDirectory) continue;
                // Skip macOS resource fork files and hidden files
                const entryName = decodeZipEntryName(entry);
                if (entryName.startsWith("__MACOSX/") || entryName.startsWith(".")) continue;
                const entryExt = entryName.toLowerCase().split(".").pop() || "";
                if (["txt", "docx", "doc", "pdf"].includes(entryExt)) {
                  const entryBuffer = entry.getData();
                  // Get just the filename (strip directory path)
                  const baseName = entryName.split("/").pop() || entryName;
                  const entryMime = entryExt === "txt" ? "text/plain"
                    : entryExt === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    : entryExt === "doc" ? "application/msword"
                    : "application/pdf";
                  expandedFiles.push({
                    buffer: entryBuffer,
                    originalname: baseName,
                    mimetype: entryMime,
                    size: entryBuffer.length,
                  });
                  subFileCount++;
                  console.log(`[Submit] ZIP sub-file: ${baseName} (${entryExt}, ${entryBuffer.length} bytes)`);
                }
              }
              console.log(`[Submit] ZIP expanded: ${subFileCount} supported files found in ${file.originalname}`);
              if (subFileCount === 0) {
                // ZIP contains no supported files, treat as unsupported
                expandedFiles.push({
                  buffer: file.buffer,
                  originalname: file.originalname,
                  mimetype: file.mimetype,
                  size: file.size,
                });
              }
            } catch (zipErr) {
              console.error(`[Submit] Failed to expand ZIP ${file.originalname}:`, zipErr);
              // If ZIP expansion fails, still add the original file so a report is created
              expandedFiles.push({
                buffer: file.buffer,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
              });
            }
          } else {
            // Non-ZIP file: add directly
            expandedFiles.push({
              buffer: file.buffer,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
            });
          }
        }

        console.log(`[Submit] Total files to process after expansion: ${expandedFiles.length}`);

        // ===== Quota check: if expanded files exceed remaining quota =====
        // Check if user provided a selectedFiles filter (for ZIP selection flow)
        const selectedFilesParam = req.body.selectedFiles;
        let selectedFilesList: string[] | null = null;
        if (selectedFilesParam) {
          try {
            selectedFilesList = JSON.parse(selectedFilesParam);
          } catch {
            selectedFilesList = selectedFilesParam.split(",").map((s: string) => s.trim()).filter(Boolean);
          }
        }

        // If user specified selectedFiles, filter expandedFiles to only those
        if (selectedFilesList && selectedFilesList.length > 0) {
          const filtered = expandedFiles.filter(f => selectedFilesList!.includes(f.originalname));
          if (filtered.length > 0) {
            expandedFiles.length = 0;
            expandedFiles.push(...filtered);
          }
          console.log(`[Submit] Filtered by selectedFiles: ${expandedFiles.length} files`);
        }

        if (expandedFiles.length > dailyRemaining) {
          // Return file list for user to select which ones to analyze
          res.status(422).json({
            error: "quota_exceeded_select",
            message: `文件数量（${expandedFiles.length}个）超过今日剩余配额（${dailyRemaining}次），请选择要分析的文件`,
            remaining: dailyRemaining,
            totalFiles: expandedFiles.length,
            files: expandedFiles.map(f => ({
              filename: f.originalname,
              size: f.size,
              mimetype: f.mimetype,
            })),
          });
          return;
        }

        // Now process each expanded file as one report
        for (const file of expandedFiles) {
          const reportId = nanoid(12);
          try {
            // Step 1: Extract text locally FIRST (this is the critical step)
            console.log(`[Submit] Extracting text from file: ${file.originalname}, mime: ${file.mimetype}, size: ${file.buffer?.length || 0}`);
            const extracted = await extractTextFromBuffer(file.buffer, file.originalname, file.mimetype);
            console.log(`[Submit] Extracted text length: ${extracted?.length || 0}, preview: ${extracted?.slice(0, 200) || '(empty)'}`);

            // Step 2: Try to upload to S3 (non-critical, don't fail if storage is unavailable)
            let fileKey = "";
            let fileUrl = "";
            try {
              const pathPrefix = companyId ? `${companyId}/${user.id}` : `${user.id}`;
              fileKey = `${pathPrefix}/uploads/${reportId}/${file.originalname}`;
              const { url } = await storagePut(fileKey, file.buffer, file.mimetype);
              fileUrl = url;
            } catch (storageErr) {
              console.warn(`[Submit] S3 upload failed for ${file.originalname}, continuing without storage:`, (storageErr as Error).message);
            }

            // Step 3: Save file record to DB (non-critical, don't block AI extraction)
            try {
              if (db) {
                await db.insert(filesTable).values({
                  reportId,
                  userId: user.id,
                  companyId,
                  filename: file.originalname,
                  mimeType: file.mimetype,
                  fileKey: fileKey || `local/${reportId}/${file.originalname}`,
                  url: fileUrl || "",  // url is NOT NULL in schema, use empty string
                  extractedText: extracted || null,
                  fileSize: file.size,
                });
              }
            } catch (dbErr) {
              console.warn(`[Submit] Failed to save file record for ${file.originalname}, continuing:`, (dbErr as Error).message);
            }

            // Step 4: Use AI to extract structured job info from content
            const allContent = [extracted, text].filter(Boolean).join("\n\n");
            console.log(`[Submit] allContent length: ${allContent.length}, will call AI: ${!!allContent.trim()}`);
            let extractedInfo: any = null;
            if (allContent.trim()) {
              extractedInfo = await extractJobInfoViaAI(allContent, { companyId, userId: user.id, phone: user.phone || undefined });
              console.log(`[Submit] AI extractedInfo:`, JSON.stringify(extractedInfo));
            } else {
              console.log(`[Submit] allContent is empty, skipping AI extraction`);
            }

            // Step 5: Create report record
            // inputText: prefer file-extracted text, fallback to user-typed text
            const reportInputText = (extracted && extracted.trim() && !extracted.startsWith("[")) 
              ? extracted.slice(0, 10000)  // Limit to 10k chars for DB storage
              : text;
            if (db) {
              await db.insert(reports).values({
                reportId,
                userId: user.id,
                companyId,
                jobTitle: extractedInfo?.jobTitle || null,
                company: extractedInfo?.company || null,
                industry: extractedInfo?.industry || null,
                inputText: reportInputText,
                extractedInfo: { ...extractedInfo, filename: file.originalname },
                status: "pending",
              });
            }
            createdReports.push({ reportId, filename: file.originalname });
          } catch (fileError) {
            console.error(`[Submit] File processing error for ${file.originalname}:`, fileError);
            // Still create a report even if file parsing fails
            if (db) {
              await db.insert(reports).values({
                reportId,
                userId: user.id,
                companyId,
                jobTitle: null,
                company: null,
                industry: null,
                inputText: text,
                extractedInfo: { jobTitle: "", company: "", industry: "", department: "", responsibilities: "", filename: file.originalname, parseError: (fileError as Error).message },
                status: "pending",
              });
            }
            createdReports.push({ reportId, filename: file.originalname });
          }
        }
      }

      // Return all created report IDs
      // Frontend will navigate through them
      res.json({
        needsConfirmation: true,
        reportIds: createdReports.map(r => r.reportId),
        filenames: createdReports.map(r => r.filename),
        // Backward compatibility: first report
        reportId: createdReports[0]?.reportId,
        extractedInfo: null, // Will be fetched per-report via /info endpoint
      });
    } catch (error: any) {
      console.error("Submit error:", error?.message || error, error?.stack);
      res.status(500).json({ error: "Internal server error", detail: error?.message || "Unknown error" });
    }
  });

  // Confirm extracted info and start analysis
  app.post("/api/analysis/confirm", async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { reportId, jobTitle, company, industry, department, responsibilities, teamSize, currentTools, painPoints, budget, salaryRange } = req.body;
      if (!reportId) {
        res.status(400).json({ error: "reportId is required" });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }

      // Verify report exists and belongs to user
      const existing = await db.select().from(reports).where(eq(reports.reportId, reportId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      if (existing[0].userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }

      // Retrieve file contents from files table for this report
      const reportFiles = await db.select().from(filesTable).where(eq(filesTable.reportId, reportId));
      const fileContents = reportFiles.map(f => f.extractedText).filter(Boolean) as string[];

      // Build input for analysis chain
      const inputText = [
        jobTitle ? `岗位名称：${jobTitle}` : "",
        company ? `公司：${company}` : "",
        industry ? `行业：${industry}` : "",
        department ? `部门：${department}` : "",
        responsibilities ? `职责描述：${responsibilities}` : "",
        teamSize ? `团队规模：${teamSize}` : "",
        currentTools ? `当前使用工具/系统：${currentTools}` : "",
        painPoints ? `当前工作痛点：${painPoints}` : "",
        salaryRange ? `岗位薪资范围：${salaryRange}` : "",
        budget ? `AI转型预算：${budget}` : "",
      ].filter(Boolean).join("\n");

      const input = {
        jobTitle: jobTitle || "",
        company: company || "",
        industry: industry || "",
        inputText,
        fileContents,
        // 新增结构化字段（可选）
        teamSize: teamSize || undefined,
        currentTools: currentTools || undefined,
        painPoints: painPoints || undefined,
        budget: budget || undefined,
        salaryRange: salaryRange || undefined,
      };

      // Update report status and fields
      await db.update(reports)
        .set({
          status: "analyzing",
          jobTitle: jobTitle || null,
          company: company || null,
          industry: industry || null,
          inputText,
          extractedInfo: { jobTitle, company, industry, department, responsibilities, teamSize, currentTools, painPoints, budget, salaryRange },
        })
        .where(eq(reports.reportId, reportId));

      const companyId = (req as any).companyId || user.companyId || null;
      startAnalysis(reportId, input, { companyId, userId: user.id, phone: user.phone || undefined });
      res.json({ reportId });
    } catch (error) {
      console.error("Confirm error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get pending report info for confirmation page
  app.get("/api/analysis/:id/info", async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const reportId = req.params.id;
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }
      const result = await db.select().from(reports).where(eq(reports.reportId, reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      const report = result[0];
      if (report.userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      // Get filename from extractedInfo or files table
      let filename = (report.extractedInfo as any)?.filename || null;
      if (!filename) {
        const fileRecords = await db.select({ filename: filesTable.filename }).from(filesTable).where(eq(filesTable.reportId, reportId)).limit(1);
        filename = fileRecords[0]?.filename || null;
      }

      res.json({
        reportId: report.reportId,
        status: report.status,
        extractedInfo: report.extractedInfo,
        jobTitle: report.jobTitle,
        company: report.company,
        industry: report.industry,
        inputText: report.inputText,
        filename,
        createdAt: report.createdAt,
      });
    } catch (error) {
      console.error("Get info error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Delete a pending report
  app.delete("/api/analysis/:id", async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const reportId = req.params.id;
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }
      const result = await db.select().from(reports).where(eq(reports.reportId, reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      if (result[0].userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      await db.delete(reports).where(eq(reports.reportId, reportId));
      // Also delete associated files
      await db.delete(filesTable).where(eq(filesTable.reportId, reportId));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // SSE progress endpoint
  app.get("/api/analysis/:id/progress", (req: Request, res: Response) => {
    const reportId = req.params.id;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: "connected", reportId })}\n\n`);

    // Heartbeat: send keepalive every 15 seconds to prevent proxy timeout
    const heartbeat = setInterval(() => {
      try {
        res.write(`: keepalive\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    // Register connection
    if (!sseConnections.has(reportId)) {
      sseConnections.set(reportId, []);
    }
    sseConnections.get(reportId)!.push(res);

    // Check if analysis is already complete
    checkExistingStatus(reportId, res);

    // Cleanup on close
    req.on("close", () => {
      clearInterval(heartbeat);
      const connections = sseConnections.get(reportId);
      if (connections) {
        const idx = connections.indexOf(res);
        if (idx > -1) connections.splice(idx, 1);
        if (connections.length === 0) sseConnections.delete(reportId);
      }
    });
  });

  // Polling status endpoint (fallback when SSE fails)
  app.get("/api/analysis/:id/status", async (req: Request, res: Response) => {
    const reportId = req.params.id;
    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database unavailable" });
      return;
    }
    const result = await db.select({
      status: reports.status,
      currentStep: reports.currentStep,
    }).from(reports).where(eq(reports.reportId, reportId)).limit(1);
    if (result.length === 0) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    res.json({ status: result[0].status, currentStep: result[0].currentStep });
  });

  // 查询今日分析配额（已用/剩余）
  app.get("/api/analysis/quota", async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // 管理员不受限制
      if (user.role === "admin") {
        res.json({ limit: DAILY_ANALYSIS_LIMIT, used: 0, remaining: DAILY_ANALYSIS_LIMIT, unlimited: true });
        return;
      }



      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }

      // 使用SQL原生CURDATE()避免JS Date时区转换问题
      const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(reports)
        .where(
          and(
            eq(reports.userId, user.id),
            sql`DATE(${reports.createdAt}) = CURDATE()`,
            ne(reports.status, "pending")
          )
        );
      const used = Number(countResult[0]?.count ?? 0);
      const remaining = Math.max(0, DAILY_ANALYSIS_LIMIT - used);

      res.json({ limit: DAILY_ANALYSIS_LIMIT, used, remaining, unlimited: false });
    } catch (error: any) {
      console.error("[Quota] Error:", error);
      res.status(500).json({ error: "Failed to get quota" });
    }
  });

  // Regenerate step 9 (training) for a completed report
  app.post("/api/report/:id/regenerate-training", async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const reportId = req.params.id;
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }

      const result = await db.select().from(reports).where(eq(reports.reportId, reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }

      const report = result[0];
      if (report.status !== "completed") {
        res.status(400).json({ error: "Report is not completed yet" });
        return;
      }

      const reportData = report.reportData as any[];
      if (!Array.isArray(reportData)) {
        res.status(400).json({ error: "Invalid report data format" });
        return;
      }

      // Get step 9 definition
      const step9 = STEP_DEFINITIONS.find(s => s.id === 9);
      if (!step9) {
        res.status(500).json({ error: "Step 9 definition not found" });
        return;
      }

      // Build previous results for step 9 prompt
      const previousResults = reportData.filter(r => r.step <= 8).map(r => ({
        step: r.step,
        title: r.title,
        data: r.data,
      }));

      // Reconstruct input from step 1 data
      const overview = reportData.find(r => r.step === 1)?.data;
      const input = {
        jobTitle: overview?.jobTitle || "",
        company: overview?.company || "",
        industry: overview?.industry || "",
        level: overview?.level || "",
        responsibilities: overview?.coreResponsibilities?.join("\n") || "",
      };

      const userPrompt = step9.prompt(input as any, previousResults);
      const schemaInstruction = `\n\n【输出格式要求】请严格按照以下JSON结构输出，不要输出任何其他内容：\n${JSON.stringify(step9.schema.schema, null, 2)}`;

      const llmContext = {
        companyId: (req as any).companyId || user.companyId || undefined,
        userId: user.id,
        feature: "job_analysis_retry_step9",
      };

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "你是一位资深的岗位AI转型专家，拥有20年企业管理咨询经验和深厚的AI技术背景。请基于分析结果生成转型能力培训评估。" },
          { role: "user", content: userPrompt + schemaInstruction },
        ],
        response_format: { type: "json_object" },
      } as any, llmContext);

      const content = response.choices[0]?.message?.content;
      let parsed: any;
      if (typeof content === "string") {
        let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, "");
        const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, cleaned];
        const jsonStr = jsonMatch[1]?.trim() || cleaned.trim();
        parsed = JSON.parse(jsonStr);
      } else {
        parsed = content;
      }

      parsed = sanitizeStepData(9, parsed);

      // Update reportData: replace or append step 9
      const existingStep9Idx = reportData.findIndex(r => r.step === 9);
      const step9Result = { step: 9, title: "转型能力培训评估", data: parsed };
      if (existingStep9Idx >= 0) {
        reportData[existingStep9Idx] = step9Result;
      } else {
        reportData.push(step9Result);
      }

      await db.update(reports)
        .set({ reportData, currentStep: 9 })
        .where(eq(reports.reportId, reportId));

      res.json({ success: true, training: parsed });
    } catch (error: any) {
      console.error("[Regenerate Training] Error:", error);
      res.status(500).json({ error: "培训评估重新生成失败，请稍后重试", details: error.message });
    }
  });

  // Retry a full analysis step (Step 1-9) for a completed report
  app.post("/api/report/:id/retry-step", async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const reportId = req.params.id;
      const { stepId } = req.body as { stepId: number };

      if (!stepId || stepId < 1 || stepId > 9) {
        res.status(400).json({ error: "stepId must be between 1 and 9" });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }

      const result = await db.select().from(reports).where(eq(reports.reportId, reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }

      const report = result[0];
      if (report.status !== "completed") {
        res.status(400).json({ error: "Report is not completed yet" });
        return;
      }

      const reportData = report.reportData as any[];
      if (!Array.isArray(reportData)) {
        res.status(400).json({ error: "Invalid report data format" });
        return;
      }

      // Get step definition
      const stepDef = STEP_DEFINITIONS.find(s => s.id === stepId);
      if (!stepDef) {
        res.status(400).json({ error: `Step ${stepId} definition not found` });
        return;
      }

      // Reconstruct the AnalysisInput from stored report fields
      const analysisInput = {
        jobTitle: report.jobTitle || '',
        company: report.company || '',
        industry: report.industry || '',
        inputText: report.inputText || '',
        responsibilities: '',
        fileContents: [] as string[],
      };

      // Reconstruct previous step results (steps before the target)
      const previousResults = reportData
        .filter(r => r.step < stepId)
        .sort((a, b) => a.step - b.step)
        .map(r => ({ step: r.step, title: r.title || '', data: r.data }));

      // Build prompt using the step definition
      const userPrompt = stepDef.prompt(analysisInput as any, previousResults);
      const schemaInstruction = `\n\n【输出格式要求】请严格按照以下JSON结构输出，不要输出任何其他内容：\n${JSON.stringify(stepDef.schema.schema, null, 2)}`;

      const llmContext = {
        companyId: (req as any).companyId || user.companyId || undefined,
        userId: user.id,
        feature: `job_analysis_retry_step${stepId}`,
      };

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "你是一位资深的岗位AI转型专家，拥有20年企业管理咨询经验和深厚的AI技术背景。\n你的分析风格：数据驱动、逻辑严密、洞察深刻、建议可落地。\n你必须严格按照指定的JSON Schema格式输出结构化数据。" },
          { role: "user", content: userPrompt + schemaInstruction },
        ],
        response_format: { type: "json_object" },
      } as any, llmContext);

      const content = response.choices[0]?.message?.content;
      let parsed: any;
      if (typeof content === "string") {
        let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, "");
        const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, cleaned];
        const jsonStr = jsonMatch[1]?.trim() || cleaned.trim();
        parsed = JSON.parse(jsonStr);
      } else {
        parsed = content;
      }

      // Apply sanitization
      parsed = sanitizeStepData(stepId, parsed);

      // Update the specific step in reportData
      const stepIdx = reportData.findIndex(r => r.step === stepId);
      if (stepIdx >= 0) {
        reportData[stepIdx].data = parsed;
      } else {
        // Step didn't exist (was null/failed), add it
        reportData.push({ step: stepId, title: stepDef.title, data: parsed });
        reportData.sort((a, b) => a.step - b.step);
      }

      // Persist updated reportData
      await db.update(reports)
        .set({ reportData })
        .where(eq(reports.reportId, reportId));

      res.json({ success: true, stepId, data: parsed });
    } catch (error: any) {
      console.error("[Retry Step] Error:", error);
      res.status(500).json({ error: "步骤重新分析失败，请稍后重试", details: error.message });
    }
  });
}

async function checkExistingStatus(reportId: string, res: Response) {
  const db = await getDb();
  if (!db) return;

  const result = await db.select().from(reports).where(eq(reports.reportId, reportId)).limit(1);
  if (result.length > 0 && result[0].status === "completed") {
    res.write(`data: ${JSON.stringify({ type: "completed" })}\n\n`);
  }
}

function broadcastProgress(reportId: string, data: any) {
  const connections = sseConnections.get(reportId);
  if (!connections) return;

  const message = `data: ${JSON.stringify(data)}\n\n`;
  connections.forEach((res) => {
    try {
      res.write(message);
    } catch (e) {
      // Connection closed
    }
  });
}

/**
 * Extract text content from file buffer locally using appropriate parsers
 */
async function extractTextFromBuffer(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop() || "";
  console.log(`[extractText] filename=${filename}, ext=${ext}, mimeType=${mimeType}, bufferLen=${buffer?.length || 0}`);
  
  // Guard: check buffer validity
  if (!buffer || buffer.length === 0) {
    console.warn(`[extractText] Empty buffer for ${filename}`);
    return `[文件: ${filename}, 文件内容为空]`;
  }
  
  try {
    // .txt files
    if (mimeType === "text/plain" || ext === "txt") {
      let text = buffer.toString("utf-8");
      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }
      console.log(`[extractText] TXT extracted, length: ${text.length}`);
      return text;
    }

    // .docx files (modern Word)
    if (ext === "docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      console.log(`[extractText] Using mammoth for .docx`);
      const result = await mammoth.extractRawText({ buffer });
      console.log(`[extractText] mammoth result length: ${result.value?.length || 0}`);
      return result.value || "";
    }

    // .doc files (legacy Word) - multiple strategies with pure-JS priority
    if (ext === "doc" || mimeType === "application/msword") {
      console.log(`[extractText] Processing .doc file: ${filename}, size: ${buffer.length}`);

      // Strategy 0 (BEST): word-extractor - pure Node.js, no external dependencies
      try {
        const WordExtractor = require("word-extractor");
        const extractor = new WordExtractor();
        const doc = await extractor.extract(buffer);
        const body = doc.getBody();
        if (body && body.trim() && body.trim().length > 20) {
          console.log(`[extractText] word-extractor OK, length: ${body.trim().length}`);
          return body.trim();
        } else {
          console.warn(`[extractText] word-extractor returned empty/short text (${body?.trim()?.length || 0} chars)`);
        }
      } catch (weErr) {
        console.warn(`[extractText] word-extractor failed:`, (weErr as Error).message);
      }

      // Strategy 1+: libreoffice-based (requires external binary)
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "doc-convert-"));
      const profileDir = path.join(tmpDir, "lo-profile");
      fs.mkdirSync(profileDir, { recursive: true });
      const tmpFile = path.join(tmpDir, `input.doc`);
      fs.writeFileSync(tmpFile, buffer);

      // Check if libreoffice is available
      let loAvailable = false;
      try {
        const loWhich = execSync("which libreoffice 2>/dev/null || which soffice 2>/dev/null", { timeout: 5000, stdio: "pipe" }).toString().trim();
        loAvailable = !!loWhich;
        console.log(`[extractText] libreoffice found at: ${loWhich}`);
      } catch {
        console.warn(`[extractText] libreoffice/soffice NOT found in PATH`);
      }

      // Helper: run libreoffice with isolated user profile to avoid lock conflicts
      const runLO = (format: string): string | null => {
        if (!loAvailable) return null;
        try {
          const profileUri = `file://${profileDir}`;
          const loCmd = `libreoffice --headless --norestore --nolockcheck "-env:UserInstallation=${profileUri}" --convert-to ${format} --outdir "${tmpDir}" "${tmpFile}"`;
          console.log(`[extractText] Running: ${loCmd}`);
          const loResult = execSync(loCmd, {
            timeout: 90000,
            stdio: "pipe",
            env: { ...process.env, HOME: tmpDir },
          });
          const stdout = loResult.toString().trim();
          console.log(`[extractText] libreoffice stdout: ${stdout}`);
          const allFiles = fs.readdirSync(tmpDir);
          console.log(`[extractText] Files after conversion: ${allFiles.join(", ")}`);
          return stdout;
        } catch (err: any) {
          const stderr = err?.stderr?.toString?.() || "";
          const stdout = err?.stdout?.toString?.() || "";
          console.warn(`[extractText] libreoffice --convert-to ${format} failed (exit code: ${err?.status}): ${stderr || stdout || err?.message}`);
          return null;
        }
      };

      try {
        // Strategy 1: libreoffice .doc → .docx → mammoth
        try {
          runLO("docx");
          const docxFile = fs.readdirSync(tmpDir).find(f => f.endsWith(".docx"));
          if (docxFile) {
            const docxBuffer = fs.readFileSync(path.join(tmpDir, docxFile));
            const result = await mammoth.extractRawText({ buffer: docxBuffer });
            if (result.value && result.value.trim()) {
              console.log(`[extractText] .doc→.docx→mammoth OK, length: ${result.value.length}`);
              return result.value;
            }
          }
        } catch (e) {
          console.warn(`[extractText] Strategy 1 (.doc→.docx→mammoth) failed:`, (e as Error).message);
        }

        // Strategy 2: libreoffice .doc → .txt directly
        try {
          fs.readdirSync(tmpDir).filter(f => f.endsWith(".txt")).forEach(f => fs.unlinkSync(path.join(tmpDir, f)));
          runLO('txt:"Text (encoded):UTF8"');
          const txtFile = fs.readdirSync(tmpDir).find(f => f.endsWith(".txt"));
          if (txtFile) {
            const raw = fs.readFileSync(path.join(tmpDir, txtFile), "utf-8");
            const cleanText = raw.charCodeAt(0) === 0xFEFF ? raw.slice(1) : raw;
            if (cleanText.trim()) {
              console.log(`[extractText] .doc→txt OK, length: ${cleanText.length}`);
              return cleanText;
            }
          }
        } catch (e) {
          console.warn(`[extractText] Strategy 2 (.doc→txt) failed:`, (e as Error).message);
        }

        // Strategy 3: try antiword (if installed)
        try {
          const awResult = execSync(`antiword "${tmpFile}"`, { timeout: 30000, stdio: "pipe" });
          const text = awResult.toString("utf-8").trim();
          if (text && text.length > 50) {
            console.log(`[extractText] antiword OK, length: ${text.length}`);
            return text;
          }
        } catch (e) {
          console.warn(`[extractText] antiword not available or failed`);
        }

        // Strategy 4: try catdoc (if installed)
        try {
          const cdResult = execSync(`catdoc "${tmpFile}"`, { timeout: 30000, stdio: "pipe" });
          const text = cdResult.toString("utf-8").trim();
          if (text && text.length > 50) {
            console.log(`[extractText] catdoc OK, length: ${text.length}`);
            return text;
          }
        } catch (e) {
          console.warn(`[extractText] catdoc not available or failed`);
        }

        // Strategy 5: mammoth direct (rarely works for .doc but worth trying)
        try {
          const result = await mammoth.extractRawText({ buffer });
          if (result.value && result.value.trim()) {
            console.log(`[extractText] mammoth direct .doc OK, length: ${result.value.length}`);
            return result.value;
          }
        } catch (mammothErr) {
          console.warn(`[extractText] mammoth direct .doc failed:`, (mammothErr as Error).message);
        }
      } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      }
      console.error(`[extractText] ALL strategies failed for .doc file: ${filename} (${buffer.length} bytes). libreoffice available: ${loAvailable}`);
      return `[文件: ${filename}, .doc格式转换失败，请转换为.docx后重新上传]`;
    }

    // .pdf files - use pdftotext (poppler-utils) command line tool
    if (ext === "pdf" || mimeType === "application/pdf") {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-extract-"));
      const tmpPdf = path.join(tmpDir, "input.pdf");
      const tmpTxt = path.join(tmpDir, "output.txt");
      fs.writeFileSync(tmpPdf, buffer);
      try {
        // Try pdftotext first (most reliable for text extraction)
        try {
          execSync(`pdftotext -layout "${tmpPdf}" "${tmpTxt}"`, {
            timeout: 30000,
            stdio: "pipe",
          });
          if (fs.existsSync(tmpTxt)) {
            const text = fs.readFileSync(tmpTxt, "utf-8");
            if (text.trim()) {
              console.log(`[extractText] PDF extracted via pdftotext, length: ${text.length}`);
              return text;
            }
          }
        } catch (ptErr) {
          console.warn(`[extractText] pdftotext failed for ${filename}:`, (ptErr as Error).message);
        }
        // Fallback: try pdf-parse v2 PDFParse class
        try {
          const { PDFParse } = require("pdf-parse");
          const parser = new PDFParse();
          const result = await parser.getText({ data: new Uint8Array(buffer) });
          const text = result?.pages?.map((p: any) => p.text || "").join("\n") || "";
          if (text.trim()) {
            console.log(`[extractText] PDF extracted via pdf-parse v2, length: ${text.length}`);
            return text;
          }
        } catch (ppErr) {
          console.warn(`[extractText] pdf-parse v2 failed for ${filename}:`, (ppErr as Error).message);
        }
      } finally {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
      }
      return `[文件: ${filename}, PDF解析失败]`;
    }

    // .zip files - extract and process contained files
    if (ext === "zip" || mimeType === "application/zip") {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();
      const results: string[] = [];
      for (const entry of entries) {
        if (entry.isDirectory) continue;
        const entryName = decodeZipEntryName(entry);
        const entryExt = entryName.toLowerCase().split(".").pop() || "";
        // Only process supported file types inside zip
        if (["txt", "docx", "doc", "pdf"].includes(entryExt)) {
          try {
            const entryBuffer = entry.getData();
            const entryMime = entryExt === "txt" ? "text/plain"
              : entryExt === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              : entryExt === "doc" ? "application/msword"
              : "application/pdf";
            const text = await extractTextFromBuffer(entryBuffer, entryName, entryMime);
            if (text.trim()) {
              results.push(`--- ${entryName} ---\n${text}`);
            }
          } catch (e) {
            console.error(`Failed to extract ${entryName} from zip:`, e);
            results.push(`[ZIP内文件: ${entryName}, 处理失败]`);
          }
        }
      }
      return results.length > 0 ? results.join("\n\n") : `[ZIP文件: ${filename}, 未找到可解析的文档]`;
    }

    return `[不支持的文件类型: ${filename}]`;
  } catch (error) {
    console.error(`[extractText] FAILED for ${filename}:`, error);
    return `[文件: ${filename}, 解析失败: ${(error as Error).message}]`;
  }
}

/**
 * Use AI to extract structured job information from document content
 */
async function extractJobInfoViaAI(
  content: string,
  context?: { companyId?: string; userId?: number; phone?: string }
): Promise<{ jobTitle: string; company: string; industry: string; department: string; responsibilities: string } | null> {
  if (!content || !content.trim()) {
    console.warn("[extractJobInfoViaAI] Empty content, skipping");
    return null;
  }
  console.log(`[extractJobInfoViaAI] Content length: ${content.length}, preview: ${content.slice(0, 300)}`);
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `你是一个岗位信息提取专家。请从用户提供的岗位说明书/岗位描述文档中提取以下结构化信息：

1. jobTitle: 岗位名称（通常在文档标题或开头位置）
2. company: 公司名称（如果文档中没有明确提及，返回空字符串）
3. industry: 所属行业（根据岗位内容推断，如IT/科技、金融、制造业等）
4. department: 所属部门（如“隆属部门”字段，或从上下文推断）
5. responsibilities: 核心职责描述（提取文档中“工作职责与任务”、“岗位使命”、“职责”等部分的关键内容，用简洁的文字概括，不超过500字）

重要提示：
- 文档可能是岗位说明书格式，包含岗位代码、岗位编制、直接上级、直接下级等字段
- “隆属部门”字段对应department
- “岗位使命”和“工作职责与任务”部分对应responsibilities
- 请确保提取responsibilities字段时包含具体的职责内容，而不是空字符串
- 请严格按照JSON格式输出，不要输出任何其他内容`
        },
        {
          role: "user",
          content: `请从以下岗位说明书内容中提取岗位相关信息：\n\n${content.slice(0, 8000)}`
        }
      ],
      response_format: { type: "json_object" },
    } as any, { ...context, feature: "job_info_extraction" });

    const resContent = response?.choices?.[0]?.message?.content;
    console.log(`[extractJobInfoViaAI] Raw response content type: ${typeof resContent}, length: ${typeof resContent === 'string' ? resContent.length : 0}`);
    if (typeof resContent === "string") {
      let cleaned = resContent.replace(/<think>[\s\S]*?<\/think>/gi, "");
      // Try to extract JSON from code blocks first, then from raw content
      const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : cleaned.trim();
      console.log(`[extractJobInfoViaAI] JSON to parse: ${jsonStr.slice(0, 500)}`);
      const parsed = JSON.parse(jsonStr);
      const result = {
        jobTitle: parsed.jobTitle || parsed.job_title || parsed["岗位名称"] || "",
        company: parsed.company || parsed["公司"] || parsed["公司名称"] || "",
        industry: parsed.industry || parsed["行业"] || parsed["所属行业"] || "",
        department: parsed.department || parsed["部门"] || parsed["所属部门"] || "",
        responsibilities: parsed.responsibilities || parsed["职责"] || parsed["核心职责"] || "",
      };
      console.log(`[extractJobInfoViaAI] Extracted:`, JSON.stringify(result));
      return result;
    } else if (Array.isArray(resContent)) {
      // Handle array content (some models return content as array)
      const textParts = resContent.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('');
      if (textParts) {
        let cleaned = textParts.replace(/<think>[\s\S]*?<\/think>/gi, "");
        const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : cleaned.trim();
        console.log(`[extractJobInfoViaAI] Array content JSON: ${jsonStr.slice(0, 500)}`);
        const parsed = JSON.parse(jsonStr);
        return {
          jobTitle: parsed.jobTitle || parsed.job_title || "",
          company: parsed.company || "",
          industry: parsed.industry || "",
          department: parsed.department || "",
          responsibilities: parsed.responsibilities || "",
        };
      }
    }
    console.warn(`[extractJobInfoViaAI] Unexpected response content:`, resContent);
    return null;
  } catch (error) {
    console.error("[extractJobInfoViaAI] Error:", error);
    return null;
  }
}

function startAnalysis(reportId: string, input: any, llmContext?: { companyId?: string; userId?: number; phone?: string }) {
  // Run in background
  runAnalysisChain(input, reportId, (step, title, status) => {
    broadcastProgress(reportId, {
      type: "step_update",
      step: step - 1, // 0-indexed for frontend
      title,
      status,
    });
  }, llmContext).then(() => {
    // 数据库写入 reportData 完成后再通知前端跳转，避免竞态条件
    broadcastProgress(reportId, { type: "completed" });
  }).catch((error) => {
    console.error("Analysis chain error:", error);
    broadcastProgress(reportId, { type: "error", message: error.message });
  });
}
