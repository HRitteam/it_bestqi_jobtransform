import { useMemo } from "react";
import ReactECharts from "echarts-for-react";

const IS_PRINT_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1';
const ECHARTS_THEME = IS_PRINT_MODE ? undefined : 'dark';

/**
 * P2-02: ROI瀑布图 — 展示 初始投入(负) → 人力节约 → 效率提升 → 错误减少 → 净收益
 * 数据来源：reportData.roi.roiPlans (取标准方案)
 * 收益拆分基于行业经验比例估算（人力50%/效率30%/质量20%），实际比例因岗位而异
 */
interface ROIWaterfallProps {
  investmentRange: string;  // e.g. "10-20万元"
  annualSaving: string;     // e.g. "30-40万元"
  roiPercent: number;
  // 可选细分项（如后端提供则使用真实数据）
  laborSaving?: number;
  efficiencyGain?: number;
  errorReduction?: number;
}

function parseAmount(str: string): number {
  if (!str) return 0;
  const nums = str.match(/[\d.]+/g);
  if (!nums || nums.length === 0) return 0;
  const values = nums.map(Number);
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function ROIWaterfall({ investmentRange, annualSaving, roiPercent, laborSaving, efficiencyGain, errorReduction }: ROIWaterfallProps) {
  const option = useMemo(() => {
    const investment = parseAmount(investmentRange);
    const saving = parseAmount(annualSaving);

    if (investment === 0 && saving === 0) return null;

    // 使用真实细分数据（如有），否则按行业经验比例估算
    const hasRealBreakdown = laborSaving !== undefined || efficiencyGain !== undefined || errorReduction !== undefined;
    let labor = laborSaving ?? Math.round(saving * 0.5);
    let efficiency = efficiencyGain ?? Math.round(saving * 0.3);
    let errorRed = errorReduction ?? Math.round(saving * 0.2);
    // 归一化确保总和等于总节约
    const subTotal = labor + efficiency + errorRed;
    if (subTotal !== saving && saving > 0 && subTotal > 0) {
      const ratio = saving / subTotal;
      labor = Math.round(labor * ratio);
      efficiency = Math.round(efficiency * ratio);
      errorRed = saving - labor - efficiency;
    }
    const netProfit = saving - investment;

    return {
      animation: false,
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: IS_PRINT_MODE ? "rgba(255,255,255,0.95)" : "rgba(13,13,20,0.95)",
        borderColor: IS_PRINT_MODE ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.08)",
        textStyle: { color: IS_PRINT_MODE ? "#333" : "#E8E8F0" },
        formatter: (params: any) => {
          const item = params[0];
          return `${item.name}<br/>金额: ${item.value >= 0 ? "+" : ""}${item.value}万元`;
        },
      },
      grid: { left: "3%", right: "4%", bottom: "8%", top: "12%", containLabel: true },
      xAxis: {
        type: "category",
        data: ["初始投入", "人力节约", "效率提升", "错误减少", "净收益"],
        axisLabel: { color: IS_PRINT_MODE ? "#333" : "#8B8BA0", fontSize: 11, rotate: 0 },
        axisLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.08)" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: IS_PRINT_MODE ? "#333" : "#8B8BA0", formatter: "{value}万" },
        splitLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)" } },
        axisLine: { show: false },
      },
      series: [
        {
          type: "bar",
          stack: "waterfall",
          itemStyle: { borderColor: "transparent", color: "transparent" },
          emphasis: { itemStyle: { borderColor: "transparent", color: "transparent" } },
          data: [0, 0, labor, labor + efficiency, 0],
        },
        {
          type: "bar",
          stack: "waterfall",
          barWidth: 36,
          label: {
            show: true,
            position: "top",
            color: IS_PRINT_MODE ? "#333" : "#E8E8F0",
            fontSize: 11,
            formatter: (params: any) => {
              const val = params.value;
              return val >= 0 ? `+${val}` : `${val}`;
            },
          },
          data: [
            { value: -investment, itemStyle: { color: "#FF5252", borderRadius: [4, 4, 0, 0] } },
            { value: labor, itemStyle: { color: "#4ADE80", borderRadius: [4, 4, 0, 0] } },
            { value: efficiency, itemStyle: { color: "#38BDF8", borderRadius: [4, 4, 0, 0] } },
            { value: errorRed, itemStyle: { color: "#38BDF8", borderRadius: [4, 4, 0, 0] } },
            { value: netProfit, itemStyle: { color: netProfit >= 0 ? "#4ADE80" : "#FF5252", borderRadius: [4, 4, 0, 0] } },
          ],
        },
      ],
      _hasRealBreakdown: hasRealBreakdown,
    };
  }, [investmentRange, annualSaving, roiPercent, laborSaving, efficiencyGain, errorReduction]);

  if (!option) {
    return null;
  }

  const hasRealBreakdown = (option as any)._hasRealBreakdown;

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#FF5252]" />投入</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#4ADE80]" />人力节约</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" />效率提升</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#38BDF8]" />错误减少</span>
      </div>
      <ReactECharts
        option={option}
        style={{ height: 280 }}
        theme={ECHARTS_THEME}
        notMerge={true}
        lazyUpdate={true}
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          投资回报率 <strong className="text-lg text-green-400">{roiPercent}%</strong>
        </span>
        {!hasRealBreakdown && (
          <span className="text-[10px] text-muted-foreground/60 italic">
            *收益拆分为行业经验估算值
          </span>
        )}
      </div>
    </div>
  );
}
