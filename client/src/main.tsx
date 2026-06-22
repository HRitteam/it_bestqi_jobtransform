// [修复] 必须位于所有业务 import 之前：ES 模块按 import 顺序求值，
// 本模块加载时会立即安装存储守卫，确保后续任何模块读取 localStorage 前已生效。
import { installStorageGuard } from "./lib/safeStorage";
import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import { getIframeHeaders, isIframeMode } from "./lib/iframeContext";
import { installFetchInterceptor } from "./lib/fetchInterceptor";
import "./index.css";

// [修复] 再次显式调用以保险（幂等）：确保即使 tree-shaking 也保留守卫安装。
installStorageGuard();

// 安装全局 fetch 拦截器，确保所有 API 请求自动携带 iframe 身份 Header
installFetchInterceptor();

// 抑制已知的 ECharts Sankey 内部错误（getRawIndex on undefined edgeData）
// 这是 ECharts 已确认的 bug，在 mousemove/mouseout 事件触发时发生，不影响功能
window.addEventListener('error', (event) => {
  if (event.message?.includes('getRawIndex') || event.error?.message?.includes('getRawIndex')) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
});

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;
  // iframe 模式下不跳转登录页
  if (isIframeMode()) return;
  // 分享链接模式下不跳转登录页（新窗口打开分享链接时 URL 中包含 token 参数）
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("token")) return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        const iframeHeaders = getIframeHeaders();
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
          headers: {
            ...(init?.headers || {}),
            ...iframeHeaders,
          },
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
