/**
 * iframe 嵌入身份上下文
 * 从 URL 参数中解析 companyId 和 phone，供请求拦截器使用
 *
 * 修复：将身份信息持久化到 sessionStorage，防止 SPA 路由切换后
 * URL query params 丢失导致 isIframeMode() 返回 false
 */

interface IframeIdentity {
  companyId: string | null;
  phone: string | null;
}

let cachedIdentity: IframeIdentity | null = null;
const IFRAME_STORAGE_KEY = "iframe_identity";

/**
 * 大小写不敏感地从 URLSearchParams 中获取参数值
 * 支持多种命名风格：companyId, CompanyId, company_id, COMPANY_ID 等
 */
function getParamCaseInsensitive(params: URLSearchParams, ...names: string[]): string | null {
  // 构建所有参数的小写映射
  const lowerMap = new Map<string, string>();
  params.forEach((value, key) => {
    lowerMap.set(key.toLowerCase(), value);
  });

  for (const name of names) {
    const val = lowerMap.get(name.toLowerCase());
    if (val) return val;
  }
  return null;
}

/**
 * 从当前 URL 解析 iframe 传递的身份参数
 * URL 格式: ?companyId=xxx&phone=138xxxx 或 ?CompanyId=xxx&Phone=138xxxx
 * 支持大小写不敏感匹配
 *
 * 首次从 URL 获取后持久化到 sessionStorage，后续路由切换时从 sessionStorage 恢复
 */
export function getIframeIdentity(): IframeIdentity {
  if (cachedIdentity) return cachedIdentity;

  const params = new URLSearchParams(window.location.search);
  const companyId = getParamCaseInsensitive(params, "companyId", "company_id", "companyid");
  const phone = getParamCaseInsensitive(params, "phone", "userPhone", "userphone");

  if (companyId && phone) {
    // URL 中有参数，持久化到 sessionStorage（防止 SPA 路由切换后丢失）
    cachedIdentity = { companyId, phone };
    try {
      sessionStorage.setItem(IFRAME_STORAGE_KEY, JSON.stringify(cachedIdentity));
    } catch {}
  } else {
    // URL 中没有参数，尝试从 sessionStorage 恢复
    try {
      const stored = sessionStorage.getItem(IFRAME_STORAGE_KEY);
      if (stored) {
        cachedIdentity = JSON.parse(stored) as IframeIdentity;
      } else {
        cachedIdentity = { companyId: null, phone: null };
      }
    } catch {
      cachedIdentity = { companyId: null, phone: null };
    }
  }

  return cachedIdentity;
}

/**
 * 判断当前是否为 iframe 嵌入模式
 * [定制] 已移除 iframe 嵌套/域名限制，永远返回 false
 */
export function isIframeMode(): boolean {
  return false;
}

/**
 * 获取需要附加到请求头的身份信息
 * [定制] 已移除 iframe 逻辑，不再附加任何身份 Header
 */
export function getIframeHeaders(): Record<string, string> {
  return {};
}

/**
 * 重置缓存（用于测试或参数变更场景）
 */
export function resetIframeIdentity(): void {
  cachedIdentity = null;
  try {
    sessionStorage.removeItem(IFRAME_STORAGE_KEY);
  } catch {}
}
