import { Router, Request, Response } from "express";
import { getDb } from "./db";
import { reports, reportDistributions } from "../drizzle/schema";
import { eq, or, inArray } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { authenticateAdmin } from "./_core/adminIdentity";
import { checkPermission } from "./routers";
import type { User } from "../drizzle/schema";
import puppeteer from "puppeteer-core";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

/** 判断给定可执行路径是否为 snap 包装（snap 版 Chromium 会因 AppArmor 限制导致 puppeteer 连接 DevTools 协议时静默挂死） */
function isSnapWrapped(p: string): boolean {
  try {
    // snap 的 /usr/bin/chromium(-browser) 通常是指向 /snap/bin 的软链或调用 snap 的 shell 包装脚本
    const real = fs.realpathSync(p);
    if (real.includes('/snap/')) return true;
    const stat = fs.lstatSync(p);
    if (stat.size < 4096) {
      const head = fs.readFileSync(p, 'utf-8').slice(0, 512);
      if (head.includes('snap') || head.includes('#!/bin/sh') && head.includes('chromium')) return true;
    }
  } catch {}
  return false;
}

function findChromiumPath(): string {
  // 优先选用真正的 Google Chrome / 非 snap Chromium（.deb 安装），避免 snap 的 AppArmor 沙箱问题
  const preferred = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/opt/google/chrome/chrome',
    '/usr/lib/chromium/chromium',
    '/usr/lib/chromium-browser/chromium-browser',
  ];
  for (const p of preferred) {
    if (fs.existsSync(p)) return p;
  }
  // 其次尝试 /usr/bin/chromium(-browser)，但仅当它不是 snap 包装时
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser']) {
    if (fs.existsSync(p) && !isSnapWrapped(p)) return p;
  }
  // 最后才接受 snap 路径（可能无法正常工作，但保留兜底）
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium']) {
    if (fs.existsSync(p)) {
      console.warn(`[PDF Export] 仅找到可能为 snap 版的 Chromium: ${p}，导出可能因 AppArmor 失败。建议安装 google-chrome-stable(.deb)。`);
      return p;
    }
  }
  try {
    const result = execSync('which google-chrome-stable || which google-chrome || which chromium || which chromium-browser 2>/dev/null', { encoding: 'utf-8' }).trim();
    if (result) return result;
  } catch {}
  throw new Error('Chromium/Chrome not found. Please install: sudo apt install -y google-chrome-stable 或下载 Google Chrome .deb 安装');
}

/**
 * 统一的 REST 接口用户身份识别
 * 优先级：iframe 身份 > 平台管理员 cookie > OAuth 会话 cookie
 */
async function resolveUser(req: Request): Promise<User | null> {
  const iframeUser = (req as any).iframeUser;
  if (iframeUser) return iframeUser;
  const adminUser = await authenticateAdmin(req);
  if (adminUser) return adminUser;
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

/**
 * 后台 PDF 生成任务（异步执行，不阻塞请求）
 */
// [修复] 记录正在生成中的浏览器，供总超时熄断时强制关闭，避免 Chromium 进程泄漏
const activeBrowsers = new Map<string, any>();

async function generatePdfInBackground(reportId: string, serverPort: string) {
  // [修复] 总超时熄断：整个生成过程最多 240 秒，超时即主动报错并置 error，避免无限挂起卡 90%
  const OVERALL_TIMEOUT_MS = 240000;
  let timedOut = false;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => { timedOut = true; reject(new Error("PDF生成总超时(240s)，可能页面图表渲染过慢，请重试")); }, OVERALL_TIMEOUT_MS);
  });
  try {
    await Promise.race([generatePdfCore(reportId, serverPort), timeoutPromise]);
  } catch (error: any) {
    // 超时熄断时强制关闭残留浏览器
    const stuckBrowser = activeBrowsers.get(reportId);
    if (stuckBrowser) { try { await stuckBrowser.close(); } catch {} activeBrowsers.delete(reportId); }
    console.error(`[PDF Export] Background task failed for ${reportId}${timedOut ? " (总超时熄断)" : ""}:`, error?.message || error);
    try {
      const db = await getDb();
      if (db) {
        await db.update(reports)
          .set({ pdfStatus: "error", pdfError: (error?.message || "Unknown error").slice(0, 500) } as any)
          .where(eq(reports.reportId, reportId));
      }
    } catch {}
  }
}

