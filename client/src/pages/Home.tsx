import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { springPresets, staggerContainer, staggerItem } from "@/hooks/useSpring";
import {
  Brain,
  Upload,
  FileText,
  Sparkles,
  ArrowRight,
  X,
  AlertTriangle,
  CheckSquare,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

import { GuidedTour } from "@/components/GuidedTour";
import { apiFetch } from "@/lib/apiFetch";
import { isShareGuest } from "@/lib/shareGuest";

// [定制] 行业/公司已固定，热门案例只提供“岗位名称 + 岗位介绍”示例，不再注入公司类型/行业信息
const HOT_CASES = [
  {
    title: "雇主品牌经理",
    desc: "品牌与招聘",
    intro: "负责雇主品牌整体规划与建设，策划招聘宣传与雇主价值主张输出；统筹校园招聘与社会招聘的品牌触点，维护招聘官网、社交媒体与雇主评价平台；负责候选人体验优化与雇主品牌数据分析，提升企业雇主形象与人才吸引力。",
  },
  {
    title: "产品经理",
    desc: "产品规划",
    intro: "负责智能家居产品的全生命周期管理，从需求调研、产品规划、原型设计到上线迭代；协调研发、设计、营销等跨部门资源推进项目；通过用户调研与数据分析明确产品方向，制定产品路线图并负责核心指标的达成。",
  },
  {
    title: "电商运营专员",
    desc: "渠道运营",
    intro: "负责天猫、京东等主流电商平台的店铺日常运营与活动策划；负责商品上架、页面优化、促销活动执行与数据复盘；监控流量与转化率，优化投放策略与库存周转，提升店铺销售额与盈利能力。",
  },
  {
    title: "供应链管理",
    desc: "生产与物流",
    intro: "负责智能硬件产品的供应链计划与协调，包括需求预测、采购、生产排期与库存管理；优化供应商管理与物流配送效率；推动供应链数字化，降低运营成本，保障交付及时性与供应连续性。",
  },
  {
    title: "客户成功经理",
    desc: "售后与服务",
    intro: "负责重点客户的全生命周期维护与价值提升，推动客户产品使用与续约；负责客户培训、问题跟进与满意度管理；通过数据监控客户健康度，提前识别流失风险，提升复购率与客户口碑。",
  },
  {
    title: "数据分析师",
    desc: "数据与洞察",
    intro: "负责业务数据的采集、清洗、建模与可视化分析；搭建与维护数据看板和报表体系；通过数据挖掘为产品、运营、营销等业务提供决策支持；负责关键指标体系设计与业务效果跟踪，推动数据驱动的业务增长。",
  },
];

const ACCEPTED_TYPES = [
  "text/plain",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
];

const ACCEPTED_EXTENSIONS = [".txt", ".pdf", ".doc", ".docx", ".zip"];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 单文件上限 50MB

/**
 * 按类型/扩展名过滤，并对单文件大小做 50MB 校验。
 * 超过限制的文件不加入列表并统一 toast 提示。
 */
function filterAcceptedFiles(candidates: File[]): File[] {
  const typeOk = candidates.filter(
    (f) =>
      ACCEPTED_TYPES.includes(f.type) ||
      ACCEPTED_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext))
  );
  const oversized = typeOk.filter((f) => f.size > MAX_FILE_SIZE);
  if (oversized.length > 0) {
    toast.error("单个文件大小不能超过 50MB", {
      description: oversized.map((f) => f.name).join("、"),
    });
  }
  return typeOk.filter((f) => f.size <= MAX_FILE_SIZE);
}

interface UploadedFile {
  file: File;
  id: string;
}

interface FileSelectionItem {
  filename: string;
  size: number;
  mimetype: string;
}


