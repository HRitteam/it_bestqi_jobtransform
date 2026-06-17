/**
 * [定制] 默认普通访客用户
 *
 * 本项目已移除 iframe 嵌套与企业身份注入，改为「密码门仅保护管理后台 + 普通用户匿名可用」的模式。
 * 未登录的匿名访客统一映射为同一个默认普通用户（openId 固定），
 * 使「开始分析 / 查看进度 / 查看报告」等核心功能无需登录即可使用。
 *
 * REST（apiRoutes.resolveUser）与 tRPC（_core/context.createContext）两条链路
 * 共享本模块，确保访客身份一致，避免一条链路写入、另一条链路读不到的归属校验问题。
 */
import { getDb } from "./db";
import { users as usersTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { User } from "../drizzle/schema";

/** 默认普通访客用户的固定 openId */
export const DEFAULT_GUEST_OPEN_ID = "bestqi_guest_default";

/** 访客用户内存缓存，避免每次请求都查库 */
let cachedGuestUser: User | null = null;

/**
 * 获取或创建默认普通访客用户。
 * 返回 null 仅在数据库不可用时发生。
 */
export async function getOrCreateGuestUser(): Promise<User | null> {
  if (cachedGuestUser) return cachedGuestUser;
  const db = await getDb();
  if (!db) return null;
  try {
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.openId, DEFAULT_GUEST_OPEN_ID))
      .limit(1);
    if (existing.length > 0) {
      cachedGuestUser = existing[0] as User;
      return cachedGuestUser;
    }
    await db.insert(usersTable).values({
      openId: DEFAULT_GUEST_OPEN_ID,
      name: "普通用户",
      role: "user",
      tier: "free",
    });
    const created = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.openId, DEFAULT_GUEST_OPEN_ID))
      .limit(1);
    cachedGuestUser = (created[0] as User) || null;
    return cachedGuestUser;
  } catch (e) {
    console.error("[guestUser] getOrCreateGuestUser failed:", e);
    return null;
  }
}
