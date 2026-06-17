import { eq, and, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, aiTools, InsertAITool, AIToolRecord } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL,

      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== AI Tools Database Queries ==========

export async function getAllAITools(options?: { category?: string; isDomestic?: boolean; pricing?: string; search?: string }): Promise<AIToolRecord[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(aiTools.isActive, 1)];
  if (options?.category) conditions.push(eq(aiTools.category, options.category));
  if (options?.isDomestic !== undefined) conditions.push(eq(aiTools.isDomestic, options.isDomestic ? 1 : 0));
  if (options?.pricing) conditions.push(eq(aiTools.pricing, options.pricing as "free" | "freemium" | "paid"));

  let query = db.select().from(aiTools).where(and(...conditions));
  const results = await query;

  if (options?.search) {
    const s = options.search.toLowerCase();
    return results.filter(t =>
      t.name.toLowerCase().includes(s) ||
      (t.description || "").toLowerCase().includes(s) ||
      t.category.toLowerCase().includes(s)
    );
  }
  return results;
}

export async function getAIToolCategories(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const results = await db.selectDistinct({ category: aiTools.category }).from(aiTools).where(eq(aiTools.isActive, 1));
  return results.map(r => r.category);
}

export async function getAIToolById(toolId: string): Promise<AIToolRecord | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const results = await db.select().from(aiTools).where(eq(aiTools.toolId, toolId)).limit(1);
  return results[0];
}

export async function upsertAITool(tool: InsertAITool): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiTools).values(tool).onDuplicateKeyUpdate({
    set: {
      name: tool.name,
      category: tool.category,
      isDomestic: tool.isDomestic,
      pricing: tool.pricing,
      description: tool.description,
      useCases: tool.useCases,
      officialUrl: tool.officialUrl,
      tags: tool.tags,
      isActive: tool.isActive ?? 1,
    },
  });
}

export async function deleteAITool(toolId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(aiTools).set({ isActive: 0 }).where(eq(aiTools.toolId, toolId));
}

export async function matchToolsFromDB(useCase: string, limit = 6): Promise<{ domestic: AIToolRecord[]; international: AIToolRecord[] }> {
  const all = await getAllAITools();
  const matched = all.filter(t =>
    (t.useCases || []).some((uc: string) => uc.includes(useCase)) ||
    (t.tags || []).some((tag: string) => tag.includes(useCase))
  );
  const domestic = matched.filter(t => t.isDomestic === 1)
    .sort((a, b) => {
      const order: Record<string, number> = { free: 0, freemium: 1, paid: 2 };
      return (order[a.pricing] || 1) - (order[b.pricing] || 1);
    }).slice(0, limit);
  const international = matched.filter(t => t.isDomestic === 0).slice(0, limit);
  return { domestic, international };
}

export async function getDomesticFreeToolsFromDB(): Promise<AIToolRecord[]> {
  const all = await getAllAITools({ isDomestic: true });
  return all.filter(t => t.pricing === "free" || t.pricing === "freemium")
    .sort((a, b) => {
      if (a.pricing === "free" && b.pricing !== "free") return -1;
      if (a.pricing !== "free" && b.pricing === "free") return 1;
      return 0;
    });
}
