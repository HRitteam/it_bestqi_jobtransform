import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { checkPlatformAdmin, createPlatformAdminUser } from "./adminIdentity";
import { getOrCreateGuestUser } from "../guestUser";

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

  // [定制] 已移除 iframe 身份识别分支；优先检查平台管理员 cookie（密码登录门签发）
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
    // [定制] 匿名访客降级为默认普通用户，与 REST(resolveUser)保持一致，
    // 使访客能通过 tRPC 读取自己提交的报告（protectedProcedure / report.get 归属校验）。
    if (!user) {
      user = await getOrCreateGuestUser();
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    companyId: user?.companyId || undefined,
    userPhone: user?.phone || undefined,
  };
}
