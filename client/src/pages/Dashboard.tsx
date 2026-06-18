import { useState, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { copyToClipboard } from "@/lib/clipboard";
import { Search, Plus, Download, FileText, BarChart3, TrendingUp, Calendar, Eye, Share2, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("time");
  const [filterDept, setFilterDept] = useState("all");
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  const utils = trpc.useUtils();
  const { data: reportsList, isLoading } = trpc.report.list.useQuery();
  const { data: stats } = trpc.user.stats.useQuery();
  const deleteReport = trpc.report.delete.useMutation({
    onSuccess: async () => {
      toast.success("报告已删除");
      setSelectedReports([]);
      // [修复] 删除后强制重新拉取报告列表与统计数据，确保页面即时同步（refetch 比 invalidate 更可靠）
      await Promise.all([
        utils.report.list.refetch(),
        utils.user.stats.refetch(),
      ]);
    },
    onError: (e: any) => { toast.error(`删除失败: ${e?.message || "未知错误"}`); },
  });
  const generateShareLink = trpc.report.generateShareLink.useMutation();

  const handleShare = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    try {
      const result = await generateShareLink.mutateAsync({ reportId });
      const shareUrl = `${window.location.origin}/share/${result.token}`;
      const copied = await copyToClipboard(shareUrl);
      if (copied) {
        toast.success("分享链接已复制到剪贴板");
      } else {
        toast.success("分享链接已生成", { description: shareUrl, duration: 10000 });
      }
    } catch (err: any) {
      toast.error("分享失败", { description: "请稍后重试" });
    }
  };

  // Helper: extract AI replaceability rate from a single report
  const getReportRate = useCallback((r: any): number => {
    if (!r?.reportData) return 0;
    const data = typeof r.reportData === "string" ? JSON.parse(r.reportData) : r.reportData;
    if (Array.isArray(data)) {
      const step2 = data[1]?.data;
      if (step2?.overallAiReadiness) return step2.overallAiReadiness;
      if (step2?.dimensions) {
        const scores = step2.dimensions.map((d: any) => d.aiImpactScore || 0);
        const avg = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
        if (avg <= 1) return Math.round(avg * 100);
        else if (avg <= 10) return Math.round(avg * 10);
        return Math.round(avg);
      }
    } else {
      const fp = data?.step2 || data?.firstPrinciples;
      if (fp?.overallAiReadiness) return fp.overallAiReadiness;
      if (fp?.dimensions) {
        const scores = fp.dimensions.map((d: any) => d.aiImpactScore || 0);
        const avg = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
        if (avg <= 1) return Math.round(avg * 100);
        else if (avg <= 10) return Math.round(avg * 10);
        return Math.round(avg);
      }
    }
    return 0;
  }, []);

  // Compute average AI replaceability from completed reports
  const avgReplaceability = useMemo(() => {
    if (!reportsList) return 0;
    const completed = reportsList.filter((r: any) => r.status === "completed" && r.reportData);
    if (completed.length === 0) return 0;
    const sum = completed.reduce((acc: number, r: any) => acc + getReportRate(r), 0);
    return Math.round(sum / completed.length);
  }, [reportsList, getReportRate]);

  // Filter and sort
  const filteredReports = useMemo(() => {
    if (!reportsList) return [];
    let list = [...reportsList];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r: any) => r.jobTitle?.toLowerCase().includes(q) || r.company?.toLowerCase().includes(q));
    }
    if (filterDept !== "all") {
      list = list.filter((r: any) => r.industry === filterDept);
    }
    if (sortBy === "time") list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sortBy === "rate") list.sort((a: any, b: any) => {
      return getReportRate(b) - getReportRate(a);
    });
    return list;
  }, [reportsList, search, sortBy, filterDept]);

  // Get unique departments/industries
  const departments = useMemo(() => {
    if (!reportsList) return [];
    const depts = new Set(reportsList.map((r: any) => r.industry).filter(Boolean));
    return Array.from(depts) as string[];
  }, [reportsList]);

  const thisMonthCount = useMemo(() => {
    if (!reportsList) return 0;
    const now = new Date();
    return reportsList.filter((r: any) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [reportsList]);

  const toggleSelect = (reportId: string) => {
    setSelectedReports(prev => prev.includes(reportId) ? prev.filter(id => id !== reportId) : [...prev, reportId]);
  };

  const handleBatchExport = async () => {
    if (selectedReports.length === 0) { toast.error("请先选择要导出的报告"); return; }
    toast.info(`正在导出 ${selectedReports.length} 份报告...`);
    try {
      const resp = await apiFetch("/api/export/batch-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportIds: selectedReports }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "导出失败" }));
        toast.error(err.error || "导出失败");
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `批量导出_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`已导出 ${selectedReports.length} 份报告`);
      setSelectedReports([]);
    } catch (e: any) {
      console.error("Batch export error:", e);
      toast.error("批量导出失败，请重试");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-12 gap-6">
        {/* Left: Report list */}
        <div className="col-span-12 lg:col-span-8">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="搜索岗位名称或公司..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            {/* [修复] 按需求注释掉“全部部门”下拉筛选
            <Select value={filterDept} onValueChange={setFilterDept}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="部门筛选" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部部门</SelectItem>
                {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]"><SelectValue placeholder="排序" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="time">按时间</SelectItem>
                <SelectItem value="rate">按替代率</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => navigate("/")} size="sm"><Plus className="w-4 h-4 mr-1" />新建分析</Button>
            <Button onClick={() => navigate("/batch")} size="sm" variant="outline"><FileText className="w-4 h-4 mr-1" />批量导入</Button>
          </div>

          {/* Report list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无报告，开始您的第一次分析吧</p>
                <Button className="mt-4" onClick={() => navigate("/")}>开始分析</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report: any) => {
                const rate = getReportRate(report);
                const isSelected = selectedReports.includes(report.reportId);
                return (
                  <Card key={report.reportId} className={`glass-card transition-all cursor-pointer hover:border-emerald-500/30 ${isSelected ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(report.reportId)} className="w-4 h-4 rounded accent-emerald-500" />
                      {/* Mini gauge */}
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                          <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15" fill="none" stroke={rate > 70 ? "#ef4444" : rate > 40 ? "#f59e0b" : "#22c55e"} strokeWidth="3" strokeDasharray={`${rate * 0.94} 100`} strokeLinecap="round" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{rate}%</span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{report.jobTitle || "未命名岗位"}</span>
                          <Badge variant={report.status === "completed" ? "default" : report.status === "analyzing" ? "secondary" : report.status === "pending" ? "outline" : "destructive"} className="text-xs">
                            {report.status === "completed" ? <><CheckCircle className="w-3 h-3 mr-1" />已完成</> : report.status === "analyzing" ? <><Clock className="w-3 h-3 mr-1" />分析中</> : report.status === "pending" ? <><Clock className="w-3 h-3 mr-1" />待确认</> : <><AlertCircle className="w-3 h-3 mr-1" />异常</>}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {report.company && <span>{report.company}</span>}
                          {report.industry && <span className="ml-2">· {report.industry}</span>}
                          <span className="ml-2">· {new Date(report.createdAt).toLocaleDateString("zh-CN")}</span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); if (report.status === "pending") navigate(`/confirm/${report.reportId}`); else if (report.status === "analyzing") navigate(`/analysis/${report.reportId}`); else navigate(`/report/${report.reportId}`); }}><Eye className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={(e) => handleShare(e, report.reportId)}><Share2 className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteReport.mutate({ reportId: report.reportId }); }}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Stats + Quick actions */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <FileText className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
                <div className="text-2xl font-bold">{stats?.totalReports || 0}</div>
                <div className="text-xs text-muted-foreground">总分析数</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-5 h-5 mx-auto text-sky-400 mb-1" />
                <div className="text-2xl font-bold">{stats?.completedReports || 0}</div>
                <div className="text-xs text-muted-foreground">已完成</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-5 h-5 mx-auto text-amber-400 mb-1" />
                <div className="text-2xl font-bold">{avgReplaceability}%</div>
                <div className="text-xs text-muted-foreground">平均替代率</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-5 h-5 mx-auto text-sky-400 mb-1" />
                <div className="text-2xl font-bold">{thisMonthCount}</div>
                <div className="text-xs text-muted-foreground">本月新增</div>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <Card className="glass-card">
            <CardHeader className="pb-3"><CardTitle className="text-sm">快捷操作</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/")}>
                <Plus className="w-4 h-4 mr-2" />新建岗位分析
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/batch")}>
                <FileText className="w-4 h-4 mr-2" />批量导入分析
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/department-report")}>
                <BarChart3 className="w-4 h-4 mr-2" />部门全景报告
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/compare")}>
                <TrendingUp className="w-4 h-4 mr-2" />报告对比分析
              </Button>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card className="glass-card">
            <CardHeader className="pb-3"><CardTitle className="text-sm">最近活动</CardTitle></CardHeader>
            <CardContent>
              {reportsList && reportsList.length > 0 ? (
                <div className="space-y-3">
                  {reportsList.slice(0, 5).map((r: any) => (
                    <div key={r.reportId} className="flex items-center gap-2 text-sm">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="flex-1">{r.jobTitle || "未命名"}</span>
                      <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无活动记录</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
