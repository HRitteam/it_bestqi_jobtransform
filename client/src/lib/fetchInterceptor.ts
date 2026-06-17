/**
 * 全局 fetch 拦截器
 * 自动为所有同源 API 请求附加 iframe 身份 Header
 * 在应用入口处调用 installFetchInterceptor() 即可
 */

import { getIframeHeaders, isIframeMode } from "./iframeContext";

let installed = false;

export function installFetchInterceptor(): void {
  if (installed) return;
  installed = true;

  const originalFetch = globalThis.fetch;

  globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // 仅在 iframe 模式下拦截
    if (!isIframeMode()) {
      return originalFetch(input, init);
    }

    const iframeHeaders = getIframeHeaders();

    // 合并 headers
    const existingHeaders = new Headers(init?.headers || {});
    Object.entries(iframeHeaders).forEach(([key, value]) => {
      if (!existingHeaders.has(key)) {
        existingHeaders.set(key, value);
      }
    });

    return originalFetch(input, {
      ...(init ?? {}),
      headers: existingHeaders,
    });
  };
}
