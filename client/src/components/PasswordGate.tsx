/**
 * 全屏密码登录门
 *
 * 访问应用前必须输入密码（密码由后端 env ADMIN_PASSWORD 控制，本项目为 bestqiai2026）。
 * 验证流程：
 * 1. 调用后端 POST /api/admin/verify，校验通过后后端签发 platform_admin_session cookie（有效期 24h）
 * 2. 前端在 localStorage 记录登录标记，实现 Session/Token 持久化，刷新或重开页面不重复登录
 * 3. 应用启动时优先用后端 /api/admin/status 校验 cookie 是否仍有效，避免 cookie 过期后仍放行
 */
import { useState, useEffect, useCallback } from "react";
import { Lock } from "lucide-react";

interface PasswordGateProps {
  children: React.ReactNode;
}

const GATE_STORAGE_KEY = "bestqi_gate_authed";

export default function PasswordGate({ children }: PasswordGateProps) {
  // 初始用 localStorage 标记快速放行（避免闪烁），随后异步用后端校验 cookie 有效性
  const [authed, setAuthed] = useState<boolean>(
    () => localStorage.getItem(GATE_STORAGE_KEY) === "true"
  );
  const [checking, setChecking] = useState<boolean>(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 启动时用后端校验当前 cookie 是否仍有效（持久化会话）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/status", {
          method: "GET",
          credentials: "include",
        });
        if (!cancelled && res.ok) {
          const data = await res.json();
          if (data?.authenticated) {
            localStorage.setItem(GATE_STORAGE_KEY, "true");
            setAuthed(true);
          } else {
            // cookie 失效：清除本地标记，要求重新登录
            localStorage.removeItem(GATE_STORAGE_KEY);
            setAuthed(false);
          }
        }
      } catch {
        // 网络错误时，沿用本地标记，不强制登出
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!password.trim()) {
      setError("请输入访问密码");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          localStorage.setItem(GATE_STORAGE_KEY, "true");
          // 兼容旧逻辑：同时标记管理员会话，便于平台管理菜单识别
          sessionStorage.setItem("admin_authenticated", "true");
          setPassword("");
          setAuthed(true);
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

  // 启动校验中：显示加载态（已登录则不挡）
  if (checking && !authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (authed) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">BestQI 岗位 AI 转型分析平台</h1>
          <p className="text-sm text-muted-foreground mt-2">请输入访问密码以继续</p>
        </div>
        <div className="w-full space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="请输入访问密码"
            className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            autoFocus
          />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors disabled:opacity-50"
          >
            {loading ? "验证中..." : "进入系统"}
          </button>
        </div>
      </div>
    </div>
  );
}
