/**
 * [定制] 分享访客只读模式
 * 当用户通过分享链接（/share/:token 或 /report/:id?token=xxx）进入时，
 * 标记为"分享访客"。此模式下禁止发起任何新分析（开始分析、批量分析等）。
 */

const KEY = "shareGuestMode";

/** 默认访客用户的固定标识（与后端 guestUser.ts DEFAULT_GUEST_OPEN_ID 保持一致） */
const DEFAULT_GUEST_OPEN_ID = "bestqi_guest_default";

/** 标记当前会话为分享访客模式 */
export function markShareGuest(): void {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}

/** 判断当前是否为分享访客只读模式 */
export function isShareGuest(): boolean {
  try {
    // 当前 URL 带 token 视为分享访问
    const params = new URLSearchParams(window.location.search);
    if (params.get("token")) return true;
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** 清除分享访客标记（例如管理员或正常用户重新进入时可调用） */
export function clearShareGuest(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * [修复] 判断是否为"真实登录用户"。
 * 后端对匿名访客统一返回一个默认访客用户(openId=bestqi_guest_default, loginMethod=default)，
 * 因此 useAuth().user 对任何访客都非空，不能用 `!user` 判断是否登录。
 * 真实登录用户：role=admin，或 openId/loginMethod 不是默认访客标识。
 */
export function isRealUser(user: any): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  const isDefaultGuest =
    user.openId === DEFAULT_GUEST_OPEN_ID || user.loginMethod === "default";
  return !isDefaultGuest;
}

/**
 * [修复] 综合判定：当前是否应以"分享访客只读"方式限制写操作。
 * 仅当处于分享上下文(isShareGuest) 且 不是真实登录用户 时才限制，
 * 既杜绝默认访客绕过限制，又不误伤真实登录用户。
 */
export function isReadOnlyShareGuest(user: any): boolean {
  // 分享链接上下文必须始终只读。不能因为浏览器里已有管理员/登录态就放开，
  // 否则接收人从分享报告跳回首页后可以继续发起新的分析。
  return isShareGuest();
}
