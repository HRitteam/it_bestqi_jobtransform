import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { checkPlatformAdmin, createPlatformAdminUser } from "./adminIdentity";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  companyId?: string;
  userPhone?: string;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // 优先使用 iframe 身份识别（中间件已注入）
  const iframeUser = (opts.req as any).iframeUser;
  if (iframeUser) {
    user = iframeUser;
  } else {
    // 检查平台管理员 cookie
    const isPlatformAdmin = await checkPlatformAdmin(
      opts.req.headers.cookie
    );
    if (isPlatformAdmin) {
      user = createPlatformAdminUser();
    } else {
      // 回退到原有 OAuth/Cookie 认证
      try {
        user = await sdk.authenticateRequest(opts.req);
      } catch (error) {
        // Authentication is optional for public procedures.
        user = null;
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    companyId: (opts.req as any).companyId || user?.companyId || undefined,
    userPhone: (opts.req as any).userPhone || user?.phone || undefined,
  };
}
