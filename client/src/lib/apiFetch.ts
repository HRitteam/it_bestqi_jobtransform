/**
 * 封装 fetch，自动附加 iframe 身份 headers 和 credentials
 * 用于所有直接调用 REST API（非 tRPC）的场景
 */
import { getIframeHeaders } from "./iframeContext";
import { isShareGuest } from "./shareGuest";

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const iframeHeaders = getIframeHeaders();
  // [修复] 分享访客上下文下附带 x-share-guest 头，供后端识别并拒绝写操作（如发起新分析），
  // 防止访客绕过前端拦截直接调用 REST 接口。
  const shareHeaders: Record<string, string> = isShareGuest() ? { "x-share-guest": "1" } : {};
  const mergedInit: RequestInit = {
    ...init,
    credentials: "include" as RequestCredentials,
    headers: {
      ...iframeHeaders,
      ...shareHeaders,
      ...(init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init?.headers || {}),
    },
  };
  return fetch(input, mergedInit);
}
