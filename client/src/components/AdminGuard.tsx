/**
 * 管理员路由守卫组件
 *
 * 包裹需要管理员权限的页面。
 * 如果未通过管理员密码验证，显示密码输入框让管理员验证。
 * 验证通过后放行，后端通过 cookie 中的 JWT 识别管理员身份。
 */
import { useState, useCallback, useEffect } from "react";
import { isAdminMode, checkAdminFromUrl } from "@/lib/adminAuth";
import { Shield, Lock } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [verified, setVerified] = useState(isAdminMode());
  const [checking, setChecking] = useState(!isAdminMode());
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // [定制] 挂载时尝试从 URL 参数 ?adminPwd=xxx 免密验证（支持“特殊链接+密码传值”访问后台）
  useEffect(() => {
    if (verified) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    checkAdminFromUrl().then((ok) => {
      if (cancelled) return;
      if (ok) setVerified(true);
      setChecking(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!password.trim()) {
      setError("请输入管理员密码");
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
          sessionStorage.setItem("admin_authenticated", "true");
          setVerified(true);
          setPassword("");
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

  if (verified) {
    return <>{children}</>;
  }

  // URL 参数免密校验中：先显示加载态，避免闪现密码框
  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
        <Lock className="w-8 h-8 text-amber-500" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground">管理员验证</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          此页面需要平台管理员密码才能访问
        </p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="请输入管理员密码"
          className="w-full px-4 py-3 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          autoFocus
        />
        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full px-4 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "验证中..." : "确认访问"}
        </button>
      </div>
    </div>
  );
}