async function generatePdfCore(reportId: string, serverPort: string) {
  let browser: any = null;
  try {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");

    // 标记状态为 generating
    await db.update(reports)
      .set({ pdfStatus: "generating", pdfError: null } as any)
      .where(eq(reports.reportId, reportId));

    const result = await db.select().from(reports).where(eq(reports.reportId, reportId)).limit(1);
    if (result.length === 0) throw new Error("Report not found");
    const report = result[0];

    // 确保有 shareToken
    let accessToken = report.shareToken;
    if (!accessToken) {
      const { nanoid } = await import('nanoid');
      accessToken = nanoid(24);
      await db.update(reports).set({ shareToken: accessToken }).where(eq(reports.reportId, reportId));
    }

    const pageUrl = `http://127.0.0.1:${serverPort}/report/${reportId}?token=${accessToken}&print=1`;
    console.log(`[PDF Export] Background task started for ${reportId}, URL: ${pageUrl}`);

    // 启动 Puppeteer（增加内存和进程限制以支持大页面）
    const chromiumPath = findChromiumPath();
    browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--js-flags=--max-old-space-size=2048',
        '--disable-extensions',
        '--disable-background-networking',
      ],
      protocolTimeout: 300000, // [修复] 30分钟→ 5分钟，避免协议层长时间挂起
    });
    activeBrowsers.set(reportId, browser); // [修复] 注册，供总超时熄断强制关闭
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // 监听页面错误
    page.on('console', (msg: any) => {
      if (msg.type() === 'error') console.log(`[PDF Export] Page error: ${msg.text()}`);
    });
    page.on('pageerror', (err: any) => console.log(`[PDF Export] Page exception: ${err.message}`));

    // 导航到页面：先用 domcontentloaded 快速进页，再等网络基本空闲
    // [修复] 原 networkidle0(500ms 零请求) 对含 ECharts/轮询接口的页面过严，改为 networkidle2 并加容错
    console.log(`[PDF Export] Navigating...`);
    try {
      await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 180000 }); // 3分钟
    } catch (navErr: any) {
      console.log(`[PDF Export] networkidle2 超时，回退到 domcontentloaded: ${navErr.message}`);
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(() => {}); // 2分钟
    }

    // 等待报告主内容出现
    console.log(`[PDF Export] Waiting for content...`);
    // [修复] 原 5分钟/2分钟 超时会在选择器未出现时白白等满，叠加后远超前端 300s 轮询；压缩到秒级
    try {
      await page.waitForSelector('main h1, main h2, [class*="report"], [class*="Report"]', { timeout: 25000 }); // 25秒
    } catch {
      await page.waitForSelector('main, #root', { timeout: 10000 }).catch(() => {}); // 10秒
    }

    // 强制切换为 light 主题，确保 PDF 在白色背景上可读
    console.log(`[PDF Export] Switching to light theme for PDF...`);
    await page.evaluate(() => {
      // 移除 dark class，添加 print-mode class
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('print-mode');
      // 强制覆盖所有硬编码的暗色背景和文字
      const style = document.createElement('style');
      style.textContent = `
        /* ============================================ */
        /* PDF Export Styles - Light Theme + Layout Fix */
        /* ============================================ */

        /* Base: force light theme and print colors */
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          box-sizing: border-box;
        }
        body {
          background: white !important;
          color: #1a1a2e !important;
        }

        /* Override hardcoded dark backgrounds */
        [style*="rgba(13,13,20"], [style*="rgba(18,18,30"], [style*="rgba(10,10,18"],
        [style*="rgb(13, 13, 20"], [style*="rgb(18, 18, 30"], [style*="rgb(10, 10, 18"],
        [style*="rgba(20,20,35"], [style*="rgba(12,12,22"] {
          background-color: #f8f9fa !important;
          background-image: none !important;
        }
        [style*="linear-gradient"] {
          background-image: none !important;
          background-color: #f8f9fa !important;
        }

        /* Fix text colors designed for dark backgrounds */
        .text-white, .text-white\/90, .text-white\/80, .text-white\/75,
        .text-white\/70, .text-white\/60, .text-white\/50,
        .text-white\/85 {
          color: #1a1a2e !important;
        }

        /* Fix border colors */
        [class*="border-white"] {
          border-color: rgba(0, 0, 0, 0.12) !important;
        }

        /* Fix glass panels and cards */
        .glass-panel, .glass-card {
          background: rgba(255, 255, 255, 0.9) !important;
          border-color: rgba(0, 0, 0, 0.1) !important;
        }

        /* Fix muted/card backgrounds */
        [class*="bg-muted"], [class*="bg-card"], [class*="bg-secondary"] {
          background-color: #f3f4f6 !important;
        }
        [class*="bg-white/"] {
          background-color: rgba(255, 255, 255, 0.8) !important;
        }

        /* ============================================ */
        /* LAYOUT FIXES: Force responsive breakpoints  */
        /* A4 = ~794px, so md: (768px) should apply    */
        /* but some layouts still break. Force them.    */
        /* ============================================ */

        /* Force all md:grid-cols-2 to actually be 2 columns */
        .md\:grid-cols-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        .md\:grid-cols-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
        .md\:grid-cols-4 {
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        }
        .lg\:grid-cols-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }

        /* BeforeAfterComparison: force 3-column layout (before | arrow | after) */
        .md\:grid-cols-\[1fr_48px_1fr\] {
          grid-template-columns: 1fr 48px 1fr !important;
        }
        /* Show the md:flex arrow, hide the mobile arrow */
        .hidden.md\:flex {
          display: flex !important;
        }
        .flex.md\:hidden {
          display: none !important;
        }
        .md\:col-span-2 {
          grid-column: span 2 / span 2 !important;
        }

        /* ============================================ */
        /* PREVENT TEXT VERTICAL STACKING               */
        /* ============================================ */

        /* Ensure all text containers have minimum width */
        .rounded-xl, .rounded-lg, .rounded-2xl {
          min-width: 0;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        /* Prevent grid items from being too narrow */
        [class*="grid"] > div {
          min-width: 0;
          overflow: hidden;
        }

        /* Fix flex items wrapping */
        .flex-wrap {
          flex-wrap: wrap !important;
        }

        /* ============================================ */
        /* PAGE BREAK CONTROL                           */
        /* ============================================ */

        section {
          page-break-inside: auto;
        }
        /* Avoid breaking inside cards */
        .bg-card, .rounded-xl, .rounded-2xl {
          page-break-inside: avoid;
        }
        /* Allow page break between major sections */
        section + section {
          page-break-before: auto;
        }
        /* Avoid orphan headers */
        h1, h2, h3, h4, h5 {
          page-break-after: avoid;
        }

        /* ============================================ */
        /* CHART AND MEDIA FIXES                        */
        /* ============================================ */

        /* Center all ECharts chart containers */
        [_echarts_instance_],
        [class*="echarts-for"],
        div[_echarts_instance_] {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* Center chart wrapper divs */
        section > div > div:has(canvas),
        section > div > div:has(svg) {
          display: flex !important;
          justify-content: center !important;
        }

        /* ============================================ */
        /* HIDE NON-PRINT ELEMENTS                      */
        /* ============================================ */

        .report-feedback-section {
          display: none !important;
        }
        /* Hide interactive-only elements */
        button[class*="hover:"] {
          pointer-events: none;
        }

        /* ============================================ */
        /* MAIN CONTENT AREA: ensure full width         */
        /* ============================================ */

        main {
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        main > .mb-8, main > .mb-10, main > .mb-12 {
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        /* Ensure text is always horizontal */
        * {
          writing-mode: horizontal-tb !important;
          text-orientation: mixed !important;
        }

        /* Fix green/red tool recommendation text colors for light bg */
        .text-green-300\/80, .text-green-400\/60, .text-red-400\/50, .text-red-400\/60 {
          color: inherit !important;
        }
        .text-green-400 { color: #16a34a !important; }
        .text-red-400 { color: #dc2626 !important; }
        .text-emerald-400 { color: #059669 !important; }
        .text-sky-400 { color: #0284c7 !important; }
        .text-primary { color: #0d9488 !important; }
      `;
      document.head.appendChild(style);
    });

    // 等待图表渲染（图表需要时间重绘）
    console.log(`[PDF Export] Waiting for charts...`);
    await new Promise(r => setTimeout(r, 4000)); // [修复] 10s→4s

    // 滚动到底部加载所有懒加载内容（大页面需要更多时间）
    console.log(`[PDF Export] Scrolling to load all content...`);
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const maxScrolls = 500; // 防止无限滚动
        let scrollCount = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          scrollCount++;
          if (totalHeight >= document.body.scrollHeight || scrollCount >= maxScrolls) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 150);
      });
    });
    // 等待所有懒加载内容和图表完成渲染
    await new Promise(r => setTimeout(r, 3000)); // [修复] 5s→3s

    // 生成 PDF（增加超时以支持大页面）
    console.log(`[PDF Export] Generating PDF buffer...`);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      preferCSSPageSize: false,
      timeout: 180000, // [修复] 30分钟→ 3分钟
    });

    await browser.close();
    browser = null;
    activeBrowsers.delete(reportId); // [修复] 成功后清理注册

    // 验证 PDF 完整性（最小有效 PDF 约 1KB，正常报告应 > 100KB）
    // 注意：Puppeteer page.pdf() 返回 Uint8Array，需要先转为 Buffer
    const pdfNodeBuffer = Buffer.from(pdfBuffer);
    const pdfSize = pdfNodeBuffer.length;
    console.log(`[PDF Export] PDF generated, size: ${pdfSize} bytes`);
    if (pdfSize < 1024) {
      throw new Error(`PDF file too small (${pdfSize} bytes), likely corrupted or empty`);
    }
    // 检查 PDF 头部魔数（Uint8Array.toString() 返回逗号分隔数字，必须用 Buffer）
    const header = pdfNodeBuffer.slice(0, 5).toString('ascii');
    if (header !== '%PDF-') {
      throw new Error(`Invalid PDF header: ${header}`);
    }

    // 保存到本地文件
    // [修复] PDF 写到持久化目录，避免 vite build(emptyOutDir) 清空 dist/public 后丢失文件
    const pdfDir = path.resolve(process.cwd(), 'storage', 'exports', 'pdf');
    if (!fs.existsSync(pdfDir)) {
      fs.mkdirSync(pdfDir, { recursive: true });
    }
    const safeFileName = `${reportId}.pdf`;
    const pdfFilePath = path.join(pdfDir, safeFileName);
    fs.writeFileSync(pdfFilePath, pdfNodeBuffer);
    const pdfUrl = `/exports/pdf/${safeFileName}`;

    // 更新数据库状态
    await db.update(reports)
      .set({ pdfStatus: "ready", pdfUrl: pdfUrl, pdfError: null } as any)
      .where(eq(reports.reportId, reportId));

    console.log(`[PDF Export] Success! Report ${reportId} PDF stored at: ${pdfUrl}`);
  } catch (error: any) {
    console.error(`[PDF Export] Background task failed for ${reportId}:`, error);
    if (browser) { try { await browser.close(); } catch {} }
    activeBrowsers.delete(reportId); // [修复] 失败后清理注册
    throw error; // [修复] 向上抛出，由外层 generatePdfInBackground 统一置 error 状态
  }
}

