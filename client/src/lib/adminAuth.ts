/**
 * 管理员认证模块
 *
 * 管理员通过 URL 参数 ?adminPwd=xxx 或密码输入框进入管理模式。
 * 验证通过后：
 * 1. 后端签发 platform_admin_session cookie（用于 tRPC adminProcedure 鉴权）
 * 2. 前端 sessionStorage 缓存状态（用于 UI 显示控制）
 */

const ADMIN_SESSION_KEY = "admin_authenticated";

/**
 * 检查 URL 中是否有管理员密码参数，如果有则验证并缓存
 */
export async function checkAdminFromUrl(): Promise<boolean> {
  // 如果已经验证过，直接返回
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    return true;
  }

  // 从 URL 参数中获取管理员密码
  const params = new URLSearchParams(window.location.search);
  const adminPwd = params.get("adminPwd");

  if (!adminPwd) {
    return false;
  }

  // 调用后端验证密码（credentials: include 确保接收 cookie）
  try {
    const response = await fetch("/api/admin/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password: adminPwd }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        // 清除 URL 中的密码参数（安全考虑）
        params.delete("adminPwd");
        const newUrl = params.toString()
          ? `${window.location.pathname}?${params.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        return true;
      }
    }
  } catch (error) {
    console.error("[AdminAuth] Verification failed:", error);
  }

  return false;
}

/**
 * 判断当前是否为管理员模式
 */
export function isAdminMode(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

/**
 * 退出管理员模式
 */
export function exitAdminMode(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
