import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  companyId: varchar("companyId", { length: 64 }), // 企业ID（iframe传入）
  phone: varchar("phone", { length: 20 }), // 用户手机号（iframe传入）
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  tier: mysqlEnum("tier", ["free", "pro", "enterprise"]).default("free").notNull(),
  inviteCount: int("inviteCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Analysis reports table — stores the full AI-generated report
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull().unique(),
  userId: int("userId").notNull(),
  companyId: varchar("companyId", { length: 64 }), // 企业ID（数据隔离）
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
  completedAt: timestamp("completedAt"),
});

/**
 * Uploaded files associated with reports
 */
export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull(),
  userId: int("userId").notNull(),
  companyId: varchar("companyId", { length: 64 }), // 企业ID（数据隔离）
  filename: varchar("filename", { length: 512 }).notNull(),
  mimeType: varchar("mimeType", { length: 128 }),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  url: varchar("url", { length: 1024 }).notNull(),
  extractedText: text("extractedText"),
  fileSize: bigint("fileSize", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Invitations tracking for growth flywheel
 */
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  inviterId: int("inviterId").notNull(),
  inviteeId: int("inviteeId"),
  inviteCode: varchar("inviteCode", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
export type FileRecord = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;

/**
 * AI Tools database - SOTA工具动态管理
 */
export const aiTools = mysqlTable("ai_tools", {
  id: int("id").autoincrement().primaryKey(),
  toolId: varchar("toolId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  isDomestic: int("isDomestic").default(0).notNull(),
  pricing: mysqlEnum("pricing", ["free", "freemium", "paid"]).default("freemium").notNull(),
  description: text("description"),
  useCases: json("useCases").$type<string[]>(),
  officialUrl: varchar("officialUrl", { length: 512 }),
  tags: json("tags").$type<string[]>(),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AIToolRecord = typeof aiTools.$inferSelect;
export type InsertAITool = typeof aiTools.$inferInsert;

/**
 * Brand settings for theme/logo customization (P1-03)
 */
export const brandSettings = mysqlTable("brand_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  logoUrl: varchar("logoUrl", { length: 512 }),
  primaryColor: varchar("primaryColor", { length: 20 }),
  footerText: varchar("footerText", { length: 256 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Report distributions for sharing & tracking (P1-06)
 */
export const reportDistributions = mysqlTable("report_distributions", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Report feedback from readers (P1-11)
 */
export const reportFeedback = mysqlTable("report_feedback", {
  id: int("id").autoincrement().primaryKey(),
  reportId: varchar("reportId", { length: 64 }).notNull(),
  distributionId: int("distributionId"),
  chapterIndex: int("chapterIndex"),
  rating: int("rating"),
  comment: text("comment"),
  isAnonymous: int("isAnonymous").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BrandSetting = typeof brandSettings.$inferSelect;
export type ReportDistribution = typeof reportDistributions.$inferSelect;
export type ReportFeedbackRecord = typeof reportFeedback.$inferSelect;

/**
 * LLM Models - 平台级大模型路由管理：模型配置表
 */
export const llmModels = mysqlTable("llm_models", {
  id: int("id").autoincrement().primaryKey(),
  modelCode: varchar("modelCode", { length: 64 }).notNull().unique(),
  modelName: varchar("modelName", { length: 128 }).notNull(),
  provider: varchar("provider", { length: 64 }).notNull(),
  apiUrl: varchar("apiUrl", { length: 512 }).notNull(),
  apiKey: varchar("apiKey", { length: 1024 }).notNull(), // AES-256-GCM 加密存储
  modelType: varchar("modelType", { length: 32 }).notNull(), // chat, embedding, image, audio
  isActive: int("isActive").default(1).notNull(), // 1-启用, 0-停用
  priority: int("priority").default(100).notNull(), // 数字越小优先级越高
  inputPrice: varchar("inputPrice", { length: 20 }).default("0").notNull(), // 输入Token单价(元/千Token)
  outputPrice: varchar("outputPrice", { length: 20 }).default("0").notNull(), // 输出Token单价(元/千Token)
  maxContext: int("maxContext").default(8192).notNull(), // 最大上下文长度
  maxOutput: int("maxOutput").default(4096).notNull(), // 最大输出长度
  remark: text("remark"),
  isDeleted: int("isDeleted").default(0).notNull(), // 软删除: 1-已删除, 0-正常
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LlmModel = typeof llmModels.$inferSelect;
export type InsertLlmModel = typeof llmModels.$inferInsert;

/**
 * LLM Call Logs - 模型调用日志表
 * 记录每次大模型调用的完整轨迹，包括成功/失败、降级切换、Token消耗和费用
 */
export const llmCallLogs = mysqlTable("llm_call_logs", {
  id: int("id").autoincrement().primaryKey(),
  requestId: varchar("requestId", { length: 32 }).notNull().unique(), // 唯一请求标识

  // 企业与用户信息
  companyId: varchar("companyId", { length: 64 }), // 企业ID
  companyName: varchar("companyName", { length: 128 }), // 企业名称
  userId: int("userId"), // 用户ID
  phone: varchar("phone", { length: 20 }), // 用户手机号

  // 调用信息
  feature: varchar("feature", { length: 64 }).notNull(), // 使用功能标识
  source: varchar("source", { length: 32 }).default("web"), // 请求来源

  // 模型信息
  modelCode: varchar("modelCode", { length: 64 }).notNull(), // 最终使用的模型编码
  modelName: varchar("modelName", { length: 128 }), // 最终使用的模型名称
  provider: varchar("provider", { length: 64 }), // 供应商

  // 调用状态
  success: int("success").default(1).notNull(), // 1-成功, 0-失败
  failReason: text("failReason"), // 失败原因
  httpStatus: int("httpStatus"), // HTTP 状态码

  // 模型切换信息
  isSwitched: int("isSwitched").default(0).notNull(), // 是否发生模型切换
  originalModel: varchar("originalModel", { length: 64 }), // 原始模型编码
  switchTrace: json("switchTrace").$type<Array<{
    modelCode: string;
    provider: string;
    failReason: string;
    durationMs: number;
    httpStatus?: number;
  }>>(), // 切换轨迹 JSON

  // Token 消耗
  inputTokens: int("inputTokens").default(0).notNull(),
  outputTokens: int("outputTokens").default(0).notNull(),
  totalTokens: int("totalTokens").default(0).notNull(),

  // 费用
  inputPrice: varchar("inputPrice", { length: 20 }).default("0"), // 调用时的输入单价快照
  outputPrice: varchar("outputPrice", { length: 20 }).default("0"), // 调用时的输出单价快照
  estimatedCost: varchar("estimatedCost", { length: 20 }).default("0").notNull(), // 预估费用(元)

  // 时间
  requestTime: timestamp("requestTime").defaultNow().notNull(), // 请求发起时间
  responseTime: timestamp("responseTime"), // 响应完成时间
  durationMs: int("durationMs").default(0).notNull(), // 总耗时(毫秒)

  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LlmCallLog = typeof llmCallLogs.$inferSelect;
export type InsertLlmCallLog = typeof llmCallLogs.$inferInsert;
