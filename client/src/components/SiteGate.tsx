/**
 * 全局进站密码门禁。
 *
 * 打开网站任何页面都需要先输入进站密码才能访问整站。密码由后端
 * SITE_PASSWORD 环境变量控制，前端不再硬编码真实密码。
 *
 * 说明：
 * - 这是第一级密码，所有访客通用，仅用于前端访问控制。
 * - 第二级管理员密码由 ADMIN_PASSWORD 单独控制，用于模型管理/调用日志等后台入口。
 * - 分享链接（/share/:token 或带 ?token= 的报告页）允许免密直达查看报告。
 */
import { useState, useCallback, useEffect } from "react";
import { Lock } from "lucide-react";
import { markShareGuest } from "@/lib/shareGuest";

const SITE_SESSION_KEY = "site_authenticated";

/** 是否已通过进站密码 */
export function isSiteUnlocked(): boolean {
  try {
    return sessionStorage.getItem(SITE_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

/** 判断是否为分享链接访问（允许免密直达查看报告） */
function isShareEntry(): boolean {
  try {
    const path = window.location.pathname || "";
    const search = window.location.search || "";
    if (path.startsWith("/share")) return true;
    if (new URLSearchParams(search).get("token")) return true;
    return false;
  } catch {
    return false;
  }
}

interface SiteGateProps {
  children: React.ReactNode;
}

export default function SiteGate({ children }: SiteGateProps) {
  const [unlocked, setUnlocked] = useState(isSiteUnlocked() || isShareEntry());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 分享链接进入时直接放行，并标记为只读分享访客。
  // 即使用户此前已经通过进站密码，也必须写入 shareGuestMode，
  // 否则从分享报告跳回首页后会丢失只读限制。
  useEffect(() => {
    if (isShareEntry()) {
      markShareGuest();
      try {
        sessionStorage.setItem(SITE_SESSION_KEY, "true");
      } catch {}
      setUnlocked(true);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!password.trim()) {
      setError("请输入访问密码");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/site/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success) {
          try {
            sessionStorage.setItem(SITE_SESSION_KEY, "true");
          } catch {}
          setUnlocked(true);
          setPassword("");
          setError("");
          return;
        }
      }

      setError("密码错误，请重试");
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }, [password]);

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">访问验证</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          请输入访问密码以进入岗位/职能 AI 转型分析平台
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="请输入访问密码"
          className="w-full px-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          autoFocus
        />
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "验证中..." : "进入平台"}
        </button>
      </div>
    </div>
  );
}
