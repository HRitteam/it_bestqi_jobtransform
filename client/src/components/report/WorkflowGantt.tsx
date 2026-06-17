import { useMemo, useState, useRef } from "react";

/**
 * P2-03: 人机AI协作分配图
 * 每个任务一个等宽水平条，条内用蓝色（AI）和灰色（人工）按比例分割
 * 所有条形统一100%宽度，内部按humanRatio/aiRatio比例分割
 */
interface GanttTask {
  id?: number;
  name: string;
  description?: string;
  humanRatio: number;
  aiRatio: number;
  collaborationMode?: string;
  timePercent?: number;
}

interface WorkflowGanttProps {
  tasks: GanttTask[];
}

/** 将可能的小数(0.6)或百分比(60)统一为0-100整数 */
function normalizeRatio(human: number, ai: number): { humanW: number; aiW: number } {
  let h = Number(human) || 0;
  let a = Number(ai) || 0;

  // 如果两者都<=1且至少一个>0，说明是小数形式(0.6/0.4)
  if (h <= 1 && a <= 1 && (h > 0 || a > 0)) {
    h = Math.round(h * 100);
    a = Math.round(a * 100);
  }

  // 确保总和为100
  const sum = h + a;
  if (sum > 0 && sum !== 100) {
    h = Math.round((h / sum) * 100);
    a = 100 - h;
  }

  // 兜底：如果都是0，默认50/50
  if (h === 0 && a === 0) {
    h = 50;
    a = 50;
  }

  return { humanW: h, aiW: a };
}

/** 从可能很长的 collaborationMode 字段中提取简短标签 */
function extractModeLabel(mode: string): string {
  if (!mode) return '';
  // 尝试匹配常见模式标签
  const patterns = [
    /^(AI协作|AI辅助|AI自动|AI主导|Agent自动|Agent自主|Human主导|人工主导|人机协作|Copilot辅助)/,
  ];
  for (const p of patterns) {
    const m = mode.match(p);
    if (m) return m[1].replace(/Copilot辅助/g, 'AI协作').replace(/Agent自主/g, 'Agent自动');
  }
  // 如果没有匹配到模式，截取合理长度
  const cleaned = mode.replace(/Copilot辅助/g, 'AI协作').replace(/Agent自主/g, 'Agent自动');
  // 取第一个" - "或"，"或"："前的部分
  const short = cleaned.split(/[\s]*[-，：:,][\s]*/)[0];
  return short.length <= 10 ? short : short.slice(0, 9) + '…';
}

/** Tooltip component for showing full collaboration mode text on hover */
function ModeTooltip({ label, fullText }: { label: string; fullText: string }) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const ref = useRef<HTMLSpanElement>(null);
  const needsTooltip = label !== fullText && fullText.length > label.length;

  const handleMouseEnter = () => {
    if (!needsTooltip) return;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPosition({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setShow(true);
  };

  return (
    <span
      ref={ref}
      className="text-xs text-muted-foreground shrink-0 w-[140px] text-left truncate cursor-default relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShow(false)}
    >
      {label}
      {show && needsTooltip && (
        <span
          className="fixed z-50 max-w-[320px] px-3 py-2 rounded-lg text-xs leading-relaxed text-foreground/90 shadow-lg"
          style={{
            top: `${position.top}px`,
            right: `${position.right}px`,
            background: 'rgba(30, 30, 50, 0.97)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {fullText}
        </span>
      )}
    </span>
  );
}

export function WorkflowGantt({ tasks }: WorkflowGanttProps) {
  const safeTasks = useMemo(
    () => Array.isArray(tasks) ? tasks.filter(t => t && t.name) : [],
    [tasks]
  );

  if (safeTasks.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
        暂无工作流数据
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 图例 */}
      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#6B7280]" />人工部分
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#38BDF8]" />AI部分
        </span>
      </div>

      {/* 任务列表 */}
      <div className="space-y-2">
        {safeTasks.map((task, i) => {
          const { humanW, aiW } = normalizeRatio(task.humanRatio, task.aiRatio);
          const modeLabel = task.collaborationMode ? extractModeLabel(task.collaborationMode) : '';

          return (
            <div key={task.id || i} className="flex items-center gap-2">
              {/* 任务名称 - 固定宽度 */}
              <div className="w-[180px] shrink-0 text-right pr-2">
                <span className="text-xs text-foreground/80 leading-tight">{task.name}</span>
              </div>

              {/* 条形图 - 弹性宽度 */}
              <div className="flex-1 min-w-0">
                <div className="h-7 rounded flex overflow-hidden w-full">
                  {/* 人工部分 */}
                  <div
                    className="h-full bg-[#4B5563] flex items-center justify-center"
                    style={{ width: `${humanW}%` }}
                  >
                    {humanW >= 15 && (
                      <span className="text-[10px] font-medium text-foreground">人 {humanW}%</span>
                    )}
                  </div>
                  {/* AI部分 */}
                  <div
                    className="h-full bg-[#38BDF8] flex items-center justify-center"
                    style={{ width: `${aiW}%` }}
                  >
                    {aiW >= 15 && (
                      <span className="text-[10px] font-semibold text-[#0D0D14]">AI {aiW}%</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 协作模式 - 扩大宽度 + hover tooltip */}
              {task.collaborationMode ? (
                <ModeTooltip label={modeLabel} fullText={task.collaborationMode} />
              ) : (
                <span className="w-[140px] shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
