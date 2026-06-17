import { useParams, useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { springPresets } from "@/hooks/useSpring";
import {
  Brain,
  CheckCircle2,
  Sparkles,
  FileSearch,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";

interface ExtractedInfo {
  jobTitle: string;
  company: string;
  industry: string;
  department: string;
  responsibilities: string;
  // ===== 新增字段（均为可选） =====
  teamSize?: string;
  currentTools?: string;
  painPoints?: string;
  budget?: string;
  salaryRange?: string;
}

interface ReportInfo {
  reportId: string;
  filename: string | null;
  status: string;
  extractedInfo: any;
  jobTitle: string;
  company: string;
  industry: string;
}

export default function ConfirmPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  // Multi-report navigation state
  const [reportIds, setReportIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [info, setInfo] = useState<ExtractedInfo>({
    jobTitle: "",
    company: "",
    industry: "",
    department: "",
    responsibilities: "",
    teamSize: "",
    currentTools: "",
    painPoints: "",
    budget: "",
    salaryRange: "",
  });
  const [filename, setFilename] = useState<string | null>(null);
  const [reportStatus, setReportStatus] = useState<string>("");

  // Initialize reportIds from URL params or single ID
  useEffect(() => {
    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam.split(",").filter(Boolean);
      setReportIds(ids);
      // Find current index based on params.id
      const idx = ids.indexOf(params.id!);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } else {
      setReportIds([params.id!]);
      setCurrentIndex(0);
    }
  }, []);

  const currentReportId = reportIds[currentIndex] || params.id;

  const fetchReportInfo = useCallback(async (reportId: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/analysis/${reportId}/info`);
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("报告不存在");
          // Remove this report from the list
          if (reportIds.length > 1) {
            const newIds = reportIds.filter(id => id !== reportId);
            setReportIds(newIds);
            setCurrentIndex(Math.min(currentIndex, newIds.length - 1));
          } else {
            setLocation("/history");
          }
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setReportStatus(data.status);
      setFilename(data.filename || null);

      // If report is already analyzing or completed, redirect
      if (data.status === "analyzing") {
        setLocation(`/analysis/${reportId}`);
        return;
      }
      if (data.status === "completed") {
        setLocation(`/report/${reportId}`);
        return;
      }

      // Populate form with extracted info
      const extracted = data.extractedInfo || {};
      setInfo({
        jobTitle: extracted.jobTitle || data.jobTitle || "",
        company: extracted.company || data.company || "",
        industry: extracted.industry || data.industry || "",
        department: extracted.department || "",
        responsibilities: extracted.responsibilities || "",
        teamSize: extracted.teamSize || "",
        currentTools: extracted.currentTools || "",
        painPoints: extracted.painPoints || "",
        budget: extracted.budget || "",
        salaryRange: extracted.salaryRange || "",
      });
      // If any extra field has value, auto-expand the section
      if (extracted.teamSize || extracted.currentTools || extracted.painPoints || extracted.budget || extracted.salaryRange) {
        setShowExtra(true);
      }
    } catch (err) {
      console.error("Fetch report info error:", err);
      toast.error("获取报告信息失败");
    } finally {
      setLoading(false);
    }
  }, [reportIds, currentIndex, setLocation]);

  useEffect(() => {
    if (currentReportId) {
      fetchReportInfo(currentReportId);
    }
  }, [currentReportId]);

  const handleConfirm = async () => {
    if (!info.jobTitle.trim()) {
      toast.error("请填写岗位名称", { description: "岗位名称为必填项" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/analysis/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId: currentReportId,
          jobTitle: info.jobTitle.trim(),
          company: info.company.trim(),
          industry: info.industry.trim(),
          department: info.department.trim(),
          responsibilities: info.responsibilities.trim(),
          // 新增可选字段（空字符串不传）
          ...(info.teamSize?.trim() && { teamSize: info.teamSize.trim() }),
          ...(info.currentTools?.trim() && { currentTools: info.currentTools.trim() }),
          ...(info.painPoints?.trim() && { painPoints: info.painPoints.trim() }),
          ...(info.budget?.trim() && { budget: info.budget.trim() }),
          ...(info.salaryRange?.trim() && { salaryRange: info.salaryRange.trim() }),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "确认失败");
      }

      const data = await res.json();

      // If there are more reports to confirm, go to next
      if (reportIds.length > 1 && currentIndex < reportIds.length - 1) {
        toast.success(`已提交分析：${info.jobTitle}`, { description: "正在加载下一个文件..." });
        setCurrentIndex(currentIndex + 1);
        setSubmitting(false);
      } else {
        // Last or only report - go to analysis page
        setLocation(`/analysis/${data.reportId}`);
      }
    } catch (err: any) {
      console.error("Confirm error:", err);
      toast.error("确认失败", { description: err.message || "请稍后重试" });
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentReportId) return;
    try {
      const res = await apiFetch(`/api/analysis/${currentReportId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("删除失败");

      toast.success("已删除");

      if (reportIds.length > 1) {
        const newIds = reportIds.filter(id => id !== currentReportId);
        setReportIds(newIds);
        setCurrentIndex(Math.min(currentIndex, newIds.length - 1));
      } else {
        setLocation("/");
      }
    } catch (err: any) {
      toast.error("删除失败", { description: err.message });
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
    if (currentIndex < reportIds.length - 1) setCurrentIndex(currentIndex + 1);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">正在解析文档内容...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8 pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springPresets.gentle}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={springPresets.bouncy}
            className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <FileSearch className="w-7 h-7 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            AI 提取结果确认
          </h1>
          <p className="text-muted-foreground">
            AI 已从您上传的文档中提取以下信息，请确认或修改后开始分析
          </p>
        </motion.div>

        {/* Multi-file navigation bar */}
        {reportIds.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springPresets.gentle, delay: 0.05 }}
            className="flex items-center justify-between mb-4 p-3 rounded-xl bg-card border border-border"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              上一条
            </Button>
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground font-medium">
                第 {currentIndex + 1} 个 / 共 {reportIds.length} 个
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              disabled={currentIndex >= reportIds.length - 1}
              className="gap-1"
            >
              下一条
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Form */}
        <motion.div
          key={currentReportId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPresets.gentle, delay: 0.1 }}
          className="glass-card space-y-5"
        >
          {/* File name display */}
          {filename && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground font-medium truncate" title={filename}>
                {filename}
              </span>
            </div>
          )}

          {/* AI extraction notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Brain className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>以下信息由 AI 从文档中自动提取，可能不完全准确。</p>
              <p className="mt-1">请核实并修改，确认无误后点击"开始分析"。</p>
            </div>
          </div>

          {/* Job Title - Required */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              岗位名称
              <span className="text-red-400 text-xs">*必填</span>
            </label>
            <input
              type="text"
              value={info.jobTitle}
              onChange={(e) => setInfo({ ...info, jobTitle: e.target.value })}
              placeholder="请输入岗位名称，如：产品经理、数据分析师"
              className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              公司名称
              <span className="text-muted-foreground text-xs ml-2">选填</span>
            </label>
            <input
              type="text"
              value={info.company}
              onChange={(e) => setInfo({ ...info, company: e.target.value })}
              placeholder="如：阿里巴巴、字节跳动（可留空）"
              className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Industry */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              所属行业
              <span className="text-muted-foreground text-xs ml-2">选填，留空将由AI推断</span>
            </label>
            <input
              type="text"
              value={info.industry}
              onChange={(e) => setInfo({ ...info, industry: e.target.value })}
              placeholder="如：互联网、金融、制造业"
              className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              所属部门
              <span className="text-muted-foreground text-xs ml-2">选填</span>
            </label>
            <input
              type="text"
              value={info.department}
              onChange={(e) => setInfo({ ...info, department: e.target.value })}
              placeholder="如：人力资源部、技术部、市场部"
              className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          {/* Responsibilities */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              核心职责描述
              <span className="text-muted-foreground text-xs ml-2">选填，提供更多信息可获得更精准的分析</span>
            </label>
            <textarea
              value={info.responsibilities}
              onChange={(e) => setInfo({ ...info, responsibilities: e.target.value })}
              placeholder="该岗位的主要工作职责和内容描述..."
              rows={5}
              className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-y min-h-[100px] max-h-[300px]"
            />
          </div>

          {/* Expandable extra fields section */}
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setShowExtra(!showExtra)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors w-full"
            >
              {showExtra ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              补充信息（选填，填写后报告更精准）
            </button>

            <AnimatePresence>
              {showExtra && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-4 pt-4">
                    {/* Team Size */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        团队规模
                        <span className="text-muted-foreground text-xs ml-2">选填</span>
                      </label>
                      <input
                        type="text"
                        value={info.teamSize || ""}
                        onChange={(e) => setInfo({ ...info, teamSize: e.target.value })}
                        placeholder="如：部门18人，其中该岗位12人"
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    {/* Current Tools */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        当前使用的工具/系统
                        <span className="text-muted-foreground text-xs ml-2">选填</span>
                      </label>
                      <input
                        type="text"
                        value={info.currentTools || ""}
                        onChange={(e) => setInfo({ ...info, currentTools: e.target.value })}
                        placeholder="如：企业微信、飞书、用友ERP、Excel（多个用顿号分隔）"
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    {/* Pain Points */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        当前工作痛点
                        <span className="text-muted-foreground text-xs ml-2">选填</span>
                      </label>
                      <input
                        type="text"
                        value={info.painPoints || ""}
                        onChange={(e) => setInfo({ ...info, painPoints: e.target.value })}
                        placeholder="如：重复性工作多、响应速度慢、人工错误率高"
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    {/* Salary Range */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        岗位薪资范围
                        <span className="text-muted-foreground text-xs ml-2">选填，用于ROI测算</span>
                      </label>
                      <input
                        type="text"
                        value={info.salaryRange || ""}
                        onChange={(e) => setInfo({ ...info, salaryRange: e.target.value })}
                        placeholder="如：6-8K/月、年薪15-20万"
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>

                    {/* Budget */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        AI转型预算
                        <span className="text-muted-foreground text-xs ml-2">选填，用于ROI测算</span>
                      </label>
                      <input
                        type="text"
                        value={info.budget || ""}
                        onChange={(e) => setInfo({ ...info, budget: e.target.value })}
                        placeholder="如：年预算20-30万、暂未确定"
                        className="w-full px-4 py-2.5 bg-input border border-border rounded-xl text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/history")}
                className="gap-2"
              >
                稍后确认
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-muted-foreground hover:text-destructive"
                title="删除此条"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={handleConfirm}
              disabled={submitting || !info.jobTitle.trim()}
              className="gap-2 min-w-[140px]"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {submitting
                ? "提交中..."
                : reportIds.length > 1 && currentIndex < reportIds.length - 1
                ? "确认并继续下一个"
                : "确认并开始分析"}
            </Button>
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 flex items-start gap-2 text-xs text-muted-foreground"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            提示：岗位名称为必填项，其他信息可留空。提供越完整的信息，AI 分析结果将越精准。
            您也可以点击"稍后确认"返回历史记录，之后随时继续操作。
          </p>
        </motion.div>
      </div>
    </div>
  );
}