export function registerExportRoutes(app: Router) {
  /**
   * POST /api/export/:reportId/pdf - 触发异步 PDF 生成
   * 如果已有缓存的 PDF，直接返回下载 URL
   * 如果正在生成中，返回状态
   * 否则启动后台任务
   */
  app.post("/api/export/:reportId/pdf", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "DB unavailable" }); return; }

      const reportId = req.params.reportId;
      const token = req.query.token as string | undefined;
      const force = req.query.force === "1"; // 强制重新生成

      // 查找报告
      const result = await db.select().from(reports).where(eq(reports.reportId, reportId)).limit(1);
      if (result.length === 0) { res.status(404).json({ error: "Report not found" }); return; }
      const report = result[0];

      // 权限检查
      let hasAccess = false;
      const user = await resolveUser(req);
      if (user && (user.role === "admin" || user.id === report.userId)) {
        hasAccess = true;
      } else if (report.isPublic) {
        hasAccess = true;
      } else if (token) {
        if (report.shareToken === token) {
          hasAccess = true;
        } else {
          const dist = await db.select().from(reportDistributions)
            .where(eq(reportDistributions.linkToken, token)).limit(1);
          if (dist.length > 0 && dist[0].reportId === reportId) {
            hasAccess = true;
          }
        }
      }
      if (!hasAccess) { res.status(403).json({ error: "Access denied" }); return; }

      // [修复] 只有分析完成的报告才能生成 PDF，否则页面无完整数据，导致空白或超时
      if ((report as any).status && (report as any).status !== "completed") {
        res.status(409).json({ error: "报告尚未分析完成，请等分析完成后再导出 PDF" });
        return;
      }

      // 检查是否已有缓存的 PDF
      const pdfStatus = (report as any).pdfStatus || "idle";
      const pdfUrl = (report as any).pdfUrl;

      if (!force && pdfStatus === "ready" && pdfUrl) {
        // 已有 PDF，直接返回下载 URL
        res.json({ status: "ready", url: pdfUrl });
        return;
      }

      if (!force && pdfStatus === "generating") {
        // [修复] 僵死检测：若 generating 状态超过 6 分钟未更新，视为后台任务已崩溃/丢失，强制重启
        const updatedAt = (report as any).updatedAt ? new Date((report as any).updatedAt).getTime() : 0;
        const stuckMs = Date.now() - updatedAt;
        if (updatedAt > 0 && stuckMs < 6 * 60 * 1000) {
          // 未超时，确实在生成中
          res.json({ status: "generating", message: "PDF正在生成中，请稍候..." });
          return;
        }
        // 否则落到下方重新启动任务（僵死恢复）
        console.warn(`[PDF Export] 检测到 ${reportId} 状态僵死在 generating 超过 6 分钟，强制重启任务`);
      }

      // 启动后台生成任务
      const serverPort = (req.socket.localPort || process.env.PORT || 3000).toString();
      // 不 await，让它在后台执行
      generatePdfInBackground(reportId, serverPort);

      res.json({ status: "generating", message: "PDF生成已启动，预计需要30-60秒..." });
    } catch (error: any) {
      console.error("[PDF Export] Trigger error:", error);
      res.status(500).json({ error: `PDF导出失败: ${error.message || '请重试'}` });
    }
  });

  /**
   * GET /api/export/:reportId/pdf/status - 查询 PDF 生成状态
   */
  app.get("/api/export/:reportId/pdf/status", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "DB unavailable" }); return; }

      const reportId = req.params.reportId;
      const result = await db.select().from(reports).where(eq(reports.reportId, reportId)).limit(1);
      if (result.length === 0) { res.status(404).json({ error: "Report not found" }); return; }

      const report = result[0] as any;
      const status = report.pdfStatus || "idle";

      res.json({
        status,
        url: status === "ready" ? report.pdfUrl : null,
        error: status === "error" ? report.pdfError : null,
      });
    } catch (error: any) {
      res.status(500).json({ error: "查询状态失败" });
    }
  });

  /**
   * GET /api/export/:reportId/pdf/download - 直接下载已缓存的 PDF
   * 兼容旧的 GET 请求方式（如果已有缓存则重定向，否则返回错误提示）
   */
  app.get("/api/export/:reportId/pdf", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "DB unavailable" }); return; }

      const reportId = req.params.reportId;
      const token = req.query.token as string | undefined;

      const result = await db.select().from(reports).where(eq(reports.reportId, reportId)).limit(1);
      if (result.length === 0) { res.status(404).json({ error: "Report not found" }); return; }
      const report = result[0] as any;

      // 权限检查
      let hasAccess = false;
      const user = await resolveUser(req);
      if (user && (user.role === "admin" || user.id === report.userId)) {
        hasAccess = true;
      } else if (report.isPublic) {
        hasAccess = true;
      } else if (token) {
        if (report.shareToken === token) hasAccess = true;
      }
      if (!hasAccess) { res.status(403).json({ error: "Access denied" }); return; }

      // 如果有缓存的 PDF，重定向到下载 URL
      if (report.pdfStatus === "ready" && report.pdfUrl) {
        res.redirect(report.pdfUrl);
        return;
      }

      // 没有缓存，返回提示
      res.status(202).json({
        status: report.pdfStatus || "idle",
        message: report.pdfStatus === "generating" ? "PDF正在生成中..." : "PDF尚未生成，请先触发导出",
      });
    } catch (error: any) {
      res.status(500).json({ error: "下载失败" });
    }
  });

  // Export report as JSON (for frontend PDF/PPT generation)
  app.get("/api/export/:reportId/data", async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "DB unavailable" });
        return;
      }

      const result = await db.select()
        .from(reports)
        .where(eq(reports.reportId, req.params.reportId))
        .limit(1);

      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }

      const report = result[0];

      // Check access
      const user = await resolveUser(req);
      if (!report.isPublic && (!user || (user.role !== "admin" && user.id !== report.userId))) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const isPro = user && (user.tier === "pro" || user.tier === "enterprise");

      res.json({
        report: {
          id: report.reportId,
          jobTitle: report.jobTitle,
          company: report.company,
          industry: report.industry,
          data: report.reportData,
          createdAt: report.createdAt,
        },
        watermark: !isPro,
        tier: user?.tier || "free",
      });
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Generate PPT (server-side, returns download URL)
  app.post("/api/export/:reportId/ppt", async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { allowed } = checkPermission(user, "ppt_export");
      if (!allowed) {
        res.status(403).json({ error: "PPT导出需要Pro版本", upgrade: true });
        return;
      }

      res.json({
        message: "PPT export initiated",
        format: "16:9",
        theme: "dark",
        watermark: false,
      });
    } catch (error) {
      res.status(500).json({ error: "Export failed" });
    }
  });

  // Generate Word (server-side)
  app.post("/api/export/:reportId/word", async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { allowed: noWatermark } = checkPermission(user, "no_watermark");

      res.json({
        message: "Word export initiated",
        watermark: !noWatermark,
      });
    } catch (error) {
      res.status(500).json({ error: "Export failed" });
    }
  });

  // Batch analysis endpoint (Pro+ only)
  app.post("/api/export/batch", async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { allowed } = checkPermission(user, "batch_analysis");
      if (!allowed) {
        res.status(403).json({ error: "批量分析需要Pro版本", upgrade: true });
        return;
      }

      res.json({ message: "Batch analysis authorized", tier: user.tier });
    } catch (error) {
      res.status(500).json({ error: "Batch failed" });
    }
  });

  /**
   * POST /api/export/batch-download - 批量导出报告为CSV
   * Body: { reportIds: string[] }
   * 返回CSV文件流
   */
  app.post("/api/export/batch-download", async (req: Request, res: Response) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { reportIds } = req.body as { reportIds: string[] };
      if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
        res.status(400).json({ error: "请提供要导出的报告ID列表" });
        return;
      }

      if (reportIds.length > 100) {
        res.status(400).json({ error: "单次最多导出100份报告" });
        return;
      }

      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "DB unavailable" });
        return;
      }

      // Fetch all requested reports that belong to this user (or admin can see all)
      const allReports = await db.select()
        .from(reports)
        .where(inArray(reports.reportId, reportIds));

      // Filter by access: user can only export their own reports (admin can export all)
      const accessibleReports = user.role === "admin"
        ? allReports
        : allReports.filter(r => r.userId === user.id);

      if (accessibleReports.length === 0) {
        res.status(404).json({ error: "未找到可导出的报告" });
        return;
      }

      // Build CSV content
      const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
      const headers = [
        "报告ID", "岗位名称", "公司", "行业", "状态", "AI替代率(%)",
        "高风险任务数", "中风险任务数", "低风险任务数",
        "推荐AI工具", "培训周期(月)", "年化节省(万元)",
        "创建时间", "完成时间"
      ];

      const rows = accessibleReports.map(report => {
        let aiRate = 0;
        let highRisk = 0, medRisk = 0, lowRisk = 0;
        let tools = "";
        let trainingMonths = "";
        let annualSaving = "";

        try {
          const data = typeof report.reportData === "string" ? JSON.parse(report.reportData as string) : report.reportData;
          if (data) {
            // Extract AI readiness rate
            if (Array.isArray(data)) {
              const step2 = data[1]?.data;
              if (step2?.overallAiReadiness) aiRate = step2.overallAiReadiness;
              else if (step2?.dimensions) {
                const scores = step2.dimensions.map((d: any) => d.aiImpactScore || 0);
                const avg = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
                aiRate = avg <= 1 ? Math.round(avg * 100) : avg <= 10 ? Math.round(avg * 10) : Math.round(avg);
              }
              // Task classification from step 3
              const step3 = data[2]?.data;
              if (step3?.taskClassification) {
                const tc = step3.taskClassification;
                highRisk = Array.isArray(tc.fullyReplaceable) ? tc.fullyReplaceable.length : 0;
                medRisk = Array.isArray(tc.partiallyReplaceable) ? tc.partiallyReplaceable.length : 0;
                lowRisk = Array.isArray(tc.humanEssential) ? tc.humanEssential.length : 0;
              }
              // AI tools from step 4
              const step4 = data[3]?.data;
              if (step4?.tools) {
                tools = step4.tools.slice(0, 3).map((t: any) => t.name || t.toolName || "").filter(Boolean).join("; ");
              }
              // Training from step 6
              const step6 = data[5]?.data;
              if (step6?.timeline) trainingMonths = String(step6.timeline.totalMonths || "");
              // ROI from step 8
              const step8 = data[7]?.data;
              if (step8?.annualSaving) annualSaving = String(step8.annualSaving || "");
            } else {
              // Object format
              const fp = data?.step2 || data?.firstPrinciples;
              if (fp?.overallAiReadiness) aiRate = fp.overallAiReadiness;
              const tc = data?.step3?.taskClassification;
              if (tc) {
                highRisk = Array.isArray(tc.fullyReplaceable) ? tc.fullyReplaceable.length : 0;
                medRisk = Array.isArray(tc.partiallyReplaceable) ? tc.partiallyReplaceable.length : 0;
                lowRisk = Array.isArray(tc.humanEssential) ? tc.humanEssential.length : 0;
              }
              if (data?.step4?.tools) {
                tools = data.step4.tools.slice(0, 3).map((t: any) => t.name || t.toolName || "").filter(Boolean).join("; ");
              }
              if (data?.step6?.timeline) trainingMonths = String(data.step6.timeline.totalMonths || "");
              if (data?.step8?.annualSaving) annualSaving = String(data.step8.annualSaving || "");
            }
          }
        } catch {}

        const statusMap: Record<string, string> = { pending: "待确认", analyzing: "分析中", completed: "已完成", error: "异常" };

        return [
          report.reportId,
          report.jobTitle || "",
          report.company || "",
          report.industry || "",
          statusMap[report.status] || report.status,
          String(aiRate),
          String(highRisk),
          String(medRisk),
          String(lowRisk),
          tools,
          trainingMonths,
          annualSaving,
          report.createdAt ? new Date(report.createdAt).toLocaleString("zh-CN") : "",
          report.completedAt ? new Date(report.completedAt).toLocaleString("zh-CN") : "",
        ];
      });

      // Escape CSV fields
      const escapeCSV = (field: string) => {
        if (field.includes(",") || field.includes('"') || field.includes("\n")) {
          return '"' + field.replace(/"/g, '""') + '"';
        }
        return field;
      };

      const csvContent = BOM + headers.map(escapeCSV).join(",") + "\n" +
        rows.map(row => row.map(escapeCSV).join(",")).join("\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="batch-export-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Batch download error:", error);
      res.status(500).json({ error: "批量导出失败" });
    }
  });
}