export default function Home() {
  // [定制] 分享访客只读模式：禁止发起新分析
  const shareGuest = isShareGuest();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [inputText, setInputText] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCaseIndex, setSelectedCaseIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 查询今日分析配额
  const [quota, setQuota] = useState<{ limit: number; used: number; remaining: number; unlimited: boolean } | null>(null);

  // ZIP文件选择对话框状态
  const [showFileSelect, setShowFileSelect] = useState(false);
  const [selectableFiles, setSelectableFiles] = useState<FileSelectionItem[]>([]);
  const [selectedFileNames, setSelectedFileNames] = useState<Set<string>>(new Set());
  const [selectRemaining, setSelectRemaining] = useState(0);

  const fetchQuota = useCallback(async () => {
    try {
      const res = await apiFetch("/api/analysis/quota");
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = filterAcceptedFiles(Array.from(e.dataTransfer.files));
    setFiles((prev) => [
      ...prev,
      ...droppedFiles.map((file) => ({ file, id: crypto.randomUUID() })),
    ]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = filterAcceptedFiles(Array.from(e.target.files));
      setFiles((prev) => [
        ...prev,
        ...selected.map((file) => ({ file, id: crypto.randomUUID() })),
      ]);
      // 允许重复选择同名文件
      e.target.value = "";
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // 计算当前文件数量（非ZIP文件各算1个，ZIP暂时算1个，实际数量由服务端判断）
  const getNonZipFileCount = () => {
    return files.filter(f => !f.file.name.toLowerCase().endsWith(".zip")).length;
  };

  const handleSubmit = async (selectedFilesOverride?: string[]) => {
    // [定制] 分享访客只读模式下禁止发起新分析
    if (isShareGuest()) {
      toast.error("分享查看模式下不支持发起新分析");
      return;
    }
    if (!inputText.trim() && files.length === 0) return;

    // 前端预检查：非ZIP文件数量是否超过配额
    if (quota && !quota.unlimited && !selectedFilesOverride) {
      const nonZipCount = getNonZipFileCount();
      const hasZip = files.some(f => f.file.name.toLowerCase().endsWith(".zip"));
      // 如果只有非ZIP文件且超过配额，直接提示
      if (!hasZip && nonZipCount > quota.remaining) {
        toast.error(`文件数量超出今日剩余配额`, {
          description: `已选择 ${nonZipCount} 个文件，但今日仅剩余 ${quota.remaining} 次分析机会。请减少文件数量后重试。`,
          duration: 6000,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Upload files and submit analysis request
      const formData = new FormData();
      formData.append("text", inputText);
      files.forEach((f) => formData.append("files", f.file));

      // If we have a selectedFiles override (from ZIP selection dialog), append it
      if (selectedFilesOverride) {
        formData.append("selectedFiles", JSON.stringify(selectedFilesOverride));
      }

      const res = await apiFetch("/api/analysis/submit", {
        method: "POST",
        body: formData,
      });

      if (res.status === 429) {
        const errData = await res.json();
        setIsSubmitting(false);
        toast.error("今日分析次数已达上限", {
          description: errData.message || `每天最多分析${errData.limit || 10}次，请明日再试`,
          duration: 6000,
        });
        return;
      }

      if (res.status === 422) {
        // Quota exceeded with file selection needed
        const errData = await res.json();
        if (errData.error === "quota_exceeded_select") {
          setIsSubmitting(false);
          setSelectableFiles(errData.files || []);
          setSelectRemaining(errData.remaining || 0);
          setSelectedFileNames(new Set());
          setShowFileSelect(true);
          return;
        }
      }

      if (!res.ok) throw new Error("Submit failed");

      const data = await res.json();

      if (data.needsConfirmation) {
        // File upload mode: go to confirmation page
        const reportIds: string[] = data.reportIds || [data.reportId];
        if (reportIds.length > 1) {
          setLocation(`/confirm/${reportIds[0]}?ids=${reportIds.join(",")}`);
        } else {
          setLocation(`/confirm/${reportIds[0]}`);
        }
      } else {
        // Text-only mode: go directly to analysis page
        setLocation(`/analysis/${data.reportId}`);
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      toast.error("提交失败", { description: "请检查网络连接后重试" });
    }
  };

  const handleFileSelectionToggle = (filename: string) => {
    setSelectedFileNames(prev => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        // Only allow selecting up to remaining quota
        if (next.size < selectRemaining) {
          next.add(filename);
        } else {
          toast.warning(`最多只能选择 ${selectRemaining} 个文件`);
        }
      }
      return next;
    });
  };

  const handleFileSelectionConfirm = () => {
    if (selectedFileNames.size === 0) {
      toast.warning("请至少选择一个文件");
      return;
    }
    setShowFileSelect(false);
    // Re-submit with selected files
    handleSubmit(Array.from(selectedFileNames));
  };

  const handleCaseClick = (caseItem: typeof HOT_CASES[0], index: number) => {
    setSelectedCaseIndex(index);
    // [定制] 填入岗位名称与完整的示例岗位介绍，不再注入公司/行业（已固定）
    setInputText(`岗位名称：${caseItem.title}\n岗位介绍：${caseItem.intro}`);
    textareaRef.current?.focus();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springPresets.gentle}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={springPresets.bouncy}
            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-3xl md:text-4xl text-metallic mb-3">
            岗位/职能AI转型深度分析
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            输入岗位/职能信息，AI 将通过9步推理链为您生成专业的AI转型分析报告
          </p>
        </motion.div>

        {/* [定制] 行业、公司背景与简介均为系统内置默认值，提交分析时自动写入，
            不在首页展示，用户只需填写“岗位名称”与“岗位介绍（可选输入或上传）”。 */}

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPresets.gentle, delay: 0.1 }}
          data-tour="input-area"
          className={`relative glass-card transition-all duration-300 spring-layout ${
            isDragging
              ? "!border-primary glow-primary"
              : "hover:border-white/[0.1]"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-primary/5 rounded-2xl flex items-center justify-center z-10 border-2 border-dashed border-primary"
              >
                <div className="text-center">
                  <Upload className="w-10 h-10 text-primary mx-auto mb-2" />
                  <p className="text-primary font-medium">释放文件以上传</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请输入岗位名称与岗位介绍等信息&#10;&#10;示例：&#10;岗位名称：雇主品牌经理&#10;岗位介绍：负责雇主品牌建设、招聘宣传、候选人体验优化..."
            className="w-full min-h-[160px] max-h-[400px] bg-transparent text-foreground placeholder:text-muted-foreground resize-y outline-none text-base leading-relaxed"
            maxLength={5000}
          />

          {/* File Chips */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              {files.map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={springPresets.snappy}
                  className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground" title={f.file.name}>{f.file.name}</span>
                  <button onClick={() => removeFile(f.id)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Quota warning for non-ZIP files */}
          {quota && !quota.unlimited && files.length > 0 && getNonZipFileCount() > quota.remaining && !files.some(f => f.file.name.toLowerCase().endsWith(".zip")) && (
            <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
              <span className="text-xs text-yellow-400">
                已选择 {getNonZipFileCount()} 个文件，超出今日剩余配额（{quota.remaining} 次）。请减少文件数量后提交。
              </span>
            </div>
          )}

          {/* Bottom Bar */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.doc,.docx,.pdf,.zip"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                上传文件
              </Button>
              <span className="text-xs text-muted-foreground">
                支持 .txt .doc .docx .pdf .zip（单文件 ≤ 50MB）
              </span>
            </div>
            <div className="flex items-center gap-3">
              {quota && !quota.unlimited && (
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  quota.remaining <= 0
                    ? "bg-red-500/10 text-red-400"
                    : quota.remaining <= 3
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-primary/10 text-primary"
                }`}>
                  今日剩余 {quota.remaining}/{quota.limit} 次
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {inputText.length}/5000
              </span>
              <Button
                data-tour="submit-btn"
                onClick={() => handleSubmit()}
                disabled={shareGuest || isSubmitting || (!inputText.trim() && files.length === 0) || (quota !== null && !quota.unlimited && quota.remaining <= 0)}
                className="gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {shareGuest ? "仅可查看分享报告" : (quota && !quota.unlimited && quota.remaining <= 0 ? "今日已达上限" : "开始分析")}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Hot Cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPresets.gentle, delay: 0.2 }}
          className="mt-10"
        >
          <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            热门案例 · 点击快速体验
          </h2>
          <div data-tour="hot-cases">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
          >
            {HOT_CASES.map((item, i) => (
              <motion.button
                key={i}
                variants={staggerItem}
                onClick={() => handleCaseClick(item, i)}
                className={`text-left p-4 rounded-xl transition-all duration-200 spring-layout group ${
                  selectedCaseIndex === i
                    ? "bg-primary border border-primary text-white shadow-lg shadow-primary/20"
                    : "bg-card border border-border hover:border-primary/40 hover:bg-primary/15 active:bg-primary/20"
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className={`font-medium text-sm transition-colors ${
                  selectedCaseIndex === i ? "text-primary-foreground" : "text-foreground group-hover:text-primary"
                }`}>
                  {item.title}
                </h3>
                <p className={`text-xs mt-1 transition-colors ${
                  selectedCaseIndex === i ? "text-primary-foreground/80" : "text-muted-foreground group-hover:text-foreground"
                }`}>
                  {item.desc}
                </p>
              </motion.button>
            ))}
          </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Guided Tour */}
      <GuidedTour />

      {/* ZIP File Selection Dialog */}
      <Dialog open={showFileSelect} onOpenChange={setShowFileSelect}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              文件数量超出配额
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-sm text-muted-foreground mb-4">
              ZIP包含 <span className="text-foreground font-medium">{selectableFiles.length}</span> 个文件，
              但今日仅剩余 <span className="text-primary font-medium">{selectRemaining}</span> 次分析机会。
              请选择要分析的文件（最多 {selectRemaining} 个）：
            </p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {selectableFiles.map((file) => (
                <label
                  key={file.filename}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedFileNames.has(file.filename)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={selectedFileNames.has(file.filename)}
                    onCheckedChange={() => handleFileSelectionToggle(file.filename)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                已选择 <span className={selectedFileNames.size > 0 ? "text-primary font-medium" : ""}>{selectedFileNames.size}</span> / {selectRemaining} 个
              </span>
              {selectedFileNames.size === selectRemaining && (
                <span className="text-primary">已达选择上限</span>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowFileSelect(false)}>
              取消
            </Button>
            <Button
              onClick={handleFileSelectionConfirm}
              disabled={selectedFileNames.size === 0 || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckSquare className="w-4 h-4" />
              )}
              确认分析 ({selectedFileNames.size} 个)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
