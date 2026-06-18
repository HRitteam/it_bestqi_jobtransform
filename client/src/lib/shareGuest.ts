/**
 * [定制] 分享访客只读模式
 * 当用户通过分享链接（/share/:token 或 /report/:id?token=xxx）进入时，
 * 标记为"分享访客"。此模式下禁止发起任何新分析（开始分析、批量分析等）。
 */

const KEY = "shareGuestMode";

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
