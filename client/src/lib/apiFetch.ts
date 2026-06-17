/**
 * 封装 fetch，自动附加 iframe 身份 headers 和 credentials
 * 用于所有直接调用 REST API（非 tRPC）的场景
 */
import { getIframeHeaders } from "./iframeContext";

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const iframeHeaders = getIframeHeaders();
  const mergedInit: RequestInit = {
    ...init,
    credentials: "include" as RequestCredentials,
    headers: {
      ...iframeHeaders,
      ...(init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init?.headers || {}),
    },
  };
  return fetch(input, mergedInit);
}
