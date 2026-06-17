/**
 * 管理员密码验证路由
 *
 * 提供 POST /api/admin/verify 接口，用于验证平台管理员密码。
 * 密码通过环境变量 ADMIN_PASSWORD 配置。
 * 验证成功后签发 platform_admin_session JWT cookie，后端 tRPC context 可识别。
 */
import type { Express } from "express";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";

const PLATFORM_ADMIN_COOKIE = "platform_admin_session";
const ADMIN_SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function getAdminSecret() {
  // 使用 JWT_SECRET + 固定后缀作为管理员 token 的签名密钥
  return new TextEncoder().encode(ENV.cookieSecret + "_platform_admin");
}

async function signAdminToken(): Promise<string> {
  const now = Date.now();
  const expirationSeconds = Math.floor((now + ADMIN_SESSION_EXPIRY_MS) / 1000);

  return new SignJWT({ role: "platform_admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(getAdminSecret());
}

export { PLATFORM_ADMIN_COOKIE, getAdminSecret };

export function registerAdminAuthRoute(app: Express) {
  app.post("/api/admin/verify", async (req, res) => {
    const { password } = req.body;

    if (!password || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "密码不能为空" });
    }

    if (!ENV.adminPassword) {
      return res.status(500).json({ success: false, message: "管理员密码未配置" });
    }

    if (password === ENV.adminPassword) {
      try {
        const token = await signAdminToken();
        const cookieOpts = getSessionCookieOptions(req);
        res.cookie(PLATFORM_ADMIN_COOKIE, token, {
          ...cookieOpts,
          maxAge: ADMIN_SESSION_EXPIRY_MS,
        });
        return res.json({ success: true });
      } catch (error) {
        console.error("[AdminAuth] Failed to sign admin token:", error);
        return res.status(500).json({ success: false, message: "服务器错误" });
      }
    }

    return res.status(401).json({ success: false, message: "密码错误" });
  });

  // 退出管理员模式
  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie(PLATFORM_ADMIN_COOKIE, { path: "/" });
    return res.json({ success: true });
  });
}
