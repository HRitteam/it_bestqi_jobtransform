import { useMemo } from "react";
import { ArrowRight, Clock, Zap, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

const IS_PRINT_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1';

/**
 * P2-05: AI优化前后对比图 — Quantix风格双列对比卡片
 * 设计参考：深色背景、大圆角、精致排版、微妙渐变边框
 * 优化前：暗红色调（低效、手动、耗时）
 * 优化后：暗绿色调（高效、AI辅助、快速）
 */
interface BeforeAfterComparisonProps {
  recommendations: any[];
  currentTasks?: any[];
}

export function BeforeAfterComparison({ recommendations, currentTasks }: BeforeAfterComparisonProps) {
  const comparisons = useMemo(() => {
    if (!Array.isArray(recommendations) || recommendations.length === 0) return [];

    const taskMap = new Map<number, any>();
    if (Array.isArray(currentTasks)) {
      currentTasks.forEach(t => { if (t.id) taskMap.set(t.id, t); });
    }

    return recommendations.slice(0, 6).map(rec => {
      const currentTask = taskMap.get(rec.taskId);
      // 生成 "国际版/国内版" 格式的工具标签，与描述文字保持一致
      let toolLabels = Array.isArray(rec.aiTools)
        ? rec.aiTools.map((t: any) => {
            const intl = (t.internationalTool || '').trim();
            const dom = (t.domesticAlternative || '').trim();
            if (intl && dom) return `${intl}/${dom}`;
            return intl || dom || '';
          }).filter(Boolean)
        : [];
      // Fallback: if no tools, show generic tools
      if (toolLabels.length === 0) {
        toolLabels = ['ChatGPT/DeepSeek'];
      }

      const beforeMethod = currentTask
        ? `${currentTask.name}（${currentTask.repetitiveness || "中"}重复性）`
        : rec.taskName;
      const beforeTime = currentTask?.timePercent
        ? `占工作时间 ${currentTask.timePercent}%`
        : "手动处理";
      const painPoints: string[] = [];
      if (currentTask?.repetitiveness === "高") painPoints.push("高度重复性工作");
      else if (currentTask?.repetitiveness === "中") painPoints.push("中等重复性");
      if (currentTask?.aiReplaceability === "高") painPoints.push("AI可替代性高");
      if (currentTask?.skills?.length) painPoints.push(`需要 ${currentTask.skills.slice(0, 2).join("、")} 等技能`);
      if (painPoints.length === 0) painPoints.push("人工为主", "效率受限");

      const afterMethod = rec.optimizationPlan || "AI辅助优化";
      const afterTime = rec.efficiencyGain ? `效率提升 ${rec.efficiencyGain}%` : "效率提升";
      const improvements: string[] = [];
      if (rec.collaborationMode) improvements.push(rec.collaborationMode);
      if (rec.difficulty) improvements.push(`实施难度: ${rec.difficulty}`);
      if (improvements.length < 2) improvements.push("质量提升");

      return {
        taskName: rec.taskName || "未知任务",
        efficiencyGain: Number(rec.efficiencyGain) || 30,
        before: { method: beforeMethod, timeSpent: beforeTime, painPoints },
        after: { method: afterMethod, timeSpent: afterTime, improvements, aiTools: toolLabels.slice(0, 3) },
      };
    });
  }, [recommendations, currentTasks]);

  if (comparisons.length === 0) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          AI优化前后对比
        </h4>
        <span className="text-xs text-muted-foreground">
          共 {comparisons.length} 项任务优化
        </span>
      </div>

      {comparisons.map((item, i) => (
        <div key={i} className="rounded-2xl overflow-hidden" style={{
          background: IS_PRINT_MODE ? "#f8f9fa" : "linear-gradient(145deg, rgba(20,20,35,0.95), rgba(12,12,22,0.98))",
          border: IS_PRINT_MODE ? "1px solid rgba(0,0,0,0.12)" : "1px solid rgba(255,255,255,0.06)",
          boxShadow: IS_PRINT_MODE ? "0 1px 4px rgba(0,0,0,0.08)" : "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)"
        }}>
          {/* 卡片头部 */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            <h5 className={`text-sm font-semibold ${IS_PRINT_MODE ? 'text-gray-900' : 'text-white/90'}`}>{item.taskName}</h5>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{
              background: "rgba(74,222,128,0.1)",
              border: "1px solid rgba(74,222,128,0.2)"
            }}>
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-xs font-medium text-green-400">+{item.efficiencyGain}%</span>
            </div>
          </div>

          {/* 双列对比区域 */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_48px_1fr] gap-0 items-stretch px-4 pb-4">
            {/* 优化前卡片 */}
            <div className="rounded-xl p-4" style={{
              background: "linear-gradient(135deg, rgba(255,82,82,0.04), rgba(255,82,82,0.01))",
              border: "1px solid rgba(255,82,82,0.12)"
            }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                  background: "rgba(255,82,82,0.12)"
                }}>
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                </div>
                <span className="text-xs font-semibold text-red-400 tracking-wide uppercase">优化前</span>
              </div>
              <p className={`text-[13px] leading-relaxed mb-3 ${IS_PRINT_MODE ? 'text-gray-700' : 'text-white/75'}`}>{item.before.method}</p>
              <div className="space-y-2">
                {item.before.painPoints.map((point, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400/60 shrink-0 mt-0.5" />
                    <span className={`text-xs leading-relaxed ${IS_PRINT_MODE ? 'text-gray-600' : 'text-white/50'}`}>{point}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,82,82,0.08)" }}>
                <span className="text-[11px] text-red-400/50">{item.before.timeSpent}</span>
              </div>
            </div>

            {/* 中间箭头 */}
            <div className="hidden md:flex items-center justify-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                  background: "linear-gradient(135deg, rgba(74,222,128,0.15), rgba(74,222,128,0.05))",
                  border: "1px solid rgba(74,222,128,0.2)"
                }}>
                  <ArrowRight className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-[9px] text-muted-foreground whitespace-nowrap">AI转型</span>
              </div>
            </div>
            <div className="flex md:hidden items-center justify-center py-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{
                background: "rgba(74,222,128,0.1)",
                border: "1px solid rgba(74,222,128,0.15)"
              }}>
                <ArrowRight className="w-3.5 h-3.5 text-green-400 rotate-90" />
              </div>
            </div>

            {/* 优化后卡片 */}
            <div className="rounded-xl p-4" style={{
              background: "linear-gradient(135deg, rgba(74,222,128,0.04), rgba(74,222,128,0.01))",
              border: "1px solid rgba(74,222,128,0.12)"
            }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{
                  background: "rgba(74,222,128,0.12)"
                }}>
                  <Zap className="w-3.5 h-3.5 text-green-400" />
                </div>
                <span className="text-xs font-semibold text-green-400 tracking-wide uppercase">优化后</span>
              </div>
              <p className={`text-[13px] leading-relaxed mb-3 ${IS_PRINT_MODE ? 'text-gray-700' : 'text-white/85'}`}>{item.after.method}</p>
              <div className="space-y-2">
                {item.after.improvements.map((imp, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400/60 shrink-0 mt-0.5" />
                    <span className={`text-xs leading-relaxed ${IS_PRINT_MODE ? 'text-gray-600' : 'text-white/60'}`}>{imp}</span>
                  </div>
                ))}
              </div>
              {item.after.aiTools.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.after.aiTools.map((tool: string, j: number) => (
                    <span key={j} className="text-[11px] px-2 py-0.5 rounded-md text-green-300/80" style={{
                      background: "rgba(74,222,128,0.08)",
                      border: "1px solid rgba(74,222,128,0.15)"
                    }}>
                      {tool}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(74,222,128,0.08)" }}>
                <span className="text-[11px] text-green-400/60">{item.after.timeSpent}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
