import { TRPCError } from "@trpc/server";
import { and, eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { llmModels } from "../drizzle/schema";
import { adminProcedure, router } from "./_core/trpc";
import { encrypt, decrypt, maskApiKey } from "./utils/crypto";
import { invalidateModelCache } from "./_core/llmRouter";

/**
 * LLM 模型管理路由
 * 仅限平台超级管理员 (role === 'admin') 访问
 */
export const llmModelRouter = router({
  /**
   * 获取模型列表
   * 返回所有未删除的模型，API Key 脱敏显示
   */
  list: adminProcedure
    .input(
      z
        .object({
          includeDeleted: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = input?.includeDeleted
        ? []
        : [eq(llmModels.isDeleted, 0)];

      const models = await db
        .select()
        .from(llmModels)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(llmModels.priority, desc(llmModels.createdAt));

      // 脱敏 API Key 并返回
      return models.map((model) => {
        let maskedKey = "****";
        try {
          const plainKey = decrypt(model.apiKey);
          maskedKey = maskApiKey(plainKey);
        } catch {
          maskedKey = "****（解密失败）";
        }

        return {
          ...model,
          apiKey: maskedKey,
        };
      });
    }),

  /**
   * 获取单个模型详情
   */
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(llmModels)
        .where(eq(llmModels.id, input.id))
        .limit(1);

      if (result.length === 0) return null;

      const model = result[0];
      let maskedKey = "****";
      try {
        const plainKey = decrypt(model.apiKey);
        maskedKey = maskApiKey(plainKey);
      } catch {
        maskedKey = "****（解密失败）";
      }

      return { ...model, apiKey: maskedKey };
    }),

  /**
   * 新增模型
   * modelCode 必须唯一，apiKey 使用 AES-256-GCM 加密存储
   */
  create: adminProcedure
    .input(
      z.object({
        modelCode: z.string().min(1).max(64),
        modelName: z.string().min(1).max(128),
        provider: z.string().min(1).max(64),
        apiUrl: z.string().url().max(512),
        apiKey: z.string().min(1).max(512),
        modelType: z.enum(["chat", "embedding", "image", "audio"]),
        isActive: z.number().min(0).max(1).optional().default(1),
        priority: z.number().min(1).max(9999).optional().default(100),
        inputPrice: z.string().optional().default("0"),
        outputPrice: z.string().optional().default("0"),
        maxContext: z.number().min(1).optional().default(8192),
        maxOutput: z.number().min(1).optional().default(4096),
        remark: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      // 检查 modelCode 唯一性
      const existing = await db
        .select({ id: llmModels.id })
        .from(llmModels)
        .where(eq(llmModels.modelCode, input.modelCode))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `模型编码 "${input.modelCode}" 已存在`,
        });
      }

      // 加密 API Key
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
        remark: input.remark || null,
      });
      invalidateModelCache();
      return { success: true };
    }),

  /**
   * 修改模型
   * 如果传入了新的 apiKey，则加密更新；否则保留原加密值
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        modelCode: z.string().min(1).max(64).optional(),
        modelName: z.string().min(1).max(128).optional(),
        provider: z.string().min(1).max(64).optional(),
        apiUrl: z.string().url().max(512).optional(),
        apiKey: z.string().max(512).optional(), // 留空表示不修改
        modelType: z.enum(["chat", "embedding", "image", "audio"]).optional(),
        isActive: z.number().min(0).max(1).optional(),
        priority: z.number().min(1).max(9999).optional(),
        inputPrice: z.string().optional(),
        outputPrice: z.string().optional(),
        maxContext: z.number().min(1).optional(),
        maxOutput: z.number().min(1).optional(),
        remark: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      const { id, apiKey, ...updateFields } = input;

      // 检查模型是否存在
      const existing = await db
        .select()
        .from(llmModels)
        .where(eq(llmModels.id, id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "模型不存在" });
      }

      // 构建更新对象
      const updateSet: Record<string, unknown> = {};

      if (updateFields.modelCode !== undefined) updateSet.modelCode = updateFields.modelCode;
      if (updateFields.modelName !== undefined) updateSet.modelName = updateFields.modelName;
      if (updateFields.provider !== undefined) updateSet.provider = updateFields.provider;
      if (updateFields.apiUrl !== undefined) updateSet.apiUrl = updateFields.apiUrl;
      if (updateFields.modelType !== undefined) updateSet.modelType = updateFields.modelType;
      if (updateFields.isActive !== undefined) updateSet.isActive = updateFields.isActive;
      if (updateFields.priority !== undefined) updateSet.priority = updateFields.priority;
      if (updateFields.inputPrice !== undefined) updateSet.inputPrice = updateFields.inputPrice;
      if (updateFields.outputPrice !== undefined) updateSet.outputPrice = updateFields.outputPrice;
      if (updateFields.maxContext !== undefined) updateSet.maxContext = updateFields.maxContext;
      if (updateFields.maxOutput !== undefined) updateSet.maxOutput = updateFields.maxOutput;
      if (updateFields.remark !== undefined) updateSet.remark = updateFields.remark;

      // 如果传入了新的 API Key，则加密更新
      if (apiKey && apiKey.trim().length > 0) {
        updateSet.apiKey = encrypt(apiKey);
      }

      if (Object.keys(updateSet).length === 0) {
        return { success: true, message: "无需更新" };
      }

      await db.update(llmModels).set(updateSet).where(eq(llmModels.id, id));
      invalidateModelCache();
      return { success: true };
    }),

  /**
   * 启用/停用模型
   */
  toggleStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        modelCode: z.string().min(1).max(64).optional(),
        isActive: z.number().min(0).max(1),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      await db
        .update(llmModels)
        .set({ isActive: input.isActive })
        .where(eq(llmModels.id, input.id));
      invalidateModelCache();
      return { success: true };
    }),

  /**
   * 测试模型连接
   * 发送一个简单的请求到模型API，验证连接是否正常
   */
  testConnection: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      const result = await db
        .select()
        .from(llmModels)
        .where(eq(llmModels.id, input.id))
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "模型不存在" });
      }

      const model = result[0];
      const apiKey = decrypt(model.apiKey);
      const apiEndpoint = model.apiUrl.replace(/\/$/, "").endsWith("/chat/completions")
        ? model.apiUrl
        : `${model.apiUrl.replace(/\/$/, "")}/chat/completions`;

      const startTime = Date.now();
      try {
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model.modelCode,
            messages: [{ role: "user", content: "你好，请回复‘OK’" }],
            max_tokens: 10,
          }),
          signal: AbortSignal.timeout(30000),
        });

        const durationMs = Date.now() - startTime;

        if (!response.ok) {
          const errorText = await response.text();
          return {
            success: false,
            durationMs,
            modelCode: model.modelCode,
            error: `HTTP ${response.status}: ${errorText.slice(0, 200)}`,
          };
        }

        const data = await response.json();
        const responseModel = data?.model || model.modelCode;

        return {
          success: true,
          durationMs,
          modelCode: responseModel,
          message: `连接测试成功，耗时 ${durationMs}ms，模型: ${responseModel}`,
        };
      } catch (err: any) {
        const durationMs = Date.now() - startTime;
        return {
          success: false,
          durationMs,
          modelCode: model.modelCode,
          error: err?.message || "连接超时或网络错误",
        };
      }
    }),

  /**
   * 删除模型（软删除）
   * 已产生调用日志的模型不得物理删除（此处预留检查钩子，子域3实现时补充）
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "数据库不可用" });

      // 检查模型是否存在
      const existing = await db
        .select()
        .from(llmModels)
        .where(eq(llmModels.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "模型不存在" });
      }

      // TODO: 子域3实现后，在此处增加 llm_call_logs 的检查
      // 如果有调用日志，则拒绝物理删除，仅执行软删除

      // 执行软删除
      await db
        .update(llmModels)
        .set({ isDeleted: 1, isActive: 0 })
        .where(eq(llmModels.id, input.id));
      invalidateModelCache();
      return { success: true };
    }),
});
