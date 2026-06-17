import { useMemo } from "react";
import { ArrowRight, Plus, Minus, RefreshCw, Trash2, TrendingUp } from "lucide-react";

/**
 * P2-04: 组织架构变化图 — 当前→转型后对比
 * 数据来源：reportData.restructuring.taskClassification + newRoles
 */
interface OrgChange {
  roleName: string;
  currentCount?: number;
  futureCount?: number;
  changeType: "expand" | "reduce" | "transform" | "new" | "remove";
  description?: string;
}

interface OrgChangeChartProps {
  taskClassification?: {
    retain?: string[];
    enhance?: string[];
    automate?: string[];
    eliminate?: string[];
  };
  newRoles?: Array<{ title: string; responsibilities?: string; skills?: string[] }>;
  newCapabilityModel?: string[];
}

const CHANGE_CONFIG: Record<string, { label: string; color: string; borderColor: string; bgColor: string; icon: any }> = {
  expand: { label: "扩充", color: "text-green-400", borderColor: "border-green-500/40", bgColor: "bg-green-500/10", icon: TrendingUp },
  reduce: { label: "缩减", color: "text-red-400", borderColor: "border-red-500/40", bgColor: "bg-red-500/10", icon: Minus },
  transform: { label: "转型", color: "text-amber-400", borderColor: "border-amber-500/40", bgColor: "bg-amber-500/10", icon: RefreshCw },
  new: { label: "新增", color: "text-blue-400", borderColor: "border-blue-500/40", bgColor: "bg-blue-500/10", icon: Plus },
  remove: { label: "移除", color: "text-red-400", borderColor: "border-red-500/40", bgColor: "bg-red-500/10", icon: Trash2 },
};

export function OrgChangeChart({ taskClassification, newRoles, newCapabilityModel }: OrgChangeChartProps) {
  const changes = useMemo<OrgChange[]>(() => {
    const result: OrgChange[] = [];

    if (taskClassification) {
      // 保留的任务 → 对应角色保持/扩充
      (taskClassification.retain || []).forEach(task => {
        result.push({ roleName: task, changeType: "expand", description: "保留并强化" });
      });
      // 增强的任务 → 转型
      (taskClassification.enhance || []).forEach(task => {
        result.push({ roleName: task, changeType: "transform", description: "AI增强升级" });
      });
      // 自动化的任务 → 缩减
      (taskClassification.automate || []).forEach(task => {
        result.push({ roleName: task, changeType: "reduce", description: "AI自动化替代" });
      });
      // 淘汰的任务 → 移除
      (taskClassification.eliminate || []).forEach(task => {
        result.push({ roleName: task, changeType: "remove", description: "逐步淘汰" });
      });
    }

    // 新增角色
    if (newRoles && newRoles.length > 0) {
      newRoles.forEach(role => {
        result.push({ roleName: role.title, changeType: "new", description: role.responsibilities || "新设岗位" });
      });
    } else if (newCapabilityModel && newCapabilityModel.length > 0) {
      // Fallback: use newCapabilityModel as new capabilities/roles when no explicit newRoles
      newCapabilityModel.slice(0, 8).forEach(cap => {
        result.push({ roleName: cap, changeType: "new", description: "转型后新增能力" });
      });
    }

    return result;
  }, [taskClassification, newRoles, newCapabilityModel]);

  if (changes.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
        暂无组织变化数据
      </div>
    );
  }

  // 分组：当前保留/转型 vs 新增
  const currentRoles = changes.filter(c => c.changeType !== "new");
  const newRolesList = changes.filter(c => c.changeType === "new");

  return (
    <div>
      {/* 图例 */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-xs">
        {Object.entries(CHANGE_CONFIG).map(([key, cfg]) => (
          <span key={key} className={`flex items-center gap-1 ${cfg.color}`}>
            <span className={`w-2.5 h-2.5 rounded-sm ${cfg.bgColor} border ${cfg.borderColor}`} />
            {cfg.label}
          </span>
        ))}
      </div>

      {/* 左右对比布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧：当前组织（变化标记） */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
            当前职能
          </h4>
          <div className="space-y-2">
            {currentRoles.slice(0, 8).map((change, i) => {
              const cfg = CHANGE_CONFIG[change.changeType] || CHANGE_CONFIG.transform;
              const Icon = cfg.icon;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${cfg.borderColor} ${cfg.bgColor} transition-all`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${change.changeType === "remove" ? "line-through opacity-60" : "text-foreground"}`}>
                      {change.roleName}
                    </p>
                    {change.description && (
                      <p className="text-[10px] text-muted-foreground">{change.description}</p>
                    )}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.color} ${cfg.bgColor} border ${cfg.borderColor} shrink-0`}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
            {currentRoles.length > 8 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                +{currentRoles.length - 8} 项更多变化...
              </p>
            )}
          </div>
        </div>

        {/* 右侧：转型后新增 */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            转型后新增能力
          </h4>
          {newRolesList.length > 0 ? (
            <div className="space-y-2">
              {newRolesList.map((change, i) => {
                const cfg = CHANGE_CONFIG.new;
                const Icon = cfg.icon;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${cfg.borderColor} ${cfg.bgColor}`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{change.roleName}</p>
                      {change.description && (
                        <p className="text-[10px] text-muted-foreground">{change.description}</p>
                      )}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.color} ${cfg.bgColor} border ${cfg.borderColor} shrink-0`}>
                      新增
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 border border-dashed border-white/10 rounded-lg">
              <p className="text-xs text-muted-foreground">无新增角色</p>
            </div>
          )}

          {/* 转型方向箭头指示 */}
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>当前</span>
            <ArrowRight className="w-4 h-4 text-primary" />
            <span>转型后</span>
          </div>
        </div>
      </div>

      {/* 底部统计 */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
        {Object.entries(CHANGE_CONFIG).map(([key, cfg]) => {
          const count = changes.filter(c => c.changeType === key).length;
          return (
            <div key={key} className={`p-3 rounded-lg bg-card border border-border border-l-4 ${cfg.borderColor.replace('/40', '')}`}>
              <p className="text-[10px] text-muted-foreground mb-1">{cfg.label}</p>
              <p className={`text-xl font-bold ${cfg.color}`}>{count}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
