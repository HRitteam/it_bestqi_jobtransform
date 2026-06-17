import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { springPresets } from "@/hooks/useSpring";
import { trpc } from "@/lib/trpc";
import ReactECharts from "echarts-for-react";
import {
  Building2, ArrowLeft, Download, BarChart3,
  TrendingUp, AlertTriangle, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { apiFetch } from "@/lib/apiFetch";

interface ReportSummary {
  reportId: string;
  jobTitle: string;
  aiReplaceRate: number;
  riskLevel: string;
  efficiencyGain: number;
  topTools: string[];
  department?: string;
}

export default function DepartmentReport() {
  const [, navigate] = useLocation();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deptName, setDeptName] = useState("全部门");

  // Fetch report list via tRPC to get all completed reports when no ids specified
  const reportListQuery = trpc.report.list.useQuery(undefined, { enabled: true });

  // Parse query params
  useEffect(() => {
    let cancelled = false;

    const params = new URLSearchParams(window.location.search);
    const idsParam = params.get("ids")?.split(",").filter(Boolean) || [];
    const dept = params.get("dept") || "全部门";
    // URLSearchParams.get() already decodes the value, no need for decodeURIComponent
    setDeptName(dept);

    // If ids specified in URL, use them; otherwise wait for report list
    let ids = idsParam;
    if (ids.length === 0) {
      // Use all completed reports from the list
      if (reportListQuery.isLoading) return;
      const completedReports = (reportListQuery.data || []).filter(
        (r: any) => r.status === "completed" && r.reportData
      );
      if (completedReports.length === 0) {
        setLoading(false);
        return;
      }
      ids = completedReports.map((r: any) => r.reportId);
    }

    // Fetch each report's data
    Promise.all(
      ids.map(async (id) => {
        try {
          const res = await apiFetch(`/api/export/${id}/data`);
          if (!res.ok) return null;
          const data = await res.json();
          const report = data.report;
          if (!report) return null;

          // Extract key metrics from report data
          const reportData = report.data || report.reportData;
          let aiReplaceRate = 0;
          let riskLevel = "中";
          let efficiencyGain = 0;
          let topTools: string[] = [];

          if (reportData) {
            // Parse step data - reportData is array of {step, title, data}
            const steps = Array.isArray(reportData) ? reportData : Object.values(reportData);
            const extract = (idx: number) => {
              const item = steps[idx] as any;
              if (!item) return undefined;
              return item.data ?? item;
            };
            const firstPrinciples = extract(1);
            const aiTools = extract(3);
            const restructuring = extract(6);
            const risksKpi = extract(7);

            // AI替代率: 优先用 overallAiReadiness，否则从 dimensions 的 aiImpactScore 取平均值
            if (firstPrinciples?.overallAiReadiness) {
              aiReplaceRate = Number(firstPrinciples.overallAiReadiness);
            } else if (firstPrinciples?.dimensions && Array.isArray(firstPrinciples.dimensions)) {
              const scores = firstPrinciples.dimensions
                .map((d: any) => Number(d.aiImpactScore) || 0)
                .filter((s: number) => s > 0);
              if (scores.length > 0) {
                aiReplaceRate = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
              }
            }

            // 效率提升: step 4 (index 3) - average of aiTools.recommendations[].efficiencyGain
            const recommendations = aiTools?.recommendations || [];
            if (recommendations.length > 0) {
              efficiencyGain = Math.round(
                recommendations.reduce((s: number, rec: any) => s + (Number(rec.efficiencyGain) || 0), 0) / recommendations.length
              );
            }

            // 风险等级: 基于 AI 可替代率判断，而不是 risks 数量（因为 step8 总是输出 7 类风险）
            riskLevel = aiReplaceRate >= 60 ? "高" : aiReplaceRate >= 35 ? "中" : "低";

            // 推荐工具: step 7 (index 6) - restructuring.toolRecommendations[].tools[]
            const toolRecs = restructuring?.toolRecommendations || [];
            const allTools: string[] = [];
            for (const cat of toolRecs) {
              const tools = cat.tools || [];
              for (const t of tools) {
                const name = t.internationalTool || t.name || t.toolName || "";
                if (name) allTools.push(name);
              }
            }
            topTools = allTools.slice(0, 3);
          }

          return {
            reportId: id,
            jobTitle: report.jobTitle || "未知岗位",
            aiReplaceRate: aiReplaceRate > 1 ? aiReplaceRate : aiReplaceRate * 100,
            riskLevel,
            efficiencyGain: efficiencyGain > 1 ? efficiencyGain : efficiencyGain * 100,
            topTools: topTools.filter(Boolean),
            department: report.department || dept,
          } as ReportSummary;
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (cancelled) return; // Ignore stale results after unmount/re-render
      setReports(results.filter(Boolean) as ReportSummary[]);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [reportListQuery.isLoading, reportListQuery.data]);

  // Computed metrics
  const avgAIRate = useMemo(() => {
    if (reports.length === 0) return 0;
    return Math.round(reports.reduce((sum, r) => sum + r.aiReplaceRate, 0) / reports.length);
  }, [reports]);

  const avgEfficiency = useMemo(() => {
    if (reports.length === 0) return 0;
    return Math.round(reports.reduce((sum, r) => sum + r.efficiencyGain, 0) / reports.length);
  }, [reports]);

  const highRiskCount = useMemo(() => {
    return reports.filter(r => r.aiReplaceRate > 60).length;
  }, [reports]);

  // Charts
  const RADAR_THRESHOLD = 8; // 雷达图最多显示岗位数，超过切换为分组柱状图
  const BAR_THRESHOLD = 12;  // AI可替代率排行最多显示条数，超过切换为紧凑柱状图

  const radarOption = useMemo(() => {
    if (reports.length === 0) return {};

    // ≤ 8 个岗位：使用雷达图
    if (reports.length <= RADAR_THRESHOLD) {
      const indicators = reports.map(r => ({ name: r.jobTitle, max: 100 }));
      return {
        animation: false,
        tooltip: { trigger: "item" },
        legend: { bottom: 0, textStyle: { color: "#6B6B80" } },
        radar: {
          indicator: indicators,
          shape: "polygon",
          axisName: { color: "#94a3b8", fontSize: 11 },
          splitArea: { areaStyle: { color: ["transparent"] } },
          splitLine: { lineStyle: { color: "#334155" } },
          axisLine: { lineStyle: { color: "#334155" } },
        },
        series: [{
          type: "radar",
          data: [{
            value: reports.map(r => r.aiReplaceRate),
            name: "AI可替代率",
            areaStyle: { color: "rgba(74,222,128,0.12)" },
            lineStyle: { color: "#4ADE80" },
            itemStyle: { color: "#4ADE80" },
          }, {
            value: reports.map(r => r.efficiencyGain),
            name: "效率提升",
            areaStyle: { color: "rgba(16,185,129,0.2)" },
            lineStyle: { color: "#10b981" },
            itemStyle: { color: "#10b981" },
          }],
        }],
      };
    }

    // > 8 个岗位：切换为紧凑纵向柱状图（固定高度，不拉长页面）
    const sorted = [...reports].sort((a, b) => b.aiReplaceRate - a.aiReplaceRate);
    return {
      animation: false,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params];
          let html = `<b>${items[0]?.name || ""}</b><br/>`;
          items.forEach((p: any) => {
            html += `${p.marker} ${p.seriesName}: ${p.value}%<br/>`;
          });
          return html;
        },
      },
      legend: { top: 0, textStyle: { color: "#6B6B80" } },
      grid: { left: 10, right: 20, top: 35, bottom: 60, containLabel: true },
      xAxis: {
        type: "category",
        data: sorted.map(r => r.jobTitle),
        axisLabel: {
          color: "#6B6B80",
          fontSize: 10,
          rotate: 45,
          width: 60,
          overflow: "truncate",
        },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
      },
      yAxis: {
        type: "value",
        max: 100,
        axisLabel: { color: "#6B6B80", formatter: "{value}%" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
      },
      series: [
        {
          name: "AI可替代率",
          type: "bar",
          data: sorted.map(r => r.aiReplaceRate),
          itemStyle: { color: "#4ADE80", borderRadius: [3, 3, 0, 0] },
          barGap: "20%",
        },
        {
          name: "效率提升",
          type: "bar",
          data: sorted.map(r => r.efficiencyGain),
          itemStyle: { color: "#38BDF8", borderRadius: [3, 3, 0, 0] },
        },
      ],
      dataZoom: [{
        type: "inside",
        xAxisIndex: 0,
        start: 0,
        end: 100,
      }],
    };
  }, [reports]);

  const barOption = useMemo(() => {
    if (reports.length === 0) return {};
    const sorted = [...reports].sort((a, b) => b.aiReplaceRate - a.aiReplaceRate);

    // ≤ 15 条：标准横向柱状图
    if (reports.length <= BAR_THRESHOLD) {
      return {
        animation: false,
        tooltip: { trigger: "axis" },
        grid: { left: "30%", right: "12%", top: 30, bottom: 20 },
        xAxis: {
          type: "value",
          max: 100,
          axisLabel: { color: "#6B6B80", formatter: "{value}%" },
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
        },
        yAxis: {
          type: "category",
          data: sorted.map(r => r.jobTitle),
          axisLabel: { color: "#6B6B80", fontSize: 11 },
          axisLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
        },
        series: [{
          type: "bar",
          data: sorted.map(r => ({
            value: r.aiReplaceRate,
            itemStyle: {
              color: r.aiReplaceRate > 60 ? "#FF5252" : r.aiReplaceRate > 40 ? "#fbbf24" : "#4ADE80",
            },
          })),
          barWidth: 16,
          label: { show: true, position: "right", color: "#6B6B80", formatter: "{c}%" },
        }],
      };
    }

    // > 15 条：紧凑纵向柱状图（x轴为岗位，y轴为数值），固定高度不拉长页面
    return {
      animation: false,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>AI可替代率: <b>${p.value}%</b>`;
        },
      },
      grid: { left: 10, right: 20, top: 30, bottom: 60, containLabel: true },
      xAxis: {
        type: "category",
        data: sorted.map(r => r.jobTitle),
        axisLabel: {
          color: "#6B6B80",
          fontSize: 10,
          rotate: 45,
          width: 60,
          overflow: "truncate",
        },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
      },
      yAxis: {
        type: "value",
        max: 100,
        axisLabel: { color: "#6B6B80", formatter: "{value}%" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
      },
      series: [{
        type: "bar",
        data: sorted.map(r => ({
          value: r.aiReplaceRate,
          itemStyle: {
            color: r.aiReplaceRate > 60 ? "#FF5252" : r.aiReplaceRate > 40 ? "#fbbf24" : "#4ADE80",
          },
        })),
        barWidth: "60%",
        label: { show: true, position: "top", color: "#6B6B80", fontSize: 10, formatter: "{c}%" },
      }],
      dataZoom: [{
        type: "inside",
        xAxisIndex: 0,
        start: 0,
        end: 100,
      }],
    };
  }, [reports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">正在汇总部门报告...</p>
        </div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">暂无数据</h2>
          <p className="text-sm text-muted-foreground mb-4">请先完成批量分析后再查看全景报告</p>
          <Button onClick={() => navigate("/batch")}>返回批量分析</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPresets.gentle}
        className="mb-8"
      >
        <Button variant="ghost" size="sm" onClick={() => navigate("/batch")} className="gap-1 mb-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />返回批量分析
        </Button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{deptName} · AI转型全景报告</h1>
              <p className="text-sm text-muted-foreground">覆盖 {reports.length} 个岗位/职能的综合分析</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springPresets.gentle, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">分析岗位数</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{reports.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-green-400" />
            <span className="text-xs text-muted-foreground">平均AI可替代率</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgAIRate}%</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">平均效率提升</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgEfficiency}%</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-muted-foreground">高风险岗位</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{highRiskCount}</p>
        </div>
      </motion.div>

      {/* Charts */}
      <div className={`grid gap-6 mb-8 ${reports.length > 20 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPresets.gentle, delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <h3 className="text-sm font-medium text-foreground mb-3">
            {reports.length <= RADAR_THRESHOLD ? "岗位AI转型能力雷达图" : "岗位AI转型能力对比"}
          </h3>
          <ReactECharts option={radarOption} style={{ height: reports.length <= RADAR_THRESHOLD ? 300 : 400 }} />
        </motion.div>

        {/* Bar Chart - AI Replace Rate Ranking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPresets.gentle, delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-4"
        >
          <h3 className="text-sm font-medium text-foreground mb-3">AI可替代率排行</h3>
          <ReactECharts option={barOption} style={{ height: reports.length <= BAR_THRESHOLD ? Math.max(300, reports.length * 28 + 60) : 400 }} />
        </motion.div>
      </div>

      {/* Detail Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springPresets.gentle, delay: 0.3 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-medium text-foreground">岗位详细对比</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04] bg-white/[0.02]">
                <th className="text-left p-3 text-[#6B6B80] font-medium">岗位名称</th>
                <th className="text-center p-3 text-[#6B6B80] font-medium">AI可替代率</th>
                <th className="text-center p-3 text-[#6B6B80] font-medium">效率提升</th>
                <th className="text-center p-3 text-[#6B6B80] font-medium">风险等级</th>
                <th className="text-left p-3 text-[#6B6B80] font-medium">推荐工具</th>
                <th className="text-center p-3 text-[#6B6B80] font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.reportId} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 text-foreground font-medium">{r.jobTitle}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      r.aiReplaceRate > 60 ? "bg-red-500/10 text-red-400" :
                      r.aiReplaceRate > 40 ? "bg-amber-500/10 text-amber-400" :
                      "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {Math.round(r.aiReplaceRate)}%
                    </span>
                  </td>
                  <td className="p-3 text-center text-emerald-400">{Math.round(r.efficiencyGain)}%</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs ${
                      r.riskLevel === "高" ? "text-red-400" :
                      r.riskLevel === "中" ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      {r.riskLevel}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {r.topTools.slice(0, 2).map((t, i) => (
                        <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/report/${r.reportId}`)}>
                      详情
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springPresets.gentle, delay: 0.35 }}
        className="mt-8 bg-card border border-border rounded-xl p-6"
      >
        <h3 className="text-base font-medium text-foreground mb-4">部门AI转型建议</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          {highRiskCount > 0 && (
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <p>
                <span className="text-foreground font-medium">高风险预警：</span>
                {highRiskCount} 个岗位AI可替代率超过60%，建议优先制定转型方案，重点关注人员技能升级和岗位职责重新设计。
              </p>
            </div>
          )}
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <p>
              <span className="text-foreground font-medium">效率机会：</span>
              部门平均效率提升潜力为 {avgEfficiency}%，建议从AI可替代率最高的岗位开始试点，逐步推广到全部门。
            </p>
          </div>
          <div className="flex items-start gap-2">
            <BarChart3 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
            <p>
              <span className="text-foreground font-medium">工具整合：</span>
              建议统一采购部门级AI工具许可，避免各岗位重复订阅。优先考虑国产免费/低成本替代方案。
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
