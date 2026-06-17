import { motion } from "framer-motion";
import { springPresets, staggerContainer, staggerItem } from "@/hooks/useSpring";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { isIframeMode } from "@/lib/iframeContext";
import { useLocation } from "wouter";
import {
  FileText, Clock, Trash2, Share2, Eye,
  Search, BarChart3, Download, Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

export default function HistoryPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const utils = trpc.useUtils();
  const { data: reports, isLoading } = trpc.report.list.useQuery(
    undefined,
    { enabled: isAuthenticated || isIframeMode() }
  );

  const deleteMutation = trpc.report.delete.useMutation({
    onMutate: async ({ reportId }) => {
      // Optimistic update: immediately remove from list
      await utils.report.list.cancel();
      const prev = utils.report.list.getData();
      utils.report.list.setData(undefined, (old) =>
        old ? old.filter((r: any) => r.reportId !== reportId) : []
      );
      return { prev };
    },
    onSuccess: () => {
      toast.success("报告已删除");
    },
    onError: (err, _vars, context) => {
      // Rollback on error
      if (context?.prev) {
        utils.report.list.setData(undefined, context.prev);
      }
      toast.error("删除失败", { description: err.message });
    },
    onSettled: () => {
      utils.report.list.invalidate();
    },
  });

  const shareMutation = trpc.report.generateShareLink.useMutation();

  if (authLoading) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    if (isIframeMode()) {
      // iframe模式下不显示登录要求，显示空状态
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">暂无历史记录</h2>
            <p className="text-sm text-muted-foreground mb-4">开始分析后，历史记录将显示在这里</p>
            <Button onClick={() => navigate("/")}>开始分析</Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">登录查看历史记录</h2>
          <p className="text-sm text-muted-foreground mb-4">登录后可查看和管理所有分析报告</p>
          <Button onClick={() => window.location.href = getLoginUrl()}>登录</Button>
        </div>
      </div>
    );
  }

  const filteredReports = (reports || []).filter(r =>
    !searchTerm ||
    r.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShare = async (reportId: string) => {
    try {
      const { token } = await shareMutation.mutateAsync({ reportId });
      const url = `${window.location.origin}/share/${token}`;
      // 尝试复制到剪贴板（iframe环境可能无权限）
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
          copied = true;
        }
      } catch {
        // clipboard API 不可用，尝试 fallback
      }
      if (!copied) {
        try {
          const textarea = document.createElement("textarea");
          textarea.value = url;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          copied = document.execCommand("copy");
          document.body.removeChild(textarea);
        } catch {
          // fallback 也失败
        }
      }
      if (copied) {
        toast.success("分享链接已复制", { description: "可直接发送给同事或朋友" });
      } else {
        // 复制失败但分享链接已生成，显示链接让用户手动复制
        toast.success("分享链接已生成", { description: url, duration: 10000 });
      }
    } catch (e) {
      console.error("Share error:", e);
      toast.error("分享失败", { description: "请稍后重试" });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPresets.gentle}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-foreground mb-2">历史记录</h1>
        <p className="text-muted-foreground">查看和管理所有分析报告</p>
      </motion.div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索岗位名称或公司..."
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className="h-8 w-12 bg-muted rounded animate-pulse mx-auto mb-1" />
              <div className="h-3 w-16 bg-muted rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{reports?.length || 0}</p>
            <p className="text-xs text-muted-foreground">总报告数</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-success">
              {reports?.filter(r => r.status === "completed").length || 0}
            </p>
            <p className="text-xs text-muted-foreground">已完成</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {reports?.filter(r => r.isPublic).length || 0}
            </p>
            <p className="text-xs text-muted-foreground">已分享</p>
          </div>
        </div>
      )}

      {/* Report List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">暂无分析报告</p>
          <Button className="mt-4" onClick={() => navigate("/")}>开始分析</Button>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
          {filteredReports.map((report) => (
            <motion.div
              key={report.reportId}
              variants={staggerItem}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-200 group cursor-pointer"
              onClick={() => {
                if (report.status === "completed") navigate(`/report/${report.reportId}`);
                else if (report.status === "pending") navigate(`/confirm/${report.reportId}`);
                else if (report.status === "analyzing") navigate(`/analysis/${report.reportId}`);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-foreground">
                        {report.jobTitle || "未命名报告"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{report.company || "—"}</span>
                        <span>·</span>
                        <span>{new Date(report.createdAt).toLocaleDateString("zh-CN")}</span>
                        <span>·</span>
                        <StatusBadge status={report.status} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  {report.status === "pending" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary hover:text-primary"
                        title="继续确认"
                        onClick={() => navigate(`/confirm/${report.reportId}`)}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {report.status === "completed" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/report/${report.reportId}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {(report as any).pdfStatus === "ready" && (report as any).pdfUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                          title="下载PDF"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = (report as any).pdfUrl;
                            a.download = `${report.jobTitle || 'AI转型分析报告'}.pdf`;
                            a.target = '_blank';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleShare(report.reportId)}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title="删除"
                    onClick={() => {
                      if (confirm("确定删除此报告？")) {
                        deleteMutation.mutate({ reportId: report.reportId });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "已完成", cls: "text-success bg-success/10" },
    analyzing: { label: "分析中", cls: "text-primary bg-primary/10" },
    pending: { label: "待确认", cls: "text-warning bg-warning/10" },
    error: { label: "失败", cls: "text-destructive bg-destructive/10" },
  };
  const s = map[status] || { label: status, cls: "text-muted-foreground bg-muted" };
  return <span className={`px-1.5 py-0.5 rounded text-[10px] ${s.cls}`}>{s.label}</span>;
}
