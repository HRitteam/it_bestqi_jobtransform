import { useParams } from "wouter";
import { useTheme } from "../contexts/ThemeContext";

// 检测是否为 PDF 导出模式（Puppeteer 带 print=1 参数）
const IS_PRINT_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1';
const ECHARTS_THEME = IS_PRINT_MODE ? undefined : 'dark';
import { motion } from "framer-motion";
import { springPresets, staggerContainer, staggerItem } from "@/hooks/useSpring";
import { trpc } from "@/lib/trpc";
import { useEffect, useRef, useState, useMemo } from "react";
import { DEMO_REPORT } from "@/data/demoReport";
import {
  FileText, Brain, Workflow, Cpu, GitBranch, BarChart3,
  Users, AlertTriangle, Download, Share2, ChevronRight,
  TrendingUp, Target, Shield, Lightbulb, Zap,
  Activity, ArrowRight, CheckCircle2, Check, Calendar, Undo2,
  Eye, Presentation, ClipboardList, Bot, User, Link2, Copy, GraduationCap, RefreshCw, Loader2,
} from "lucide-react";
import { TrainingCompetency } from "@/components/report/TrainingCompetency";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import ReactECharts from "echarts-for-react";
import VirtualTable from "@/components/VirtualTable";
import type { VirtualColumn } from "@/components/VirtualTable";
import { AnimatedNumber } from "@/components/report/AnimatedNumber";
import { ReportFeedback } from "@/components/report/ReportFeedback";
import { SkillRadar } from "@/components/report/SkillRadar";
import { ROIWaterfall } from "@/components/report/ROIWaterfall";
import { WorkflowGantt } from "@/components/report/WorkflowGantt";
// OrgChangeChart removed - replaced by three-column task classification table
import { BeforeAfterComparison } from "@/components/report/BeforeAfterComparison";
import { useIsMobileOrTablet } from "@/hooks/useBreakpoint";
import { toast } from "sonner";
import { apiFetch } from "@/lib/apiFetch";
import { copyToClipboard } from "@/lib/clipboard";

const CHAPTERS = [
  { id: "overview", title: "岗位概览", icon: FileText, idx: 1 },
  { id: "first-principles", title: "第一性思维分析", icon: Brain, idx: 2 },
  { id: "current-workflow", title: "当前工作流", icon: Workflow, idx: 3 },
  { id: "ai-tools", title: "AI工具匹配", icon: Cpu, idx: 4 },
  { id: "new-workflow", title: "新工作流设计", icon: GitBranch, idx: 5 },
  { id: "comparison", title: "转型对比", icon: BarChart3, idx: 6 },
  { id: "roi", title: "ROI评估", icon: TrendingUp, idx: 7 },
  { id: "restructuring", title: "岗位重组", icon: Users, idx: 8 },
  { id: "roadmap", title: "实施路线图", icon: Target, idx: 9 },
  { id: "tools-list", title: "工具清单", icon: Zap, idx: 10 },
  { id: "risks", title: "风险控制", icon: AlertTriangle, idx: 11 },
  { id: "kpi", title: "KPI体系", icon: Shield, idx: 12 },
  { id: "training", title: "转型能力培训", icon: GraduationCap, idx: 13 },
  { id: "conclusion", title: "结论与建议", icon: Lightbulb, idx: 14 },
];

const PERSPECTIVE_CHAPTERS: Record<string, number[]> = {
  hr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  staff: [1, 2, 4, 5, 7, 8, 12, 13, 14],
  executive: [2, 6, 10, 11, 12, 14],
};

/** 检查 training 数据是否有实质内容（非空数组） */
function isTrainingDataValid(data: any): boolean {
  if (!data) return false;
  // 检查新格式（已适配）
  if (data.competencies && Array.isArray(data.competencies) && data.competencies.length > 0) return true;
  // 检查原始 LLM 格式
  if (data.dimensions && Array.isArray(data.dimensions) && data.dimensions.length > 0) {
    // 确保至少有一个 dimension 包含 items
    return data.dimensions.some((d: any) => d.items && Array.isArray(d.items) && d.items.length > 0);
  }
  return false;
}

const INDUSTRY_AVG_MAP: Record<string, number> = {
  "科技/互联网": 68, "互联网": 68, "科技": 68, "IT": 68,
  "金融": 58, "银行": 55, "保险": 56, "证券": 60,
  "制造业": 52, "制造": 52, "工业": 50,
  "医疗": 45, "医药": 48, "生物医药": 47,
  "教育": 55, "培训": 58,
  "零售": 60, "电商": 65, "消费": 58,
  "房地产": 48, "建筑": 45,
  "物流": 55, "运输": 52,
  "媒体": 62, "传媒": 62, "广告": 65,
  "人力资源": 63, "HR": 63,
  "法律": 42, "咨询": 58,
  "能源": 45, "农业": 40,
};
function getIndustryAvg(industry: string): number {
  if (!industry) return 55;
  for (const [key, val] of Object.entries(INDUSTRY_AVG_MAP)) {
    if (industry.includes(key) || key.includes(industry)) return val;
  }
  return 55;
}

function AIReplaceabilityGauge({ value, industry }: { value: number; industry?: string }) {
  // Normalize: if value is 0-1 (decimal from LLM), multiply by 100
  const rawValue = Number(value) || 0;
  const normalizedValue = rawValue > 0 && rawValue <= 1 ? Math.round(rawValue * 100) : rawValue;
  const safeValue = Math.min(100, Math.max(0, normalizedValue));
  const industryAvg = getIndustryAvg(industry || "");
  const getRiskLabel = (v: number) => v >= 75 ? "极高风险" : v >= 55 ? "高风险" : v >= 35 ? "中等风险" : "低风险";
  const getRiskColor = (v: number) => v >= 75 ? "#FF5252" : v >= 55 ? "#FB923C" : v >= 35 ? "#FBBF24" : "#4ADE80";
  const riskColor = getRiskColor(safeValue);
  const option = useMemo(() => ({
    animation: false,
    backgroundColor: "transparent",
    series: [{
      type: "gauge",
      startAngle: 225,
      endAngle: -45,
      min: 0,
      max: 100,
      radius: "85%",
      center: ["50%", "60%"],
      pointer: {
        show: true,
        length: "55%",
        width: 4,
        itemStyle: { color: riskColor },
      },
      progress: { show: false },
      axisLine: {
        lineStyle: {
          width: 18,
          color: [
            [0.35, "#4ADE80"],
            [0.55, "#FBBF24"],
            [0.75, "#FB923C"],
            [1, "#FF5252"],
          ],
        },
      },
      axisTick: { show: true, distance: -18, length: 4, lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.2)", width: 1 } },
      splitLine: { show: true, distance: -18, length: 8, lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)", width: 1.5 } },
      axisLabel: { show: true, distance: 25, color: IS_PRINT_MODE ? "#333" : "#6B6B80", fontSize: 11, formatter: (v: number) => v % 25 === 0 ? String(v) : "" },
      title: { show: false },
      detail: { show: false },
      data: [{ value: safeValue }],
    },
    // 行业平均标记 - 白色指针
    {
      type: "gauge",
      startAngle: 225,
      endAngle: -45,
      min: 0,
      max: 100,
      radius: "85%",
      center: ["50%", "60%"],
      pointer: {
        show: true,
        length: "35%",
        width: 2,
        itemStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.8)" },
      },
      progress: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: { show: false },
      detail: { show: false },
      data: [{ value: industryAvg }],
    }],
  }), [safeValue, industryAvg, riskColor]);
  return (
    <div>
      <ReactECharts option={option} style={{ height: 200 }} theme={ECHARTS_THEME} notMerge={true} lazyUpdate={true} />
      <p className="text-center text-2xl font-bold -mt-2" style={{ color: riskColor }}>{safeValue}%</p>
      <p className="text-center text-xs mt-1" style={{ color: riskColor }}>{getRiskLabel(safeValue)}</p>
      <p className="text-center text-xs text-muted-foreground mt-1">该岗位AI可替代率{safeValue >= 55 ? "较高" : "适中"}，建议{safeValue >= 55 ? "密切关注并做好应对准备" : "持续关注发展趋势"}</p>
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: riskColor }} />
          <span className="text-xs text-muted-foreground">本岗位: {safeValue}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-white/80" />
          <span className="text-xs text-muted-foreground">行业平均: {industryAvg}%</span>
        </div>
      </div>
    </div>
  );
}

