import { motion, AnimatePresence } from "framer-motion";
import { springPresets } from "@/hooks/useSpring";
import { Button } from "@/components/ui/button";
import { Download, FileText, Presentation, File, X, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { exportToPDF, exportToWord, exportToPPT } from "@/lib/exportUtils";
import type { ExportFormat } from "@/lib/exportUtils";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  reportData: any;
  reportElement?: HTMLElement | null;
  jobTitle: string;
  userTier: string;
}

export default function ExportDialog({
  open,
  onClose,
  reportData,
  reportElement,
  jobTitle,
  userTier,
}: ExportDialogProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const isPro = userTier === "pro" || userTier === "enterprise";

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    const filename = `${jobTitle || "岗位职能AI转型分析报告"}_${new Date().toLocaleDateString("zh-CN")}`;

    try {
      switch (format) {
        case "pdf":
          if (reportElement) {
            await exportToPDF(reportElement, filename, { watermark: !isPro, title: jobTitle });
          }
          break;
        case "word":
          await exportToWord(reportData, filename, { watermark: !isPro });
          break;
        case "ppt":
          if (!isPro) {
            toast.warning("需要Pro版本", { description: "升级Pro解锁PPT导出功能" });
            break;
          }
          await exportToPPT(reportData, filename);
          toast.success("PPT导出成功", { description: "16:9深色模板已下载" });
          break;
      }
      toast.success("导出成功", { description: `${format.toUpperCase()} 文件已下载` });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("导出失败", { description: "请稍后重试" });
    } finally {
      setExporting(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={springPresets.snappy}
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">导出报告</h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* PDF */}
              <ExportOption
                icon={FileText}
                title="PDF 文档"
                description={isPro ? "高清无水印导出" : "含品牌水印（升级Pro去除）"}
                onClick={() => handleExport("pdf")}
                loading={exporting === "pdf"}
                locked={false}
              />

              {/* PPT */}
              <ExportOption
                icon={Presentation}
                title="PPT 演示文稿"
                description="16:9 深色科技风模板"
                onClick={() => handleExport("ppt")}
                loading={exporting === "ppt"}
                locked={!isPro}
              />

              {/* Word */}
              <ExportOption
                icon={File}
                title="Word 文档"
                description="结构化排版，适合编辑"
                onClick={() => handleExport("word")}
                loading={exporting === "word"}
                locked={false}
              />
            </div>

            {!isPro && (
              <div className="mt-4 p-3 bg-warning/5 border border-warning/20 rounded-xl">
                <p className="text-xs text-warning">
                  免费版导出含品牌水印。升级 Pro 解锁无水印导出和PPT模板。
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ExportOption({
  icon: Icon,
  title,
  description,
  onClick,
  loading,
  locked,
}: {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
  loading: boolean;
  locked: boolean;
}) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      disabled={loading || locked}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
        ${locked
          ? "border-border bg-muted/30 opacity-60 cursor-not-allowed"
          : "border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
        }`}
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 text-left">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {loading ? (
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      ) : locked ? (
        <Lock className="w-4 h-4 text-muted-foreground" />
      ) : null}
    </button>
  );
}
