/**
 * [定制] 默认普通用户
 *
 * 本项目已移除 iframe 嵌套与企业身份注入，改为「平台管理（模型管理/调用日志）受密码保护 + 其余功能普通用户可用」的模式。
 * 未登录的匿名访客统一映射为同一个默认普通用户，
 * 使「开始分析 / 查看进度 / 查看报告 / HR工作台」等功能无需登录即可使用。
 *
 * 身份解析优先级：
 *   1) 环境变量 DEFAULT_USER_ID 指定的用户（推荐：在数据库中手动建好该用户，直接复用其 ID）
 *   2) 固定 openId（bestqi_guest_default）的用户，没有则自动创建
 *   3) 内存兜底用户对象（即使数据库写入失败也不会导致 401）
 *
 * REST（apiRoutes.resolveUser）与 tRPC（_core/context.createContext）两条链路共享本模块，
 * 确保身份一致，避免一条链路写入、另一条链路因归属校验读不到数据。
 */
import { getDb } from "./db";
import { users as usersTable } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { User } from "../drizzle/schema";

/** 默认普通用户的固定 openId（未通过 DEFAULT_USER_ID 指定时使用） */
export const DEFAULT_GUEST_OPEN_ID = "bestqi_guest_default";

/** 环境变量指定的默认用户 ID（可选）。例如在 .env 中设置 DEFAULT_USER_ID=1 */
function getDefaultUserId(): number | null {
  const raw = process.env.DEFAULT_USER_ID;
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** 内存兜底用户：当数据库不可用或写入失败时仍能返回一个稳定身份，避免 401 */
function buildFallbackUser(id: number): User {
  return {
    id,
    openId: DEFAULT_GUEST_OPEN_ID,
    companyId: null,
    phone: null,
    name: "普通用户",
    email: null,
    loginMethod: "default",
    role: "user",
    tier: "free",
    inviteCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } as User;
}

/** 用户内存缓存，避免每次请求都查库 */
let cachedGuestUser: User | null = null;

/**
 * 获取或创建默认普通用户。
 * 该函数保证「尽最大努力」返回一个非空用户：即使数据库异常，也返回内存兜底用户。
 */
export async function getOrCreateGuestUser(): Promise<User> {
  if (cachedGuestUser) return cachedGuestUser;

  const fixedId = getDefaultUserId();
  const db = await getDb();

  // 数据库不可用：直接返回内存兜底用户
  if (!db) {
    return buildFallbackUser(fixedId ?? 1);
  }

  try {
    // 1) 优先按 DEFAULT_USER_ID 查找
    if (fixedId) {
      const byId = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, fixedId))
        .limit(1);
      if (byId.length > 0) {
        cachedGuestUser = byId[0] as User;
        return cachedGuestUser;
      }
    }

    // 2) 按固定 openId 查找
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.openId, DEFAULT_GUEST_OPEN_ID))
      .limit(1);
    if (existing.length > 0) {
      cachedGuestUser = existing[0] as User;
      return cachedGuestUser;
    }

    // 3) 不存在则创建
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
    if (created.length > 0) {
      cachedGuestUser = created[0] as User;
      return cachedGuestUser;
    }

    // 理论不会到这里，兜底
    return buildFallbackUser(fixedId ?? 1);
  } catch (e) {
    console.error("[guestUser] getOrCreateGuestUser failed, using fallback:", e);
    // 数据库写入失败（如表结构缺字段）时，返回内存兜底用户，保证功能不被 401 阻断
    return buildFallbackUser(fixedId ?? 1);
  }
}
