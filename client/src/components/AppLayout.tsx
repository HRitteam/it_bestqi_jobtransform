import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isIframeMode } from "@/lib/iframeContext";
import { checkAdminFromUrl, isAdminMode, exitAdminMode } from "@/lib/adminAuth";
import { motion } from "framer-motion";
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  Clock,
  Home,
  LogOut,
  FileText,
  Menu,
  X,
  LayoutDashboard,
  GitCompareArrows,
  Building2,
  Wrench,
  Shield,
  Database,
  ScrollText,
  Palette,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

// Nav item type
interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  adminOnly?: boolean;
  platformAdmin?: boolean;
}

interface NavGroup {
  label: string;
  adminOnly?: boolean;
  platformAdmin?: boolean;
  items: NavItem[];
}

// Grouped navigation structure
const NAV_GROUPS: NavGroup[] = [
  {
    label: "工作台",
    items: [
      { icon: Home, label: "开始分析", path: "/" },
      { icon: LayoutDashboard, label: "HR工作台", path: "/dashboard" },
    ],
  },
  {
    label: "分析",
    items: [
      { icon: FileText, label: "批量分析", path: "/batch" },
      { icon: Clock, label: "历史记录", path: "/history" },
      { icon: GitCompareArrows, label: "报告对比", path: "/compare" },
      { icon: Building2, label: "部门报告", path: "/department-report" },
    ],
  },
  {
    label: "其他",
    items: [
      { icon: Brain, label: "产品介绍", path: "/about" },
    ],
  },
  {
    label: "管理",
    adminOnly: true,
    items: [
      { icon: Palette, label: "品牌定制", path: "/brand-settings", adminOnly: true },
      { icon: Wrench, label: "工具管理", path: "/admin-tools", adminOnly: true },
    ],
  },
  {
    label: "平台管理",
    platformAdmin: true,
    items: [
      { icon: Database, label: "模型管理", path: "/llm-manager", platformAdmin: true },
      { icon: ScrollText, label: "调用日志", path: "/llm-logs", platformAdmin: true },
    ],
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [adminVerified, setAdminVerified] = useState(isAdminMode());

  // 检查管理员 URL 参数（?adminPwd=xxx 自动验证）
  useEffect(() => {
    checkAdminFromUrl().then((result) => {
      if (result) setAdminVerified(true);
    });
  }, []);

  // 监听 sessionStorage 变化（AdminGuard 验证成功后同步状态）
  useEffect(() => {
    const interval = setInterval(() => {
      const current = isAdminMode();
      if (current !== adminVerified) {
        setAdminVerified(current);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [adminVerified]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Loading state（iframe 模式下缩短 loading 时间）
  if (loading && !isIframeMode()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Brain className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  // Filter groups based on role and admin verification
  // iframe 嵌入模式下：始终隐藏管理和平台管理模块（普通会员不应看到）
  // 独立访问模式下：平台管理需要 adminVerified，企业管理需要 admin 角色
  const isInIframe = isIframeMode();
  const filteredGroups = NAV_GROUPS
    .filter((group) => {
      // iframe 模式下隐藏所有管理类菜单
      if (isInIframe && (group.platformAdmin || group.adminOnly)) return false;
      // 独立模式：平台管理组需要管理员验证通过
      if (group.platformAdmin) return adminVerified;
      // 企业管理组：仅 admin 角色显示
      if (group.adminOnly) return user?.role === "admin";
      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (isInIframe && (item.platformAdmin || item.adminOnly)) return false;
        if (item.platformAdmin) return adminVerified;
        if (item.adminOnly) return user?.role === "admin";
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen flex flex-col noise-overlay">
      {/* Top bar - Quantix glass-panel style */}
      <header className="sticky top-0 z-50 glass-panel border-b border-border/50">
        <div className="flex items-center h-14 px-4 lg:px-6">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden mr-3 p-1.5 rounded-md hover:bg-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {/* Brand - simplified in top bar since logo is in sidebar */}
          <div className="flex items-center gap-2.5">
            <span className="font-display font-semibold text-base tracking-tight hidden sm:inline">
              Job AITrans
            </span>
          </div>
          <div className="flex-1" />
          {/* Admin mode indicator - iframe模式下隐藏 */}
          {adminVerified && !isInIframe && (
            <div className="flex items-center gap-2 mr-3">
              <Shield className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-500 font-medium hidden sm:inline">平台管理</span>
              <button
                onClick={async () => {
                  exitAdminMode();
                  setAdminVerified(false);
                  // 清除后端 cookie
                  try { await fetch("/api/admin/logout", { method: "POST", credentials: "include" }); } catch {}
                }}
                className="text-xs text-muted-foreground hover:text-foreground ml-1"
              >
                退出
              </button>
            </div>
          )}
          {/* User info */}
          {user && (
            <div className="flex items-center gap-2 p-1.5">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary/15 text-primary font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:inline">
                {user?.name || "用户"}
              </span>
            </div>
          )}
        </div>
      </header>
      <div className="flex flex-1">
        {/* Sidebar - desktop */}
        <aside
          className={`fixed lg:sticky top-14 z-40 h-[calc(100vh-3.5rem)] overflow-y-auto transition-all duration-300 ${
            isMobile
              ? mobileMenuOpen
                ? "translate-x-0 w-64"
                : "-translate-x-full w-64"
              : sidebarCollapsed
                ? "w-16"
                : "w-60"
          }`}
          style={{
            background: 'var(--color-background)',
            borderRight: '1px solid rgba(74, 222, 128, 0.1)',
          }}
        >
          {/* Brand area - Logo + text */}
          <div className="p-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-[15px] font-display font-bold text-foreground leading-tight tracking-tight">
                    Job AITrans
                  </span>
                  <span className="text-[11px] text-primary/80 leading-tight">
                    岗位/职能AI转型分析平台
                  </span>
                </div>
              )}
            </div>
          </div>
          <nav className="px-3 pt-2 space-y-5">
            {filteredGroups.map((group, groupIndex) => (
              <div key={group.label} className={groupIndex > 0 ? "pt-1" : ""}>
                {/* Section label */}
                {!sidebarCollapsed && (
                  <div className="px-3 pb-2">
                    <span className={`text-[12px] font-normal ${
                      group.platformAdmin ? "text-amber-500/70" : "text-muted-foreground/70"
                    }`}>
                      {group.label}
                    </span>
                  </div>
                )}
                {sidebarCollapsed && groupIndex > 0 && (
                  <div className="mx-2 mb-2 border-t border-border/30" />
                )}
                {/* Nav items */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          setLocation(item.path);
                          if (isMobile) setMobileMenuOpen(false);
                        }}
                        className={`relative w-full flex items-center gap-3.5 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "text-foreground font-medium bg-primary/10 dark:bg-white/[0.08] shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                        {!sidebarCollapsed && (
                          <span className="text-[15px] whitespace-nowrap overflow-hidden">
                            {item.label}
                          </span>
                        )}
                        {/* Active indicator - green bar on right */}
                        {isActive && (
                          <div
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                            style={{
                              background: 'linear-gradient(to bottom, #4ADE80, #22C55E)',
                              boxShadow: '0 0 6px rgba(74, 222, 128, 0.5)',
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          {/* Collapse toggle - desktop only */}
          {!isMobile && (
            <div className="absolute bottom-4 left-0 right-0 px-3">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="w-full flex items-center justify-center py-2 rounded-lg hover:bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
              >
                {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>
            </div>
          )}
        </aside>
        {/* Mobile overlay */}
        {isMobile && mobileMenuOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        {/* Main content */}
        <main className="relative flex-1 min-w-0 px-4 lg:px-8 py-6 max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