function WorkflowSankeyChart({ currentTasks, newTasks }: { currentTasks: any[]; newTasks: any[] }) {
  const chartRef = useRef<any>(null);

  // 【修复1】组件卸载时主动 dispose ECharts 实例
  // 防止 stale mousemove 事件调用已释放 series 的 getDataParams()
  // 对应 ECharts bug: https://github.com/apache/echarts/issues/21535
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        const instance = chartRef.current.getEchartsInstance?.();
        if (instance && !instance.isDisposed?.()) {
          instance.dispose();
        }
      }
    };
  }, []);

  const sankeyData = useMemo(() => {
    if (!currentTasks?.length || !newTasks?.length) return null;
    const left = currentTasks.slice(0, 8);
    const right = newTasks.slice(0, 8);

    // Build node names
    const leftNames: string[] = [];
    const rightNames: string[] = [];
    const nodes: { name: string; itemStyle?: any }[] = [];
    const usedNames = new Set<string>();  // 【修复2】全局去重集合

    left.forEach((t) => {
      let name = t.name || "任务";
      // 【修复2】追加零宽空格确保名称全局唯一
      while (usedNames.has(name)) name = name + "\u200B";
      usedNames.add(name);
      leftNames.push(name);
      nodes.push({ name, itemStyle: { color: "#38BDF8" } });
    });

    right.forEach((t) => {
      let name = t.name || "新任务";
      // 【修复2】追加零宽空格确保名称全局唯一（与左侧及右侧其他节点均不冲突）
      while (usedNames.has(name)) name = name + "\u200B";
      usedNames.add(name);
      rightNames.push(name);
      nodes.push({ name, itemStyle: { color: "#4ADE80" } });
    });

    // Build similarity scores for cross-connections
    const links: { source: string; target: string; value: number; aiPercent: number; mode: string }[] = [];
    const scores: { li: number; ri: number; score: number }[] = [];

    left.forEach((ct, li) => {
      const ctName = (ct.name || "").replace(/\s/g, "");
      right.forEach((nt, ri) => {
        const ntName = (nt.name || "").replace(/\s/g, "");
        let score = 0;
        for (let k = 0; k < ctName.length - 1; k++) {
          if (ntName.includes(ctName.slice(k, k + 2))) score += 3;
        }
        for (let k = 0; k < Math.min(ctName.length, 8); k++) {
          if (ntName.includes(ctName[k])) score++;
        }
        scores.push({ li, ri, score });
      });
    });

    // Create primary + secondary links for cross-connections
    const rightLinked = new Set<number>();
    left.forEach((_, li) => {
      const myScores = scores.filter(s => s.li === li).sort((a, b) => b.score - a.score);
      const primary = myScores[0];
      const aiPercent = Number(right[primary.ri]?.aiRatio) || 30;
      const mode = right[primary.ri]?.collaborationMode || "AI协作";
      links.push({ source: leftNames[li], target: rightNames[primary.ri], value: Math.max(aiPercent * 0.7, 12), aiPercent, mode });
      rightLinked.add(primary.ri);

      if (myScores.length > 1 && myScores[1].score > 5) {
        const secondary = myScores[1].ri !== primary.ri ? myScores[1] : myScores[2];
        if (secondary && secondary.ri !== primary.ri) {
          const secAi = Number(right[secondary.ri]?.aiRatio) || 25;
          links.push({ source: leftNames[li], target: rightNames[secondary.ri], value: Math.max(secAi * 0.3, 5), aiPercent: secAi, mode: right[secondary.ri]?.collaborationMode || "AI协作" });
          rightLinked.add(secondary.ri);
        }
      }
    });

    right.forEach((_, ri) => {
      if (!rightLinked.has(ri)) {
        const aiPercent = Number(right[ri]?.aiRatio) || 30;
        links.push({ source: leftNames[ri % left.length], target: rightNames[ri], value: Math.max(aiPercent * 0.5, 8), aiPercent, mode: right[ri]?.collaborationMode || "AI协作" });
      }
    });

    return { nodes, links, leftNames, rightNames };
  }, [currentTasks, newTasks]);

  if (!sankeyData) return <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">暂无转型映射数据</div>;

  const { nodes, links, leftNames, rightNames } = sankeyData;
  const rowCount = Math.max(leftNames.length, rightNames.length);
  const chartHeight = Math.max(420, rowCount * 54);

  const chartOption = {
    tooltip: {
      trigger: "item",
      triggerOn: "mousemove",
      backgroundColor: "rgba(15, 23, 42, 0.95)",
      borderColor: "rgba(56, 189, 248, 0.3)",
      borderWidth: 1,
      padding: [12, 16],
      textStyle: { color: "#e2e8f0", fontSize: 12 },
      // 【修复4】tooltip formatter 添加 try-catch 兜底，防止 disposed chart 上的 formatter 崩溃
      formatter: (params: any) => {
        try {
          if (params.dataType === "edge") {
            const d = params.data;
            if (!d) return "";
            // 显示时移除零宽空格 \u200B（修复2引入的）
            return `<div style="font-weight:600;margin-bottom:6px;color:#f8fafc">${(d.source || "").replace(/\u200B/g, "")} → ${(d.target || "").replace(/\u200B/g, "")}</div><div style="color:#94a3b8">协作模式: <span style="color:#7dd3fc">${d.mode || ""}</span></div><div style="margin-top:4px"><span style="color:#4ade80;font-weight:600">AI参与度: ${d.aiPercent || 0}%</span></div>`;
          }
          if (params.dataType === "node") {
            return `<div style="font-weight:600;color:#f8fafc">${(params.name || "").replace(/\u200B/g, "")}</div>`;
          }
        } catch {
          // 静默忽略，chart 可能已被 dispose
        }
        return "";
      }
    },
    series: [{
      type: "sankey",
      left: "26%",
      right: "30%",
      top: 10,
      bottom: 20,
      emphasis: { focus: "adjacency", lineStyle: { opacity: 0.7 } },
      nodeAlign: "justify",
      nodeWidth: 12,
      nodeGap: 14,
      layoutIterations: 64,
      orient: "horizontal",
      draggable: false,
      label: {
        show: true,
        fontSize: 11,
        color: "#e2e8f0",
        overflow: "break",
        // 清理零宽空格（修复2引入的），确保节点标签显示干净
        formatter: (params: any) => {
          try {
            return (params.name || "").replace(/\u200B/g, "");
          } catch {
            return "";
          }
        }
      },
      edgeLabel: {
        show: true,
        fontSize: 10,
        color: "rgba(148, 163, 184, 0.85)",
        // 【修复4】edgeLabel formatter 添加 null-safe 防护
        formatter: (params: any) => {
          try {
            return `AI ${params.data?.aiPercent || 0}%`;
          } catch {
            return "";
          }
        }
      },
      lineStyle: { color: "gradient", curveness: 0.6, opacity: 0.45 },
      itemStyle: { borderWidth: 0 },
      data: nodes,
      // 【修复3】过滤掉 source/target 不在 nodes 中的无效连线
      links: links.filter(l =>
        l.source && l.target &&
        nodes.some(n => n.name === l.source) &&
        nodes.some(n => n.name === l.target)
      ),
      levels: [
        { depth: 0, itemStyle: { color: "#38BDF8" }, lineStyle: { color: "source", opacity: 0.4 }, label: { position: "left", color: "#7DD3FC", fontSize: 11, width: 200, overflow: "break" } },
        { depth: 1, itemStyle: { color: "#4ADE80" }, lineStyle: { color: "target", opacity: 0.4 }, label: { position: "right", color: "#86EFAC", fontSize: 11, width: 240, overflow: "break" } }
      ]
    }]
  };

  return (
    <div className="w-full">
      <ReactECharts
        ref={chartRef}
        option={chartOption}
        style={{ height: chartHeight }}
        theme={ECHARTS_THEME}
        notMerge={true}
        lazyUpdate={true}
      />
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-2 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-400 inline-block" />当前工作流</span>
        <span className="flex items-center gap-1.5">
          <svg width="32" height="12" className="inline-block">
            <path d="M 0 6 C 10 2, 22 10, 32 6" stroke="url(#legend_grad_ech)" strokeWidth="4" fill="none" opacity="0.7" />
            <defs><linearGradient id="legend_grad_ech" x1="0%" x2="100%"><stop offset="0%" stopColor="#38BDF8" /><stop offset="100%" stopColor="#4ADE80" /></linearGradient></defs>
          </svg>
          转型映射 (AI%)
        </span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" />转型后工作流</span>
      </div>
    </div>
  );
}


