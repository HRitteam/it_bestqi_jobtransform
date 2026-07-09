var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, bigint } from "drizzle-orm/mysql-core";
var users, reports, files, invitations, aiTools, brandSettings, reportDistributions, reportFeedback, llmModels, llmCallLogs;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      companyId: varchar("companyId", { length: 64 }),
      // 企业ID（iframe传入）
      phone: varchar("phone", { length: 20 }),
      // 用户手机号（iframe传入）
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      tier: mysqlEnum("tier", ["free", "pro", "enterprise"]).default("free").notNull(),
      inviteCount: int("inviteCount").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    reports = mysqlTable("reports", {
      id: int("id").autoincrement().primaryKey(),
      reportId: varchar("reportId", { length: 64 }).notNull().unique(),
      userId: int("userId").notNull(),
      companyId: varchar("companyId", { length: 64 }),
      // 企业ID（数据隔离）
      // Input fields
      jobTitle: varchar("jobTitle", { length: 256 }),
      company: varchar("company", { length: 256 }),
      industry: varchar("industry", { length: 128 }),
      inputText: text("inputText"),
      // Status
      status: mysqlEnum("status", ["pending", "analyzing", "completed", "error"]).default("pending").notNull(),
      currentStep: int("currentStep").default(0).notNull(),
      // AI extracted job info (for pending confirmation)
      extractedInfo: json("extractedInfo"),
      // Report data (JSON blob for 13 chapters)
      reportData: json("reportData"),
      // PDF export cache
      pdfUrl: varchar("pdfUrl", { length: 1024 }),
      pdfStatus: mysqlEnum("pdfStatus", ["idle", "generating", "ready", "error"]).default("idle"),
      pdfError: varchar("pdfError", { length: 512 }),
      // Sharing
      isPublic: int("isPublic").default(0).notNull(),
      shareToken: varchar("shareToken", { length: 64 }),
      // Timestamps
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      completedAt: timestamp("completedAt")
    });
    files = mysqlTable("files", {
      id: int("id").autoincrement().primaryKey(),
      reportId: varchar("reportId", { length: 64 }).notNull(),
      userId: int("userId").notNull(),
      companyId: varchar("companyId", { length: 64 }),
      // 企业ID（数据隔离）
      filename: varchar("filename", { length: 512 }).notNull(),
      mimeType: varchar("mimeType", { length: 128 }),
      fileKey: varchar("fileKey", { length: 512 }).notNull(),
      url: varchar("url", { length: 1024 }).notNull(),
      extractedText: text("extractedText"),
      fileSize: bigint("fileSize", { mode: "number" }),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    invitations = mysqlTable("invitations", {
      id: int("id").autoincrement().primaryKey(),
      inviterId: int("inviterId").notNull(),
      inviteeId: int("inviteeId"),
      inviteCode: varchar("inviteCode", { length: 64 }).notNull().unique(),
      status: mysqlEnum("status", ["pending", "accepted"]).default("pending").notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      acceptedAt: timestamp("acceptedAt")
    });
    aiTools = mysqlTable("ai_tools", {
      id: int("id").autoincrement().primaryKey(),
      toolId: varchar("toolId", { length: 64 }).notNull().unique(),
      name: varchar("name", { length: 128 }).notNull(),
      category: varchar("category", { length: 64 }).notNull(),
      isDomestic: int("isDomestic").default(0).notNull(),
      pricing: mysqlEnum("pricing", ["free", "freemium", "paid"]).default("freemium").notNull(),
      description: text("description"),
      useCases: json("useCases").$type(),
      officialUrl: varchar("officialUrl", { length: 512 }),
      tags: json("tags").$type(),
      isActive: int("isActive").default(1).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    brandSettings = mysqlTable("brand_settings", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      logoUrl: varchar("logoUrl", { length: 512 }),
      primaryColor: varchar("primaryColor", { length: 20 }),
      footerText: varchar("footerText", { length: 256 }),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    reportDistributions = mysqlTable("report_distributions", {
      id: int("id").autoincrement().primaryKey(),
      reportId: varchar("reportId", { length: 64 }).notNull(),
      recipientName: varchar("recipientName", { length: 128 }),
      recipientEmail: varchar("recipientEmail", { length: 320 }),
      linkToken: varchar("linkToken", { length: 64 }).notNull().unique(),
      viewPerspective: mysqlEnum("viewPerspective", ["hr", "staff", "executive"]).default("staff"),
      openedAt: timestamp("openedAt"),
      readProgress: int("readProgress").default(0),
      lastReadAt: timestamp("lastReadAt"),
      feedback: text("feedback"),
      feedbackRating: int("feedbackRating"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    reportFeedback = mysqlTable("report_feedback", {
      id: int("id").autoincrement().primaryKey(),
      reportId: varchar("reportId", { length: 64 }).notNull(),
      distributionId: int("distributionId"),
      chapterIndex: int("chapterIndex"),
      rating: int("rating"),
      comment: text("comment"),
      isAnonymous: int("isAnonymous").default(1),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    llmModels = mysqlTable("llm_models", {
      id: int("id").autoincrement().primaryKey(),
      modelCode: varchar("modelCode", { length: 64 }).notNull().unique(),
      modelName: varchar("modelName", { length: 128 }).notNull(),
      provider: varchar("provider", { length: 64 }).notNull(),
      apiUrl: varchar("apiUrl", { length: 512 }).notNull(),
      apiKey: varchar("apiKey", { length: 1024 }).notNull(),
      // AES-256-GCM 加密存储
      modelType: varchar("modelType", { length: 32 }).notNull(),
      // chat, embedding, image, audio
      isActive: int("isActive").default(1).notNull(),
      // 1-启用, 0-停用
      priority: int("priority").default(100).notNull(),
      // 数字越小优先级越高
      inputPrice: varchar("inputPrice", { length: 20 }).default("0").notNull(),
      // 输入Token单价(元/千Token)
      outputPrice: varchar("outputPrice", { length: 20 }).default("0").notNull(),
      // 输出Token单价(元/千Token)
      maxContext: int("maxContext").default(8192).notNull(),
      // 最大上下文长度
      maxOutput: int("maxOutput").default(4096).notNull(),
      // 最大输出长度
      remark: text("remark"),
      isDeleted: int("isDeleted").default(0).notNull(),
      // 软删除: 1-已删除, 0-正常
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    llmCallLogs = mysqlTable("llm_call_logs", {
      id: int("id").autoincrement().primaryKey(),
      requestId: varchar("requestId", { length: 32 }).notNull().unique(),
      // 唯一请求标识
      // 企业与用户信息
      companyId: varchar("companyId", { length: 64 }),
      // 企业ID
      companyName: varchar("companyName", { length: 128 }),
      // 企业名称
      userId: int("userId"),
      // 用户ID
      phone: varchar("phone", { length: 20 }),
      // 用户手机号
      // 调用信息
      feature: varchar("feature", { length: 64 }).notNull(),
      // 使用功能标识
      source: varchar("source", { length: 32 }).default("web"),
      // 请求来源
      // 模型信息
      modelCode: varchar("modelCode", { length: 64 }).notNull(),
      // 最终使用的模型编码
      modelName: varchar("modelName", { length: 128 }),
      // 最终使用的模型名称
      provider: varchar("provider", { length: 64 }),
      // 供应商
      // 调用状态
      success: int("success").default(1).notNull(),
      // 1-成功, 0-失败
      failReason: text("failReason"),
      // 失败原因
      httpStatus: int("httpStatus"),
      // HTTP 状态码
      // 模型切换信息
      isSwitched: int("isSwitched").default(0).notNull(),
      // 是否发生模型切换
      originalModel: varchar("originalModel", { length: 64 }),
      // 原始模型编码
      switchTrace: json("switchTrace").$type(),
      // 切换轨迹 JSON
      // Token 消耗
      inputTokens: int("inputTokens").default(0).notNull(),
      outputTokens: int("outputTokens").default(0).notNull(),
      totalTokens: int("totalTokens").default(0).notNull(),
      // 费用
      inputPrice: varchar("inputPrice", { length: 20 }).default("0"),
      // 调用时的输入单价快照
      outputPrice: varchar("outputPrice", { length: 20 }).default("0"),
      // 调用时的输出单价快照
      estimatedCost: varchar("estimatedCost", { length: 20 }).default("0").notNull(),
      // 预估费用(元)
      // 时间
      requestTime: timestamp("requestTime").defaultNow().notNull(),
      // 请求发起时间
      responseTime: timestamp("responseTime"),
      // 响应完成时间
      durationMs: int("durationMs").default(0).notNull(),
      // 总耗时(毫秒)
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      adminPassword: process.env.ADMIN_PASSWORD ?? "",
      sitePassword: process.env.SITE_PASSWORD ?? ""
    };
  }
});

// server/db.ts
import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = mysql.createPool({
        uri: process.env.DATABASE_URL
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getAllAITools(options) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(aiTools.isActive, 1)];
  if (options?.category) conditions.push(eq(aiTools.category, options.category));
  if (options?.isDomestic !== void 0) conditions.push(eq(aiTools.isDomestic, options.isDomestic ? 1 : 0));
  if (options?.pricing) conditions.push(eq(aiTools.pricing, options.pricing));
  let query = db.select().from(aiTools).where(and(...conditions));
  const results = await query;
  if (options?.search) {
    const s = options.search.toLowerCase();
    return results.filter(
      (t2) => t2.name.toLowerCase().includes(s) || (t2.description || "").toLowerCase().includes(s) || t2.category.toLowerCase().includes(s)
    );
  }
  return results;
}
async function getAIToolCategories() {
  const db = await getDb();
  if (!db) return [];
  const results = await db.selectDistinct({ category: aiTools.category }).from(aiTools).where(eq(aiTools.isActive, 1));
  return results.map((r) => r.category);
}
async function upsertAITool(tool) {
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
      isActive: tool.isActive ?? 1
    }
  });
}
async function deleteAITool(toolId) {
  const db = await getDb();
  if (!db) return;
  await db.update(aiTools).set({ isActive: 0 }).where(eq(aiTools.toolId, toolId));
}
async function matchToolsFromDB(useCase, limit = 6) {
  const all = await getAllAITools();
  const matched = all.filter(
    (t2) => (t2.useCases || []).some((uc) => uc.includes(useCase)) || (t2.tags || []).some((tag) => tag.includes(useCase))
  );
  const domestic = matched.filter((t2) => t2.isDomestic === 1).sort((a, b) => {
    const order = { free: 0, freemium: 1, paid: 2 };
    return (order[a.pricing] || 1) - (order[b.pricing] || 1);
  }).slice(0, limit);
  const international = matched.filter((t2) => t2.isDomestic === 0).slice(0, limit);
  return { domestic, international };
}
async function getDomesticFreeToolsFromDB() {
  const all = await getAllAITools({ isDomestic: true });
  return all.filter((t2) => t2.pricing === "free" || t2.pricing === "freemium").sort((a, b) => {
    if (a.pricing === "free" && b.pricing !== "free") return -1;
    if (a.pricing !== "free" && b.pricing === "free") return 1;
    return 0;
  });
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_env();
    _db = null;
  }
});

// server/utils/crypto.ts
import crypto2 from "node:crypto";
function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) {
    return Buffer.from(envKey, "hex");
  }
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      "ENCRYPTION_KEY or JWT_SECRET must be configured for API Key encryption"
    );
  }
  return crypto2.createHash("sha256").update(jwtSecret).digest();
}
function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto2.randomBytes(IV_LENGTH);
  const cipher = crypto2.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}
function decrypt(ciphertext) {
  const key = getEncryptionKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format: expected iv:authTag:ciphertext");
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto2.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH
  });
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length <= 8) {
    return "****";
  }
  return `${apiKey.slice(0, 3)}****${apiKey.slice(-4)}`;
}
var ALGORITHM, IV_LENGTH, AUTH_TAG_LENGTH;
var init_crypto = __esm({
  "server/utils/crypto.ts"() {
    "use strict";
    ALGORITHM = "aes-256-gcm";
    IV_LENGTH = 16;
    AUTH_TAG_LENGTH = 16;
  }
});

// server/_core/llmLogger.ts
function recordCallLog(entry) {
  Promise.resolve().then(async () => {
    try {
      const db = await getDb();
      if (!db) {
        console.warn("[LLM Logger] Database unavailable, log skipped:", entry.requestId);
        return;
      }
      await db.insert(llmCallLogs).values({
        requestId: entry.requestId,
        companyId: entry.context.companyId || null,
        companyName: null,
        // 后续可通过企业ID关联查询
        userId: entry.context.userId || null,
        phone: entry.context.phone || null,
        feature: entry.context.feature,
        source: entry.context.source || "web",
        modelCode: entry.modelCode,
        modelName: entry.modelName || null,
        provider: entry.provider || null,
        success: entry.success ? 1 : 0,
        failReason: entry.failReason || null,
        httpStatus: entry.httpStatus || null,
        isSwitched: entry.isSwitched ? 1 : 0,
        originalModel: entry.originalModel || null,
        switchTrace: entry.switchTrace.length > 0 ? entry.switchTrace : null,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        totalTokens: entry.totalTokens,
        inputPrice: entry.inputPrice || "0",
        outputPrice: entry.outputPrice || "0",
        estimatedCost: entry.estimatedCost.toFixed(6),
        requestTime: entry.requestTime,
        responseTime: entry.responseTime,
        durationMs: entry.durationMs
      });
    } catch (err) {
      console.error("[LLM Logger] Failed to write log:", err);
    }
  });
}
function logSuccess(result, context, modelInfo) {
  const now = /* @__PURE__ */ new Date();
  recordCallLog({
    requestId: result.metadata.requestId,
    context,
    success: true,
    modelCode: result.metadata.finalModel,
    modelName: modelInfo.modelName,
    provider: result.metadata.finalProvider,
    isSwitched: result.metadata.isSwitched,
    originalModel: result.metadata.originalModel,
    switchTrace: result.metadata.switchTrace,
    inputTokens: result.metadata.inputTokens,
    outputTokens: result.metadata.outputTokens,
    totalTokens: result.metadata.totalTokens,
    inputPrice: modelInfo.inputPrice,
    outputPrice: modelInfo.outputPrice,
    estimatedCost: result.metadata.estimatedCost,
    requestTime: new Date(now.getTime() - result.metadata.durationMs),
    responseTime: now,
    durationMs: result.metadata.durationMs
  });
}
function logFailure(requestId, context, error, durationMs) {
  const now = /* @__PURE__ */ new Date();
  recordCallLog({
    requestId,
    context,
    success: false,
    failReason: error.message,
    httpStatus: error.httpStatus,
    modelCode: error.modelCode || "unknown",
    provider: error.provider,
    isSwitched: (error.switchTrace?.length || 0) > 1,
    originalModel: error.originalModel,
    switchTrace: error.switchTrace || [],
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    requestTime: new Date(now.getTime() - durationMs),
    responseTime: now,
    durationMs
  });
}
function recordParseLog(params) {
  const { context, stepId, stepTitle, outcome, detail, emptyKeys } = params;
  if (outcome === "direct") return;
  const ok = outcome === "repaired";
  const reasonMap = {
    repaired: `[\u89E3\u6790\u4FEE\u590D] Step${stepId}\u300C${stepTitle}\u300D\u539F\u59CBJSON\u975E\u6CD5\uFF0C\u5DF2\u81EA\u52A8\u4FEE\u590D\u540E\u89E3\u6790\u6210\u529F`,
    failed: `[\u89E3\u6790\u5931\u8D25] Step${stepId}\u300C${stepTitle}\u300DJSON\u89E3\u6790\u5931\u8D25\uFF1A${detail || "\u672A\u77E5"}`,
    empty: `[\u5185\u5BB9\u4E3A\u7A7A] Step${stepId}\u300C${stepTitle}\u300D\u89E3\u6790\u6210\u529F\u4F46\u5173\u952E\u5B57\u6BB5\u7F3A\u5931\uFF1A${(emptyKeys || []).join(", ") || "\u672A\u77E5"}`
  };
  recordCallLog({
    requestId: `parse_${stepId}_${Date.now()}`,
    context: { ...context, feature: `${context.feature || "job_analysis"}:parse` },
    success: ok,
    failReason: reasonMap[outcome],
    httpStatus: ok ? 200 : 0,
    modelCode: "parse-check",
    modelName: "\u89E3\u6790\u6821\u9A8C",
    isSwitched: false,
    switchTrace: [],
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    requestTime: /* @__PURE__ */ new Date(),
    responseTime: /* @__PURE__ */ new Date(),
    durationMs: 0
  });
}
var init_llmLogger = __esm({
  "server/_core/llmLogger.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/_core/llmRouter.ts
var llmRouter_exports = {};
__export(llmRouter_exports, {
  getActiveModelsSorted: () => getActiveModelsSorted,
  invalidateModelCache: () => invalidateModelCache,
  invokeWithRouting: () => invokeWithRouting,
  invokeWithRoutingCompat: () => invokeWithRoutingCompat,
  isRetryableError: () => isRetryableError
});
import { eq as eq3, and as and2, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
async function getActiveModelsSorted() {
  const now = Date.now();
  if (cachedModels && now < cacheExpireAt) {
    return cachedModels;
  }
  const db = await getDb();
  if (!db) {
    return [];
  }
  const models = await db.select().from(llmModels).where(and2(eq3(llmModels.isActive, 1), eq3(llmModels.isDeleted, 0))).orderBy(asc(llmModels.priority));
  cachedModels = models;
  cacheExpireAt = now + CACHE_TTL_MS;
  return models;
}
function invalidateModelCache() {
  cachedModels = null;
  cacheExpireAt = 0;
}
function isRetryableError(error) {
  if (error instanceof Error) {
    const message = error.message;
    const statusMatch = message.match(/(\d{3})\s/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1], 10);
      if (NON_RETRYABLE_STATUS_CODES.has(status)) {
        return { retryable: false, httpStatus: status, reason: message };
      }
      if (RETRYABLE_STATUS_CODES.has(status)) {
        return { retryable: true, httpStatus: status, reason: message };
      }
    }
    if (message.includes("timeout") || message.includes("ETIMEDOUT") || message.includes("ECONNREFUSED") || message.includes("ECONNRESET") || message.includes("fetch failed") || message.includes("network")) {
      return { retryable: true, reason: `Network error: ${message}` };
    }
    return { retryable: true, reason: message };
  }
  return { retryable: true, reason: String(error) };
}
function buildPayload(params, model) {
  const { messages, tools, toolChoice, tool_choice, outputSchema, output_schema, responseFormat, response_format } = params;
  const normalizeMessage2 = (message) => {
    const { role, name, tool_call_id } = message;
    if (role === "tool" || role === "function") {
      const content = (Array.isArray(message.content) ? message.content : [message.content]).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
      return { role, name, tool_call_id, content };
    }
    const contentArr = Array.isArray(message.content) ? message.content : [message.content];
    const contentParts = contentArr.map((part) => {
      if (typeof part === "string") return { type: "text", text: part };
      return part;
    });
    if (contentParts.length === 1 && contentParts[0].type === "text") {
      return { role, name, content: contentParts[0].text };
    }
    return { role, name, content: contentParts };
  };
  const payload = {
    model,
    messages: messages.map(normalizeMessage2)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const tc = toolChoice || tool_choice;
  if (tc) {
    if (tc === "none" || tc === "auto") {
      payload.tool_choice = tc;
    } else if (tc === "required") {
      if (tools && tools.length === 1) {
        payload.tool_choice = { type: "function", function: { name: tools[0].function.name } };
      }
    } else if (typeof tc === "object" && "name" in tc) {
      payload.tool_choice = { type: "function", function: { name: tc.name } };
    } else {
      payload.tool_choice = tc;
    }
  }
  payload.max_tokens = 32768;
  const explicitFormat = responseFormat || response_format;
  const schema = outputSchema || output_schema;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema") {
      payload.response_format = { type: "json_object" };
      const jsonSchema = explicitFormat.json_schema?.schema;
      if (jsonSchema && Array.isArray(payload.messages)) {
        const msgs = payload.messages;
        const lastUserIdx = msgs.findLastIndex((m) => m.role === "user");
        if (lastUserIdx >= 0) {
          const schemaHint = `

\u3010\u8F93\u51FAJSON\u683C\u5F0F\u8981\u6C42\u3011\u8BF7\u4E25\u683C\u6309\u7167\u4EE5\u4E0BJSON Schema\u7ED3\u6784\u8F93\u51FA\uFF0C\u5B57\u6BB5\u540D\u5FC5\u987B\u5B8C\u5168\u4E00\u81F4\uFF1A
${JSON.stringify(jsonSchema, null, 2)}`;
          msgs[lastUserIdx] = { ...msgs[lastUserIdx], content: (msgs[lastUserIdx].content || "") + schemaHint };
        }
      }
    } else {
      payload.response_format = explicitFormat;
    }
  } else if (schema && schema.name && schema.schema) {
    payload.response_format = { type: "json_object" };
    if (Array.isArray(payload.messages)) {
      const msgs = payload.messages;
      const lastUserIdx = msgs.findLastIndex((m) => m.role === "user");
      if (lastUserIdx >= 0) {
        const schemaHint = `

\u3010\u8F93\u51FAJSON\u683C\u5F0F\u8981\u6C42\u3011\u8BF7\u4E25\u683C\u6309\u7167\u4EE5\u4E0BJSON Schema\u7ED3\u6784\u8F93\u51FA\uFF0C\u5B57\u6BB5\u540D\u5FC5\u987B\u5B8C\u5168\u4E00\u81F4\uFF1A
${JSON.stringify(schema.schema, null, 2)}`;
        msgs[lastUserIdx] = { ...msgs[lastUserIdx], content: (msgs[lastUserIdx].content || "") + schemaHint };
      }
    }
  }
  return payload;
}
async function executeModelRequest(model, params) {
  const apiKey = decrypt(model.apiKey);
  const payload = buildPayload(params, model.modelCode);
  const apiEndpoint = model.apiUrl.replace(/\/$/, "").endsWith("/chat/completions") ? model.apiUrl : `${model.apiUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}
async function invokeWithRouting(params, context) {
  const models = await getActiveModelsSorted();
  if (models.length === 0) {
    return await invokeFallback(params, context);
  }
  const requestId = nanoid(16);
  const originalModel = models[0];
  const switchTrace = [];
  const overallStartTime = Date.now();
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const attemptStartTime = Date.now();
    try {
      const response = await executeModelRequest(model, params);
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const totalTokens = response.usage?.total_tokens || inputTokens + outputTokens;
      const inputPrice = parseFloat(model.inputPrice) || 0;
      const outputPrice = parseFloat(model.outputPrice) || 0;
      const estimatedCost = (inputTokens * inputPrice + outputTokens * outputPrice) / 1e3;
      const routeResult = {
        response,
        metadata: {
          requestId,
          finalModel: model.modelCode,
          finalProvider: model.provider,
          isSwitched: i > 0,
          originalModel: originalModel.modelCode,
          switchTrace,
          inputTokens,
          outputTokens,
          totalTokens,
          estimatedCost,
          durationMs: Date.now() - overallStartTime
        }
      };
      logSuccess(routeResult, context, {
        modelName: model.modelName,
        inputPrice: model.inputPrice,
        outputPrice: model.outputPrice
      });
      return routeResult;
    } catch (error) {
      const { retryable, httpStatus, reason } = isRetryableError(error);
      const attemptDuration = Date.now() - attemptStartTime;
      switchTrace.push({
        modelCode: model.modelCode,
        provider: model.provider,
        failReason: reason,
        durationMs: attemptDuration,
        httpStatus
      });
      if (!retryable) {
        logFailure(requestId, context, {
          message: reason,
          httpStatus,
          switchTrace,
          modelCode: model.modelCode,
          provider: model.provider,
          originalModel: originalModel.modelCode
        }, Date.now() - overallStartTime);
        const err = new Error(
          `[LLM Router] Non-retryable error from model "${model.modelCode}": ${reason}`
        );
        err.requestId = requestId;
        err.switchTrace = switchTrace;
        err.httpStatus = httpStatus;
        throw err;
      }
      if (i === models.length - 1) {
        logFailure(requestId, context, {
          message: `All ${models.length} models failed. Last error: ${reason}`,
          httpStatus,
          switchTrace,
          modelCode: model.modelCode,
          provider: model.provider,
          originalModel: originalModel.modelCode
        }, Date.now() - overallStartTime);
        const err = new Error(
          `[LLM Router] All ${models.length} models failed. Last error: ${reason}`
        );
        err.requestId = requestId;
        err.switchTrace = switchTrace;
        throw err;
      }
      console.warn(
        `[LLM Router] Model "${model.modelCode}" failed (${reason}), switching to next model...`
      );
    }
  }
  throw new Error("[LLM Router] Unexpected: no models processed");
}
async function invokeFallback(params, context) {
  const startTime = Date.now();
  const requestId = nanoid(16);
  if (!ENV.forgeApiKey) {
    throw new Error("No LLM models configured and BUILT_IN_FORGE_API_KEY is not set");
  }
  const apiUrl = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
  const payload = buildPayload(params, "gemini-2.5-flash");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed (fallback): ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  const result = await response.json();
  const inputTokens = result.usage?.prompt_tokens || 0;
  const outputTokens = result.usage?.completion_tokens || 0;
  return {
    response: result,
    metadata: {
      requestId,
      finalModel: "gemini-2.5-flash",
      finalProvider: "forge-builtin",
      isSwitched: false,
      originalModel: "gemini-2.5-flash",
      switchTrace: [],
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCost: 0,
      durationMs: Date.now() - startTime
    }
  };
}
async function invokeWithRoutingCompat(params, context) {
  const fullContext = {
    feature: context?.feature || "unknown",
    companyId: context?.companyId,
    userId: context?.userId,
    phone: context?.phone,
    source: context?.source || "web"
  };
  const result = await invokeWithRouting(params, fullContext);
  return result.response;
}
var cachedModels, cacheExpireAt, CACHE_TTL_MS, RETRYABLE_STATUS_CODES, NON_RETRYABLE_STATUS_CODES;
var init_llmRouter = __esm({
  "server/_core/llmRouter.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_crypto();
    init_env();
    init_llmLogger();
    cachedModels = null;
    cacheExpireAt = 0;
    CACHE_TTL_MS = 6e4;
    RETRYABLE_STATUS_CODES = /* @__PURE__ */ new Set([
      429,
      // Rate Limit
      500,
      // Internal Server Error
      502,
      // Bad Gateway
      503,
      // Service Unavailable
      504,
      // Gateway Timeout
      401,
      // Unauthorized (API Key 异常)
      403
      // Forbidden (API Key 被封禁)
    ]);
    NON_RETRYABLE_STATUS_CODES = /* @__PURE__ */ new Set([
      400,
      // Bad Request (参数错误、上下文超长)
      422
      // Unprocessable Entity (内容安全拦截)
    ]);
  }
});

// server/_core/llm.ts
var llm_exports = {};
__export(llm_exports, {
  invokeLLM: () => invokeLLM
});
async function invokeLLM(params, context) {
  try {
    const { invokeWithRoutingCompat: invokeWithRoutingCompat2 } = await Promise.resolve().then(() => (init_llmRouter(), llmRouter_exports));
    return await invokeWithRoutingCompat2(params, {
      feature: context?.feature || "auto",
      companyId: context?.companyId,
      userId: context?.userId,
      phone: context?.phone,
      source: context?.source || "web"
    });
  } catch (routerError) {
    if (routerError?.message?.includes("No LLM models configured") || routerError?.message?.includes("\u6570\u636E\u5E93\u4E0D\u53EF\u7528") || routerError?.code === "MODULE_NOT_FOUND") {
      console.warn("[LLM] Router unavailable, falling back to direct mode:", routerError.message);
      return await invokeLLMDirect(params);
    }
    throw routerError;
  }
}
async function invokeLLMDirect(params) {
  assertApiKey();
  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: "gemini-2.5-flash",
    messages: messages.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  payload.thinking = {
    "budget_tokens": 128
  };
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}
var ensureArray, normalizeContentPart, normalizeMessage, normalizeToolChoice, resolveApiUrl, assertApiKey, normalizeResponseFormat;
var init_llm = __esm({
  "server/_core/llm.ts"() {
    "use strict";
    init_env();
    ensureArray = (value) => Array.isArray(value) ? value : [value];
    normalizeContentPart = (part) => {
      if (typeof part === "string") {
        return { type: "text", text: part };
      }
      if (part.type === "text") {
        return part;
      }
      if (part.type === "image_url") {
        return part;
      }
      if (part.type === "file_url") {
        return part;
      }
      throw new Error("Unsupported message content part");
    };
    normalizeMessage = (message) => {
      const { role, name, tool_call_id } = message;
      if (role === "tool" || role === "function") {
        const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
        return {
          role,
          name,
          tool_call_id,
          content
        };
      }
      const contentParts = ensureArray(message.content).map(normalizeContentPart);
      if (contentParts.length === 1 && contentParts[0].type === "text") {
        return {
          role,
          name,
          content: contentParts[0].text
        };
      }
      return {
        role,
        name,
        content: contentParts
      };
    };
    normalizeToolChoice = (toolChoice, tools) => {
      if (!toolChoice) return void 0;
      if (toolChoice === "none" || toolChoice === "auto") {
        return toolChoice;
      }
      if (toolChoice === "required") {
        if (!tools || tools.length === 0) {
          throw new Error(
            "tool_choice 'required' was provided but no tools were configured"
          );
        }
        if (tools.length > 1) {
          throw new Error(
            "tool_choice 'required' needs a single tool or specify the tool name explicitly"
          );
        }
        return {
          type: "function",
          function: { name: tools[0].function.name }
        };
      }
      if ("name" in toolChoice) {
        return {
          type: "function",
          function: { name: toolChoice.name }
        };
      }
      return toolChoice;
    };
    resolveApiUrl = () => ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0 ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions` : "https://forge.manus.im/v1/chat/completions";
    assertApiKey = () => {
      if (!ENV.forgeApiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }
    };
    normalizeResponseFormat = ({
      responseFormat,
      response_format,
      outputSchema,
      output_schema
    }) => {
      const explicitFormat = responseFormat || response_format;
      if (explicitFormat) {
        if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
          throw new Error(
            "responseFormat json_schema requires a defined schema object"
          );
        }
        return explicitFormat;
      }
      const schema = outputSchema || output_schema;
      if (!schema) return void 0;
      if (!schema.name || !schema.schema) {
        throw new Error("outputSchema requires both name and schema");
      }
      return {
        type: "json_schema",
        json_schema: {
          name: schema.name,
          schema: schema.schema,
          ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
        }
      };
    };
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/apiRoutes.ts
init_db();
init_schema();
import multer from "multer";
import { nanoid as nanoid2 } from "nanoid";

// server/guestUser.ts
init_db();
init_schema();
import { eq as eq2 } from "drizzle-orm";
var DEFAULT_GUEST_OPEN_ID = "bestqi_guest_default";
function getDefaultUserId() {
  const raw = process.env.DEFAULT_USER_ID;
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}
function buildFallbackUser(id) {
  return {
    id,
    openId: DEFAULT_GUEST_OPEN_ID,
    companyId: null,
    phone: null,
    name: "\u666E\u901A\u7528\u6237",
    email: null,
    loginMethod: "default",
    role: "user",
    tier: "free",
    inviteCount: 0,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date(),
    lastSignedIn: /* @__PURE__ */ new Date()
  };
}
var cachedGuestUser = null;
async function getOrCreateGuestUser() {
  if (cachedGuestUser) return cachedGuestUser;
  const fixedId = getDefaultUserId();
  const db = await getDb();
  if (!db) {
    return buildFallbackUser(fixedId ?? 1);
  }
  try {
    if (fixedId) {
      const byId = await db.select().from(users).where(eq2(users.id, fixedId)).limit(1);
      if (byId.length > 0) {
        cachedGuestUser = byId[0];
        return cachedGuestUser;
      }
    }
    const existing = await db.select().from(users).where(eq2(users.openId, DEFAULT_GUEST_OPEN_ID)).limit(1);
    if (existing.length > 0) {
      cachedGuestUser = existing[0];
      return cachedGuestUser;
    }
    try {
      await db.insert(users).values({
        openId: DEFAULT_GUEST_OPEN_ID,
        name: "\u666E\u901A\u7528\u6237",
        role: "user",
        tier: "free"
      });
    } catch (insertErr) {
      const code = insertErr?.cause?.code || insertErr?.code;
      if (code !== "ER_DUP_ENTRY") {
        throw insertErr;
      }
    }
    const created = await db.select().from(users).where(eq2(users.openId, DEFAULT_GUEST_OPEN_ID)).limit(1);
    if (created.length > 0) {
      cachedGuestUser = created[0];
      return cachedGuestUser;
    }
    return buildFallbackUser(fixedId ?? 1);
  } catch (e) {
    console.error("[guestUser] getOrCreateGuestUser failed, using fallback:", e);
    return buildFallbackUser(fixedId ?? 1);
  }
}

// server/apiRoutes.ts
import { eq as eq5 } from "drizzle-orm";

// server/analysis.ts
init_llm();
init_db();
init_schema();
import { eq as eq4 } from "drizzle-orm";

// server/jsonRepair.ts
function extractJsonString(content) {
  let s = content || "";
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) {
    s = fence[1];
  }
  s = s.trim();
  const firstObj = s.indexOf("{");
  const firstArr = s.indexOf("[");
  let start = -1;
  let openChar = "{";
  let closeChar = "}";
  if (firstObj === -1 && firstArr === -1) return s;
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    start = firstArr;
    openChar = "[";
    closeChar = "]";
  } else {
    start = firstObj;
    openChar = "{";
    closeChar = "}";
  }
  const lastClose = s.lastIndexOf(closeChar);
  if (start !== -1 && lastClose !== -1 && lastClose > start) {
    s = s.slice(start, lastClose + 1);
  } else if (start !== -1) {
    s = s.slice(start);
  }
  return s.trim();
}
function repairJson(input) {
  let s = input;
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  s = s.replace(/^\s*\/\/.*$/gm, "");
  s = s.replace(/([{,]\s*)([A-Za-z_\u4e00-\u9fa5][\w\u4e00-\u9fa5-]*)(\s*:)/g, '$1"$2"$3');
  s = s.replace(/(["}\]\d])\s+("[A-Za-z_\u4e00-\u9fa5][^"\n\r]{0,80}"\s*:)/g, "$1,$2").replace(/([}\]])\s+([{[])/g, "$1,$2");
  s = s.replace(/,\s*([}\]])/g, "$1");
  const stack = [];
  let inStr = false;
  let strCh = "";
  let escaped = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (escaped) {
        escaped = false;
      } else if (c === "\\") {
        escaped = true;
      } else if (c === strCh) {
        inStr = false;
      }
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = true;
      strCh = c;
    } else if (c === "{" || c === "[") {
      stack.push(c);
    } else if (c === "}" || c === "]") {
      stack.pop();
    }
  }
  if (inStr) {
    s += strCh;
  }
  s = s.replace(/,\s*$/g, "");
  while (stack.length > 0) {
    const open = stack.pop();
    s += open === "{" ? "}" : "]";
  }
  return s;
}
function robustParseJson(content) {
  const extracted = extractJsonString(content);
  try {
    return { data: JSON.parse(extracted), outcome: "direct" };
  } catch (_) {
  }
  try {
    const repaired = repairJson(extracted);
    return { data: JSON.parse(repaired), outcome: "repaired" };
  } catch (e) {
    return { data: null, outcome: "failed", error: e?.message || String(e) };
  }
}
var STEP_KEY_SPECS = {
  1: [{ key: "coreResponsibilities", type: "array", aliases: ["responsibilities", "duties", "coreDuties"] }],
  2: [{ key: "dimensions", type: "array", aliases: ["dimensionList", "analysis", "items"] }],
  3: [{ key: "tasks", type: "array", aliases: ["taskList", "workflow", "workflowTasks", "nodes", "taskNodes", "items"] }],
  4: [{ key: "recommendations", type: "array", aliases: ["recommendation", "tools", "toolRecommendations", "items"] }],
  5: [{ key: "newTasks", type: "array", aliases: ["tasks", "taskList", "newWorkflow", "workflow", "items"] }],
  6: [
    { key: "dimensions", type: "array", aliases: ["comparison", "comparisons", "items"] },
    { key: "roiPlans", type: "array", aliases: ["plans", "roi", "roiOptions"] }
  ],
  7: [
    { key: "taskClassification", type: "object", aliases: ["classification", "taskCategories"] },
    { key: "roadmap", type: "array", aliases: ["phases", "implementationRoadmap", "plan"] }
  ],
  8: [
    { key: "risks", type: "array", aliases: ["riskList", "riskItems", "items"] },
    { key: "kpis", type: "array", aliases: ["kpiList", "kpi", "metrics"] }
  ],
  9: [{ key: "competencies", type: "array", aliases: ["competencyList", "abilities", "items"] }]
};
function isEmptyValue(spec, value) {
  if (value === void 0 || value === null) return true;
  if (spec.type === "array") return !Array.isArray(value) || value.length === 0;
  if (spec.type === "object") return typeof value !== "object" || Object.keys(value).length === 0;
  return false;
}
function normalizeStepAliases(stepId, data) {
  if (!data || typeof data !== "object") return data;
  const specs = STEP_KEY_SPECS[stepId];
  if (!specs) return data;
  for (const spec of specs) {
    if (isEmptyValue(spec, data[spec.key])) {
      for (const alias of spec.aliases) {
        if (!isEmptyValue(spec, data[alias])) {
          data[spec.key] = data[alias];
          break;
        }
      }
    }
  }
  return data;
}
function detectEmptyStepKeys(stepId, data) {
  const specs = STEP_KEY_SPECS[stepId];
  if (!specs) return data ? [] : ["<all>"];
  if (!data || typeof data !== "object") return specs.map((s) => s.key);
  const empties = [];
  for (const spec of specs) {
    if (isEmptyValue(spec, data[spec.key])) empties.push(spec.key);
  }
  return empties;
}
function isStepDataIncomplete(stepId, data) {
  if (data === null || data === void 0) return true;
  return detectEmptyStepKeys(stepId, data).length > 0;
}

// server/analysis.ts
init_llmLogger();

// server/toolCatalog.ts
var CATEGORY_LABELS = {
  llm: "\u901A\u7528\u5927\u6A21\u578B",
  office: "\u529E\u516C\u534F\u4F5C",
  coding: "\u7F16\u7A0B\u5F00\u53D1",
  image: "\u56FE\u50CF\u751F\u6210",
  video: "\u89C6\u9891\u751F\u6210",
  audio: "\u97F3\u9891\u8BED\u97F3",
  design: "\u8BBE\u8BA1\u5DE5\u5177",
  marketing: "\u8425\u9500\u63A8\u5E7F",
  sales: "\u9500\u552ECRM",
  service: "\u5BA2\u6237\u670D\u52A1",
  hr: "\u4EBA\u529B\u8D44\u6E90",
  data: "\u6570\u636E\u5206\u6790",
  legal: "\u6CD5\u52A1\u5408\u89C4",
  finance: "\u8D22\u52A1\u7BA1\u7406",
  supply_chain: "\u4F9B\u5E94\u94FE",
  pm: "\u4EA7\u54C1/\u9879\u76EE\u7BA1\u7406",
  meeting: "\u4F1A\u8BAE\u7EAA\u8981",
  agent: "\u667A\u80FD\u4F53/\u5DE5\u4F5C\u6D41",
  knowledge: "\u77E5\u8BC6\u5E93/RAG",
  writing: "\u5199\u4F5C\u8F85\u52A9",
  research: "\u5B66\u672F\u7814\u7A76"
};
var TOOL_CATALOG = [
  // ─── 通用大模型 (llm) ───
  {
    international: "ChatGPT",
    domestic: "DeepSeek",
    category: "llm",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u8F6F\u4EF6\u7814\u53D1", "\u6570\u636E\u5206\u6790", "\u7BA1\u7406\u51B3\u7B56", "\u5E02\u573A\u8425\u9500", "\u4EA7\u54C1\u7ECF\u7406", "\u8BBE\u8BA1\u521B\u610F", "\u9500\u552E", "\u5BA2\u670D", "\u4EBA\u529B\u8D44\u6E90", "\u8D22\u52A1", "\u6CD5\u52A1\u5408\u89C4", "\u4F9B\u5E94\u94FE/\u8FD0\u8425", "\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C", "\u4F1A\u8BAE\u534F\u4F5C", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53"],
    applicableTasks: ["\u65E5\u5E38\u5199\u4F5C", "\u903B\u8F91\u63A8\u7406", "\u590D\u6742\u6570\u636E\u5206\u6790", "\u4EE3\u7801\u8F85\u52A9", "Agent\u4EFB\u52A1"],
    coreAdvantage: "\u5168\u7403\u9876\u7EA7\u901A\u7528\u5927\u6A21\u578B\uFF0C\u591A\u6A21\u6001\u4E0EAgent\u80FD\u529B\u9886\u5148\uFF1BDeepSeek\u5F00\u6E90\u3001\u8D85\u957F\u4E0A\u4E0B\u6587\u3001\u63A8\u7406\u4E0E\u4E2D\u6587\u80FD\u529B\u5F3A\uFF0C\u6027\u4EF7\u6BD4\u6781\u9AD8\u4E14\u53EF\u79C1\u6709\u5316"
  },
  {
    international: "Claude",
    domestic: "Kimi",
    category: "llm",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u8F6F\u4EF6\u7814\u53D1", "\u4EA7\u54C1\u7ECF\u7406", "\u6570\u636E\u5206\u6790", "\u7BA1\u7406\u51B3\u7B56", "\u5E02\u573A\u8425\u9500", "\u6CD5\u52A1\u5408\u89C4"],
    applicableTasks: ["\u957F\u6587\u6863\u9605\u8BFB", "\u4EE3\u7801\u5206\u6790", "\u9700\u6C42\u62C6\u89E3", "\u6DF1\u5EA6\u63A8\u7406", "\u957F\u4EFB\u52A1\u53EF\u9760\u6267\u884C"],
    coreAdvantage: "\u7F16\u7801\u4E0E\u957F\u4EFB\u52A1\u53EF\u9760\u6027\u9876\u5C16\uFF0CArtifacts/Projects/MCP\u751F\u6001\u5B8C\u5584\uFF1BKimi\u5F00\u6E90\u4E07\u4EBFMoE Agent\u6A21\u578B\uFF0C\u8D85\u957F\u4E0A\u4E0B\u6587\u3001Agentic\u7F16\u7801\u5F3A"
  },
  {
    international: "Gemini",
    domestic: "\u8C46\u5305",
    category: "llm",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u5E02\u573A\u8425\u9500", "\u6570\u636E\u5206\u6790", "\u7BA1\u7406\u51B3\u7B56", "\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C"],
    applicableTasks: ["\u8D44\u6599\u6574\u7406", "\u8425\u9500\u6587\u6848", "\u8C37\u6B4C\u751F\u6001\u534F\u540C", "\u591A\u6A21\u6001\u5206\u6790"],
    coreAdvantage: "\u63A8\u7406\u4E0E\u591A\u6A21\u6001\u6807\u6746\uFF0C\u6DF1\u5EA6\u5D4C\u5165Google Workspace\uFF1B\u8C46\u5305\u5B57\u8282\u65D7\u8230\u591A\u6A21\u6001\u6A21\u578B\uFF0CAgent/\u7F16\u7801\u5F3A\u3001\u4EF7\u683C\u4F4E\u3001\u751F\u6001\u5E7F(\u98DE\u4E66/\u6296\u97F3)"
  },
  {
    international: "Grok",
    domestic: "\u6587\u5FC3\u4E00\u8A00",
    category: "llm",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u5E02\u573A\u8425\u9500", "\u6570\u636E\u5206\u6790"],
    applicableTasks: ["\u5B9E\u65F6\u4FE1\u606F\u68C0\u7D22", "\u5199\u4F5C", "\u6570\u636E\u5206\u6790", "\u641C\u7D22"],
    coreAdvantage: "\u5B9E\u65F6X\u6570\u636E\u63A5\u5165\uFF0C\u63A8\u7406\u4E0E\u7F16\u7801\u80FD\u529B\u5F3A\uFF1B\u6587\u5FC3\u4E00\u8A00\u56FD\u4EA7\u5168\u6A21\u6001\u4E00\u4F53\u5316\uFF0C\u4E2D\u6587\u521B\u4F5C\u4E0EAgent\u6210\u719F"
  },
  {
    international: "Perplexity",
    domestic: "\u817E\u8BAF\u5143\u5B9D",
    category: "llm",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u7BA1\u7406\u51B3\u7B56", "\u5E02\u573A\u8425\u9500", "\u6570\u636E\u5206\u6790"],
    applicableTasks: ["AI\u641C\u7D22", "\u884C\u4E1A\u7814\u7A76", "\u4E8B\u5B9E\u6838\u67E5", "\u81EA\u4E3B\u6D4F\u89C8\u64CD\u4F5C"],
    coreAdvantage: "AI\u539F\u751F\u641C\u7D22+Comet\u667A\u80FD\u6D4F\u89C8\u5668\u53EF\u81EA\u4E3B\u591A\u6B65\u64CD\u4F5C\uFF0C\u7B54\u6848\u5E26\u6EAF\u6E90\uFF1B\u817E\u8BAF\u5143\u5B9D\u6DF7\u5143+DeepSeek\u53CC\u5F15\u64CE\uFF0C\u6DF1\u5EA6\u7ED1\u5B9A\u5FAE\u4FE1\u751F\u6001"
  },
  {
    international: "Meta Llama",
    domestic: "\u901A\u4E49\u5343\u95EE",
    category: "llm",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u8F6F\u4EF6\u7814\u53D1", "\u6570\u636E\u5206\u6790", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53"],
    applicableTasks: ["\u5F00\u6E90\u6A21\u578B\u79C1\u6709\u5316\u90E8\u7F72", "\u5B9A\u5236\u5FAE\u8C03", "\u672C\u5730\u63A8\u7406"],
    coreAdvantage: "\u5168\u7403\u5F00\u6E90\u6A21\u578B\u6807\u6746\uFF0C\u53EF\u81EA\u7531\u5FAE\u8C03\u4E0E\u79C1\u6709\u5316\uFF1B\u901A\u4E49\u5343\u95EE\u963F\u91CC\u5F00\u6E90\u65D7\u8230\uFF0C\u4E2D\u6587\u4E0EAgent\u80FD\u529B\u5F3A\u3001\u751F\u6001\u5B8C\u6574"
  },
  {
    international: "Mistral",
    domestic: "\u667A\u8C31GLM",
    category: "llm",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u8F6F\u4EF6\u7814\u53D1", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53"],
    applicableTasks: ["\u5F00\u6E90\u9AD8\u6548\u63A8\u7406", "\u79C1\u6709\u5316\u90E8\u7F72", "Agentic\u7F16\u7801"],
    coreAdvantage: "\u6B27\u6D32\u5F00\u6E90\u9AD8\u6548\u6A21\u578B\uFF0C\u5408\u89C4\u53CB\u597D\uFF1B\u667A\u8C31GLM\u4E3AMIT\u5F00\u6E90\u3001\u767E\u4E07\u4E0A\u4E0B\u6587\uFF0C\u957F\u7A0BAgentic Coding\u5F3A\uFF0C\u9002\u5408\u79C1\u6709\u5316\u90E8\u7F72"
  },
  // ─── 办公协作 (office) ───
  {
    international: "Microsoft 365 Copilot",
    domestic: "WPS\u7075\u7280",
    category: "office",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u8D22\u52A1", "\u6570\u636E\u5206\u6790", "\u7BA1\u7406\u51B3\u7B56", "\u4EBA\u529B\u8D44\u6E90", "\u5E02\u573A\u8425\u9500", "\u9500\u552E"],
    applicableTasks: ["Office\u5168\u5BB6\u6876\u534F\u540C", "PPT\u751F\u6210", "Excel\u5206\u6790", "\u7AEF\u5230\u7AEF\u81EA\u4E3B\u4EA4\u4ED8"],
    coreAdvantage: "\u6DF1\u5EA6\u5D4C\u5165Word/Excel/PPT/Teams\uFF0CCowork\u53EF\u7AEF\u5230\u7AEF\u81EA\u4E3B\u5B8C\u6210\u4EFB\u52A1\u5E76\u4EA4\u4ED8\u6210\u54C1\uFF1BWPS\u7075\u7280\u539F\u751F\u4E2D\u6587Office\u667A\u80FD\u4F53\uFF0C\u81EA\u7136\u8BED\u8A00\u5B8C\u6210\u6587\u6863/PPT/\u8868\u683C"
  },
  {
    international: "Notion AI",
    domestic: "\u8BED\u96C0AI",
    category: "office",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u4EA7\u54C1\u7ECF\u7406", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u6587\u6863\u534F\u4F5C", "\u77E5\u8BC6\u7BA1\u7406", "\u591A\u667A\u80FD\u4F53\u534F\u4F5C", "\u591A\u6B65\u4EFB\u52A1\u81EA\u4E3B\u6267\u884C"],
    coreAdvantage: "\u5347\u7EA7\u4E3A\u53EF\u81EA\u4E3B\u6267\u884C\u591A\u6B65\u4EFB\u52A1\u7684Agent\uFF0C\u652F\u6301\u591A\u667A\u80FD\u4F53\u534F\u4F5C\u4E0E\u5916\u90E8\u667A\u80FD\u4F53(Claude/Cursor)\u63A5\u5165\uFF1B\u8BED\u96C0\u57FA\u4E8E\u77E5\u8BC6\u5E93AI\u95EE\u7B54\u4E0E\u591A\u6587\u6863\u63A8\u7406"
  },
  {
    international: "ChatExcel",
    domestic: "ChatExcel",
    category: "office",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u8D22\u52A1", "\u6570\u636E\u5206\u6790"],
    applicableTasks: ["\u81EA\u7136\u8BED\u8A00\u5904\u7406Excel", "\u591A\u6A21\u6001\u6210\u8868", "\u4E00\u952E\u51FA\u56FE\u51FAPPT"],
    coreAdvantage: "\u804A\u5929\u5373\u53EF\u5904\u7406\u590D\u6742\u8868\u683C\uFF0C\u652F\u6301\u56FE\u7247/PDF/\u7F51\u9875\u591A\u6A21\u6001\u4E00\u952E\u6210\u8868\u5E76\u81EA\u52A8\u5206\u6790\u51FA\u56FE\u51FAPPT\uFF0C\u95E8\u69DB\u6781\u4F4E"
  },
  {
    international: "Google Workspace",
    domestic: "\u98DE\u4E66",
    category: "office",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u4F1A\u8BAE\u534F\u4F5C", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53", "\u4EBA\u529B\u8D44\u6E90", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u6587\u6863/\u8868\u683C/\u90AE\u4EF6\u5185\u8C03\u7528AI", "\u642D\u5EFA\u56E2\u961F\u81EA\u5B9A\u4E49\u667A\u80FD\u4F53", "\u81EA\u7136\u8BED\u8A00\u751F\u6210\u6570\u636E\u8868/\u4EEA\u8868\u76D8"],
    coreAdvantage: "Gemini\u6DF1\u5EA6\u878D\u5165\u534F\u4F5C\u5957\u4EF6\u5168\u6D41\u7A0B\uFF1B\u98DE\u4E66\u667A\u80FD\u4F19\u4F34\u6709\u77E5\u8BC6\u6709\u8BB0\u5FC6\u66F4\u4E3B\u52A8\uFF0C\u53EF\u64CD\u4F5C\u6587\u6863\u4E0E\u591A\u7EF4\u8868\u683C"
  },
  {
    international: "Gamma",
    domestic: "\u8BAF\u98DE\u667A\u6587",
    category: "office",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u5E02\u573A\u8425\u9500", "\u4EA7\u54C1\u7ECF\u7406", "\u7BA1\u7406\u51B3\u7B56", "\u8BBE\u8BA1\u521B\u610F"],
    applicableTasks: ["\u4E00\u952E\u751F\u6210\u6F14\u793A\u6587\u7A3F", "Word\u76F4\u8F6CPPT", "AI\u6392\u7248\u4E0E\u914D\u56FE"],
    coreAdvantage: "\u4E00\u53E5\u8BDD\u6216\u4E00\u7BC7\u6587\u6863\u4E00\u952E\u751F\u6210\u9AD8\u8D28\u91CFPPT\uFF0CGamma\u8BBE\u8BA1\u611F\u5F3A\u53EF\u53D1\u5E03\u4E3A\u7F51\u9875\uFF1B\u8BAF\u98DE\u667A\u6587\u4E2D\u6587\u4E0E\u4E13\u4E1A\u672F\u8BED\u9002\u914D\u597D\u3001\u79D2\u7EA7\u51FA\u7A3F"
  },
  // ─── 编程开发 (coding) ───
  {
    international: "OpenAI Codex",
    domestic: "\u5B57\u8282Trae",
    category: "coding",
    applicableTo: ["\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["\u590D\u6742\u9879\u76EE\u5F00\u53D1", "\u7EC8\u7AEF\u4EE3\u7406", "\u81EA\u52A8\u5316\u7F16\u7A0B"],
    coreAdvantage: "\u7EDF\u4E00\u7EC8\u7AEF/IDE/\u4E91\u7AEF\u591A\u5F62\u6001\u7684\u7F16\u7801Agent\uFF0C\u81EA\u4E3B\u5B8C\u6210\u590D\u6742\u5DE5\u7A0B\uFF1BTrae\u56FD\u5185AI\u539F\u751FIDE\uFF0CSOLO\u6A21\u5F0F\u514D\u8D39"
  },
  {
    international: "Claude Code",
    domestic: "Qoder CN",
    category: "coding",
    applicableTo: ["\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["\u4EE3\u7801\u5206\u6790", "\u7EC8\u7AEF\u4EE3\u7406", "\u67B6\u6784\u8BBE\u8BA1", "\u5927\u578B\u91CD\u6784", "Code Review"],
    coreAdvantage: "\u7EC8\u7AEF\u539F\u751F\u7F16\u7801Agent\uFF0C\u5927\u578B\u4EE3\u7801\u5E93\u7406\u89E3\u4E0E\u957F\u4EFB\u52A1\u53EF\u9760\u6027\u9876\u5C16\uFF1BQoder CN(\u539F\u901A\u4E49\u7075\u7801)\u4ED3\u5E93\u7EA7\u4E0A\u4E0B\u6587+Code Review\u667A\u80FD\u4F53"
  },
  {
    international: "Cursor",
    domestic: "\u817E\u8BAFCodeBuddy",
    category: "coding",
    applicableTo: ["\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["\u4EE3\u7801\u8865\u5168", "\u590D\u6742\u9879\u76EE\u5F00\u53D1", "\u591A\u6587\u4EF6\u7F16\u8F91", "\u540E\u53F0Agent\u4EFB\u52A1"],
    coreAdvantage: "AI\u539F\u751FIDE\uFF0CAgents\u7A97\u53E3\u5E76\u884C\u540E\u53F0\u4EFB\u52A1+\u4E91\u7AEF\u63A5\u7BA1\uFF0C\u4E3B\u6D41vibe coding\u5DE5\u5177\uFF1BCodeBuddy\u817E\u8BAF\u51FA\u54C1\uFF0C\u542BCraft/SPEC\u6A21\u5F0F"
  },
  {
    international: "GitHub Copilot",
    domestic: "\u767E\u5EA6\u6587\u5FC3\u5FEB\u7801(Comate)",
    category: "coding",
    applicableTo: ["\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["\u4EE3\u7801\u8865\u5168", "\u5355\u5143\u6D4B\u8BD5", "\u4E91\u7AEFissue\u8F6CPR"],
    coreAdvantage: "\u5168\u7403\u4F7F\u7528\u6700\u5E7F\uFF0CAgent\u6A21\u5F0F(IDE\u5185)+Coding Agent(\u4E91\u7AEFissue\u2192PR)\u53CC\u5F62\u6001\uFF1BComate\u57FA\u4E8E\u6587\u5FC3\u5927\u6A21\u578B\uFF0C\u8D34\u5408\u56FD\u5185\u4FE1\u521B\u7814\u53D1"
  },
  {
    international: "Tabnine",
    domestic: "Qoder CN",
    category: "coding",
    applicableTo: ["\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["\u4F01\u4E1A\u7EA7\u4EE3\u7801\u8865\u5168", "\u79C1\u6709\u5316\u90E8\u7F72", "\u5408\u89C4Code Review"],
    coreAdvantage: "\u4F01\u4E1A\u7EA7\u9690\u79C1\u5408\u89C4\u9996\u9009\uFF0C\u652F\u6301\u6C14\u9699/\u79C1\u6709\u5316\u90E8\u7F72\u3001\u96F6\u4EE3\u7801\u7559\u5B58\u4E0E\u4F01\u4E1A\u4E0A\u4E0B\u6587\u5F15\u64CE"
  },
  {
    international: "Google Antigravity",
    domestic: "\u5B57\u8282Trae",
    category: "coding",
    applicableTo: ["\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["\u81EA\u4E3B\u591A\u6587\u4EF6\u5F00\u53D1", "\u8DE8IDE/CLI/\u6D4F\u89C8\u5668agent\u534F\u540C", "\u8BA1\u5212-\u7F16\u7801-\u6D4B\u8BD5\u5168\u6D41\u7A0B"],
    coreAdvantage: "Google\u4EE5agent\u4E3A\u6838\u5FC3\u91CD\u6784\u7684AI-first IDE(\u5DF2\u7EDF\u4E00\u539FGemini Code Assist/CLI)\uFF0C\u81EA\u4E3B\u89C4\u5212\u5E76\u8DE8\u6587\u4EF6\u7F16\u7801+\u8DD1\u6D4B\u8BD5"
  },
  {
    international: "Devin",
    domestic: "\u817E\u8BAFCodeBuddy",
    category: "coding",
    applicableTo: ["\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["\u81EA\u4E3B\u5B8C\u6210\u7AEF\u5230\u7AEF\u4EFB\u52A1", "\u540E\u53F0\u5E76\u884C\u5904\u7406\u5DE5\u5355", "\u81EA\u52A8QA\u4E0EPR\u751F\u6210"],
    coreAdvantage: "Cognition\u51FA\u54C1\u7684\u81EA\u4E3B\u8F6F\u4EF6\u5DE5\u7A0B\u5E08\uFF0C\u652F\u6301\u684C\u9762/\u4E91/CLI\u591A\u5F62\u6001\u4E0E\u7AEF\u5230\u7AEF\u81EA\u6D4B\uFF0C\u4F01\u4E1A\u7EA7\u663E\u8457\u63D0\u6548"
  },
  {
    international: "Amazon Kiro",
    domestic: "Qoder CN",
    category: "coding",
    applicableTo: ["\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["\u89C4\u8303\u9A71\u52A8\u5F00\u53D1(spec)", "\u4E8B\u4EF6\u94A9\u5B50\u81EA\u52A8\u5316", "\u9700\u6C42\u2192\u8BBE\u8BA1\u2192\u4EFB\u52A1\u2192\u4EE3\u7801"],
    coreAdvantage: "\u539F\u751Fspec\u89C4\u8303\u9A71\u52A8\u5F00\u53D1+\u4E8B\u4EF6\u94A9\u5B50(hooks)\u7684agent IDE\uFF1BQoder CN\u4EE5Quest\u6A21\u5F0F\u5BF9\u5E94\u81EA\u4E3B\u4EA4\u4ED8\u7279\u6027"
  },
  {
    international: "CodeRabbit",
    domestic: "Qoder CN",
    category: "coding",
    applicableTo: ["\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["Pull Request\u81EA\u52A8\u8BC4\u5BA1", "\u7F3A\u9677/\u5B89\u5168\u9690\u60A3\u68C0\u6D4B", "\u4EE3\u7801\u89C4\u8303\u628A\u5173"],
    coreAdvantage: "\u5B89\u88C5\u91CF\u6700\u5927\u7684AI\u4EE3\u7801\u8BC4\u5BA1\u5DE5\u5177\uFF0C\u81EA\u52A8\u9010\u884C\u5BA1\u67E5PR\u5E76\u7ED9\u4FEE\u590D\u5EFA\u8BAE\uFF1B\u56FD\u4EA7\u53EF\u7528Qoder CN\u7684Code Review\u667A\u80FD\u4F53"
  },
  // ─── 图像生成 (image) ───
  {
    international: "Midjourney",
    domestic: "\u5373\u68A6AI",
    category: "image",
    applicableTo: ["\u8BBE\u8BA1\u521B\u610F", "\u5E02\u573A\u8425\u9500", "\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C"],
    applicableTasks: ["\u5546\u4E1A\u63D2\u753B", "\u6982\u5FF5\u8BBE\u8BA1", "\u521B\u610F\u7D20\u6750"],
    coreAdvantage: "\u6700\u65B0\u7248\u51FA\u56FE\u66F4\u5FEB\u3001\u539F\u751F2K\u9AD8\u6E05\uFF0C\u7F8E\u5B66\u8D28\u611F\u884C\u4E1A\u6807\u6746\uFF1B\u5373\u68A6Seedream\u4E2D\u6587\u8BED\u4E49\u4E0E\u4EBA\u50CF\u8D28\u611F\u5F3A"
  },
  {
    international: "GPT Image",
    domestic: "\u901A\u4E49\u4E07\u76F8",
    category: "image",
    applicableTo: ["\u8BBE\u8BA1\u521B\u610F", "\u5E02\u573A\u8425\u9500", "\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C"],
    applicableTasks: ["\u5546\u4E1A\u63D2\u753B", "\u7D20\u6750\u751F\u6210", "\u6587\u5B57\u6E32\u67D3"],
    coreAdvantage: "\u5BF9\u8BDD\u5F0F\u751F\u6210+\u539F\u751F\u63A8\u7406\uFF0C\u591A\u8BED\u8A00\u6587\u5B57\u6E32\u67D3\u51C6\u786E\u3001\u4E00\u6B21\u591A\u56FE\u4E00\u81F4(\u63A5\u66FF\u5DF2\u505C\u7528\u7684DALL-E)\uFF1B\u901A\u4E49\u4E07\u76F8\u7535\u5546\u4E0E\u6587\u5B57\u6E32\u67D3\u51FA\u8272"
  },
  {
    international: "FLUX",
    domestic: "\u54E9\u5E03\u54E9\u5E03LiblibAI",
    category: "image",
    applicableTo: ["\u8BBE\u8BA1\u521B\u610F", "\u8F6F\u4EF6\u7814\u53D1", "\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C"],
    applicableTasks: ["\u5F00\u6E90\u6A21\u578B\u672C\u5730/\u79C1\u6709\u5316\u51FA\u56FE", "LoRA\u5FAE\u8C03\u5B9A\u5236\u753B\u98CE", "\u53EF\u63A7\u9AD8\u4FDD\u771F\u751F\u6210"],
    coreAdvantage: "FLUX\u4E3A\u5F53\u524D\u6700\u5F3A\u5F00\u6E90\u6743\u91CD\u6A21\u578B\u3001\u771F\u5B9E\u5149\u5F71\u53EF\u63A7\uFF1B\u54E9\u5E03\u54E9\u5E03\u662F\u56FD\u5185\u6700\u5927\u5F00\u6E90\u6A21\u578B+LoRA\u793E\u533A\uFF0C\u53EF\u5FAE\u8C03\u53EF\u79C1\u6709\u5316"
  },
  {
    international: "Adobe Firefly",
    domestic: "\u7A3F\u5B9AAI",
    category: "image",
    applicableTo: ["\u8BBE\u8BA1\u521B\u610F", "\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u5546\u4E1A\u63D2\u753B", "\u56FE\u50CF\u7F16\u8F91", "\u521B\u610F\u7D20\u6750"],
    coreAdvantage: "\u5546\u7528\u7248\u6743\u5B89\u5168+\u5BF9\u8BDD\u5F0F\u521B\u610F\u4EE3\u7406\uFF0C\u8DE8PS/AI/PR\uFF1B\u7A3F\u5B9A\u6A21\u677F\u4E30\u5BCC\u3001AI\u4E00\u7AD9\u5F0F\u51FA\u56FE"
  },
  {
    international: "Google Nano Banana",
    domestic: "\u8C46\u5305",
    category: "image",
    applicableTo: ["\u8BBE\u8BA1\u521B\u610F", "\u5E02\u573A\u8425\u9500", "\u901A\u7528\u529E\u516C"],
    applicableTasks: ["\u5BF9\u8BDD\u5F0F\u56FE\u50CF\u7F16\u8F91\u4E0E\u5408\u6210", "\u591A\u56FE\u89D2\u8272/\u98CE\u683C\u4E00\u81F4\u6027", "\u4E2D\u6587\u6D77\u62A5\u6587\u5B57\u6E32\u67D3"],
    coreAdvantage: "Gemini\u56FE\u50CF\u5BF9\u8BDD\u5F0F\u591A\u8F6E\u7F16\u8F91\u3001\u89D2\u8272\u4E00\u81F4\u6027\u6781\u5F3A\uFF1B\u8C46\u5305Seedream\u4E2D\u6587\u8BED\u4E49\u4E0E\u6D77\u62A5\u6587\u5B57\u6E32\u67D3\u51FA\u8272"
  },
  // ─── 视频生成 (video) ───
  {
    international: "Runway",
    domestic: "\u53EF\u7075AI",
    category: "video",
    applicableTo: ["\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C", "\u8BBE\u8BA1\u521B\u610F", "\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u5F71\u89C6\u7EA7\u89C6\u9891\u751F\u6210", "\u89C6\u9891\u7F16\u8F91", "\u7279\u6548", "\u5546\u4E1A\u5E7F\u544A"],
    coreAdvantage: "Gen-4.5\u7535\u5F71\u7EA7\u8FD0\u52A8\u4E0E\u4E16\u754C\u4E00\u81F4\u6027\uFF1B\u53EF\u70753.0\u7269\u7406\u5F15\u64CE+\u957F\u89C6\u9891+\u667A\u80FD\u5206\u955C\u4E0E\u539F\u751F\u97F3\u753B\u540C\u6B65"
  },
  {
    international: "Google Veo",
    domestic: "\u901A\u4E49\u4E07\u76F8",
    category: "video",
    applicableTo: ["\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C", "\u5E02\u573A\u8425\u9500", "\u8BBE\u8BA1\u521B\u610F"],
    applicableTasks: ["\u7535\u5F71\u7EA7\u77ED\u89C6\u9891\u751F\u6210", "\u539F\u751F\u97F3\u753B\u540C\u6B65", "4K\u5347\u91C7\u6837\u4E0E\u573A\u666F\u5EF6\u5C55"],
    coreAdvantage: "Veo\u539F\u751F\u97F3\u753B\u540C\u6B65\u30014K\u4E0E\u957F\u955C\u5934\u5EF6\u5C55\uFF1B\u901A\u4E49\u4E07\u76F8\u53C2\u8003\u751F\u89C6\u9891\u3001\u591A\u955C\u5934\u53D9\u4E8B\uFF0C\u5747\u4E3A\u5F71\u89C6\u7EA7\u751F\u6210"
  },
  {
    international: "Pika",
    domestic: "\u5373\u68A6AI\u89C6\u9891",
    category: "video",
    applicableTo: ["\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C", "\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u5FEB\u901F\u51FA\u7247", "\u52A8\u753B\u7279\u6548", "\u77ED\u89C6\u9891\u5236\u4F5C"],
    coreAdvantage: "Pika\u4E3B\u6253\u793E\u4EA4\u77ED\u89C6\u9891\u7279\u6548\u3001\u51FA\u7247\u5FEB\uFF1B\u5373\u68A6\u89C6\u9891\u63A5\u5165Seedance\uFF0C\u591A\u6A21\u6001\u6DF7\u5408\u8F93\u5165+\u97F3\u753B\u540C\u6B65"
  },
  {
    international: "Luma",
    domestic: "\u6D77\u87BAAI",
    category: "video",
    applicableTo: ["\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C", "\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u521B\u610F\u8FD0\u955C", "\u52A8\u753B", "\u77ED\u89C6\u9891"],
    coreAdvantage: "Luma Dream Machine\u521B\u610F\u8FD0\u955C\u5F3A\uFF1B\u6D77\u87BA(MiniMax)\u8FD0\u52A8\u81EA\u7136\u3001\u591A\u98CE\u683C(\u5199\u5B9E/\u52A8\u6F2B/\u6C34\u58A8)\uFF0C\u6027\u4EF7\u6BD4\u9AD8"
  },
  {
    international: "HeyGen",
    domestic: "\u7845\u57FA\u667A\u80FD",
    category: "video",
    applicableTo: ["\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C", "\u5E02\u573A\u8425\u9500", "\u4EBA\u529B\u8D44\u6E90"],
    applicableTasks: ["\u6570\u5B57\u4EBA\u89C6\u9891", "\u591A\u8BED\u79CD\u914D\u97F3", "\u57F9\u8BAD\u89C6\u9891"],
    coreAdvantage: "HeyGen\u624B\u673A\u7D20\u6750\u5373\u751F\u6210\u6570\u5B57\u5206\u8EAB\u3001175+\u8BED\u8A00\u53E3\u578B\u5339\u914D\uFF1B\u7845\u57FA\u667A\u80FD\u56FD\u5185\u6570\u5B57\u4EBA\u5E02\u5360\u7387\u9886\u5148"
  },
  {
    international: "Synthesia",
    domestic: "\u4E07\u5174\u64AD\u7206",
    category: "video",
    applicableTo: ["\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C", "\u5E02\u573A\u8425\u9500", "\u4EBA\u529B\u8D44\u6E90"],
    applicableTasks: ["\u57F9\u8BAD\u89C6\u9891", "\u5408\u89C4\u6570\u5B57\u4EBA", "\u8425\u9500\u89C6\u9891"],
    coreAdvantage: "Synthesia\u4F01\u4E1A\u7EA7\u57F9\u8BAD/\u5408\u89C4\u6570\u5B57\u4EBA\u3001230+\u5F62\u8C61\u5E93\u3001\u591A\u8BED\u8A00\u5FAE\u8868\u60C5\uFF1B\u4E07\u5174\u64AD\u7206\u591A\u8BED\u8A00\u53E3\u64AD"
  },
  {
    international: "D-ID",
    domestic: "\u817E\u8BAF\u667A\u5F71",
    category: "video",
    applicableTo: ["\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C", "\u5E02\u573A\u8425\u9500", "\u4EBA\u529B\u8D44\u6E90", "\u5BA2\u670D"],
    applicableTasks: ["\u6570\u5B57\u4EBA\u53E3\u64AD\u6279\u91CF\u751F\u6210", "PPT/\u6587\u7AE0\u8F6C\u89C6\u9891", "\u7535\u5546\u76F4\u64AD\u5206\u8EAB"],
    coreAdvantage: "D-ID\u5FEB\u901F\u6279\u91CF\u6570\u5B57\u4EBA\u53E3\u64AD\uFF1B\u817E\u8BAF\u667A\u5F71\u6D4F\u89C8\u5668\u514D\u4E0B\u8F7D\u3001PPT\u8F6C\u89C6\u9891\u3001\u57FA\u7840\u529F\u80FD\u514D\u8D39\uFF0C\u9002\u5408\u56FD\u5185\u57F9\u8BAD\u4E0E\u7535\u5546"
  },
  // ─── 音频语音 (audio) ───
  {
    international: "ElevenLabs",
    domestic: "\u706B\u5C71\u5F15\u64CE\u8BED\u97F3",
    category: "audio",
    applicableTo: ["\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C", "\u5E02\u573A\u8425\u9500", "\u5BA2\u670D"],
    applicableTasks: ["AI\u8BED\u97F3\u5408\u6210", "\u591A\u8BED\u79CD\u914D\u97F3", "\u8BED\u97F3\u514B\u9686", "\u591A\u89D2\u8272\u5BF9\u8BDD"],
    coreAdvantage: "\u60C5\u611F\u8868\u73B0\u529B\u6700\u5F3A+\u591A\u89D2\u8272\u5BF9\u8BDD\uFF0C\u591A\u8BED\u79CD\u81EA\u7136\u5EA6\u6781\u9AD8\uFF1B\u706B\u5C71(\u8C46\u5305)\u8BED\u97F3\u4E2D\u6587\u97F3\u8272\u4E30\u5BCC\u3001\u5B9E\u65F6\u5408\u6210"
  },
  {
    international: "Suno",
    domestic: "\u5929\u5DE5\u97F3\u4E50",
    category: "audio",
    applicableTo: ["\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C", "\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["AI\u97F3\u4E50\u521B\u4F5C", "\u80CC\u666F\u97F3\u4E50\u751F\u6210", "\u4EBA\u58F0\u514B\u9686"],
    coreAdvantage: "\u6587\u672C\u751F\u6210\u5B8C\u6574\u6B4C\u66F2\uFF0C\u652F\u6301\u4EBA\u58F0\u514B\u9686\u4E0E\u6BCD\u5E26\u7EA7\u97F3\u8D28\uFF1B\u5929\u5DE5\u652F\u6301\u7CA4\u8BED/\u65B9\u8A00\u6F14\u5531"
  },
  {
    international: "Murf AI",
    domestic: "\u8BAF\u98DE\u667A\u4F5C",
    category: "audio",
    applicableTo: ["\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C", "\u5E02\u573A\u8425\u9500", "\u5BA2\u670D"],
    applicableTasks: ["\u8BED\u97F3\u5408\u6210", "\u914D\u97F3", "\u6709\u58F0\u5185\u5BB9"],
    coreAdvantage: "\u4F01\u4E1A\u7EA7\u5546\u7528\u914D\u97F3\u5DE5\u4F5C\u5BA4\uFF0C\u652F\u6301\u591A\u8BED\u8A00\u591A\u98CE\u683C\uFF1B\u8BAF\u98DE\u667A\u4F5C\u4E2D\u6587\u914D\u97F3+\u865A\u62DF\u4EBA\u4E00\u7AD9\u5F0F"
  },
  // ─── 设计工具 (design) ───
  {
    international: "Canva",
    domestic: "\u7A3F\u5B9AAI",
    category: "design",
    applicableTo: ["\u8BBE\u8BA1\u521B\u610F", "\u5E02\u573A\u8425\u9500", "\u901A\u7528\u529E\u516C"],
    applicableTasks: ["\u6D77\u62A5\u8BBE\u8BA1", "\u8425\u9500\u7269\u6599", "\u793E\u4EA4\u5A92\u4F53\u7D20\u6750"],
    coreAdvantage: "\u6A21\u677F\u6781\u4E30\u5BCC+Magic Studio AI\u8BBE\u8BA1\u4E00\u4F53\uFF0C\u5168\u7403\u7528\u6237\u91CF\u6700\u5927\uFF1B\u7A3F\u5B9A\u4E2D\u6587\u573A\u666F\u6A21\u677F\u4E30\u5BCC"
  },
  {
    international: "Adobe Firefly",
    domestic: "\u7F8E\u56FE\u8BBE\u8BA1\u5BA4",
    category: "design",
    applicableTo: ["\u8BBE\u8BA1\u521B\u610F", "\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u5546\u4E1A\u63D2\u753B", "\u56FE\u50CF\u7F16\u8F91", "AI\u5546\u54C1\u56FE", "\u8425\u9500\u7269\u6599"],
    coreAdvantage: "\u7248\u6743\u5B89\u5168\u7684\u5BF9\u8BDD\u5F0F\u521B\u610F\u4EE3\u7406\uFF0C\u8DE8Adobe\u5168\u5BB6\u6876\uFF1B\u7F8E\u56FE\u8BBE\u8BA1\u5BA4\u7535\u5546/\u5546\u54C1\u56FEAI\uFF0C\u65E0\u8BBE\u8BA1\u57FA\u7840\u4E5F\u80FD\u5FEB\u901F\u51FA\u56FE"
  },
  {
    international: "Figma AI",
    domestic: "\u5373\u65F6\u8BBE\u8BA1AI",
    category: "design",
    applicableTo: ["\u8BBE\u8BA1\u521B\u610F", "\u4EA7\u54C1\u7ECF\u7406"],
    applicableTasks: ["UI\u8BBE\u8BA1", "\u534F\u4F5C\u8BBE\u8BA1", "\u8BBE\u8BA1\u7CFB\u7EDF", "\u539F\u578B\u8BBE\u8BA1", "\u4EA4\u4E92\u8BBE\u8BA1"],
    coreAdvantage: "\u753B\u5E03AI Agent\u76F4\u63A5\u8BBE\u8BA1+Figma Make\u751F\u6210\u53EF\u8FD0\u884C\u4EE3\u7801\uFF0CUI\u534F\u4F5C\u6807\u6746\uFF1B\u5373\u65F6\u8BBE\u8BA1\u56FD\u4EA7\u534F\u4F5CUI"
  },
  {
    international: "Recraft",
    domestic: "\u7A3F\u5B9AAI",
    category: "design",
    applicableTo: ["\u8BBE\u8BA1\u521B\u610F", "\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u77E2\u91CF/SVG\u56FE\u6807\u4E0E\u63D2\u753B", "\u54C1\u724C\u7EDF\u4E00\u98CE\u683C\u7D20\u6750", "\u8425\u9500\u7269\u6599\u8BBE\u8BA1"],
    coreAdvantage: "\u552F\u4E00\u53EF\u5BFC\u51FA\u771F\xB7\u53EF\u7F16\u8F91SVG\u77E2\u91CF\u7684AI\u6A21\u578B\uFF0C\u64C5\u957F\u54C1\u724C\u7EDF\u4E00\u98CE\u683C\u4E0E\u8425\u9500\u7D20\u6750\uFF1B\u7A3F\u5B9AAI\u4E2D\u6587\u6A21\u677F\u4E00\u952E\u8BBE\u8BA1"
  },
  // ─── 营销推广 (marketing) ───
  {
    international: "Jasper AI",
    domestic: "\u5DE8\u91CF\u5F15\u64CE",
    category: "marketing",
    applicableTo: ["\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u8425\u9500\u6587\u6848", "\u54C1\u724C\u8BED\u8C03\u5185\u5BB9", "GEO\u751F\u6210\u5F0F\u5F15\u64CE\u4F18\u5316", "\u5168\u81EA\u52A8\u6295\u653E"],
    coreAdvantage: "\u4F01\u4E1A\u7EA7\u54C1\u724C\u8BED\u8C03\u4E00\u81F4\u6027\u5185\u5BB9\u751F\u6210+GEO\u4F18\u5316AI\u641C\u7D22\u66DD\u5149\uFF1B\u5DE8\u91CF'\u5373\u521B'\u5168\u94FE\u8DEFAIGC\u521B\u610F+\u5168\u81EA\u52A8\u653E\u91CF\u6295\u653E"
  },
  {
    international: "HubSpot Breeze",
    domestic: "\u9886\u5E06SCRM",
    category: "marketing",
    applicableTo: ["\u5E02\u573A\u8425\u9500", "\u9500\u552E"],
    applicableTasks: ["\u8425\u9500\u81EA\u52A8\u5316", "\u5BA2\u6237\u65C5\u7A0B\u7BA1\u7406", "\u90AE\u4EF6\u8425\u9500", "\u79C1\u57DF\u8FD0\u8425"],
    coreAdvantage: "CRM\u539F\u751F\u7684\u8425\u9500/\u9500\u552E/\u670D\u52A1\u5168\u57DFAI Agent\uFF1B\u9886\u5E06\u4F01\u5FAE\u79C1\u57DF\u5168\u6D41\u7A0BAI(\u667A\u80FD\u6253\u6807\u7B7E/\u8BDD\u672F\u63A8\u8350/\u4F1A\u8BDD\u603B\u7ED3)"
  },
  {
    international: "Copy.ai",
    domestic: "\u79D2\u521BAI",
    category: "marketing",
    applicableTo: ["\u5E02\u573A\u8425\u9500", "\u901A\u7528\u529E\u516C"],
    applicableTasks: ["\u6279\u91CF\u5185\u5BB9\u751F\u6210", "\u8425\u9500\u6587\u6848/\u90AE\u4EF6/\u793E\u5A92", "GTM\u5185\u5BB9\u5DE5\u4F5C\u6D41"],
    coreAdvantage: "\u4ECE\u5199\u4F5C\u52A9\u624B\u5347\u7EA7\u4E3AGTM AI\u5E73\u53F0\uFF0C\u5185\u7F6E\u83B7\u5BA2/\u5185\u5BB9/SEO\u5DE5\u4F5C\u6D41\uFF0C\u4E00\u952E\u6279\u91CF\u4EA7\u51FA\u5168\u6E20\u9053\u6587\u6848"
  },
  {
    international: "Surfer SEO",
    domestic: "5118",
    category: "marketing",
    applicableTo: ["\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["SEO\u5185\u5BB9\u4F18\u5316", "\u5173\u952E\u8BCD/\u5B9E\u4F53\u8986\u76D6", "AI\u641C\u7D22\u53EF\u89C1\u6027(GEO)"],
    coreAdvantage: "\u57FA\u4E8E\u5B9E\u65F6SERP\u7684\u6392\u540D\u4FE1\u53F7\u6253\u5206\uFF0C\u5E76\u8FFD\u8E2A\u5185\u5BB9\u5728AI\u5F15\u64CE\u4E2D\u7684\u88AB\u5F15\u7528\u7387\uFF1B5118\u63D0\u4F9B\u4E2D\u6587\u5173\u952E\u8BCD\u4E0ESEO\u6570\u636E"
  },
  {
    international: "Hootsuite",
    domestic: "\u65B0\u699C",
    category: "marketing",
    applicableTo: ["\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u591A\u5E73\u53F0\u793E\u5A92\u6392\u671F\u53D1\u5E03", "AI\u751F\u6210/\u6539\u5199\u6587\u6848", "\u793E\u4EA4\u8046\u542C\u4E0E\u8206\u60C5"],
    coreAdvantage: "\u4E00\u7AD9\u5F0F\u7BA1\u7406\u591A\u8D26\u53F7\u6392\u671F\u53D1\u5E03+AI\u70ED\u70B9\u6587\u6848+\u793E\u4EA4\u8046\u542C\uFF1B\u65B0\u699C\u63D0\u4F9B\u4E2D\u6587\u5168\u57DF\u5185\u5BB9\u6570\u636E\u4E0E\u6295\u653E\u6D1E\u5BDF"
  },
  {
    international: "Meta Advantage+",
    domestic: "\u817E\u8BAF\u5E7F\u544A\u5999\u601D",
    category: "marketing",
    applicableTo: ["\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u81EA\u52A8\u5316\u5E7F\u544A\u6295\u653E", "AI\u521B\u610F\u751F\u6210", "\u53D7\u4F17\u81EA\u52A8\u5339\u914D", "\u653E\u91CF\u4F18\u5316"],
    coreAdvantage: "AI\u63A5\u7BA1\u5B9A\u5411\u4E0E\u521B\u610F\u81EA\u52A8\u653E\u91CF\uFF1B\u817E\u8BAF\u5999\u601D\u57FA\u4E8E\u6DF7\u5143\u5927\u6A21\u578B\u79D2\u751F\u6210\u7D20\u6750\u3001\u8FC7\u5BA1\u5FEB\u3001\u4EBA\u50CF\u514D\u6388\u6743"
  },
  {
    international: "Klaviyo",
    domestic: "\u81F4\u8DA3\u767E\u5DDD",
    category: "marketing",
    applicableTo: ["\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u90AE\u4EF6/\u77ED\u4FE1\u8425\u9500\u81EA\u52A8\u5316", "\u667A\u80FD\u5206\u5C42\u4E0E\u65C5\u7A0B", "\u9884\u6D4BCLV\u5206\u6D41"],
    coreAdvantage: "Flows AI\u81EA\u7136\u8BED\u8A00\u63CF\u8FF0\u5373\u642D\u5EFA\u8425\u9500\u65C5\u7A0B\uFF0C\u6309\u9884\u6D4B\u5BA2\u6237\u4EF7\u503C\u667A\u80FD\u5206\u6D41\uFF1B\u81F4\u8DA3\u767E\u5DDD\u4E3B\u6253B2B\u79C1\u57DF\u4E0E\u7EBF\u7D22\u57F9\u80B2"
  },
  {
    international: "CreatorIQ",
    domestic: "\u5C0F\u7EA2\u4E66\u84B2\u516C\u82F1",
    category: "marketing",
    applicableTo: ["\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u8FBE\u4EBA/KOL\u7B5B\u9009\u4E0E\u5408\u4F5C", "\u79CD\u8349\u5185\u5BB9\u6295\u653E", "\u6548\u679C\u6570\u636E\u8FFD\u8E2A"],
    coreAdvantage: "\u8FBE\u4EBA\u8425\u9500\u5168\u6D41\u7A0B\u7BA1\u7406(\u9009\u4EBA-\u5408\u4F5C-\u6570\u636E)\uFF1B\u84B2\u516C\u82F1\u6253\u901A'\u5185\u5BB9\u79CD\u8349-\u7AD9\u5185\u6210\u4EA4'\u95ED\u73AF\uFF0C\u662F\u4E2D\u56FD\u79CD\u8349\u8425\u9500\u6838\u5FC3\u5E73\u53F0"
  },
  // ─── 销售CRM (sales) ───
  {
    international: "Salesforce Agentforce",
    domestic: "\u7EB7\u4EAB\u9500\u5BA2",
    category: "sales",
    applicableTo: ["\u9500\u552E", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u5BA2\u6237\u7BA1\u7406", "\u5546\u673A\u6D1E\u5BDF", "\u9500\u552E\u9884\u6D4B", "\u591A\u667A\u80FD\u4F53\u7F16\u6392"],
    coreAdvantage: "\u4F01\u4E1A\u7EA7\u591A\u667A\u80FD\u4F53\u7F16\u6392+\u8BED\u97F3Agent+\u4FE1\u4EFB\u5C42\uFF1B\u7EB7\u4EAB\u9500\u5BA2\u61C2\u4E2D\u56FD\u4E1A\u52A1\u7684Agentic CRM\uFF0C\u83B7\u5BA2\u5230\u670D\u52A1\u5F52\u56E0\u5168\u94FEAI"
  },
  {
    international: "Zoho CRM",
    domestic: "\u63A2\u8FF9",
    category: "sales",
    applicableTo: ["\u9500\u552E"],
    applicableTasks: ["\u5BA2\u6237\u7BA1\u7406", "\u667A\u80FD\u83B7\u5BA2", "\u9500\u552E\u9884\u6D4B", "\u81EA\u52A8\u89E6\u8FBE"],
    coreAdvantage: "\u4F4E\u4EE3\u7801\u81EA\u5EFAAI Agent(Zia)+\u9884\u6D4B\u8BC4\u5206\uFF1B\u63A2\u8FF95\u4E07+\u4F01\u4E1A\u6570\u636E\u5E95\u5EA7\u7684\u7AEF\u5230\u7AEF\u627E\u5BA2\u6237/\u80CC\u8C03/\u81EA\u52A8\u89E6\u8FBE"
  },
  {
    international: "Gong",
    domestic: "\u6DF1\u7EF4\u667A\u4FE1Megaview",
    category: "sales",
    applicableTo: ["\u9500\u552E", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u9500\u552E\u4F1A\u8BDD\u667A\u80FD\u5206\u6790", "\u5546\u673A\u98CE\u9669\u9884\u8B66", "AI\u901A\u8BDD\u8BC4\u5206/\u966A\u7EC3", "\u56E2\u961F\u590D\u76D8"],
    coreAdvantage: "\u4EE5\u9500\u552E\u5F55\u97F3\u4E3A\u6838\u5FC3\u6570\u636E\u6E90\uFF0CAI\u63D0\u53D6\u5F02\u8BAE\u4E0E\u8D2D\u4E70\u4FE1\u53F7\u5E76\u9884\u6D4B\u98CE\u9669\uFF1B\u6DF1\u7EF4\u667A\u4FE1\u4E3A\u56FD\u4EA7\u4F1A\u8BDD\u667A\u80FD\u5BF9\u6807"
  },
  {
    international: "Apollo.io",
    domestic: "\u706B\u773C\u4E91",
    category: "sales",
    applicableTo: ["\u9500\u552E", "\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["B2B\u7EBF\u7D22\u6316\u6398", "AI\u6279\u91CF\u5916\u547C\u5E8F\u5217", "\u8D26\u6237/\u610F\u5411\u8BC4\u5206", "\u4E2A\u6027\u5316\u89E6\u8FBE"],
    coreAdvantage: "2\u4EBF+\u8054\u7CFB\u4EBA\u5E93+\u4EE3\u7406\u5F0FGTM\uFF0C\u4ECE\u5EFA\u540D\u5355\u5230\u542F\u52A8\u89E6\u8FBE\u5E8F\u5217\u591A\u6B65\u81EA\u52A8\u6267\u884C\uFF1B\u706B\u773C\u4E91\u4E3A\u4E2D\u56FDB2B\u83B7\u5BA2\u4E0E\u610F\u5411\u6570\u636E\u4EE3\u8868"
  },
  {
    international: "Microsoft Dynamics 365 Sales",
    domestic: "\u9500\u552E\u6613",
    category: "sales",
    applicableTo: ["\u9500\u552E", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u4F01\u4E1A\u7EA7CRM\u9500\u552E\u7BA1\u7406", "AI\u9500\u552E\u52A9\u7406/\u6559\u7EC3", "\u5546\u673A\u9884\u6D4B", "\u7EBF\u7D22\u5230\u56DE\u6B3E"],
    coreAdvantage: "Copilot\u6DF1\u5EA6\u5D4C\u5165\u9500\u552E\u5168\u6D41\u7A0B\uFF1B\u9500\u552E\u6613AI\u539F\u751FCRM NeoAgent\u542B\u52A9\u7406/\u7ECF\u7406/\u6559\u7EC3\u7B49\u591AAgent\uFF0C\u8986\u76D6\u8425\u9500\u9500\u552E\u670D\u52A1\u5168\u573A\u666F"
  },
  {
    international: "Salesloft",
    domestic: "\u5BB9\u8054\u4E91",
    category: "sales",
    applicableTo: ["\u9500\u552E"],
    applicableTasks: ["\u9500\u552E\u89E6\u8FBE\u8282\u594F(Cadence)", "\u667A\u80FD\u5916\u547C", "\u591A\u6E20\u9053\u8DDF\u8FDB\u81EA\u52A8\u5316"],
    coreAdvantage: "AI\u9A71\u52A8\u7684\u9500\u552E\u53C2\u4E0E\u4E0E\u5916\u547C\u8282\u594F\u7BA1\u7406\uFF0C\u81EA\u52A8\u6392\u5E03\u591A\u6E20\u9053\u8DDF\u8FDB\uFF1B\u5BB9\u8054\u4E91\u63D0\u4F9B\u672C\u571F\u667A\u80FD\u8BED\u97F3\u5916\u547C\u4E0E\u8054\u7EDC\u4E2D\u5FC3"
  },
  // ─── 客户服务 (service) ───
  {
    international: "Zendesk AI",
    domestic: "\u667A\u9F7F\u79D1\u6280",
    category: "service",
    applicableTo: ["\u5BA2\u670D"],
    applicableTasks: ["\u667A\u80FD\u95EE\u7B54", "\u5DE5\u5355\u5904\u7406", "\u591A\u8BED\u8A00\u5BA2\u670D", "\u8BED\u97F3Agent"],
    coreAdvantage: "\u5347\u7EA7\u4E3A\u6309'\u5DF2\u9A8C\u8BC1\u89E3\u51B3\u91CF'\u8BA1\u8D39\u7684\u81EA\u4E3BAI Agent\uFF0C\u6587\u672C+\u8BED\u97F3+\u90AE\u4EF6\u5168\u6E20\u9053\uFF1B\u667A\u9F7F\u5BF9\u63A5\u591A\u6A21\u578B\u7684\u5168\u6E20\u9053\u5BA2\u670DAgent"
  },
  {
    international: "Fin",
    domestic: "\u7F51\u6613\u4E03\u9C7C",
    category: "service",
    applicableTo: ["\u5BA2\u670D"],
    applicableTasks: ["\u667A\u80FD\u95EE\u7B54", "\u5BA2\u6237\u670D\u52A1\u81EA\u52A8\u5316", "\u5168\u6E20\u9053\u63A5\u5F85"],
    coreAdvantage: "Fin(\u539FIntercom)\u6309\u89E3\u51B3\u7ED3\u679C\u8BA1\u8D39\u7684\u9AD8\u89E3\u51B3\u7387\u5BA2\u670DAgent\uFF1B\u7F51\u6613\u4E03\u9C7C\u5F3A\u5408\u89C4(\u7B49\u4FDD\u4E09\u7EA7)\u3001\u91D1\u878D\u653F\u52A1\u8BED\u6599\u6DF1\u539A"
  },
  {
    international: "Sierra",
    domestic: "\u8FFD\u4E00\u79D1\u6280",
    category: "service",
    applicableTo: ["\u5BA2\u670D"],
    applicableTasks: ["\u5168\u6E20\u9053\u81EA\u4E3B\u5BA2\u670DAgent", "\u590D\u6742\u591A\u8F6E\u4EFB\u52A1", "\u9000\u6B3E/\u8D26\u6237\u53D8\u66F4\u7B49\u52A8\u4F5C\u6267\u884C"],
    coreAdvantage: "Bret Taylor\u521B\u7ACB\u7684\u5BA2\u670DAgent OS\uFF0C\u53EF\u4ECESOP/\u901A\u8BDD\u8BB0\u5F55\u76F4\u63A5\u6784\u5EFA\u751F\u4EA7\u7EA7Agent\uFF1B\u8FFD\u4E00\u79D1\u6280\u4E3A\u56FD\u4EA7\u5BF9\u8BDD\u5F0FAI\u6570\u5B57\u5458\u5DE5\u4EE3\u8868"
  },
  {
    international: "Decagon",
    domestic: "\u5FEB\u5546\u901A",
    category: "service",
    applicableTo: ["\u5BA2\u670D", "\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u7AEF\u5230\u7AEF\u5BA2\u670D\u81EA\u52A8\u5316", "\u81EA\u7136\u8BED\u8A00\u5B9A\u4E49Agent\u6D41\u7A0B", "\u83B7\u5BA2\u7559\u8D44"],
    coreAdvantage: "\u7528\u81EA\u7136\u8BED\u8A00\u5B9A\u4E49Agent\u903B\u8F91\u7AEF\u5230\u7AEF\u5904\u7406\u652F\u6301\u4EFB\u52A1\uFF1B\u5FEB\u5546\u901A\u81EA\u7814\u5927\u6A21\u578B\u4E3B\u6253\u83B7\u5BA2\u7559\u8D44\uFF0C\u533B\u7F8E/\u8425\u9500\u573A\u666F\u9886\u5148"
  },
  {
    international: "Gorgias",
    domestic: "\u963F\u91CC\u5E97\u5C0F\u871C",
    category: "service",
    applicableTo: ["\u5BA2\u670D"],
    applicableTasks: ["\u7535\u5546\u552E\u524D\u552E\u540E\u5BA2\u670D", "\u8BA2\u5355/\u9000\u6362\u5904\u7406", "\u8BE2\u5355\u8F6C\u5316"],
    coreAdvantage: "\u9762\u5411Shopify\u7B49\u7535\u5546\u7684AI\u5BA2\u670D\uFF1B\u5E97\u5C0F\u871C\u65E5\u5BF9\u8BDD\u5343\u4E07\u7EA7\uFF0C'AI\u4F18\u5148+\u4EBA\u5DE5\u515C\u5E95'\u663E\u8457\u63D0\u5347\u8BE2\u5355\u8F6C\u5316"
  },
  {
    international: "Freshworks Freddy AI",
    domestic: "Udesk\u6C83\u4E30\u79D1\u6280",
    category: "service",
    applicableTo: ["\u5BA2\u670D"],
    applicableTasks: ["\u5DE5\u5355\u81EA\u52A8\u5206\u6D3E\u4E0E\u89E3\u7B54", "\u5750\u5E2D\u8F85\u52A9", "\u5168\u6E20\u9053\u667A\u80FD\u5BA2\u670D"],
    coreAdvantage: "Freddy AI\u8986\u76D6\u5BA2\u670D\u5168\u6D41\u7A0B\uFF1BUdesk(\u6C83\u4E30)\u5927\u6A21\u578B\u79C1\u6709\u5316\u90E8\u7F72+\u5168\u6E20\u9053\u5BA2\u670D/\u547C\u53EB\u4E2D\u5FC3\u4E00\u4F53\u5316\uFF0C\u9002\u914D\u4E2D\u5927\u578B\u4F01\u4E1A"
  },
  // ─── 人力资源 (hr) ───
  {
    international: "Workday AI",
    domestic: "\u5317\u68EE",
    category: "hr",
    applicableTo: ["\u4EBA\u529B\u8D44\u6E90"],
    applicableTasks: ["\u4EBA\u624D\u7BA1\u7406", "\u62DB\u8058\u5206\u6790", "\u7EE9\u6548\u7BA1\u7406", "\u7EC4\u7EC7\u53D1\u5C55"],
    coreAdvantage: "\u4E00\u4F53\u5316HCM+Paradox\u5BF9\u8BDD\u5F0F\u62DB\u8058Agent\uFF1B\u5317\u68EE\u5168\u6A21\u5757\u4E00\u4F53\u5316+AI\u4EBA\u624D\u6D4B\u8BC4"
  },
  {
    international: "Workday AI",
    domestic: "Moka AI",
    category: "hr",
    applicableTo: ["\u4EBA\u529B\u8D44\u6E90"],
    applicableTasks: ["\u7B80\u5386\u7B5B\u9009", "\u4EBA\u5C97\u5339\u914D", "\u62DB\u8058\u6D41\u7A0B\u7BA1\u7406"],
    coreAdvantage: "Moka AI\u539F\u751F\u62DB\u8058\u667A\u80FD\u4F53'Eva'\uFF0C\u8986\u76D6\u7B80\u5386\u89E3\u6790/\u4EBA\u624D\u63A8\u8350/\u62DB\u8058\u5168\u6D41\u7A0B\uFF0C\u56FD\u5185\u62DB\u8058SaaS\u6807\u6746"
  },
  {
    international: "HireVue",
    domestic: "e\u6210\u79D1\u6280",
    category: "hr",
    applicableTo: ["\u4EBA\u529B\u8D44\u6E90"],
    applicableTasks: ["AI\u89C6\u9891\u9762\u8BD5", "\u4EBA\u624D\u6D4B\u8BC4", "\u7ED3\u6784\u5316\u8BC4\u4F30"],
    coreAdvantage: "\u7ED3\u6784\u5316AI\u89C6\u9891\u9762\u8BD5+\u6D4B\u8BC4\u3001\u7F29\u77ED\u62DB\u8058\u5468\u671F\uFF1Be\u6210\u79D1\u6280\u4EBA\u624D\u753B\u50CF\u4E0E\u667A\u80FD\u5339\u914D"
  },
  {
    international: "Eightfold AI",
    domestic: "\u7528\u53CB\u5927\u6613",
    category: "hr",
    applicableTo: ["\u4EBA\u529B\u8D44\u6E90"],
    applicableTasks: ["\u4EBA\u624D\u667A\u80FD\u5339\u914D", "\u5185\u90E8\u4EBA\u624D\u5E02\u573A", "\u6280\u80FD\u76D8\u70B9"],
    coreAdvantage: "\u6280\u80FD\u56FE\u8C31\u9A71\u52A8\u7684\u4EBA\u624D\u667A\u80FD\u5339\u914D\uFF0C\u65B0\u589EAI\u81EA\u4E3B\u9762\u8BD5\uFF1B\u7528\u53CB\u5927\u6613\u62DB\u8058\u4E00\u4F53\u5316"
  },
  {
    international: "Paradox",
    domestic: "\u667A\u8054\u62DB\u8058",
    category: "hr",
    applicableTo: ["\u4EBA\u529B\u8D44\u6E90"],
    applicableTasks: ["\u9AD8\u9891/\u84DD\u9886\u62DB\u8058", "\u7B80\u5386\u521D\u7B5B", "\u9762\u8BD5\u81EA\u52A8\u5B89\u6392"],
    coreAdvantage: "\u5BF9\u8BDD\u5F0F\u62DB\u8058\u673A\u5668\u4EBA\u81EA\u52A8\u5B8C\u6210\u7B5B\u9009/\u7B54\u7591/\u9762\u8BD5\u9884\u7EA6(\u5DF2\u5E76\u5165Workday)\uFF1B\u667A\u8054\u62DB\u8058AI\u9AD8\u9891\u62DB\u8058\u63D0\u6548"
  },
  // ─── 数据分析 (data) ───
  {
    international: "Power BI Copilot",
    domestic: "\u5E06\u8F6FFineBI",
    category: "data",
    applicableTo: ["\u6570\u636E\u5206\u6790", "\u7BA1\u7406\u51B3\u7B56", "\u8D22\u52A1"],
    applicableTasks: ["\u6570\u636E\u53EF\u89C6\u5316", "\u81EA\u7136\u8BED\u8A00\u95EE\u6570", "\u667A\u80FD\u62A5\u8868"],
    coreAdvantage: "\u5FAE\u8F6F\u751F\u6001\u6DF1\u5EA6\u96C6\u6210\uFF0C\u81EA\u7136\u8BED\u8A00\u751F\u6210\u62A5\u8868/DAX\uFF1B\u5E06\u8F6FFineChatBI\u5BF9\u8BDD\u5F0F\u4E1A\u52A1\u5206\u6790\u3001\u5F02\u5E38\u8BC6\u522B"
  },
  {
    international: "Tableau AI",
    domestic: "\u963F\u91CC\u4E91Quick BI",
    category: "data",
    applicableTo: ["\u6570\u636E\u5206\u6790", "\u7BA1\u7406\u51B3\u7B56", "\u8D22\u52A1"],
    applicableTasks: ["\u6570\u636E\u53EF\u89C6\u5316", "\u667A\u80FD\u6D1E\u5BDF", "\u81EA\u7136\u8BED\u8A00\u5206\u6790"],
    coreAdvantage: "Pulse\u6307\u6807\u5C42+Tableau Agent(\u652F\u6301MCP)\uFF0C\u53EF\u89C6\u5316\u80FD\u529B\u6781\u5F3A\uFF1BQuick BI'\u667A\u80FD\u5C0FQ'\u5927\u6A21\u578B\u9A71\u52A8\u8FDE\u7EED\u95EE\u6570"
  },
  {
    international: "Julius AI",
    domestic: "\u89C2\u8FDC\u6570\u636E",
    category: "data",
    applicableTo: ["\u6570\u636E\u5206\u6790"],
    applicableTasks: ["\u81EA\u7136\u8BED\u8A00\u95EE\u6570", "\u81EA\u52A8\u51FA\u56FE", "\u6570\u636E\u63A2\u7D22"],
    coreAdvantage: "\u4E0A\u4F20\u8868\u683C\u6216\u8FDE\u5E93\u5373\u7528\u81EA\u7136\u8BED\u8A00\u63D0\u95EE\uFF0C\u81EA\u52A8\u751F\u6210\u4EE3\u7801/\u56FE\u8868/\u7ED3\u8BBA\uFF1B\u89C2\u8FDC\u6570\u636E\u4E00\u7AD9\u5F0FBI+AI\u5206\u6790"
  },
  {
    international: "DataGPT",
    domestic: "\u6570\u52BF\u79D1\u6280",
    category: "data",
    applicableTo: ["\u6570\u636E\u5206\u6790", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u6307\u6807\u95EE\u7B54", "\u81EA\u52A8\u5F52\u56E0\u5206\u6790"],
    coreAdvantage: "\u5BF9\u8BDD\u5F0F\u6307\u6807\u5E73\u53F0\uFF0C\u81EA\u52A8\u5B8C\u6210\u5F02\u52A8\u5F52\u56E0\u4E0E\u6D1E\u5BDF\u751F\u6210\uFF1B\u6570\u52BF\u79D1\u6280\u4F01\u4E1A\u7EA7\u6307\u6807\u4E0E\u5206\u6790Agent"
  },
  // ─── 法务合规 (legal) ───
  {
    international: "Harvey AI",
    domestic: "\u6CD5\u5927\u5927iTerms",
    category: "legal",
    applicableTo: ["\u6CD5\u52A1\u5408\u89C4"],
    applicableTasks: ["\u6CD5\u5F8B\u7814\u7A76", "\u5408\u540C\u5206\u6790", "\u6587\u4E66\u8D77\u8349"],
    coreAdvantage: "\u5168\u7403\u6700\u5F3A\u6CD5\u5F8BAI\uFF0CAgent Builder+500+\u9884\u7F6E\u6CD5\u5F8B\u667A\u80FD\u4F53\uFF1B\u6CD5\u5927\u5927iTerms\u4E2D\u6587\u975E\u6807\u5408\u540C\u667A\u5BA1"
  },
  {
    international: "Spellbook",
    domestic: "\u5E42\u5F8B\u667A\u80FD",
    category: "legal",
    applicableTo: ["\u6CD5\u52A1\u5408\u89C4"],
    applicableTasks: ["\u5408\u540C\u8D77\u8349", "\u6761\u6B3E\u98CE\u9669\u5BA1\u67E5"],
    coreAdvantage: "Word\u5185\u5D4CAI\u8D77\u8349\u4E0E\u9010\u6761\u7EA2\u7EBF\u5EFA\u8BAE\u3001\u9762\u5411\u5355\u4EFD\u5408\u540C\u9AD8\u6548\u5BA1\u6539\uFF1B\u5E42\u5F8BMeCheck\u5408\u540C\u5BA1\u67E5\u4E13\u4E1A\u5EA6\u9AD8"
  },
  {
    international: "Legora",
    domestic: "\u901A\u4E49\u6CD5\u777F",
    category: "legal",
    applicableTo: ["\u6CD5\u52A1\u5408\u89C4"],
    applicableTasks: ["\u5408\u540C\u5BA1\u67E5\u4E0E\u7EA2\u7EBF", "\u6CD5\u5F8B\u7814\u7A76", "\u6587\u4E66\u8D77\u8349"],
    coreAdvantage: "Word/Outlook\u539F\u751F\u534F\u4F5C\u5F0F\u6CD5\u5F8BAI\uFF0C\u652F\u6301playbook\u89C4\u5219\u5BA1\u67E5\u4E0E\u5408\u540C\u6570\u636E\u63D0\u53D6\uFF1B\u901A\u4E49\u6CD5\u777F\u4E2D\u6587\u6CD5\u5F8B\u7814\u7A76\u4E0E\u54A8\u8BE2"
  },
  {
    international: "Robin AI",
    domestic: "iCourt Alpha",
    category: "legal",
    applicableTo: ["\u6CD5\u52A1\u5408\u89C4"],
    applicableTasks: ["\u5408\u540C\u5BA1\u67E5", "\u5408\u540C\u5168\u751F\u547D\u5468\u671F\u7BA1\u7406(CLM)"],
    coreAdvantage: "\u4EBF\u7EA7\u6761\u6B3E\u8BAD\u7EC3+\u6570\u636E\u79C1\u6709\u5316\u73AF\u5883\uFF0C\u5BA1\u67E5\u4E0ECLM\u4E00\u4F53\u5316\uFF1BiCourt Alpha\u56FD\u5185\u5F8B\u6240\u667A\u80FD\u5DE5\u4F5C\u53F0"
  },
  {
    international: "Vanta",
    domestic: "\u5408\u89C4\u732B",
    category: "legal",
    applicableTo: ["\u6CD5\u52A1\u5408\u89C4"],
    applicableTasks: ["\u5B89\u5168\u5408\u89C4\u8BA4\u8BC1(SOC2/ISO)", "\u5408\u89C4\u95EE\u5377\u4E0E\u5236\u5EA6\u8D77\u8349", "\u8BC1\u636E\u81EA\u52A8\u6536\u96C6"],
    coreAdvantage: "AI Agent\u81EA\u52A8\u5316\u5408\u89C4:\u8BC1\u636E\u91C7\u96C6/\u5236\u5EA6\u8D77\u8349/\u95EE\u5377\u5E94\u7B54\uFF0C\u8986\u76D6EU AI Act\uFF1B\u5408\u89C4\u732B\u56FD\u5185\u5408\u89C4\u7BA1\u7406"
  },
  // ─── 财务管理 (finance) ───
  {
    international: "SAP AI",
    domestic: "\u91D1\u8776AI",
    category: "finance",
    applicableTo: ["\u8D22\u52A1", "\u4F9B\u5E94\u94FE/\u8FD0\u8425", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u8D22\u52A1\u5206\u6790", "\u667A\u80FD\u5BA1\u5355", "\u51ED\u8BC1/\u5BF9\u8D26\u81EA\u6CBB", "\u8D22\u62A5\u5206\u6790"],
    coreAdvantage: "Joule\u8D22\u52A1\u81EA\u6CBBAgent(\u51ED\u8BC1/\u5BF9\u8D26/\u8BA1\u63D0)\u51CF\u8D1F\u663E\u8457\uFF1B\u91D1\u8776'AI\u8D85\u7EA7\u5957\u4EF6'\u5185\u7F6E\u591A\u667A\u80FD\u4F53\uFF0C\u82CD\u7A79GPT\u4E3A\u56FD\u4EA7\u8D22\u52A1\u5927\u6A21\u578B"
  },
  {
    international: "SAP AI",
    domestic: "\u7528\u53CB\u7F51\u7EDC",
    category: "finance",
    applicableTo: ["\u8D22\u52A1", "\u4F9B\u5E94\u94FE/\u8FD0\u8425"],
    applicableTasks: ["ERP\u667A\u80FD\u5316", "\u8D22\u52A1\u5171\u4EAB", "\u4F9B\u5E94\u94FE\u534F\u540C"],
    coreAdvantage: "SAP Joule\u4F9B\u5E94\u94FE\u4E0E\u8D22\u52A1Agent\uFF1B\u7528\u53CBYonClaw\u4F01\u4E1A\u8D85\u7EA7\u667A\u80FD\u4F53\u81EA\u4E3B\u62C6\u89E3\u5E76\u56DE\u5199\u4E1A\u52A1\u7ED3\u679C\uFF0CYonGPT\u9002\u914DDeepSeek"
  },
  {
    international: "ABBYY",
    domestic: "\u5408\u5408\u4FE1\u606F",
    category: "finance",
    applicableTo: ["\u8D22\u52A1"],
    applicableTasks: ["\u7968\u636E\u8BC6\u522B", "\u62A5\u9500\u81EA\u52A8\u5316", "OCR"],
    coreAdvantage: "ABBYY\u5168\u7403\u6587\u6863\u667A\u80FD\u4E0EIDP\u9886\u5148\uFF1B\u5408\u5408(TextIn)\u589E\u503C\u7A0E\u53D1\u7968/\u884C\u7A0B\u5355\u7B4920+\u56FD\u5185\u7968\u636E\u9AD8\u7CBE\u5EA6\u8BC6\u522B\u4E0E\u62A5\u9500\u81EA\u52A8\u5316"
  },
  {
    international: "SAP Concur",
    domestic: "\u6C47\u8054\u6613",
    category: "finance",
    applicableTo: ["\u8D22\u52A1", "\u901A\u7528\u529E\u516C"],
    applicableTasks: ["\u8D39\u7528\u62A5\u9500", "\u53D1\u7968OCR\u8BC6\u522B", "\u8D39\u63A7\u4E0E\u5DEE\u65C5\u7BA1\u7406"],
    coreAdvantage: "\u5168\u7403\u5DEE\u65C5\u8D39\u63A7\u6807\u6746\uFF1B\u6C47\u8054\u6613OCR\u9AD8\u7CBE\u5EA6\u8BC6\u7968+\u81EA\u52A8\u5206\u7C7B\u5BA1\u6838\u7684\u667A\u80FD\u8D39\u63A7\u62A5\u9500"
  },
  {
    international: "Pigment",
    domestic: "\u5143\u5E74\u79D1\u6280",
    category: "finance",
    applicableTo: ["\u8D22\u52A1", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u8D22\u52A1\u9884\u6D4BFP&A", "\u9884\u7B97\u7F16\u5236", "\u60C5\u666F/\u6EDA\u52A8\u6A21\u62DF"],
    coreAdvantage: "AI Agent\u9A71\u52A8\u7684\u8FDE\u63A5\u5F0F\u5B9E\u65F6\u4E1A\u52A1\u89C4\u5212\u4E0EFP&A\uFF1B\u5143\u5E74\u79D1\u6280\u56FD\u4EA7\u5168\u9762\u9884\u7B97\u4E0E\u8D22\u52A1\u5206\u6790"
  },
  // ─── 供应链 (supply_chain) ───
  {
    international: "SAP AI",
    domestic: "\u65F7\u89C6\u79D1\u6280",
    category: "supply_chain",
    applicableTo: ["\u4F9B\u5E94\u94FE/\u8FD0\u8425"],
    applicableTasks: ["\u4ED3\u50A8\u7269\u6D41\u81EA\u52A8\u5316", "\u89C6\u89C9\u8C03\u5EA6", "\u4ED3\u50A8\u673A\u5668\u4EBA"],
    coreAdvantage: "SAP IBP+Joule\u4F9B\u5E94\u94FEAgent\uFF1B\u65F7\u89C6\u6CB3\u56FEAI+\u89C6\u89C9/\u673A\u5668\u4EBA\u4E3B\u6253\u4ED3\u50A8\u7269\u6D41\u8F6F\u786C\u4EF6\u7ED3\u5408"
  },
  {
    international: "o9 Solutions",
    domestic: "\u83DC\u9E1F",
    category: "supply_chain",
    applicableTo: ["\u4F9B\u5E94\u94FE/\u8FD0\u8425", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u9700\u6C42\u9884\u6D4B", "\u5E93\u5B58\u4F18\u5316", "\u96C6\u6210\u4E1A\u52A1\u8BA1\u5212(IBP)"],
    coreAdvantage: "\u6570\u5B57\u5927\u8111\u6253\u901A\u4F9B\u3001\u9500\u3001\u8D22\u4E00\u4F53\u5316\u8BA1\u5212\u4E0E\u60C5\u666F\u63A8\u6F14\uFF1B\u83DC\u9E1F\u4F9B\u5E94\u94FE\u667A\u80FD\u9884\u6D4B\u4E0E\u7269\u6D41\u534F\u540C"
  },
  {
    international: "Kinaxis",
    domestic: "\u4EAC\u4E1C\u7269\u6D41",
    category: "supply_chain",
    applicableTo: ["\u4F9B\u5E94\u94FE/\u8FD0\u8425"],
    applicableTasks: ["\u4F9B\u5E94\u94FE\u534F\u540C", "\u5B9E\u65F6\u8C03\u5EA6", "\u4EA7\u80FD/\u7EA6\u675F\u6A21\u62DF"],
    coreAdvantage: "\u5E76\u53D1\u8BA1\u7B97\u5F15\u64CE\u5B9E\u73B0\u4F9B\u5E94\u94FE\u7EA6\u675F\u7684\u5B9E\u65F6\u8054\u52A8\u54CD\u5E94\uFF1B\u4EAC\u4E1C\u7269\u6D41\u4E00\u4F53\u5316\u4F9B\u5E94\u94FE\u4E0E\u667A\u80FD\u8C03\u5EA6"
  },
  // ─── 产品/项目管理 (pm) ───
  {
    international: "Linear AI",
    domestic: "\u98DE\u4E66\u9879\u76EEAI",
    category: "pm",
    applicableTo: ["\u4EA7\u54C1\u7ECF\u7406", "\u8F6F\u4EF6\u7814\u53D1", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u9879\u76EE\u7BA1\u7406", "\u4EFB\u52A1\u8DDF\u8E2A", "\u9700\u6C42\u7BA1\u7406", "AI Triage"],
    coreAdvantage: "AI Triage+Agent+\u8BED\u4E49\u641C\u7D22\uFF0C\u81EA\u52A8\u5316\u7814\u53D1\u5DE5\u4F5C\u6D41\uFF1B\u98DE\u4E66\u9879\u76EEAI\u6301\u7EED\u63A5\u5165\u5927\u6A21\u578B"
  },
  {
    international: "\u5C0F\u6479AI",
    domestic: "\u5C0F\u6479AI",
    category: "pm",
    applicableTo: ["\u4EA7\u54C1\u7ECF\u7406"],
    applicableTasks: ["\u539F\u578B\u8BBE\u8BA1", "\u7EBF\u6846\u56FE\u751F\u6210", "PRD\u751F\u6210"],
    coreAdvantage: "\u81EA\u7136\u8BED\u8A00\u5FEB\u901F\u751F\u6210\u53EF\u7F16\u8F91\u539F\u578B\u4E0EPRD\uFF0C\u5927\u5E45\u7B80\u5316\u6D41\u7A0B"
  },
  {
    international: "\u58A8\u5200AI",
    domestic: "\u58A8\u5200AI",
    category: "pm",
    applicableTo: ["\u4EA7\u54C1\u7ECF\u7406"],
    applicableTasks: ["\u539F\u578B\u8BBE\u8BA1", "\u4EA4\u4E92\u8BBE\u8BA1"],
    coreAdvantage: "AI\u4E00\u952E\u751F\u6210\u539F\u578B+PRD\uFF0C\u539F\u578B\u2192UI\u2192\u4EA4\u4ED8\u534F\u4F5C\u4E00\u4F53\u5316\uFF0C\u56FD\u5185\u4E3B\u6D41\u539F\u578B\u5DE5\u5177"
  },
  {
    international: "Google Stitch",
    domestic: "Google Stitch",
    category: "pm",
    applicableTo: ["\u4EA7\u54C1\u7ECF\u7406", "\u8BBE\u8BA1\u521B\u610F"],
    applicableTasks: ["\u539F\u578B\u8BBE\u8BA1", "UI\u8BBE\u8BA1", "\u8BBE\u8BA1\u7A3F\u751F\u6210", "\u4EA4\u4E92\u8BBE\u8BA1"],
    coreAdvantage: "\u514D\u8D39\u5B9E\u65F6AI\u751F\u6210\u9AD8\u4FDD\u771FUI+\u591A\u6846\u67B6\u4EE3\u7801\u5BFC\u51FA\uFF0C\u4EA7\u54C1\u7ECF\u7406\u4E0E\u8BBE\u8BA1\u5E08\u5747\u53EF\u4F7F\u7528"
  },
  {
    international: "Jira",
    domestic: "\u9489\u9489Teambition",
    category: "pm",
    applicableTo: ["\u4EA7\u54C1\u7ECF\u7406", "\u8F6F\u4EF6\u7814\u53D1", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u4EFB\u52A1/\u9700\u6C42\u7BA1\u7406", "\u81EA\u7136\u8BED\u8A00\u67E5\u8BE2(JQL)", "\u6D41\u7A0B\u81EA\u52A8\u5316"],
    coreAdvantage: "\u4F01\u4E1A\u7EA7\u654F\u6377\u7BA1\u7406+Rovo\u641C\u7D22/\u5BF9\u8BDD/\u81EA\u52A8\u5316Agent\uFF1B\u9489\u9489Teambition\u9879\u76EE\u534F\u4F5CAI"
  },
  {
    international: "v0",
    domestic: "\u5373\u65F6\u8BBE\u8BA1",
    category: "pm",
    applicableTo: ["\u4EA7\u54C1\u7ECF\u7406", "\u8BBE\u8BA1\u521B\u610F", "\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["AI\u751F\u6210\u539F\u578B", "\u524D\u7AEF\u7EC4\u4EF6\u751F\u6210"],
    coreAdvantage: "\u6587\u672C\u751F\u6210\u53EF\u76F4\u63A5\u4F7F\u7528\u7684React/Next.js+Tailwind\u7EC4\u4EF6\u4E0E\u754C\u9762\uFF1B\u5373\u65F6\u8BBE\u8BA1\u56FD\u4EA7AI\u539F\u578B"
  },
  {
    international: "Figma Make",
    domestic: "Pixso",
    category: "pm",
    applicableTo: ["\u8BBE\u8BA1\u521B\u610F", "\u4EA7\u54C1\u7ECF\u7406"],
    applicableTasks: ["\u6587\u672C\u751F\u6210\u9AD8\u4FDD\u771F\u539F\u578B", "\u53EF\u4EA4\u4E92\u539F\u578B"],
    coreAdvantage: "Claude\u9A71\u52A8\u7684text-to-UI\uFF0C\u4EA7\u51FA\u53EF\u70B9\u51FB\u9AD8\u4FDD\u771F\u539F\u578B\u5E76\u590D\u7528\u8BBE\u8BA1\u7CFB\u7EDF\uFF1BPixso\u56FD\u4EA7\u534F\u4F5C\u8BBE\u8BA1+AI"
  },
  // ─── 会议纪要 (meeting) ───
  {
    international: "Otter.ai",
    domestic: "\u98DE\u4E66\u5999\u8BB0",
    category: "meeting",
    applicableTo: ["\u4F1A\u8BAE\u534F\u4F5C", "\u901A\u7528\u529E\u516C", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u4F1A\u8BAE\u8F6C\u5199", "\u5B9E\u65F6\u7EAA\u8981", "\u5F85\u529E\u63D0\u53D6", "\u4F1A\u8BAE\u77E5\u8BC6\u6C89\u6DC0"],
    coreAdvantage: "\u4ECE\u7EAA\u8981\u5DE5\u5177\u5347\u7EA7\u4E3A\u4F1A\u8BDD\u77E5\u8BC6\u5F15\u64CE\uFF0C\u8DE8\u4F1A\u8BAE\u6C89\u6DC0\u53EF\u68C0\u7D22\u77E5\u8BC6\u5E76\u89E6\u53D1\u52A8\u4F5C(\u652F\u6301MCP)\uFF1B\u98DE\u4E66\u5999\u8BB0\u751F\u6001\u65E0\u7F1D\u96C6\u6210"
  },
  {
    international: "Fireflies.ai",
    domestic: "\u8BAF\u98DE\u542C\u89C1",
    category: "meeting",
    applicableTo: ["\u4F1A\u8BAE\u534F\u4F5C", "\u901A\u7528\u529E\u516C"],
    applicableTasks: ["\u4F1A\u8BAE\u8BB0\u5F55", "\u4F1A\u4E2D\u5B9E\u65F6\u6559\u7EC3", "\u884C\u52A8\u9879\u63D0\u53D6", "\u5B9E\u65F6\u7FFB\u8BD1"],
    coreAdvantage: "\u8DE8\u5E73\u53F0\u81EA\u52A8\u7EAA\u8981+\u4F1A\u4E2D\u5B9E\u65F6\u6559\u7EC3(Live Assist)+MCP\u63A5\u5165AI\u5DE5\u5177\uFF1B\u8BAF\u98DE\u542C\u89C1ASR\u51C6\u786E\u7387\u884C\u4E1A\u9886\u5148"
  },
  {
    international: "\u901A\u4E49\u542C\u609F",
    domestic: "\u901A\u4E49\u542C\u609F",
    category: "meeting",
    applicableTo: ["\u4F1A\u8BAE\u534F\u4F5C", "\u901A\u7528\u529E\u516C"],
    applicableTasks: ["\u97F3\u89C6\u9891\u8F6C\u5F55", "\u603B\u7ED3", "\u601D\u7EF4\u5BFC\u56FE"],
    coreAdvantage: "\u529F\u80FD\u5168\u9762\uFF0C\u9002\u914D\u817E\u8BAF\u4F1A\u8BAE/\u9489\u9489\uFF0C\u591A\u4EBA\u8BC6\u522B\u4E0E\u4F01\u4E1A\u4F1A\u8BAE\u7EAA\u8981\u5F3A"
  },
  // ─── 智能体/工作流 (agent) ───
  {
    international: "Manus",
    domestic: "\u6263\u5B50Coze",
    category: "agent",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53", "\u8F6F\u4EF6\u7814\u53D1", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u667A\u80FD\u4F53\u642D\u5EFA", "\u590D\u6742\u4EFB\u52A1\u81EA\u52A8\u5316", "\u591A\u5E73\u53F0\u5206\u53D1", "\u96F6\u4EE3\u7801AI\u5E94\u7528"],
    coreAdvantage: "\u901A\u7528AI Agent\u81EA\u4E3B\u5B8C\u6210\u590D\u6742\u591A\u6B65\u4EFB\u52A1\uFF0C\u684C\u9762\u7248\u53EF\u64CD\u4F5C\u672C\u673A\uFF1B\u6263\u5B502.0\u96F6\u4EE3\u7801\u591A\u667A\u80FD\u4F53\u534F\u540C\uFF0C\u63A5\u5165\u6296\u97F3/\u5FAE\u4FE1\u65B9\u4FBF"
  },
  {
    international: "Zapier",
    domestic: "\u96C6\u7B80\u4E91",
    category: "agent",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u5E02\u573A\u8425\u9500", "\u9500\u552E", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53"],
    applicableTasks: ["\u5E94\u7528\u8FDE\u63A5", "\u81EA\u52A8\u5316\u5DE5\u4F5C\u6D41", "\u6570\u636E\u540C\u6B65"],
    coreAdvantage: "\u76EE\u6807\u9A71\u52A8\u81EA\u4E3BAgent+\u5B89\u5168\u62A4\u680F\uFF0C\u8FDE\u63A59000+\u5E94\u7528\uFF1B\u96C6\u7B80\u4E91\u56FD\u5185\u6700\u5927iPaaS\uFF0C\u5BF9\u63A5\u56FD\u5185\u4E3B\u6D41SaaS"
  },
  {
    international: "Make",
    domestic: "BetterYeah AI",
    category: "agent",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53", "\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["\u53EF\u89C6\u5316\u81EA\u52A8\u5316", "\u590D\u6742\u5DE5\u4F5C\u6D41\u7F16\u6392", "\u591A\u667A\u80FD\u4F53\u534F\u540C"],
    coreAdvantage: "\u53EF\u89C6\u5316Agent\u7F16\u6392+\u63A8\u7406\u900F\u660E\uFF0C3000+\u5E94\u7528\uFF1BBetterYeah NeuroFlow\u7F16\u6392+\u591A\u6A21\u6001\u77E5\u8BC6\u5F15\u64CE\uFF0C\u4F01\u4E1A\u7EA7\u79C1\u6709\u5316"
  },
  {
    international: "UiPath",
    domestic: "\u5B9E\u5728\u667A\u80FD",
    category: "agent",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u4F9B\u5E94\u94FE/\u8FD0\u8425", "\u8D22\u52A1", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53"],
    applicableTasks: ["\u4F01\u4E1A\u7EA7RPA+AI\u81EA\u52A8\u5316", "\u9057\u7559\u7CFB\u7EDF\u64CD\u4F5C", "\u6D41\u7A0B\u81EA\u52A8\u5316"],
    coreAdvantage: "RPA+Agent+\u7F16\u6392\u6CBB\u7406\uFF0C\u652F\u6301\u672C\u5730\u5316Agentic AI\uFF1B\u5B9E\u5728\u667A\u80FD\u514D\u63A5\u53E3\u5373\u53EF\u64CD\u4F5C\u4EFB\u610F\u8F6F\u4EF6\uFF0C\u9002\u914D\u9057\u7559\u7CFB\u7EDF"
  },
  {
    international: "n8n",
    domestic: "Dify",
    category: "agent",
    applicableTo: ["\u8F6F\u4EF6\u7814\u53D1", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53"],
    applicableTasks: ["\u5DE5\u4F5C\u6D41\u81EA\u52A8\u5316", "\u81EA\u6258\u7BA1", "AI\u5E94\u7528\u5F00\u53D1", "RAG\u77E5\u8BC6\u5E93"],
    coreAdvantage: "n8n\u5F00\u6E90\u53EF\u81EA\u6258\u7BA1Agentic\u5DE5\u4F5C\u6D41+\u591A\u6A21\u578B\u7F16\u6392\uFF1BDify\u5F00\u6E90LLMOps\u6807\u6746\uFF0C\u539F\u751F\u96C6\u6210MCP+RAG+\u53EF\u89C2\u6D4B"
  },
  {
    international: "Claude Cowork",
    domestic: "WorkBuddy",
    category: "agent",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u4F1A\u8BAE\u534F\u4F5C", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53", "\u8F6F\u4EF6\u7814\u53D1", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u8DE8\u6587\u4EF6/\u90AE\u4EF6/\u7F51\u9875\u591A\u6B65\u957F\u4EFB\u52A1\u81EA\u4E3B\u6267\u884C", "\u590D\u6742\u76EE\u6807\u62C6\u89E3\u5E76\u6301\u7EED\u5DE5\u4F5C\u5230\u4EA4\u4ED8", "\u7ED1\u5B9A\u6280\u80FD\u4E0E\u5B50\u667A\u80FD\u4F53"],
    coreAdvantage: "\u4EA4\u7ED9\u4E00\u4E2A\u76EE\u6807\u5373\u8DE8\u5DE5\u5177\u81EA\u4E3B\u957F\u65F6\u6267\u884C\u5230\u5B8C\u6210\uFF0C\u53EF\u7ED1\u5B9A\u6280\u80FD/\u8FDE\u63A5\u5668/\u5B50\u667A\u80FD\u4F53\u6210\u4E3A\u5C97\u4F4D\u4E13\u5BB6\uFF1BWorkBuddy\u4E3A\u817E\u8BAF\u591A\u667A\u80FD\u4F53\u684C\u9762\u5DE5\u4F5C\u53F0"
  },
  {
    international: "ChatGPT Agent",
    domestic: "\u7EB3\u7C73AI",
    category: "agent",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u6570\u636E\u5206\u6790", "\u5E02\u573A\u8425\u9500", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53"],
    applicableTasks: ["\u81EA\u4E3B\u6D4F\u89C8\u7F51\u9875\u5E76\u64CD\u4F5C\u8868\u5355/\u9884\u8BA2/\u4E0B\u5355", "\u8C03\u7814\u5E76\u4E00\u4F53\u751F\u6210\u62A5\u544A\u4E0E\u56FE\u8868"],
    coreAdvantage: "\u81EA\u5E26\u865A\u62DF\u673A\u53EF\u6D4F\u89C8\u7F51\u9875\u3001\u64CD\u4F5C\u5E94\u7528\u3001\u5904\u7406\u6587\u4EF6\uFF0C\u5173\u952E\u64CD\u4F5C(\u767B\u5F55/\u652F\u4ED8)\u524D\u6682\u505C\u786E\u8BA4\uFF1B\u7EB3\u7C73AI\u56FD\u4EA7\u591A\u667A\u80FD\u4F53\u641C\u7D22\u4E0E\u6267\u884C"
  },
  {
    international: "Microsoft Copilot Studio",
    domestic: "\u767E\u5EA6\u5343\u5E06",
    category: "agent",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u5BA2\u670D", "\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53", "\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["\u4F4E\u4EE3\u7801\u642D\u5EFA\u4F01\u4E1A\u81EA\u5B9A\u4E49\u667A\u80FD\u4F53", "\u63A5\u5165\u5185\u90E8\u7CFB\u7EDF\u5E76\u7F16\u6392\u81EA\u52A8\u5316\u6D41\u7A0B"],
    coreAdvantage: "\u4F4E\u4EE3\u7801\u53EF\u89C6\u5316\u6784\u5EFA\u53EF\u6CBB\u7406\u7684\u4F01\u4E1A\u7EA7\u667A\u80FD\u4F53\uFF0C\u6DF1\u5EA6\u6253\u901A\u529E\u516C/\u4E91\u751F\u6001\u4E0E\u5185\u90E8\u5DE5\u5177\uFF1B\u767E\u5EA6\u5343\u5E06\u4F01\u4E1A\u7EA7\u6A21\u578B+Agent\u5F00\u53D1\u5E73\u53F0"
  },
  // ─── 知识库/RAG (knowledge) ───
  {
    international: "FastGPT",
    domestic: "FastGPT",
    category: "knowledge",
    applicableTo: ["\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53", "\u8F6F\u4EF6\u7814\u53D1"],
    applicableTasks: ["\u4F01\u4E1A\u77E5\u8BC6\u5E93", "RAG\u95EE\u7B54", "\u53EF\u89C6\u5316Agent\u7F16\u6392"],
    coreAdvantage: "\u56FD\u5185\u6700\u6210\u719F\u7684\u5F00\u6E90RAG\u6846\u67B6\uFF0C\u878D\u5408\u53EF\u89C6\u5316Agent\u7F16\u6392\u4E0E\u5B9E\u65F6\u77E5\u8BC6\u66F4\u65B0\uFF0C\u6DF1\u5EA6\u5B9A\u5236\u80FD\u529B\u5F3A"
  },
  {
    international: "\u963F\u91CC\u4E91\u767E\u70BC",
    domestic: "\u963F\u91CC\u4E91\u767E\u70BC",
    category: "knowledge",
    applicableTo: ["\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u4F01\u4E1A\u77E5\u8BC6\u7BA1\u7406", "\u667A\u80FD\u95EE\u7B54", "\u6A21\u578B\u670D\u52A1"],
    coreAdvantage: "\u4E00\u7AD9\u5F0FMaaS+Agent\u5E73\u53F0\uFF0C\u96C6\u6210Qwen/DeepSeek\u767E\u4E07\u4E0A\u4E0B\u6587\uFF0C\u96F6\u4EE3\u7801\u77E5\u8BC6\u5E93\u95EE\u7B54\uFF0C\u4F01\u4E1A\u7EA7"
  },
  {
    international: "Glean",
    domestic: "RAGFlow",
    category: "knowledge",
    applicableTo: ["\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53", "\u901A\u7528\u529E\u516C", "\u6570\u636E\u5206\u6790", "\u4EBA\u529B\u8D44\u6E90"],
    applicableTasks: ["\u8DE8100+\u4F01\u4E1A\u5E94\u7528\u7EDF\u4E00\u8BED\u4E49\u68C0\u7D22", "\u57FA\u4E8E\u79C1\u57DF\u77E5\u8BC6\u7684\u95EE\u7B54\u4E0E\u667A\u80FD\u4F53"],
    coreAdvantage: "Glean\u4F01\u4E1A\u7EA7\u7EDF\u4E00\u641C\u7D22+RAG\u8DE8\u5168\u90E8\u5185\u90E8\u7CFB\u7EDF\u7CBE\u51C6\u68C0\u7D22\u5E76\u652F\u6491\u591A\u6B65\u667A\u80FD\u4F53\uFF1BRAGFlow\u56FD\u4EA7\u5F00\u6E90\u6DF1\u5EA6\u6587\u6863\u7406\u89E3RAG\uFF0C\u53EF\u81EA\u90E8\u7F72"
  },
  {
    international: "Google NotebookLM",
    domestic: "\u817E\u8BAFima",
    category: "knowledge",
    applicableTo: ["\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53", "\u901A\u7528\u529E\u516C", "\u5E02\u573A\u8425\u9500", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u4E0A\u4F20\u6587\u6863\u751F\u6210\u6458\u8981/\u601D\u7EF4\u5BFC\u56FE/\u64AD\u5BA2", "\u57FA\u4E8E\u6307\u5B9A\u8D44\u6599\u7684\u53EF\u6EAF\u6E90\u95EE\u7B54"],
    coreAdvantage: "\u4EE5\u6307\u5B9A\u8D44\u6599\u4E3A\u552F\u4E00\u6765\u6E90\u505A\u53EF\u6EAF\u6E90\u7684\u603B\u7ED3/\u95EE\u7B54/\u518D\u521B\u4F5C\uFF1B\u817E\u8BAFima\u641C-\u8BFB-\u5199\u4E00\u4F53'\u7B2C\u4E8C\u5927\u8111'\uFF0C\u7ED1\u5B9A\u5FAE\u4FE1\u751F\u6001"
  },
  // ─── 写作辅助 (writing) ───
  {
    international: "Grammarly",
    domestic: "\u79D8\u5854\u5199\u4F5C\u732B",
    category: "writing",
    applicableTo: ["\u901A\u7528\u529E\u516C", "\u5E02\u573A\u8425\u9500"],
    applicableTasks: ["\u8BED\u6CD5\u68C0\u67E5", "\u5199\u4F5C\u6DA6\u8272", "\u98CE\u683C\u4F18\u5316"],
    coreAdvantage: "\u5168\u7403\u6700\u6D41\u884C\u82F1\u6587\u5199\u4F5C\u8F85\u52A9\uFF0C\u8BED\u6CD5\u7EA0\u9519\u4E0E\u6539\u5199\u7CBE\u51C6(\u73B0\u96B6\u5C5ESuperhuman Suite)\uFF1B\u79D8\u5854\u5199\u4F5C\u732B\u4E2D\u6587\u6821\u5BF9/\u7EA0\u9519/\u6DA6\u8272"
  },
  {
    international: "Jasper",
    domestic: "\u8C46\u5305",
    category: "writing",
    applicableTo: ["\u5E02\u573A\u8425\u9500", "\u901A\u7528\u529E\u516C", "\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C"],
    applicableTasks: ["\u8425\u9500\u6587\u6848", "\u5185\u5BB9\u521B\u4F5C", "\u54C1\u724C\u5199\u4F5C", "\u6587\u6863\u6539\u5199\u6DA6\u8272"],
    coreAdvantage: "\u9762\u5411\u8425\u9500\u7684\u54C1\u724C\u8BED\u8C03\u5185\u5BB9\u751F\u6210\uFF1B\u8C46\u5305(\u539F\u706B\u5C71\u5199\u4F5C\u80FD\u529B\u5DF2\u5E76\u5165)\u652F\u6301\u751F\u6210/\u6539\u5199/\u6DA6\u8272\u4E0E\u6587\u6863\u5904\u7406\uFF0C\u591A\u7AEF\u8986\u76D6"
  },
  // ─── 学术研究 (research) ───
  {
    international: "Consensus",
    domestic: "\u5B66\u672F\u7248\u79D8\u5854",
    category: "research",
    applicableTo: ["\u6570\u636E\u5206\u6790", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u5B66\u672F\u641C\u7D22", "\u6587\u732E\u7EFC\u8FF0", "\u8BC1\u636E\u67E5\u627E"],
    coreAdvantage: "\u57FA\u4E8E2\u4EBF+\u8BBA\u6587\u7684\u8BC1\u636E\u53D1\u73B0\uFF0C\u7528\u5171\u8BC6\u5EA6\u91CF\u8868\u5FEB\u901F\u5224\u65AD\u7814\u7A76\u662F\u5426\u652F\u6301\u67D0\u7ED3\u8BBA\uFF1B\u5B66\u672F\u7248\u79D8\u5854\u4E2D\u6587\u6587\u732E\u641C\u7D22\u4E0E\u8111\u56FE"
  },
  {
    international: "Elicit",
    domestic: "\u5929\u5DE5\u8D85\u7EA7\u667A\u80FD\u4F53",
    category: "research",
    applicableTo: ["\u6570\u636E\u5206\u6790", "\u7BA1\u7406\u51B3\u7B56"],
    applicableTasks: ["\u7814\u7A76\u52A9\u624B", "\u8BBA\u6587\u5206\u6790", "\u6570\u636E\u63D0\u53D6", "\u6DF1\u5EA6\u68C0\u7D22"],
    coreAdvantage: "\u7CFB\u7EDF\u7EFC\u8FF0\u7EA7\u6587\u732E\u62BD\u53D6\uFF0C\u81EA\u52A8\u751F\u6210\u5E26\u5F15\u6587\u7684\u7ED3\u6784\u5316\u7814\u7A76\u62A5\u544A\uFF1B\u5929\u5DE5\u8D85\u7EA7\u667A\u80FD\u4F53\u6DF1\u5EA6\u68C0\u7D22+\u6587\u6863/PPT/\u8868\u683C\u4E00\u4F53\u4EA7\u51FA"
  }
];
var KEYWORD_MAP = {
  "\u5F00\u53D1|\u7814\u53D1|\u5DE5\u7A0B\u5E08|\u67B6\u6784|\u6D4B\u8BD5|\u8FD0\u7EF4|DevOps|\u524D\u7AEF|\u540E\u7AEF|\u5168\u6808|\u7A0B\u5E8F\u5458|\u7801\u519C|SRE|DBA": ["\u8F6F\u4EF6\u7814\u53D1"],
  "\u4EA7\u54C1|\u9700\u6C42|PRD|\u7528\u6237\u4F53\u9A8C|\u4EA7\u54C1\u7ECF\u7406|\u4EA7\u54C1\u603B\u76D1": ["\u4EA7\u54C1\u7ECF\u7406"],
  "\u8BBE\u8BA1|UI|UX|\u89C6\u89C9|\u7F8E\u672F|\u521B\u610F|\u5E73\u9762|\u63D2\u753B|\u52A8\u6548": ["\u8BBE\u8BA1\u521B\u610F"],
  "\u8425\u9500|\u5E02\u573A|\u54C1\u724C|\u63A8\u5E7F|\u589E\u957F|\u5185\u5BB9\u8FD0\u8425|\u65B0\u5A92\u4F53|SEO|SEM|\u6295\u653E|\u516C\u5173|PR|\u5E7F\u544A|\u79CD\u8349": ["\u5E02\u573A\u8425\u9500"],
  "\u9500\u552E|\u5546\u52A1|BD|\u5BA2\u6237\u5F00\u53D1|\u5927\u5BA2\u6237|\u6E20\u9053|\u4E1A\u52A1\u62D3\u5C55|\u62D3\u5C55\u7ECF\u7406|\u62DB\u5546|\u6E20\u9053\u62D3\u5C55": ["\u9500\u552E"],
  "\u5BA2\u670D|\u552E\u540E|\u670D\u52A1|\u547C\u53EB\u4E2D\u5FC3|\u5728\u7EBF\u5BA2\u670D|\u5BA2\u6237\u652F\u6301|\u5BA2\u6237\u6210\u529F": ["\u5BA2\u670D"],
  "HR|\u4EBA\u529B|\u62DB\u8058|\u57F9\u8BAD|\u7EE9\u6548|\u85AA\u916C|HRBP|\u7EC4\u7EC7\u53D1\u5C55|\u4EBA\u4E8B|\u52B3\u52A8\u5173\u7CFB": ["\u4EBA\u529B\u8D44\u6E90"],
  "\u8D22\u52A1|\u4F1A\u8BA1|\u5BA1\u8BA1|\u7A0E\u52A1|\u51FA\u7EB3|\u6210\u672C|\u8D44\u91D1|\u9884\u7B97": ["\u8D22\u52A1"],
  "\u6CD5\u52A1|\u5408\u89C4|\u6CD5\u5F8B|\u98CE\u63A7|\u77E5\u8BC6\u4EA7\u6743|\u5F8B\u5E08|\u6CD5\u89C4": ["\u6CD5\u52A1\u5408\u89C4"],
  "\u6570\u636E|BI|\u5206\u6790\u5E08|\u6570\u636E\u79D1\u5B66|\u7EDF\u8BA1|\u7B97\u6CD5|\u673A\u5668\u5B66\u4E60|\u5927\u6570\u636E": ["\u6570\u636E\u5206\u6790"],
  "\u603B\u76D1|VP|\u603B\u7ECF\u7406|CEO|COO|CTO|CFO|\u7BA1\u7406|\u51B3\u7B56|\u6218\u7565|\u603B\u88C1": ["\u7BA1\u7406\u51B3\u7B56"],
  "\u4F9B\u5E94\u94FE|\u91C7\u8D2D|\u7269\u6D41|\u4ED3\u50A8|\u751F\u4EA7|\u5236\u9020|\u8FD0\u8425|\u8425\u8FD0|\u7763\u5BFC|\u8D28\u91CF|\u54C1\u63A7|\u5DE5\u5382": ["\u4F9B\u5E94\u94FE/\u8FD0\u8425"],
  "\u89C6\u9891|\u526A\u8F91|\u81EA\u5A92\u4F53|\u4E3B\u64AD|\u5185\u5BB9\u521B\u4F5C|\u7F16\u5BFC|\u6444\u5F71|\u77ED\u89C6\u9891|\u76F4\u64AD": ["\u89C6\u9891/\u5185\u5BB9\u521B\u4F5C"],
  "\u4F1A\u8BAE|\u884C\u653F|\u79D8\u4E66|\u52A9\u7406|\u524D\u53F0": ["\u4F1A\u8BAE\u534F\u4F5C"],
  "\u77E5\u8BC6\u7BA1\u7406|\u667A\u80FD\u4F53|AI\u5E94\u7528|RPA|\u81EA\u52A8\u5316": ["\u77E5\u8BC6\u5E93/\u667A\u80FD\u4F53"]
};
function inferJobFamilies(jobTitle, coreResponsibilities) {
  const families = /* @__PURE__ */ new Set(["\u901A\u7528\u529E\u516C"]);
  const combinedText = [
    jobTitle,
    ...coreResponsibilities || []
  ].join(" ");
  for (const [pattern, fams] of Object.entries(KEYWORD_MAP)) {
    if (new RegExp(pattern, "i").test(combinedText)) {
      fams.forEach((f) => families.add(f));
    }
  }
  if (/主管|经理|总监|VP|负责人|主任|部长/.test(jobTitle)) {
    families.add("\u7BA1\u7406\u51B3\u7B56");
  }
  return Array.from(families);
}
function getFilteredToolsForJob(jobTitle, industry, coreResponsibilities) {
  const jobFamilies = inferJobFamilies(jobTitle, coreResponsibilities);
  const filtered = TOOL_CATALOG.filter(
    (pair) => pair.applicableTo.some((tag) => jobFamilies.includes(tag))
  );
  const seen = /* @__PURE__ */ new Set();
  const deduplicated = filtered.filter((pair) => {
    const key = `${pair.international}|${pair.domestic}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { filteredTools: deduplicated, jobFamilies };
}
function generateProhibitionRules(jobFamilies) {
  const rules = [];
  if (!jobFamilies.includes("\u8F6F\u4EF6\u7814\u53D1")) {
    rules.push("- \u7981\u6B62\u63A8\u8350\u7F16\u7A0BIDE\u548C\u4EE3\u7801\u5DE5\u5177\uFF08\u5982 Cursor\u3001GitHub Copilot\u3001Qoder CN\u3001Trae\u3001Devin\u7B49\uFF09");
  }
  if (!jobFamilies.includes("\u8BBE\u8BA1\u521B\u610F") && !jobFamilies.includes("\u4EA7\u54C1\u7ECF\u7406")) {
    rules.push("- \u7981\u6B62\u63A8\u8350\u4E13\u4E1AUI\u8BBE\u8BA1\u5DE5\u5177\uFF08\u5982 Figma AI\u3001\u5373\u65F6\u8BBE\u8BA1AI\u3001Figma Make\u7B49\uFF09\uFF0C\u4F46\u901A\u7528\u8BBE\u8BA1\u5DE5\u5177\uFF08\u5982Canva/\u7A3F\u5B9AAI\uFF09\u5141\u8BB8");
  }
  if (!jobFamilies.includes("\u5E02\u573A\u8425\u9500")) {
    rules.push("- \u7981\u6B62\u63A8\u8350\u5E7F\u544A\u6295\u653E\u548C\u8425\u9500\u81EA\u52A8\u5316\u5DE5\u5177\uFF08\u5982 \u5DE8\u91CF\u5F15\u64CE\u3001HubSpot Breeze\u3001Klaviyo\u3001Surfer SEO\u7B49\uFF09");
  }
  if (!jobFamilies.includes("\u4EBA\u529B\u8D44\u6E90")) {
    rules.push("- \u7981\u6B62\u63A8\u8350\u62DB\u8058ATS\u548CHR\u7BA1\u7406\u7CFB\u7EDF\uFF08\u5982 Moka AI\u3001\u5317\u68EE\u3001Workday AI\u3001HireVue\u7B49\uFF09");
  }
  if (!jobFamilies.includes("\u6CD5\u52A1\u5408\u89C4")) {
    rules.push("- \u7981\u6B62\u63A8\u8350\u6CD5\u5F8B\u4E13\u4E1A\u5DE5\u5177\uFF08\u5982 Harvey AI\u3001\u6CD5\u5927\u5927iTerms\u3001Spellbook\u3001\u5E42\u5F8B\u667A\u80FD\u7B49\uFF09");
  }
  if (!jobFamilies.includes("\u8D22\u52A1")) {
    rules.push("- \u7981\u6B62\u63A8\u8350\u8D22\u52A1ERP\u548C\u4F1A\u8BA1\u5DE5\u5177\uFF08\u5982 \u91D1\u8776AI\u3001\u7528\u53CB\u7F51\u7EDC\u3001\u5408\u5408\u4FE1\u606F\u3001\u6C47\u8054\u6613\u7B49\uFF09");
  }
  if (!jobFamilies.includes("\u4F9B\u5E94\u94FE/\u8FD0\u8425")) {
    rules.push("- \u7981\u6B62\u63A8\u8350\u4F9B\u5E94\u94FE\u548C\u7269\u6D41\u5DE5\u5177\uFF08\u5982 SAP AI\u3001\u65F7\u89C6\u79D1\u6280\u3001o9 Solutions\u3001Kinaxis\u7B49\uFF09");
  }
  if (!jobFamilies.includes("\u5BA2\u670D")) {
    rules.push("- \u7981\u6B62\u63A8\u8350\u4E13\u4E1A\u5BA2\u670D\u7CFB\u7EDF\uFF08\u5982 Zendesk AI\u3001Fin\u3001\u667A\u9F7F\u79D1\u6280\u3001\u7F51\u6613\u4E03\u9C7C\u7B49\uFF09");
  }
  if (!jobFamilies.includes("\u9500\u552E")) {
    rules.push("- \u7981\u6B62\u63A8\u8350CRM\u548C\u9500\u552E\u5DE5\u5177\uFF08\u5982 Salesforce Agentforce\u3001\u7EB7\u4EAB\u9500\u5BA2\u3001\u63A2\u8FF9\u3001Gong\u7B49\uFF09");
  }
  if (rules.length === 0) {
    return "\uFF08\u5F53\u524D\u5C97\u4F4D\u65E0\u7279\u6B8A\u7981\u533A\u9650\u5236\uFF09";
  }
  return rules.join("\n");
}
function formatFilteredTools(tools) {
  const grouped = {};
  for (const tool of tools) {
    if (!grouped[tool.category]) {
      grouped[tool.category] = [];
    }
    grouped[tool.category].push(tool);
  }
  let result = "";
  for (const [category, pairs] of Object.entries(grouped)) {
    const label = CATEGORY_LABELS[category] || category;
    result += `[${label}]
`;
    for (const pair of pairs) {
      result += `- ${pair.international}/${pair.domestic}\uFF1A${pair.coreAdvantage} | \u9002\u7528\uFF1A${pair.applicableTasks.join("\u3001")}
`;
    }
    result += "\n";
  }
  return result.trim();
}
var ALL_CATALOG_TOOLS = /* @__PURE__ */ new Set();
TOOL_CATALOG.forEach((pair) => {
  ALL_CATALOG_TOOLS.add(pair.international.toLowerCase());
  ALL_CATALOG_TOOLS.add(pair.domestic.toLowerCase());
});
function isToolInCatalog(toolName) {
  if (!toolName) return false;
  return ALL_CATALOG_TOOLS.has(toolName.toLowerCase().trim());
}
var TOOL_NAME_CORRECTIONS = {
  "betterusername ai": "BetterYeah AI",
  "betterusername": "BetterYeah AI",
  "betteryeahai": "BetterYeah AI",
  "kimii": "Kimi",
  "kimi ai": "Kimi",
  "deepseek ai": "DeepSeek",
  "deep seek": "DeepSeek",
  "chatexcel": "ChatExcel",
  "chat excel": "ChatExcel",
  "notion ai (agentic)": "Notion AI",
  "notionai": "Notion AI",
  "wps ai": "WPS\u7075\u7280",
  "wpsai": "WPS\u7075\u7280",
  "wps\u7075\u7280": "WPS\u7075\u7280",
  "microsoft copilot": "Microsoft 365 Copilot",
  "microsoft 365 copilot": "Microsoft 365 Copilot",
  "m365 copilot": "Microsoft 365 Copilot",
  "midjourney ai": "Midjourney",
  "stable diffusion ai": "Stable Diffusion",
  "dall-e": "GPT Image",
  "dalle": "GPT Image",
  "dall\xB7e": "GPT Image",
  "dall e": "GPT Image",
  "gpt image": "GPT Image",
  "figma ai": "Figma AI",
  "figmaai": "Figma AI",
  "figma make": "Figma Make",
  "\u5373\u65F6\u8BBE\u8BA1ai": "\u5373\u65F6\u8BBE\u8BA1AI",
  "\u58A8\u5200ai": "\u58A8\u5200AI",
  "\u901A\u4E49\u7075\u7801": "Qoder CN",
  "lingma": "Qoder CN",
  "lingma ide": "Qoder CN",
  "qoder cn": "Qoder CN",
  "qoder": "Qoder CN",
  "windsurf": "Google Antigravity",
  "gemini code assist": "Google Antigravity",
  "antigravity": "Google Antigravity",
  "codebuddy": "\u817E\u8BAFCodeBuddy",
  "trae": "\u5B57\u8282Trae",
  "comate": "\u767E\u5EA6\u6587\u5FC3\u5FEB\u7801(Comate)",
  "\u6587\u5FC3\u5FEB\u7801": "\u767E\u5EA6\u6587\u5FC3\u5FEB\u7801(Comate)",
  "\u6587\u5FC3\u4E00\u8A004": "\u6587\u5FC3\u4E00\u8A00",
  "\u6587\u5FC3\u4E00\u8A004.0": "\u6587\u5FC3\u4E00\u8A00",
  "perplexity ai": "Perplexity",
  "\u79D8\u5854ai\u641C\u7D22": "\u79D8\u5854AI\u641C\u7D22",
  "\u79D8\u5854ai": "\u79D8\u5854AI\u641C\u7D22",
  "\u7F51\u6613\u4E03\u9C7C": "\u7F51\u6613\u4E03\u9C7C",
  "\u667A\u9F7F\u79D1\u6280": "\u667A\u9F7F\u79D1\u6280",
  "hubspot ai": "HubSpot Breeze",
  "hubspot breeze": "HubSpot Breeze",
  "breeze": "HubSpot Breeze",
  "intercom fin": "Fin",
  "intercom": "Fin",
  "moka": "Moka AI",
  "moka ai": "Moka AI",
  "\u706B\u5C71\u5199\u4F5C": "\u8C46\u5305",
  "doubao": "\u8C46\u5305",
  "\u5929\u5DE5ai\u641C\u7D22": "\u5929\u5DE5\u8D85\u7EA7\u667A\u80FD\u4F53",
  "\u5929\u5DE5\u8D85\u7EA7\u667A\u80FD\u4F53": "\u5929\u5DE5\u8D85\u7EA7\u667A\u80FD\u4F53",
  "notebooklm": "Google NotebookLM",
  "google notebooklm": "Google NotebookLM",
  "claude cowork": "Claude Cowork",
  "chatgpt agent": "ChatGPT Agent",
  "copilot studio": "Microsoft Copilot Studio",
  "google stich": "Google Stitch",
  "google stitch ai": "Google Stitch"
};
function getCanonicalToolName(toolName) {
  if (!toolName) return "";
  const lower = toolName.toLowerCase().trim();
  if (TOOL_NAME_CORRECTIONS[lower]) return TOOL_NAME_CORRECTIONS[lower];
  for (const pair of TOOL_CATALOG) {
    if (pair.international.toLowerCase() === lower) return pair.international;
    if (pair.domestic.toLowerCase() === lower) return pair.domestic;
  }
  for (const pair of TOOL_CATALOG) {
    if (lower.includes(pair.international.toLowerCase()) || pair.international.toLowerCase().includes(lower)) {
      return pair.international;
    }
    if (lower.includes(pair.domestic.toLowerCase()) || pair.domestic.toLowerCase().includes(lower)) {
      return pair.domestic;
    }
  }
  return toolName;
}

// server/analysis.ts
var SYSTEM_PROMPT = `\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u7684\u5C97\u4F4DAI\u8F6C\u578B\u4E13\u5BB6\uFF0C\u62E5\u670920\u5E74\u4F01\u4E1A\u7BA1\u7406\u54A8\u8BE2\u7ECF\u9A8C\u548C\u6DF1\u539A\u7684AI\u6280\u672F\u80CC\u666F\u3002
\u4F60\u7684\u5206\u6790\u98CE\u683C\uFF1A\u6570\u636E\u9A71\u52A8\u3001\u903B\u8F91\u4E25\u5BC6\u3001\u6D1E\u5BDF\u6DF1\u523B\u3001\u5EFA\u8BAE\u53EF\u843D\u5730\u3002
\u4F60\u5FC5\u987B\u4E25\u683C\u6309\u7167\u6307\u5B9A\u7684JSON Schema\u683C\u5F0F\u8F93\u51FA\u7ED3\u6784\u5316\u6570\u636E\u3002

\u3010\u6838\u5FC3\u7EA6\u675F - AI\u5DE5\u5177\u63A8\u8350\u89C4\u5219\u3011\u5F53\u524D\u65F6\u95F4\u662F2026\u5E74\u3002\u63A8\u8350AI\u5DE5\u5177\u65F6\u4F60\u5FC5\u987B\u4E25\u683C\u9075\u5B88\u4EE5\u4E0B\u89C4\u5219\uFF1A

\u89C4\u52191\uFF1A\u7EDD\u5BF9\u7981\u6B62\u5728\u5DE5\u5177\u540D\u79F0\u4E2D\u51FA\u73B0\u4EFB\u4F55\u7248\u672C\u53F7\u3001\u578B\u53F7\u540E\u7F00\u3002
  - \u7981\u6B62\u793A\u4F8B\uFF1AGPT-5.5 Pro\u3001Claude 4 Opus\u3001Gemini 2.5\u3001DeepSeek-R2\u3001Midjourney V7\u3001Suno V4\u3001Llama 4 Maverick
  - \u6B63\u786E\u793A\u4F8B\uFF1AChatGPT\u3001Claude\u3001Gemini\u3001DeepSeek\u3001Midjourney\u3001Suno\u3001Llama

\u89C4\u52192\uFF1A\u4F60\u53EA\u80FD\u4ECE\u6BCF\u4E2AStep\u4E2D\u63D0\u4F9B\u7684\u3010\u53EF\u9009\u5DE5\u5177\u5217\u8868\u3011\u4E2D\u9009\u62E9\u5DE5\u5177\uFF0C\u7EDD\u5BF9\u7981\u6B62\u81EA\u884C\u521B\u9020\u6216\u7F16\u9020\u4EFB\u4F55\u5DE5\u5177\u540D\u79F0\u3002

\u89C4\u52193\uFF1A\u6BCF\u4E2A\u5DE5\u5177\u63A8\u8350\u5FC5\u987B\u540C\u65F6\u63D0\u4F9B\u300C\u56FD\u9645\u7248\u300D\u548C\u300C\u4E2D\u56FD\u56FD\u4EA7\u66FF\u4EE3\u300D\u4E24\u4E2A\u7248\u672C\u3002

\u89C4\u52194\uFF1A\u63A8\u8350\u7684\u5DE5\u5177\u5FC5\u987B\u4E0E\u8BE5\u5C97\u4F4D\u7684\u5B9E\u9645\u5DE5\u4F5C\u5185\u5BB9\u76F4\u63A5\u76F8\u5173\uFF0C\u7981\u6B62\u63A8\u8350\u4E0E\u5C97\u4F4D\u65E0\u5173\u7684\u4E13\u4E1A\u5DE5\u5177\u3002`;
var STEP_DEFINITIONS = [
  {
    id: 1,
    title: "\u4FE1\u606F\u89E3\u6790\u4E0E\u4E8B\u5B9E\u786E\u8BA4",
    prompt: (input) => `\u8BF7\u5206\u6790\u4EE5\u4E0B\u5C97\u4F4D\u4FE1\u606F\uFF0C\u63D0\u53D6\u6838\u5FC3\u5B57\u6BB5\u3002

\u3010\u91CD\u8981\u89C4\u5219\u3011
1. \u4EE5\u4E0B\u5B57\u6BB5\u5C5E\u4E8E\u201C\u786C\u4E8B\u5B9E\u201D\uFF0C\u5FC5\u987B\u4ECE\u7528\u6237\u8F93\u5165\u4E2D\u76F4\u63A5\u63D0\u53D6\uFF0C\u7EDD\u5BF9\u7981\u6B62\u81EA\u884C\u7F16\u9020\u6216\u5047\u8BBE\uFF1A
   - teamSize\uFF08\u56E2\u961F\u89C4\u6A21\uFF09
   - currentTools\uFF08\u5F53\u524D\u4F7F\u7528\u7684\u5DE5\u5177/\u7CFB\u7EDF\uFF09
   - salaryRange\uFF08\u85AA\u8D44\u8303\u56F4\uFF09
   - budget\uFF08AI\u8F6C\u578B\u9884\u7B97\uFF09
   \u5982\u679C\u7528\u6237\u672A\u63D0\u4F9B\u8FD9\u4E9B\u4FE1\u606F\uFF0C\u5BF9\u5E94\u5B57\u6BB5\u5FC5\u987B\u8F93\u51FA\u201C\u672A\u63D0\u4F9B\u201D\uFF0C\u4E0D\u5F97\u586B\u5199\u4EFB\u4F55\u5047\u8BBE\u503C\u3002

2. \u4EE5\u4E0B\u5B57\u6BB5\u5141\u8BB8\u57FA\u4E8E\u884C\u4E1A\u5E38\u8BC6\u63A8\u65AD\uFF0C\u4F46\u5FC5\u987B\u5728 assumptions \u4E2D\u6807\u6CE8\uFF1A
   - level\uFF08\u5C97\u4F4D\u5C42\u7EA7\uFF09
   - industry\uFF08\u6240\u5C5E\u884C\u4E1A\uFF09
   - coreResponsibilities\uFF08\u53EF\u57FA\u4E8E\u5C97\u4F4D\u540D\u79F0\u63A8\u65AD\u5E38\u89C1\u804C\u8D23\uFF09

3. assumptions \u6570\u7EC4\u4E2D\u5FC5\u987B\u660E\u786E\u5217\u51FA\u6BCF\u4E00\u4E2A\u63A8\u65AD\u9879\uFF0C\u683C\u5F0F\u4E3A\uFF1A\u201C[\u5B57\u6BB5\u540D] \u63A8\u65AD\u4E3A xxx\uFF0C\u4F9D\u636E\u662F xxx\u201D

\u8F93\u5165\u4FE1\u606F\uFF1A
${input.inputText}
${input.fileContents?.length ? `
\u9644\u4EF6\u5185\u5BB9\uFF1A
${input.fileContents.join("\n---\n")}` : ""}
${input.teamSize ? `
\u7528\u6237\u786E\u8BA4\u7684\u56E2\u961F\u89C4\u6A21\uFF1A${input.teamSize}` : ""}
${input.currentTools ? `
\u7528\u6237\u786E\u8BA4\u7684\u5F53\u524D\u5DE5\u5177/\u7CFB\u7EDF\uFF1A${input.currentTools}` : ""}
${input.painPoints ? `
\u7528\u6237\u786E\u8BA4\u7684\u5DE5\u4F5C\u75DB\u70B9\uFF1A${input.painPoints}` : ""}
${input.salaryRange ? `
\u7528\u6237\u786E\u8BA4\u7684\u85AA\u8D44\u8303\u56F4\uFF1A${input.salaryRange}` : ""}
${input.budget ? `
\u7528\u6237\u786E\u8BA4\u7684AI\u8F6C\u578B\u9884\u7B97\uFF1A${input.budget}` : ""}

\u8BF7\u8F93\u51FAJSON\u683C\u5F0F\uFF0C\u5305\u542B\u4EE5\u4E0B\u5B57\u6BB5\uFF1A
- jobTitle: \u5C97\u4F4D\u540D\u79F0
- company: \u516C\u53F8\u540D\u79F0\uFF08\u5982\u672A\u63D0\u4F9B\u5219\u586B\u201C\u672A\u63D0\u4F9B\u201D\uFF09
- industry: \u6240\u5C5E\u884C\u4E1A\uFF08\u53EF\u63A8\u65AD\uFF09
- level: \u5C97\u4F4D\u5C42\u7EA7\uFF08\u521D\u7EA7/\u4E2D\u7EA7/\u9AD8\u7EA7/\u603B\u76D1\uFF0C\u53EF\u63A8\u65AD\uFF09
- teamSize: \u56E2\u961F\u89C4\u6A21\uFF08\u4EC5\u4ECE\u7528\u6237\u8F93\u5165\u63D0\u53D6\uFF0C\u672A\u63D0\u4F9B\u5219\u586B\u201C\u672A\u63D0\u4F9B\u201D\uFF09
- currentTools: \u5F53\u524D\u4F7F\u7528\u7684\u5DE5\u5177/\u7CFB\u7EDF\uFF08\u4EC5\u4ECE\u7528\u6237\u8F93\u5165\u63D0\u53D6\uFF0C\u672A\u63D0\u4F9B\u5219\u586B\u201C\u672A\u63D0\u4F9B\u201D\uFF09
- salaryRange: \u85AA\u8D44\u8303\u56F4\uFF08\u4EC5\u4ECE\u7528\u6237\u8F93\u5165\u63D0\u53D6\uFF0C\u672A\u63D0\u4F9B\u5219\u586B\u201C\u672A\u63D0\u4F9B\u201D\uFF09
- budget: AI\u8F6C\u578B\u9884\u7B97\uFF08\u4EC5\u4ECE\u7528\u6237\u8F93\u5165\u63D0\u53D6\uFF0C\u672A\u63D0\u4F9B\u5219\u586B\u201C\u672A\u63D0\u4F9B\u201D\uFF09
- painPoints: \u5F53\u524D\u5DE5\u4F5C\u75DB\u70B9\uFF08\u4EC5\u4ECE\u7528\u6237\u8F93\u5165\u63D0\u53D6\uFF0C\u672A\u63D0\u4F9B\u5219\u586B\u201C\u672A\u63D0\u4F9B\u201D\uFF09
- coreResponsibilities: \u6838\u5FC3\u804C\u8D23\u5217\u8868\uFF08\u6570\u7EC4\uFF0C\u81F3\u5C115\u9879\uFF0C\u4F18\u5148\u4ECE\u8F93\u5165\u63D0\u53D6\uFF0C\u4E0D\u8DB3\u65F6\u53EF\u57FA\u4E8E\u5C97\u4F4D\u540D\u79F0\u8865\u5145\uFF09
- assumptions: \u63A8\u65AD\u9879\u5217\u8868\uFF08\u6570\u7EC4\uFF0C\u683C\u5F0F\uFF1A\u201C[\u5B57\u6BB5\u540D] \u63A8\u65AD\u4E3A xxx\uFF0C\u4F9D\u636E\u662F xxx\u201D\uFF09`,
    schema: {
      name: "step1_info_parsing",
      strict: true,
      schema: {
        type: "object",
        properties: {
          jobTitle: { type: "string" },
          company: { type: "string" },
          industry: { type: "string" },
          level: { type: "string" },
          teamSize: { type: "string" },
          currentTools: { type: "string" },
          salaryRange: { type: "string" },
          budget: { type: "string" },
          painPoints: { type: "string" },
          coreResponsibilities: { type: "array", items: { type: "string" } },
          assumptions: { type: "array", items: { type: "string" } }
        },
        required: ["jobTitle", "company", "industry", "level", "teamSize", "currentTools", "salaryRange", "budget", "painPoints", "coreResponsibilities", "assumptions"],
        additionalProperties: false
      }
    }
  },
  {
    id: 2,
    title: "\u7B2C\u4E00\u6027\u601D\u7EF4\u62C6\u89E3",
    prompt: (input, prevResults) => `\u57FA\u4E8E\u4EE5\u4E0B\u5C97\u4F4D\u4FE1\u606F\uFF0C\u8FDB\u884C\u7B2C\u4E00\u6027\u601D\u7EF4\u56DB\u7EF4\u5EA6\u6DF1\u5EA6\u5206\u6790\u3002\u6BCF\u4E2A\u7EF4\u5EA6\u5206\u6790\u4E0D\u5C11\u4E8E200\u5B57\uFF0C\u5E76\u7ED9\u51FA\u4E00\u53E5\u8BDD\u672C\u8D28\u603B\u7ED3\u3002

\u5C97\u4F4D\u4FE1\u606F\uFF1A${JSON.stringify(prevResults[0]?.data)}

\u56DB\u4E2A\u7EF4\u5EA6\uFF1A
1. \u4EF7\u503C\u521B\u9020\u672C\u8D28\uFF1A\u8FD9\u4E2A\u5C97\u4F4D\u7684\u6839\u672C\u4EF7\u503C\u662F\u4EC0\u4E48\uFF1F\u5B83\u4E3A\u7EC4\u7EC7\u521B\u9020\u4E86\u4EC0\u4E48\u4E0D\u53EF\u66FF\u4EE3\u7684\u4EF7\u503C\uFF1F
2. \u4FE1\u606F\u5904\u7406\u6A21\u5F0F\uFF1A\u8FD9\u4E2A\u5C97\u4F4D\u65E5\u5E38\u5904\u7406\u4EC0\u4E48\u7C7B\u578B\u7684\u4FE1\u606F\uFF1F\u4FE1\u606F\u6D41\u8F6C\u8DEF\u5F84\u662F\u600E\u6837\u7684\uFF1F
3. \u51B3\u7B56\u590D\u6742\u5EA6\uFF1A\u8FD9\u4E2A\u5C97\u4F4D\u9700\u8981\u505A\u51FA\u4EC0\u4E48\u7EA7\u522B\u7684\u51B3\u7B56\uFF1F\u51B3\u7B56\u7684\u4E0D\u786E\u5B9A\u6027\u6709\u591A\u9AD8\uFF1F
4. \u4EBA\u9645\u4EA4\u4E92\u5BC6\u5EA6\uFF1A\u8FD9\u4E2A\u5C97\u4F4D\u9700\u8981\u4E0E\u591A\u5C11\u4EBA\u534F\u4F5C\uFF1F\u534F\u4F5C\u7684\u6DF1\u5EA6\u548C\u9891\u7387\u5982\u4F55\uFF1F

\u6BCF\u4E2A\u7EF4\u5EA6\u7684aiImpactScore\u4E3A0-100\u7684\u6574\u6570\uFF0C\u8868\u793A\u8BE5\u7EF4\u5EA6\u88ABAI\u5F71\u54CD/\u66FF\u4EE3\u7684\u7A0B\u5EA6\uFF08\u8D8A\u9AD8\u8868\u793A\u8D8A\u5BB9\u6613\u88ABAI\u66FF\u4EE3\uFF09\u3002

\u6700\u540E\u8BF7\u7ED9\u51FAoverallAiReadiness\uFF080-100\u6574\u6570\uFF09\uFF0C\u8868\u793A\u8BE5\u5C97\u4F4D\u6574\u4F53\u7684AI\u53EF\u66FF\u4EE3\u7387/AI\u5C31\u7EEA\u5EA6\u3002\u8FD9\u4E2A\u503C\u5E94\u8BE5\u7EFC\u5408\u8003\u8651\u56DB\u4E2A\u7EF4\u5EA6\u7684aiImpactScore\uFF0C\u4F46\u4E0D\u662F\u7B80\u5355\u5E73\u5747\uFF0C\u800C\u662F\u52A0\u6743\u8003\u8651\u5404\u7EF4\u5EA6\u7684\u91CD\u8981\u6027\u3002

\u8BF7\u8F93\u51FAJSON\u683C\u5F0F\u3002`,
    schema: {
      name: "step2_first_principles",
      strict: true,
      schema: {
        type: "object",
        properties: {
          dimensions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                analysis: { type: "string" },
                essence: { type: "string" },
                aiImpactScore: { type: "number" }
              },
              required: ["name", "analysis", "essence", "aiImpactScore"],
              additionalProperties: false
            }
          },
          overallConclusion: { type: "string" },
          overallAiReadiness: { type: "number" }
        },
        required: ["dimensions", "overallConclusion", "overallAiReadiness"],
        additionalProperties: false
      }
    }
  },
  {
    id: 3,
    title: "\u5F53\u524D\u5DE5\u4F5C\u6D41\u62C6\u89E3",
    prompt: (_input, prevResults) => `\u57FA\u4E8E\u5C97\u4F4D\u4FE1\u606F\u548C\u7B2C\u4E00\u6027\u601D\u7EF4\u5206\u6790\uFF0C\u62C6\u89E3\u5F53\u524D\u5DE5\u4F5C\u6D41\u4E3A8-12\u4E2A\u6838\u5FC3\u4EFB\u52A1\u8282\u70B9\u3002

\u5C97\u4F4D\u4FE1\u606F\uFF1A${JSON.stringify(prevResults[0]?.data)}
\u7B2C\u4E00\u6027\u5206\u6790\uFF1A${JSON.stringify(prevResults[1]?.data)}

\u5BF9\u6BCF\u4E2A\u4EFB\u52A1\u8282\u70B9\uFF0C\u8BF7\u5206\u6790\uFF1A
- \u4EFB\u52A1\u540D\u79F0
- \u4EFB\u52A1\u63CF\u8FF0
- \u65F6\u95F4\u5360\u6BD4\uFF08\u767E\u5206\u6BD4\uFF09
- \u6280\u80FD\u8981\u6C42
- \u91CD\u590D\u6027\u7A0B\u5EA6\uFF08\u9AD8/\u4E2D/\u4F4E\uFF09
- AI\u53EF\u66FF\u4EE3\u7A0B\u5EA6\uFF08\u9AD8/\u4E2D/\u4F4E\uFF09

\u3010\u6570\u503C\u4F30\u7B97\u7EA6\u675F\u3011
1. timePercent\uFF08\u65F6\u95F4\u5360\u6BD4\uFF09\uFF1A\u6240\u6709\u4EFB\u52A1\u8282\u70B9\u7684 timePercent \u4E4B\u548C\u5FC5\u987B\u7B49\u4E8E100\u3002
2. \u65F6\u95F4\u5360\u6BD4\u5E94\u57FA\u4E8E\u8BE5\u5C97\u4F4D\u7684\u884C\u4E1A\u901A\u7528\u5DE5\u4F5C\u5206\u914D\u89C4\u5F8B\u8FDB\u884C\u5408\u7406\u4F30\u7B97\uFF0C\u907F\u514D\u5E73\u5747\u5206\u914D\uFF08\u598210\u4E2A\u8282\u70B9\u540410%\uFF09\u3002
3. \u9AD8\u91CD\u590D\u6027\u3001\u9AD8\u9891\u6B21\u7684\u4EFB\u52A1\u901A\u5E38\u65F6\u95F4\u5360\u6BD4\u66F4\u9AD8\uFF1B\u4F4E\u9891\u7684\u7BA1\u7406/\u89C4\u5212\u7C7B\u4EFB\u52A1\u65F6\u95F4\u5360\u6BD4\u8F83\u4F4E\u3002
4. \u5982\u679C\u5C97\u4F4D\u4FE1\u606F\u4E2D\u7528\u6237\u660E\u786E\u63CF\u8FF0\u4E86\u67D0\u9879\u5DE5\u4F5C"\u5360\u5927\u90E8\u5206\u65F6\u95F4"\u6216"\u6BCF\u5929\u82B1X\u5C0F\u65F6"\uFF0C\u5FC5\u987B\u636E\u6B64\u8C03\u6574\u5BF9\u5E94\u8282\u70B9\u7684 timePercent\u3002

\u8BF7\u8F93\u51FAJSON\u683C\u5F0F\u3002`,
    schema: {
      name: "step3_workflow",
      strict: true,
      schema: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                description: { type: "string" },
                timePercent: { type: "number" },
                skills: { type: "array", items: { type: "string" } },
                repetitiveness: { type: "string" },
                aiReplaceability: { type: "string" }
              },
              required: ["id", "name", "description", "timePercent", "skills", "repetitiveness", "aiReplaceability"],
              additionalProperties: false
            }
          },
          totalNodes: { type: "number" }
        },
        required: ["tasks", "totalNodes"],
        additionalProperties: false
      }
    }
  },
  {
    id: 4,
    title: "AI\u5DE5\u5177\u5339\u914D\u4E0E\u4F18\u5316\u65B9\u6848",
    prompt: (_input, prevResults) => {
      const step1Data = prevResults[0]?.data;
      const jobTitle = step1Data?.jobTitle || _input.jobTitle || "";
      const coreResponsibilities = Array.isArray(step1Data?.coreResponsibilities) ? step1Data.coreResponsibilities : [];
      const { filteredTools, jobFamilies } = getFilteredToolsForJob(jobTitle, step1Data?.industry, coreResponsibilities);
      const toolListText = formatFilteredTools(filteredTools);
      const prohibitionText = generateProhibitionRules(jobFamilies);
      return `\u57FA\u4E8E\u5DE5\u4F5C\u6D41\u62C6\u89E3\u7ED3\u679C\uFF0C\u4E3A\u6BCF\u4E2A\u4EFB\u52A1\u8282\u70B9\u63A8\u8350\u5177\u4F53\u7684AI\u5DE5\u5177\u548C\u4F18\u5316\u65B9\u6848\u3002

\u5DE5\u4F5C\u6D41\u8282\u70B9\uFF1A${JSON.stringify(prevResults[2]?.data)}
\u5C97\u4F4D\u4FE1\u606F\uFF1A${JSON.stringify(prevResults[0]?.data)}

\u3010\u5DE5\u5177\u63A8\u8350\u89C4\u5219\u3011
1. \u4F60\u53EA\u80FD\u4ECE\u4E0B\u65B9\u3010\u53EF\u9009\u5DE5\u5177\u5217\u8868\u3011\u4E2D\u9009\u62E9\u5DE5\u5177\uFF0C\u7EDD\u5BF9\u7981\u6B62\u81EA\u884C\u521B\u9020\u6216\u7F16\u9020\u4EFB\u4F55\u5DE5\u5177\u540D\u79F0\u3002
2. \u5DE5\u5177\u540D\u79F0\u7981\u6B62\u5305\u542B\u4EFB\u4F55\u7248\u672C\u53F7\uFF08\u5982 GPT-4.1\u3001Claude 4\u3001V7 \u7B49\uFF09\u3002
3. \u6BCF\u4E2A\u5DE5\u5177\u63A8\u8350\u5FC5\u987B\u540C\u65F6\u63D0\u4F9B\u300C\u56FD\u9645\u7248\u300D\u548C\u300C\u56FD\u5185\u66FF\u4EE3\u300D\u4E24\u4E2A\u7248\u672C\uFF08\u5DF2\u5728\u5217\u8868\u4E2D\u914D\u5BF9\u597D\uFF09\u3002
4. \u63A8\u8350\u7684\u5DE5\u5177\u5FC5\u987B\u4E0E\u5F53\u524D\u4EFB\u52A1\u8282\u70B9\u7684\u5177\u4F53\u5DE5\u4F5C\u5185\u5BB9\u76F4\u63A5\u76F8\u5173\u3002
5. \u5982\u679C\u67D0\u4E2A\u4EFB\u52A1\u8282\u70B9\u6CA1\u6709\u5408\u9002\u7684AI\u5DE5\u5177\uFF0CaiTools \u6570\u7EC4\u7559\u7A7A\u5373\u53EF\u3002
6. \u6BCF\u4E2A\u4EFB\u52A1\u8282\u70B9\u6700\u591A\u63A8\u83502\u5BF9\u5DE5\u5177\uFF081\u5BF9\u9996\u9009 + 1\u5BF9\u5907\u9009\uFF09\u3002
7. matchReason \u5FC5\u987B\u8BF4\u660E\uFF1A\u8BE5\u5DE5\u5177\u5728\u8FD9\u4E2A\u5177\u4F53\u4EFB\u52A1\u4E2D\u600E\u4E48\u7528\u3001\u89E3\u51B3\u4EC0\u4E48\u95EE\u9898\u3002
8. \u5FC5\u987B\u53C2\u8003\u5C97\u4F4D\u4FE1\u606F\u4E2D\u7684 currentTools\uFF08\u5F53\u524D\u4F7F\u7528\u7684\u5DE5\u5177/\u7CFB\u7EDF\uFF09\uFF0C\u63A8\u8350\u7684\u5DE5\u5177\u5FC5\u987B\u80FD\u4E0E\u7528\u6237\u73B0\u6709\u5DE5\u4F5C\u73AF\u5883\u914D\u5408\u4F7F\u7528\u3002\u5982\u679C currentTools \u4E3A"\u672A\u63D0\u4F9B"\uFF0C\u5219\u6309\u884C\u4E1A\u901A\u7528\u573A\u666F\u63A8\u8350\u3002
9. \u3010\u5DE5\u5177\u529F\u80FD\u63CF\u8FF0\u51C6\u786E\u6027\u3011\u63CF\u8FF0\u5DE5\u5177\u80FD\u529B\u65F6\uFF0C\u53EA\u80FD\u57FA\u4E8E\u8BE5\u5DE5\u5177\u7684\u771F\u5B9E\u5DF2\u77E5\u529F\u80FD\uFF0C\u4E25\u7981\u7F16\u9020\u5DE5\u5177\u4E0D\u5177\u5907\u7684\u80FD\u529B\u3002\u4EE5\u4E0B\u662F\u5E38\u89C1\u9519\u8BEF\u793A\u4F8B\uFF1A
   - \u9519\u8BEF\uFF1A"Perplexity\u53EF\u4F5C\u4E3A\u4F01\u4E1A\u5185\u90E8\u77E5\u8BC6\u641C\u7D22\u7684AI\u5165\u53E3\uFF0C\u57FA\u4E8E\u79C1\u6709\u77E5\u8BC6\u5E93\u7ED9\u51FA\u51C6\u786E\u7B54\u6848" \u2192 Perplexity\u662F\u516C\u5F00\u4E92\u8054\u7F51AI\u641C\u7D22\u5F15\u64CE\uFF0C\u4E0D\u652F\u6301\u4F01\u4E1A\u79C1\u6709\u77E5\u8BC6\u5E93\u90E8\u7F72
   - \u9519\u8BEF\uFF1A"Midjourney\u53EF\u4EE5\u751F\u6210\u89C6\u9891" \u2192 Midjourney\u53EA\u80FD\u751F\u6210\u9759\u6001\u56FE\u7247
   - \u9519\u8BEF\uFF1A"ChatExcel\u53EF\u4EE5\u505APPT" \u2192 ChatExcel\u53EA\u652F\u6301Excel\u8868\u683C\u64CD\u4F5C
   - \u9519\u8BEF\uFF1A"\u98DE\u4E66\u5999\u8BB0\u53EF\u4EE5\u5B9E\u65F6\u7FFB\u8BD1" \u2192 \u98DE\u4E66\u5999\u8BB0\u662F\u4F1A\u8BAE\u5F55\u97F3\u8F6C\u6587\u5B57\u5DE5\u5177
   \u5982\u679C\u4F60\u4E0D\u786E\u5B9A\u67D0\u5DE5\u5177\u662F\u5426\u5177\u5907\u67D0\u529F\u80FD\uFF0C\u8BF7\u53EA\u63CF\u8FF0\u5176\u6838\u5FC3\u5DF2\u77E5\u529F\u80FD\uFF08\u53C2\u8003\u53EF\u9009\u5DE5\u5177\u5217\u8868\u4E2D\u7684\u300C\u6838\u5FC3\u4F18\u52BF\u300D\u5B57\u6BB5\uFF09\u3002

\u3010\u5C97\u4F4D\u7981\u533A - \u4EE5\u4E0B\u63A8\u8350\u5C06\u88AB\u7CFB\u7EDF\u81EA\u52A8\u62E6\u622A\u5E76\u5220\u9664\u3011
${prohibitionText}

\u3010\u53EF\u9009\u5DE5\u5177\u5217\u8868 - \u53EA\u80FD\u4ECE\u4E2D\u9009\u62E9\u3011
${toolListText}

\u5BF9\u6BCF\u4E2A\u8282\u70B9\uFF0C\u8BF7\u63A8\u83501-2\u4E2A\u5DE5\u5177\u5BF9\uFF08\u6BCF\u5BF9\u542B\u56FD\u9645\u7248+\u56FD\u4EA7\u66FF\u4EE3\uFF09\uFF0C\u5E76\u8BF4\u660E\uFF1A
- \u534F\u4F5C\u6A21\u5F0F\uFF08AI\u534F\u4F5C/Agent\u81EA\u52A8/Human\u4E3B\u5BFC\uFF09
- \u4F18\u5316\u65B9\u6848\u63CF\u8FF0
- \u9884\u671F\u6548\u7387\u63D0\u5347\u767E\u5206\u6BD4
- \u5B9E\u65BD\u96BE\u5EA6\uFF08\u7B80\u5355/\u4E2D\u7B49/\u56F0\u96BE\uFF09
- matchReason\uFF1A\u4E3A\u6BCF\u4E2A\u63A8\u8350\u5DE5\u5177\u5BF9\u751F\u6210100-200\u5B57\u7684\u573A\u666F\u5316\u5E94\u7528\u8BF4\u660E\uFF0C\u5185\u5BB9\u5305\u62EC\uFF1A1)\u8BE5\u5DE5\u5177\u5728\u5F53\u524D\u5C97\u4F4D\u7684\u5177\u4F53\u4F7F\u7528\u573A\u666F\uFF08\u4E3E\u4F8B\u8BF4\u660E\uFF092)\u9884\u671F\u6548\u679C\uFF08\u91CF\u5316\u63CF\u8FF0\uFF0C\u5982\u201C\u53EF\u5C06XX\u5DE5\u4F5C\u4ECE3\u5C0F\u65F6\u7F29\u77ED\u523030\u5206\u949F\u201D\uFF093)\u4E0A\u624B\u5EFA\u8BAE\uFF08\u7B2C\u4E00\u6B65\u505A\u4EC0\u4E48\uFF09

\u3010\u6548\u7387\u63D0\u5347\u6570\u503C\u7EA6\u675F\u3011
1. efficiencyGain \u5FC5\u987B\u662F\u5408\u7406\u7684\u767E\u5206\u6BD4\u6574\u6570\uFF0810-80\u4E4B\u95F4\uFF09\uFF0C\u4E0D\u5F97\u8D85\u8FC780%\u3002
2. \u4E0D\u540C\u534F\u4F5C\u6A21\u5F0F\u7684\u5408\u7406\u8303\u56F4\uFF1A
   - Human\u4E3B\u5BFC\uFF1A10-30%\uFF08AI\u4EC5\u8F85\u52A9\uFF0C\u4EBA\u7C7B\u4ECD\u4E3B\u5BFC\u51B3\u7B56\uFF09
   - AI\u534F\u4F5C\uFF1A20-50%\uFF08\u4EBA\u673A\u534F\u540C\uFF0C\u5404\u53D1\u6325\u4F18\u52BF\uFF09
   - Agent\u81EA\u52A8\uFF1A40-80%\uFF08AI\u81EA\u4E3B\u6267\u884C\uFF0C\u4EBA\u7C7B\u76D1\u7763\uFF09
3. \u9AD8\u91CD\u590D\u6027\u4EFB\u52A1\u7684\u6548\u7387\u63D0\u5347\u901A\u5E38\u9AD8\u4E8E\u4F4E\u91CD\u590D\u6027\u4EFB\u52A1\u3002
4. \u7981\u6B62\u6240\u6709\u8282\u70B9\u7ED9\u51FA\u76F8\u540C\u7684 efficiencyGain \u503C\uFF0C\u5FC5\u987B\u4F53\u73B0\u5DEE\u5F02\u5316\u3002

\u8BF7\u8F93\u51FAJSON\u683C\u5F0F\u3002`;
    },
    schema: {
      name: "step4_ai_tools",
      strict: true,
      schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                taskId: { type: "number" },
                taskName: { type: "string" },
                aiTools: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      internationalTool: { type: "string", description: "\u56FD\u9645\u7248\u5DE5\u5177\u540D\u79F0\uFF0C\u4E0D\u5E26\u7248\u672C\u53F7\uFF0C\u5FC5\u987B\u6765\u81EA\u767D\u540D\u5355" },
                      domesticAlternative: { type: "string", description: "\u4E2D\u56FD\u56FD\u4EA7\u66FF\u4EE3\u5DE5\u5177\u540D\u79F0\uFF0C\u5FC5\u987B\u6765\u81EA\u767D\u540D\u5355" }
                    },
                    required: ["internationalTool", "domesticAlternative"],
                    additionalProperties: false
                  }
                },
                collaborationMode: { type: "string" },
                optimizationPlan: { type: "string" },
                efficiencyGain: { type: "number" },
                difficulty: { type: "string" },
                matchReason: { type: "string", description: "100-200\u5B57\u573A\u666F\u5316\u5E94\u7528\u8BF4\u660E\uFF0C\u5305\u542B\u4F7F\u7528\u573A\u666F\u3001\u9884\u671F\u6548\u679C\u3001\u4E0A\u624B\u5EFA\u8BAE" }
              },
              required: ["taskId", "taskName", "aiTools", "collaborationMode", "optimizationPlan", "efficiencyGain", "difficulty", "matchReason"],
              additionalProperties: false
            }
          }
        },
        required: ["recommendations"],
        additionalProperties: false
      }
    }
  },
  {
    id: 5,
    title: "\u65B0\u5DE5\u4F5C\u6D41\u8BBE\u8BA1",
    prompt: (_input, prevResults) => `\u57FA\u4E8EAI\u4F18\u5316\u65B9\u6848\uFF0C\u8BBE\u8BA1\u8F6C\u578B\u540E\u7684\u65B0\u5DE5\u4F5C\u6D41\u3002\u660E\u786E\u4EBA\u673A\u5206\u5DE5\u4E0E\u534F\u4F5C\u6A21\u5F0F\u3002

\u539F\u5DE5\u4F5C\u6D41\uFF1A${JSON.stringify(prevResults[2]?.data)}
AI\u4F18\u5316\u65B9\u6848\uFF1A${JSON.stringify(prevResults[3]?.data)}

\u8BF7\u8BBE\u8BA1\u65B0\u5DE5\u4F5C\u6D41\uFF0C\u5305\u542B\uFF1A
- \u65B0\u4EFB\u52A1\u8282\u70B9\u5217\u8868\uFF08\u5408\u5E76/\u62C6\u5206/\u65B0\u589E\uFF09
- \u6BCF\u4E2A\u8282\u70B9\u7684\u4EBA\u673A\u5206\u5DE5\u6BD4\u4F8B\uFF1AhumanRatio\u548CaiRatio\u5FC5\u987B\u662F0-100\u7684\u6574\u6570\u767E\u5206\u6BD4\uFF0C\u4E14\u4E24\u8005\u4E4B\u548C\u5FC5\u987B\u7B49\u4E8E100\u3002\u4F8B\u5982humanRatio:60\u8868\u793A\u4EBA\u5DE560%\uFF0CaiRatio:40\u8868\u793AAI\u536040%\u3002\u7EDD\u5BF9\u7981\u6B62\u8F93\u51FA\u5C0F\u6570\u59820.6\u30010.4\u7B49\u3002
- \u534F\u4F5C\u6A21\u5F0F\u8BF4\u660E
- \u65B0\u589E\u80FD\u529B\u8981\u6C42

\u8BF7\u8F93\u51FAJSON\u683C\u5F0F\u3002`,
    schema: {
      name: "step5_new_workflow",
      strict: true,
      schema: {
        type: "object",
        properties: {
          newTasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                description: { type: "string" },
                humanRatio: { type: "number" },
                aiRatio: { type: "number" },
                collaborationMode: { type: "string" },
                newSkillsRequired: { type: "array", items: { type: "string" } }
              },
              required: ["id", "name", "description", "humanRatio", "aiRatio", "collaborationMode", "newSkillsRequired"],
              additionalProperties: false
            }
          },
          summary: { type: "string" }
        },
        required: ["newTasks", "summary"],
        additionalProperties: false
      }
    }
  },
  {
    id: 6,
    title: "\u8F6C\u578B\u5BF9\u6BD4\u4E0EROI\u8BC4\u4F30",
    prompt: (_input, prevResults) => `\u8FDB\u884C\u8F6C\u578B\u524D\u540E\u7684\u4E5D\u7EF4\u5EA6\u5BF9\u6BD4\u5206\u6790\u548CROI\u8BC4\u4F30\u3002

\u539F\u5DE5\u4F5C\u6D41\uFF1A${JSON.stringify(prevResults[2]?.data)}
\u65B0\u5DE5\u4F5C\u6D41\uFF1A${JSON.stringify(prevResults[4]?.data)}
AI\u5DE5\u5177\u65B9\u6848\uFF1A${JSON.stringify(prevResults[3]?.data)}
\u5C97\u4F4D\u4FE1\u606F\uFF1A${JSON.stringify(prevResults[0]?.data)}

\u4E5D\u7EF4\u5EA6\u5BF9\u6BD4\uFF1A\u6548\u7387\u3001\u8D28\u91CF\u3001\u6210\u672C\u3001\u521B\u65B0\u529B\u3001\u54CD\u5E94\u901F\u5EA6\u3001\u53EF\u6269\u5C55\u6027\u3001\u5458\u5DE5\u6EE1\u610F\u5EA6\u3001\u5BA2\u6237\u6EE1\u610F\u5EA6\u3001\u98CE\u9669\u6C34\u5E73

ROI\u8BC4\u4F30\u9700\u5305\u542B\u4E09\u6863\u65B9\u6848\uFF08\u4FDD\u5B88/\u6807\u51C6/\u6FC0\u8FDB\uFF09\u7684\u6210\u672C\u548C\u6536\u76CA\u9884\u4F30\u3002

\u3010ROI\u6570\u503C\u7EA6\u675F\u3011
1. \u5982\u679C\u5C97\u4F4D\u4FE1\u606F\u4E2D\u63D0\u4F9B\u4E86 salaryRange\uFF08\u85AA\u8D44\u8303\u56F4\uFF09\u548C teamSize\uFF08\u56E2\u961F\u89C4\u6A21\uFF09\uFF0C\u5FC5\u987B\u57FA\u4E8E\u8FD9\u4E9B\u5B9E\u9645\u6570\u636E\u8BA1\u7B97\u4EBA\u529B\u6210\u672C\u8282\u7EA6\u3002
2. \u5982\u679C\u63D0\u4F9B\u4E86 budget\uFF08AI\u8F6C\u578B\u9884\u7B97\uFF09\uFF0CinvestmentRange \u5FC5\u987B\u5728\u7528\u6237\u9884\u7B97\u8303\u56F4\u5185\u3002
3. \u5982\u679C\u4EE5\u4E0A\u4FE1\u606F\u4E3A"\u672A\u63D0\u4F9B"\uFF0C\u5219\u57FA\u4E8E\u884C\u4E1A\u5E73\u5747\u6C34\u5E73\u8FDB\u884C\u4F30\u7B97\uFF0C\u5E76\u5728 assumptions \u4E2D\u8BF4\u660E\u4F30\u7B97\u4F9D\u636E\u3002
4. roiPercent \u5408\u7406\u8303\u56F4\uFF1A\u4FDD\u5B88\u65B9\u6848 50-150%\uFF0C\u6807\u51C6\u65B9\u6848 100-250%\uFF0C\u6FC0\u8FDB\u65B9\u6848 150-400%\u3002\u7981\u6B62\u8D85\u8FC7500%\u3002
5. paybackPeriod \u5408\u7406\u8303\u56F4\uFF1A3-24\u4E2A\u6708\u3002
6. \u4E09\u6863\u65B9\u6848\u7684 investmentRange \u5FC5\u987B\u4F53\u73B0\u660E\u663E\u68AF\u5EA6\u5DEE\u5F02\uFF0C\u4E0D\u5F97\u96F7\u540C\u3002

assumptions\uFF1A\u8BF7\u5217\u51FA\u672C\u6B21ROI\u8BA1\u7B97\u7684\u5173\u952E\u5047\u8BBE\u524D\u63D0\uFF08\u59822-4\u6761\uFF09\uFF0C\u4F8B\u5982"\u5047\u8BBE\u5E73\u5747\u6708\u85AA1.5\u4E07\u5143"\u3001"\u5047\u8BBE\u5DE5\u5177\u8BA2\u9605\u8D39\u7528\u6309\u5E74\u4ED8"\u7B49\u3002

\u3010\u4E00\u81F4\u6027\u7EA6\u675F\u3011
- \u56E2\u961F\u89C4\u6A21\u5FC5\u987B\u5F15\u7528\u5C97\u4F4D\u4FE1\u606F\u4E2D\u7684\u6570\u636E\uFF1A${prevResults[0]?.data?.teamSize || "\u672A\u63D0\u4F9B"}\u3002\u5982\u679C\u6D89\u53CA\u4EBA\u529B\u6210\u672C\u8BA1\u7B97\uFF0C\u5FC5\u987B\u57FA\u4E8E\u4E0A\u8FF0\u56E2\u961F\u89C4\u6A21\uFF0C\u4E0D\u5F97\u81EA\u884C\u5047\u8BBE\u4E0D\u540C\u7684\u4EBA\u6570\u3002
- \u6548\u7387\u63D0\u5347\u6570\u503C\u5FC5\u987B\u4E0EAI\u5DE5\u5177\u65B9\u6848\u4E2D\u7684 efficiencyGain \u8303\u56F4\u4E00\u81F4\uFF0C\u4E0D\u5F97\u51FA\u73B0\u5DE8\u5927\u504F\u5DEE\u3002

\u8BF7\u8F93\u51FAJSON\u683C\u5F0F\u3002`,
    schema: {
      name: "step6_roi",
      strict: true,
      schema: {
        type: "object",
        properties: {
          dimensions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                before: { type: "number" },
                after: { type: "number" },
                improvement: { type: "string" }
              },
              required: ["name", "before", "after", "improvement"],
              additionalProperties: false
            }
          },
          roiPlans: {
            type: "array",
            items: {
              type: "object",
              properties: {
                planName: { type: "string" },
                investmentRange: { type: "string" },
                annualSaving: { type: "string" },
                paybackPeriod: { type: "string" },
                roiPercent: { type: "number" }
              },
              required: ["planName", "investmentRange", "annualSaving", "paybackPeriod", "roiPercent"],
              additionalProperties: false
            }
          },
          overallROI: { type: "string" },
          assumptions: { type: "array", items: { type: "string" }, description: "ROI\u8BA1\u7B97\u7684\u5173\u952E\u5047\u8BBE\u524D\u63D0\uFF0C\u59822-4\u6761" }
        },
        required: ["dimensions", "roiPlans", "overallROI", "assumptions"],
        additionalProperties: false
      }
    }
  },
  {
    id: 7,
    title: "\u5C97\u4F4D\u91CD\u7EC4\u4E0E\u5B9E\u65BD\u8DEF\u7EBF\u56FE",
    prompt: (_input, prevResults) => {
      const step1Data = prevResults[0]?.data;
      const jobTitle = step1Data?.jobTitle || _input.jobTitle || "";
      const coreResponsibilities = Array.isArray(step1Data?.coreResponsibilities) ? step1Data.coreResponsibilities : [];
      const { filteredTools, jobFamilies } = getFilteredToolsForJob(jobTitle, step1Data?.industry, coreResponsibilities);
      const toolListText = formatFilteredTools(filteredTools);
      const prohibitionText = generateProhibitionRules(jobFamilies);
      return `\u8BBE\u8BA1\u5C97\u4F4D\u91CD\u7EC4\u65B9\u6848\u548C\u56DB\u9636\u6BB5\u5B9E\u65BD\u8DEF\u7EBF\u56FE\u3002

\u5C97\u4F4D\u4FE1\u606F\uFF1A${JSON.stringify(prevResults[0]?.data)}
\u65B0\u5DE5\u4F5C\u6D41\uFF1A${JSON.stringify(prevResults[4]?.data)}

\u8BF7\u5305\u542B\uFF1A
1. \u4EFB\u52A1\u91CD\u65B0\u5206\u7C7B\uFF08\u4E09\u7C7B\uFF09\uFF1A
   - aiReplace\uFF08\u5E94\u88ABAI\u66FF\u4EE3\u7684\u4EFB\u52A1\uFF09\uFF1A\u53EF\u4EE5\u5B8C\u5168\u4EA4\u7ED9AI\u81EA\u52A8\u5B8C\u6210\u7684\u4EFB\u52A1\uFF0C\u5305\u62EC\u539F\u6765\u53EF\u88AB\u6DD8\u6C70\u7684\u4F4E\u4EF7\u503C\u91CD\u590D\u4EFB\u52A1
   - aiEnhance\uFF08\u5E94\u88ABAI\u589E\u5F3A\u7684\u4EFB\u52A1\uFF09\uFF1A\u4EBA\u505A\u4F46AI\u8F85\u52A9\u63D0\u6548\u7684\u4EFB\u52A1
   - humanRetain\uFF08\u5E94\u4FDD\u7559\u7ED9\u4EBA\u7C7B\u7684\u4EFB\u52A1\uFF09\uFF1A\u5FC5\u987B\u7531\u4EBA\u7C7B\u72EC\u7ACB\u5B8C\u6210\u3001\u9700\u8981\u5224\u65AD\u529B/\u521B\u9020\u529B/\u60C5\u611F\u7684\u4EFB\u52A1
   \u3010\u5206\u7C7B\u8981\u6C42\u3011\u6BCF\u7C7B\u4EFB\u52A1\u4E0D\u5C11\u4E8E6\u4E2A\uFF0C\u4EFB\u52A1\u540D\u79F0\u7B80\u77ED\uFF084-8\u4E2A\u5B57\uFF09\uFF0C\u5177\u4F53\u660E\u786E
2. \u672A\u6765\u5C97\u4F4D\u540D\u79F0\u5EFA\u8BAE\uFF08futureJobTitles\uFF09\uFF1A\u57FA\u4E8EAI\u8F6C\u578B\u540E\u7684\u5C97\u4F4D\u5B9A\u4F4D\uFF0C\u7ED9\u51FA2-3\u4E2A\u672A\u6765\u5C97\u4F4D\u540D\u79F0\u5EFA\u8BAE
3. \u65B0\u80FD\u529B\u6A21\u578B\uFF08\u9700\u8981\u57F9\u517B\u7684\u65B0\u6280\u80FD\uFF09
4. \u65B0\u589E\u89D2\u8272\uFF08newRoles\uFF09\uFF1AAI\u8F6C\u578B\u540E\u8BE5\u5C97\u4F4D\u9700\u8981\u65B0\u8BBE\u6216\u884D\u751F\u7684\u65B0\u89D2\u8272/\u5B50\u5C97\u4F4D\uFF0C\u6BCF\u4E2A\u5305\u542Btitle\u3001responsibilities\u3001skills\u3001staffingSource\uFF08"\u65B0\u8BBE"/"\u73B0\u6709XX\u5C97\u4F4D\u8F6C\u578B"/"\u73B0\u6709\u4EBA\u5458\u517C\u4EFB"\uFF09
   \u3010\u89C4\u6A21\u7EA6\u675F\u3011\u5F53\u524D\u56E2\u961F\u89C4\u6A21\u4E3A\uFF1A${prevResults[0]?.data?.teamSize || "\u672A\u77E5"}
   - \u5982\u679C\u56E2\u961F\u226410\u4EBA\uFF1A\u6700\u591A\u5EFA\u8BAE1-2\u4E2A\u65B0\u89D2\u8272\uFF0C\u4E14\u4F18\u5148\u7531\u73B0\u6709\u4EBA\u5458\u517C\u4EFB\u6216\u8F6C\u578B
   - \u5982\u679C\u56E2\u961F11-30\u4EBA\uFF1A\u5EFA\u8BAE2-3\u4E2A\u65B0\u89D2\u8272\uFF0C\u5206\u4E24\u9636\u6BB5\u5F15\u5165\uFF08\u7B2C\u4E00\u9636\u6BB51-2\u4E2A\u6838\u5FC3\u89D2\u8272\uFF09
   - \u5982\u679C\u56E2\u961F>30\u4EBA\uFF1A\u53EF\u5EFA\u8BAE3-4\u4E2A\u65B0\u89D2\u8272
   - \u5982\u679C\u56E2\u961F\u89C4\u6A21\u4E3A"\u672A\u63D0\u4F9B"\u6216"\u672A\u77E5"\uFF0C\u9ED8\u8BA4\u6309\u4E2D\u5C0F\u56E2\u961F\uFF0810-20\u4EBA\uFF09\u5904\u7406\uFF0C\u5EFA\u8BAE2-3\u4E2A\u89D2\u8272
   - \u6240\u6709\u65B0\u89D2\u8272\u5FC5\u987B\u5728 staffingSource \u4E2D\u8BF4\u660E\u662F"\u65B0\u8BBE"\u8FD8\u662F"\u7531\u73B0\u6709XX\u5C97\u4F4D\u8F6C\u578B/\u517C\u4EFB"
5. \u56DB\u9636\u6BB5\u5B9E\u65BD\u8DEF\u7EBF\u56FE\uFF08\u6BCF\u9636\u6BB5\u542B\u65F6\u95F4\u3001\u76EE\u6807\u3001\u5173\u952E\u52A8\u4F5C\uFF09
6. \u63A8\u8350\u5DE5\u5177\u6E05\u5355\uFF08\u6BCF\u4E2A\u5DE5\u5177\u7C7B\u522B\u5FC5\u987B\u5305\u542BmatchReason\u5B57\u6BB5\uFF0C100-200\u5B57\u573A\u666F\u5316\u5E94\u7528\u8BF4\u660E\uFF0C\u5305\u542B\u5177\u4F53\u4F7F\u7528\u573A\u666F\u3001\u9884\u671F\u6548\u679C\u3001\u4E0A\u624B\u5EFA\u8BAE\uFF09

\u3010\u5DE5\u5177\u63A8\u8350\u89C4\u5219\u3011
1. \u4F60\u53EA\u80FD\u4ECE\u4E0B\u65B9\u3010\u53EF\u9009\u5DE5\u5177\u5217\u8868\u3011\u4E2D\u9009\u62E9\u5DE5\u5177\uFF0C\u7EDD\u5BF9\u7981\u6B62\u81EA\u884C\u521B\u9020\u6216\u7F16\u9020\u4EFB\u4F55\u5DE5\u5177\u540D\u79F0\u3002
2. \u5DE5\u5177\u540D\u79F0\u7981\u6B62\u5305\u542B\u4EFB\u4F55\u7248\u672C\u53F7\uFF08\u5982 GPT-4.1\u3001Claude 4\u3001V7 \u7B49\uFF09\u3002
3. \u6BCF\u4E2A\u5DE5\u5177\u63A8\u8350\u5FC5\u987B\u540C\u65F6\u63D0\u4F9B\u300C\u56FD\u9645\u7248\u300D\u548C\u300C\u56FD\u5185\u66FF\u4EE3\u300D\u4E24\u4E2A\u7248\u672C\u3002
4. \u63A8\u8350\u7684\u5DE5\u5177\u5FC5\u987B\u4E0E\u5C97\u4F4D\u5B9E\u9645\u5DE5\u4F5C\u5185\u5BB9\u76F4\u63A5\u76F8\u5173\u3002
5. \u3010\u5DE5\u5177\u529F\u80FD\u63CF\u8FF0\u51C6\u786E\u6027\u3011\u63CF\u8FF0\u5DE5\u5177\u80FD\u529B\u65F6\uFF0C\u53EA\u80FD\u57FA\u4E8E\u8BE5\u5DE5\u5177\u7684\u771F\u5B9E\u5DF2\u77E5\u529F\u80FD\uFF0C\u4E25\u7981\u7F16\u9020\u5DE5\u5177\u4E0D\u5177\u5907\u7684\u80FD\u529B\u3002\u5E38\u89C1\u9519\u8BEF\u793A\u4F8B\uFF1A
   - Perplexity\u662F\u516C\u5F00\u4E92\u8054\u7F51AI\u641C\u7D22\u5F15\u64CE\uFF0C\u4E0D\u652F\u6301\u4F01\u4E1A\u79C1\u6709\u77E5\u8BC6\u5E93\u90E8\u7F72
   - Midjourney\u53EA\u80FD\u751F\u6210\u9759\u6001\u56FE\u7247\uFF0C\u4E0D\u80FD\u751F\u6210\u89C6\u9891
   - ChatExcel\u53EA\u652F\u6301Excel\u8868\u683C\u64CD\u4F5C\uFF0C\u4E0D\u80FD\u505APPT/Word
   - \u98DE\u4E66\u5999\u8BB0\u662F\u4F1A\u8BAE\u5F55\u97F3\u8F6C\u6587\u5B57\u5DE5\u5177\uFF0C\u4E0D\u662F\u5B9E\u65F6\u7FFB\u8BD1\u5DE5\u5177
   \u5982\u679C\u4E0D\u786E\u5B9A\u67D0\u5DE5\u5177\u662F\u5426\u5177\u5907\u67D0\u529F\u80FD\uFF0C\u8BF7\u53EA\u63CF\u8FF0\u5176\u6838\u5FC3\u5DF2\u77E5\u529F\u80FD\uFF08\u53C2\u8003\u5DE5\u5177\u5217\u8868\u4E2D\u7684\u300C\u6838\u5FC3\u4F18\u52BF\u300D\u5B57\u6BB5\uFF09\u3002

\u3010\u5C97\u4F4D\u7981\u533A - \u4EE5\u4E0B\u63A8\u8350\u5C06\u88AB\u7CFB\u7EDF\u81EA\u52A8\u62E6\u622A\u5E76\u5220\u9664\u3011
${prohibitionText}

\u3010\u53EF\u9009\u5DE5\u5177\u5217\u8868 - \u53EA\u80FD\u4ECE\u4E2D\u9009\u62E9\u3011
${toolListText}

\u8BF7\u8F93\u51FAJSON\u683C\u5F0F\u3002`;
    },
    schema: {
      name: "step7_restructuring",
      strict: true,
      schema: {
        type: "object",
        properties: {
          taskClassification: {
            type: "object",
            properties: {
              aiReplace: { type: "array", items: { type: "string" }, description: "\u5E94\u88ABAI\u66FF\u4EE3\u7684\u4EFB\u52A1\uFF0C\u4E0D\u5C11\u4E8E6\u4E2A" },
              aiEnhance: { type: "array", items: { type: "string" }, description: "\u5E94\u88ABAI\u589E\u5F3A\u7684\u4EFB\u52A1\uFF0C\u4E0D\u5C11\u4E8E6\u4E2A" },
              humanRetain: { type: "array", items: { type: "string" }, description: "\u5E94\u4FDD\u7559\u7ED9\u4EBA\u7C7B\u7684\u4EFB\u52A1\uFF0C\u4E0D\u5C11\u4E8E6\u4E2A" }
            },
            required: ["aiReplace", "aiEnhance", "humanRetain"],
            additionalProperties: false
          },
          futureJobTitles: { type: "array", items: { type: "string" }, description: "\u672A\u6765\u5C97\u4F4D\u540D\u79F0\u5EFA\u8BAE\uFF0C2-3\u4E2A" },
          newCapabilityModel: { type: "array", items: { type: "string" } },
          newRoles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "\u65B0\u589E\u89D2\u8272/\u5C97\u4F4D\u540D\u79F0" },
                responsibilities: { type: "string", description: "\u804C\u8D23\u63CF\u8FF0" },
                skills: { type: "array", items: { type: "string" }, description: "\u6240\u9700\u6280\u80FD" },
                staffingSource: { type: "string", description: "\u4EBA\u5458\u6765\u6E90\uFF1A\u65B0\u8BBE/\u73B0\u6709XX\u5C97\u4F4D\u8F6C\u578B/\u73B0\u6709\u4EBA\u5458\u517C\u4EFB" }
              },
              required: ["title", "responsibilities", "skills", "staffingSource"],
              additionalProperties: false
            },
            description: "AI\u8F6C\u578B\u540E\u9700\u8981\u65B0\u8BBE\u6216\u8F6C\u578B\u7684\u89D2\u8272/\u5C97\u4F4D"
          },
          roadmap: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phase: { type: "number" },
                name: { type: "string" },
                duration: { type: "string" },
                goals: { type: "array", items: { type: "string" } },
                actions: { type: "array", items: { type: "string" } }
              },
              required: ["phase", "name", "duration", "goals", "actions"],
              additionalProperties: false
            }
          },
          toolRecommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                tools: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      internationalTool: { type: "string", description: "\u56FD\u9645\u7248\u5DE5\u5177\u540D\u79F0\uFF0C\u4E0D\u5E26\u7248\u672C\u53F7\uFF0C\u5FC5\u987B\u6765\u81EA\u767D\u540D\u5355" },
                      domesticAlternative: { type: "string", description: "\u4E2D\u56FD\u56FD\u4EA7\u66FF\u4EE3\u5DE5\u5177\u540D\u79F0\uFF0C\u5FC5\u987B\u6765\u81EA\u767D\u540D\u5355" }
                    },
                    required: ["internationalTool", "domesticAlternative"],
                    additionalProperties: false
                  }
                },
                purpose: { type: "string" },
                matchReason: { type: "string", description: "100-200\u5B57\u573A\u666F\u5316\u5E94\u7528\u8BF4\u660E" }
              },
              required: ["category", "tools", "purpose", "matchReason"],
              additionalProperties: false
            }
          }
        },
        required: ["taskClassification", "futureJobTitles", "newCapabilityModel", "newRoles", "roadmap", "toolRecommendations"],
        additionalProperties: false
      }
    }
  },
  {
    id: 8,
    title: "\u98CE\u9669\u63A7\u5236\u4E0EKPI",
    prompt: (_input, prevResults) => `\u8BBE\u8BA1\u98CE\u9669\u63A7\u5236\u65B9\u6848\u548CKPI\u4F53\u7CFB\u3002

\u5C97\u4F4D\u4FE1\u606F\uFF1A${JSON.stringify(prevResults[0]?.data)}
\u5B9E\u65BD\u8DEF\u7EBF\u56FE\uFF1A${JSON.stringify(prevResults[6]?.data)}

\u8BF7\u5305\u542B\uFF1A
1. \u4E03\u7C7B\u98CE\u9669\uFF08\u6280\u672F\u98CE\u9669\u3001\u4EBA\u5458\u98CE\u9669\u3001\u6D41\u7A0B\u98CE\u9669\u3001\u6570\u636E\u98CE\u9669\u3001\u5408\u89C4\u98CE\u9669\u3001\u6210\u672C\u98CE\u9669\u3001\u53D8\u9769\u7BA1\u7406\u98CE\u9669\uFF09
2. \u516D\u7EF4\u5EA6KPI\u4F53\u7CFB\uFF08\u6BCF\u4E2AKPI\u7684dimension\u540D\u79F0\u5FC5\u987B\u4E0Emetric\u63CF\u8FF0\u8BED\u4E49\u4E00\u81F4\uFF0C\u4F8B\u5982metric\u8BF4"\u53C2\u4E0E\u5EA6"\u5219dimension\u5E94\u4E3A"\u5458\u5DE5\u53C2\u4E0E\u5EA6"\u800C\u975E"\u5458\u5DE5\u656C\u4E1A\u5EA6"\uFF1B\u786E\u4FDDbaseline\u548Ctarget\u503C\u7B80\u6D01\u660E\u786E\uFF0C\u907F\u514D\u8FC7\u957F\u6587\u5B57\uFF09
3. \u6700\u7EC8\u7ED3\u8BBA\u4E0E\u5EFA\u8BAE

\u3010KPI\u7EA6\u675F\u3011
- dimension\uFF1A2-4\u4E2A\u5B57\u7684\u7B80\u77ED\u540D\u79F0\uFF08\u5982"\u6548\u7387\u63D0\u5347"\u3001"\u54C1\u724C\u5F71\u54CD\u529B"\uFF09
- metric\uFF1A\u4E00\u53E5\u8BDD\u8BF4\u660E\u5177\u4F53\u8861\u91CF\u6307\u6807\uFF08\u5982"\u5185\u5BB9\u751F\u4EA7\u5468\u671F"\uFF09
- baseline\u548Ctarget\uFF1A\u5FC5\u987B\u662F\u5177\u4F53\u7684\u6570\u503C+\u5355\u4F4D\uFF08\u5982"5\u5929/\u7BC7"\u3001"2\u5929/\u7BC7"\u3001"15%"\u3001"20%"\u3001"3.5\u5206"\uFF09\uFF0C\u4E25\u7981\u4F7F\u7528X\u3001Y\u3001Z\u3001N\u3001M\u3001P\u3001Q\u7B49\u53D8\u91CF\u5360\u4F4D\u7B26\uFF0C\u4E25\u7981\u5199\u6210"X\u5929"\u3001"Y%"\u3001"N\u5206"\u7B49\u6A21\u677F\u683C\u5F0F\uFF0C\u5FC5\u987B\u7ED9\u51FA\u5408\u7406\u7684\u4F30\u8BA1\u6570\u503C

\u3010\u4E00\u81F4\u6027\u7EA6\u675F\u3011
- \u7ED3\u8BBA\u4E2D\u5F15\u7528\u7684\u98CE\u9669\u6570\u91CF\u5FC5\u987B\u4E0E\u672C\u6B65\u9AA4 risks \u6570\u7EC4\u7684\u5B9E\u9645\u957F\u5EA6\u4E00\u81F4\uFF0C\u7981\u6B62\u5199"\u5171X\u9879\u98CE\u9669"\u800C\u5B9E\u9645\u6570\u91CF\u4E0D\u7B26\u3002
- \u7ED3\u8BBA\u4E2D\u5F15\u7528\u7684\u6548\u7387\u63D0\u5347\u6570\u503C\u5FC5\u987B\u4E0E\u5B9E\u65BD\u8DEF\u7EBF\u56FE\u4E2D\u7684\u6570\u636E\u4E00\u81F4\u3002
- \u56E2\u961F\u89C4\u6A21\u5F15\u7528\u5FC5\u987B\u4E0E\u5C97\u4F4D\u4FE1\u606F\u4E00\u81F4\uFF1A${prevResults[0]?.data?.teamSize || "\u672A\u63D0\u4F9B"}\u3002

\u8BF7\u8F93\u51FAJSON\u683C\u5F0F\u3002`,
    schema: {
      name: "step8_risks_kpi",
      strict: true,
      schema: {
        type: "object",
        properties: {
          risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                description: { type: "string" },
                probability: { type: "string" },
                impact: { type: "string" },
                mitigation: { type: "string" }
              },
              required: ["category", "description", "probability", "impact", "mitigation"],
              additionalProperties: false
            }
          },
          kpis: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dimension: { type: "string" },
                metric: { type: "string" },
                baseline: { type: "string" },
                target: { type: "string" },
                measureMethod: { type: "string" }
              },
              required: ["dimension", "metric", "baseline", "target", "measureMethod"],
              additionalProperties: false
            }
          },
          conclusion: { type: "string" },
          keyRecommendations: { type: "array", items: { type: "string" } }
        },
        required: ["risks", "kpis", "conclusion", "keyRecommendations"],
        additionalProperties: false
      }
    }
  },
  {
    id: 9,
    title: "\u8F6C\u578B\u80FD\u529B\u57F9\u8BAD\u8BC4\u4F30",
    prompt: (_input, prevResults) => `\u57FA\u4E8E\u524D8\u6B65\u7684\u5B8C\u6574\u5206\u6790\u7ED3\u679C\uFF0C\u4E3A\u8BE5\u5C97\u4F4D\u751F\u6210\u4E2A\u6027\u5316\u7684\u8F6C\u578B\u80FD\u529B\u57F9\u8BAD\u8BC4\u4F30\u65B9\u6848\u3002

\u5C97\u4F4D\u4FE1\u606F\uFF1A${JSON.stringify(prevResults[0]?.data)}
\u7B2C\u4E00\u6027\u5206\u6790\uFF1A${JSON.stringify(prevResults[1]?.data)}
\u5F53\u524D\u5DE5\u4F5C\u6D41\uFF1A${JSON.stringify(prevResults[2]?.data)}
AI\u5DE5\u5177\u63A8\u8350\uFF1A${JSON.stringify(prevResults[3]?.data)}
\u65B0\u5DE5\u4F5C\u6D41\uFF1A${JSON.stringify(prevResults[4]?.data)}
\u5C97\u4F4D\u91CD\u7EC4\uFF1A${JSON.stringify(prevResults[6]?.data)}

\u4F60\u9700\u8981\u5206\u6790\u8BE5\u5C97\u4F4D\u5728AI\u8F6C\u578B\u524D\u540E\uFF0C\u5BF9\u4EE5\u4E0B\u56DB\u4E2A\u7EF4\u5EA6\u3001\u517115\u4E2A\u80FD\u529B\u9879\u7684\u9700\u6C42\u7A0B\u5EA6\u53D8\u5316\uFF081-5\u5206\u6574\u6570\uFF09\uFF0C\u5E76\u7ED9\u51FA\u57F9\u8BAD\u5EFA\u8BAE\u3002

\u6CE8\u610F\uFF1A\u8FD9\u4E0D\u662F\u5BF9\u67D0\u4E2A\u4EBA\u7684\u80FD\u529B\u6D4B\u8BC4\uFF0C\u800C\u662F\u5206\u6790"\u8BE5\u5C97\u4F4D\u5728\u8F6C\u578B\u524D\u540E\u5BF9\u8FD9\u4E9B\u80FD\u529B\u7684\u9700\u6C42\u5EA6\u6709\u591A\u9AD8"\u3002

\u3010\u56DB\u7EF4\u5EA615\u9879\u80FD\u529B\u6E05\u5355\u3011

\u7EF4\u5EA6\u4E00\uFF1A\u601D\u7EF4/\u5FC3\u667A\u8BAD\u7EC3\uFF086\u9879\uFF09
1. \u7B2C\u4E00\u6027\u601D\u7EF4\uFF1A\u56DE\u5F52\u4E8B\u7269\u6700\u57FA\u672C\u7684\u771F\u7406\u548C\u5047\u8BBE\uFF0C\u4ECE\u96F6\u5F00\u59CB\u63A8\u7406
2. \u6279\u5224\u601D\u7EF4\uFF1A\u5BF9\u4FE1\u606F\u3001\u8BBA\u8BC1\u548C\u7ED3\u8BBA\u8FDB\u884C\u7CFB\u7EDF\u6027\u7684\u5206\u6790\u3001\u8BC4\u4F30\u548C\u8D28\u7591
3. \u7CFB\u7EDF\u601D\u7EF4\uFF1A\u5C06\u4E8B\u7269\u89C6\u4E3A\u76F8\u4E92\u5173\u8054\u7684\u7CFB\u7EDF\u800C\u975E\u5B64\u7ACB\u7684\u90E8\u5206
4. \u62BD\u8C61\u601D\u7EF4\uFF1A\u4ECE\u5177\u4F53\u4E8B\u7269\u4E2D\u63D0\u53D6\u5171\u6027\u6A21\u5F0F\u3001\u89C4\u5F8B\u548C\u539F\u5219
5. \u5F00\u653E\u601D\u7EF4\u4E0E\u6210\u957F\u5FC3\u667A\uFF1A\u5BF9\u65B0\u89C2\u70B9\u4FDD\u6301\u63A5\u7EB3\uFF0C\u76F8\u4FE1\u80FD\u529B\u53EF\u901A\u8FC7\u5B66\u4E60\u63D0\u5347
6. \u8BBE\u8BA1\u601D\u7EF4\uFF1A\u4EE5\u4EBA\u4E3A\u4E2D\u5FC3\u7684\u521B\u65B0\u65B9\u6CD5\u8BBA\uFF08\u5171\u60C5\u2192\u5B9A\u4E49\u2192\u6784\u601D\u2192\u539F\u578B\u2192\u6D4B\u8BD5\uFF09

\u7EF4\u5EA6\u4E8C\uFF1A\u6280\u80FD\u8BAD\u7EC3\uFF084\u9879\uFF09
1. \u4EBA\u673A\u6C9F\u901A\uFF08\u63D0\u793A\u8BCD\u5DE5\u7A0B\uFF09\uFF1A\u901A\u8FC7\u7CBE\u786E\u7684\u81EA\u7136\u8BED\u8A00\u6307\u4EE4\u5F15\u5BFCAI\u4EA7\u751F\u9AD8\u8D28\u91CF\u8F93\u51FA
2. \u667A\u80FD\u4F53\uFF1A\u8BBE\u8BA1\u3001\u914D\u7F6E\u548C\u7BA1\u7406AI\u667A\u80FD\u4F53\uFF08Agent\uFF09\u7684\u80FD\u529B
3. \u5DE5\u4F5C\u6D41\uFF1A\u5C06\u91CD\u590D\u6027\u4E1A\u52A1\u6D41\u7A0B\u901A\u8FC7AI+\u81EA\u52A8\u5316\u5DE5\u5177\u5B9E\u73B0\u7AEF\u5230\u7AEF\u81EA\u52A8\u6267\u884C
4. \u6C1B\u56F4\u7F16\u7A0B\uFF1A\u901A\u8FC7\u81EA\u7136\u8BED\u8A00\u63CF\u8FF0\u9700\u6C42\uFF0C\u501F\u52A9AI\u7F16\u7A0B\u52A9\u624B\u751F\u6210\u4EE3\u7801

\u7EF4\u5EA6\u4E09\uFF1A\u77E5\u8BC6\u5B66\u4E60\uFF083\u9879\uFF09
1. \u4EBA\u5DE5\u667A\u80FD\u7B80\u53F2\uFF1A\u4E86\u89E3AI\u53D1\u5C55\u5386\u7A0B\u3001\u5173\u952E\u91CC\u7A0B\u7891\u548C\u6280\u672F\u6F14\u8FDB\u8109\u7EDC
2. AI\u6838\u5FC3\u6280\u672F\u4E0E\u5173\u952E\u7406\u8BBA\uFF1A\u7406\u89E3\u673A\u5668\u5B66\u4E60\u3001\u6DF1\u5EA6\u5B66\u4E60\u3001\u5927\u8BED\u8A00\u6A21\u578B\u7B49\u6838\u5FC3\u6280\u672F\u539F\u7406
3. AI\u5546\u4E1A\u5E94\u7528\u4E0E\u6218\u7565\u8F6C\u578B\uFF1A\u4E86\u89E3AI\u5728\u5404\u884C\u4E1A\u7684\u5546\u4E1A\u5E94\u7528\u6A21\u5F0F\u548C\u4F01\u4E1AAI\u6218\u7565\u8F6C\u578B\u8DEF\u5F84

\u7EF4\u5EA6\u56DB\uFF1A\u4EF7\u503C\u89C2\u4E0E\u4F26\u7406\u8BAD\u7EC3\uFF082\u9879\uFF09
1. \u4EBA\u5DE5\u667A\u80FD\u4F26\u7406\uFF1AAI\u7CFB\u7EDF\u7684\u516C\u5E73\u6027\u3001\u900F\u660E\u6027\u3001\u53EF\u89E3\u91CA\u6027\u548C\u95EE\u8D23\u5236
2. AI\u5B89\u5168\u3001\u9690\u79C1\u4E0E\u5408\u89C4\u610F\u8BC6\uFF1AAI\u7CFB\u7EDF\u7684\u6280\u672F\u5B89\u5168\u6027\u3001\u6570\u636E\u9690\u79C1\u4FDD\u62A4\u548C\u6CD5\u89C4\u5408\u89C4

\u3010\u5206\u6790\u89C4\u5219\u3011
- \u8F6C\u578B\u524D\u9700\u6C42\u5EA6\uFF08preTransformDemand\uFF09\uFF1A\u8BE5\u5C97\u4F4D\u5728AI\u8F6C\u578B\u4E4B\u524D\uFF0C\u65E5\u5E38\u5DE5\u4F5C\u5BF9\u6B64\u80FD\u529B\u7684\u9700\u6C42\u7A0B\u5EA6\u30021=\u51E0\u4E4E\u4E0D\u9700\u8981\uFF0C2=\u5076\u5C14\u9700\u8981\uFF0C3=\u7ECF\u5E38\u9700\u8981\uFF0C4=\u9AD8\u5EA6\u4F9D\u8D56\uFF0C5=\u6838\u5FC3\u5FC5\u5907
- \u8F6C\u578B\u540E\u9700\u6C42\u5EA6\uFF08postTransformDemand\uFF09\uFF1A\u8BE5\u5C97\u4F4D\u5B8C\u6210AI\u8F6C\u578B\u540E\uFF0C\u65B0\u5DE5\u4F5C\u6A21\u5F0F\u5BF9\u6B64\u80FD\u529B\u7684\u9700\u6C42\u7A0B\u5EA6\u3002\u5FC5\u987B>=\u8F6C\u578B\u524D\u9700\u6C42\u5EA6
- \u9700\u6C42\u589E\u957F\uFF08demandGrowth\uFF09= \u8F6C\u578B\u540E\u9700\u6C42\u5EA6 - \u8F6C\u578B\u524D\u9700\u6C42\u5EA6
- \u4F18\u5148\u7EA7\uFF08priority\uFF09\uFF1A\u7EFC\u5408\u9700\u6C42\u589E\u957F\u5E45\u5EA6\u3001\u5BF9\u8F6C\u578B\u6210\u529F\u7684\u5F71\u54CD\u5EA6\u3001\u524D\u7F6E\u4F9D\u8D56\u5173\u7CFB\u786E\u5B9A\uFF0C\u5206\u4E3A"\u7ACB\u5373\u5F00\u59CB"\u3001"\u7B2C\u4E00\u5B63\u5EA6"\u3001"\u7B2C\u4E8C\u5B63\u5EA6"\u3001"\u7B2C\u4E09\u5B63\u5EA6+"
- \u57F9\u8BAD\u5EFA\u8BAE\uFF08trainingAdvice\uFF09\uFF1A\u9488\u5BF9\u8BE5\u5C97\u4F4D\u7684\u5177\u4F53\u57F9\u8BAD\u5EFA\u8BAE\uFF0C100-200\u5B57\uFF0C\u5FC5\u987B\u7ED3\u5408\u5C97\u4F4D\u5B9E\u9645\u573A\u666F\uFF0C\u8BF4\u660E\u4E3A\u4EC0\u4E48\u8F6C\u578B\u540E\u5BF9\u6B64\u80FD\u529B\u9700\u6C42\u589E\u52A0
- \u63A8\u8350\u8D44\u6E90\uFF08resources\uFF09\uFF1A\u63A8\u83502-3\u4E2A\u5177\u4F53\u7684\u5B66\u4E60\u8D44\u6E90\uFF08\u4E2D\u6587\u4F18\u5148\u3001\u514D\u8D39\u4F18\u5148\uFF09\uFF0C\u5305\u542B\u540D\u79F0\u548C\u5E73\u53F0

\u3010\u91CD\u8981\u7EA6\u675F\u3011
- \u4E0D\u540C\u5C97\u4F4D\u7684\u5206\u6790\u7ED3\u679C\u5FC5\u987B\u6709\u660E\u663E\u5DEE\u5F02\uFF0C\u4F53\u73B0\u5C97\u4F4D\u7279\u6027
- \u6280\u672F\u7C7B\u5C97\u4F4D\u5728\u6280\u80FD\u7EF4\u5EA6\u7684\u8F6C\u578B\u540E\u9700\u6C42\u5EA6\u901A\u5E38\u8F83\u9AD8
- \u7BA1\u7406\u7C7B\u5C97\u4F4D\u5728\u601D\u7EF4\u7EF4\u5EA6\u7684\u8F6C\u578B\u540E\u9700\u6C42\u5EA6\u901A\u5E38\u8F83\u9AD8
- \u6240\u6709\u5C97\u4F4D\u5728\u4F26\u7406\u7EF4\u5EA6\u90FD\u5E94\u6709\u57FA\u672C\u8981\u6C42\uFF08\u8F6C\u578B\u540E\u9700\u6C42\u5EA6>=3\uFF09
- dimensionSummary\u4E2D\u6BCF\u4E2A\u7EF4\u5EA6\u7684avgPreTransform\u548CavgPostTransform\u662F\u8BE5\u7EF4\u5EA6\u4E0B\u6240\u6709\u80FD\u529B\u9879\u7684\u5E73\u5747\u5206
- overallReadiness\u662F15\u9879\u80FD\u529B\u8F6C\u578B\u524D\u9700\u6C42\u5EA6\u7684\u52A0\u6743\u5E73\u5747/5*100\u7684\u767E\u5206\u6BD4\uFF0C\u53CD\u6620\u5C97\u4F4D\u5F53\u524D\u7684AI\u5C31\u7EEA\u57FA\u7840

\u8BF7\u8F93\u51FAJSON\u683C\u5F0F\u3002`,
    schema: {
      name: "step9_training_competency",
      strict: true,
      schema: {
        type: "object",
        properties: {
          dimensionSummary: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dimension: { type: "string" },
                avgPreTransform: { type: "number" },
                avgPostTransform: { type: "number" },
                avgDemandGrowth: { type: "number" }
              },
              required: ["dimension", "avgPreTransform", "avgPostTransform", "avgDemandGrowth"],
              additionalProperties: false
            }
          },
          competencies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dimension: { type: "string" },
                name: { type: "string" },
                preTransformDemand: { type: "number" },
                postTransformDemand: { type: "number" },
                demandGrowth: { type: "number" },
                priority: { type: "string" },
                trainingAdvice: { type: "string" },
                resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      platform: { type: "string" },
                      isFree: { type: "boolean" }
                    },
                    required: ["name", "platform", "isFree"],
                    additionalProperties: false
                  }
                }
              },
              required: ["dimension", "name", "preTransformDemand", "postTransformDemand", "demandGrowth", "priority", "trainingAdvice", "resources"],
              additionalProperties: false
            }
          },
          priorityRanking: {
            type: "array",
            items: {
              type: "object",
              properties: {
                rank: { type: "number" },
                name: { type: "string" },
                priority: { type: "string" },
                reason: { type: "string" }
              },
              required: ["rank", "name", "priority", "reason"],
              additionalProperties: false
            }
          },
          quarterlyPlan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                quarter: { type: "string" },
                focus: { type: "string" },
                items: { type: "array", items: { type: "string" } }
              },
              required: ["quarter", "focus", "items"],
              additionalProperties: false
            }
          },
          overallReadiness: { type: "number" },
          overallSummary: { type: "string" }
        },
        required: ["dimensionSummary", "competencies", "priorityRanking", "quarterlyPlan", "overallReadiness", "overallSummary"],
        additionalProperties: false
      }
    }
  }
];
function cleanToolName(name) {
  if (!name) return "";
  let cleaned = name.replace(/GPT-?\d+(\.\d+)?\s*(Pro|Ultra|Opus|Turbo|Plus)?/gi, "ChatGPT").replace(/Claude\s*\d+(\.\d+)?\s*(Opus|Sonnet|Haiku)?/gi, "Claude").replace(/Gemini\s*\d+(\.\d+)?\s*(Pro|Ultra|Flash|Nano|Advanced)?/gi, "Gemini").replace(/DeepSeek[-\s]*[A-Z]?\d+(\.\d+)?/gi, "DeepSeek").replace(/Llama\s*\d+(\.\d+)?\s*(Maverick|Scout)?/gi, "Llama").replace(/Midjourney\s*V\d+/gi, "Midjourney").replace(/Suno\s*V\d+/gi, "Suno").replace(/Runway\s*Gen-?\d+/gi, "Runway").replace(/DALL-?E\s*\d+/gi, "DALL-E").replace(/Stable\s*Diffusion\s*\d+(\.\d+)?/gi, "Stable Diffusion").replace(/ElevenLabs\s*V\d+/gi, "ElevenLabs").replace(/GitHub\s*Copilot\s*(X|Pro|Plus|Enterprise)?\s*\d*/gi, "GitHub Copilot").replace(/Microsoft\s*Copilot\s*(Pro|Plus|365)?\s*\d*/gi, "Microsoft Copilot").replace(/Sora\s*\d+(\.\d+)?/gi, "Sora").replace(/\s+V\d+(\.\d+)?/gi, "").replace(/\s+\d+\.\d+(\.\d+)?/g, "").replace(/\s+(Pro|Plus|Ultra|Enterprise|Advanced)\s*$/gi, "").trim();
  return cleaned;
}
function validateToolName(name) {
  if (!name) return "";
  const cleaned = cleanToolName(name);
  const canonical = getCanonicalToolName(cleaned);
  if (canonical && canonical !== cleaned && isToolInCatalog(canonical)) return canonical;
  if (isToolInCatalog(cleaned)) return cleaned;
  if (canonical && canonical !== cleaned) return canonical;
  return cleaned;
}
var OUTDATED_TOOLS = [
  "gpt-3",
  "gpt-3.5",
  "gpt-4",
  "gpt4",
  "gpt-5",
  "gpt5",
  "dall-e 2",
  "dall-e2",
  "midjourney v5",
  "midjourney v4",
  "stable diffusion 1",
  "copilot x",
  "bard",
  "bing chat",
  "bing ai",
  "deepseek-r1",
  "deepseek-r2",
  "deepseek-v2",
  "deepseek-v3",
  "claude 4",
  "claude 3",
  "claude 5",
  "gpt-5.5",
  "llama 4",
  "llama 3",
  "gemini 2",
  "gemini 3"
];
function isOutdatedOrHallucinated(name) {
  if (!name) return true;
  const lower = name.toLowerCase().trim();
  if (lower.length === 0) return true;
  if (OUTDATED_TOOLS.some((t2) => lower.includes(t2))) return true;
  if (/\d+\.\d+/.test(lower)) return true;
  if (/\s+v\d/i.test(lower)) return true;
  if (/[-\s]r\d/i.test(lower)) return true;
  return false;
}
function sanitizeStepData(stepId, data) {
  if (!data) return data;
  try {
    if (stepId === 4 && data.recommendations) {
      data.recommendations = data.recommendations.map((rec) => {
        let aiTools2 = Array.isArray(rec.aiTools) ? rec.aiTools.map((tool) => {
          if (typeof tool === "string") {
            const cleaned = validateToolName(tool);
            return { internationalTool: cleaned, domesticAlternative: "" };
          }
          return {
            ...tool,
            internationalTool: validateToolName(tool.internationalTool || ""),
            domesticAlternative: validateToolName(tool.domesticAlternative || "")
          };
        }).filter(
          (tool) => !isOutdatedOrHallucinated(tool.internationalTool) && tool.internationalTool.length > 0
        ) : rec.aiTools;
        if (!aiTools2 || aiTools2.length === 0) {
          aiTools2 = [{ internationalTool: "ChatGPT", domesticAlternative: "DeepSeek" }];
        }
        return { ...rec, aiTools: aiTools2 };
      });
    }
    if (stepId === 5 && data.newTasks) {
      data.newTasks = data.newTasks.map((task) => {
        let h = Number(task.humanRatio) || 0;
        let a = Number(task.aiRatio) || 0;
        if (h <= 1 && a <= 1 && (h > 0 || a > 0)) {
          h = Math.round(h * 100);
          a = Math.round(a * 100);
        }
        const sum2 = h + a;
        if (sum2 > 0 && sum2 !== 100) {
          h = Math.round(h / sum2 * 100);
          a = 100 - h;
        }
        return { ...task, humanRatio: h, aiRatio: a };
      });
    }
    if (stepId === 7 && data.taskClassification) {
      const tc = data.taskClassification;
      if (tc.retain || tc.automate || tc.eliminate) {
        data.taskClassification = {
          aiReplace: [...tc.automate || [], ...tc.eliminate || []],
          aiEnhance: tc.enhance || [],
          humanRetain: tc.retain || []
        };
      }
      if (!data.taskClassification.aiReplace) data.taskClassification.aiReplace = [];
      if (!data.taskClassification.aiEnhance) data.taskClassification.aiEnhance = [];
      if (!data.taskClassification.humanRetain) data.taskClassification.humanRetain = [];
    }
    if (stepId === 7 && !data.futureJobTitles) {
      data.futureJobTitles = [];
    }
    if (stepId === 7 && data.toolRecommendations) {
      data.toolRecommendations = data.toolRecommendations.map((cat) => {
        let tools = Array.isArray(cat.tools) ? cat.tools.map((tool) => {
          if (typeof tool === "string") {
            const cleaned = validateToolName(tool);
            return { internationalTool: cleaned, domesticAlternative: "" };
          }
          return {
            ...tool,
            internationalTool: validateToolName(tool.internationalTool || ""),
            domesticAlternative: validateToolName(tool.domesticAlternative || "")
          };
        }).filter(
          (tool) => !isOutdatedOrHallucinated(tool.internationalTool) && tool.internationalTool.length > 0
        ) : cat.tools;
        if (!tools || tools.length === 0) {
          tools = [{ internationalTool: "ChatGPT", domesticAlternative: "DeepSeek" }];
        }
        return { ...cat, tools };
      });
    }
  } catch (e) {
    console.warn("sanitizeStepData error:", e);
  }
  return data;
}
async function invokeAndParseStep(step, input, results, ctx, reportId) {
  const userPrompt = step.prompt(input, results);
  const schemaInstruction = `

\u3010\u8F93\u51FA\u683C\u5F0F\u8981\u6C42\u3011\u8BF7\u4E25\u683C\u6309\u7167\u4EE5\u4E0BJSON\u7ED3\u6784\u8F93\u51FA\uFF0C\u4E0D\u8981\u8F93\u51FA\u4EFB\u4F55\u5176\u4ED6\u5185\u5BB9\uFF08\u4E0D\u8981\u52A0\u8BF4\u660E\u3001\u4E0D\u8981\u7528markdown\u4EE3\u7801\u5757\uFF09\uFF1A
${JSON.stringify(step.schema.schema, null, 2)}`;
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt + schemaInstruction }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: step.schema.name,
          schema: step.schema.schema,
          strict: true
        }
      }
    }, ctx);
    const content = response.choices[0]?.message?.content;
    let parsed;
    let outcome = "direct";
    if (typeof content === "string") {
      const pr = robustParseJson(content);
      parsed = pr.data;
      outcome = pr.outcome;
      if (outcome === "failed") {
        console.error(`[Report ${reportId}] Step ${step.id} JSON\u89E3\u6790\u5931\u8D25:`, pr.error);
        recordParseLog({ context: ctx, stepId: step.id, stepTitle: step.title, outcome: "failed", detail: pr.error });
        return null;
      }
      if (outcome === "repaired") {
        recordParseLog({ context: ctx, stepId: step.id, stepTitle: step.title, outcome: "repaired" });
      }
    } else {
      parsed = content;
    }
    parsed = normalizeStepAliases(step.id, parsed);
    parsed = sanitizeStepData(step.id, parsed);
    const emptyKeys = detectEmptyStepKeys(step.id, parsed);
    if (emptyKeys.length > 0) {
      recordParseLog({ context: ctx, stepId: step.id, stepTitle: step.title, outcome: "empty", emptyKeys });
    }
    return parsed;
  } catch (error) {
    console.error(`[Report ${reportId}] Step ${step.id} \u8C03\u7528\u5931\u8D25:`, error?.message || error);
    recordParseLog({ context: ctx, stepId: step.id, stepTitle: step.title, outcome: "failed", detail: error?.message || String(error) });
    return null;
  }
}
async function refillEmptySteps(input, results, ctx, reportId, onProgress) {
  for (const step of STEP_DEFINITIONS) {
    const idx = results.findIndex((r) => r.step === step.id);
    if (idx === -1) continue;
    const current = results[idx].data;
    if (current !== null && !isStepDataIncomplete(step.id, current)) continue;
    const emptyKeys = detectEmptyStepKeys(step.id, current);
    console.warn(`[Report ${reportId}] Step ${step.id} \u751F\u6210\u540E\u4ECD\u4E3A\u7A7A(${emptyKeys.join(",") || "null"})\uFF0C\u53D1\u8D77\u5B9A\u5411\u8865\u5168`);
    onProgress(step.id, step.title, "active");
    const refilled = await invokeAndParseStep(step, input, results, ctx, reportId);
    if (refilled !== null && !isStepDataIncomplete(step.id, refilled)) {
      results[idx].data = refilled;
      onProgress(step.id, step.title, "completed");
      console.warn(`[Report ${reportId}] Step ${step.id} \u5B9A\u5411\u8865\u5168\u6210\u529F`);
    } else {
      if (refilled !== null && (current === null || isStepDataIncomplete(step.id, current))) {
        results[idx].data = refilled;
      }
      onProgress(step.id, step.title, results[idx].data === null ? "error" : "completed");
      console.warn(`[Report ${reportId}] Step ${step.id} \u5B9A\u5411\u8865\u5168\u4ECD\u4E0D\u5B8C\u6574`);
    }
  }
}
async function runAnalysisChain(input, reportId, onProgress, llmContext) {
  const results = [];
  const db = await getDb();
  const ctx = { ...llmContext, feature: llmContext?.feature || "job_analysis" };
  for (const step of STEP_DEFINITIONS) {
    onProgress(step.id, step.title, "active");
    if (db) {
      await db.update(reports).set({ currentStep: step.id, status: "analyzing" }).where(eq4(reports.reportId, reportId));
    }
    let parsed = await invokeAndParseStep(step, input, results, ctx, reportId);
    if (parsed === null || isStepDataIncomplete(step.id, parsed)) {
      console.warn(`[Report ${reportId}] Step ${step.id} \u9996\u6B21\u7ED3\u679C\u4E0D\u5B8C\u6574\uFF0C\u91CD\u8BD5\u4E00\u6B21`);
      const retryParsed = await invokeAndParseStep(step, input, results, ctx, reportId);
      if (retryParsed !== null && !isStepDataIncomplete(step.id, retryParsed)) {
        parsed = retryParsed;
      } else if (parsed === null && retryParsed !== null) {
        parsed = retryParsed;
      }
    }
    results.push({ step: step.id, title: step.title, data: parsed });
    onProgress(step.id, step.title, parsed === null ? "error" : "completed");
  }
  await refillEmptySteps(input, results, ctx, reportId, onProgress);
  const consistencyWarnings = validateCrossStepConsistency(results);
  if (consistencyWarnings.length > 0) {
    console.warn(`[Report ${reportId}] Cross-step consistency warnings:`, consistencyWarnings);
  }
  const hasStep9Failed = results.find((r) => r.step === 9)?.data === null;
  if (db) {
    await db.update(reports).set({
      status: "completed",
      currentStep: hasStep9Failed ? 8 : 9,
      reportData: results,
      completedAt: /* @__PURE__ */ new Date()
    }).where(eq4(reports.reportId, reportId));
  }
  return results;
}
function validateCrossStepConsistency(results) {
  const warnings = [];
  const step1 = results.find((r) => r.step === 1)?.data;
  const step4 = results.find((r) => r.step === 4)?.data;
  const step6 = results.find((r) => r.step === 6)?.data;
  const step8 = results.find((r) => r.step === 8)?.data;
  if (step8?.risks && step8?.conclusion) {
    const actualRiskCount = Array.isArray(step8.risks) ? step8.risks.length : 0;
    const mentionedMatch = step8.conclusion.match(/(\d+)\s*(?:项|个|类).*风险/);
    if (mentionedMatch) {
      const mentionedCount = parseInt(mentionedMatch[1]);
      if (mentionedCount !== actualRiskCount) {
        warnings.push(`\u7ED3\u8BBA\u4E2D\u63D0\u5230${mentionedCount}\u9879\u98CE\u9669\uFF0C\u5B9E\u9645risks\u6570\u7EC4\u4E3A${actualRiskCount}\u9879`);
      }
    }
  }
  if (step1?.teamSize && step6?.assumptions) {
    const teamSize = step1.teamSize;
    if (teamSize !== "\u672A\u63D0\u4F9B" && Array.isArray(step6.assumptions)) {
      const hasTeamRef = step6.assumptions.some(
        (a) => a.includes(teamSize) || a.includes("\u4EBA") || a.includes("\u56E2\u961F")
      );
      if (!hasTeamRef) {
        warnings.push(`Step 1 teamSize="${teamSize}"\uFF0C\u4F46ROI assumptions\u672A\u5F15\u7528\u56E2\u961F\u89C4\u6A21`);
      }
    }
  }
  if (step4?.recommendations && Array.isArray(step4.recommendations)) {
    for (const rec of step4.recommendations) {
      if (rec.efficiencyGain !== void 0) {
        const gain = typeof rec.efficiencyGain === "number" ? rec.efficiencyGain : parseInt(rec.efficiencyGain);
        if (gain > 80) {
          warnings.push(`Step 4 \u8282\u70B9"${rec.taskName || "unknown"}" efficiencyGain=${gain}% \u8D85\u8FC780%\u4E0A\u9650`);
        }
      }
    }
  }
  if (step6?.roiPlans && Array.isArray(step6.roiPlans)) {
    for (const plan of step6.roiPlans) {
      if (plan.roiPercent > 500) {
        warnings.push(`ROI\u65B9\u6848"${plan.planName}" roiPercent=${plan.roiPercent}% \u8D85\u8FC7500%\u4E0A\u9650`);
      }
    }
  }
  return warnings;
}

// server/storage.ts
init_env();
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}

// server/apiRoutes.ts
init_llm();

// server/_core/adminIdentity.ts
import { parse as parseCookieHeader2 } from "cookie";
import { jwtVerify as jwtVerify2 } from "jose";

// server/adminAuthRoute.ts
init_env();
import { SignJWT as SignJWT2 } from "jose";
var PLATFORM_ADMIN_COOKIE = "platform_admin_session";
var ADMIN_SESSION_EXPIRY_MS = 24 * 60 * 60 * 1e3;
function getAdminSecret() {
  return new TextEncoder().encode(ENV.cookieSecret + "_platform_admin");
}
async function signAdminToken() {
  const now = Date.now();
  const expirationSeconds = Math.floor((now + ADMIN_SESSION_EXPIRY_MS) / 1e3);
  return new SignJWT2({ role: "platform_admin" }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(getAdminSecret());
}
function registerAdminAuthRoute(app) {
  app.post("/api/admin/verify", async (req, res) => {
    const { password } = req.body;
    if (!password || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "\u5BC6\u7801\u4E0D\u80FD\u4E3A\u7A7A" });
    }
    if (!ENV.adminPassword) {
      return res.status(500).json({ success: false, message: "\u7BA1\u7406\u5458\u5BC6\u7801\u672A\u914D\u7F6E" });
    }
    if (password === ENV.adminPassword) {
      try {
        const token = await signAdminToken();
        const cookieOpts = getSessionCookieOptions(req);
        res.cookie(PLATFORM_ADMIN_COOKIE, token, {
          ...cookieOpts,
          maxAge: ADMIN_SESSION_EXPIRY_MS
        });
        return res.json({ success: true });
      } catch (error) {
        console.error("[AdminAuth] Failed to sign admin token:", error);
        return res.status(500).json({ success: false, message: "\u670D\u52A1\u5668\u9519\u8BEF" });
      }
    }
    return res.status(401).json({ success: false, message: "\u5BC6\u7801\u9519\u8BEF" });
  });
  app.post("/api/admin/logout", (req, res) => {
    res.clearCookie(PLATFORM_ADMIN_COOKIE, { path: "/" });
    return res.json({ success: true });
  });
  app.get("/api/admin/status", async (req, res) => {
    const ok = await checkPlatformAdmin(req.headers.cookie);
    return res.json({ authenticated: ok });
  });
}

// server/_core/adminIdentity.ts
async function checkPlatformAdmin(cookieHeader) {
  if (!cookieHeader) return false;
  try {
    const cookies = parseCookieHeader2(cookieHeader);
    const token = cookies[PLATFORM_ADMIN_COOKIE];
    if (!token) return false;
    const secret = getAdminSecret();
    const { payload } = await jwtVerify2(token, secret, {
      algorithms: ["HS256"]
    });
    return payload.role === "platform_admin";
  } catch {
    return false;
  }
}
function createPlatformAdminUser() {
  return {
    id: 0,
    openId: "platform_admin",
    companyId: null,
    phone: null,
    name: "\u5E73\u53F0\u7BA1\u7406\u5458",
    email: null,
    loginMethod: "password",
    role: "admin",
    tier: "enterprise",
    inviteCount: 0,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date(),
    lastSignedIn: /* @__PURE__ */ new Date()
  };
}
async function authenticateAdmin(req) {
  const isPlatformAdmin = await checkPlatformAdmin(req.headers.cookie);
  if (isPlatformAdmin) {
    return createPlatformAdminUser();
  }
  return null;
}

// shared/bestqiConstants.ts
var FIXED_INDUSTRY = "\u9910\u996E\u884C\u4E1A";
var FIXED_COMPANY_NAME = "\u5305\u9053";
var FIXED_COMPANY_PROFILE = `\u5305\u9053\u96C6\u56E2\u662F\u4E00\u5BB6\u4EE5\u5E7F\u5F0F\u70B9\u5FC3\u4E3A\u6838\u5FC3\u7684\u73B0\u4EE3\u5316\u8FDE\u9501\u9910\u996E\u96C6\u56E2\uFF0C\u8D77\u6E90\u4E8E\u5E7F\u5DDE\uFF0C\u4E3B\u54C1\u724C\u201C\u5305\u9053\u201D\u5B9A\u4F4D\u4E3A\u201C\u5916\u5E26\u5E7F\u5F0F\u70B9\u5FC3\u201D\u4E13\u95E8\u5E97\uFF0C\u81F4\u529B\u4E8E\u5C06\u4F20\u7EDF\u8336\u697C\u54C1\u8D28\u7684\u5E7F\u5F0F\u70B9\u5FC3\u8F6C\u5316\u4E3A\u66F4\u4FBF\u6377\u3001\u66F4\u6807\u51C6\u5316\u3001\u66F4\u9002\u5408\u73B0\u4EE3\u57CE\u5E02\u751F\u6D3B\u7684\u65E5\u5E38\u6D88\u8D39\u4EA7\u54C1\u3002\u96C6\u56E2\u76EE\u524D\u5F62\u6210\u201C\u5305\u9053\u201D\u201C\u714E\u997A\u738B\u5B50\u201D\u201C\u84B8\u9053\u70B9\u201D\u7B49\u591A\u54C1\u724C\u77E9\u9635\uFF0C\u54C1\u724C\u9500\u552E\u7F51\u70B9\u8986\u76D6\u5168\u56FD\u591A\u4E2A\u57CE\u5E02\uFF0C\u5E76\u901A\u8FC7\u81EA\u5EFA\u4F9B\u5E94\u94FE\u4E2D\u5FC3\u3001\u667A\u80FD\u5316\u7BA1\u7406\u7CFB\u7EDF\u3001\u4E13\u4E1A\u5316\u8FD0\u8425\u56E2\u961F\u548C\u96C6\u56E2\u5316\u8FD0\u4F5C\u4F53\u7CFB\uFF0C\u6784\u5EFA\u4E86\u4ECE\u4EA7\u54C1\u7814\u53D1\u3001\u751F\u4EA7\u52A0\u5DE5\u3001\u4ED3\u914D\u7269\u6D41\u5230\u95E8\u5E97\u9009\u5740\u3001\u95E8\u5E97\u8FD0\u8425\u3001\u8425\u9500\u63A8\u5E7F\u7684\u5B8C\u6574\u8FDE\u9501\u9910\u996E\u80FD\u529B\u3002\u5305\u9053\u4EE5\u201C\u4F20\u627F\u5E7F\u5F0F\u70B9\u5FC3\u826F\u5FC3\u54C1\u8D28\uFF0C\u6811\u7ACB\u5168\u7403\u5E78\u798F\u9910\u996E\u5178\u8303\u201D\u4E3A\u4F7F\u547D\uFF0C\u4EE5\u201C\u5E7F\u5F0F\u70B9\u5FC3\uFF0C\u5168\u7403\u7684\u70B9\u5FC3\u201D\u4E3A\u613F\u666F\uFF0C\u5728\u4F20\u7EDF\u975E\u9057\u6280\u827A\u3001\u98DF\u54C1\u54C1\u8D28\u3001\u4F9B\u5E94\u94FE\u6807\u51C6\u5316\u3001\u95E8\u5E97\u590D\u5236\u548C\u6570\u5B57\u5316\u8FD0\u8425\u4E4B\u95F4\u5F62\u6210\u4E86\u8F83\u6E05\u6670\u7684\u54C1\u724C\u53D1\u5C55\u8DEF\u5F84\u3002`;

// server/apiRoutes.ts
import mammoth from "mammoth";
import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createRequire } from "module";
var require2 = createRequire(import.meta.url);
var pdfParse = require2("pdf-parse");
var AdmZip = require2("adm-zip");
var iconv = require2("iconv-lite");
function decodeZipEntryName(entry) {
  const raw = entry.entryName;
  const header = entry.header;
  const isUtf8 = header && (header.flags & 2048) !== 0;
  if (isUtf8) return raw;
  const rawBuf = entry.rawEntryName;
  if (!rawBuf || !Buffer.isBuffer(rawBuf)) return raw;
  if (rawBuf.every((b) => b < 128)) return rawBuf.toString("ascii");
  try {
    const decoded = iconv.decode(rawBuf, "gbk");
    if (/[\u4e00-\u9fff]/.test(decoded)) return decoded;
  } catch {
  }
  return raw;
}
var DAILY_ANALYSIS_LIMIT = 10;
var MAX_FILE_SIZE = 50 * 1024 * 1024;
var upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE } });
function getFileStem(filename) {
  return filename.replace(/\.[^.]+$/, "");
}
function getFileExt(filename) {
  const match = filename.match(/\.([^.]+)$/);
  return match ? match[1] : "txt";
}
function sanitizeFilenamePart(value) {
  return value.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, "").trim().slice(0, 40);
}
function splitExtractedJobSections(extracted, filename) {
  const text2 = extracted.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const titleMatches = Array.from(text2.matchAll(/^(.{2,60}?岗位说明书)\s*$/gm)).filter((match) => {
    const title = (match[1] || "").replace(/\s+/g, "");
    return title !== "\u5C97\u4F4D\u8BF4\u660E\u4E66" && title.length > "\u5C97\u4F4D\u8BF4\u660E\u4E66".length;
  });
  if (titleMatches.length <= 1) {
    return [{ originalname: filename, extractedText: extracted }];
  }
  const stem = getFileStem(filename);
  const ext = getFileExt(filename);
  return titleMatches.map((match, index) => {
    const title = (match[1] || `\u5C97\u4F4D${index + 1}`).replace(/\s+/g, "").replace(/岗位说明书$/, "");
    const start = match.index ?? 0;
    const end = titleMatches[index + 1]?.index ?? text2.length;
    const sectionText = text2.slice(start, end).trim();
    const sectionName = `${stem}-${index + 1}-${sanitizeFilenamePart(title) || "\u5C97\u4F4D"}.${ext}`;
    return {
      originalname: sectionName,
      extractedText: sectionText || extracted
    };
  });
}
var sseConnections = /* @__PURE__ */ new Map();
async function resolveUser(req) {
  const adminUser = await authenticateAdmin(req);
  if (adminUser) return adminUser;
  try {
    const oauthUser = await sdk.authenticateRequest(req);
    if (oauthUser) return oauthUser;
  } catch {
  }
  return await getOrCreateGuestUser();
}
function registerApiRoutes(app) {
  const uploadFilesWithLimit = (req, res, next) => {
    upload.array("files", 10)(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ error: "\u5355\u4E2A\u6587\u4EF6\u5927\u5C0F\u4E0D\u80FD\u8D85\u8FC7 50MB\uFF0C\u8BF7\u538B\u7F29\u540E\u91CD\u8BD5" });
          return;
        }
        res.status(400).json({ error: err.message || "\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25" });
        return;
      }
      next();
    });
  };
  app.post("/api/analysis/submit", uploadFilesWithLimit, async (req, res) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (req.headers["x-share-guest"] === "1" && user.role !== "admin") {
        res.status(403).json({ error: "\u5206\u4EAB\u67E5\u770B\u6A21\u5F0F\u4E0B\u4E0D\u652F\u6301\u53D1\u8D77\u65B0\u5206\u6790" });
        return;
      }
      const companyId = req.companyId || user.companyId || null;
      let dailyRemaining = Number.MAX_SAFE_INTEGER;
      const text2 = req.body.text || "";
      const uploadedFiles = req.files || [];
      const db = await getDb();
      const createdReports = [];
      if (uploadedFiles.length === 0 && text2.trim()) {
        const reportId = nanoid2(12);
        let extractedInfo = null;
        extractedInfo = await extractJobInfoViaAI(text2, { companyId, userId: user.id, phone: user.phone || void 0 });
        const jobTitle = extractedInfo?.jobTitle || "";
        const company = FIXED_COMPANY_NAME;
        const industry = FIXED_INDUSTRY;
        const composedInputText = `\u516C\u53F8\u540D\u79F0\uFF1A${FIXED_COMPANY_NAME}
\u6240\u5C5E\u884C\u4E1A\uFF1A${FIXED_INDUSTRY}
\u516C\u53F8\u7B80\u4ECB\uFF1A${FIXED_COMPANY_PROFILE}

${text2}`;
        const fixedExtractedInfo = { ...extractedInfo || {}, company, industry, companyProfile: FIXED_COMPANY_PROFILE };
        if (db) {
          await db.insert(reports).values({
            reportId,
            userId: user.id,
            companyId,
            jobTitle: jobTitle || null,
            company: company || null,
            industry: industry || null,
            inputText: composedInputText,
            extractedInfo: fixedExtractedInfo,
            status: "analyzing"
          });
        }
        const input = {
          jobTitle,
          company,
          industry,
          inputText: composedInputText,
          fileContents: []
        };
        startAnalysis(reportId, input, { companyId, userId: user.id, phone: user.phone || void 0 });
        res.json({
          needsConfirmation: false,
          reportId,
          reportIds: [reportId],
          filenames: [null]
        });
        return;
      } else {
        const expandedFiles = [];
        for (const file of uploadedFiles) {
          try {
            const raw = Buffer.from(file.originalname, "latin1");
            const decoded = raw.toString("utf8");
            if (!decoded.includes("\uFFFD")) {
              file.originalname = decoded;
            }
          } catch {
          }
          const ext = file.originalname.toLowerCase().split(".").pop() || "";
          if (ext === "zip" || file.mimetype === "application/zip" || file.mimetype === "application/x-zip-compressed") {
            console.log(`[Submit] Expanding ZIP file: ${file.originalname}`);
            try {
              const zip = new AdmZip(file.buffer);
              const entries = zip.getEntries();
              let subFileCount = 0;
              for (const entry of entries) {
                if (entry.isDirectory) continue;
                const entryName = decodeZipEntryName(entry);
                if (entryName.startsWith("__MACOSX/") || entryName.startsWith(".")) continue;
                const entryExt = entryName.toLowerCase().split(".").pop() || "";
                if (["txt", "docx", "doc", "pdf"].includes(entryExt)) {
                  const entryBuffer = entry.getData();
                  const baseName = entryName.split("/").pop() || entryName;
                  const entryMime = entryExt === "txt" ? "text/plain" : entryExt === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : entryExt === "doc" ? "application/msword" : "application/pdf";
                  expandedFiles.push({
                    buffer: entryBuffer,
                    originalname: baseName,
                    mimetype: entryMime,
                    size: entryBuffer.length
                  });
                  subFileCount++;
                  console.log(`[Submit] ZIP sub-file: ${baseName} (${entryExt}, ${entryBuffer.length} bytes)`);
                }
              }
              console.log(`[Submit] ZIP expanded: ${subFileCount} supported files found in ${file.originalname}`);
              if (subFileCount === 0) {
                expandedFiles.push({
                  buffer: file.buffer,
                  originalname: file.originalname,
                  mimetype: file.mimetype,
                  size: file.size
                });
              }
            } catch (zipErr) {
              console.error(`[Submit] Failed to expand ZIP ${file.originalname}:`, zipErr);
              expandedFiles.push({
                buffer: file.buffer,
                originalname: file.originalname,
                mimetype: file.mimetype,
                size: file.size
              });
            }
          } else {
            expandedFiles.push({
              buffer: file.buffer,
              originalname: file.originalname,
              mimetype: file.mimetype,
              size: file.size
            });
          }
        }
        console.log(`[Submit] Total files to process after expansion: ${expandedFiles.length}`);
        const selectedFilesParam = req.body.selectedFiles;
        let selectedFilesList = null;
        if (selectedFilesParam) {
          try {
            selectedFilesList = JSON.parse(selectedFilesParam);
          } catch {
            selectedFilesList = selectedFilesParam.split(",").map((s) => s.trim()).filter(Boolean);
          }
        }
        if (selectedFilesList && selectedFilesList.length > 0) {
          const filtered = expandedFiles.filter((f) => selectedFilesList.includes(f.originalname));
          if (filtered.length > 0) {
            expandedFiles.length = 0;
            expandedFiles.push(...filtered);
          }
          console.log(`[Submit] Filtered by selectedFiles: ${expandedFiles.length} files`);
        }
        if (expandedFiles.length > dailyRemaining) {
          res.status(422).json({
            error: "quota_exceeded_select",
            message: `\u6587\u4EF6\u6570\u91CF\uFF08${expandedFiles.length}\u4E2A\uFF09\u8D85\u8FC7\u4ECA\u65E5\u5269\u4F59\u914D\u989D\uFF08${dailyRemaining}\u6B21\uFF09\uFF0C\u8BF7\u9009\u62E9\u8981\u5206\u6790\u7684\u6587\u4EF6`,
            remaining: dailyRemaining,
            totalFiles: expandedFiles.length,
            files: expandedFiles.map((f) => ({
              filename: f.originalname,
              size: f.size,
              mimetype: f.mimetype
            }))
          });
          return;
        }
        for (const file of expandedFiles) {
          try {
            console.log(`[Submit] Extracting text from file: ${file.originalname}, mime: ${file.mimetype}, size: ${file.buffer?.length || 0}`);
            const extracted = await extractTextFromBuffer(file.buffer, file.originalname, file.mimetype);
            console.log(`[Submit] Extracted text length: ${extracted?.length || 0}, preview: ${extracted?.slice(0, 200) || "(empty)"}`);
            const jobSections = splitExtractedJobSections(extracted || "", file.originalname);
            if (jobSections.length > 1) {
              console.log(`[Submit] Split ${file.originalname} into ${jobSections.length} job sections: ${jobSections.map((s) => s.originalname).join(", ")}`);
            }
            for (const section of jobSections) {
              const reportId = nanoid2(12);
              const sectionText = section.extractedText;
              let fileKey = "";
              let fileUrl = "";
              try {
                const pathPrefix = companyId ? `${companyId}/${user.id}` : `${user.id}`;
                fileKey = `${pathPrefix}/uploads/${reportId}/${section.originalname}`;
                const { url } = await storagePut(fileKey, file.buffer, file.mimetype);
                fileUrl = url;
              } catch (storageErr) {
                console.warn(`[Submit] S3 upload failed for ${section.originalname}, continuing without storage:`, storageErr.message);
              }
              try {
                if (db) {
                  await db.insert(files).values({
                    reportId,
                    userId: user.id,
                    companyId,
                    filename: section.originalname,
                    mimeType: file.mimetype,
                    fileKey: fileKey || `local/${reportId}/${section.originalname}`,
                    url: fileUrl || "",
                    // url is NOT NULL in schema, use empty string
                    extractedText: sectionText || null,
                    fileSize: file.size
                  });
                }
              } catch (dbErr) {
                console.warn(`[Submit] Failed to save file record for ${section.originalname}, continuing:`, dbErr?.message || dbErr);
                if (dbErr?.cause) {
                  console.warn(`[Submit] File record DB cause for ${section.originalname}:`, dbErr.cause);
                }
              }
              const allContent = [sectionText, text2].filter(Boolean).join("\n\n");
              console.log(`[Submit] allContent length: ${allContent.length}, will call AI: ${!!allContent.trim()}`);
              let extractedInfo = null;
              if (allContent.trim()) {
                extractedInfo = await extractJobInfoViaAI(allContent, { companyId, userId: user.id, phone: user.phone || void 0 });
                console.log(`[Submit] AI extractedInfo:`, JSON.stringify(extractedInfo));
              } else {
                console.log(`[Submit] allContent is empty, skipping AI extraction`);
              }
              const reportInputText = sectionText && sectionText.trim() && !sectionText.startsWith("[") ? sectionText.slice(0, 1e4) : text2;
              if (db) {
                await db.insert(reports).values({
                  reportId,
                  userId: user.id,
                  companyId,
                  jobTitle: extractedInfo?.jobTitle || null,
                  company: extractedInfo?.company || null,
                  industry: extractedInfo?.industry || null,
                  inputText: reportInputText,
                  extractedInfo: { ...extractedInfo, filename: section.originalname, sourceFilename: file.originalname },
                  status: "pending"
                });
              }
              createdReports.push({ reportId, filename: section.originalname });
            }
          } catch (fileError) {
            const reportId = nanoid2(12);
            console.error(`[Submit] File processing error for ${file.originalname}:`, fileError);
            if (db) {
              await db.insert(reports).values({
                reportId,
                userId: user.id,
                companyId,
                jobTitle: null,
                company: null,
                industry: null,
                inputText: text2,
                extractedInfo: { jobTitle: "", company: "", industry: "", department: "", responsibilities: "", filename: file.originalname, parseError: fileError.message },
                status: "pending"
              });
            }
            createdReports.push({ reportId, filename: file.originalname });
          }
        }
      }
      res.json({
        needsConfirmation: true,
        reportIds: createdReports.map((r) => r.reportId),
        filenames: createdReports.map((r) => r.filename),
        // Backward compatibility: first report
        reportId: createdReports[0]?.reportId,
        extractedInfo: null
        // Will be fetched per-report via /info endpoint
      });
    } catch (error) {
      console.error("Submit error:", error?.message || error, error?.stack);
      res.status(500).json({ error: "Internal server error", detail: error?.message || "Unknown error" });
    }
  });
  app.post("/api/analysis/confirm", async (req, res) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { reportId, jobTitle, department, responsibilities, teamSize, currentTools, painPoints, budget, salaryRange } = req.body;
      const company = FIXED_COMPANY_NAME;
      const industry = FIXED_INDUSTRY;
      if (!reportId) {
        res.status(400).json({ error: "reportId is required" });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }
      const existing = await db.select().from(reports).where(eq5(reports.reportId, reportId)).limit(1);
      if (existing.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      if (existing[0].userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      const reportFiles = await db.select().from(files).where(eq5(files.reportId, reportId));
      const fileContents = reportFiles.map((f) => f.extractedText).filter(Boolean);
      const inputText = [
        jobTitle ? `\u5C97\u4F4D\u540D\u79F0\uFF1A${jobTitle}` : "",
        `\u516C\u53F8\uFF1A${company}`,
        `\u884C\u4E1A\uFF1A${industry}`,
        `\u516C\u53F8\u7B80\u4ECB\uFF1A${FIXED_COMPANY_PROFILE}`,
        department ? `\u90E8\u95E8\uFF1A${department}` : "",
        responsibilities ? `\u804C\u8D23\u63CF\u8FF0\uFF1A${responsibilities}` : "",
        teamSize ? `\u56E2\u961F\u89C4\u6A21\uFF1A${teamSize}` : "",
        currentTools ? `\u5F53\u524D\u4F7F\u7528\u5DE5\u5177/\u7CFB\u7EDF\uFF1A${currentTools}` : "",
        painPoints ? `\u5F53\u524D\u5DE5\u4F5C\u75DB\u70B9\uFF1A${painPoints}` : "",
        salaryRange ? `\u5C97\u4F4D\u85AA\u8D44\u8303\u56F4\uFF1A${salaryRange}` : "",
        budget ? `AI\u8F6C\u578B\u9884\u7B97\uFF1A${budget}` : ""
      ].filter(Boolean).join("\n");
      const input = {
        jobTitle: jobTitle || "",
        company: company || "",
        industry: industry || "",
        inputText,
        fileContents,
        // 新增结构化字段（可选）
        teamSize: teamSize || void 0,
        currentTools: currentTools || void 0,
        painPoints: painPoints || void 0,
        budget: budget || void 0,
        salaryRange: salaryRange || void 0
      };
      await db.update(reports).set({
        status: "analyzing",
        jobTitle: jobTitle || null,
        company: company || null,
        industry: industry || null,
        inputText,
        extractedInfo: { jobTitle, company, industry, companyProfile: FIXED_COMPANY_PROFILE, department, responsibilities, teamSize, currentTools, painPoints, budget, salaryRange }
      }).where(eq5(reports.reportId, reportId));
      const companyId = user.companyId || void 0;
      startAnalysis(reportId, input, { companyId, userId: user.id, phone: user.phone || void 0 });
      res.json({ reportId });
    } catch (error) {
      console.error("Confirm error:", error);
      res.status(500).json({ error: "Internal server error", detail: error?.message || String(error) });
    }
  });
  app.get("/api/analysis/:id/info", async (req, res) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const reportId = req.params.id;
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }
      const result = await db.select().from(reports).where(eq5(reports.reportId, reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      const report = result[0];
      if (report.userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      let filename = report.extractedInfo?.filename || null;
      if (!filename) {
        const fileRecords = await db.select({ filename: files.filename }).from(files).where(eq5(files.reportId, reportId)).limit(1);
        filename = fileRecords[0]?.filename || null;
      }
      res.json({
        reportId: report.reportId,
        status: report.status,
        extractedInfo: report.extractedInfo,
        jobTitle: report.jobTitle,
        company: report.company,
        industry: report.industry,
        inputText: report.inputText,
        filename,
        createdAt: report.createdAt
      });
    } catch (error) {
      console.error("Get info error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.delete("/api/analysis/:id", async (req, res) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const reportId = req.params.id;
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }
      const result = await db.select().from(reports).where(eq5(reports.reportId, reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      if (result[0].userId !== user.id) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      try {
        await db.delete(reportFeedback).where(eq5(reportFeedback.reportId, reportId));
      } catch (e) {
        console.warn("delete reportFeedback failed:", e);
      }
      try {
        await db.delete(reportDistributions).where(eq5(reportDistributions.reportId, reportId));
      } catch (e) {
        console.warn("delete reportDistributions failed:", e);
      }
      try {
        await db.delete(files).where(eq5(files.reportId, reportId));
      } catch (e) {
        console.warn("delete files failed:", e);
      }
      await db.delete(reports).where(eq5(reports.reportId, reportId));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Internal server error", detail: error?.message || String(error) });
    }
  });
  app.get("/api/analysis/:id/progress", (req, res) => {
    const reportId = req.params.id;
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    res.write(`data: ${JSON.stringify({ type: "connected", reportId })}

`);
    const heartbeat = setInterval(() => {
      try {
        res.write(`: keepalive

`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 15e3);
    if (!sseConnections.has(reportId)) {
      sseConnections.set(reportId, []);
    }
    sseConnections.get(reportId).push(res);
    checkExistingStatus(reportId, res);
    req.on("close", () => {
      clearInterval(heartbeat);
      const connections = sseConnections.get(reportId);
      if (connections) {
        const idx = connections.indexOf(res);
        if (idx > -1) connections.splice(idx, 1);
        if (connections.length === 0) sseConnections.delete(reportId);
      }
    });
  });
  app.get("/api/analysis/:id/status", async (req, res) => {
    const reportId = req.params.id;
    const db = await getDb();
    if (!db) {
      res.status(500).json({ error: "Database unavailable" });
      return;
    }
    const result = await db.select({
      status: reports.status,
      currentStep: reports.currentStep
    }).from(reports).where(eq5(reports.reportId, reportId)).limit(1);
    if (result.length === 0) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    res.json({ status: result[0].status, currentStep: result[0].currentStep });
  });
  app.get("/api/analysis/quota", async (req, res) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      res.json({ limit: DAILY_ANALYSIS_LIMIT, used: 0, remaining: DAILY_ANALYSIS_LIMIT, unlimited: true });
      return;
    } catch (error) {
      console.error("[Quota] Error:", error);
      res.status(500).json({ error: "Failed to get quota" });
    }
  });
  app.post("/api/report/:id/regenerate-training", async (req, res) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const reportId = req.params.id;
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }
      const result = await db.select().from(reports).where(eq5(reports.reportId, reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      const report = result[0];
      if (report.status !== "completed") {
        res.status(400).json({ error: "Report is not completed yet" });
        return;
      }
      const reportData = report.reportData;
      if (!Array.isArray(reportData)) {
        res.status(400).json({ error: "Invalid report data format" });
        return;
      }
      const step9 = STEP_DEFINITIONS.find((s) => s.id === 9);
      if (!step9) {
        res.status(500).json({ error: "Step 9 definition not found" });
        return;
      }
      const previousResults = reportData.filter((r) => r.step <= 8).map((r) => ({
        step: r.step,
        title: r.title,
        data: r.data
      }));
      const overview = reportData.find((r) => r.step === 1)?.data;
      const input = {
        jobTitle: overview?.jobTitle || "",
        company: overview?.company || "",
        industry: overview?.industry || "",
        level: overview?.level || "",
        responsibilities: overview?.coreResponsibilities?.join("\n") || ""
      };
      const userPrompt = step9.prompt(input, previousResults);
      const schemaInstruction = `

\u3010\u8F93\u51FA\u683C\u5F0F\u8981\u6C42\u3011\u8BF7\u4E25\u683C\u6309\u7167\u4EE5\u4E0BJSON\u7ED3\u6784\u8F93\u51FA\uFF0C\u4E0D\u8981\u8F93\u51FA\u4EFB\u4F55\u5176\u4ED6\u5185\u5BB9\uFF1A
${JSON.stringify(step9.schema.schema, null, 2)}`;
      const llmContext = {
        companyId: req.companyId || user.companyId || void 0,
        userId: user.id,
        feature: "job_analysis_retry_step9"
      };
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u7684\u5C97\u4F4DAI\u8F6C\u578B\u4E13\u5BB6\uFF0C\u62E5\u670920\u5E74\u4F01\u4E1A\u7BA1\u7406\u54A8\u8BE2\u7ECF\u9A8C\u548C\u6DF1\u539A\u7684AI\u6280\u672F\u80CC\u666F\u3002\u8BF7\u57FA\u4E8E\u5206\u6790\u7ED3\u679C\u751F\u6210\u8F6C\u578B\u80FD\u529B\u57F9\u8BAD\u8BC4\u4F30\u3002" },
          { role: "user", content: userPrompt + schemaInstruction }
        ],
        response_format: { type: "json_object" }
      }, llmContext);
      const content = response.choices[0]?.message?.content;
      let parsed;
      if (typeof content === "string") {
        let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, "");
        const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, cleaned];
        const jsonStr = jsonMatch[1]?.trim() || cleaned.trim();
        parsed = JSON.parse(jsonStr);
      } else {
        parsed = content;
      }
      parsed = sanitizeStepData(9, parsed);
      const existingStep9Idx = reportData.findIndex((r) => r.step === 9);
      const step9Result = { step: 9, title: "\u8F6C\u578B\u80FD\u529B\u57F9\u8BAD\u8BC4\u4F30", data: parsed };
      if (existingStep9Idx >= 0) {
        reportData[existingStep9Idx] = step9Result;
      } else {
        reportData.push(step9Result);
      }
      await db.update(reports).set({ reportData, currentStep: 9 }).where(eq5(reports.reportId, reportId));
      res.json({ success: true, training: parsed });
    } catch (error) {
      console.error("[Regenerate Training] Error:", error);
      res.status(500).json({ error: "\u57F9\u8BAD\u8BC4\u4F30\u91CD\u65B0\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", details: error.message });
    }
  });
  app.post("/api/report/:id/retry-step", async (req, res) => {
    try {
      const user = await resolveUser(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const reportId = req.params.id;
      const { stepId } = req.body;
      if (!stepId || stepId < 1 || stepId > 9) {
        res.status(400).json({ error: "stepId must be between 1 and 9" });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "Database unavailable" });
        return;
      }
      const result = await db.select().from(reports).where(eq5(reports.reportId, reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      const report = result[0];
      if (report.status !== "completed") {
        res.status(400).json({ error: "Report is not completed yet" });
        return;
      }
      const reportData = report.reportData;
      if (!Array.isArray(reportData)) {
        res.status(400).json({ error: "Invalid report data format" });
        return;
      }
      const stepDef = STEP_DEFINITIONS.find((s) => s.id === stepId);
      if (!stepDef) {
        res.status(400).json({ error: `Step ${stepId} definition not found` });
        return;
      }
      const analysisInput = {
        jobTitle: report.jobTitle || "",
        company: report.company || "",
        industry: report.industry || "",
        inputText: report.inputText || "",
        responsibilities: "",
        fileContents: []
      };
      const previousResults = reportData.filter((r) => r.step < stepId).sort((a, b) => a.step - b.step).map((r) => ({ step: r.step, title: r.title || "", data: r.data }));
      const userPrompt = stepDef.prompt(analysisInput, previousResults);
      const schemaInstruction = `

\u3010\u8F93\u51FA\u683C\u5F0F\u8981\u6C42\u3011\u8BF7\u4E25\u683C\u6309\u7167\u4EE5\u4E0BJSON\u7ED3\u6784\u8F93\u51FA\uFF0C\u4E0D\u8981\u8F93\u51FA\u4EFB\u4F55\u5176\u4ED6\u5185\u5BB9\uFF1A
${JSON.stringify(stepDef.schema.schema, null, 2)}`;
      const llmContext = {
        companyId: req.companyId || user.companyId || void 0,
        userId: user.id,
        feature: `job_analysis_retry_step${stepId}`
      };
      const response = await invokeLLM({
        messages: [
          { role: "system", content: "\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u7684\u5C97\u4F4DAI\u8F6C\u578B\u4E13\u5BB6\uFF0C\u62E5\u670920\u5E74\u4F01\u4E1A\u7BA1\u7406\u54A8\u8BE2\u7ECF\u9A8C\u548C\u6DF1\u539A\u7684AI\u6280\u672F\u80CC\u666F\u3002\n\u4F60\u7684\u5206\u6790\u98CE\u683C\uFF1A\u6570\u636E\u9A71\u52A8\u3001\u903B\u8F91\u4E25\u5BC6\u3001\u6D1E\u5BDF\u6DF1\u523B\u3001\u5EFA\u8BAE\u53EF\u843D\u5730\u3002\n\u4F60\u5FC5\u987B\u4E25\u683C\u6309\u7167\u6307\u5B9A\u7684JSON Schema\u683C\u5F0F\u8F93\u51FA\u7ED3\u6784\u5316\u6570\u636E\u3002" },
          { role: "user", content: userPrompt + schemaInstruction }
        ],
        response_format: { type: "json_object" }
      }, llmContext);
      const content = response.choices[0]?.message?.content;
      let parsed;
      if (typeof content === "string") {
        let cleaned = content.replace(/<think>[\s\S]*?<\/think>/gi, "");
        const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, cleaned];
        const jsonStr = jsonMatch[1]?.trim() || cleaned.trim();
        parsed = JSON.parse(jsonStr);
      } else {
        parsed = content;
      }
      parsed = sanitizeStepData(stepId, parsed);
      const stepIdx = reportData.findIndex((r) => r.step === stepId);
      if (stepIdx >= 0) {
        reportData[stepIdx].data = parsed;
      } else {
        reportData.push({ step: stepId, title: stepDef.title, data: parsed });
        reportData.sort((a, b) => a.step - b.step);
      }
      await db.update(reports).set({ reportData }).where(eq5(reports.reportId, reportId));
      res.json({ success: true, stepId, data: parsed });
    } catch (error) {
      console.error("[Retry Step] Error:", error);
      res.status(500).json({ error: "\u6B65\u9AA4\u91CD\u65B0\u5206\u6790\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5", details: error.message });
    }
  });
}
async function checkExistingStatus(reportId, res) {
  const db = await getDb();
  if (!db) return;
  const result = await db.select().from(reports).where(eq5(reports.reportId, reportId)).limit(1);
  if (result.length > 0 && result[0].status === "completed") {
    res.write(`data: ${JSON.stringify({ type: "completed" })}

`);
  }
}
function broadcastProgress(reportId, data) {
  const connections = sseConnections.get(reportId);
  if (!connections) return;
  const message = `data: ${JSON.stringify(data)}

`;
  connections.forEach((res) => {
    try {
      res.write(message);
    } catch (e) {
    }
  });
}
async function extractTextFromBuffer(buffer, filename, mimeType) {
  const ext = filename.toLowerCase().split(".").pop() || "";
  console.log(`[extractText] filename=${filename}, ext=${ext}, mimeType=${mimeType}, bufferLen=${buffer?.length || 0}`);
  if (!buffer || buffer.length === 0) {
    console.warn(`[extractText] Empty buffer for ${filename}`);
    return `[\u6587\u4EF6: ${filename}, \u6587\u4EF6\u5185\u5BB9\u4E3A\u7A7A]`;
  }
  try {
    if (mimeType === "text/plain" || ext === "txt") {
      let text2 = buffer.toString("utf-8");
      if (text2.charCodeAt(0) === 65279) {
        text2 = text2.slice(1);
      }
      console.log(`[extractText] TXT extracted, length: ${text2.length}`);
      return text2;
    }
    if (ext === "docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      console.log(`[extractText] Using mammoth for .docx`);
      const result = await mammoth.extractRawText({ buffer });
      console.log(`[extractText] mammoth result length: ${result.value?.length || 0}`);
      return result.value || "";
    }
    if (ext === "doc" || mimeType === "application/msword") {
      console.log(`[extractText] Processing .doc file: ${filename}, size: ${buffer.length}`);
      try {
        const WordExtractor = require2("word-extractor");
        const extractor = new WordExtractor();
        const doc = await extractor.extract(buffer);
        const body = doc.getBody();
        if (body && body.trim() && body.trim().length > 20) {
          console.log(`[extractText] word-extractor OK, length: ${body.trim().length}`);
          return body.trim();
        } else {
          console.warn(`[extractText] word-extractor returned empty/short text (${body?.trim()?.length || 0} chars)`);
        }
      } catch (weErr) {
        console.warn(`[extractText] word-extractor failed:`, weErr.message);
      }
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "doc-convert-"));
      const profileDir = path.join(tmpDir, "lo-profile");
      fs.mkdirSync(profileDir, { recursive: true });
      const tmpFile = path.join(tmpDir, `input.doc`);
      fs.writeFileSync(tmpFile, buffer);
      let loAvailable = false;
      try {
        const loWhich = execSync("which libreoffice 2>/dev/null || which soffice 2>/dev/null", { timeout: 5e3, stdio: "pipe" }).toString().trim();
        loAvailable = !!loWhich;
        console.log(`[extractText] libreoffice found at: ${loWhich}`);
      } catch {
        console.warn(`[extractText] libreoffice/soffice NOT found in PATH`);
      }
      const runLO = (format) => {
        if (!loAvailable) return null;
        try {
          const profileUri = `file://${profileDir}`;
          const loCmd = `libreoffice --headless --norestore --nolockcheck "-env:UserInstallation=${profileUri}" --convert-to ${format} --outdir "${tmpDir}" "${tmpFile}"`;
          console.log(`[extractText] Running: ${loCmd}`);
          const loResult = execSync(loCmd, {
            timeout: 9e4,
            stdio: "pipe",
            env: { ...process.env, HOME: tmpDir }
          });
          const stdout = loResult.toString().trim();
          console.log(`[extractText] libreoffice stdout: ${stdout}`);
          const allFiles = fs.readdirSync(tmpDir);
          console.log(`[extractText] Files after conversion: ${allFiles.join(", ")}`);
          return stdout;
        } catch (err) {
          const stderr = err?.stderr?.toString?.() || "";
          const stdout = err?.stdout?.toString?.() || "";
          console.warn(`[extractText] libreoffice --convert-to ${format} failed (exit code: ${err?.status}): ${stderr || stdout || err?.message}`);
          return null;
        }
      };
      try {
        try {
          runLO("docx");
          const docxFile = fs.readdirSync(tmpDir).find((f) => f.endsWith(".docx"));
          if (docxFile) {
            const docxBuffer = fs.readFileSync(path.join(tmpDir, docxFile));
            const result = await mammoth.extractRawText({ buffer: docxBuffer });
            if (result.value && result.value.trim()) {
              console.log(`[extractText] .doc\u2192.docx\u2192mammoth OK, length: ${result.value.length}`);
              return result.value;
            }
          }
        } catch (e) {
          console.warn(`[extractText] Strategy 1 (.doc\u2192.docx\u2192mammoth) failed:`, e.message);
        }
        try {
          fs.readdirSync(tmpDir).filter((f) => f.endsWith(".txt")).forEach((f) => fs.unlinkSync(path.join(tmpDir, f)));
          runLO('txt:"Text (encoded):UTF8"');
          const txtFile = fs.readdirSync(tmpDir).find((f) => f.endsWith(".txt"));
          if (txtFile) {
            const raw = fs.readFileSync(path.join(tmpDir, txtFile), "utf-8");
            const cleanText = raw.charCodeAt(0) === 65279 ? raw.slice(1) : raw;
            if (cleanText.trim()) {
              console.log(`[extractText] .doc\u2192txt OK, length: ${cleanText.length}`);
              return cleanText;
            }
          }
        } catch (e) {
          console.warn(`[extractText] Strategy 2 (.doc\u2192txt) failed:`, e.message);
        }
        try {
          const awResult = execSync(`antiword "${tmpFile}"`, { timeout: 3e4, stdio: "pipe" });
          const text2 = awResult.toString("utf-8").trim();
          if (text2 && text2.length > 50) {
            console.log(`[extractText] antiword OK, length: ${text2.length}`);
            return text2;
          }
        } catch (e) {
          console.warn(`[extractText] antiword not available or failed`);
        }
        try {
          const cdResult = execSync(`catdoc "${tmpFile}"`, { timeout: 3e4, stdio: "pipe" });
          const text2 = cdResult.toString("utf-8").trim();
          if (text2 && text2.length > 50) {
            console.log(`[extractText] catdoc OK, length: ${text2.length}`);
            return text2;
          }
        } catch (e) {
          console.warn(`[extractText] catdoc not available or failed`);
        }
        try {
          const result = await mammoth.extractRawText({ buffer });
          if (result.value && result.value.trim()) {
            console.log(`[extractText] mammoth direct .doc OK, length: ${result.value.length}`);
            return result.value;
          }
        } catch (mammothErr) {
          console.warn(`[extractText] mammoth direct .doc failed:`, mammothErr.message);
        }
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {
        }
      }
      console.error(`[extractText] ALL strategies failed for .doc file: ${filename} (${buffer.length} bytes). libreoffice available: ${loAvailable}`);
      return `[\u6587\u4EF6: ${filename}, .doc\u683C\u5F0F\u8F6C\u6362\u5931\u8D25\uFF0C\u8BF7\u8F6C\u6362\u4E3A.docx\u540E\u91CD\u65B0\u4E0A\u4F20]`;
    }
    if (ext === "pdf" || mimeType === "application/pdf") {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-extract-"));
      const tmpPdf = path.join(tmpDir, "input.pdf");
      const tmpTxt = path.join(tmpDir, "output.txt");
      fs.writeFileSync(tmpPdf, buffer);
      try {
        try {
          execSync(`pdftotext -layout "${tmpPdf}" "${tmpTxt}"`, {
            timeout: 3e4,
            stdio: "pipe"
          });
          if (fs.existsSync(tmpTxt)) {
            const text2 = fs.readFileSync(tmpTxt, "utf-8");
            if (text2.trim()) {
              console.log(`[extractText] PDF extracted via pdftotext, length: ${text2.length}`);
              return text2;
            }
          }
        } catch (ptErr) {
          console.warn(`[extractText] pdftotext failed for ${filename}:`, ptErr.message);
        }
        try {
          const { PDFParse } = require2("pdf-parse");
          const parser = new PDFParse({ data: new Uint8Array(buffer) });
          try {
            const result = await parser.getText();
            const text2 = result?.text || result?.pages?.map((p) => p.text || "").join("\n") || "";
            if (text2.trim()) {
              console.log(`[extractText] PDF extracted via pdf-parse v2, length: ${text2.length}`);
              return text2;
            }
          } finally {
            await parser.destroy?.();
          }
        } catch (ppErr) {
          console.warn(`[extractText] pdf-parse v2 failed for ${filename}:`, ppErr.message);
        }
      } finally {
        try {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        } catch {
        }
      }
      return `[\u6587\u4EF6: ${filename}, PDF\u89E3\u6790\u5931\u8D25]`;
    }
    if (ext === "zip" || mimeType === "application/zip") {
      const zip = new AdmZip(buffer);
      const entries = zip.getEntries();
      const results = [];
      for (const entry of entries) {
        if (entry.isDirectory) continue;
        const entryName = decodeZipEntryName(entry);
        const entryExt = entryName.toLowerCase().split(".").pop() || "";
        if (["txt", "docx", "doc", "pdf"].includes(entryExt)) {
          try {
            const entryBuffer = entry.getData();
            const entryMime = entryExt === "txt" ? "text/plain" : entryExt === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : entryExt === "doc" ? "application/msword" : "application/pdf";
            const text2 = await extractTextFromBuffer(entryBuffer, entryName, entryMime);
            if (text2.trim()) {
              results.push(`--- ${entryName} ---
${text2}`);
            }
          } catch (e) {
            console.error(`Failed to extract ${entryName} from zip:`, e);
            results.push(`[ZIP\u5185\u6587\u4EF6: ${entryName}, \u5904\u7406\u5931\u8D25]`);
          }
        }
      }
      return results.length > 0 ? results.join("\n\n") : `[ZIP\u6587\u4EF6: ${filename}, \u672A\u627E\u5230\u53EF\u89E3\u6790\u7684\u6587\u6863]`;
    }
    return `[\u4E0D\u652F\u6301\u7684\u6587\u4EF6\u7C7B\u578B: ${filename}]`;
  } catch (error) {
    console.error(`[extractText] FAILED for ${filename}:`, error);
    return `[\u6587\u4EF6: ${filename}, \u89E3\u6790\u5931\u8D25: ${error.message}]`;
  }
}
async function extractJobInfoViaAI(content, context) {
  if (!content || !content.trim()) {
    console.warn("[extractJobInfoViaAI] Empty content, skipping");
    return null;
  }
  console.log(`[extractJobInfoViaAI] Content length: ${content.length}, preview: ${content.slice(0, 300)}`);
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `\u4F60\u662F\u4E00\u4E2A\u5C97\u4F4D\u4FE1\u606F\u63D0\u53D6\u4E13\u5BB6\u3002\u8BF7\u4ECE\u7528\u6237\u63D0\u4F9B\u7684\u5C97\u4F4D\u8BF4\u660E\u4E66/\u5C97\u4F4D\u63CF\u8FF0\u6587\u6863\u4E2D\u63D0\u53D6\u4EE5\u4E0B\u7ED3\u6784\u5316\u4FE1\u606F\uFF1A

1. jobTitle: \u5C97\u4F4D\u540D\u79F0\uFF08\u901A\u5E38\u5728\u6587\u6863\u6807\u9898\u6216\u5F00\u5934\u4F4D\u7F6E\uFF09
2. company: \u516C\u53F8\u540D\u79F0\uFF08\u5982\u679C\u6587\u6863\u4E2D\u6CA1\u6709\u660E\u786E\u63D0\u53CA\uFF0C\u8FD4\u56DE\u7A7A\u5B57\u7B26\u4E32\uFF09
3. industry: \u6240\u5C5E\u884C\u4E1A\uFF08\u6839\u636E\u5C97\u4F4D\u5185\u5BB9\u63A8\u65AD\uFF0C\u5982IT/\u79D1\u6280\u3001\u91D1\u878D\u3001\u5236\u9020\u4E1A\u7B49\uFF09
4. department: \u6240\u5C5E\u90E8\u95E8\uFF08\u5982\u201C\u9686\u5C5E\u90E8\u95E8\u201D\u5B57\u6BB5\uFF0C\u6216\u4ECE\u4E0A\u4E0B\u6587\u63A8\u65AD\uFF09
5. responsibilities: \u6838\u5FC3\u804C\u8D23\u63CF\u8FF0\uFF08\u63D0\u53D6\u6587\u6863\u4E2D\u201C\u5DE5\u4F5C\u804C\u8D23\u4E0E\u4EFB\u52A1\u201D\u3001\u201C\u5C97\u4F4D\u4F7F\u547D\u201D\u3001\u201C\u804C\u8D23\u201D\u7B49\u90E8\u5206\u7684\u5173\u952E\u5185\u5BB9\uFF0C\u7528\u7B80\u6D01\u7684\u6587\u5B57\u6982\u62EC\uFF0C\u4E0D\u8D85\u8FC7500\u5B57\uFF09

\u91CD\u8981\u63D0\u793A\uFF1A
- \u6587\u6863\u53EF\u80FD\u662F\u5C97\u4F4D\u8BF4\u660E\u4E66\u683C\u5F0F\uFF0C\u5305\u542B\u5C97\u4F4D\u4EE3\u7801\u3001\u5C97\u4F4D\u7F16\u5236\u3001\u76F4\u63A5\u4E0A\u7EA7\u3001\u76F4\u63A5\u4E0B\u7EA7\u7B49\u5B57\u6BB5
- \u201C\u9686\u5C5E\u90E8\u95E8\u201D\u5B57\u6BB5\u5BF9\u5E94department
- \u201C\u5C97\u4F4D\u4F7F\u547D\u201D\u548C\u201C\u5DE5\u4F5C\u804C\u8D23\u4E0E\u4EFB\u52A1\u201D\u90E8\u5206\u5BF9\u5E94responsibilities
- \u8BF7\u786E\u4FDD\u63D0\u53D6responsibilities\u5B57\u6BB5\u65F6\u5305\u542B\u5177\u4F53\u7684\u804C\u8D23\u5185\u5BB9\uFF0C\u800C\u4E0D\u662F\u7A7A\u5B57\u7B26\u4E32
- \u8BF7\u4E25\u683C\u6309\u7167JSON\u683C\u5F0F\u8F93\u51FA\uFF0C\u4E0D\u8981\u8F93\u51FA\u4EFB\u4F55\u5176\u4ED6\u5185\u5BB9`
        },
        {
          role: "user",
          content: `\u8BF7\u4ECE\u4EE5\u4E0B\u5C97\u4F4D\u8BF4\u660E\u4E66\u5185\u5BB9\u4E2D\u63D0\u53D6\u5C97\u4F4D\u76F8\u5173\u4FE1\u606F\uFF1A

${content.slice(0, 8e3)}`
        }
      ],
      response_format: { type: "json_object" }
    }, { ...context, feature: "job_info_extraction" });
    const resContent = response?.choices?.[0]?.message?.content;
    console.log(`[extractJobInfoViaAI] Raw response content type: ${typeof resContent}, length: ${typeof resContent === "string" ? resContent.length : 0}`);
    if (typeof resContent === "string") {
      let cleaned = resContent.replace(/<think>[\s\S]*?<\/think>/gi, "");
      const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : cleaned.trim();
      console.log(`[extractJobInfoViaAI] JSON to parse: ${jsonStr.slice(0, 500)}`);
      const parsed = JSON.parse(jsonStr);
      const result = {
        jobTitle: parsed.jobTitle || parsed.job_title || parsed["\u5C97\u4F4D\u540D\u79F0"] || "",
        company: parsed.company || parsed["\u516C\u53F8"] || parsed["\u516C\u53F8\u540D\u79F0"] || "",
        industry: parsed.industry || parsed["\u884C\u4E1A"] || parsed["\u6240\u5C5E\u884C\u4E1A"] || "",
        department: parsed.department || parsed["\u90E8\u95E8"] || parsed["\u6240\u5C5E\u90E8\u95E8"] || "",
        responsibilities: parsed.responsibilities || parsed["\u804C\u8D23"] || parsed["\u6838\u5FC3\u804C\u8D23"] || ""
      };
      console.log(`[extractJobInfoViaAI] Extracted:`, JSON.stringify(result));
      return result;
    } else if (Array.isArray(resContent)) {
      const textParts = resContent.filter((p) => p.type === "text").map((p) => p.text).join("");
      if (textParts) {
        let cleaned = textParts.replace(/<think>[\s\S]*?<\/think>/gi, "");
        const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : cleaned.trim();
        console.log(`[extractJobInfoViaAI] Array content JSON: ${jsonStr.slice(0, 500)}`);
        const parsed = JSON.parse(jsonStr);
        return {
          jobTitle: parsed.jobTitle || parsed.job_title || "",
          company: parsed.company || "",
          industry: parsed.industry || "",
          department: parsed.department || "",
          responsibilities: parsed.responsibilities || ""
        };
      }
    }
    console.warn(`[extractJobInfoViaAI] Unexpected response content:`, resContent);
    return null;
  } catch (error) {
    console.error("[extractJobInfoViaAI] Error:", error);
    return null;
  }
}
function startAnalysis(reportId, input, llmContext) {
  runAnalysisChain(input, reportId, (step, title, status) => {
    broadcastProgress(reportId, {
      type: "step_update",
      step: step - 1,
      // 0-indexed for frontend
      title,
      status
    });
  }, llmContext).then(() => {
    broadcastProgress(reportId, { type: "completed" });
  }).catch((error) => {
    console.error("Analysis chain error:", error);
    broadcastProgress(reportId, { type: "error", message: error.message });
  });
}

// server/exportRoutes.ts
init_db();
init_schema();
import { eq as eq9, inArray as inArray2 } from "drizzle-orm";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/llmModelRouter.ts
init_db();
init_schema();
import { TRPCError as TRPCError3 } from "@trpc/server";
import { and as and4, eq as eq6, desc } from "drizzle-orm";
import { z as z2 } from "zod";
init_crypto();
init_llmRouter();
var llmModelRouter = router({
  /**
   * 获取模型列表
   * 返回所有未删除的模型，API Key 脱敏显示
   */
  list: adminProcedure.input(
    z2.object({
      includeDeleted: z2.boolean().optional()
    }).optional()
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = input?.includeDeleted ? [] : [eq6(llmModels.isDeleted, 0)];
    const models = await db.select().from(llmModels).where(conditions.length > 0 ? and4(...conditions) : void 0).orderBy(llmModels.priority, desc(llmModels.createdAt));
    return models.map((model) => {
      let maskedKey = "****";
      try {
        const plainKey = decrypt(model.apiKey);
        maskedKey = maskApiKey(plainKey);
      } catch {
        maskedKey = "****\uFF08\u89E3\u5BC6\u5931\u8D25\uFF09";
      }
      return {
        ...model,
        apiKey: maskedKey
      };
    });
  }),
  /**
   * 获取单个模型详情
   */
  getById: adminProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(llmModels).where(eq6(llmModels.id, input.id)).limit(1);
    if (result.length === 0) return null;
    const model = result[0];
    let maskedKey = "****";
    try {
      const plainKey = decrypt(model.apiKey);
      maskedKey = maskApiKey(plainKey);
    } catch {
      maskedKey = "****\uFF08\u89E3\u5BC6\u5931\u8D25\uFF09";
    }
    return { ...model, apiKey: maskedKey };
  }),
  /**
   * 新增模型
   * modelCode 必须唯一，apiKey 使用 AES-256-GCM 加密存储
   */
  create: adminProcedure.input(
    z2.object({
      modelCode: z2.string().min(1).max(64),
      modelName: z2.string().min(1).max(128),
      provider: z2.string().min(1).max(64),
      apiUrl: z2.string().url().max(512),
      apiKey: z2.string().min(1).max(512),
      modelType: z2.enum(["chat", "embedding", "image", "audio"]),
      isActive: z2.number().min(0).max(1).optional().default(1),
      priority: z2.number().min(1).max(9999).optional().default(100),
      inputPrice: z2.string().optional().default("0"),
      outputPrice: z2.string().optional().default("0"),
      maxContext: z2.number().min(1).optional().default(8192),
      maxOutput: z2.number().min(1).optional().default(4096),
      remark: z2.string().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u6570\u636E\u5E93\u4E0D\u53EF\u7528" });
    const existing = await db.select({ id: llmModels.id }).from(llmModels).where(eq6(llmModels.modelCode, input.modelCode)).limit(1);
    if (existing.length > 0) {
      throw new TRPCError3({
        code: "CONFLICT",
        message: `\u6A21\u578B\u7F16\u7801 "${input.modelCode}" \u5DF2\u5B58\u5728`
      });
    }
    const encryptedKey = encrypt(input.apiKey);
    await db.insert(llmModels).values({
      modelCode: input.modelCode,
      modelName: input.modelName,
      provider: input.provider,
      apiUrl: input.apiUrl,
      apiKey: encryptedKey,
      modelType: input.modelType,
      isActive: input.isActive,
      priority: input.priority,
      inputPrice: input.inputPrice,
      outputPrice: input.outputPrice,
      maxContext: input.maxContext,
      maxOutput: input.maxOutput,
      remark: input.remark || null
    });
    invalidateModelCache();
    return { success: true };
  }),
  /**
   * 修改模型
   * 如果传入了新的 apiKey，则加密更新；否则保留原加密值
   */
  update: adminProcedure.input(
    z2.object({
      id: z2.number(),
      modelCode: z2.string().min(1).max(64).optional(),
      modelName: z2.string().min(1).max(128).optional(),
      provider: z2.string().min(1).max(64).optional(),
      apiUrl: z2.string().url().max(512).optional(),
      apiKey: z2.string().max(512).optional(),
      // 留空表示不修改
      modelType: z2.enum(["chat", "embedding", "image", "audio"]).optional(),
      isActive: z2.number().min(0).max(1).optional(),
      priority: z2.number().min(1).max(9999).optional(),
      inputPrice: z2.string().optional(),
      outputPrice: z2.string().optional(),
      maxContext: z2.number().min(1).optional(),
      maxOutput: z2.number().min(1).optional(),
      remark: z2.string().nullable().optional()
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u6570\u636E\u5E93\u4E0D\u53EF\u7528" });
    const { id, apiKey, ...updateFields } = input;
    const existing = await db.select().from(llmModels).where(eq6(llmModels.id, id)).limit(1);
    if (existing.length === 0) {
      throw new TRPCError3({ code: "NOT_FOUND", message: "\u6A21\u578B\u4E0D\u5B58\u5728" });
    }
    const updateSet = {};
    if (updateFields.modelCode !== void 0) updateSet.modelCode = updateFields.modelCode;
    if (updateFields.modelName !== void 0) updateSet.modelName = updateFields.modelName;
    if (updateFields.provider !== void 0) updateSet.provider = updateFields.provider;
    if (updateFields.apiUrl !== void 0) updateSet.apiUrl = updateFields.apiUrl;
    if (updateFields.modelType !== void 0) updateSet.modelType = updateFields.modelType;
    if (updateFields.isActive !== void 0) updateSet.isActive = updateFields.isActive;
    if (updateFields.priority !== void 0) updateSet.priority = updateFields.priority;
    if (updateFields.inputPrice !== void 0) updateSet.inputPrice = updateFields.inputPrice;
    if (updateFields.outputPrice !== void 0) updateSet.outputPrice = updateFields.outputPrice;
    if (updateFields.maxContext !== void 0) updateSet.maxContext = updateFields.maxContext;
    if (updateFields.maxOutput !== void 0) updateSet.maxOutput = updateFields.maxOutput;
    if (updateFields.remark !== void 0) updateSet.remark = updateFields.remark;
    if (apiKey && apiKey.trim().length > 0) {
      updateSet.apiKey = encrypt(apiKey);
    }
    if (Object.keys(updateSet).length === 0) {
      return { success: true, message: "\u65E0\u9700\u66F4\u65B0" };
    }
    await db.update(llmModels).set(updateSet).where(eq6(llmModels.id, id));
    invalidateModelCache();
    return { success: true };
  }),
  /**
   * 启用/停用模型
   */
  toggleStatus: adminProcedure.input(
    z2.object({
      id: z2.number(),
      modelCode: z2.string().min(1).max(64).optional(),
      isActive: z2.number().min(0).max(1)
    })
  ).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u6570\u636E\u5E93\u4E0D\u53EF\u7528" });
    await db.update(llmModels).set({ isActive: input.isActive }).where(eq6(llmModels.id, input.id));
    invalidateModelCache();
    return { success: true };
  }),
  /**
   * 测试模型连接
   * 发送一个简单的请求到模型API，验证连接是否正常
   */
  testConnection: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u6570\u636E\u5E93\u4E0D\u53EF\u7528" });
    const result = await db.select().from(llmModels).where(eq6(llmModels.id, input.id)).limit(1);
    if (result.length === 0) {
      throw new TRPCError3({ code: "NOT_FOUND", message: "\u6A21\u578B\u4E0D\u5B58\u5728" });
    }
    const model = result[0];
    const apiKey = decrypt(model.apiKey);
    const apiEndpoint = model.apiUrl.replace(/\/$/, "").endsWith("/chat/completions") ? model.apiUrl : `${model.apiUrl.replace(/\/$/, "")}/chat/completions`;
    const startTime = Date.now();
    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model.modelCode,
          messages: [{ role: "user", content: "\u4F60\u597D\uFF0C\u8BF7\u56DE\u590D\u2018OK\u2019" }],
          max_tokens: 10
        }),
        signal: AbortSignal.timeout(3e4)
      });
      const durationMs = Date.now() - startTime;
      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          durationMs,
          modelCode: model.modelCode,
          error: `HTTP ${response.status}: ${errorText.slice(0, 200)}`
        };
      }
      const data = await response.json();
      const responseModel = data?.model || model.modelCode;
      return {
        success: true,
        durationMs,
        modelCode: responseModel,
        message: `\u8FDE\u63A5\u6D4B\u8BD5\u6210\u529F\uFF0C\u8017\u65F6 ${durationMs}ms\uFF0C\u6A21\u578B: ${responseModel}`
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      return {
        success: false,
        durationMs,
        modelCode: model.modelCode,
        error: err?.message || "\u8FDE\u63A5\u8D85\u65F6\u6216\u7F51\u7EDC\u9519\u8BEF"
      };
    }
  }),
  /**
   * 删除模型（软删除）
   * 已产生调用日志的模型不得物理删除（此处预留检查钩子，子域3实现时补充）
   */
  delete: adminProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "\u6570\u636E\u5E93\u4E0D\u53EF\u7528" });
    const existing = await db.select().from(llmModels).where(eq6(llmModels.id, input.id)).limit(1);
    if (existing.length === 0) {
      throw new TRPCError3({ code: "NOT_FOUND", message: "\u6A21\u578B\u4E0D\u5B58\u5728" });
    }
    await db.update(llmModels).set({ isDeleted: 1, isActive: 0 }).where(eq6(llmModels.id, input.id));
    invalidateModelCache();
    return { success: true };
  })
});

// server/llmLogRouter.ts
init_db();
init_schema();
import { and as and5, eq as eq7, gte as gte2, lte, like as like2, desc as desc2, sql as sql4, count } from "drizzle-orm";
import { z as z3 } from "zod";
var llmLogRouter = router({
  /**
   * 高级搜索日志
   * 支持按企业、手机号、功能、模型、供应商、状态、切换、时间、Token、费用等条件过滤
   */
  search: adminProcedure.input(
    z3.object({
      // 筛选条件
      companyId: z3.string().optional(),
      phone: z3.string().optional(),
      feature: z3.string().optional(),
      modelCode: z3.string().optional(),
      provider: z3.string().optional(),
      success: z3.number().min(0).max(1).optional(),
      isSwitched: z3.number().min(0).max(1).optional(),
      // 时间范围
      startTime: z3.string().optional(),
      // ISO 8601
      endTime: z3.string().optional(),
      // Token 范围
      minTokens: z3.number().optional(),
      maxTokens: z3.number().optional(),
      // 费用范围
      minCost: z3.string().optional(),
      maxCost: z3.string().optional(),
      // 分页
      page: z3.number().min(1).optional().default(1),
      pageSize: z3.number().min(1).max(100).optional().default(20)
    })
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { data: [], total: 0, page: input.page, pageSize: input.pageSize };
    const conditions = [];
    if (input.companyId) {
      conditions.push(eq7(llmCallLogs.companyId, input.companyId));
    }
    if (input.phone) {
      conditions.push(like2(llmCallLogs.phone, `%${input.phone}%`));
    }
    if (input.feature) {
      conditions.push(eq7(llmCallLogs.feature, input.feature));
    }
    if (input.modelCode) {
      conditions.push(eq7(llmCallLogs.modelCode, input.modelCode));
    }
    if (input.provider) {
      conditions.push(eq7(llmCallLogs.provider, input.provider));
    }
    if (input.success !== void 0) {
      conditions.push(eq7(llmCallLogs.success, input.success));
    }
    if (input.isSwitched !== void 0) {
      conditions.push(eq7(llmCallLogs.isSwitched, input.isSwitched));
    }
    if (input.startTime) {
      conditions.push(gte2(llmCallLogs.requestTime, new Date(input.startTime)));
    }
    if (input.endTime) {
      conditions.push(lte(llmCallLogs.requestTime, new Date(input.endTime)));
    }
    if (input.minTokens !== void 0) {
      conditions.push(gte2(llmCallLogs.totalTokens, input.minTokens));
    }
    if (input.maxTokens !== void 0) {
      conditions.push(lte(llmCallLogs.totalTokens, input.maxTokens));
    }
    if (input.minCost) {
      conditions.push(sql4`CAST(${llmCallLogs.estimatedCost} AS DECIMAL(20,6)) >= ${input.minCost}`);
    }
    if (input.maxCost) {
      conditions.push(sql4`CAST(${llmCallLogs.estimatedCost} AS DECIMAL(20,6)) <= ${input.maxCost}`);
    }
    const whereClause = conditions.length > 0 ? and5(...conditions) : void 0;
    const countResult = await db.select({ total: count() }).from(llmCallLogs).where(whereClause);
    const total = countResult[0]?.total || 0;
    const offset = (input.page - 1) * input.pageSize;
    const data = await db.select().from(llmCallLogs).where(whereClause).orderBy(desc2(llmCallLogs.requestTime)).limit(input.pageSize).offset(offset);
    return {
      data,
      total,
      page: input.page,
      pageSize: input.pageSize
    };
  }),
  /**
   * 获取单条日志详情
   */
  getById: adminProcedure.input(z3.object({ id: z3.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(llmCallLogs).where(eq7(llmCallLogs.id, input.id)).limit(1);
    return result[0] || null;
  }),
  /**
   * 费用统计
   * 支持按企业、用户、功能、模型、时间维度统计 Token 和费用
   */
  stats: adminProcedure.input(
    z3.object({
      companyId: z3.string().optional(),
      userId: z3.number().optional(),
      feature: z3.string().optional(),
      modelCode: z3.string().optional(),
      provider: z3.string().optional(),
      startTime: z3.string().optional(),
      endTime: z3.string().optional(),
      // 分组维度
      groupBy: z3.enum(["company", "user", "feature", "model", "provider", "day"]).optional()
    })
  ).query(async ({ input }) => {
    const db = await getDb();
    if (!db) {
      return {
        summary: { totalCalls: 0, successCalls: 0, failedCalls: 0, switchedCalls: 0, totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0, totalCost: "0", successRate: "0" },
        breakdown: []
      };
    }
    const conditions = [];
    if (input.companyId) conditions.push(eq7(llmCallLogs.companyId, input.companyId));
    if (input.userId) conditions.push(eq7(llmCallLogs.userId, input.userId));
    if (input.feature) conditions.push(eq7(llmCallLogs.feature, input.feature));
    if (input.modelCode) conditions.push(eq7(llmCallLogs.modelCode, input.modelCode));
    if (input.provider) conditions.push(eq7(llmCallLogs.provider, input.provider));
    if (input.startTime) conditions.push(gte2(llmCallLogs.requestTime, new Date(input.startTime)));
    if (input.endTime) conditions.push(lte(llmCallLogs.requestTime, new Date(input.endTime)));
    const whereClause = conditions.length > 0 ? and5(...conditions) : void 0;
    const summaryResult = await db.select({
      totalCalls: count(),
      successCalls: sql4`SUM(CASE WHEN ${llmCallLogs.success} = 1 THEN 1 ELSE 0 END)`,
      failedCalls: sql4`SUM(CASE WHEN ${llmCallLogs.success} = 0 THEN 1 ELSE 0 END)`,
      switchedCalls: sql4`SUM(CASE WHEN ${llmCallLogs.isSwitched} = 1 THEN 1 ELSE 0 END)`,
      totalInputTokens: sql4`COALESCE(SUM(${llmCallLogs.inputTokens}), 0)`,
      totalOutputTokens: sql4`COALESCE(SUM(${llmCallLogs.outputTokens}), 0)`,
      totalTokens: sql4`COALESCE(SUM(${llmCallLogs.totalTokens}), 0)`,
      totalCost: sql4`COALESCE(SUM(CAST(${llmCallLogs.estimatedCost} AS DECIMAL(20,6))), 0)`
    }).from(llmCallLogs).where(whereClause);
    const summary = summaryResult[0] || {
      totalCalls: 0,
      successCalls: 0,
      failedCalls: 0,
      switchedCalls: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: "0"
    };
    const successRate = summary.totalCalls > 0 ? (Number(summary.successCalls) / summary.totalCalls * 100).toFixed(2) : "0";
    let breakdown = [];
    if (input.groupBy) {
      const groupColumn = {
        company: llmCallLogs.companyId,
        user: llmCallLogs.phone,
        feature: llmCallLogs.feature,
        model: llmCallLogs.modelCode,
        provider: llmCallLogs.provider,
        day: sql4`DATE(${llmCallLogs.requestTime})`
      }[input.groupBy];
      breakdown = await db.select({
        groupKey: groupColumn,
        totalCalls: count(),
        successCalls: sql4`SUM(CASE WHEN ${llmCallLogs.success} = 1 THEN 1 ELSE 0 END)`,
        totalInputTokens: sql4`COALESCE(SUM(${llmCallLogs.inputTokens}), 0)`,
        totalOutputTokens: sql4`COALESCE(SUM(${llmCallLogs.outputTokens}), 0)`,
        totalTokens: sql4`COALESCE(SUM(${llmCallLogs.totalTokens}), 0)`,
        totalCost: sql4`COALESCE(SUM(CAST(${llmCallLogs.estimatedCost} AS DECIMAL(20,6))), 0)`
      }).from(llmCallLogs).where(whereClause).groupBy(groupColumn).orderBy(desc2(sql4`SUM(CAST(${llmCallLogs.estimatedCost} AS DECIMAL(20,6)))`)).limit(50);
    }
    return {
      summary: { ...summary, successRate },
      breakdown
    };
  }),
  /**
   * 获取可用的筛选选项（用于前端下拉框）
   */
  filterOptions: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { features: [], providers: [], models: [] };
    const [features, providers, models] = await Promise.all([
      db.selectDistinct({ value: llmCallLogs.feature }).from(llmCallLogs),
      db.selectDistinct({ value: llmCallLogs.provider }).from(llmCallLogs),
      db.selectDistinct({ value: llmCallLogs.modelCode }).from(llmCallLogs)
    ]);
    return {
      features: features.map((f) => f.value).filter(Boolean),
      providers: providers.map((p) => p.value).filter(Boolean),
      models: models.map((m) => m.value).filter(Boolean)
    };
  })
});

// server/routers.ts
init_db();
init_schema();
import { TRPCError as TRPCError4 } from "@trpc/server";
import { z as z4 } from "zod";
import { eq as eq8, desc as desc3, and as and6 } from "drizzle-orm";
import { nanoid as nanoid3 } from "nanoid";

// server/toolsDatabase.ts
var AI_TOOLS_DATABASE = [
  // === 大模型/对话 ===
  { id: "chatgpt", name: "ChatGPT", category: "\u5927\u6A21\u578B\u5BF9\u8BDD", isDomestic: false, pricing: "freemium", description: "OpenAI\u65D7\u8230\u5BF9\u8BDD\u6A21\u578B\uFF0C\u652F\u6301\u6587\u672C\u3001\u56FE\u50CF\u3001\u4EE3\u7801\u7B49\u591A\u6A21\u6001\u4EFB\u52A1", useCases: ["\u6587\u6848\u64B0\u5199", "\u6570\u636E\u5206\u6790", "\u4EE3\u7801\u751F\u6210", "\u7FFB\u8BD1"], officialUrl: "https://chat.openai.com", tags: ["\u901A\u7528", "\u591A\u6A21\u6001"] },
  { id: "claude", name: "Claude", category: "\u5927\u6A21\u578B\u5BF9\u8BDD", isDomestic: false, pricing: "freemium", description: "Anthropic\u51FA\u54C1\uFF0C\u64C5\u957F\u957F\u6587\u672C\u7406\u89E3\u3001\u903B\u8F91\u63A8\u7406\u548C\u4EE3\u7801", useCases: ["\u957F\u6587\u6863\u5206\u6790", "\u903B\u8F91\u63A8\u7406", "\u4EE3\u7801\u5BA1\u67E5", "\u5B66\u672F\u5199\u4F5C"], officialUrl: "https://claude.ai", tags: ["\u957F\u6587\u672C", "\u63A8\u7406"] },
  { id: "deepseek", name: "DeepSeek", category: "\u5927\u6A21\u578B\u5BF9\u8BDD", isDomestic: true, pricing: "free", description: "\u6DF1\u5EA6\u6C42\u7D22\u51FA\u54C1\uFF0C\u5F00\u6E90\u514D\u8D39\uFF0C\u63A8\u7406\u80FD\u529B\u5F3A\uFF0C\u652F\u6301128K\u4E0A\u4E0B\u6587", useCases: ["\u4EE3\u7801\u751F\u6210", "\u6570\u5B66\u63A8\u7406", "\u6587\u672C\u5206\u6790", "\u77E5\u8BC6\u95EE\u7B54"], officialUrl: "https://chat.deepseek.com", tags: ["\u5F00\u6E90", "\u514D\u8D39", "\u63A8\u7406"] },
  { id: "doubao", name: "\u8C46\u5305", category: "\u5927\u6A21\u578B\u5BF9\u8BDD", isDomestic: true, pricing: "free", description: "\u5B57\u8282\u8DF3\u52A8\u51FA\u54C1\uFF0C\u514D\u8D39\u4F7F\u7528\uFF0C\u652F\u6301\u591A\u8F6E\u5BF9\u8BDD\u548C\u6587\u4EF6\u5206\u6790", useCases: ["\u65E5\u5E38\u95EE\u7B54", "\u6587\u6848\u521B\u4F5C", "\u7FFB\u8BD1", "\u6458\u8981"], officialUrl: "https://www.doubao.com", tags: ["\u514D\u8D39", "\u591A\u529F\u80FD"] },
  { id: "kimi", name: "Kimi", category: "\u5927\u6A21\u578B\u5BF9\u8BDD", isDomestic: true, pricing: "free", description: "\u6708\u4E4B\u6697\u9762\u51FA\u54C1\uFF0C\u652F\u6301200\u4E07\u5B57\u8D85\u957F\u4E0A\u4E0B\u6587\uFF0C\u64C5\u957F\u6587\u6863\u5206\u6790", useCases: ["\u957F\u6587\u6863\u9605\u8BFB", "\u8BBA\u6587\u5206\u6790", "\u4F1A\u8BAE\u7EAA\u8981", "\u62A5\u544A\u64B0\u5199"], officialUrl: "https://kimi.moonshot.cn", tags: ["\u8D85\u957F\u4E0A\u4E0B\u6587", "\u514D\u8D39"] },
  { id: "wenxin", name: "\u6587\u5FC3\u4E00\u8A00", category: "\u5927\u6A21\u578B\u5BF9\u8BDD", isDomestic: true, pricing: "free", description: "\u767E\u5EA6\u51FA\u54C1\uFF0C\u4E2D\u6587\u7406\u89E3\u80FD\u529B\u5F3A\uFF0C\u652F\u6301\u591A\u6A21\u6001", useCases: ["\u4E2D\u6587\u5199\u4F5C", "\u77E5\u8BC6\u95EE\u7B54", "\u521B\u610F\u751F\u6210", "\u6570\u636E\u5206\u6790"], officialUrl: "https://yiyan.baidu.com", tags: ["\u4E2D\u6587\u4F18\u5316", "\u514D\u8D39"] },
  { id: "tongyi", name: "\u901A\u4E49\u5343\u95EE", category: "\u5927\u6A21\u578B\u5BF9\u8BDD", isDomestic: true, pricing: "free", description: "\u963F\u91CC\u51FA\u54C1\uFF0C\u652F\u6301\u6587\u672C\u3001\u56FE\u50CF\u3001\u97F3\u9891\u7B49\u591A\u6A21\u6001\u7406\u89E3", useCases: ["\u6587\u6863\u5904\u7406", "\u4EE3\u7801\u751F\u6210", "\u56FE\u50CF\u7406\u89E3", "\u6570\u636E\u5206\u6790"], officialUrl: "https://tongyi.aliyun.com", tags: ["\u591A\u6A21\u6001", "\u514D\u8D39"] },
  // === AI Agent/自动化 ===
  { id: "coze", name: "\u6263\u5B50(Coze)", category: "AI Agent\u5E73\u53F0", isDomestic: true, pricing: "free", description: "\u5B57\u8282\u8DF3\u52A8AI Agent\u5F00\u53D1\u5E73\u53F0\uFF0C\u96F6\u4EE3\u7801\u642D\u5EFA\u667A\u80FD\u4F53\uFF0C\u652F\u6301\u63D2\u4EF6\u548C\u5DE5\u4F5C\u6D41", useCases: ["\u81EA\u52A8\u5316\u5DE5\u4F5C\u6D41", "\u5BA2\u670D\u673A\u5668\u4EBA", "\u6570\u636E\u91C7\u96C6", "\u5185\u5BB9\u751F\u6210"], officialUrl: "https://www.coze.cn", tags: ["\u96F6\u4EE3\u7801", "\u514D\u8D39", "Agent"] },
  { id: "dify", name: "Dify", category: "AI Agent\u5E73\u53F0", isDomestic: true, pricing: "freemium", description: "\u5F00\u6E90LLM\u5E94\u7528\u5F00\u53D1\u5E73\u53F0\uFF0C\u652F\u6301RAG\u3001Agent\u3001\u5DE5\u4F5C\u6D41\u7F16\u6392", useCases: ["\u77E5\u8BC6\u5E93\u95EE\u7B54", "\u5DE5\u4F5C\u6D41\u81EA\u52A8\u5316", "AI\u5E94\u7528\u5F00\u53D1"], officialUrl: "https://dify.ai", tags: ["\u5F00\u6E90", "RAG", "\u5DE5\u4F5C\u6D41"] },
  { id: "manus", name: "Manus", category: "AI Agent\u5E73\u53F0", isDomestic: false, pricing: "freemium", description: "\u901A\u7528AI Agent\uFF0C\u53EF\u81EA\u4E3B\u5B8C\u6210\u590D\u6742\u4EFB\u52A1\uFF0C\u652F\u6301\u8054\u7F51\u641C\u7D22\u548C\u4EE3\u7801\u6267\u884C", useCases: ["\u6DF1\u5EA6\u7814\u7A76", "\u6570\u636E\u5206\u6790", "\u81EA\u52A8\u5316\u4EFB\u52A1", "\u5185\u5BB9\u521B\u4F5C"], officialUrl: "https://manus.im", tags: ["\u901A\u7528Agent", "\u81EA\u4E3B\u6267\u884C"] },
  { id: "n8n", name: "n8n", category: "\u81EA\u52A8\u5316\u5DE5\u4F5C\u6D41", isDomestic: false, pricing: "freemium", description: "\u5F00\u6E90\u5DE5\u4F5C\u6D41\u81EA\u52A8\u5316\u5DE5\u5177\uFF0C\u652F\u6301400+\u5E94\u7528\u96C6\u6210", useCases: ["\u8DE8\u7CFB\u7EDF\u6570\u636E\u540C\u6B65", "\u81EA\u52A8\u5316\u62A5\u544A", "\u6D88\u606F\u901A\u77E5", "\u6570\u636E\u5904\u7406"], officialUrl: "https://n8n.io", tags: ["\u5F00\u6E90", "\u96C6\u6210", "\u81EA\u52A8\u5316"] },
  // === 编程/开发 ===
  { id: "cursor", name: "Cursor", category: "AI\u7F16\u7A0B", isDomestic: false, pricing: "freemium", description: "2026\u5E74\u6700\u6D41\u884C\u7684AI\u539F\u751FIDE\uFF0C\u652F\u6301\u4EE3\u7801\u8865\u5168\u3001\u91CD\u6784\u3001Agent\u6A21\u5F0F", useCases: ["\u4EE3\u7801\u7F16\u5199", "\u4EE3\u7801\u91CD\u6784", "Bug\u4FEE\u590D", "\u5168\u6808\u5F00\u53D1"], officialUrl: "https://cursor.com", tags: ["IDE", "\u6700\u6D41\u884C"] },
  { id: "claude-code", name: "Claude Code", category: "AI\u7F16\u7A0B", isDomestic: false, pricing: "paid", description: "Anthropic\u7EC8\u7AEF\u7EA7\u7F16\u7A0B\u4EE3\u7406\uFF0C\u81EA\u4E3B\u5B8C\u6210\u590D\u6742\u7F16\u7A0B\u4EFB\u52A1", useCases: ["\u81EA\u4E3B\u7F16\u7A0B", "\u4EE3\u7801\u91CD\u6784", "\u9879\u76EE\u642D\u5EFA", "Bug\u4FEE\u590D"], officialUrl: "https://claude.ai", tags: ["Agent", "\u7EC8\u7AEF", "\u6700\u65B0"] },
  { id: "github-copilot", name: "GitHub Copilot", category: "AI\u7F16\u7A0B", isDomestic: false, pricing: "paid", description: "GitHub AI\u7F16\u7A0B\u52A9\u624B\uFF0C\u6DF1\u5EA6\u96C6\u6210VS Code\uFF0C\u652F\u6301Agent\u548C\u591A\u6A21\u578B", useCases: ["\u4EE3\u7801\u8865\u5168", "\u6D4B\u8BD5\u751F\u6210", "\u6587\u6863\u751F\u6210", "\u4EE3\u7801\u5BA1\u67E5"], officialUrl: "https://github.com/features/copilot", tags: ["\u4EE3\u7801\u8865\u5168", "VS Code"] },
  { id: "windsurf", name: "Windsurf", category: "AI\u7F16\u7A0B", isDomestic: false, pricing: "freemium", description: "Codeium\u51FA\u54C1AI IDE\uFF0C\u4E0A\u4E0B\u6587\u7406\u89E3\u5F3A\uFF0C\u652F\u6301\u5927\u578B\u4EE3\u7801\u5E93", useCases: ["\u4EE3\u7801\u8865\u5168", "\u4EE3\u7801\u7406\u89E3", "\u91CD\u6784", "\u5927\u9879\u76EE"], officialUrl: "https://windsurf.com", tags: ["IDE", "\u4E0A\u4E0B\u6587"] },
  { id: "openai-codex", name: "OpenAI Codex", category: "AI\u7F16\u7A0B", isDomestic: false, pricing: "paid", description: "OpenAI\u81EA\u4E3B\u7F16\u7A0B\u4EE3\u7406\uFF0C\u53EF\u72EC\u7ACB\u5B8C\u6210GitHub issue\u548CPR", useCases: ["\u81EA\u4E3B\u7F16\u7A0B", "Issue\u4FEE\u590D", "\u4EE3\u7801\u5BA1\u67E5", "\u81EA\u52A8\u5316"], officialUrl: "https://openai.com", tags: ["Agent", "\u81EA\u4E3B", "\u6700\u65B0"] },
  { id: "tongyi-lingma", name: "\u901A\u4E49\u7075\u7801", category: "AI\u7F16\u7A0B", isDomestic: true, pricing: "free", description: "\u963F\u91CC\u51FA\u54C1\u514D\u8D39AI\u7F16\u7A0B\u52A9\u624B\uFF0C\u4F01\u4E1A\u7EA7\u5B89\u5168\uFF0C\u652F\u6301VS Code\u548CJetBrains", useCases: ["\u4EE3\u7801\u8865\u5168", "\u4EE3\u7801\u751F\u6210", "\u5355\u5143\u6D4B\u8BD5", "\u4EE3\u7801\u89E3\u91CA"], officialUrl: "https://tongyi.aliyun.com/lingma", tags: ["\u514D\u8D39", "\u56FD\u4EA7", "\u4F01\u4E1A"] },
  { id: "marscode", name: "MarsCode", category: "AI\u7F16\u7A0B", isDomestic: true, pricing: "free", description: "\u5B57\u8282\u8DF3\u52A8\u514D\u8D39AI\u7F16\u7A0B\u52A9\u624B\uFF0C\u652F\u6301\u4EE3\u7801\u8865\u5168\u548CCloud IDE", useCases: ["\u4EE3\u7801\u8865\u5168", "\u4EE3\u7801\u751F\u6210", "\u5728\u7EBF\u5F00\u53D1", "\u4EE3\u7801\u89E3\u91CA"], officialUrl: "https://www.marscode.cn", tags: ["\u514D\u8D39", "Cloud IDE"] },
  { id: "codegeex", name: "CodeGeeX", category: "AI\u7F16\u7A0B", isDomestic: true, pricing: "free", description: "\u667A\u8C31AI\u5F00\u6E90\u4EE3\u7801\u6A21\u578B\uFF0C\u514D\u8D39\u4F7F\u7528\uFF0C\u652F\u6301\u591A\u79CDIDE", useCases: ["\u4EE3\u7801\u8865\u5168", "\u4EE3\u7801\u7FFB\u8BD1", "\u6CE8\u91CA\u751F\u6210", "\u4EE3\u7801\u89E3\u91CA"], officialUrl: "https://codegeex.cn", tags: ["\u514D\u8D39", "\u5F00\u6E90", "\u56FD\u4EA7"] },
  { id: "codebuddy", name: "CodeBuddy", category: "AI\u7F16\u7A0B", isDomestic: true, pricing: "free", description: "\u817E\u8BAF\u4E91AI\u4EE3\u7801\u7F16\u8F91\u5668\uFF0C\u57FA\u4E8E\u5143\u5B9D\u4EE3\u7801\u5927\u6A21\u578B\uFF0C\u652F\u6301\u4EE3\u7801\u8865\u5168\u3001\u751F\u6210\u548CAgent\u6A21\u5F0F", useCases: ["\u4EE3\u7801\u8865\u5168", "\u4EE3\u7801\u751F\u6210", "Agent\u81EA\u4E3B\u7F16\u7A0B", "\u5168\u6808\u5F00\u53D1"], officialUrl: "https://www.codebuddy.ai", tags: ["\u514D\u8D39", "\u56FD\u4EA7", "Agent", "\u817E\u8BAF"] },
  { id: "trae", name: "Trae", category: "AI\u7F16\u7A0B", isDomestic: true, pricing: "free", description: "\u5B57\u8282\u8DF3\u52A8AI IDE\uFF0C\u652F\u6301Solo\u81EA\u4E3B\u7F16\u7A0B\u6A21\u5F0F\uFF0C\u514D\u8D39\u4F7F\u7528\uFF0C\u5185\u7F6E\u591A\u6A21\u578B\u5207\u6362", useCases: ["\u4EE3\u7801\u8865\u5168", "\u81EA\u4E3B\u7F16\u7A0B", "\u9879\u76EE\u642D\u5EFA", "\u4EE3\u7801\u91CD\u6784"], officialUrl: "https://www.trae.ai", tags: ["\u514D\u8D39", "\u56FD\u4EA7", "Solo\u6A21\u5F0F", "IDE"] },
  // === 图像生成/设计 ===
  { id: "gpt-image-2", name: "GPT-image-2", category: "AI\u56FE\u50CF\u751F\u6210", isDomestic: false, pricing: "freemium", description: "OpenAI\u6700\u65B0\u56FE\u50CF\u751F\u6210\u6A21\u578B(2026)\uFF0C\u6587\u5B57\u6E32\u67D3\u80FD\u529B\u6781\u5F3A\uFF0C\u652F\u6301\u7CBE\u786E\u7F16\u8F91\u548C\u591A\u98CE\u683C", useCases: ["\u8425\u9500\u7D20\u6750", "\u4EA7\u54C1\u56FE", "\u6587\u5B57\u6D77\u62A5", "\u56FE\u50CF\u7F16\u8F91"], officialUrl: "https://openai.com", tags: ["\u6587\u5B57\u6E32\u67D3", "\u7F16\u8F91", "\u6700\u65B0"] },
  { id: "midjourney", name: "Midjourney v7", category: "AI\u56FE\u50CF\u751F\u6210", isDomestic: false, pricing: "paid", description: "\u9876\u7EA7AI\u56FE\u50CF\u751F\u6210\u5DE5\u5177v7\u7248\uFF0C\u827A\u672F\u8D28\u91CF\u4E1A\u754C\u6700\u9AD8\uFF0C\u652F\u63013D\u548C\u89C6\u9891", useCases: ["\u6982\u5FF5\u8BBE\u8BA1", "\u8425\u9500\u7D20\u6750", "\u54C1\u724C\u89C6\u89C9", "\u63D2\u753B"], officialUrl: "https://midjourney.com", tags: ["\u827A\u672F", "\u9AD8\u8D28\u91CF"] },
  { id: "flux", name: "FLUX 2.0", category: "AI\u56FE\u50CF\u751F\u6210", isDomestic: false, pricing: "freemium", description: "Black Forest Labs\u5F00\u6E90\u56FE\u50CF\u6A21\u578B\uFF0C\u7EC6\u8282\u7CBE\u786E\uFF0C\u5F00\u6E90\u6700\u5F3A", useCases: ["\u56FE\u50CF\u751F\u6210", "\u7CBE\u786E\u63A7\u5236", "\u98CE\u683C\u8F6C\u6362", "\u5546\u4E1A\u8BBE\u8BA1"], officialUrl: "https://blackforestlabs.ai", tags: ["\u5F00\u6E90", "\u7CBE\u786E", "\u6700\u65B0"] },
  { id: "ideogram", name: "Ideogram 3.0", category: "AI\u56FE\u50CF\u751F\u6210", isDomestic: false, pricing: "freemium", description: "\u6587\u5B57\u6E32\u67D3\u548C\u8BBE\u8BA1\u80FD\u529B\u6781\u5F3A\u7684\u56FE\u50CF\u751F\u6210\u5DE5\u5177\uFF0C\u9002\u5408Logo\u548C\u6D77\u62A5", useCases: ["Logo\u8BBE\u8BA1", "\u6D77\u62A5", "\u6587\u5B57\u56FE\u50CF", "\u54C1\u724C\u8BBE\u8BA1"], officialUrl: "https://ideogram.ai", tags: ["\u6587\u5B57", "\u8BBE\u8BA1", "Logo"] },
  { id: "nano-banana", name: "Nano Banana 2", category: "AI\u56FE\u50CF\u751F\u6210", isDomestic: false, pricing: "freemium", description: "2026\u5E74\u65B0\u9510\u56FE\u50CF\u751F\u6210\u6A21\u578B\uFF0C\u901F\u5EA6\u6781\u5FEB\uFF0C\u98CE\u683C\u591A\u6837\uFF0C\u6027\u4EF7\u6BD4\u9AD8", useCases: ["\u5FEB\u901F\u51FA\u56FE", "\u6279\u91CF\u751F\u6210", "\u521B\u610F\u8BBE\u8BA1", "\u793E\u4EA4\u5A92\u4F53"], officialUrl: "https://nanobanana.ai", tags: ["\u5FEB\u901F", "\u6700\u65B0", "\u6027\u4EF7\u6BD4"] },
  { id: "recraft", name: "Recraft V3", category: "AI\u56FE\u50CF\u751F\u6210", isDomestic: false, pricing: "freemium", description: "\u4E13\u4E1A\u77E2\u91CF\u56FE\u548C\u8BBE\u8BA1\u7A3F\u751F\u6210\uFF0C\u652F\u6301SVG\u8F93\u51FA\u548C\u54C1\u724C\u4E00\u81F4\u6027", useCases: ["\u77E2\u91CF\u8BBE\u8BA1", "\u56FE\u6807\u751F\u6210", "\u54C1\u724C\u7269\u6599", "UI\u8BBE\u8BA1"], officialUrl: "https://www.recraft.ai", tags: ["\u77E2\u91CF", "\u8BBE\u8BA1", "SVG"] },
  { id: "tongyi-wanxiang", name: "\u901A\u4E49\u4E07\u76F82.7", category: "AI\u56FE\u50CF\u751F\u6210", isDomestic: true, pricing: "free", description: "\u963F\u91CC\u6700\u65B0\u56FE\u50CF\u751F\u6210\u6A21\u578B\uFF0C\u652F\u6301\u6587\u751F\u56FE/\u56FE\u751F\u56FE/\u56FE\u50CF\u7F16\u8F91/\u591A\u56FE\u7EC4\u5408", useCases: ["\u8425\u9500\u6D77\u62A5", "\u4EA7\u54C1\u56FE", "\u56FE\u50CF\u7F16\u8F91", "\u7535\u5546\u7D20\u6750"], officialUrl: "https://tongyi.aliyun.com/wanxiang", tags: ["\u56FD\u4EA7", "\u514D\u8D39", "\u7F16\u8F91", "\u6700\u65B0"] },
  { id: "jimeng", name: "\u5373\u68A6AI", category: "AI\u56FE\u50CF\u751F\u6210", isDomestic: true, pricing: "free", description: "\u5B57\u8282\u8DF3\u52A8AI\u56FE\u50CF/\u89C6\u9891\u751F\u6210\u5E73\u53F0\uFF0C\u652F\u6301\u6587\u751F\u56FE\u3001\u56FE\u751F\u56FE", useCases: ["\u8425\u9500\u6D77\u62A5", "\u793E\u4EA4\u5A92\u4F53\u914D\u56FE", "\u4EA7\u54C1\u5C55\u793A", "\u521B\u610F\u8BBE\u8BA1"], officialUrl: "https://jimeng.jianying.com", tags: ["\u514D\u8D39", "\u89C6\u9891\u751F\u6210"] },
  { id: "ketu", name: "\u53EF\u56FE", category: "AI\u56FE\u50CF\u751F\u6210", isDomestic: true, pricing: "free", description: "\u5FEB\u624B\u51FA\u54C1\u9AD8\u8D28\u91CF\u56FE\u50CF\u751F\u6210\u5DE5\u5177\uFF0C\u5199\u5B9E\u98CE\u683C\u51FA\u8272", useCases: ["\u5199\u5B9E\u56FE\u50CF", "\u4EBA\u50CF\u751F\u6210", "\u573A\u666F\u56FE", "\u5E7F\u544A\u7D20\u6750"], officialUrl: "https://ketu.kuaishou.com", tags: ["\u56FD\u4EA7", "\u514D\u8D39", "\u5199\u5B9E"] },
  { id: "canva", name: "Canva AI", category: "AI\u8BBE\u8BA1", isDomestic: false, pricing: "freemium", description: "\u5728\u7EBF\u8BBE\u8BA1\u5E73\u53F0\uFF0CAI\u8F85\u52A9\u751F\u6210\u8BBE\u8BA1\u3001\u6587\u6848\u3001\u56FE\u7247", useCases: ["\u6D77\u62A5\u8BBE\u8BA1", "PPT\u5236\u4F5C", "\u793E\u4EA4\u5A92\u4F53\u56FE", "\u54C1\u724C\u7269\u6599"], officialUrl: "https://www.canva.com", tags: ["\u8BBE\u8BA1", "\u6A21\u677F"] },
  { id: "figma-ai", name: "Figma AI", category: "AI\u8BBE\u8BA1", isDomestic: false, pricing: "freemium", description: "Figma\u5185\u7F6EAI\u529F\u80FD\uFF0C\u652F\u6301\u81EA\u52A8\u5E03\u5C40\u3001\u8BBE\u8BA1\u751F\u6210\u548C\u539F\u578B\u5236\u4F5C", useCases: ["UI\u8BBE\u8BA1", "\u539F\u578B\u5236\u4F5C", "\u8BBE\u8BA1\u7CFB\u7EDF", "\u534F\u4F5C\u8BBE\u8BA1"], officialUrl: "https://www.figma.com", tags: ["UI/UX", "\u534F\u4F5C"] },
  { id: "gaoding", name: "\u7A3F\u5B9A\u8BBE\u8BA1AI", category: "AI\u8BBE\u8BA1", isDomestic: true, pricing: "freemium", description: "\u56FD\u4EA7\u5728\u7EBF\u8BBE\u8BA1\u5DE5\u5177\uFF0CAI\u667A\u80FD\u62A0\u56FE\u3001\u6D77\u62A5\u751F\u6210\u3001\u6279\u91CF\u8BBE\u8BA1", useCases: ["\u7535\u5546\u6D77\u62A5", "\u793E\u4EA4\u5A92\u4F53\u56FE", "\u6279\u91CF\u8BBE\u8BA1", "\u667A\u80FD\u62A0\u56FE"], officialUrl: "https://www.gaoding.com", tags: ["\u56FD\u4EA7", "\u7535\u5546", "\u6279\u91CF"] },
  { id: "jishi-design", name: "\u5373\u65F6\u8BBE\u8BA1AI", category: "AI\u8BBE\u8BA1", isDomestic: true, pricing: "freemium", description: "\u56FD\u4EA7Figma\u66FF\u4EE3\u54C1\uFF0C\u5185\u7F6EAI\u8BBE\u8BA1\u52A9\u624B\uFF0C\u652F\u6301\u56E2\u961F\u534F\u4F5C", useCases: ["UI\u8BBE\u8BA1", "\u539F\u578B\u5236\u4F5C", "\u56E2\u961F\u534F\u4F5C", "\u8BBE\u8BA1\u89C4\u8303"], officialUrl: "https://js.design", tags: ["\u56FD\u4EA7", "UI/UX", "\u534F\u4F5C"] },
  // === 视频生成/编辑 ===
  { id: "runway", name: "Runway Gen-4.5", category: "AI\u89C6\u9891", isDomestic: false, pricing: "freemium", description: "AI\u89C6\u9891\u751F\u6210\u9886\u5148\u5E73\u53F0\uFF0C\u8FD0\u52A8\u7B14\u5237\u7CBE\u786E\u63A7\u5236\uFF0C\u652F\u6301\u6587/\u56FE\u751F\u89C6\u9891", useCases: ["\u77ED\u89C6\u9891\u5236\u4F5C", "\u5E7F\u544A\u7D20\u6750", "\u7279\u6548\u5236\u4F5C", "\u89C6\u9891\u7F16\u8F91"], officialUrl: "https://runwayml.com", tags: ["\u89C6\u9891\u751F\u6210", "\u7279\u6548", "\u6700\u65B0"] },
  { id: "google-veo", name: "Google Veo 3", category: "AI\u89C6\u9891", isDomestic: false, pricing: "free", description: "Google\u6700\u65B0\u89C6\u9891\u751F\u6210\u6A21\u578B\uFF0C\u514D\u8D39\u4F7F\u7528\uFF0C\u8D28\u91CF\u9AD8\uFF0C\u652F\u6301\u97F3\u9891\u540C\u6B65", useCases: ["\u89C6\u9891\u521B\u4F5C", "\u5E7F\u544A\u5236\u4F5C", "\u6559\u80B2\u5185\u5BB9", "\u521B\u610F\u77ED\u7247"], officialUrl: "https://deepmind.google/veo", tags: ["\u514D\u8D39", "\u9AD8\u8D28\u91CF", "\u6700\u65B0"] },
  { id: "pika", name: "Pika 2.5", category: "AI\u89C6\u9891", isDomestic: false, pricing: "freemium", description: "AI\u89C6\u9891\u751F\u6210\u5DE5\u5177\uFF0C\u64C5\u957F\u7279\u6548\u548C\u98CE\u683C\u5316\uFF0C\u64CD\u4F5C\u7B80\u5355", useCases: ["\u7279\u6548\u89C6\u9891", "\u98CE\u683C\u5316", "\u793E\u4EA4\u5A92\u4F53", "\u521B\u610F\u5185\u5BB9"], officialUrl: "https://pika.art", tags: ["\u7279\u6548", "\u98CE\u683C\u5316"] },
  { id: "kling", name: "\u53EF\u7075AI 3.0", category: "AI\u89C6\u9891", isDomestic: true, pricing: "freemium", description: "\u5FEB\u624B\u51FA\u54C1\uFF0C\u56FD\u4EA7\u89C6\u9891\u751F\u6210\u7B2C\u4E00\uFF0CAI\u5BFC\u6F14\u7CFB\u7EDF\uFF0C\u7535\u5F71\u7EA7\u8D28\u91CF", useCases: ["\u77ED\u89C6\u9891\u521B\u4F5C", "\u5E7F\u544A\u5236\u4F5C", "\u521B\u610F\u89C6\u9891", "\u52A8\u753B"], officialUrl: "https://kling.kuaishou.com", tags: ["\u56FD\u4EA7", "\u89C6\u9891\u751F\u6210", "\u6700\u65B0"] },
  { id: "jimeng-video", name: "\u5373\u68A6AI\u89C6\u9891", category: "AI\u89C6\u9891", isDomestic: true, pricing: "free", description: "\u5B57\u8282\u8DF3\u52A8\u89C6\u9891\u751F\u6210\uFF0C\u4E2D\u6587\u7406\u89E3\u6700\u5F3A\uFF0C\u53E3\u578B\u5339\u914D\u4F18\u79C0\uFF0C\u96C6\u6210Seedance 2.0", useCases: ["\u77E5\u8BC6\u5206\u4EAB", "\u751F\u6D3B\u8BB0\u5F55", "\u53E3\u64AD\u89C6\u9891", "\u77ED\u89C6\u9891"], officialUrl: "https://jimeng.jianying.com", tags: ["\u56FD\u4EA7", "\u514D\u8D39", "\u4E2D\u6587", "\u6700\u65B0"] },
  { id: "haiyi", name: "\u6D77\u827AAI", category: "AI\u89C6\u9891", isDomestic: true, pricing: "free", description: "\u56FD\u4EA7\u514D\u8D39\u4E0D\u9650\u6B21AI\u89C6\u9891\u751F\u6210\uFF0C\u6027\u4EF7\u6BD4\u6700\u9AD8", useCases: ["\u77ED\u89C6\u9891", "\u793E\u4EA4\u5A92\u4F53", "\u4EA7\u54C1\u5C55\u793A", "\u6279\u91CF\u5236\u4F5C"], officialUrl: "https://www.haiyi.art", tags: ["\u56FD\u4EA7", "\u514D\u8D39", "\u4E0D\u9650\u6B21"] },
  { id: "vidu", name: "Vidu", category: "AI\u89C6\u9891", isDomestic: true, pricing: "freemium", description: "\u751F\u6570\u79D1\u6280\u51FA\u54C1\uFF0C\u9AD8\u8D28\u91CFAI\u89C6\u9891\u751F\u6210\uFF0C\u652F\u63014K\u8F93\u51FA", useCases: ["\u9AD8\u8D28\u91CF\u89C6\u9891", "\u5E7F\u544A\u7D20\u6750", "\u521B\u610F\u5185\u5BB9", "\u4EA7\u54C1\u5C55\u793A"], officialUrl: "https://www.vidu.com", tags: ["\u56FD\u4EA7", "\u9AD8\u8D28\u91CF"] },
  { id: "heygen", name: "HeyGen", category: "AI\u6570\u5B57\u4EBA", isDomestic: false, pricing: "freemium", description: "AI\u6570\u5B57\u4EBA\u89C6\u9891\u751F\u6210\u5E73\u53F0\uFF0C\u652F\u6301\u591A\u8BED\u8A00\u53E3\u64AD\u548C\u5F62\u8C61\u514B\u9686", useCases: ["\u57F9\u8BAD\u89C6\u9891", "\u4EA7\u54C1\u4ECB\u7ECD", "\u591A\u8BED\u8A00\u8425\u9500", "\u865A\u62DF\u4E3B\u64AD"], officialUrl: "https://www.heygen.com", tags: ["\u6570\u5B57\u4EBA", "\u591A\u8BED\u8A00"] },
  { id: "synthesia", name: "Synthesia", category: "AI\u6570\u5B57\u4EBA", isDomestic: false, pricing: "paid", description: "\u4F01\u4E1A\u7EA7AI\u6570\u5B57\u4EBA\u5E73\u53F0\uFF0C\u652F\u6301160+\u8BED\u8A00\uFF0C\u9002\u5408\u57F9\u8BAD\u548C\u8425\u9500", useCases: ["\u4F01\u4E1A\u57F9\u8BAD", "\u4EA7\u54C1\u6F14\u793A", "\u591A\u8BED\u8A00\u89C6\u9891", "\u5185\u90E8\u6C9F\u901A"], officialUrl: "https://www.synthesia.io", tags: ["\u4F01\u4E1A", "\u6570\u5B57\u4EBA", "\u591A\u8BED\u8A00"] },
  { id: "silicon-flow", name: "\u7845\u57FA\u6D41\u52A8", category: "AI\u6570\u5B57\u4EBA", isDomestic: true, pricing: "freemium", description: "\u56FD\u4EA7AI\u6570\u5B57\u4EBA\u5E73\u53F0\uFF0C\u652F\u6301\u5F62\u8C61\u514B\u9686\u548C\u5B9E\u65F6\u9A71\u52A8", useCases: ["\u76F4\u64AD\u5E26\u8D27", "\u5BA2\u670D\u6570\u5B57\u4EBA", "\u57F9\u8BAD\u8BB2\u5E08", "\u4F01\u4E1A\u5BA3\u4F20"], officialUrl: "https://www.guiji.ai", tags: ["\u56FD\u4EA7", "\u6570\u5B57\u4EBA", "\u76F4\u64AD"] },
  // === 音频/语音/音乐 ===
  { id: "suno", name: "Suno v5", category: "AI\u97F3\u4E50", isDomestic: false, pricing: "freemium", description: "AI\u97F3\u4E50\u751F\u6210\u7B2C\u4E00\u5E73\u53F0\uFF0C30\u79D2\u751F\u6210\u5B8C\u6574\u6B4C\u66F2\uFF08\u6B4C\u8BCD+\u4EBA\u58F0+\u7F16\u66F2\uFF09", useCases: ["\u97F3\u4E50\u521B\u4F5C", "\u80CC\u666F\u97F3\u4E50", "\u5E7F\u544A\u914D\u4E50", "\u4E2A\u4EBA\u521B\u4F5C"], officialUrl: "https://suno.com", tags: ["\u97F3\u4E50\u751F\u6210", "\u6700\u65B0"] },
  { id: "udio", name: "Udio", category: "AI\u97F3\u4E50", isDomestic: false, pricing: "freemium", description: "\u9AD8\u8D28\u91CFAI\u97F3\u4E50\u751F\u6210\uFF0C\u4EBA\u58F0\u6548\u679C\u4E1A\u754C\u6700\u4F73\uFF0C\u652F\u6301remix\u548C\u7ED3\u6784\u63A7\u5236", useCases: ["\u97F3\u4E50\u5236\u4F5C", "\u4EBA\u58F0\u6B4C\u66F2", "\u98CE\u683C\u63A2\u7D22", "\u7F16\u66F2"], officialUrl: "https://www.udio.com", tags: ["\u97F3\u4E50\u751F\u6210", "\u4EBA\u58F0"] },
  { id: "elevenlabs", name: "ElevenLabs", category: "AI\u8BED\u97F3", isDomestic: false, pricing: "freemium", description: "\u9876\u7EA7AI\u8BED\u97F3\u5408\u6210\uFF0C\u652F\u6301\u58F0\u97F3\u514B\u9686\u3001\u591A\u8BED\u8A00\u3001\u60C5\u611F\u63A7\u5236", useCases: ["\u6709\u58F0\u4E66", "\u914D\u97F3", "\u64AD\u5BA2", "\u591A\u8BED\u8A00\u5185\u5BB9"], officialUrl: "https://elevenlabs.io", tags: ["\u8BED\u97F3\u5408\u6210", "\u58F0\u97F3\u514B\u9686"] },
  { id: "fish-audio", name: "Fish Audio", category: "AI\u8BED\u97F3", isDomestic: true, pricing: "freemium", description: "\u56FD\u4EA7AI\u8BED\u97F3\u5408\u6210\u5E73\u53F0\uFF0C\u652F\u6301\u4E2D\u6587\u8BED\u97F3\u514B\u9686\uFF0C\u6548\u679C\u81EA\u7136", useCases: ["\u6709\u58F0\u5185\u5BB9", "\u914D\u97F3", "\u8BED\u97F3\u52A9\u624B", "\u64AD\u5BA2"], officialUrl: "https://fish.audio", tags: ["\u56FD\u4EA7", "\u8BED\u97F3\u5408\u6210"] },
  { id: "xunfei", name: "\u8BAF\u98DE\u8BED\u97F3", category: "AI\u8BED\u97F3", isDomestic: true, pricing: "freemium", description: "\u79D1\u5927\u8BAF\u98DE\u8BED\u97F3\u6280\u672F\uFF0C\u8BED\u97F3\u8BC6\u522B/\u5408\u6210/\u7FFB\u8BD1\u5168\u6808\u80FD\u529B", useCases: ["\u8BED\u97F3\u8BC6\u522B", "\u8BED\u97F3\u5408\u6210", "\u4F1A\u8BAE\u8F6C\u5F55", "\u540C\u58F0\u4F20\u8BD1"], officialUrl: "https://www.xfyun.cn", tags: ["\u56FD\u4EA7", "\u8BED\u97F3\u8BC6\u522B", "\u4F01\u4E1A"] },
  { id: "tongyi-tingwu", name: "\u901A\u4E49\u542C\u609F", category: "AI\u8BED\u97F3", isDomestic: true, pricing: "free", description: "\u963F\u91CC\u51FA\u54C1\u514D\u8D39\u4F1A\u8BAE\u8F6C\u5F55\u5DE5\u5177\uFF0C\u652F\u6301\u591A\u4EBA\u5BF9\u8BDD\u548C\u8981\u70B9\u63D0\u53D6", useCases: ["\u4F1A\u8BAE\u7EAA\u8981", "\u8BBF\u8C08\u8F6C\u5F55", "\u8BFE\u7A0B\u7B14\u8BB0", "\u97F3\u89C6\u9891\u603B\u7ED3"], officialUrl: "https://tingwu.aliyun.com", tags: ["\u56FD\u4EA7", "\u514D\u8D39", "\u8F6C\u5F55"] },
  // === 文档/写作 ===
  { id: "notion-ai", name: "Notion AI", category: "AI\u5199\u4F5C", isDomestic: false, pricing: "paid", description: "Notion\u5185\u7F6EAI\u52A9\u624B\uFF0C\u652F\u6301\u6587\u6863\u5199\u4F5C\u3001\u603B\u7ED3\u3001\u7FFB\u8BD1", useCases: ["\u6587\u6863\u5199\u4F5C", "\u4F1A\u8BAE\u7EAA\u8981", "\u9879\u76EE\u7BA1\u7406", "\u77E5\u8BC6\u5E93"], officialUrl: "https://notion.so", tags: ["\u6587\u6863", "\u534F\u4F5C"] },
  { id: "feishu-ai", name: "\u98DE\u4E66\u667A\u80FD\u4F19\u4F34", category: "AI\u5199\u4F5C", isDomestic: true, pricing: "freemium", description: "\u98DE\u4E66\u5185\u7F6EAI\uFF0C\u652F\u6301\u6587\u6863\u5199\u4F5C\u3001\u8868\u683C\u5206\u6790\u3001\u4F1A\u8BAE\u7EAA\u8981", useCases: ["\u4F01\u4E1A\u6587\u6863", "\u4F1A\u8BAE\u7EAA\u8981", "\u6570\u636E\u5206\u6790", "\u534F\u4F5C"], officialUrl: "https://www.feishu.cn", tags: ["\u56FD\u4EA7", "\u4F01\u4E1A", "\u534F\u4F5C"] },
  { id: "wps-ai", name: "WPS AI", category: "AI\u5199\u4F5C", isDomestic: true, pricing: "freemium", description: "WPS\u5185\u7F6EAI\u52A9\u624B\uFF0C\u652F\u6301\u6587\u6863\u3001\u8868\u683C\u3001PPT\u667A\u80FD\u751F\u6210", useCases: ["\u516C\u6587\u5199\u4F5C", "\u62A5\u544A\u751F\u6210", "PPT\u5236\u4F5C", "\u6570\u636E\u5206\u6790"], officialUrl: "https://ai.wps.cn", tags: ["\u56FD\u4EA7", "\u529E\u516C", "\u514D\u8D39"] },
  // === 数据分析/BI ===
  { id: "tableau", name: "Tableau", category: "\u6570\u636E\u5206\u6790", isDomestic: false, pricing: "paid", description: "\u4F01\u4E1A\u7EA7\u6570\u636E\u53EF\u89C6\u5316\u548C\u5206\u6790\u5E73\u53F0\uFF0CAI\u8F85\u52A9\u6D1E\u5BDF", useCases: ["\u6570\u636E\u53EF\u89C6\u5316", "\u5546\u4E1A\u667A\u80FD", "\u62A5\u8868", "\u6570\u636E\u63A2\u7D22"], officialUrl: "https://www.tableau.com", tags: ["BI", "\u53EF\u89C6\u5316"] },
  { id: "fanruan", name: "\u5E06\u8F6FBI", category: "\u6570\u636E\u5206\u6790", isDomestic: true, pricing: "freemium", description: "\u56FD\u4EA7\u9886\u5148BI\u5DE5\u5177\uFF0C\u652F\u6301\u62A5\u8868\u3001\u4EEA\u8868\u76D8\u3001\u6570\u636E\u5206\u6790", useCases: ["\u4F01\u4E1A\u62A5\u8868", "\u6570\u636E\u4EEA\u8868\u76D8", "\u81EA\u52A9\u5206\u6790", "\u6570\u636E\u586B\u62A5"], officialUrl: "https://www.fanruan.com", tags: ["\u56FD\u4EA7", "\u4F01\u4E1ABI"] },
  // === 营销/社媒 ===
  { id: "hubspot", name: "HubSpot", category: "\u8425\u9500\u81EA\u52A8\u5316", isDomestic: false, pricing: "freemium", description: "\u4E00\u4F53\u5316\u8425\u9500\u3001\u9500\u552E\u3001\u5BA2\u670D\u5E73\u53F0\uFF0CAI\u8F85\u52A9\u5185\u5BB9\u548C\u5206\u6790", useCases: ["\u90AE\u4EF6\u8425\u9500", "\u793E\u5A92\u7BA1\u7406", "CRM", "\u5185\u5BB9\u8425\u9500"], officialUrl: "https://www.hubspot.com", tags: ["CRM", "\u8425\u9500"] },
  { id: "zhiqu", name: "\u81F4\u8DA3\u767E\u5DDD", category: "\u8425\u9500\u81EA\u52A8\u5316", isDomestic: true, pricing: "paid", description: "\u56FD\u4EA7B2B\u8425\u9500\u81EA\u52A8\u5316\u5E73\u53F0\uFF0C\u652F\u6301\u83B7\u5BA2\u3001\u57F9\u80B2\u3001\u8F6C\u5316\u5168\u94FE\u8DEF", useCases: ["B2B\u83B7\u5BA2", "\u7EBF\u7D22\u57F9\u80B2", "\u6D3B\u52A8\u7BA1\u7406", "\u5185\u5BB9\u8425\u9500"], officialUrl: "https://www.zhiqu.com", tags: ["\u56FD\u4EA7", "B2B", "\u8425\u9500"] },
  // === 项目管理 ===
  { id: "linear", name: "Linear", category: "\u9879\u76EE\u7BA1\u7406", isDomestic: false, pricing: "freemium", description: "\u73B0\u4EE3\u5316\u9879\u76EE\u7BA1\u7406\u5DE5\u5177\uFF0CAI\u8F85\u52A9\u4EFB\u52A1\u5206\u914D\u548C\u4F18\u5148\u7EA7", useCases: ["\u4EFB\u52A1\u7BA1\u7406", "Sprint\u89C4\u5212", "Bug\u8FFD\u8E2A", "\u56E2\u961F\u534F\u4F5C"], officialUrl: "https://linear.app", tags: ["\u654F\u6377", "\u5F00\u53D1\u56E2\u961F"] },
  { id: "feishu-project", name: "\u98DE\u4E66\u9879\u76EE", category: "\u9879\u76EE\u7BA1\u7406", isDomestic: true, pricing: "freemium", description: "\u98DE\u4E66\u65D7\u4E0B\u9879\u76EE\u7BA1\u7406\u5DE5\u5177\uFF0C\u652F\u6301\u591A\u79CD\u89C6\u56FE\u548C\u81EA\u52A8\u5316", useCases: ["\u9879\u76EE\u7BA1\u7406", "\u9700\u6C42\u7BA1\u7406", "\u7F3A\u9677\u8FFD\u8E2A", "\u56E2\u961F\u534F\u4F5C"], officialUrl: "https://project.feishu.cn", tags: ["\u56FD\u4EA7", "\u4F01\u4E1A", "\u534F\u4F5C"] },
  // === HR/人力资源 ===
  { id: "beisen", name: "\u5317\u68EE", category: "HR\u79D1\u6280", isDomestic: true, pricing: "paid", description: "\u4E00\u4F53\u5316HR SaaS\u5E73\u53F0\uFF0C\u8986\u76D6\u62DB\u8058\u3001\u4EBA\u624D\u7BA1\u7406\u3001\u7EC4\u7EC7\u53D1\u5C55", useCases: ["\u62DB\u8058\u7BA1\u7406", "\u7EE9\u6548\u7BA1\u7406", "\u4EBA\u624D\u76D8\u70B9", "\u7EC4\u7EC7\u8BCA\u65AD"], officialUrl: "https://www.beisen.com", tags: ["\u56FD\u4EA7", "HR", "\u4E00\u4F53\u5316"] },
  { id: "moka", name: "Moka", category: "HR\u79D1\u6280", isDomestic: true, pricing: "paid", description: "\u667A\u80FD\u62DB\u8058\u7BA1\u7406\u7CFB\u7EDF\uFF0CAI\u8F85\u52A9\u7B80\u5386\u7B5B\u9009\u548C\u4EBA\u624D\u63A8\u8350", useCases: ["\u62DB\u8058\u7BA1\u7406", "\u7B80\u5386\u7B5B\u9009", "\u9762\u8BD5\u5B89\u6392", "\u4EBA\u624D\u5E93"], officialUrl: "https://www.mokahr.com", tags: ["\u56FD\u4EA7", "\u62DB\u8058", "AI\u7B5B\u9009"] },
  // === 客服/沟通 ===
  { id: "zhipu-ai", name: "\u667A\u8C31\u6E05\u8A00", category: "AI\u5BA2\u670D", isDomestic: true, pricing: "freemium", description: "\u667A\u8C31AI\u5BF9\u8BDD\u5E73\u53F0\uFF0C\u652F\u6301\u4F01\u4E1A\u77E5\u8BC6\u5E93\u95EE\u7B54\u548C\u5BA2\u670D\u573A\u666F", useCases: ["\u667A\u80FD\u5BA2\u670D", "\u77E5\u8BC6\u5E93\u95EE\u7B54", "\u6587\u6863\u5206\u6790", "\u5185\u5BB9\u751F\u6210"], officialUrl: "https://chatglm.cn", tags: ["\u56FD\u4EA7", "\u4F01\u4E1A", "\u77E5\u8BC6\u5E93"] },
  // === 搜索/研究 ===
  { id: "perplexity", name: "Perplexity", category: "AI\u641C\u7D22", isDomestic: false, pricing: "freemium", description: "AI\u641C\u7D22\u5F15\u64CE\uFF0C\u5B9E\u65F6\u8054\u7F51\u641C\u7D22\u5E76\u7ED9\u51FA\u5E26\u5F15\u7528\u7684\u7B54\u6848", useCases: ["\u4FE1\u606F\u68C0\u7D22", "\u7814\u7A76\u8C03\u7814", "\u4E8B\u5B9E\u6838\u67E5", "\u7ADE\u54C1\u5206\u6790"], officialUrl: "https://perplexity.ai", tags: ["\u641C\u7D22", "\u5F15\u7528"] },
  { id: "tiangong", name: "\u5929\u5DE5AI\u641C\u7D22", category: "AI\u641C\u7D22", isDomestic: true, pricing: "free", description: "\u6606\u4ED1\u4E07\u7EF4\u51FA\u54C1\uFF0C\u514D\u8D39AI\u641C\u7D22\u5F15\u64CE\uFF0C\u652F\u6301\u4E2D\u6587\u641C\u7D22", useCases: ["\u4FE1\u606F\u641C\u7D22", "\u77E5\u8BC6\u95EE\u7B54", "\u65B0\u95FB\u8FFD\u8E2A", "\u5B66\u672F\u68C0\u7D22"], officialUrl: "https://www.tiangong.cn", tags: ["\u56FD\u4EA7", "\u514D\u8D39", "\u641C\u7D22"] },
  // === PPT/演示 ===
  { id: "gamma", name: "Gamma", category: "AI\u6F14\u793A", isDomestic: false, pricing: "freemium", description: "AI\u9A71\u52A8\u7684\u6F14\u793A\u6587\u7A3F\u751F\u6210\u5DE5\u5177\uFF0C\u4E00\u952E\u751F\u6210\u4E13\u4E1APPT", useCases: ["PPT\u5236\u4F5C", "\u63D0\u6848\u6F14\u793A", "\u62A5\u544A\u5C55\u793A", "\u57F9\u8BAD\u6750\u6599"], officialUrl: "https://gamma.app", tags: ["PPT", "\u81EA\u52A8\u751F\u6210"] },
  { id: "aippt", name: "AiPPT", category: "AI\u6F14\u793A", isDomestic: true, pricing: "freemium", description: "\u56FD\u4EA7AI PPT\u751F\u6210\u5DE5\u5177\uFF0C\u652F\u6301\u4E00\u952E\u751F\u6210\u548C\u6A21\u677F\u5B9A\u5236", useCases: ["PPT\u5236\u4F5C", "\u6C47\u62A5\u6750\u6599", "\u57F9\u8BAD\u8BFE\u4EF6", "\u65B9\u6848\u5C55\u793A"], officialUrl: "https://www.aippt.cn", tags: ["\u56FD\u4EA7", "PPT", "\u6A21\u677F"] },
  // === 翻译 ===
  { id: "deepl", name: "DeepL", category: "AI\u7FFB\u8BD1", isDomestic: false, pricing: "freemium", description: "\u9AD8\u8D28\u91CFAI\u7FFB\u8BD1\u5DE5\u5177\uFF0C\u652F\u6301\u6587\u6863\u7FFB\u8BD1\u548C\u672F\u8BED\u5B9A\u5236", useCases: ["\u6587\u6863\u7FFB\u8BD1", "\u7F51\u9875\u7FFB\u8BD1", "\u4E13\u4E1A\u672F\u8BED", "\u591A\u8BED\u8A00"], officialUrl: "https://www.deepl.com", tags: ["\u7FFB\u8BD1", "\u9AD8\u8D28\u91CF"] },
  { id: "volcengine-translate", name: "\u706B\u5C71\u7FFB\u8BD1", category: "AI\u7FFB\u8BD1", isDomestic: true, pricing: "freemium", description: "\u5B57\u8282\u8DF3\u52A8\u65D7\u4E0B\u7FFB\u8BD1\u670D\u52A1\uFF0C\u652F\u6301\u6587\u6863\u548C\u5B9E\u65F6\u7FFB\u8BD1", useCases: ["\u6587\u6863\u7FFB\u8BD1", "\u5B9E\u65F6\u7FFB\u8BD1", "\u5B57\u5E55\u7FFB\u8BD1", "\u7F51\u7AD9\u672C\u5730\u5316"], officialUrl: "https://translate.volcengine.com", tags: ["\u56FD\u4EA7", "\u5B9E\u65F6"] },
  { id: "lovart", name: "Lovart", category: "AI\u8BBE\u8BA1", isDomestic: false, pricing: "freemium", description: "\u5168\u7403\u9996\u4E2AAI\u8BBE\u8BA1Agent\uFF0C\u81EA\u52A8\u5316\u5B8C\u6210\u54C1\u724C\u8BBE\u8BA1\u5168\u6D41\u7A0B\uFF0C\u7EDF\u4E00\u8272\u5F69\u3001\u5E03\u5C40\u548C\u98CE\u683C", useCases: ["\u54C1\u724C\u8BBE\u8BA1", "\u6D77\u62A5\u751F\u6210", "Logo\u8BBE\u8BA1", "\u8425\u9500\u7269\u6599"], officialUrl: "https://www.lovart.ai", tags: ["Agent", "\u54C1\u724C", "\u6700\u65B0"] },
  { id: "seedance", name: "Seedance 2.0", category: "AI\u89C6\u9891", isDomestic: true, pricing: "freemium", description: "\u5B57\u8282\u8DF3\u52A8\u65D7\u8230\u89C6\u9891\u751F\u6210\u6A21\u578B\uFF0C\u652F\u6301\u56FE/\u6587/\u97F3\u9891\u591A\u6A21\u6001\u8F93\u5165\uFF0C\u7535\u5F71\u7EA7\u8FD0\u52A8\u5408\u6210", useCases: ["\u7535\u5F71\u77ED\u7247", "\u5E7F\u544A\u5236\u4F5C", "\u521B\u610F\u89C6\u9891", "\u52A8\u753B\u751F\u6210"], officialUrl: "https://seed.bytedance.com", tags: ["\u56FD\u4EA7", "\u7535\u5F71\u7EA7", "\u6700\u65B0"] },
  { id: "happyhorse", name: "HappyHorse", category: "AI\u89C6\u9891", isDomestic: false, pricing: "freemium", description: "\u4E00\u4F53\u5316AI\u89C6\u9891\u5E73\u53F0\uFF0C\u539F\u751F1080p\u8F93\u51FA\uFF0C\u97F3\u89C6\u9891\u8054\u5408\u751F\u6210\uFF0C\u591A\u955C\u5934\u53D9\u4E8B", useCases: ["\u89C6\u9891\u521B\u4F5C", "\u5E7F\u544A\u7D20\u6750", "\u793E\u4EA4\u5A92\u4F53", "\u4EA7\u54C1\u5C55\u793A"], officialUrl: "https://www.happyhorse.com", tags: ["\u4E00\u4F53\u5316", "1080p", "\u6700\u65B0"] }
];
function getAllCategories() {
  return Array.from(new Set(AI_TOOLS_DATABASE.map((t2) => t2.category)));
}
function matchToolsForUseCase(useCase, limit = 6) {
  const matched = AI_TOOLS_DATABASE.filter(
    (t2) => t2.useCases.some((uc) => uc.includes(useCase)) || t2.tags.some((tag) => tag.includes(useCase))
  );
  const domestic = matched.filter((t2) => t2.isDomestic).sort((a, b) => {
    const pricingOrder = { free: 0, freemium: 1, paid: 2 };
    return pricingOrder[a.pricing] - pricingOrder[b.pricing];
  }).slice(0, limit);
  const international = matched.filter((t2) => !t2.isDomestic).slice(0, limit);
  return { domestic, international };
}
function getDomesticFreeTools() {
  return AI_TOOLS_DATABASE.filter((t2) => t2.isDomestic && (t2.pricing === "free" || t2.pricing === "freemium")).sort((a, b) => {
    if (a.pricing === "free" && b.pricing !== "free") return -1;
    if (a.pricing !== "free" && b.pricing === "free") return 1;
    return 0;
  });
}

// server/routers.ts
init_db();
init_schema();
function extractJsonFromLLMResponse(raw) {
  let cleaned = raw;
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1];
  }
  return cleaned.trim();
}
async function invokeAndParseJson(invoke, isEmpty, label) {
  const attempt = async () => {
    const response = await invoke();
    const content = response?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      if (content && typeof content === "object") {
        return { ok: !isEmpty(content), data: content, reason: "empty" };
      }
      return { ok: false, data: null, reason: "no_content" };
    }
    const parsed = robustParseJson(content);
    if (parsed.outcome === "failed" || parsed.data == null) {
      return { ok: false, data: null, reason: parsed.error || "parse_failed" };
    }
    if (isEmpty(parsed.data)) {
      return { ok: false, data: parsed.data, reason: "empty" };
    }
    return { ok: true, data: parsed.data };
  };
  let last = await attempt();
  if (!last.ok) {
    console.warn(`[${label}] \u9996\u6B21\u751F\u6210\u4E0D\u53EF\u7528(reason=${last.reason})\uFF0C\u81EA\u52A8\u91CD\u8BD5\u4E00\u6B21`);
    try {
      last = await attempt();
    } catch (e) {
      console.error(`[${label}] \u91CD\u8BD5\u8C03\u7528\u5F02\u5E38:`, e?.message || e);
    }
  }
  if (!last.ok) {
    throw new TRPCError4({
      code: "INTERNAL_SERVER_ERROR",
      message: `${label}\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\uFF08\u6A21\u578B\u8FD4\u56DE\u5185\u5BB9\u4E0D\u5B8C\u6574\uFF09`
    });
  }
  return last.data;
}
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  report: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq8(reports.userId, ctx.user.id)];
      if (ctx.companyId) {
        conditions.push(eq8(reports.companyId, ctx.companyId));
      }
      const result = await db.select().from(reports).where(and6(...conditions)).orderBy(desc3(reports.createdAt)).limit(50);
      return result;
    }),
    get: publicProcedure.input(z4.object({ reportId: z4.string(), token: z4.string().optional() })).query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(reports).where(eq8(reports.reportId, input.reportId)).limit(1);
      if (result.length === 0) return null;
      const report = result[0];
      if (input.token) {
        if (report.shareToken && report.shareToken === input.token) {
          return report;
        }
        const dist = await db.select().from(reportDistributions).where(and6(eq8(reportDistributions.reportId, input.reportId), eq8(reportDistributions.linkToken, input.token))).limit(1);
        if (dist.length > 0) {
          return report;
        }
      }
      const companyId = ctx.companyId;
      if (companyId && report.companyId && report.companyId !== companyId) {
        return null;
      }
      const isAdmin = ctx.user?.role === "admin";
      if (!isAdmin && !report.isPublic && (!ctx.user || ctx.user.id !== report.userId)) {
        return null;
      }
      return report;
    }),
    getByShareToken: publicProcedure.input(z4.object({ token: z4.string() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(reports).where(eq8(reports.shareToken, input.token)).limit(1);
      return result.length > 0 ? result[0] : null;
    }),
    generateShareLink: protectedProcedure.input(z4.object({ reportId: z4.string() })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const token = nanoid3(16);
      const conditions = [eq8(reports.reportId, input.reportId), eq8(reports.userId, ctx.user.id)];
      if (ctx.companyId) conditions.push(eq8(reports.companyId, ctx.companyId));
      await db.update(reports).set({ isPublic: 1, shareToken: token }).where(and6(...conditions));
      return { token };
    }),
    delete: protectedProcedure.input(z4.object({ reportId: z4.string() })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const conditions = [eq8(reports.reportId, input.reportId), eq8(reports.userId, ctx.user.id)];
      if (ctx.companyId) conditions.push(eq8(reports.companyId, ctx.companyId));
      await db.delete(reports).where(and6(...conditions));
      return { success: true };
    })
  }),
  user: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return ctx.user;
      const result = await db.select().from(users).where(eq8(users.id, ctx.user.id)).limit(1);
      return result[0] || ctx.user;
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalReports: 0, completedReports: 0, inviteCount: 0 };
      const conditions = [eq8(reports.userId, ctx.user.id)];
      if (ctx.companyId) conditions.push(eq8(reports.companyId, ctx.companyId));
      const allReports = await db.select().from(reports).where(and6(...conditions));
      const completed = allReports.filter((r) => r.status === "completed");
      return {
        totalReports: allReports.length,
        completedReports: completed.length,
        inviteCount: ctx.user.inviteCount || 0
      };
    })
  }),
  invitation: router({
    create: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const code = nanoid3(8);
      await db.insert(invitations).values({
        inviterId: ctx.user.id,
        inviteCode: code
      });
      return { code };
    }),
    myInvites: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(invitations).where(eq8(invitations.inviterId, ctx.user.id)).orderBy(desc3(invitations.createdAt));
    }),
    accept: protectedProcedure.input(z4.object({ inviteCode: z4.string() })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const inv = await db.select().from(invitations).where(and6(eq8(invitations.inviteCode, input.inviteCode), eq8(invitations.status, "pending"))).limit(1);
      if (inv.length === 0) return { success: false, message: "\u9080\u8BF7\u7801\u65E0\u6548\u6216\u5DF2\u4F7F\u7528" };
      const invitation = inv[0];
      if (invitation.inviterId === ctx.user.id) return { success: false, message: "\u4E0D\u80FD\u4F7F\u7528\u81EA\u5DF1\u7684\u9080\u8BF7\u7801" };
      await db.update(invitations).set({ inviteeId: ctx.user.id, status: "accepted" }).where(eq8(invitations.id, invitation.id));
      const inviter = await db.select().from(users).where(eq8(users.id, invitation.inviterId)).limit(1);
      if (inviter.length > 0) {
        await db.update(users).set({ inviteCount: (inviter[0].inviteCount || 0) + 1 }).where(eq8(users.id, invitation.inviterId));
      }
      return { success: true };
    })
  }),
  // SOTA AI工具数据库 (database-backed with static fallback)
  tools: router({
    list: publicProcedure.input(z4.object({ category: z4.string().optional(), search: z4.string().optional(), isDomestic: z4.boolean().optional(), pricing: z4.string().optional() }).optional()).query(async ({ input }) => {
      const dbTools = await getAllAITools({
        category: input?.category,
        isDomestic: input?.isDomestic,
        pricing: input?.pricing,
        search: input?.search
      });
      if (dbTools.length > 0) {
        return dbTools.map((t2) => ({
          id: t2.toolId,
          name: t2.name,
          category: t2.category,
          isDomestic: t2.isDomestic === 1,
          pricing: t2.pricing,
          description: t2.description || "",
          useCases: t2.useCases || [],
          officialUrl: t2.officialUrl || "",
          tags: t2.tags || [],
          updatedAt: t2.updatedAt ? t2.updatedAt.toISOString() : (/* @__PURE__ */ new Date()).toISOString()
        }));
      }
      const addTimestamp = (t2) => ({ ...t2, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      if (input?.category) {
        return AI_TOOLS_DATABASE.filter((t2) => t2.category === input.category).map(addTimestamp);
      }
      return AI_TOOLS_DATABASE.map(addTimestamp);
    }),
    categories: publicProcedure.query(async () => {
      const dbCats = await getAIToolCategories();
      return dbCats.length > 0 ? dbCats : getAllCategories();
    }),
    match: publicProcedure.input(z4.object({ useCase: z4.string(), limit: z4.number().optional() })).query(async ({ input }) => {
      const dbResult = await matchToolsFromDB(input.useCase, input.limit || 6);
      if (dbResult.domestic.length > 0 || dbResult.international.length > 0) {
        const mapTool = (t2) => ({
          id: t2.toolId,
          name: t2.name,
          category: t2.category,
          isDomestic: t2.isDomestic === 1,
          pricing: t2.pricing,
          description: t2.description || "",
          useCases: t2.useCases || [],
          officialUrl: t2.officialUrl || "",
          tags: t2.tags || []
        });
        return { domestic: dbResult.domestic.map(mapTool), international: dbResult.international.map(mapTool) };
      }
      return matchToolsForUseCase(input.useCase, input.limit || 6);
    }),
    domesticFree: publicProcedure.query(async () => {
      const dbTools = await getDomesticFreeToolsFromDB();
      if (dbTools.length > 0) {
        return dbTools.map((t2) => ({
          id: t2.toolId,
          name: t2.name,
          category: t2.category,
          isDomestic: t2.isDomestic === 1,
          pricing: t2.pricing,
          description: t2.description || "",
          useCases: t2.useCases || [],
          officialUrl: t2.officialUrl || "",
          tags: t2.tags || []
        }));
      }
      return getDomesticFreeTools();
    }),
    // Admin: add/update a tool
    upsert: protectedProcedure.input(z4.object({
      toolId: z4.string(),
      name: z4.string(),
      category: z4.string(),
      isDomestic: z4.boolean(),
      pricing: z4.enum(["free", "freemium", "paid"]),
      description: z4.string().optional(),
      useCases: z4.array(z4.string()).optional(),
      officialUrl: z4.string().optional(),
      tags: z4.array(z4.string()).optional()
    })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      await upsertAITool({
        toolId: input.toolId,
        name: input.name,
        category: input.category,
        isDomestic: input.isDomestic ? 1 : 0,
        pricing: input.pricing,
        description: input.description || "",
        useCases: input.useCases || [],
        officialUrl: input.officialUrl || "",
        tags: input.tags || []
      });
      return { success: true };
    }),
    // Admin: soft-delete a tool
    delete: protectedProcedure.input(z4.object({ toolId: z4.string() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError4({ code: "FORBIDDEN" });
      await deleteAITool(input.toolId);
      return { success: true };
    })
  }),
  // AI-powered strategy optimization
  ai: router({
    optimizeStrategy: publicProcedure.input(z4.object({
      category: z4.string(),
      description: z4.string(),
      probability: z4.string(),
      impact: z4.string(),
      currentMitigation: z4.string()
    })).mutation(async ({ input, ctx }) => {
      const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
      const llmContext = { companyId: ctx.companyId, userId: ctx.user?.id, phone: ctx.userPhone, feature: "risk_optimization" };
      const response = await invokeLLM2({
        messages: [
          { role: "system", content: "\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u7684\u4F01\u4E1A\u98CE\u9669\u7BA1\u7406\u4E13\u5BB6\u548CAI\u8F6C\u578B\u987E\u95EE\u3002\u8BF7\u57FA\u4E8E\u7528\u6237\u63D0\u4F9B\u7684\u98CE\u9669\u4FE1\u606F\uFF0C\u7ED9\u51FA\u66F4\u4F18\u5316\u7684\u5E94\u5BF9\u7B56\u7565\u5EFA\u8BAE\u3002\u56DE\u590D\u5FC5\u987B\u662FJSON\u683C\u5F0F\u3002" },
          { role: "user", content: `\u8BF7\u4E3A\u4EE5\u4E0B\u98CE\u9669\u63D0\u4F9B\u4F18\u5316\u7684\u5E94\u5BF9\u7B56\u7565\u5EFA\u8BAE\uFF1A

\u98CE\u9669\u7C7B\u522B\uFF1A${input.category}
\u98CE\u9669\u63CF\u8FF0\uFF1A${input.description}
\u53D1\u751F\u6982\u7387\uFF1A${input.probability}
\u5F71\u54CD\u7A0B\u5EA6\uFF1A${input.impact}
\u5F53\u524D\u7F13\u89E3\u63AA\u65BD\uFF1A${input.currentMitigation}

\u8BF7\u63D0\u4F9B3\u6761\u5177\u4F53\u7684\u4F18\u5316\u5EFA\u8BAE\uFF0C\u6BCF\u6761\u5EFA\u8BAE\u5305\u542B\u6807\u9898\u548C\u8BE6\u7EC6\u8BF4\u660E\u3002` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "strategy_optimization",
            strict: true,
            schema: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "\u5EFA\u8BAE\u6807\u9898" },
                      detail: { type: "string", description: "\u8BE6\u7EC6\u8BF4\u660E" },
                      priority: { type: "string", description: "\u4F18\u5148\u7EA7\uFF1A\u9AD8/\u4E2D/\u4F4E" }
                    },
                    required: ["title", "detail", "priority"],
                    additionalProperties: false
                  }
                },
                summary: { type: "string", description: "\u603B\u7ED3\u6027\u5EFA\u8BAE" }
              },
              required: ["suggestions", "summary"],
              additionalProperties: false
            }
          }
        }
      }, llmContext);
      const content = response.choices[0]?.message?.content;
      if (typeof content === "string") {
        return JSON.parse(extractJsonFromLLMResponse(content));
      }
      return content;
    })
  }),
  // Feedback (P1-11)
  feedback: router({
    submit: publicProcedure.input(z4.object({
      reportId: z4.string(),
      chapterIndex: z4.number().optional(),
      rating: z4.number().min(1).max(5),
      comment: z4.string().optional()
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(reportFeedback).values({
        reportId: input.reportId,
        chapterIndex: input.chapterIndex ?? null,
        rating: input.rating,
        comment: input.comment || null
      });
      return { success: true };
    }),
    list: protectedProcedure.input(z4.object({ reportId: z4.string() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(reportFeedback).where(eq8(reportFeedback.reportId, input.reportId)).orderBy(desc3(reportFeedback.createdAt));
    })
  }),
  // Brand settings (P1-03)
  brand: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(brandSettings).where(eq8(brandSettings.userId, ctx.user.id)).limit(1);
      return result[0] || null;
    }),
    save: protectedProcedure.input(z4.object({ logoUrl: z4.string().optional(), primaryColor: z4.string().optional(), footerText: z4.string().optional() })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const existing = await db.select().from(brandSettings).where(eq8(brandSettings.userId, ctx.user.id)).limit(1);
      if (existing.length > 0) {
        await db.update(brandSettings).set({ logoUrl: input.logoUrl, primaryColor: input.primaryColor, footerText: input.footerText }).where(eq8(brandSettings.userId, ctx.user.id));
      } else {
        await db.insert(brandSettings).values({ userId: ctx.user.id, logoUrl: input.logoUrl, primaryColor: input.primaryColor, footerText: input.footerText });
      }
      return { success: true };
    })
  }),
  // Report distribution (P1-06)
  distribution: router({
    create: protectedProcedure.input(z4.object({ reportId: z4.string(), recipientName: z4.string().optional(), recipientEmail: z4.string().optional(), viewPerspective: z4.enum(["hr", "staff", "executive"]).optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const token = nanoid3(16);
      await db.insert(reportDistributions).values({
        reportId: input.reportId,
        recipientName: input.recipientName || null,
        recipientEmail: input.recipientEmail || null,
        linkToken: token,
        viewPerspective: input.viewPerspective || "staff"
      });
      return { token };
    }),
    list: protectedProcedure.input(z4.object({ reportId: z4.string() })).query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(reportDistributions).where(eq8(reportDistributions.reportId, input.reportId)).orderBy(desc3(reportDistributions.createdAt));
    }),
    trackOpen: publicProcedure.input(z4.object({ token: z4.string(), progress: z4.number().optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const now = /* @__PURE__ */ new Date();
      const updates = { lastReadAt: now };
      if (input.progress !== void 0) updates.readProgress = input.progress;
      const existing = await db.select().from(reportDistributions).where(eq8(reportDistributions.linkToken, input.token)).limit(1);
      if (existing.length > 0 && !existing[0].openedAt) updates.openedAt = now;
      await db.update(reportDistributions).set(updates).where(eq8(reportDistributions.linkToken, input.token));
      return { success: true };
    })
  }),
  // Action plan generator (P1-07)
  actionPlan: router({
    generate: protectedProcedure.input(z4.object({ reportId: z4.string(), jobTitle: z4.string(), replaceabilityRate: z4.number(), risks: z4.array(z4.string()), tools: z4.array(z4.string()) })).mutation(async ({ input, ctx }) => {
      const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
      const llmContext = { companyId: ctx.companyId, userId: ctx.user.id, phone: ctx.userPhone, feature: "action_plan" };
      const invoke = () => invokeLLM2({
        messages: [
          { role: "system", content: "\u4F60\u662F\u4E00\u4F4D\u8D44\u6DF1\u7684\u4F01\u4E1AAI\u8F6C\u578B\u987E\u95EE\u3002\u8BF7\u57FA\u4E8E\u5C97\u4F4D\u5206\u6790\u6570\u636E\uFF0C\u751F\u6210\u4E00\u4EFD\u5B63\u5EA6\u884C\u52A8\u8BA1\u5212\u3002\u53EA\u8F93\u51FA\u4E25\u683C\u5408\u6CD5\u7684 JSON\uFF0C\u4E0D\u8981\u5305\u542B\u4EFB\u4F55\u89E3\u91CA\u6027\u6587\u5B57\u6216 markdown \u4EE3\u7801\u5757\u3002" },
          { role: "user", content: `\u8BF7\u4E3A\u4EE5\u4E0B\u5C97\u4F4D\u751F\u6210\u5B63\u5EA6AI\u8F6C\u578B\u884C\u52A8\u8BA1\u5212\uFF1A

\u5C97\u4F4D\uFF1A${input.jobTitle}
AI\u66FF\u4EE3\u7387\uFF1A${input.replaceabilityRate}%
\u4E3B\u8981\u98CE\u9669\uFF1A${input.risks.join("\u3001")}
\u63A8\u8350\u5DE5\u5177\uFF1A${input.tools.join("\u3001")}

\u8BF7\u751F\u62104\u4E2A\u9636\u6BB5\uFF08\u6BCF\u6708\u4E00\u4E2A+\u603B\u7ED3\uFF09\uFF0C\u6BCF\u4E2A\u9636\u6BB5\u5305\u542B\u76EE\u6807\u3001\u5177\u4F53\u884C\u52A8\u9879\u3001\u9884\u671F\u6210\u679C\u548C\u5173\u952E\u91CC\u7A0B\u7891\u3002` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "action_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                phases: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      duration: { type: "string" },
                      objective: { type: "string" },
                      actions: { type: "array", items: { type: "string" } },
                      milestone: { type: "string" },
                      expectedOutcome: { type: "string" }
                    },
                    required: ["title", "duration", "objective", "actions", "milestone", "expectedOutcome"],
                    additionalProperties: false
                  }
                },
                summary: { type: "string" }
              },
              required: ["phases", "summary"],
              additionalProperties: false
            }
          }
        }
      }, llmContext);
      return await invokeAndParseJson(
        invoke,
        (d) => !d || !Array.isArray(d.phases) || d.phases.length === 0,
        "\u884C\u52A8\u8BA1\u5212"
      );
    })
  }),
  // Executive summary generator (P1-08)
  executiveSummary: router({
    generate: protectedProcedure.input(z4.object({ reportId: z4.string(), jobTitle: z4.string(), replaceabilityRate: z4.number(), keyFindings: z4.array(z4.string()), recommendations: z4.array(z4.string()) })).mutation(async ({ input, ctx }) => {
      const { invokeLLM: invokeLLM2 } = await Promise.resolve().then(() => (init_llm(), llm_exports));
      const llmContext = { companyId: ctx.companyId, userId: ctx.user.id, phone: ctx.userPhone, feature: "executive_summary" };
      const invoke = () => invokeLLM2({
        messages: [
          { role: "system", content: "\u4F60\u662F\u4E00\u4F4D\u4F01\u4E1A\u7BA1\u7406\u54A8\u8BE2\u987E\u95EE\u3002\u8BF7\u57FA\u4E8E\u5C97\u4F4DAI\u8F6C\u578B\u5206\u6790\u7ED3\u679C\uFF0C\u751F\u6210\u4E00\u4EFD\u9002\u5408\u7BA1\u7406\u5C42\u9605\u8BFB\u7684\u6C47\u62A5\u6458\u8981\u3002\u53EA\u8F93\u51FA\u4E25\u683C\u5408\u6CD5\u7684 JSON\uFF0C\u4E0D\u8981\u5305\u542B\u4EFB\u4F55\u89E3\u91CA\u6027\u6587\u5B57\u6216 markdown \u4EE3\u7801\u5757\u3002" },
          { role: "user", content: `\u8BF7\u4E3A\u4EE5\u4E0B\u5C97\u4F4D\u5206\u6790\u751F\u6210\u7BA1\u7406\u5C42\u6C47\u62A5\u6750\u6599\uFF1A

\u5C97\u4F4D\uFF1A${input.jobTitle}
AI\u66FF\u4EE3\u7387\uFF1A${input.replaceabilityRate}%
\u5173\u952E\u53D1\u73B0\uFF1A${input.keyFindings.join("\uFF1B")}
\u5EFA\u8BAE\u63AA\u65BD\uFF1A${input.recommendations.join("\uFF1B")}

\u8BF7\u751F\u62103-5\u9875\u5E7B\u706F\u7247\u5185\u5BB9\uFF0C\u6BCF\u9875\u5305\u542B\u6807\u9898\u3001\u8981\u70B9\u548C\u6570\u636E\u652F\u6491\u3002` }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "executive_summary",
            strict: true,
            schema: {
              type: "object",
              properties: {
                slides: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      bulletPoints: { type: "array", items: { type: "string" } },
                      dataHighlight: { type: "string" }
                    },
                    required: ["title", "bulletPoints", "dataHighlight"],
                    additionalProperties: false
                  }
                },
                conclusion: { type: "string" }
              },
              required: ["slides", "conclusion"],
              additionalProperties: false
            }
          }
        }
      }, llmContext);
      return await invokeAndParseJson(
        invoke,
        (d) => !d || !Array.isArray(d.slides) || d.slides.length === 0,
        "\u7BA1\u7406\u5C42\u6C47\u62A5"
      );
    })
  }),
  // 平台级大模型路由管理
  adminLlm: llmModelRouter,
  adminLlmLog: llmLogRouter,
  // Permission check utility
  permission: router({
    check: protectedProcedure.input(z4.object({ feature: z4.string() })).query(({ input, ctx }) => {
      return checkPermission(ctx.user, input.feature);
    })
  })
});
function checkPermission(user, feature) {
  const tier = user?.tier || "free";
  const proFeatures = ["ppt_export", "batch_analysis", "no_watermark", "custom_template", "priority_queue"];
  const enterpriseFeatures = [...proFeatures, "team_management", "api_access", "sso"];
  if (tier === "enterprise") return { allowed: true, tier };
  if (tier === "pro") return { allowed: proFeatures.includes(feature), tier };
  return { allowed: !proFeatures.includes(feature), tier };
}

// server/exportRoutes.ts
import puppeteer from "puppeteer-core";
import { execSync as execSync2 } from "child_process";
import fs2 from "fs";
import path2 from "path";
function isSnapWrapped(p) {
  try {
    const real = fs2.realpathSync(p);
    if (real.includes("/snap/")) return true;
    const stat = fs2.lstatSync(p);
    if (stat.size < 4096) {
      const head = fs2.readFileSync(p, "utf-8").slice(0, 512);
      if (head.includes("snap") || head.includes("#!/bin/sh") && head.includes("chromium")) return true;
    }
  } catch {
  }
  return false;
}
function findChromiumPath() {
  const preferred = [
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/opt/google/chrome/chrome",
    "/usr/lib/chromium/chromium",
    "/usr/lib/chromium-browser/chromium-browser"
  ];
  for (const p of preferred) {
    if (fs2.existsSync(p)) return p;
  }
  for (const p of ["/usr/bin/chromium", "/usr/bin/chromium-browser"]) {
    if (fs2.existsSync(p) && !isSnapWrapped(p)) return p;
  }
  for (const p of ["/usr/bin/chromium", "/usr/bin/chromium-browser", "/snap/bin/chromium"]) {
    if (fs2.existsSync(p)) {
      console.warn(`[PDF Export] \u4EC5\u627E\u5230\u53EF\u80FD\u4E3A snap \u7248\u7684 Chromium: ${p}\uFF0C\u5BFC\u51FA\u53EF\u80FD\u56E0 AppArmor \u5931\u8D25\u3002\u5EFA\u8BAE\u5B89\u88C5 google-chrome-stable(.deb)\u3002`);
      return p;
    }
  }
  try {
    const result = execSync2("which google-chrome-stable || which google-chrome || which chromium || which chromium-browser 2>/dev/null", { encoding: "utf-8" }).trim();
    if (result) return result;
  } catch {
  }
  throw new Error("Chromium/Chrome not found. Please install: sudo apt install -y google-chrome-stable \u6216\u4E0B\u8F7D Google Chrome .deb \u5B89\u88C5");
}
async function resolveUser2(req) {
  const iframeUser = req.iframeUser;
  if (iframeUser) return iframeUser;
  const adminUser = await authenticateAdmin(req);
  if (adminUser) return adminUser;
  try {
    const u = await sdk.authenticateRequest(req);
    if (u) return u;
  } catch {
  }
  try {
    return await getOrCreateGuestUser();
  } catch {
    return null;
  }
}
var activeBrowsers = /* @__PURE__ */ new Map();
async function generatePdfInBackground(reportId, serverPort) {
  const OVERALL_TIMEOUT_MS = 24e4;
  let timedOut = false;
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      timedOut = true;
      reject(new Error("PDF\u751F\u6210\u603B\u8D85\u65F6(240s)\uFF0C\u53EF\u80FD\u9875\u9762\u56FE\u8868\u6E32\u67D3\u8FC7\u6162\uFF0C\u8BF7\u91CD\u8BD5"));
    }, OVERALL_TIMEOUT_MS);
  });
  try {
    await Promise.race([generatePdfCore(reportId, serverPort), timeoutPromise]);
  } catch (error) {
    const stuckBrowser = activeBrowsers.get(reportId);
    if (stuckBrowser) {
      try {
        await stuckBrowser.close();
      } catch {
      }
      activeBrowsers.delete(reportId);
    }
    console.error(`[PDF Export] Background task failed for ${reportId}${timedOut ? " (\u603B\u8D85\u65F6\u7184\u65AD)" : ""}:`, error?.message || error);
    try {
      const db = await getDb();
      if (db) {
        await db.update(reports).set({ pdfStatus: "error", pdfError: (error?.message || "Unknown error").slice(0, 500) }).where(eq9(reports.reportId, reportId));
      }
    } catch {
    }
  }
}
async function generatePdfCore(reportId, serverPort) {
  let browser = null;
  try {
    const db = await getDb();
    if (!db) throw new Error("DB unavailable");
    await db.update(reports).set({ pdfStatus: "generating", pdfError: null }).where(eq9(reports.reportId, reportId));
    const result = await db.select().from(reports).where(eq9(reports.reportId, reportId)).limit(1);
    if (result.length === 0) throw new Error("Report not found");
    const report = result[0];
    let brandLogoUrl = null;
    try {
      if (report.userId != null) {
        const ownerRows = await db.select().from(brandSettings).where(eq9(brandSettings.userId, report.userId)).limit(1);
        if (ownerRows.length > 0 && ownerRows[0].logoUrl) brandLogoUrl = ownerRows[0].logoUrl;
      }
      if (!brandLogoUrl) {
        const anyRows = await db.select().from(brandSettings).limit(20);
        const withLogo = anyRows.find((r) => !!r.logoUrl);
        if (withLogo?.logoUrl) brandLogoUrl = withLogo.logoUrl;
      }
    } catch (e) {
      console.warn(`[PDF Export] \u67E5\u8BE2\u54C1\u724C Logo \u5931\u8D25\uFF08\u5FFD\u7565\uFF09: ${e?.message || e}`);
    }
    let brandLogoDataUri = null;
    if (brandLogoUrl) {
      try {
        const resp = await fetch(brandLogoUrl);
        if (resp.ok) {
          const arrayBuf = await resp.arrayBuffer();
          const contentType = resp.headers.get("content-type") || "image/png";
          const base64 = Buffer.from(arrayBuf).toString("base64");
          brandLogoDataUri = `data:${contentType};base64,${base64}`;
          console.log(`[PDF Export] Brand logo downloaded & inlined as base64 (${(base64.length / 1024).toFixed(1)} KB)`);
        } else {
          console.warn(`[PDF Export] \u4E0B\u8F7D\u54C1\u724C Logo \u5931\u8D25 HTTP ${resp.status}\uFF0C\u56DE\u9000\u4F7F\u7528\u539F\u59CB URL`);
        }
      } catch (e) {
        console.warn(`[PDF Export] \u4E0B\u8F7D\u54C1\u724C Logo \u5F02\u5E38\uFF08\u56DE\u9000\u4F7F\u7528\u539F\u59CB URL\uFF09: ${e?.message || e}`);
      }
    }
    let accessToken = report.shareToken;
    if (!accessToken) {
      const { nanoid: nanoid4 } = await import("nanoid");
      accessToken = nanoid4(24);
      await db.update(reports).set({ shareToken: accessToken }).where(eq9(reports.reportId, reportId));
    }
    const pageUrl = `http://127.0.0.1:${serverPort}/report/${reportId}?token=${accessToken}&print=1`;
    console.log(`[PDF Export] Background task started for ${reportId}, URL: ${pageUrl}`);
    const chromiumPath = findChromiumPath();
    browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=IsolateOrigins,site-per-process",
        "--js-flags=--max-old-space-size=2048",
        "--disable-extensions",
        "--disable-background-networking"
      ],
      protocolTimeout: 3e5
      // [修复] 30分钟→ 5分钟，避免协议层长时间挂起
    });
    activeBrowsers.set(reportId, browser);
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    page.on("console", (msg) => {
      if (msg.type() === "error") console.log(`[PDF Export] Page error: ${msg.text()}`);
    });
    page.on("pageerror", (err) => console.log(`[PDF Export] Page exception: ${err.message}`));
    console.log(`[PDF Export] Navigating...`);
    try {
      await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 18e4 });
    } catch (navErr) {
      console.log(`[PDF Export] networkidle2 \u8D85\u65F6\uFF0C\u56DE\u9000\u5230 domcontentloaded: ${navErr.message}`);
      await page.goto(pageUrl, { waitUntil: "domcontentloaded", timeout: 12e4 }).catch(() => {
      });
    }
    console.log(`[PDF Export] Waiting for content...`);
    try {
      await page.waitForSelector('main h1, main h2, [class*="report"], [class*="Report"]', { timeout: 25e3 });
    } catch {
      await page.waitForSelector("main, #root", { timeout: 1e4 }).catch(() => {
      });
    }
    console.log(`[PDF Export] Switching to light theme for PDF...`);
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("print-mode");
      const style = document.createElement("style");
      style.textContent = `
        /* ============================================ */
        /* PDF Export Styles - Light Theme + Layout Fix */
        /* ============================================ */

        /* Base: force light theme and print colors */
        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          box-sizing: border-box;
        }
        body {
          background: white !important;
          color: #1a1a2e !important;
        }

        /* Override hardcoded dark backgrounds */
        [style*="rgba(13,13,20"], [style*="rgba(18,18,30"], [style*="rgba(10,10,18"],
        [style*="rgb(13, 13, 20"], [style*="rgb(18, 18, 30"], [style*="rgb(10, 10, 18"],
        [style*="rgba(20,20,35"], [style*="rgba(12,12,22"] {
          background-color: #f8f9fa !important;
          background-image: none !important;
        }
        [style*="linear-gradient"] {
          background-image: none !important;
          background-color: #f8f9fa !important;
        }

        /* Fix text colors designed for dark backgrounds */
        .text-white, .text-white/90, .text-white/80, .text-white/75,
        .text-white/70, .text-white/60, .text-white/50,
        .text-white/85 {
          color: #1a1a2e !important;
        }

        /* Fix border colors */
        [class*="border-white"] {
          border-color: rgba(0, 0, 0, 0.12) !important;
        }

        /* Fix glass panels and cards */
        .glass-panel, .glass-card {
          background: rgba(255, 255, 255, 0.9) !important;
          border-color: rgba(0, 0, 0, 0.1) !important;
        }

        /* Fix muted/card backgrounds */
        [class*="bg-muted"], [class*="bg-card"], [class*="bg-secondary"] {
          background-color: #f3f4f6 !important;
        }
        [class*="bg-white/"] {
          background-color: rgba(255, 255, 255, 0.8) !important;
        }

        /* ============================================ */
        /* LAYOUT FIXES: Force responsive breakpoints  */
        /* A4 = ~794px, so md: (768px) should apply    */
        /* but some layouts still break. Force them.    */
        /* ============================================ */

        /* Force all md:grid-cols-2 to actually be 2 columns */
        .md:grid-cols-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        .md:grid-cols-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
        .md:grid-cols-4 {
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        }
        .lg:grid-cols-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }

        /* BeforeAfterComparison: force 3-column layout (before | arrow | after) */
        .md:grid-cols-[1fr_48px_1fr] {
          grid-template-columns: 1fr 48px 1fr !important;
        }
        /* Show the md:flex arrow, hide the mobile arrow */
        .hidden.md:flex {
          display: flex !important;
        }
        .flex.md:hidden {
          display: none !important;
        }
        .md:col-span-2 {
          grid-column: span 2 / span 2 !important;
        }

        /* ============================================ */
        /* PREVENT TEXT VERTICAL STACKING               */
        /* ============================================ */

        /* Ensure all text containers have minimum width */
        .rounded-xl, .rounded-lg, .rounded-2xl {
          min-width: 0;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        /* Prevent grid items from being too narrow */
        [class*="grid"] > div {
          min-width: 0;
          overflow: hidden;
        }

        /* Fix flex items wrapping */
        .flex-wrap {
          flex-wrap: wrap !important;
        }

        /* ============================================ */
        /* PAGE BREAK CONTROL                           */
        /* ============================================ */

        section {
          page-break-inside: auto;
        }
        /* Avoid breaking inside cards */
        .bg-card, .rounded-xl, .rounded-2xl {
          page-break-inside: avoid;
        }
        /* Allow page break between major sections */
        section + section {
          page-break-before: auto;
        }
        /* Avoid orphan headers */
        h1, h2, h3, h4, h5 {
          page-break-after: avoid;
        }

        /* ============================================ */
        /* CHART AND MEDIA FIXES                        */
        /* ============================================ */

        /* Center all ECharts chart containers */
        [_echarts_instance_],
        [class*="echarts-for"],
        div[_echarts_instance_] {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* Center chart wrapper divs */
        section > div > div:has(canvas),
        section > div > div:has(svg) {
          display: flex !important;
          justify-content: center !important;
        }

        /* ============================================ */
        /* HIDE NON-PRINT ELEMENTS                      */
        /* ============================================ */

        .report-feedback-section {
          display: none !important;
        }
        /* Hide interactive-only elements */
        button[class*="hover:"] {
          pointer-events: none;
        }

        /* ============================================ */
        /* MAIN CONTENT AREA: ensure full width         */
        /* ============================================ */

        main {
          max-width: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        main > .mb-8, main > .mb-10, main > .mb-12 {
          margin-left: 0 !important;
          margin-right: 0 !important;
        }

        /* Ensure text is always horizontal */
        * {
          writing-mode: horizontal-tb !important;
          text-orientation: mixed !important;
        }

        /* Fix green/red tool recommendation text colors for light bg */
        .text-green-300/80, .text-green-400/60, .text-red-400/50, .text-red-400/60 {
          color: inherit !important;
        }
        .text-green-400 { color: #16a34a !important; }
        .text-red-400 { color: #dc2626 !important; }
        .text-emerald-400 { color: #059669 !important; }
        .text-sky-400 { color: #0284c7 !important; }
        .text-primary { color: #0d9488 !important; }
      `;
      document.head.appendChild(style);
    });
    const logoSrc = brandLogoDataUri || brandLogoUrl;
    if (logoSrc) {
      console.log(`[PDF Export] Injecting brand logo... (${brandLogoDataUri ? "base64" : "url"})`);
      const injected = await page.evaluate((src) => {
        if (document.querySelector(".print-brand-header img")) return true;
        const main = document.querySelector("main");
        if (!main) return false;
        const titleBlock = main.querySelector(".mb-8") || main.firstElementChild || main;
        const wrapper = document.createElement("div");
        wrapper.className = "print-brand-header";
        wrapper.style.cssText = "display:block;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e5e7eb;";
        const img = document.createElement("img");
        img.src = src;
        img.style.cssText = "max-height:48px;max-width:240px;object-fit:contain;display:block;";
        wrapper.appendChild(img);
        if (titleBlock === main) {
          main.insertBefore(wrapper, main.firstChild);
        } else {
          titleBlock.insertBefore(wrapper, titleBlock.firstChild);
        }
        return true;
      }, logoSrc);
      console.log(`[PDF Export] Brand logo injected: ${injected}`);
      await page.evaluate(async () => {
        const img = document.querySelector(".print-brand-header img");
        if (img && !img.complete) {
          await new Promise((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            setTimeout(() => resolve(), 8e3);
          });
        }
      });
    }
    console.log(`[PDF Export] Waiting for charts...`);
    await new Promise((r) => setTimeout(r, 4e3));
    console.log(`[PDF Export] Scrolling to load all content...`);
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 300;
        const maxScrolls = 500;
        let scrollCount = 0;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          scrollCount++;
          if (totalHeight >= document.body.scrollHeight || scrollCount >= maxScrolls) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 150);
      });
    });
    await new Promise((r) => setTimeout(r, 3e3));
    console.log(`[PDF Export] Generating PDF buffer...`);
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      preferCSSPageSize: false,
      timeout: 18e4
      // [修复] 30分钟→ 3分钟
    });
    await browser.close();
    browser = null;
    activeBrowsers.delete(reportId);
    const pdfNodeBuffer = Buffer.from(pdfBuffer);
    const pdfSize = pdfNodeBuffer.length;
    console.log(`[PDF Export] PDF generated, size: ${pdfSize} bytes`);
    if (pdfSize < 1024) {
      throw new Error(`PDF file too small (${pdfSize} bytes), likely corrupted or empty`);
    }
    const header = pdfNodeBuffer.slice(0, 5).toString("ascii");
    if (header !== "%PDF-") {
      throw new Error(`Invalid PDF header: ${header}`);
    }
    const pdfDir = path2.resolve(process.cwd(), "storage", "exports", "pdf");
    if (!fs2.existsSync(pdfDir)) {
      fs2.mkdirSync(pdfDir, { recursive: true });
    }
    const safeFileName = `${reportId}.pdf`;
    const pdfFilePath = path2.join(pdfDir, safeFileName);
    fs2.writeFileSync(pdfFilePath, pdfNodeBuffer);
    const pdfUrl = `/exports/pdf/${safeFileName}`;
    await db.update(reports).set({ pdfStatus: "ready", pdfUrl, pdfError: null }).where(eq9(reports.reportId, reportId));
    console.log(`[PDF Export] Success! Report ${reportId} PDF stored at: ${pdfUrl}`);
  } catch (error) {
    console.error(`[PDF Export] Background task failed for ${reportId}:`, error);
    if (browser) {
      try {
        await browser.close();
      } catch {
      }
    }
    activeBrowsers.delete(reportId);
    throw error;
  }
}
function registerExportRoutes(app) {
  app.post("/api/export/:reportId/pdf", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "DB unavailable" });
        return;
      }
      const reportId = req.params.reportId;
      const token = req.query.token;
      const force = req.query.force === "1";
      const result = await db.select().from(reports).where(eq9(reports.reportId, reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      const report = result[0];
      let hasAccess = false;
      const user = await resolveUser2(req);
      if (user && (user.role === "admin" || user.id === report.userId)) {
        hasAccess = true;
      } else if (report.isPublic) {
        hasAccess = true;
      } else if (token) {
        if (report.shareToken === token) {
          hasAccess = true;
        } else {
          const dist = await db.select().from(reportDistributions).where(eq9(reportDistributions.linkToken, token)).limit(1);
          if (dist.length > 0 && dist[0].reportId === reportId) {
            hasAccess = true;
          }
        }
      }
      if (!hasAccess) {
        console.warn(`[PDF Export] Access denied (POST): reportId=${reportId}, user=${user ? `${user.id}/${user.role}` : "null"}, report.userId=${report.userId}, isPublic=${report.isPublic}, tokenProvided=${!!token}, shareTokenMatch=${token ? report.shareToken === token : false}`);
        res.status(403).json({ error: "Access denied" });
        return;
      }
      if (report.status && report.status !== "completed") {
        res.status(409).json({ error: "\u62A5\u544A\u5C1A\u672A\u5206\u6790\u5B8C\u6210\uFF0C\u8BF7\u7B49\u5206\u6790\u5B8C\u6210\u540E\u518D\u5BFC\u51FA PDF" });
        return;
      }
      const pdfStatus = report.pdfStatus || "idle";
      const pdfUrl = report.pdfUrl;
      if (!force && pdfStatus === "ready" && pdfUrl) {
        res.json({ status: "ready", url: pdfUrl });
        return;
      }
      if (!force && pdfStatus === "generating") {
        const updatedAt = report.updatedAt ? new Date(report.updatedAt).getTime() : 0;
        const stuckMs = Date.now() - updatedAt;
        if (updatedAt > 0 && stuckMs < 6 * 60 * 1e3) {
          res.json({ status: "generating", message: "PDF\u6B63\u5728\u751F\u6210\u4E2D\uFF0C\u8BF7\u7A0D\u5019..." });
          return;
        }
        console.warn(`[PDF Export] \u68C0\u6D4B\u5230 ${reportId} \u72B6\u6001\u50F5\u6B7B\u5728 generating \u8D85\u8FC7 6 \u5206\u949F\uFF0C\u5F3A\u5236\u91CD\u542F\u4EFB\u52A1`);
      }
      const serverPort = (req.socket.localPort || process.env.PORT || 3e3).toString();
      generatePdfInBackground(reportId, serverPort);
      res.json({ status: "generating", message: "PDF\u751F\u6210\u5DF2\u542F\u52A8\uFF0C\u9884\u8BA1\u9700\u898130-60\u79D2..." });
    } catch (error) {
      console.error("[PDF Export] Trigger error:", error);
      res.status(500).json({ error: `PDF\u5BFC\u51FA\u5931\u8D25: ${error.message || "\u8BF7\u91CD\u8BD5"}` });
    }
  });
  app.get("/api/export/:reportId/pdf/status", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "DB unavailable" });
        return;
      }
      const reportId = req.params.reportId;
      const result = await db.select().from(reports).where(eq9(reports.reportId, reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      const report = result[0];
      const status = report.pdfStatus || "idle";
      res.json({
        status,
        url: status === "ready" ? report.pdfUrl : null,
        error: status === "error" ? report.pdfError : null
      });
    } catch (error) {
      res.status(500).json({ error: "\u67E5\u8BE2\u72B6\u6001\u5931\u8D25" });
    }
  });
  app.get("/api/export/:reportId/pdf", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "DB unavailable" });
        return;
      }
      const reportId = req.params.reportId;
      const token = req.query.token;
      const result = await db.select().from(reports).where(eq9(reports.reportId, reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      const report = result[0];
      let hasAccess = false;
      const user = await resolveUser2(req);
      if (user && (user.role === "admin" || user.id === report.userId)) {
        hasAccess = true;
      } else if (report.isPublic) {
        hasAccess = true;
      } else if (token) {
        if (report.shareToken === token) hasAccess = true;
      }
      if (!hasAccess) {
        console.warn(`[PDF Export] Access denied (GET): reportId=${reportId}, user=${user ? `${user.id}/${user.role}` : "null"}, report.userId=${report.userId}, isPublic=${report.isPublic}, tokenProvided=${!!token}`);
        res.status(403).json({ error: "Access denied" });
        return;
      }
      if (report.pdfStatus === "ready" && report.pdfUrl) {
        res.redirect(report.pdfUrl);
        return;
      }
      res.status(202).json({
        status: report.pdfStatus || "idle",
        message: report.pdfStatus === "generating" ? "PDF\u6B63\u5728\u751F\u6210\u4E2D..." : "PDF\u5C1A\u672A\u751F\u6210\uFF0C\u8BF7\u5148\u89E6\u53D1\u5BFC\u51FA"
      });
    } catch (error) {
      res.status(500).json({ error: "\u4E0B\u8F7D\u5931\u8D25" });
    }
  });
  app.get("/api/export/:reportId/data", async (req, res) => {
    try {
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "DB unavailable" });
        return;
      }
      const result = await db.select().from(reports).where(eq9(reports.reportId, req.params.reportId)).limit(1);
      if (result.length === 0) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      const report = result[0];
      const user = await resolveUser2(req);
      if (!report.isPublic && (!user || user.role !== "admin" && user.id !== report.userId)) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      const isPro = user && (user.tier === "pro" || user.tier === "enterprise");
      res.json({
        report: {
          id: report.reportId,
          jobTitle: report.jobTitle,
          company: report.company,
          industry: report.industry,
          data: report.reportData,
          createdAt: report.createdAt
        },
        watermark: !isPro,
        tier: user?.tier || "free"
      });
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.post("/api/export/:reportId/ppt", async (req, res) => {
    try {
      const user = await resolveUser2(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { allowed } = checkPermission(user, "ppt_export");
      if (!allowed) {
        res.status(403).json({ error: "PPT\u5BFC\u51FA\u9700\u8981Pro\u7248\u672C", upgrade: true });
        return;
      }
      res.json({
        message: "PPT export initiated",
        format: "16:9",
        theme: "dark",
        watermark: false
      });
    } catch (error) {
      res.status(500).json({ error: "Export failed" });
    }
  });
  app.post("/api/export/:reportId/word", async (req, res) => {
    try {
      const user = await resolveUser2(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { allowed: noWatermark } = checkPermission(user, "no_watermark");
      res.json({
        message: "Word export initiated",
        watermark: !noWatermark
      });
    } catch (error) {
      res.status(500).json({ error: "Export failed" });
    }
  });
  app.post("/api/export/batch", async (req, res) => {
    try {
      const user = await resolveUser2(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { allowed } = checkPermission(user, "batch_analysis");
      if (!allowed) {
        res.status(403).json({ error: "\u6279\u91CF\u5206\u6790\u9700\u8981Pro\u7248\u672C", upgrade: true });
        return;
      }
      res.json({ message: "Batch analysis authorized", tier: user.tier });
    } catch (error) {
      res.status(500).json({ error: "Batch failed" });
    }
  });
  app.post("/api/export/batch-download", async (req, res) => {
    try {
      const user = await resolveUser2(req);
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const { reportIds } = req.body;
      if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
        res.status(400).json({ error: "\u8BF7\u63D0\u4F9B\u8981\u5BFC\u51FA\u7684\u62A5\u544AID\u5217\u8868" });
        return;
      }
      if (reportIds.length > 100) {
        res.status(400).json({ error: "\u5355\u6B21\u6700\u591A\u5BFC\u51FA100\u4EFD\u62A5\u544A" });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.status(500).json({ error: "DB unavailable" });
        return;
      }
      const allReports = await db.select().from(reports).where(inArray2(reports.reportId, reportIds));
      const accessibleReports = user.role === "admin" ? allReports : allReports.filter((r) => r.userId === user.id);
      if (accessibleReports.length === 0) {
        res.status(404).json({ error: "\u672A\u627E\u5230\u53EF\u5BFC\u51FA\u7684\u62A5\u544A" });
        return;
      }
      const BOM = "\uFEFF";
      const headers = [
        "\u62A5\u544AID",
        "\u5C97\u4F4D\u540D\u79F0",
        "\u516C\u53F8",
        "\u884C\u4E1A",
        "\u72B6\u6001",
        "AI\u66FF\u4EE3\u7387(%)",
        "\u9AD8\u98CE\u9669\u4EFB\u52A1\u6570",
        "\u4E2D\u98CE\u9669\u4EFB\u52A1\u6570",
        "\u4F4E\u98CE\u9669\u4EFB\u52A1\u6570",
        "\u63A8\u8350AI\u5DE5\u5177",
        "\u57F9\u8BAD\u5468\u671F(\u6708)",
        "\u5E74\u5316\u8282\u7701(\u4E07\u5143)",
        "\u521B\u5EFA\u65F6\u95F4",
        "\u5B8C\u6210\u65F6\u95F4"
      ];
      const rows = accessibleReports.map((report) => {
        let aiRate = 0;
        let highRisk = 0, medRisk = 0, lowRisk = 0;
        let tools = "";
        let trainingMonths = "";
        let annualSaving = "";
        try {
          const data = typeof report.reportData === "string" ? JSON.parse(report.reportData) : report.reportData;
          if (data) {
            if (Array.isArray(data)) {
              const step2 = data[1]?.data;
              if (step2?.overallAiReadiness) aiRate = step2.overallAiReadiness;
              else if (step2?.dimensions) {
                const scores = step2.dimensions.map((d) => d.aiImpactScore || 0);
                const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                aiRate = avg <= 1 ? Math.round(avg * 100) : avg <= 10 ? Math.round(avg * 10) : Math.round(avg);
              }
              const step3 = data[2]?.data;
              if (step3?.taskClassification) {
                const tc = step3.taskClassification;
                highRisk = Array.isArray(tc.fullyReplaceable) ? tc.fullyReplaceable.length : 0;
                medRisk = Array.isArray(tc.partiallyReplaceable) ? tc.partiallyReplaceable.length : 0;
                lowRisk = Array.isArray(tc.humanEssential) ? tc.humanEssential.length : 0;
              }
              const step4 = data[3]?.data;
              if (step4?.tools) {
                tools = step4.tools.slice(0, 3).map((t2) => t2.name || t2.toolName || "").filter(Boolean).join("; ");
              }
              const step6 = data[5]?.data;
              if (step6?.timeline) trainingMonths = String(step6.timeline.totalMonths || "");
              const step8 = data[7]?.data;
              if (step8?.annualSaving) annualSaving = String(step8.annualSaving || "");
            } else {
              const fp = data?.step2 || data?.firstPrinciples;
              if (fp?.overallAiReadiness) aiRate = fp.overallAiReadiness;
              const tc = data?.step3?.taskClassification;
              if (tc) {
                highRisk = Array.isArray(tc.fullyReplaceable) ? tc.fullyReplaceable.length : 0;
                medRisk = Array.isArray(tc.partiallyReplaceable) ? tc.partiallyReplaceable.length : 0;
                lowRisk = Array.isArray(tc.humanEssential) ? tc.humanEssential.length : 0;
              }
              if (data?.step4?.tools) {
                tools = data.step4.tools.slice(0, 3).map((t2) => t2.name || t2.toolName || "").filter(Boolean).join("; ");
              }
              if (data?.step6?.timeline) trainingMonths = String(data.step6.timeline.totalMonths || "");
              if (data?.step8?.annualSaving) annualSaving = String(data.step8.annualSaving || "");
            }
          }
        } catch {
        }
        const statusMap = { pending: "\u5F85\u786E\u8BA4", analyzing: "\u5206\u6790\u4E2D", completed: "\u5DF2\u5B8C\u6210", error: "\u5F02\u5E38" };
        return [
          report.reportId,
          report.jobTitle || "",
          report.company || "",
          report.industry || "",
          statusMap[report.status] || report.status,
          String(aiRate),
          String(highRisk),
          String(medRisk),
          String(lowRisk),
          tools,
          trainingMonths,
          annualSaving,
          report.createdAt ? new Date(report.createdAt).toLocaleString("zh-CN") : "",
          report.completedAt ? new Date(report.completedAt).toLocaleString("zh-CN") : ""
        ];
      });
      const escapeCSV = (field) => {
        if (field.includes(",") || field.includes('"') || field.includes("\n")) {
          return '"' + field.replace(/"/g, '""') + '"';
        }
        return field;
      };
      const csvContent = BOM + headers.map(escapeCSV).join(",") + "\n" + rows.map((row) => row.map(escapeCSV).join(",")).join("\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="batch-export-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Batch download error:", error);
      res.status(500).json({ error: "\u6279\u91CF\u5BFC\u51FA\u5931\u8D25" });
    }
  });
}

// server/_core/storageProxy.ts
init_env();
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/siteAuthRoute.ts
init_env();
function registerSiteAuthRoute(app) {
  app.post("/api/site/verify", (req, res) => {
    const { password } = req.body;
    if (!password || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Password is required" });
    }
    if (!ENV.sitePassword) {
      return res.status(500).json({ success: false, message: "Site password is not configured" });
    }
    if (password === ENV.sitePassword) {
      return res.json({ success: true });
    }
    return res.status(401).json({ success: false, message: "Invalid password" });
  });
}

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  const isPlatformAdmin = await checkPlatformAdmin(
    opts.req.headers.cookie
  );
  if (isPlatformAdmin) {
    user = createPlatformAdminUser();
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      user = null;
    }
    if (!user) {
      user = await getOrCreateGuestUser();
    }
  }
  return {
    req: opts.req,
    res: opts.res,
    user,
    companyId: user?.companyId || void 0,
    userPhone: user?.phone || void 0
  };
}

// server/_core/serveStatic.ts
import express from "express";
import fs3 from "fs";
import path3 from "path";
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path3.resolve(import.meta.dirname, "../..", "dist", "public") : path3.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  const exportsPath = path3.resolve(process.cwd(), "storage", "exports");
  app.use("/exports", express.static(exportsPath));
  app.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
process.env.TZ = "Asia/Shanghai";
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerSiteAuthRoute(app);
  registerAdminAuthRoute(app);
  registerApiRoutes(app);
  registerExportRoutes(app);
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    const expressMod = (await import("express")).default;
    const pathMod = (await import("path")).default;
    app.use("/exports", expressMod.static(pathMod.resolve(process.cwd(), "storage", "exports")));
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
