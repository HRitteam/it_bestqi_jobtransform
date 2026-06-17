import { useMemo } from "react";
import ReactECharts from "echarts-for-react";

const IS_PRINT_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1';
const ECHARTS_THEME = IS_PRINT_MODE ? undefined : 'dark';

/**
 * P2-01: 技能缺口雷达图 — 当前技能 vs 目标技能双层雷达图
 * 数据来源：reportData.restructuring.newCapabilityModel + currentWorkflow.tasks[].skills
 * 或直接接收 gaps 数组
 */
interface SkillGap {
  skillName: string;
  currentLevel: number; // 0-10
  targetLevel: number;  // 0-10
}

interface SkillRadarProps {
  gaps: SkillGap[];
}

export function SkillRadar({ gaps }: SkillRadarProps) {
  const safeGaps = useMemo(
    () => Array.isArray(gaps) ? gaps.filter(g => g && g.skillName) : [],
    [gaps]
  );

  const option = useMemo(() => {
    if (safeGaps.length === 0) return null;
    return {
      animation: false,
      backgroundColor: "transparent",
      legend: {
        data: ["当前水平", "目标水平"],
        bottom: 0,
        textStyle: { color: IS_PRINT_MODE ? "#333" : "#6B6B80", fontSize: 12 },
      },
      radar: {
        indicator: safeGaps.map(g => ({ name: g.skillName, max: 10 })),
        shape: "polygon",
        splitNumber: 5,
        axisName: { color: IS_PRINT_MODE ? "#333" : "#8B8BA0", fontSize: 11 },
        splitLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)" } },
        splitArea: { areaStyle: { color: IS_PRINT_MODE ? ["rgba(0,0,0,0.02)", "rgba(0,0,0,0.04)"] : ["rgba(26,26,42,0.6)", "rgba(18,18,30,0.4)"] } },
        axisLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)" } },
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: safeGaps.map(g => Number(g.currentLevel) || 0),
              name: "当前水平",
              lineStyle: { color: "#FF5252", width: 2 },
              areaStyle: { color: "rgba(255, 82, 82, 0.15)" },
              itemStyle: { color: "#FF5252" },
            },
            {
              value: safeGaps.map(g => Number(g.targetLevel) || 0),
              name: "目标水平",
              lineStyle: { color: "#4ADE80", width: 2 },
              areaStyle: { color: "rgba(74, 222, 128, 0.15)" },
              itemStyle: { color: "#4ADE80" },
            },
          ],
        },
      ],
    };
  }, [safeGaps]);

  if (!option) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground text-sm">
        暂无技能数据
      </div>
    );
  }

  return (
    <div>
      <ReactECharts
        option={option}
        style={{ height: 360 }}
        theme={ECHARTS_THEME}
        notMerge={true}
        lazyUpdate={true}
      />
      {/* 技能缺口提升路径卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {safeGaps.map((gap, i) => {
          const deficit = Math.max(0, (Number(gap.targetLevel) || 0) - (Number(gap.currentLevel) || 0));
          const urgency = deficit >= 5 ? "高" : deficit >= 3 ? "中" : "低";
          const urgencyColor = deficit >= 5 ? "text-red-400 bg-red-500/10 border-red-500/20" : deficit >= 3 ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-green-400 bg-green-500/10 border-green-500/20";
          return (
            <div key={i} className="bg-[rgba(18,18,30,0.95)] border border-white/[0.06] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-foreground">{gap.skillName}</h5>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${urgencyColor}`}>
                  缺口{urgency}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>当前: <strong className="text-red-400">{gap.currentLevel}</strong></span>
                <span className="text-muted-foreground/50">→</span>
                <span>目标: <strong className="text-green-400">{gap.targetLevel}</strong></span>
                <span className="ml-auto text-foreground/70">差距: {deficit}</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-green-500"
                  style={{ width: `${((Number(gap.currentLevel) || 0) / 10) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
