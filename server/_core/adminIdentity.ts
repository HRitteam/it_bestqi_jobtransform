/**
 * 平台管理员身份识别工具函数
 *
 * 供 tRPC context 和 REST 路由共同使用，
 * 从请求 cookie 中识别 platform_admin_session 并构造管理员虚拟用户。
 */
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import { PLATFORM_ADMIN_COOKIE, getAdminSecret } from "../adminAuthRoute";

/**
 * 检查请求中是否携带有效的平台管理员 cookie
 */
export async function checkPlatformAdmin(
  cookieHeader: string | undefined
): Promise<boolean> {
  if (!cookieHeader) return false;

  try {
    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies[PLATFORM_ADMIN_COOKIE];
    if (!token) return false;

    const secret = getAdminSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    return payload.role === "platform_admin";
  } catch {
    return false;
  }
}

/**
 * 构造平台管理员虚拟用户对象
 */
export function createPlatformAdminUser(): User {
  return {
    id: 0,
    openId: "platform_admin",
    companyId: null,
    phone: null,
    name: "平台管理员",
    email: null,
    loginMethod: "password",
    role: "admin",
    tier: "enterprise",
    inviteCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

/**
 * 从 Express Request 中尝试识别平台管理员身份
 * 返回管理员虚拟用户或 null
 */
export async function authenticateAdmin(req: Request): Promise<User | null> {
  const isPlatformAdmin = await checkPlatformAdmin(req.headers.cookie);
  if (isPlatformAdmin) {
    return createPlatformAdminUser();
  }
  return null;
}
