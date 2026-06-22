import { motion, AnimatePresence } from "framer-motion";
import { springPresets, staggerContainer, staggerItem } from "@/hooks/useSpring";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Upload, FileArchive, Loader2, CheckCircle2,
  AlertCircle, BarChart3, Building2, Users,
  Plus, X, Play, Eye, PieChart, Download, Info,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { apiFetch } from "@/lib/apiFetch";
import * as XLSX from "xlsx";
import JSZip from "jszip";

interface BatchJob {
  id: string;
  jobTitle: string;
  department?: string;
  status: "pending" | "analyzing" | "completed" | "error";
  reportId?: string;
  progress?: number;
  errorMsg?: string;
}

interface ManualEntry {
  id: string;
  jobTitle: string;
  department: string;
  description: string;
}

// LocalStorage persistence key
const BATCH_STORAGE_KEY = "batch_analysis_state";

interface BatchState {
  jobs: BatchJob[];
  departmentName: string;
  manualEntries: ManualEntry[];
  isProcessing: boolean;
  updatedAt: number;
}

function saveBatchState(state: BatchState) {
  try {
    localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore quota errors */ }
}

function loadBatchState(): BatchState | null {
  try {
    const raw = localStorage.getItem(BATCH_STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as BatchState;
    // Expire after 24 hours
    if (Date.now() - state.updatedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(BATCH_STORAGE_KEY);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function clearBatchState() {
  localStorage.removeItem(BATCH_STORAGE_KEY);
}

export default function BatchPage() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [isDragging, setIsDragging] = useState(false);

  // Load persisted state on mount
  const savedState = useRef(loadBatchState());
  const [jobs, setJobs] = useState<BatchJob[]>(savedState.current?.jobs || []);
  const [isProcessing, setIsProcessing] = useState(false);
  const [departmentName, setDepartmentName] = useState(savedState.current?.departmentName || "");
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>(savedState.current?.manualEntries || []);
  const [showManualForm, setShowManualForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ jobTitle: "", department: "", description: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 查询今日分析配额
  const [quota, setQuota] = useState<{ limit: number; used: number; remaining: number; unlimited: boolean } | null>(null);

  const fetchQuota = useCallback(async () => {
    try {
      const res = await apiFetch("/api/analysis/quota");
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  // Persist state whenever jobs/departmentName/manualEntries change
  useEffect(() => {
    saveBatchState({
      jobs,
      departmentName,
      manualEntries,
      isProcessing,
      updatedAt: Date.now(),
    });
  }, [jobs, departmentName, manualEntries, isProcessing]);

  // On mount: resume polling for any "analyzing" jobs that have reportId
  useEffect(() => {
    const analyzingJobs = jobs.filter(j => j.status === "analyzing" && j.reportId);
    if (analyzingJobs.length === 0) return;

    let cancelled = false;
    const resumePolling = async () => {
      for (const job of analyzingJobs) {
        if (cancelled) break;
        // 立即检查一次状态（不等待）
        let completed = false;
        let attempts = 0;
        while (!completed && attempts < 120 && !cancelled) {
          if (attempts > 0) {
            await new Promise(r => setTimeout(r, 3000));
          }
          attempts++;
          setJobs(prev => prev.map(j =>
            j.id === job.id ? { ...j, progress: Math.min(95, (attempts / 120) * 100) } : j
          ));
          try {
            const statusRes = await apiFetch(`/api/analysis/${job.reportId}/status`);
            if (!statusRes.ok) {
              // API报错，等待重试
              await new Promise(r => setTimeout(r, 3000));
              continue;
            }
            const reportData = await statusRes.json();
            if (reportData?.status === "completed") {
              completed = true;
              setJobs(prev => prev.map(j =>
                j.id === job.id ? { ...j, status: "completed", progress: 100 } : j
              ));
            } else if (reportData?.status === "error") {
              setJobs(prev => prev.map(j =>
                j.id === job.id ? { ...j, status: "error", errorMsg: "分析失败" } : j
              ));
              break;
            }
          } catch { /* continue polling */ }
        }
        if (!completed && !cancelled) {
          // 超时后再最后检查一次
          try {
            const finalRes = await apiFetch(`/api/analysis/${job.reportId}/status`);
            const reportData = await finalRes.json();
            if (reportData?.status === "completed") {
              setJobs(prev => prev.map(j =>
                j.id === job.id ? { ...j, status: "completed", progress: 100 } : j
              ));
            } else {
              setJobs(prev => prev.map(j =>
                j.id === job.id && j.status === "analyzing" ? { ...j, status: "error", errorMsg: "轮询超时" } : j
              ));
            }
          } catch {
            setJobs(prev => prev.map(j =>
              j.id === job.id && j.status === "analyzing" ? { ...j, status: "error", errorMsg: "轮询超时" } : j
            ));
          }
        }
      }
    };

    resumePolling();
    return () => { cancelled = true; };
  }, []); // Only run on mount

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">登录使用部门批量分析</h2>
          <p className="text-sm text-muted-foreground mb-4">批量分析部门内多个岗位/职能，生成全景报告</p>
          <Button onClick={() => window.location.href = getLoginUrl()}>登录</Button>
        </div>
      </div>
    );
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // [修复] 递归读取拖入的文件夹：浏览器默认不会展开文件夹内的文件，
  // 需通过 webkitGetAsEntry 递归遍历目录。返回所有叶子文件。
  const readEntryRecursively = (entry: any): Promise<File[]> => {
    return new Promise((resolve) => {
      if (!entry) return resolve([]);
      if (entry.isFile) {
        entry.file((file: File) => resolve([file]), () => resolve([]));
      } else if (entry.isDirectory) {
        const reader = entry.createReader();
        const all: File[] = [];
        const readBatch = () => {
          reader.readEntries(async (entries: any[]) => {
            if (!entries.length) return resolve(all);
            // 跳过 macOS 资源叉和隐藏文件
            const visible = entries.filter((en) => !en.name.startsWith(".") && en.name !== "__MACOSX");
            const results = await Promise.all(visible.map((en) => readEntryRecursively(en)));
            results.forEach((r) => all.push(...r));
            readBatch(); // readEntries 可能分批返回，需循环读完
          }, () => resolve(all));
        };
        readBatch();
      } else {
        resolve([]);
      }
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const items = e.dataTransfer.items;
    // 优先走目录递归路径（支持拖文件夹）
    if (items && items.length > 0 && typeof (items[0] as any).webkitGetAsEntry === "function") {
      const entries = Array.from(items)
        .map((it) => (it as any).webkitGetAsEntry?.())
        .filter(Boolean);
      const hasDir = entries.some((en: any) => en && en.isDirectory);
      if (hasDir) {
        (async () => {
          const fileArrays = await Promise.all(entries.map((en: any) => readEntryRecursively(en)));
          const allFiles = fileArrays.flat();
          if (allFiles.length === 0) {
            toast.warning("文件夹中未找到文件", { description: "请确认文件夹内含 .txt .doc .docx .pdf 等文件" });
            return;
          }
          processFiles(allFiles);
        })();
        return;
      }
    }
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const uploadedFilesRef = useRef<Map<string, File>>(new Map());

  const parseCSV = async (file: File): Promise<{ jobTitle: string; department: string; description: string }[]> => {
    const text = (await file.text()).replace(/^\uFEFF/, ""); // Remove BOM
    // RFC 4180 标准 CSV 解析：正确处理引号内的换行符、逗号和双引号转义
    const parseCSVRows = (input: string): string[][] => {
      const rows: string[][] = [];
      let row: string[] = [];
      let field = "";
      let inQuotes = false;
      for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (inQuotes) {
          if (ch === '"') {
            // 双引号转义: "" -> "
            if (i + 1 < input.length && input[i + 1] === '"') {
              field += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else {
            field += ch;
          }
        } else {
          if (ch === '"') {
            inQuotes = true;
          } else if (ch === ',') {
            row.push(field);
            field = "";
          } else if (ch === '\r') {
            // \r\n or \r alone -> row end
            row.push(field);
            field = "";
            rows.push(row);
            row = [];
            if (i + 1 < input.length && input[i + 1] === '\n') i++;
          } else if (ch === '\n') {
            row.push(field);
            field = "";
            rows.push(row);
            row = [];
          } else {
            field += ch;
          }
        }
      }
      // 最后一行（文件末尾可能没有换行符）
      if (field || row.length > 0) {
        row.push(field);
        rows.push(row);
      }
      return rows.filter(r => r.some(c => c.trim()));
    };
    const allRows = parseCSVRows(text);
    if (allRows.length < 2) return [];
    const headers = allRows[0].map(h => h.trim());
    const titleIdx = headers.findIndex(h => h.includes("岗位") || h.includes("名称") || h.toLowerCase() === "job_title");
    const deptIdx = headers.findIndex(h => h.includes("部门") || h.toLowerCase() === "department");
    const descIdx = headers.findIndex(h => h.includes("职责") || h.includes("描述") || h.toLowerCase() === "description");
    if (titleIdx === -1) {
      toast.error("CSV格式错误", { description: "未找到\"\u5c97\u4f4d\u540d\u79f0\"列，请下载模板参考格式" });
      return [];
    }
    const results: { jobTitle: string; department: string; description: string }[] = [];
    for (let i = 1; i < allRows.length; i++) {
      const cols = allRows[i];
      const jobTitle = cols[titleIdx]?.trim();
      if (!jobTitle) continue;
      results.push({
        jobTitle,
        department: (deptIdx >= 0 ? cols[deptIdx]?.trim() : "") || "",
        description: (descIdx >= 0 ? cols[descIdx]?.trim() : "") || "",
      });
    }
    return results;
  };

  const parseExcel = async (file: File): Promise<{ jobTitle: string; department: string; description: string }[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const sheet = workbook.Sheets[sheetName];
    const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (rows.length < 2) return [];
    const headers = rows[0].map((h: any) => String(h).trim());
    const titleIdx = headers.findIndex(h => h.includes("岗位") || h.includes("名称") || h.toLowerCase() === "job_title");
    const deptIdx = headers.findIndex(h => h.includes("部门") || h.toLowerCase() === "department");
    const descIdx = headers.findIndex(h => h.includes("职责") || h.includes("描述") || h.toLowerCase() === "description");
    if (titleIdx === -1) {
      toast.error("Excel格式错误", { description: '未找到"岗位名称"列，请确保第一行包含"岗位名称"表头' });
      return [];
    }
    const results: { jobTitle: string; department: string; description: string }[] = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].map((c: any) => String(c).trim());
      const jobTitle = cols[titleIdx];
      if (!jobTitle) continue;
      results.push({
        jobTitle,
        department: (deptIdx >= 0 ? cols[deptIdx] : "") || "",
        description: (descIdx >= 0 ? cols[descIdx] : "") || "",
      });
    }
    return results;
  };

  // [修复] 按内容魔数探测是否为 ZIP（PK\x03\x04 / PK\x05\x06 / PK\x07\x08），
  // 避免 zip 文件名缺少 .zip 扩展名（如 converted_files_bundle）时被误当成单文件处理。
  const isZipByMagic = async (file: File): Promise<boolean> => {
    try {
      const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
      return head[0] === 0x50 && head[1] === 0x4b &&
        (head[2] === 0x03 || head[2] === 0x05 || head[2] === 0x07);
    } catch {
      return false;
    }
  };

  // [修复] 抽出 ZIP 解包逻辑为独立函数，供按扩展名和按魔数两条路径复用。返回新增岗位数。
  const extractZipJobs = async (f: File): Promise<number> => {
    let added = 0;
    try {
      const zipData = await f.arrayBuffer();
      const zip = await JSZip.loadAsync(zipData);
      const supportedExts = ["txt", "doc", "docx", "pdf"];
      const subFiles: { name: string; file: File }[] = [];
      for (const [path, entry] of Object.entries(zip.files)) {
        if (entry.dir) continue;
        if (path.startsWith("__MACOSX/") || path.startsWith(".")) continue;
        const fileName = path.split("/").pop() || path;
        if (fileName.startsWith(".")) continue;
        const fileExt = fileName.toLowerCase().split(".").pop() || "";
        if (!supportedExts.includes(fileExt)) continue;
        const blob = await entry.async("blob");
        const mimeMap: Record<string, string> = {
          txt: "text/plain",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          pdf: "application/pdf",
        };
        const subFile = new File([blob], fileName, { type: mimeMap[fileExt] || "application/octet-stream" });
        subFiles.push({ name: fileName, file: subFile });
      }
      if (subFiles.length === 0) {
        toast.warning(`${f.name} 中未找到支持的文件`, { description: "支持 .txt .doc .docx .pdf 格式" });
        return 0;
      }
      for (const sub of subFiles) {
        const id = crypto.randomUUID().slice(0, 8);
        uploadedFilesRef.current.set(id, sub.file);
        const job: BatchJob = {
          id,
          jobTitle: sub.name.replace(/\.[^.]+$/, ""),
          department: departmentName || "未指定部门",
          status: "pending" as const,
        };
        setJobs(prev => [...prev, job]);
        added++;
      }
    } catch (zipErr) {
      console.error("ZIP extraction failed:", zipErr);
      toast.error(`${f.name} 解压失败`, { description: "请检查文件是否损坏" });
    }
    return added;
  };

  const processFiles = async (fileList: File[]) => {
    let addedCount = 0;
    for (const f of fileList) {
      const ext = f.name.toLowerCase();
      if (ext.endsWith(".csv") || ext.endsWith(".xlsx") || ext.endsWith(".xls")) {
        // Parse CSV/Excel and create multiple jobs
        const entries = ext.endsWith(".csv") ? await parseCSV(f) : await parseExcel(f);
        if (entries.length === 0) {
          toast.warning(`${f.name} 中未找到有效岗位数据`, { description: "请检查文件格式是否符合模板要求" });
          continue;
        }
        const parsedJobs: BatchJob[] = entries.map(entry => {
          const id = crypto.randomUUID().slice(0, 8);
          setManualEntries(prev => [...prev, { id, ...entry }]);
          return {
            id,
            jobTitle: entry.jobTitle,
            department: departmentName || entry.department || "未指定部门",
            status: "pending" as const,
          };
        });
        setJobs(prev => [...prev, ...parsedJobs]);
        addedCount += parsedJobs.length;
      } else if (ext.endsWith(".zip") || (await isZipByMagic(f))) {
        // ZIP file: extract sub-files in browser and add each as independent job
        // [修复] 同时兼容无 .zip 扩展名但内容为 ZIP 的文件（如 converted_files_bundle）。
        addedCount += await extractZipJobs(f);
      } else {
        // Non-tabular files (doc/pdf/txt): treat each file as one job
        const id = crypto.randomUUID().slice(0, 8);
        uploadedFilesRef.current.set(id, f);
        const job: BatchJob = {
          id,
          jobTitle: f.name.replace(/\.[^.]+$/, ""),
          department: departmentName || "未指定部门",
          status: "pending" as const,
        };
        setJobs(prev => [...prev, job]);
        addedCount++;
      }
    }
    if (addedCount > 0) {
      toast.success(`已添加 ${addedCount} 个岗位`, { description: "点击开始批量分析按钮启动处理" });
    }
  };

  const addManualEntry = () => {
    if (!newEntry.jobTitle.trim()) {
      toast.warning("请输入岗位名称");
      return;
    }
    const job: BatchJob = {
      id: crypto.randomUUID().slice(0, 8),
      jobTitle: newEntry.jobTitle,
      department: newEntry.department || departmentName || "未指定部门",
      status: "pending",
    };
    setJobs(prev => [...prev, job]);
    setManualEntries(prev => [...prev, { id: job.id, ...newEntry, department: newEntry.department || departmentName }]);
    setNewEntry({ jobTitle: "", department: "", description: "" });
    toast.success(`已添加岗位: ${job.jobTitle}`);
  };

  const removeJob = (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    setManualEntries(prev => prev.filter(e => e.id !== id));
  };

  const clearAllJobs = () => {
    setJobs([]);
    setManualEntries([]);
    clearBatchState();
    toast.success("已清空所有任务");
  };

  const startBatch = async () => {
    if (jobs.length === 0) {
      toast.warning("请先添加岗位");
      return;
    }
    setIsProcessing(true);

    // Process each job sequentially via the real analysis API
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      if (job.status === "completed") continue;

      // Check if this is a file-upload job whose File object was lost (e.g. page refresh)
      const isFileJob = !manualEntries.find(e => e.id === job.id);
      const hasFile = uploadedFilesRef.current.has(job.id);
      if (isFileJob && !hasFile) {
        // File lost after refresh - skip with error
        setJobs(prev => prev.map(j =>
          j.id === job.id ? { ...j, status: "error" as const, errorMsg: "文件已丢失（页面刷新后需重新上传）" } : j
        ));
        continue;
      }

      setJobs(prev => prev.map((j) =>
        j.id === job.id ? { ...j, status: "analyzing", progress: 0 } : j
      ));

      try {
        const entry = manualEntries.find(e => e.id === job.id);
        const text = entry
          ? `岗位名称：${entry.jobTitle}\n部门：${entry.department}\n职责描述：${entry.description}`
          : `岗位名称：${job.jobTitle}\n部门：${job.department || departmentName}`;

        const formData = new FormData();
        formData.append("text", text);
        // Attach uploaded file if exists
        const uploadedFile = uploadedFilesRef.current.get(job.id);
        if (uploadedFile) {
          formData.append("files", uploadedFile);
        }

        const res = await apiFetch("/api/analysis/submit", {
          method: "POST",
          body: formData,
        });

        if (res.status === 429) {
          const errData = await res.json();
          // 达到每日限额，停止后续任务
          setJobs(prev => prev.map(j => {
            if (j.id === job.id) return { ...j, status: "error" as const, errorMsg: errData.message };
            if (j.status === "pending") return { ...j, status: "error" as const, errorMsg: "已达今日分析上限" };
            return j;
          }));
          toast.error("今日分析次数已达上限", {
            description: errData.message || `每天最多分析${errData.limit || 10}次，请明日再试`,
            duration: 6000,
          });
          break; // 跳出循环，不再继续后续岗位
        }

        if (res.status === 422) {
          const errData = await res.json();
          if (errData.error === "quota_exceeded_select") {
            setJobs(prev => prev.map(j => {
              if (j.id === job.id) return { ...j, status: "error" as const, errorMsg: `ZIP文件包含${errData.totalFiles}个文件，超出剩余配额${errData.remaining}次` };
              if (j.status === "pending") return { ...j, status: "error" as const, errorMsg: "已达今日分析上限" };
              return j;
            }));
            toast.error("文件数量超出配额", {
              description: errData.message,
              duration: 6000,
            });
            break;
          }
        }
        if (!res.ok) throw new Error("Submit failed");
        const data = await res.json();

        if (data.needsConfirmation) {
          // Backend may return multiple reportIds (e.g. ZIP expanded into multiple files)
          const reportIds: string[] = data.reportIds || [data.reportId];
          const filenames: string[] = data.filenames || [];

          // If multiple reports from one upload (ZIP), expand into separate jobs
          if (reportIds.length > 1) {
            // Remove the original zip job and add individual sub-jobs
            const subJobs: BatchJob[] = [];
            for (let ri = 0; ri < reportIds.length; ri++) {
              const rid = reportIds[ri];
              const fname = filenames[ri] || `文件${ri + 1}`;
              const subId = crypto.randomUUID().slice(0, 8);
              subJobs.push({
                id: subId,
                jobTitle: fname.replace(/\.[^.]+$/, ""),
                department: departmentName || job.department || "未指定部门",
                status: "analyzing" as const,
                reportId: rid,
                progress: 0,
              });
            }
            // Replace original job with sub-jobs
            setJobs(prev => {
              const idx = prev.findIndex(j => j.id === job.id);
              const newJobs = [...prev];
              newJobs.splice(idx, 1, ...subJobs);
              return newJobs;
            });

            // Confirm and poll each sub-job
            for (const subJob of subJobs) {
              try {
                const infoRes = await apiFetch(`/api/analysis/${subJob.reportId}/info`);
                let confirmPayload: any = {
                  reportId: subJob.reportId,
                  jobTitle: subJob.jobTitle || "",
                  company: "",
                  industry: "",
                  department: subJob.department || "",
                  responsibilities: "",
                };
                if (infoRes.ok) {
                  const infoData = await infoRes.json();
                  const ext = infoData.extractedInfo || {};
                  confirmPayload = {
                    reportId: subJob.reportId,
                    jobTitle: ext.jobTitle || subJob.jobTitle || "",
                    company: ext.company || "",
                    industry: ext.industry || "",
                    department: ext.department || subJob.department || "",
                    responsibilities: ext.responsibilities || "",
                  };
                  // Update job title from extracted info
                  if (ext.jobTitle) {
                    setJobs(prev => prev.map(j =>
                      j.id === subJob.id ? { ...j, jobTitle: ext.jobTitle } : j
                    ));
                  }
                }
                const confirmRes = await apiFetch("/api/analysis/confirm", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(confirmPayload),
                });
                if (!confirmRes.ok) throw new Error("Confirm failed");

                // Poll for completion
                let completed = false;
                let attempts = 0;
                while (!completed && attempts < 120) {
                  await new Promise(r => setTimeout(r, 3000));
                  attempts++;
                  setJobs(prev => prev.map(j =>
                    j.id === subJob.id ? { ...j, progress: Math.min(95, (attempts / 120) * 100) } : j
                  ));
                  try {
                    const statusRes = await apiFetch(`/api/analysis/${subJob.reportId}/status`);
                    if (statusRes.ok) {
                      const reportData = await statusRes.json();
                      if (reportData?.status === "completed") completed = true;
                    }
                  } catch { /* continue polling */ }
                }
                setJobs(prev => prev.map(j =>
                  j.id === subJob.id ? { ...j, status: "completed", progress: 100 } : j
                ));
              } catch (subErr: any) {
                setJobs(prev => prev.map(j =>
                  j.id === subJob.id ? { ...j, status: "error", errorMsg: subErr.message } : j
                ));
              }
            }
            continue; // Skip the single-report logic below
          }

          // Single report: confirm as before
          const infoRes = await apiFetch(`/api/analysis/${data.reportId}/info`);
          let confirmPayload: any = {
            reportId: data.reportId,
            jobTitle: job.jobTitle || "",
            company: "",
            industry: "",
            department: job.department || departmentName || "",
            responsibilities: "",
          };
          if (infoRes.ok) {
            const infoData = await infoRes.json();
            const ext = infoData.extractedInfo || {};
            confirmPayload = {
              reportId: data.reportId,
              jobTitle: ext.jobTitle || job.jobTitle || "",
              company: ext.company || "",
              industry: ext.industry || "",
              department: ext.department || job.department || departmentName || "",
              responsibilities: ext.responsibilities || "",
            };
          }
          const confirmRes = await apiFetch("/api/analysis/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(confirmPayload),
          });
          if (!confirmRes.ok) throw new Error("Confirm failed");
          const confirmData = await confirmRes.json();
          data.reportId = confirmData.reportId || data.reportId;
        }

        if (data.reportId) {
          // Save reportId to job immediately so it persists
          setJobs(prev => prev.map(j =>
            j.id === job.id ? { ...j, reportId: data.reportId } : j
          ));

          // Wait for analysis to complete (poll status)
          let completed = false;
          let attempts = 0;
          while (!completed && attempts < 120) {
            await new Promise(r => setTimeout(r, 3000));
            attempts++;
            setJobs(prev => prev.map(j =>
              j.id === job.id ? { ...j, progress: Math.min(95, (attempts / 120) * 100) } : j
            ));

            try {
              const statusRes = await apiFetch(`/api/analysis/${data.reportId}/status`);
              if (statusRes.ok) {
                const reportData = await statusRes.json();
                if (reportData?.status === "completed") {
                  completed = true;
                }
              }
            } catch { /* continue polling */ }
          }

          setJobs(prev => prev.map(j =>
            j.id === job.id ? { ...j, status: "completed", reportId: data.reportId, progress: 100 } : j
          ));
        }
      } catch (err: any) {
        setJobs(prev => prev.map(j =>
          j.id === job.id ? { ...j, status: "error", errorMsg: err.message } : j
        ));
      }
    }

    setIsProcessing(false);
    // Use functional state access to get the latest jobs count (avoid stale closure)
    setJobs(prev => {
      const completedCount = prev.filter(j => j.status === "completed").length;
      toast.success("批量分析完成", { description: `${completedCount}/${prev.length} 个岗位分析已完成` });
      return prev; // no mutation
    });
  };

  const completedJobs = jobs.filter(j => j.status === "completed");
  const departments = Array.from(new Set(jobs.map(j => j.department).filter(Boolean)));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPresets.gentle}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">部门批量分析</h1>
            <p className="text-sm text-muted-foreground">批量分析部门内多个岗位/职能的AI转型潜力，生成全景对比报告</p>
          </div>
        </div>
      </motion.div>

      {/* Department Context */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springPresets.gentle, delay: 0.05 }}
        className="bg-card border border-border rounded-xl p-4 mb-6"
      >
        <label className="text-sm font-medium text-foreground mb-2 block">部门名称（可选，统一标注）</label>
        <input
          type="text"
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
          placeholder="如：人力资源部、市场部、技术部..."
          className="w-full px-3 py-2 bg-input border border-white/[0.06] rounded-lg text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
        />
      </motion.div>

      {/* Template Download & Format Guide */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springPresets.gentle, delay: 0.08 }}
        className="bg-card border border-border rounded-xl p-4 mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground">批量上传格式说明</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 shrink-0"
            onClick={() => {
              const BOM = "\uFEFF";
              const header = "岗位名称,所属部门,职责描述";
              const rows = [
                "人力资源经理,人力资源部,负责招聘规划、员工关系管理、绩效考核体系设计与实施、培训发展计划制定",
                "市场营销专员,市场部,负责品牌推广、社交媒体运营、活动策划执行、竞品分析与市场调研报告撰写",
                "财务分析师,财务部,负责月度财务报表编制、预算管理、成本分析、投资回报率评估与财务风险预警",
              ];
              const csv = BOM + [header, ...rows].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "批量分析模板.csv";
              a.click();
              URL.revokeObjectURL(url);
              toast.success("模板已下载", { description: "请按模板格式填写后上传CSV文件" });
            }}
          >
            <Download className="w-4 h-4" />
            下载CSV模板
          </Button>
        </div>
        <div className="bg-background/50 rounded-lg p-3 border border-white/[0.04]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <p className="font-medium text-foreground mb-1">支持的文件格式</p>
              <p className="text-muted-foreground">.csv .xlsx .xls .txt .doc .docx .pdf .zip</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">CSV/Excel模板字段</p>
              <p className="text-muted-foreground">岗位名称(必填)、所属部门、职责描述</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">注意事项</p>
              <p className="text-muted-foreground">职责描述越详细，分析结果越准确</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Input Methods */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springPresets.gentle, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
      >
        {/* File Upload */}
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-white/[0.06] hover:border-primary/30"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv,.xlsx,.xls,.txt,.doc,.docx,.pdf,.zip"
            className="hidden"
            onChange={handleFileSelect}
          />
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">文件批量上传</p>
          <p className="text-xs text-muted-foreground">
            拖拽或点击上传 .csv .xlsx .xls .txt .doc .docx .pdf .zip
          </p>
          <p className="text-xs text-primary/70 mt-1">推荐使用CSV或Excel模板格式</p>
        </div>

        {/* Manual Entry */}
        <div
          className="border-2 border-dashed border-white/[0.06] rounded-xl p-6 text-center hover:border-primary/30 transition-all duration-200 cursor-pointer"
          onClick={() => setShowManualForm(true)}
        >
          <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground mb-1">手动添加岗位</p>
          <p className="text-xs text-muted-foreground">
            逐个输入岗位名称和描述
          </p>
        </div>
      </motion.div>

      {/* Manual Entry Form */}
      <AnimatePresence>
        {showManualForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">添加岗位</h3>
                <button onClick={() => setShowManualForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newEntry.jobTitle}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, jobTitle: e.target.value }))}
                  placeholder="岗位名称 *"
                  className="px-3 py-2 bg-input border border-white/[0.06] rounded-lg text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  value={newEntry.department}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="所属部门（可选）"
                  className="px-3 py-2 bg-input border border-white/[0.06] rounded-lg text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <textarea
                value={newEntry.description}
                onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                placeholder="岗位职责描述（可选，越详细分析越准确）"
                className="w-full px-3 py-2 bg-input border border-white/[0.06] rounded-lg text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-y"
              />
              <Button onClick={addManualEntry} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />添加
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job List */}
      {jobs.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-2 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              待分析岗位 ({jobs.length})
            </h3>
            <div className="flex items-center gap-3">
              {departments.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  涉及 {departments.length} 个部门
                </span>
              )}
              {!isProcessing && (
                <button
                  onClick={clearAllJobs}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  清空列表
                </button>
              )}
            </div>
          </div>

          {jobs.map((job) => (
            <motion.div
              key={job.id}
              variants={staggerItem}
              className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl"
            >
              <div className="shrink-0">
                {job.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : job.status === "analyzing" ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : job.status === "error" ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <FileArchive className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{job.jobTitle}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {job.department && <span>{job.department}</span>}
                  <span>·</span>
                  <span>
                    {job.status === "completed" ? "已完成" :
                     job.status === "analyzing" ? `分析中 ${job.progress ? Math.round(job.progress) + "%" : "..."}` :
                     job.status === "error" ? (job.errorMsg || "失败") : "等待处理"}
                  </span>
                </div>
                {job.status === "analyzing" && job.progress !== undefined && (
                  <div className="h-1 mt-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: job.progress + "%" }} />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {job.status === "completed" && job.reportId && (
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/report/${job.reportId}`)} className="gap-1">
                    <Eye className="w-3.5 h-3.5" />查看
                  </Button>
                )}
                {job.status !== "analyzing" && !isProcessing && (
                  <button onClick={() => removeJob(job.id)} className="text-muted-foreground hover:text-destructive p-1" title="删除">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Action Bar */}
      {jobs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-card border border-border rounded-xl p-4"
        >
          <div className="text-sm text-muted-foreground flex items-center gap-3">
            <span>共 {jobs.length} 个岗位 · <span className="text-emerald-400">{completedJobs.length} 已完成</span></span>
            {jobs.some(j => j.status === "error") && (
              <span className="text-destructive">{jobs.filter(j => j.status === "error").length} 失败</span>
            )}
            {quota && !quota.unlimited && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                quota.remaining <= 0
                  ? "bg-red-500/10 text-red-400"
                  : quota.remaining <= 3
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-primary/10 text-primary"
              }`}>
                今日剩余 {quota.remaining}/{quota.limit} 次
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {completedJobs.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // Navigate to panorama report with completed report IDs
                  const ids = completedJobs.map(j => j.reportId).filter(Boolean).join(",");
                  navigate(`/department-report?ids=${ids}&dept=${encodeURIComponent(departmentName || "全部门")}`);
                }}
              >
                <PieChart className="w-4 h-4" />
                查看全景报告
              </Button>
            )}
            {jobs.every(j => j.status === "completed") ? (
              <Button
                onClick={clearAllJobs}
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                新建批次
              </Button>
            ) : (
              <Button
                onClick={startBatch}
                disabled={isProcessing || jobs.every(j => j.status === "completed") || (quota !== null && !quota.unlimited && quota.remaining <= 0)}
                className="gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {quota && !quota.unlimited && quota.remaining <= 0
                  ? "今日已达上限"
                  : isProcessing ? "分析中..." : jobs.some(j => j.status === "error") ? "重试失败项" : "开始批量分析"}
              </Button>
            )}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {jobs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-12"
        >
          <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground text-sm">
            通过上传文件或手动添加岗位开始批量分析
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            完成2个以上岗位分析后可生成部门全景报告
          </p>
        </motion.div>
      )}
    </div>
  );
}