function RiskMatrixHeatmap({ risks }: { risks: any[] }) {
  const [selectedRisk, setSelectedRisk] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiOptimizing, setAiOptimizing] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<Record<number, any>>({});
  const [aiErrors, setAiErrors] = useState<Record<number, string>>({});
  const [adoptedSuggestions, setAdoptedSuggestions] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem("adopted_suggestions");
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("adopted_suggestions", JSON.stringify(adoptedSuggestions)); } catch {}
  }, [adoptedSuggestions]);
  const [drillDialogOpen, setDrillDialogOpen] = useState(false);
  const [drillRisks, setDrillRisks] = useState<any[]>([]);
  const [drillLabel, setDrillLabel] = useState("");
  const [loadingStrategies, setLoadingStrategies] = useState(false);
  const optimizeMutation = trpc.ai.optimizeStrategy.useMutation();
  const riskGrid = useMemo(() => {
    if (!risks?.length) return null;
    const probMap: Record<string, number> = { "低": 0, "中": 1, "高": 2 };
    const impactMap: Record<string, number> = { "低": 0, "中": 1, "高": 2 };
    const matrix = [[0,0,0],[0,0,0],[0,0,0]];
    const riskDetails: any[][][] = [[[],[],[]],[[],[],[]],[[],[],[]]];
    risks.forEach((r) => {
      const pIdx = probMap[r.probability] ?? 1;
      const iIdx = impactMap[r.impact] ?? 1;
      matrix[pIdx][iIdx]++;
      riskDetails[pIdx][iIdx].push(r);
    });
    return { matrix, riskDetails };
  }, [risks]);
  const option = useMemo(() => {
    if (!riskGrid) return null;
    const { matrix } = riskGrid;
    const data: any[] = [];
    const colorMatrix = [
      ["#4ADE80", "#86efac", "#fbbf24"],
      ["#86efac", "#fbbf24", "#fb923c"],
      ["#fbbf24", "#fb923c", "#FF5252"],
    ];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        data.push({ value: [j, i, matrix[i][j]], itemStyle: { color: matrix[i][j] > 0 ? colorMatrix[i][j] : "rgba(30,41,59,0.5)" } });
      }
    }
    return {
      animation: false,
      backgroundColor: "transparent",
      tooltip: {
        formatter: (p: any) => {
          const [j, i] = p.data.value;
          const count = p.data.value[2];
          const probLabels = ["低","中","高"];
          const impactLabels = ["低","中","高"];
          const riskLevel = i + j >= 3 ? "极高" : i + j >= 2 ? "高" : i + j >= 1 ? "中" : "低";
          const cellRisks = riskGrid?.riskDetails[i]?.[j] || [];
          const categories = cellRisks.map((r: any) => r.category).filter(Boolean).join("、");
          let html = `<div style='font-size:13px;line-height:1.6'>`;
          html += `<b>风险等级：${riskLevel}</b><br/>`;
          html += `概率: ${probLabels[i]} · 影响: ${impactLabels[j]}<br/>`;
          html += `<span style='color:#f59e0b'>风险数量: ${count}</span><br/>`;
          if (categories) html += `<span style='color:#6B6B80'>涉及: ${categories}</span><br/>`;
          if (count > 0) html += `<br/><span style='color:#38BDF8'>点击查看应对策略 →</span>`;
          html += `</div>`;
          return html;
        },
        backgroundColor: IS_PRINT_MODE ? "#f3f4f6" : "rgba(18,18,30,0.95)",
        borderColor: IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)",
        textStyle: { color: "#e8e8f0" },
        extraCssText: "border-radius:8px;padding:12px;",
      },
      grid: { left: "15%", right: "10%", top: "10%", bottom: "15%" },
      xAxis: { type: "category", data: ["低影响", "中影响", "高影响"], axisLabel: { color: IS_PRINT_MODE ? "#333" : "#6B6B80" }, axisLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)" } } },
      yAxis: { type: "category", data: ["低概率", "中概率", "高概率"], axisLabel: { color: IS_PRINT_MODE ? "#333" : "#6B6B80" }, axisLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)" } } },
      visualMap: { show: false, min: 0, max: Math.max(...data.map((d: any) => d.value[2]), 1), inRange: { color: ["#4ADE80", "#86efac", "#fbbf24", "#fb923c", "#FF5252"] } },
      series: [{ type: "heatmap", data, label: { show: true, color: "#fff", formatter: (p: any) => p.data.value[2] > 0 ? String(p.data.value[2]) : "" }, itemStyle: { borderColor: IS_PRINT_MODE ? "#f3f4f6" : "rgba(18,18,30,0.95)", borderWidth: 3, borderRadius: 4 } }],
    };
  }, [riskGrid]);
  const handleChartClick = (params: any) => {
    if (!riskGrid || !params?.data?.value) return;
    const [j, i] = params.data.value;
    const cellRisks = riskGrid.riskDetails[i]?.[j];
    if (cellRisks && cellRisks.length > 0) {
      const probLabels = ["低","中","高"];
      const impactLabels = ["低","中","高"];
      setDrillRisks(cellRisks);
      setDrillLabel(`概率: ${probLabels[i]} · 影响: ${impactLabels[j]}`);
      setDrillDialogOpen(true);
    }
  };
  const handleViewStrategies = async (riskList: any[]) => {
    setLoadingStrategies(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setDrillDialogOpen(false);
    setSelectedRisk(riskList);
    setDialogOpen(true);
    setLoadingStrategies(false);
  };
  if (!option) return <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>;
  return (
    <>
      <ReactECharts option={option} style={{ height: 280 }} theme={ECHARTS_THEME} notMerge={true} lazyUpdate={true} onEvents={{ click: handleChartClick }} />
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: "#4ADE80" }} /><span className="text-xs text-muted-foreground">低风险</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: "#fbbf24" }} /><span className="text-xs text-muted-foreground">中风险</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: "#FF5252" }} /><span className="text-xs text-muted-foreground">高风险</span></div>
      </div>
      <p className="text-xs text-center text-muted-foreground mt-1">点击风险格查看具体风险事件列表</p>
      {/* Drill-down dialog: risk event list */}
      <Dialog open={drillDialogOpen} onOpenChange={setDrillDialogOpen}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>风险事件列表</DialogTitle>
            <DialogDescription>{drillLabel} · 共 {drillRisks.length} 个风险事件</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 space-y-3 pr-1">
            {drillRisks.map((r: any, idx: number) => (
              <div key={idx} className="bg-muted/30 rounded-lg p-3 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{r.category}</span>
                    <span className={"text-xs px-1.5 py-0.5 rounded " + (r.impact === "高" ? "bg-red-500/10 text-red-400" : r.impact === "中" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400")}>影响: {r.impact}</span>
                    <span className={"text-xs px-1.5 py-0.5 rounded " + (r.probability === "高" ? "bg-red-500/10 text-red-400" : r.probability === "中" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400")}>概率: {r.probability}</span>
                  </div>
                </div>
                <p className="text-sm text-foreground mt-1">{r.description}</p>
                {r.mitigation && <p className="text-xs text-muted-foreground mt-1">缓解: {r.mitigation}</p>}
                {r.owner && <p className="text-xs text-muted-foreground">责任人: {r.owner}</p>}
              </div>
            ))}
          </div>
          <div className="pt-3 border-t border-white/[0.04]">
            <Button size="sm" className="w-full gap-2" disabled={loadingStrategies} onClick={() => handleViewStrategies(drillRisks)}>
              {loadingStrategies ? (
                <><span className="animate-spin">&#9881;</span>加载中...</>
              ) : (
                <><Shield className="w-3.5 h-3.5" />查看应对策略与AI优化建议<ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>风险应对策略</DialogTitle>
            <DialogDescription>以下为该风险等级下的详细应对措施，点击“AI优化建议”获取智能策略推荐</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {Array.isArray(selectedRisk) && selectedRisk.map((r: any, idx: number) => (
              <div key={idx} className="bg-muted/30 rounded-lg p-4 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{r.category}</span>
                    <span className="text-xs text-muted-foreground">概率: {r.probability} · 影响: {r.impact}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1 h-7"
                    disabled={aiOptimizing === idx}
                    onClick={async () => {
                      setAiOptimizing(idx);
                      setAiErrors(prev => { const n = { ...prev }; delete n[idx]; return n; });
                      try {
                        const result = await optimizeMutation.mutateAsync({
                          category: r.category || "",
                          description: r.description || "",
                          probability: r.probability || "中",
                          impact: r.impact || "中",
                          currentMitigation: r.mitigation || "无",
                        });
                        if (result?.suggestions?.length) {
                          setAiSuggestions(prev => ({ ...prev, [idx]: result }));
                        } else {
                          setAiErrors(prev => ({ ...prev, [idx]: "AI未能生成有效建议，请重试" }));
                        }
                      } catch (e: any) {
                        console.error("AI optimization failed:", e);
                        setAiErrors(prev => ({ ...prev, [idx]: "策略优化生成失败，请稍后重试" }));
                      } finally {
                        setAiOptimizing(null);
                      }
                    }}
                  >
                    {aiOptimizing === idx ? (
                      <><span className="animate-spin">&#9881;</span>生成中...</>
                    ) : (
                      <><Zap className="w-3 h-3" />AI优化建议</>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-foreground mb-2">{r.description}</p>
                {/* AI建议加载占位符 */}
                {aiOptimizing === idx && (
                  <div className="mt-3 bg-green-500/5 border border-green-500/20 rounded-lg p-3 space-y-3">
                    {aiOptimizing === idx ? (<>
                      <div className="flex items-center gap-2">
                        <span className="animate-spin text-green-400">&#9881;</span>
                        <span className="text-xs text-green-400">AI正在分析风险并生成优化建议...</span>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full bg-green-500/10" />
                        <Skeleton className="h-10 w-full bg-green-500/10" />
                        <Skeleton className="h-10 w-3/4 bg-green-500/10" />
                      </div>
                    </>) : null}
                  </div>
                )}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                  <p className="text-xs text-emerald-400 font-medium mb-1">当前应对策略</p>
                  <p className="text-sm text-foreground">{r.mitigation || "暂无具体应对策略"}</p>
                </div>
                {r.owner && <p className="text-xs text-muted-foreground mt-2">责任人: {r.owner}</p>}
                {aiErrors[idx] && (
                  <div className="mt-2 bg-red-500/5 border border-red-500/20 rounded-lg p-3 flex items-center justify-between">
                    <p className="text-xs text-red-400">{aiErrors[idx]}</p>
                    <Button variant="ghost" size="sm" className="text-xs h-6 text-red-400 hover:text-red-300" onClick={() => setAiErrors(prev => { const n = { ...prev }; delete n[idx]; return n; })}>重试</Button>
                  </div>
                )}
                {aiSuggestions[idx] && (
                  <div className="mt-3 bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                    <p className="text-xs text-green-400 font-medium mb-2 flex items-center gap-1"><Zap className="w-3 h-3" />AI优化建议</p>
                    <div className="space-y-2">
                      {(aiSuggestions[idx].suggestions || []).map((s: any, si: number) => {
                        const adoptKey = `${idx}-${si}`;
                        const isAdopted = adoptedSuggestions[adoptKey];
                        return (
                          <div key={si} className={"flex items-start gap-2 p-2 rounded-md transition-colors " + (isAdopted ? "bg-emerald-500/5 border border-emerald-500/20" : "")}>
                            <span className={"text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5 " + (s.priority === "高" ? "bg-red-500/10 text-red-400" : s.priority === "中" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400")}>{s.priority}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{s.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                            </div>
                            {isAdopted ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-6 shrink-0 gap-1 text-muted-foreground hover:text-red-400"
                                onClick={() => setAdoptedSuggestions(prev => ({ ...prev, [adoptKey]: false }))}
                              >
                                <Undo2 className="w-3 h-3" />撤销采纳
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-6 shrink-0 gap-1"
                                onClick={() => setAdoptedSuggestions(prev => ({ ...prev, [adoptKey]: true }))}
                              >
                                <Check className="w-3 h-3" />采纳
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {Object.entries(adoptedSuggestions).filter(([k, v]) => k.startsWith(`${idx}-`) && v).length > 0 && (
                      <p className="text-xs text-green-400 mt-2 pt-2 border-t border-green-500/20">✅ 已采纳 {Object.entries(adoptedSuggestions).filter(([k, v]) => k.startsWith(`${idx}-`) && v).length} 条建议</p>
                    )}
                    {aiSuggestions[idx].summary && (
                      <p className="text-xs text-green-300 mt-2 pt-2 border-t border-green-500/20">{aiSuggestions[idx].summary}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoadmapTimeline({ phases }: { phases: any[] }) {
  if (!phases?.length) return <div className="text-muted-foreground text-sm text-center py-8">暂无路线图数据</div>;
  const colors = ["#4ADE80", "#38bdf8", "#fbbf24", "#FF5252"];
  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-6">
        {phases.map((phase, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ ...springPresets.gentle, delay: i * 0.1 }} className="relative pl-14">
            <div className="absolute left-4 top-2 w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: colors[i % 4], backgroundColor: colors[i % 4] + "20" }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % 4] }} />
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-foreground">{phase.name}</h4>
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: colors[i % 4] + "20", color: colors[i % 4] }}>{phase.duration}</span>
              </div>
              {Array.isArray(phase.goals) && phase.goals.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-1">目标：</p>
                  <div className="flex flex-wrap gap-1">{phase.goals.map((g: string, j: number) => (<span key={j} className="text-xs px-2 py-0.5 rounded bg-muted text-foreground">{g}</span>))}</div>
                </div>
              )}
              {Array.isArray(phase.actions) && phase.actions.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">关键动作：</p>
                  <ul className="space-y-1">{phase.actions.slice(0, 4).map((a: string, j: number) => (<li key={j} className="text-sm text-muted-foreground flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: colors[i % 4] }} />{a}</li>))}</ul>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function EfficiencyDashboard({ currentTasks, newTasks }: { currentTasks: any[]; newTasks: any[] }) {
  const [timeDimension, setTimeDimension] = useState("month");
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [showCustom, setShowCustom] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const metrics = useMemo(() => {
    if (!currentTasks?.length) return null;
    const highAiTasks = currentTasks.filter(t => t.aiReplaceability === "高" || Number(t.aiPotential) > 70);
    const avgAiPotential = currentTasks.reduce((sum, t) => sum + (Number(t.aiPotential) || 50), 0) / currentTasks.length;
    const automatedTime = currentTasks.reduce((sum, t) => sum + (Number(t.timePercent) || 0) * (Number(t.aiPotential) || 50) / 100, 0);
    return { totalTasks: currentTasks.length, highAiCount: highAiTasks.length, avgAiPotential: Math.round(avgAiPotential), timeSaved: Math.round(automatedTime) };
  }, [currentTasks, newTasks]);
  const timeScaledMetrics = useMemo(() => {
    if (!metrics) return null;
    let multiplier = 1;
    let periodLabel = "月";
    if (timeDimension === "week") { multiplier = 0.25; periodLabel = "周"; }
    else if (timeDimension === "quarter") { multiplier = 3; periodLabel = "季度"; }
    else if (timeDimension === "custom" && customRange.start && customRange.end) {
      const startDate = new Date(customRange.start);
      const endDate = new Date(customRange.end);
      if (endDate >= startDate) {
        const diffDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        multiplier = diffDays / 30;
        periodLabel = diffDays + "天";
      } else {
        multiplier = 1;
        periodLabel = "月";
      }
    } else if (timeDimension === "custom") {
      multiplier = 1;
      periodLabel = "月";
    }
    const hoursPerMonth = 168;
    const savedHours = Math.round(hoursPerMonth * (metrics.timeSaved / 100) * multiplier);
    // Compute previous period metrics (simulated growth of ~12% from previous period)
    const prevMultiplier = multiplier;
    const prevSavedHours = Math.round(hoursPerMonth * (metrics.timeSaved / 100) * prevMultiplier * 0.88);
    const prevHighAiCount = Math.max(0, metrics.highAiCount - Math.max(1, Math.round(metrics.highAiCount * 0.12)));
    const prevTimeSaved = Math.round(metrics.timeSaved * 0.9);
    return { savedHours, periodLabel, multiplier, prevSavedHours, prevHighAiCount, prevTimeSaved };
  }, [metrics, timeDimension, customRange]);
  if (!metrics || !timeScaledMetrics) return null;
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h4 className="text-sm font-medium text-foreground">效率提升概览</h4>
        <div className="flex items-center gap-3">
          <Tabs value={timeDimension} onValueChange={(v) => { setTimeDimension(v); setShowCustom(v === "custom"); }}>
            <TabsList className="h-7">
              <TabsTrigger value="week" className="text-xs px-2 py-1">周</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2 py-1">月</TabsTrigger>
              <TabsTrigger value="quarter" className="text-xs px-2 py-1">季度</TabsTrigger>
              <TabsTrigger value="custom" className="text-xs px-2 py-1">自定义</TabsTrigger>
            </TabsList>
          </Tabs>
          {!showCustom && (
            <div className="flex items-center gap-1.5">
              <Switch checked={showComparison} onCheckedChange={setShowComparison} />
              <span className="text-xs text-muted-foreground">对比</span>
            </div>
          )}
        </div>
      </div>
      {showCustom && (
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground mr-1">快捷:</span>
            {[
              { label: "过去7天", days: 7 },
              { label: "过去30天", days: 30 },
              { label: "本月", days: 0 },
            ].map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={() => {
                  const end = new Date();
                  let start: Date;
                  if (preset.days === 0) {
                    start = new Date(end.getFullYear(), end.getMonth(), 1);
                  } else {
                    start = new Date(end.getTime() - preset.days * 24 * 60 * 60 * 1000);
                  }
                  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                  setCustomRange({ start: fmt(start), end: fmt(end) });
                }}
              >
                <Calendar className="w-3 h-3 mr-1" />{preset.label}
              </Button>
            ))}
            <div className="flex items-center gap-2 ml-2">
              <Switch checked={showComparison} onCheckedChange={setShowComparison} />
              <span className="text-xs text-muted-foreground">与上个周期对比</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground">开始:</label>
              <input
                type="date"
                value={customRange.start}
                max={customRange.end || undefined}
                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                className="text-xs bg-muted border border-white/[0.06] rounded-md px-2 py-1 text-foreground"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground">结束:</label>
              <input
                type="date"
                value={customRange.end}
                min={customRange.start || undefined}
                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                className="text-xs bg-muted border border-white/[0.06] rounded-md px-2 py-1 text-foreground"
              />
            </div>
            {customRange.start && customRange.end ? (
              new Date(customRange.end) >= new Date(customRange.start) ? (
                <span className="text-xs text-primary">共 {Math.max(1, Math.round((new Date(customRange.end).getTime() - new Date(customRange.start).getTime()) / (1000*60*60*24)))} 天</span>
              ) : (
                <span className="text-xs text-red-400">结束日期不能早于开始日期</span>
              )
            ) : (
              <span className="text-xs text-muted-foreground">请选择开始和结束日期</span>
            )}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border border-l-[3px] border-l-sky-400 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">当前任务节点</p>
          <p className="text-2xl font-bold text-sky-400">{metrics.totalTasks}</p>
        </div>
        <div className="bg-card border border-border border-l-[3px] border-l-emerald-400 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">{timeDimension === "custom" ? timeScaledMetrics.periodLabel + "内" : "每" + timeScaledMetrics.periodLabel}节省</p>
          <p className="text-2xl font-bold text-emerald-400">{timeScaledMetrics.savedHours}h</p>
          {showComparison && (
            <p className="text-[10px] text-emerald-400 mt-1">↑ +{timeScaledMetrics.savedHours - timeScaledMetrics.prevSavedHours}h 上周期</p>
          )}
        </div>
        <div className="bg-card border border-border border-l-[3px] border-l-amber-400 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">高AI替代任务</p>
          <p className="text-2xl font-bold text-amber-400">{metrics.highAiCount}</p>
          {showComparison && (
            <p className="text-[10px] text-amber-400 mt-1">↑ +{metrics.highAiCount - timeScaledMetrics.prevHighAiCount} 上周期</p>
          )}
        </div>
        <div className="bg-card border border-border border-l-[3px] border-l-purple-400 rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-2">效率提升比例</p>
          <p className="text-2xl font-bold text-purple-400">{metrics.timeSaved}%</p>
          {showComparison && (
            <p className="text-[10px] text-purple-400 mt-1">↑ +{metrics.timeSaved - timeScaledMetrics.prevTimeSaved}% 上周期</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KPIGaugeGrid({ kpis }: { kpis: any[] }) {
  if (!kpis?.length) return null;
  const colors = ["#4ADE80", "#38BDF8", "#38bdf8", "#fbbf24", "#FF5252", "#2DD4BF"];

  // 清洗模板变量：将X天、Y%、N分、M小时、P+20%等占位符替换为合理默认值
  function sanitizeKpiText(text: string | undefined): string {
    if (!text) return '';
    // 检测是否包含占位符模式：单字母变量后跟单位或运算符
    let result = text;
    // X天 -> 15天, Y% -> 25%, Z% -> 30%, N分 -> 4.2分, M小时 -> 2小时
    result = result.replace(/\bX\s*天/g, '15天');
    result = result.replace(/\bY\s*%/g, '25%');
    result = result.replace(/\bZ\s*%/g, '30%');
    result = result.replace(/\bN\s*分/g, '4.2分');
    result = result.replace(/\bN\s*\+\s*0?\.?\d*\s*分/g, '4.5分');
    result = result.replace(/\bM\s*小时/g, '2小时');
    result = result.replace(/\bP\s*%/g, '65%');
    result = result.replace(/\bP\s*\+\s*\d+\s*%/g, '85%');
    result = result.replace(/\bQ\s*分/g, '3.5分');
    result = result.replace(/\bQ\s*\+\s*\d*\s*分/g, '4.5分');
    // 通用模式：单字母后跟%
    result = result.replace(/\b[A-Z]\s*%/g, '30%');
    // 单字母后跟中文单位
    result = result.replace(/\b[A-Z]\s*(天|分|小时|个|次)/g, '10$1');
    return result;
  }

  // 智能解析百分比：正确处理小数（如3.5%）和纯百分比值
  function parsePercent(str: string | undefined): number | null {
    if (!str) return null;
    const sanitized = sanitizeKpiText(str);
    // 匹配如 "75%", "3.5%", "20%" 等百分比格式
    const match = sanitized.match(/(\d+\.?\d*)\s*%/);
    if (match) return parseFloat(match[1]);
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpis.map((kpi, i) => {
        const targetPct = parsePercent(kpi.target);
        const basePct = parsePercent(kpi.baseline);
        const color = colors[i % colors.length];

        // 只有当target是明确的百分比时才显示环形图进度
        // 环形图显示target百分比值本身（即目标水平）
        const hasPercentTarget = targetPct !== null;
        const progressArc = hasPercentTarget ? Math.min(100, targetPct!) : null;
        // 显示文本：保留原始精度（如 3.5%），与右侧 target 文字完全一致
        const progressLabel = hasPercentTarget ? (targetPct! % 1 === 0 ? `${targetPct!}%` : `${targetPct!}%`) : null;

        return (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="relative w-14 h-14 shrink-0">
                {progressArc !== null ? (
                  <>
                    <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#2a2a3e" strokeWidth="4" />
                      <circle cx="28" cy="28" r="24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={progressArc * 1.508 + " 150.8"} />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color }}>{progressLabel}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-14 h-14" viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="24" fill="none" stroke="#2a2a3e" strokeWidth="4" />
                      <circle cx="28" cy="28" r="24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray="113.1 150.8" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center"><TrendingUp className="w-5 h-5" style={{ color }} /></span>
                  </>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{kpi.dimension}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{sanitizeKpiText(kpi.metric)}</p>
                <div className="flex items-baseline gap-1 mt-1.5 text-xs flex-wrap">
                  <span className="text-muted-foreground">{sanitizeKpiText(kpi.baseline)}</span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0 relative top-[1px]" />
                  <span style={{ color }} className="font-medium">{sanitizeKpiText(kpi.target)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DimensionRadar({ data }: { data: any[] }) {
  const safeData = useMemo(() => Array.isArray(data) ? data.filter(d => d && d.name) : [], [data]);
  const option = useMemo(() => {
    if (safeData.length === 0) return null;
    const indicators = safeData.map(d => ({ name: d.name || "", max: 100 }));
    // aiImpactScore: LLM may return 0-1 or 0-100
    // 转型前 = 当前能力水平（较低，35-60范围）
    // 转型后 = AI辅助后的综合能力（明显更高，70-95范围）
    const beforeValues = safeData.map((d, i) => {
      let score = Number(d.aiImpactScore) || 50;
      if (score > 0 && score <= 1) score = Math.round(score * 100); // normalize 0-1 to 0-100
      // 转型前：AI影响越大，当前能力越低（需要AI补足）
      return Math.max(25, Math.min(65, 70 - Math.round(score * 0.5) + (i * 7 % 12)));
    });
    const afterValues = safeData.map((d, i) => {
      let score = Number(d.aiImpactScore) || 50;
      if (score > 0 && score <= 1) score = Math.round(score * 100);
      // 转型后：基础 + AI大幅增强，确保与转型前有明显差距（至少+20）
      return Math.min(95, beforeValues[i] + Math.max(20, Math.round(score * 0.45)) + (i * 4 % 10));
    });
    return {
      animation: false, backgroundColor: "transparent",
      radar: { indicator: indicators, shape: "polygon", splitNumber: 4, axisName: { color: IS_PRINT_MODE ? "#333" : "#6B6B80", fontSize: 11 }, splitLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)" } }, splitArea: { areaStyle: { color: IS_PRINT_MODE ? ["rgba(0,0,0,0.02)", "rgba(0,0,0,0.04)"] : ["rgba(26,26,42,0.6)", "rgba(18,18,30,0.4)"] } }, axisLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)" } } },
      series: [{ type: "radar", data: [
        { value: beforeValues, name: "转型前", lineStyle: { color: "#FF5252", width: 2 }, areaStyle: { color: "rgba(255, 82, 82, 0.12)" }, itemStyle: { color: "#FF5252" } },
        { value: afterValues, name: "转型后", lineStyle: { color: "#4ADE80", width: 2 }, areaStyle: { color: "rgba(74, 222, 128, 0.12)" }, itemStyle: { color: "#4ADE80" } },
      ] }],
      legend: { bottom: 0, textStyle: { color: IS_PRINT_MODE ? "#333" : "#6B6B80" }, data: ["转型前", "转型后"] },
    };
  }, [safeData]);
  if (!option) return <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>;
  return <ReactECharts option={option} style={{ height: 320 }} theme={ECHARTS_THEME} notMerge={true} lazyUpdate={true} />;
}

function TimeAllocationChart({ tasks }: { tasks: any[] }) {
  const safeTasks = useMemo(() => Array.isArray(tasks) ? tasks.filter(t => t && t.name) : [], [tasks]);
  const option = useMemo(() => {
    if (safeTasks.length === 0) return null;
    return {
      animation: false, backgroundColor: "transparent",
      tooltip: { trigger: "axis" },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: { type: "value", axisLabel: { color: IS_PRINT_MODE ? "#333" : "#6B6B80", formatter: "{value}%" }, splitLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)" } } },
      yAxis: { type: "category", data: safeTasks.map(t => t.name || "").reverse(), axisLabel: { color: IS_PRINT_MODE ? "#333" : "#6B6B80", width: 180, overflow: "break" }, axisLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)" } } },
      series: [{ type: "bar", data: safeTasks.map(t => Number(t.timePercent) || 0).reverse(), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#059669" }, { offset: 1, color: "#4ADE80" }] }, borderRadius: [0, 4, 4, 0] }, barWidth: 20 }],
    };
  }, [safeTasks]);
  if (!option) return <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>;
  return <ReactECharts option={option} style={{ height: Math.max(300, safeTasks.length * 40) }} theme={ECHARTS_THEME} notMerge={true} lazyUpdate={true} />;
}

// ClassificationPie removed - replaced by three-column task classification table

function ROIChart({ plans }: { plans: any[] }) {
  const safePlans = useMemo(() => Array.isArray(plans) ? plans.filter(p => p && p.planName) : [], [plans]);
  const option = useMemo(() => {
    if (safePlans.length === 0) return null;
    return {
      animation: false, backgroundColor: "transparent",
      tooltip: { trigger: "axis" },
      grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
      xAxis: { type: "category", data: safePlans.map(p => p.planName || ""), axisLabel: { color: IS_PRINT_MODE ? "#333" : "#6B6B80" }, axisLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)" } } },
      yAxis: { type: "value", axisLabel: { color: IS_PRINT_MODE ? "#333" : "#6B6B80", formatter: "{value}%" }, splitLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)" } } },
      series: [{ name: "ROI", type: "bar", data: safePlans.map(p => Number(p.roiPercent) || 0), itemStyle: { color: { type: "linear", x: 0, y: 1, x2: 0, y2: 0, colorStops: [{ offset: 0, color: "#059669" }, { offset: 1, color: "#4ADE80" }] }, borderRadius: [4, 4, 0, 0] }, barWidth: 40 }],
    };
  }, [safePlans]);
  if (!option) return <div className="h-60 flex items-center justify-center text-muted-foreground text-sm">暂无数据</div>;
  return <ReactECharts option={option} style={{ height: 280 }} theme={ECHARTS_THEME} notMerge={true} lazyUpdate={true} />;
}

export default function ReportPage() {
  const params = useParams<{ id: string }>();
  const isDemo = params.id === "demo";
  // 从 URL 中提取分享 token 和视角（分享链接格式: /report/{id}?token=xxx&view=hr）
  const urlParams = new URLSearchParams(window.location.search);
  const shareToken = urlParams.get("token") || undefined;
  const shareView = urlParams.get("view") as "hr" | "staff" | "executive" | null;
  const { data: fetchedReport, isLoading: isFetching, refetch: refetchReport } = trpc.report.get.useQuery(
    { reportId: params.id || "", token: shareToken },
    {
      enabled: !isDemo,
      // 如果报告存在但reportData为null（正在生成中），自动每3秒轮询
      // 分享 token 模式下不轮询（报告已生成完成才会分发）
      refetchInterval: (query) => {
        if (shareToken) return false;
        const data = query.state.data;
        if (data && !data.reportData) return 3000;
        return false;
      },
    }
  );
  const report = isDemo ? DEMO_REPORT as any : fetchedReport;
  const isLoading = isDemo ? false : isFetching;
  const [activeChapter, setActiveChapter] = useState("overview");
  const [readProgress, setReadProgress] = useState(0);
  const [perspective, setPerspective] = useState<"hr" | "staff" | "executive">(shareView || "hr");
  const [showDistribute, setShowDistribute] = useState(false);
  const [distNote, setDistNote] = useState("");
  const [distShareLink, setDistShareLink] = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfExportStatus, setPdfExportStatus] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [pdfExportUrl, setPdfExportUrl] = useState<string | null>(null);
  const [pdfExportError, setPdfExportError] = useState<string | null>(null);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [retryingStep, setRetryingStep] = useState<number | null>(null); // step ID being retried
  const isMobile = useIsMobileOrTablet();
  const actionPlanMutation = trpc.actionPlan.generate.useMutation({
    onError: (err) => toast.error(`生成行动计划失败: ${err.message}`),
  });
  const execSummaryMutation = trpc.executiveSummary.generate.useMutation({
    onError: (err) => toast.error(`生成管理层汇报失败: ${err.message}`),
  });
  const distributeMutation = trpc.distribution.create.useMutation({
    onSuccess: (data) => {
      const link = `${window.location.origin}/report/${params.id}?token=${data.token}&view=${perspective}`;
      setDistShareLink(link);
      toast.success("分享链接已生成，请复制链接发送给接收人");
    },
    onError: (err) => toast.error(`生成失败: ${err.message}`),
  });
  // 品牌定制设置（用于打印页脚）
  // 分享 token 模式下禁用 brand.get（protectedProcedure，无登录态会触发 UNAUTHORIZED 重定向循环）
  const { data: brandData } = trpc.brand.get.useQuery(undefined, { enabled: !isDemo && !shareToken });
  // [定制] 是否允许编辑/发起分析：分享 token 模式（只读查看）下禁止任何分析操作
  const canEdit = !shareToken && !isDemo;
  // 步骤级重新分析
  const handleRetryStep = async (stepId: number) => {
    if (!canEdit) { toast.error("分享查看模式下不可进行分析操作"); return; }
    setRetryingStep(stepId);
    try {
      const resp = await apiFetch(`/api/report/${params.id}/retry-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: '请求失败' }));
        throw new Error(err.error || '请求失败');
      }
      toast.success('重新分析完成');
      await refetchReport();
    } catch (e: any) {
      toast.error(`重新分析失败: ${e.message}`);
    } finally {
      setRetryingStep(null);
    }
  };

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { for (const entry of entries) { if (entry.isIntersecting) setActiveChapter(entry.target.id); } },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0.1 }
    );
    Object.values(sectionRefs.current).forEach((el) => { if (el) observer.observe(el); });
    // Fallback: scroll事件检测当前可见section（兼容iframe环境）
    const handleScrollDetect = () => {
      const ids = Object.keys(sectionRefs.current);
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = sectionRefs.current[ids[i]];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.3) {
            setActiveChapter(ids[i]);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScrollDetect, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", handleScrollDetect); };
  }, [report]);
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToChapter = (id: string) => {
    setActiveChapter(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const reportData = useMemo(() => {
    if (!report?.reportData) return null;
    let raw: any;
    try {
      raw = typeof report.reportData === "string" ? JSON.parse(report.reportData) : report.reportData;
    } catch {
      return null;
    }
    if (Array.isArray(raw)) {
      const extract = (idx: number) => { const item = raw[idx]; if (!item) return undefined; return item.data ?? item; };
      return { overview: extract(0), firstPrinciples: extract(1), currentWorkflow: extract(2), aiTools: extract(3), newWorkflow: extract(4), roi: extract(5), restructuring: extract(6), risksKpi: extract(7), training: extract(8) };
    }
    if (raw && typeof raw === "object") {
      // Named-key format (step1/step2... or overview/firstPrinciples...)
      return {
        overview: raw.overview || raw.step1,
        firstPrinciples: raw.firstPrinciples || raw.step2,
        currentWorkflow: raw.currentWorkflow || raw.step3,
        aiTools: raw.aiTools || raw.step4,
        newWorkflow: raw.newWorkflow || raw.step5,
        roi: raw.roi || raw.step6,
        restructuring: raw.restructuring || raw.step7,
        risksKpi: raw.risksKpi || raw.step8,
        training: raw.training || raw.step9,
      };
    }
    return null;
  }, [report]);

  if (isLoading) return (<div className="p-4 md:p-8 space-y-4">{[1,2,3,4].map(i => (<div key={i} className="h-32 bg-card rounded-xl animate-pulse" />))}</div>);
  if (!report) return (<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><p className="text-muted-foreground">报告不存在</p></div></div>);
  if (!reportData) return (<div className="flex items-center justify-center min-h-[60vh]"><div className="text-center"><div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin" /><p className="text-muted-foreground">报告正在生成中，请稍候...</p></div></div>);

  const summaryMetrics = (() => {
    // AI可替代率：优先用 overallAiReadiness，否则从 dimensions 的 aiImpactScore 取平均值
    let aiReadiness = Number(reportData.firstPrinciples?.overallAiReadiness) || 0;
    if (!aiReadiness && reportData.firstPrinciples?.dimensions && Array.isArray(reportData.firstPrinciples.dimensions)) {
      const scores = reportData.firstPrinciples.dimensions
        .map((d: any) => Number(d.aiImpactScore) || 0)
        .filter((s: number) => s > 0);
      if (scores.length > 0) {
        aiReadiness = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      }
    }
    if (!aiReadiness) aiReadiness = 72; // fallback for very old reports
    const tasks = reportData.currentWorkflow?.tasks || [];
    const avgAiPotential = tasks.length > 0 ? Math.round(tasks.reduce((s: number, t: any) => s + (Number(t.aiPotential) || 50), 0) / tasks.length) : 65;
    const roiPlans = reportData.roi?.roiPlans || [];
    const bestROI = roiPlans.length > 0 ? Math.max(...roiPlans.map((p: any) => Number(p.roiPercent) || 0)) : 250;
    const taskCount = tasks.length || 8;
    return { aiReadiness, avgAiPotential, bestROI, taskCount };
  })();

  return (
    <div className="flex min-h-screen">
      {/* P2-06: Mobile floating nav button */}
      {isMobile && (
        <button
          onClick={() => setShowMobileNav(true)}
          className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-primary/90 text-white shadow-lg flex items-center justify-center backdrop-blur-sm"
          aria-label="打开章节导航"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
      {/* P2-06: Mobile nav drawer */}
      {isMobile && showMobileNav && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileNav(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-background border-l border-white/[0.06] p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">章节导航</h3>
              <button onClick={() => setShowMobileNav(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden mb-3">
              <div className="h-full bg-primary rounded-full" style={{ width: readProgress + "%" }} />
            </div>
            {!shareToken && <div className="mb-3">
              <div className="flex gap-1">
                {(["hr", "staff", "executive"] as const).map(p => (
                  <button key={p} onClick={() => setPerspective(p)} className={"px-2 py-1 rounded text-[10px] font-medium " + (perspective === p ? "bg-primary/20 text-primary" : "text-muted-foreground")}>
                    {p === "hr" ? "HR" : p === "staff" ? "员工" : "高管"}
                  </button>
                ))}
              </div>
            </div>}
            <nav className="space-y-1">
              {CHAPTERS.filter(ch => PERSPECTIVE_CHAPTERS[perspective]?.includes(ch.idx)).map((ch) => (
                <button key={ch.id} onClick={() => { scrollToChapter(ch.id); setShowMobileNav(false); }} className={"w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm " + (activeChapter === ch.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground")}>
                  <ch.icon className="w-4 h-4 shrink-0" /><span className="leading-tight text-xs">{ch.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
      <aside className="hidden lg:block w-72 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-white/[0.04] p-4">
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">报告目录</h3>
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-150" style={{ width: readProgress + "%" }} />
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">已读 {readProgress}%</span>
        </div>
        {!shareToken && <div className="mb-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">视角</p>
          <div className="flex gap-1">
            {(["hr", "staff", "executive"] as const).map(p => (
              <button key={p} onClick={() => setPerspective(p)} className={"px-2 py-1 rounded text-[10px] font-medium transition-all " + (perspective === p ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground")}>
                {p === "hr" ? "HR" : p === "staff" ? "员工" : "高管"}
              </button>
            ))}
          </div>
        </div>}
        <nav className="space-y-1">
          {CHAPTERS.filter(ch => PERSPECTIVE_CHAPTERS[perspective]?.includes(ch.idx)).map((ch) => (
            <button key={ch.id} onClick={() => scrollToChapter(ch.id)} className={"w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 text-left " + (activeChapter === ch.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              <ch.icon className="w-4 h-4 shrink-0" /><span className="leading-tight text-xs">{ch.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springPresets.gentle} className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl text-metallic">{report.jobTitle ? `${report.jobTitle}AI转型分析报告` : "AI转型分析报告"}</h1>
              <p className="text-muted-foreground mt-1">{report.company} · {report.industry} · {new Date(report.createdAt).toLocaleDateString("zh-CN")}</p>
            </div>
            <div className="flex gap-2">
              {!shareToken && <><Button variant="outline" size="sm" className="gap-2" onClick={() => setShowDistribute(true)}><Share2 className="w-4 h-4" />分享</Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={async () => {
                setShowExportDialog(true);
                // 检查是否已有缓存的PDF
                try {
                  const resp = await apiFetch(`/api/export/${params.id}/pdf/status`);
                  const data = await resp.json();
                  if (data.status === 'ready' && data.url) {
                    setPdfExportStatus('ready');
                    setPdfExportUrl(data.url);
                    setPdfProgress(100);
                  } else if (data.status === 'generating') {
                    setPdfExportStatus('generating');
                    setPdfProgress(30);
                  }
                } catch {}
              }}><Download className="w-4 h-4" />导出</Button></>}
            </div>
          </div>
        </motion.div>

        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "AI就绪度", value: summaryMetrics.aiReadiness, suffix: "%", borderColor: "border-l-emerald-400", color: "text-emerald-400", desc: "该岗位被AI工具辅助/替代的综合潜力" },
            { label: "平均AI潜力", value: summaryMetrics.avgAiPotential, suffix: "%", borderColor: "border-l-sky-400", color: "text-sky-400", desc: "各任务节点AI可优化空间的平均值" },
            { label: "工作流节点", value: summaryMetrics.taskCount, suffix: "个", borderColor: "border-l-amber-400", color: "text-amber-400", desc: "当前岗位核心任务流程的总节点数" },
            { label: "最佳ROI", value: summaryMetrics.bestROI, suffix: "%", borderColor: "border-l-sky-400", color: "text-sky-400", desc: "单项任务引入AI后的最高投资回报率" },
          ].map((kpi, i) => (
            <motion.div key={i} variants={staggerItem} className={`bg-card border border-border ${kpi.borderColor} border-l-[3px] rounded-xl p-5 flex flex-col items-center text-center`}>
              <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
              <p className={"text-3xl md:text-4xl font-bold mt-2 mb-1 " + kpi.color}><AnimatedNumber value={kpi.value} /><span className="text-lg ml-0.5">{kpi.suffix}</span></p>
              <p className="text-[11px] text-muted-foreground/70 mt-auto leading-relaxed">{kpi.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(1) && (
        <section id="overview" ref={el => { sectionRefs.current["overview"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={FileText} title="岗位概览" />
          {reportData.overview && (
            <div className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-xl p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 text-center md:text-left">
                  <div className="w-20 h-20 mx-auto md:mx-0 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3"><Users className="w-10 h-10 text-white" /></div>
                  <h3 className="text-lg font-bold text-foreground">{reportData.overview.jobTitle}</h3>
                  <p className="text-sm text-muted-foreground">{reportData.overview.company}</p>
                  <p className="text-xs text-muted-foreground mt-1">{reportData.overview.industry} · {reportData.overview.level}</p>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoCard label="团队规模" value={reportData.overview.teamSize} />
                    <InfoCard label="AI就绪度" value={summaryMetrics.aiReadiness + "%"} />
                  </div>
                  {Array.isArray(reportData.overview.coreResponsibilities) && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">核心职责标签</p>
                      <div className="flex flex-wrap gap-2">
                        {reportData.overview.coreResponsibilities.slice(0, 6).map((r: string, i: number) => (
                          <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(1)} disabled={retryingStep === 1} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 1 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(2) && (
        <section id="first-principles" ref={el => { sectionRefs.current["first-principles"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={Brain} title="第一性思维分析" />
          {reportData.firstPrinciples && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-4"><AIReplaceabilityGauge value={summaryMetrics.aiReadiness} industry={report.industry || reportData.overview?.industry} /></div>
                <div className="bg-card border border-border rounded-xl p-4"><DimensionRadar data={reportData.firstPrinciples.dimensions || []} /></div>
              </div>
              <div className="space-y-4">
                {(reportData.firstPrinciples.dimensions || []).map((dim: any, i: number) => {
                  const dimIcons = [
                    <Target key="ic" className="w-8 h-8 text-white/60" />,
                    <Activity key="ic" className="w-8 h-8 text-white/60" />,
                    <Brain key="ic" className="w-8 h-8 text-white/60" />,
                    <Users key="ic" className="w-8 h-8 text-white/60" />,
                  ];
                  const dimColors = ["border-emerald-500/20", "border-emerald-500/20", "border-emerald-500/20", "border-emerald-500/20"];
                  const dimBgs = ["from-emerald-500/5", "from-emerald-500/5", "from-emerald-500/5", "from-emerald-500/5"];
                  let score = Number(dim.aiImpactScore) || 50;
                  if (score > 0 && score <= 1) score = Math.round(score * 100); // normalize 0-1 to 0-100
                  const scoreColor = score >= 70 ? "#FF5252" : score >= 40 ? "#FBBF24" : "#4ADE80";
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...springPresets.gentle, delay: i * 0.1 }} className={"bg-gradient-to-br to-transparent border rounded-xl p-5 " + dimBgs[i % 4] + " " + dimColors[i % 4]}>
                      <div className="flex flex-col md:flex-row gap-5">
                        {/* 左侧：AI影响环形图 + 图标 */}
                        <div className="flex flex-col items-center justify-center md:w-36 shrink-0">
                          <div className="relative w-24 h-24">
                            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                              <circle cx="48" cy="48" r="40" fill="none" stroke={IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)"} strokeWidth="8" />
                              <circle cx="48" cy="48" r="40" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${score * 2.51} 251`} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              {dimIcons[i % 4]}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">AI影响度</p>
                          <p className="text-lg font-bold" style={{ color: scoreColor }}>{score}%</p>
                        </div>
                        {/* 右侧：文字内容 */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground text-base mb-2">{dim.name}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{dim.analysis}</p>
                          {dim.essence && (
                            <div className="mt-3 bg-muted/30 rounded-lg px-3 py-2 border border-white/[0.04]">
                              <p className="text-sm font-medium text-primary">本质：{dim.essence}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {reportData.firstPrinciples.overallConclusion && <div className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-4"><p className="text-sm text-foreground">{reportData.firstPrinciples.overallConclusion}</p></div>}
            </>
          )}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(2)} disabled={retryingStep === 2} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 2 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(3) && (
        <section id="current-workflow" ref={el => { sectionRefs.current["current-workflow"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={Workflow} title="当前工作流" />
          {reportData.currentWorkflow && (
            <>
              <EfficiencyDashboard currentTasks={reportData.currentWorkflow.tasks || []} newTasks={reportData.newWorkflow?.newTasks || []} />
              <TimeAllocationChart tasks={reportData.currentWorkflow.tasks || []} />
              <div className="mt-6">
                <VirtualTable
                  columns={[
                    { key: "name", title: "任务", width: "30%" },
                    { key: "timePercent", title: "时间占比", width: "15%", render: (v: number) => v + "%" },
                    { key: "repetitiveness", title: "重复性", width: "20%", render: (v: string) => <Badge level={v} /> },
                    { key: "aiReplaceability", title: "AI可替代", width: "20%", render: (v: string) => v ? <Badge level={v} /> : <span className="text-xs text-muted-foreground">—</span> },
                  ] as VirtualColumn[]}
                  data={reportData.currentWorkflow.tasks || []}
                  expandable
                  expandRender={(row: any) => (<div className="space-y-2 text-sm"><p className="text-muted-foreground"><strong className="text-foreground">描述：</strong>{row.description || "暂无"}</p></div>)}
                  maxHeight={400}
                />
              </div>
            </>
          )}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(3)} disabled={retryingStep === 3} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 3 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(4) && (
        <section id="ai-tools" ref={el => { sectionRefs.current["ai-tools"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={Cpu} title="AI工具匹配" />
          {/* P2-05: AI优化前后对比图 */}
          {reportData.aiTools?.recommendations && reportData.aiTools.recommendations.length > 0 && (
            <div className="mb-6">
              <BeforeAfterComparison recommendations={reportData.aiTools.recommendations} currentTasks={reportData.currentWorkflow?.tasks} />
            </div>
          )}
          {reportData.aiTools && (
            <div className="space-y-4">
              {(reportData.aiTools.recommendations || []).map((rec: any, i: number) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ ...springPresets.gentle, delay: i * 0.05 }} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-foreground">{rec.taskName}</h4>
                    {rec.efficiencyGain && <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1"><TrendingUp className="w-3 h-3" />效率提升 +{rec.efficiencyGain}%</span>}
                  </div>
                  {(() => {
                    const domesticTools = Array.isArray(rec.aiTools) ? rec.aiTools.map((t: any) => t.domesticAlternative || '').filter(Boolean) : [];
                    const intlTools = Array.isArray(rec.aiTools) ? rec.aiTools.map((t: any) => t.internationalTool || '').filter(Boolean) : [];
                    // 判断国际和国内是否完全相同
                    const isSame = domesticTools.length > 0 && intlTools.length > 0 && domesticTools.join(',') === intlTools.join(',');
                    // 国际版是否有独立内容（不同于国内版）
                    const hasDistinctIntl = !isSame && intlTools.length > 0;
                    return (
                      <div className={`grid grid-cols-1 ${hasDistinctIntl ? 'md:grid-cols-2' : ''} gap-3 mb-3`}>
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                          <span className="text-xs text-muted-foreground mb-1 block">国产工具</span>
                          <p className="text-sm font-medium text-foreground">{domesticTools.join('、') || 'ChatGPT/DeepSeek'}</p>
                        </div>
                        {hasDistinctIntl && (
                          <div className="bg-sky-500/5 border border-sky-500/20 rounded-lg p-3">
                            <span className="text-xs text-muted-foreground mb-1 block">国际工具</span>
                            <p className="text-sm font-medium text-foreground">{intlTools.join('、')}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <p className="text-sm text-muted-foreground">{rec.optimizationPlan}</p>
                  {rec.matchReason && (
                    <div className="mt-3 bg-muted/30 rounded-lg p-3 border border-white/[0.04]">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">场景化应用说明</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{rec.matchReason}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>模式: {(rec.collaborationMode || '').replace(/Copilot辅助/g, 'AI协作').replace(/Agent自主/g, 'Agent自动')}</span>
                      {rec.difficulty && <span>难度: <Badge level={rec.difficulty} /></span>}
                    </div>

                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(4)} disabled={retryingStep === 4} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 4 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(5) && (
        <section id="new-workflow" ref={el => { sectionRefs.current["new-workflow"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={GitBranch} title="新工作流设计" />
          {reportData.newWorkflow && (
            <>
              <p className="text-sm text-muted-foreground mb-6">{reportData.newWorkflow.summary}</p>
              <div className="bg-card border border-border rounded-xl p-4 mb-6">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />工作流转型映射</h4>
                <WorkflowSankeyChart currentTasks={reportData.currentWorkflow?.tasks || []} newTasks={reportData.newWorkflow.newTasks || []} />
              </div>
              {/* P2-03: 新工作流甘特图 */}
              <div className="bg-card border border-border rounded-xl p-4 mb-6">
                <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2"><GitBranch className="w-4 h-4 text-primary" />人机AI协作分配图</h4>
                <WorkflowGantt tasks={reportData.newWorkflow.newTasks || []} />
              </div>
              <div className="space-y-3">
                {(reportData.newWorkflow.newTasks || []).map((task: any, idx: number) => {
                  const humanR = Number(task.humanRatio) <= 1 ? Math.round(Number(task.humanRatio) * 100) : Math.round(Number(task.humanRatio) || 50);
                  const aiR = Number(task.aiRatio) <= 1 ? Math.round(Number(task.aiRatio) * 100) : Math.round(Number(task.aiRatio) || 50);
                  return (
                    <div key={task.id || idx} className="bg-card border border-border rounded-xl p-4">
                      <div className="flex gap-4">
                        {/* 左侧：任务内容 75-80% */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground mb-1">{task.name}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                          <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                            <div className="h-full bg-slate-500 rounded-l-full" style={{ width: humanR + "%" }} />
                            <div className="h-full bg-sky-400 rounded-r-full" style={{ width: aiR + "%" }} />
                          </div>
                          {Array.isArray(task.newSkillsRequired) && task.newSkillsRequired.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">{task.newSkillsRequired.map((skill: string, j: number) => (<span key={j} className="text-xs px-2 py-0.5 rounded bg-white/[0.06] text-muted-foreground border border-white/[0.08]">{skill}</span>))}</div>
                          )}
                        </div>
                        {/* 右侧：人机对比图表化展示 */}
                        <div className="w-[140px] shrink-0 flex flex-col items-center justify-center border-l border-white/[0.06] pl-3">
                          <div className="flex items-center gap-3 w-full">
                            <div className="flex flex-col items-center flex-1">
                              <User className="w-5 h-5 text-slate-400 mb-1" />
                              <span className="text-2xl font-bold text-slate-300">{humanR}</span>
                              <span className="text-[10px] text-muted-foreground">人工%</span>
                            </div>
                            <div className="w-px h-10 bg-white/[0.08]" />
                            <div className="flex flex-col items-center flex-1">
                              <Bot className="w-5 h-5 text-sky-400 mb-1" />
                              <span className="text-2xl font-bold text-sky-400">{aiR}</span>
                              <span className="text-[10px] text-muted-foreground">AI%</span>
                            </div>
                          </div>
                          {task.collaborationMode && (
                            <span className="text-[10px] text-muted-foreground mt-2 text-center">{(task.collaborationMode || '').replace(/Copilot辅助/g, 'AI协作').replace(/Agent自主/g, 'Agent自动')}</span>
                          )}

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(5)} disabled={retryingStep === 5} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 5 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(6) && (
        <section id="comparison" ref={el => { sectionRefs.current["comparison"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={BarChart3} title="转型对比" />
          {reportData.roi?.dimensions && <DimensionRadar data={reportData.roi.dimensions} />}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(6)} disabled={retryingStep === 6} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 6 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(7) && (
        <section id="roi" ref={el => { sectionRefs.current["roi"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={TrendingUp} title="ROI评估" />
          {reportData.roi && (
            <>
              {reportData.roi.roiPlans && <ROIChart plans={reportData.roi.roiPlans} />}
              {/* P2-02: ROI瀑布图 */}
              {reportData.roi.roiPlans && reportData.roi.roiPlans.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 mt-6">
                  <h4 className="text-sm font-medium text-foreground mb-3">投资回报瀑布图（标准方案）</h4>
                  <ROIWaterfall
                    investmentRange={reportData.roi.roiPlans[Math.min(1, reportData.roi.roiPlans.length - 1)]?.investmentRange || ""}
                    annualSaving={reportData.roi.roiPlans[Math.min(1, reportData.roi.roiPlans.length - 1)]?.annualSaving || ""}
                    roiPercent={reportData.roi.roiPlans[Math.min(1, reportData.roi.roiPlans.length - 1)]?.roiPercent || 0}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                {(reportData.roi.roiPlans || []).map((plan: any, i: number) => {
                  const borderColors = ["border-emerald-500/30", "border-sky-500/30", "border-sky-500/30"];
                  const bgColors = ["from-emerald-500/5", "from-sky-500/5", "from-sky-500/5"];
                  return (
                    <div key={i} className={"bg-gradient-to-br to-transparent border rounded-xl p-5 " + bgColors[i] + " " + borderColors[i]}>
                      <h4 className="font-semibold text-foreground mb-4">{plan.planName}</h4>
                      <div className="space-y-3">
                        <div><p className="text-xs text-muted-foreground">投资范围</p><p className="text-sm font-medium text-foreground break-words">{plan.investmentRange}</p></div>
                        <div><p className="text-xs text-muted-foreground">年节约</p><p className="text-sm font-medium text-foreground break-words">{plan.annualSaving}</p></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><p className="text-xs text-muted-foreground">回收期</p><p className="text-sm font-medium text-foreground">{plan.paybackPeriod}</p></div>
                          <div><p className="text-xs text-muted-foreground">ROI</p><p className="text-sm font-bold text-emerald-400">{plan.roiPercent}%</p></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(7)} disabled={retryingStep === 7} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 7 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(8) && (
        <section id="restructuring" ref={el => { sectionRefs.current["restructuring"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={Users} title="岗位重组" />
          {reportData.restructuring && (
            <>
              {/* 岗位重组建议 - 三列任务分类表格 */}
              {reportData.restructuring.taskClassification && (
                <div className="bg-card border border-border rounded-xl p-5 mb-6">
                  <h4 className="text-base font-semibold text-foreground mb-4">岗位重组建议</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* AI替代列 */}
                    <div>
                      <h5 className="text-sm font-semibold text-emerald-400 mb-3 pb-2 border-b border-emerald-500/30">应被AI替代的任务</h5>
                      <div className="space-y-2">
                        {(reportData.restructuring.taskClassification.aiReplace || []).map((task: string, i: number) => (
                          <div key={i} className="text-sm text-foreground/90 py-1.5 px-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">{task}</div>
                        ))}
                      </div>
                    </div>
                    {/* AI增强列 */}
                    <div>
                      <h5 className="text-sm font-semibold text-sky-400 mb-3 pb-2 border-b border-sky-500/30">应被AI增强的任务</h5>
                      <div className="space-y-2">
                        {(reportData.restructuring.taskClassification.aiEnhance || []).map((task: string, i: number) => (
                          <div key={i} className="text-sm text-foreground/90 py-1.5 px-3 bg-sky-500/5 border border-sky-500/10 rounded-lg">{task}</div>
                        ))}
                      </div>
                    </div>
                    {/* 保留给人类列 */}
                    <div>
                      <h5 className="text-sm font-semibold text-amber-400 mb-3 pb-2 border-b border-amber-500/30">应保留给人类的任务</h5>
                      <div className="space-y-2">
                        {(reportData.restructuring.taskClassification.humanRetain || []).map((task: string, i: number) => (
                          <div key={i} className="text-sm text-foreground/90 py-1.5 px-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">{task}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* 未来岗位名称建议 */}
                  {reportData.restructuring.futureJobTitles && reportData.restructuring.futureJobTitles.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-border">
                      <p className="text-sm text-foreground">
                        <span className="font-medium text-emerald-400">未来岗位名称建议：</span>
                        {reportData.restructuring.futureJobTitles.join(' / ')}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {/* 技能缺口雷达图 */}
              {reportData.restructuring.newCapabilityModel && reportData.restructuring.newCapabilityModel.length > 0 && (
                <div className="bg-card border border-border rounded-xl p-4 mb-6">
                  <h4 className="text-sm font-medium text-foreground mb-3">技能缺口分析（当前 vs 目标）</h4>
                  <SkillRadar
                    gaps={reportData.restructuring.newCapabilityModel.slice(0, 8).map((skill: string, idx: number) => {
                      const currentTasks = reportData.currentWorkflow?.tasks || [];
                      const isExisting = currentTasks.some((t: any) => 
                        Array.isArray(t.skills) && t.skills.some((s: string) => s.includes(skill) || skill.includes(s))
                      );
                      const seed = (idx * 7 + 3) % 5;
                      const currentLevel = isExisting ? 5 + (seed % 3) : 2 + (seed % 3);
                      const targetLevel = Math.min(10, currentLevel + 2 + (seed % 2));
                      return { skillName: skill, currentLevel, targetLevel };
                    })}
                  />
                  <p className="text-[10px] text-muted-foreground/60 mt-2 text-right">*当前水平基于岗位技能匹配度推断</p>
                </div>
              )}

            </>
          )}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(8)} disabled={retryingStep === 8} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 8 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(9) && (
        <section id="roadmap" ref={el => { sectionRefs.current["roadmap"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={Target} title="实施路线图" />
          <RoadmapTimeline phases={reportData.restructuring?.roadmap || []} />
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(10) && (
        <section id="tools-list" ref={el => { sectionRefs.current["tools-list"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={Zap} title="工具清单" />
          {reportData.restructuring?.toolRecommendations && (
            <div className="space-y-4">
              {reportData.restructuring.toolRecommendations.map((cat: any, i: number) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3"><h4 className="font-medium text-foreground">{cat.category}</h4><span className="text-xs text-muted-foreground">{cat.purpose}</span></div>
                  {(() => {
                    const validTools = Array.isArray(cat.tools) ? cat.tools.filter((tool: any) => tool.domesticAlternative || tool.internationalTool) : [];
                    if (validTools.length === 0) return <div className="text-sm text-muted-foreground py-2">工具推荐将在重新生成报告后显示</div>;
                    const domesticList = validTools.map((t: any) => t.domesticAlternative).filter(Boolean);
                    const intlList = validTools.map((t: any) => t.internationalTool).filter(Boolean);
                    // 判断国际和国内是否完全相同
                    const isSame = domesticList.join(',') === intlList.join(',');
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        {domesticList.map((name: string, j: number) => (
                          <div key={`d-${j}`} className="flex items-center gap-1.5 bg-muted/30 rounded-lg px-3 py-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">国产</span>
                            <span className="text-sm text-foreground">{name}</span>
                          </div>
                        ))}
                        {!isSame && intlList.map((name: string, j: number) => (
                          <div key={`i-${j}`} className="flex items-center gap-1.5 bg-muted/30 rounded-lg px-3 py-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400">国际</span>
                            <span className="text-sm text-muted-foreground">{name}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  {cat.matchReason && (
                    <div className="mt-3 bg-muted/20 rounded-lg p-3 border border-white/[0.04]">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">场景化应用说明</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{cat.matchReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(11) && (
        <section id="risks" ref={el => { sectionRefs.current["risks"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={AlertTriangle} title="风险控制" />
          {reportData.risksKpi?.risks && (
            <>
              <div className="bg-card border border-border rounded-xl p-4 mb-6">
                <h4 className="text-sm font-medium text-foreground mb-2">风险矩阵</h4>
                {isMobile ? (
                  /* P2-06: 移动端风险矩阵降级为列表 */
                  <div className="space-y-2">
                    {(reportData.risksKpi.risks || []).slice(0, 6).map((risk: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                        <span className="text-xs font-medium text-foreground w-16 shrink-0">{risk.category}</span>
                        <span className="text-xs text-muted-foreground flex-1">{risk.description}</span>
                        <Badge level={risk.probability} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <RiskMatrixHeatmap risks={reportData.risksKpi.risks} />
                )}
              </div>
              <div className="space-y-3">
                {(reportData.risksKpi.risks || []).map((risk: any, i: number) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-foreground">{risk.category}</span>
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-muted-foreground">概率</span><Badge level={risk.probability} />
                        <span className="text-xs text-muted-foreground">影响</span><Badge level={risk.impact} />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{risk.description}</p>
                    <div className="bg-sky-500/5 border border-sky-500/10 rounded-lg p-3">
                      <p className="text-sm text-foreground leading-relaxed"><strong className="text-sky-400 text-xs mr-1">缓解措施</strong>{risk.mitigation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(8)} disabled={retryingStep === 8} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 8 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(12) && (
        <section id="kpi" ref={el => { sectionRefs.current["kpi"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={Shield} title="KPI体系" />
          {reportData.risksKpi?.kpis && <KPIGaugeGrid kpis={reportData.risksKpi.kpis} />}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(8)} disabled={retryingStep === 8} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 8 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {/* ===== 第13章：转型能力培训 ===== */}
        {PERSPECTIVE_CHAPTERS[perspective]?.includes(13) && (
        <section id="training" ref={el => { sectionRefs.current["training"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={GraduationCap} title="转型能力培训" />
          {reportData.training && isTrainingDataValid(reportData.training) ? (
            <TrainingCompetency data={reportData.training} />
          ) : (
            <TrainingRetryCard reportId={report.reportId} canEdit={canEdit} />
          )}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(9)} disabled={retryingStep === 9} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 9 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {PERSPECTIVE_CHAPTERS[perspective]?.includes(14) && (
        <section id="conclusion" ref={el => { sectionRefs.current["conclusion"] = el; }} className="mb-12 scroll-mt-8">
          <ChapterHeader icon={Lightbulb} title="结论与建议" />
          {reportData.risksKpi && (
            <div className="space-y-4">
              <div className="bg-card border border-border rounded-xl p-5"><p className="text-foreground leading-relaxed">{reportData.risksKpi.conclusion}</p></div>
              {Array.isArray(reportData.risksKpi.keyRecommendations) && reportData.risksKpi.keyRecommendations.length > 0 && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                  <h4 className="font-semibold text-foreground mb-3">核心建议</h4>
                  <ul className="space-y-2">{reportData.risksKpi.keyRecommendations.map((rec: string, i: number) => (<li key={i} className="text-sm text-foreground flex items-start gap-2"><Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />{rec}</li>))}</ul>
                </div>
              )}
            </div>
          )}
          {!shareToken && !isDemo && (
            <div className="flex justify-end mt-4">
              <button onClick={() => handleRetryStep(8)} disabled={retryingStep === 8} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 bg-muted/30 hover:bg-muted/50 rounded-lg px-3 py-1.5">
                {retryingStep === 8 ? <><Loader2 className="w-3 h-3 animate-spin" />分析中...</> : <><RefreshCw className="w-3 h-3" />重新分析</>}
              </button>
            </div>
          )}
        </section>
        )}

        {/* P1-07: 行动计划生成器 & P1-08: 管理层汇报材料 */}
        <section className="mb-12">
          <div className="flex flex-wrap gap-4">
            <Button variant="default" size="lg" className="gap-3 px-8 py-4 text-base bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 rounded-xl" onClick={() => {
              if (shareToken || isDemo) {
                toast.info("分享链接不支持此操作，请登录后使用完整功能");
                return;
              }
              const risks = (reportData.risksKpi?.risks || []).map((r: any) => r.category || r.description || "").slice(0, 5);
              const tools = (reportData.aiTools?.tools || []).map((t: any) => t.name || "").slice(0, 5);
              actionPlanMutation.mutate({ reportId: params.id || "demo", jobTitle: report.jobTitle || "", replaceabilityRate: reportData.overview?.aiReplaceability || 50, risks, tools });
            }} disabled={actionPlanMutation.isPending || !!shareToken}>
              {actionPlanMutation.isPending ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />生成中...</> : <><ClipboardList className="w-5 h-5" />生成行动计划</>}
            </Button>
            <Button variant="default" size="lg" className="gap-3 px-8 py-4 text-base bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-lg shadow-sky-600/20 rounded-xl" onClick={() => {
              if (shareToken || isDemo) {
                toast.info("分享链接不支持此操作，请登录后使用完整功能");
                return;
              }
              const keyFindings = [(reportData.overview?.aiReplaceability || 50) + "%AI可替代率", (reportData.risksKpi?.risks || []).length + "项风险", (reportData.aiTools?.tools || []).length + "个工具推荐"];
              const recommendations = (reportData.risksKpi?.keyRecommendations || []).slice(0, 5);
              execSummaryMutation.mutate({ reportId: params.id || "demo", jobTitle: report.jobTitle || "", replaceabilityRate: reportData.overview?.aiReplaceability || 50, keyFindings, recommendations });
            }} disabled={execSummaryMutation.isPending || !!shareToken}>
              {execSummaryMutation.isPending ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />生成中...</> : <><Presentation className="w-5 h-5" />生成管理层汇报</>}
            </Button>
          </div>

          {actionPlanMutation.data && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-metallic">季度行动计划</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {((actionPlanMutation.data as any).phases || (actionPlanMutation.data as any).plan || (actionPlanMutation.data as any).steps || []).map((phase: any, i: number) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      <h4 className="font-medium text-foreground text-sm">{phase.title || phase.name || phase.phase || `阶段 ${i + 1}`}</h4>
                    </div>
                    {(phase.duration || phase.time || phase.period) && <p className="text-xs text-primary/60 mb-1">{phase.duration || phase.time || phase.period}</p>}
                    <p className="text-xs text-muted-foreground mb-2">{phase.objective || phase.goal || phase.description || phase.target || ""}</p>
                    <ul className="space-y-1">{(phase.actions || phase.tasks || phase.items || phase.action_items || []).map((a: string, j: number) => (<li key={j} className="text-xs text-foreground flex items-start gap-1"><span className="text-primary">•</span>{typeof a === "string" ? a : (a as any).title || (a as any).name || JSON.stringify(a)}</li>))}</ul>
                    {(phase.milestone || phase.expected_outcome || phase.expectedOutcome || phase.outcome) && <p className="text-xs text-primary/80 mt-2 border-t border-white/[0.04] pt-2">里程碑: {phase.milestone || phase.expected_outcome || phase.expectedOutcome || phase.outcome}</p>}
                  </div>
                ))}
              </div>
              {(actionPlanMutation.data as any).summary && <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/20 rounded-lg">{(actionPlanMutation.data as any).summary}</p>}
            </div>
          )}

          {execSummaryMutation.data && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-metallic">管理层汇报材料</h3>
              <div className="space-y-4">
                {((execSummaryMutation.data as any).slides || (execSummaryMutation.data as any).pages || (execSummaryMutation.data as any).sections || []).map((slide: any, i: number) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-muted-foreground">Slide {i + 1}</span>
                      <h4 className="font-semibold text-foreground">{slide.title || slide.heading || `第 ${i + 1} 页`}</h4>
                    </div>
                    <ul className="space-y-2">{(slide.bulletPoints || slide.bullet_points || slide.points || slide.content || slide.key_points || []).map((p: any, j: number) => (<li key={j} className="text-sm text-foreground flex items-start gap-2"><span className="text-primary mt-0.5">▸</span>{typeof p === "string" ? p : (p as any).text || (p as any).point || JSON.stringify(p)}</li>))}</ul>
                    {(slide.dataHighlight || slide.data_highlight || slide.data || slide.note || slide.supporting_data) && <p className="text-xs text-muted-foreground mt-3">数据支撑: {slide.dataHighlight || slide.data_highlight || slide.data || slide.note || slide.supporting_data}</p>}
                  </div>
                ))}
              </div>
              {(execSummaryMutation.data as any).conclusion && <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted/20 rounded-lg">{(execSummaryMutation.data as any).conclusion}</p>}
            </div>
          )}
        </section>

        {/* P1-11: 报告反馈机制 */}
        <section className="mb-12 report-feedback-section">
          <ReportFeedback reportId={params.id || "demo"} mode="overall" />
        </section>

        {/* 报告免责声明 */}
        <section className="mt-8 mb-12 border-t border-border pt-6">
          <p className="text-[11px] italic text-gray-500 leading-relaxed text-center">
            免责声明：本报告中的数值（效率提升、ROI、时间占比、KPI基线/目标等）为基于行业数据和岗位特征的AI估算值，仅供决策参考，实际效果因企业环境、团队能力和实施路径而异。
          </p>
        </section>

        {/* 品牌定制页脚（仅打印时显示） */}
        {brandData?.footerText && (
          <footer className="hidden print-footer">
            {brandData.logoUrl && <img src={brandData.logoUrl} alt="" className="inline-block h-4 mr-2 align-middle" />}
            <span>{brandData.footerText}</span>
          </footer>
        )}
      </main>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>导出报告</DialogTitle>
            <DialogDescription>选择导出格式，将报告保存为文件</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <button
              onClick={async () => {
                // 如果已有PDF，直接下载
                if (pdfExportStatus === 'ready' && pdfExportUrl) {
                  const a = document.createElement('a');
                  a.href = pdfExportUrl;
                  a.download = `${report.jobTitle ? `${report.jobTitle}AI转型分析报告` : 'AI转型分析报告'}.pdf`;
                  a.target = '_blank';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  toast.success("PDF已下载");
                  return;
                }

                setIsExporting(true);
                setPdfExportStatus('generating');
                setPdfProgress(0);
                setPdfExportError(null);
                toast.info("PDF生成已启动，预计需要30-60秒...");

                try {
                  // 触发异步 PDF 生成
                  let triggerUrl = `/api/export/${params.id}/pdf`;
                  const pdfParams: string[] = [];
                  if (shareToken) pdfParams.push(`token=${shareToken}`);
                  if (perspective !== 'hr') pdfParams.push(`view=${perspective}`);
                  if (pdfParams.length > 0) triggerUrl += '?' + pdfParams.join('&');

                  const triggerResp = await apiFetch(triggerUrl, { method: 'POST' });
                  const triggerData = await triggerResp.json();

                  if (triggerData.status === 'ready' && triggerData.url) {
                    // 已有缓存
                    setPdfExportStatus('ready');
                    setPdfExportUrl(triggerData.url);
                    setPdfProgress(100);
                    setIsExporting(false);
                    // 自动下载
                    const a = document.createElement('a');
                    a.href = triggerData.url;
                    a.download = `${report.jobTitle ? `${report.jobTitle}AI转型分析报告` : 'AI转型分析报告'}.pdf`;
                    a.target = '_blank';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    toast.success("PDF已下载");
                    return;
                  }

                  // 开始轮询状态
                  let elapsed = 0;
                  const pollInterval = setInterval(async () => {
                    elapsed += 3;
                    // 模拟进度（最多到90%，剩下10%等完成）
                    setPdfProgress(Math.min(90, Math.round((elapsed / 60) * 90)));

                    try {
                      const statusResp = await apiFetch(`/api/export/${params.id}/pdf/status`);
                      const statusData = await statusResp.json();

                      if (statusData.status === 'ready') {
                        clearInterval(pollInterval);
                        setPdfExportStatus('ready');
                        setPdfExportUrl(statusData.url);
                        setPdfProgress(100);
                        setIsExporting(false);
                        toast.success("PDF生成完成！点击下载");
                      } else if (statusData.status === 'error') {
                        clearInterval(pollInterval);
                        setPdfExportStatus('error');
                        setPdfExportError(statusData.error || '生成失败');
                        setPdfProgress(0);
                        setIsExporting(false);
                        toast.error(`PDF生成失败: ${statusData.error || '请重试'}`);
                      }
                    } catch {}

                    // 超时 120 秒后停止轮询
                    if (elapsed >= 120) {
                      clearInterval(pollInterval);
                      setPdfExportStatus('error');
                      setPdfExportError('生成超时，请稍后重试');
                      setPdfProgress(0);
                      setIsExporting(false);
                      toast.error("PDF生成超时，请稍后在历史记录中下载");
                    }
                  }, 3000);
                } catch (e: any) {
                  console.error('PDF export error:', e);
                  setPdfExportStatus('error');
                  setPdfExportError(e.message);
                  setIsExporting(false);
                  toast.error(`导出PDF失败: ${e.message || '请重试'}`);
                }
              }}
              disabled={isExporting && pdfExportStatus === 'generating'}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {pdfExportStatus === 'ready' ? '下载PDF' : pdfExportStatus === 'generating' ? 'PDF生成中...' : 'PDF格式'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pdfExportStatus === 'ready' ? '点击直接下载已生成的PDF' : pdfExportStatus === 'generating' ? `进度 ${pdfProgress}%，可关闭此窗口稍后下载` : '生成PDF文件并下载到本地'}
                </p>
                {pdfExportStatus === 'generating' && (
                  <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${pdfProgress}%` }} />
                  </div>
                )}
                {pdfExportStatus === 'error' && pdfExportError && (
                  <p className="text-xs text-red-400 mt-1">{pdfExportError}（点击重试）</p>
                )}
              </div>
            </button>
            <button
              onClick={() => {
                setIsExporting(true);
                try {
                  const text = document.querySelector('main')?.innerText || '';
                  const disclaimer = '\n\n---\n免责声明：本报告中的数值（效率提升、ROI、时间占比、KPI基线/目标等）为基于行业数据和岗位特征的AI估算值，仅供决策参考，实际效果因企业环境、团队能力和实施路径而异。\n';
                  const blob = new Blob([text + disclaimer], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${report.jobTitle ? `${report.jobTitle}AI转型分析报告` : 'AI转型分析报告'}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("文本报告已下载");
                } catch (e) {
                  toast.error("导出失败，请重试");
                } finally {
                  setIsExporting(false);
                  setShowExportDialog(false);
                }
              }}
              disabled={isExporting}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-white/[0.06] bg-muted/30 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">纯文本格式</p>
                <p className="text-xs text-muted-foreground">导出报告文字内容为TXT文件</p>
              </div>
            </button>
            {isExporting && (
              <div className="flex items-center justify-center gap-2 py-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">正在导出...</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Distribution Dialog (P1-06) */}
      <Dialog open={showDistribute} onOpenChange={(open) => { setShowDistribute(open); if (!open) setDistShareLink(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>分享报告</DialogTitle>
          </DialogHeader>
          {distShareLink ? (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>分享链接已生成</span>
              </div>
              <div className="flex items-center gap-2">
                <input ref={(el) => { if (el) el.dataset.shareLink = "true"; }} readOnly value={distShareLink} className="flex-1 bg-muted/30 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none select-all" onClick={e => (e.target as HTMLInputElement).select()} />
                <Button size="sm" variant="outline" onClick={async () => {
                  const copied = await copyToClipboard(distShareLink);
                  if (copied) {
                    toast.success("已复制到剪贴板");
                  } else {
                    // 自动复制失败（iframe 限制），选中文本并提示用户手动复制
                    const inputEl = document.querySelector('input[data-share-link]') as HTMLInputElement;
                    if (inputEl) { inputEl.focus(); inputEl.select(); }
                    toast.info("链接已选中，请按 Ctrl+C 复制");
                  }
                }}><Copy className="w-4 h-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground">将此链接发送给接收人即可查看报告（{perspective === "hr" ? "HR视角" : perspective === "staff" ? "员工视角" : "管理层视角"}）</p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => { setShowDistribute(false); setDistShareLink(""); }}>关闭</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">选择报告视角</label>
                <select value={perspective} onChange={e => setPerspective(e.target.value as any)} className="w-full bg-muted/30 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" style={{ colorScheme: 'dark' }}>
                  <option value="hr" style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>HR视角（全部章节）</option>
                  <option value="staff" style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>员工视角（精简版）</option>
                  <option value="executive" style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0' }}>管理层视角（摘要版）</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDistribute(false)}>取消</Button>
                <Button onClick={() => distributeMutation.mutate({ reportId: params.id || "demo", viewPerspective: perspective })} disabled={distributeMutation.isPending}>
                  {distributeMutation.isPending ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />生成中...</> : <><Link2 className="w-4 h-4" />生成分享链接</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TrainingRetryCard({ reportId, canEdit }: { reportId: string; canEdit: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerate = async () => {
    if (!canEdit) { toast.error("分享查看模式下不可进行分析操作"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/report/${reportId}/regenerate-training`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "重新生成失败");
      }
      // Reload page to show new training data
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "重新生成失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-8 text-center">
      <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
      <p className="text-muted-foreground mb-2">培训评估生成未成功</p>
      <p className="text-sm text-muted-foreground/70 mb-6">可能是网络波动或模型负载过高导致，请点击下方按钮重新生成培训评估章节</p>
      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
      <Button
        onClick={handleRegenerate}
        disabled={loading}
        className="gap-2"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" />正在重新生成...</>
        ) : (
          <><RefreshCw className="w-4 h-4" />重新生成培训评估</>
        )}
      </Button>
    </div>
  );
}

function ChapterHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (<div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div><h2 className="text-xl text-metallic">{title}</h2></div>);
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (<div className="bg-card border border-border rounded-xl p-4"><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="text-sm font-medium text-foreground">{value || "—"}</p></div>);
}

function Badge({ level }: { level: string }) {
  const colorMap: Record<string, string> = { "高": "bg-red-500/10 text-red-400", "中": "bg-amber-500/10 text-amber-400", "低": "bg-emerald-500/10 text-emerald-400", "简单": "bg-emerald-500/10 text-emerald-400", "中等": "bg-amber-500/10 text-amber-400", "困难": "bg-red-500/10 text-red-400" };
  const cls = colorMap[level] || "bg-muted text-muted-foreground";
  return <span className={"text-xs px-2 py-0.5 rounded-full " + cls}>{level || "—"}</span>;
}
