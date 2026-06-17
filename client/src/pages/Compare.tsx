import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactECharts from "echarts-for-react";
import { GitCompareArrows, Plus, X } from "lucide-react";

export default function Compare() {
  const { data: reportsList } = trpc.report.list.useQuery();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const completedReports = useMemo(() => {
    if (!reportsList) return [];
    return reportsList.filter((r: any) => r.status === "completed" && r.reportData);
  }, [reportsList]);

  const selectedReports = useMemo(() => {
    return selectedIds.map(id => completedReports.find((r: any) => r.reportId === id)).filter(Boolean);
  }, [selectedIds, completedReports]);

  const addReport = (id: string) => {
    if (selectedIds.length >= 4 || selectedIds.includes(id)) return;
    setSelectedIds([...selectedIds, id]);
  };

  const removeReport = (id: string) => {
    setSelectedIds(selectedIds.filter(i => i !== id));
  };

  // Helper: extract step data from reportData (array of {step, data} or object)
  const extractReportData = (raw: any) => {
    if (!raw) return null;
    let data: any;
    try {
      data = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return null; // Malformed JSON string - skip gracefully
    }
    if (Array.isArray(data)) {
      const extract = (idx: number) => { const item = data[idx]; if (!item) return undefined; return item.data ?? item; };
      return { overview: extract(0), firstPrinciples: extract(1), currentWorkflow: extract(2), aiTools: extract(3), newWorkflow: extract(4), roi: extract(5), restructuring: extract(6), risksKpi: extract(7) };
    }
    if (data && !Array.isArray(data) && typeof data === "object") {
      if (data.overview || data.step1) {
        return { overview: data.overview || data.step1, firstPrinciples: data.firstPrinciples || data.step2, currentWorkflow: data.currentWorkflow || data.step3, aiTools: data.aiTools || data.step4, newWorkflow: data.newWorkflow || data.step5, roi: data.roi || data.step6, restructuring: data.restructuring || data.step7, risksKpi: data.risksKpi || data.step8 };
      }
    }
    return null;
  };

  // Helper: 从 firstPrinciples 中提取 AI 可替代率
  const getAiReadiness = (firstPrinciples: any): number => {
    if (!firstPrinciples) return 0;
    // 优先用 overallAiReadiness
    if (firstPrinciples.overallAiReadiness) {
      const val = Number(firstPrinciples.overallAiReadiness);
      return val > 1 ? val : Math.round(val * 100);
    }
    // Fallback: 从 dimensions 的 aiImpactScore 取平均值
    if (firstPrinciples.dimensions && Array.isArray(firstPrinciples.dimensions)) {
      const scores = firstPrinciples.dimensions
        .map((d: any) => Number(d.aiImpactScore) || 0)
        .filter((s: number) => s > 0);
      if (scores.length > 0) {
        return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      }
    }
    return 0;
  };

  // Build radar chart data
  const radarOption = useMemo(() => {
    if (selectedReports.length < 2) return null;
    const indicators = [
      { name: "AI替代率", max: 100 },
      { name: "效率提升", max: 100 },
      { name: "风险等级", max: 100 },
      { name: "工具覆盖", max: 100 },
      { name: "转型就绪", max: 100 },
    ];
    const colors = ["#4ADE80", "#38BDF8", "#0EA5E9", "#FBBF24"];
    const series = selectedReports.map((r: any, idx: number) => {
      const parsed = extractReportData(r.reportData);
      const rate = getAiReadiness(parsed?.firstPrinciples);
      const recommendations = parsed?.aiTools?.recommendations || [];
      const avgEfficiency = recommendations.length > 0 ? Math.round(recommendations.reduce((s: number, rec: any) => s + (Number(rec.efficiencyGain) || 0), 0) / recommendations.length) : 0;
      const efficiency = avgEfficiency;
      const riskLevel = parsed?.risksKpi?.risks?.length ? Math.min(parsed.risksKpi.risks.length * 14, 100) : 0;
      const toolRecs = parsed?.restructuring?.toolRecommendations || [];
      const toolCount = toolRecs.reduce((s: number, cat: any) => s + (cat.tools?.length || 0), 0);
      const toolCoverage = toolCount ? Math.min(toolCount * 10, 100) : 0;
      const readiness = 100 - rate;
      return {
        name: r.jobTitle || `报告${idx + 1}`,
        value: [rate, efficiency, riskLevel, toolCoverage, readiness],
        lineStyle: { color: colors[idx], width: 2 },
        areaStyle: { color: colors[idx], opacity: 0.1 },
        itemStyle: { color: colors[idx] },
      };
    });
    return {
      tooltip: { trigger: "item", backgroundColor: "rgba(13,13,20,0.95)", borderColor: "rgba(255,255,255,0.08)", textStyle: { color: "#E8E8F0" } },
      legend: { bottom: 0, textStyle: { color: "#8B8BA0" }, data: series.map(s => s.name) },
      radar: { indicator: indicators, shape: "circle", splitArea: { areaStyle: { color: ["rgba(74,222,128,0.02)", "rgba(74,222,128,0.04)", "rgba(74,222,128,0.02)", "rgba(74,222,128,0.04)", "rgba(74,222,128,0.02)"] } }, axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } }, splitLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } }, axisName: { color: "#A0A0B8" } },
      series: [{ type: "radar", data: series }],
    };
  }, [selectedReports]);

  // Build comparison table data
  const comparisonData = useMemo(() => {
    return selectedReports.map((r: any) => {
      const parsed = extractReportData(r.reportData);
      const recommendations = parsed?.aiTools?.recommendations || [];
      const avgEfficiency = recommendations.length > 0 ? Math.round(recommendations.reduce((s: number, rec: any) => s + (Number(rec.efficiencyGain) || 0), 0) / recommendations.length) : 0;
      const toolRecs = parsed?.restructuring?.toolRecommendations || [];
      const toolCount = toolRecs.reduce((s: number, cat: any) => s + (cat.tools?.length || 0), 0);
      return {
        id: r.reportId,
        title: r.jobTitle || "未命名",
        company: r.company || "-",
        industry: r.industry || "-",
        rate: getAiReadiness(parsed?.firstPrinciples),
        efficiency: avgEfficiency,
        risksCount: parsed?.risksKpi?.risks?.length || 0,
        toolsCount: toolCount,
        date: new Date(r.createdAt).toLocaleDateString("zh-CN"),
      };
    });
  }, [selectedReports]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <GitCompareArrows className="w-6 h-6 text-emerald-400" />
        <h1 className="text-2xl font-bold text-metallic">报告对比分析</h1>
        <Badge variant="outline" className="ml-2">{selectedIds.length}/4</Badge>
      </div>

      {/* Report selector */}
      <Card className="glass-card mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">选择报告（2-4份）：</span>
            <Select onValueChange={addReport} value="">
              <SelectTrigger className="w-[240px]"><SelectValue placeholder="添加报告..." /></SelectTrigger>
              <SelectContent>
                {completedReports.filter((r: any) => !selectedIds.includes(r.reportId)).map((r: any) => (
                  <SelectItem key={r.reportId} value={r.reportId}>{r.jobTitle || "未命名"} - {r.company || ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedIds.map(id => {
              const r = completedReports.find((r: any) => r.reportId === id);
              return r ? (
                <Badge key={id} variant="secondary" className="flex items-center gap-1 pr-1">
                  {(r as any).jobTitle || "未命名"}
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeReport(id); }}
                    className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ) : null;
            })}
          </div>
        </CardContent>
      </Card>

      {selectedReports.length < 2 ? (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GitCompareArrows className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-lg">请选择至少2份已完成的报告进行对比</p>
            <p className="text-sm text-muted-foreground mt-2">支持最多4份报告并排对比，通过雷达图直观展示差异</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Radar chart */}
          <div className="col-span-12 lg:col-span-7">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-sm">多维度雷达对比</CardTitle></CardHeader>
              <CardContent>
                {radarOption && <ReactECharts option={radarOption} style={{ height: 400 }} />}
              </CardContent>
            </Card>
          </div>

          {/* Comparison table */}
          <div className="col-span-12 lg:col-span-5">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-sm">关键指标对比</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left py-2 text-muted-foreground font-medium">指标</th>
                        {comparisonData.map((d, i) => (
                          <th key={d.id} className="text-center py-2 font-medium" style={{ color: ["#4ADE80", "#38BDF8", "#0EA5E9", "#FBBF24"][i] }}>{d.title}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5"><td className="py-2 text-muted-foreground">AI替代率</td>{comparisonData.map(d => <td key={d.id} className="text-center py-2 font-bold">{d.rate}%</td>)}</tr>
                      <tr className="border-b border-white/5"><td className="py-2 text-muted-foreground">效率提升</td>{comparisonData.map(d => <td key={d.id} className="text-center py-2">{d.efficiency}%</td>)}</tr>
                      <tr className="border-b border-white/5"><td className="py-2 text-muted-foreground">风险数</td>{comparisonData.map(d => <td key={d.id} className="text-center py-2">{d.risksCount}</td>)}</tr>
                      <tr className="border-b border-white/5"><td className="py-2 text-muted-foreground">工具数</td>{comparisonData.map(d => <td key={d.id} className="text-center py-2">{d.toolsCount}</td>)}</tr>
                      <tr className="border-b border-white/5"><td className="py-2 text-muted-foreground">行业</td>{comparisonData.map(d => <td key={d.id} className="text-center py-2">{d.industry}</td>)}</tr>
                      <tr><td className="py-2 text-muted-foreground">日期</td>{comparisonData.map(d => <td key={d.id} className="text-center py-2">{d.date}</td>)}</tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bar chart comparison */}
          <div className="col-span-12">
            <Card className="glass-card">
              <CardHeader><CardTitle className="text-sm">AI替代率柱状对比</CardTitle></CardHeader>
              <CardContent>
                <ReactECharts option={{
                  tooltip: { trigger: "axis", backgroundColor: "rgba(13,13,20,0.95)", borderColor: "rgba(255,255,255,0.08)", textStyle: { color: "#E8E8F0" } },
                  xAxis: { type: "category", data: comparisonData.map(d => d.title), axisLabel: { color: "#8B8BA0" }, axisLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } } },
                  yAxis: { type: "value", max: 100, axisLabel: { color: "#8B8BA0", formatter: "{value}%" }, splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } } },
                  series: [{ type: "bar", data: comparisonData.map((d, i) => ({ value: d.rate, itemStyle: { color: ["#4ADE80", "#38BDF8", "#0EA5E9", "#FBBF24"][i], borderRadius: [4, 4, 0, 0] } })), barWidth: 40 }],
                  animation: false,
                }} style={{ height: 250 }} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
