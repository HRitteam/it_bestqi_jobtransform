/**
 * iframe 身份识别中间件
 *
 * 当请求中携带 x-company-id 和 x-user-phone Header 时，
 * 自动识别/注册用户并建立会话，实现 iframe 嵌入场景下的静默登录。
 *
 * 工作流程：
 * 1. 检测请求 Header 中是否有 x-company-id 和 x-user-phone
 * 2. 如果有，根据 companyId + phone 组合查找用户
 * 3. 如果用户不存在，自动注册
 * 4. 将用户信息注入 req 对象，供后续中间件和路由使用
 */

import type { Request, Response, NextFunction } from "express";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      iframeUser?: User;
      companyId?: string;
      userPhone?: string;
    }
  }
}

/**
 * 根据 companyId + phone 查找用户
 */
async function findUserByCompanyAndPhone(
  companyId: string,
  phone: string
): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.companyId, companyId), eq(users.phone, phone)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * 自动注册用户（iframe 场景下首次访问）
 */
async function autoRegisterUser(
  companyId: string,
  phone: string
): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  // 使用 companyId_phone 作为 openId，确保唯一性
  const openId = `${companyId}_${phone}`;

  try {
    await db.insert(users).values({
      openId,
      companyId,
      phone,
      name: phone, // 默认用手机号作为名称
      loginMethod: "iframe",
      role: "user",
      tier: "enterprise",
      lastSignedIn: new Date(),
    });

    // 查询刚创建的用户
    return await findUserByCompanyAndPhone(companyId, phone);
  } catch (error: any) {
    // 如果是唯一键冲突（并发注册），尝试查询已有用户
    if (error?.code === "ER_DUP_ENTRY" || error?.errno === 1062) {
      return await findUserByCompanyAndPhone(companyId, phone);
    }
    console.error("[IframeAuth] Failed to auto-register user:", error);
    return undefined;
  }
}

/**
 * iframe 身份识别中间件
 *
 * 在 Express 请求处理链中，检测 iframe 身份 Header，
 * 自动识别或注册用户，将用户信息注入 req 对象。
 */
export function iframeAuthMiddleware() {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const companyId = req.headers["x-company-id"] as string | undefined;
    const phone = req.headers["x-user-phone"] as string | undefined;

    // 如果没有 iframe 身份 Header，跳过
    if (!companyId || !phone) {
      return next();
    }

    // 将企业信息注入 req（即使用户查找失败也保留）
    req.companyId = companyId;
    req.userPhone = phone;

    try {
      // 查找已有用户
      let user = await findUserByCompanyAndPhone(companyId, phone);

      // 如果用户不存在，自动注册
      if (!user) {
        user = await autoRegisterUser(companyId, phone);
      } else {
        // 更新最后登录时间
        const db = await getDb();
        if (db) {
          await db
            .update(users)
            .set({ lastSignedIn: new Date() })
            .where(eq(users.id, user.id));
        }
      }

      if (user) {
        req.iframeUser = user;
      }
    } catch (error) {
      console.error("[IframeAuth] Error during authentication:", error);
    }

    next();
  };
}
