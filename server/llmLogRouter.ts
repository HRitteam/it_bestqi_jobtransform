import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, like, desc, sql, count, sum } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { llmCallLogs, llmModels } from "../drizzle/schema";
import { adminProcedure, router } from "./_core/trpc";

/**
 * LLM 调用日志路由
 * 仅限平台超级管理员 (role === 'admin') 访问
 */
export const llmLogRouter = router({
  /**
   * 高级搜索日志
   * 支持按企业、手机号、功能、模型、供应商、状态、切换、时间、Token、费用等条件过滤
   */
  search: adminProcedure
    .input(
      z.object({
        // 筛选条件
        companyId: z.string().optional(),
        phone: z.string().optional(),
        feature: z.string().optional(),
        modelCode: z.string().optional(),
        provider: z.string().optional(),
        success: z.number().min(0).max(1).optional(),
        isSwitched: z.number().min(0).max(1).optional(),
        // 时间范围
        startTime: z.string().optional(), // ISO 8601
        endTime: z.string().optional(),
        // Token 范围
        minTokens: z.number().optional(),
        maxTokens: z.number().optional(),
        // 费用范围
        minCost: z.string().optional(),
        maxCost: z.string().optional(),
        // 分页
        page: z.number().min(1).optional().default(1),
        pageSize: z.number().min(1).max(100).optional().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { data: [], total: 0, page: input.page, pageSize: input.pageSize };

      // 构建查询条件
      const conditions: any[] = [];

      if (input.companyId) {
        conditions.push(eq(llmCallLogs.companyId, input.companyId));
      }
      if (input.phone) {
        conditions.push(like(llmCallLogs.phone, `%${input.phone}%`));
      }
      if (input.feature) {
        conditions.push(eq(llmCallLogs.feature, input.feature));
      }
      if (input.modelCode) {
        conditions.push(eq(llmCallLogs.modelCode, input.modelCode));
      }
      if (input.provider) {
        conditions.push(eq(llmCallLogs.provider, input.provider));
      }
      if (input.success !== undefined) {
        conditions.push(eq(llmCallLogs.success, input.success));
      }
      if (input.isSwitched !== undefined) {
        conditions.push(eq(llmCallLogs.isSwitched, input.isSwitched));
      }
      if (input.startTime) {
        conditions.push(gte(llmCallLogs.requestTime, new Date(input.startTime)));
      }
      if (input.endTime) {
        conditions.push(lte(llmCallLogs.requestTime, new Date(input.endTime)));
      }
      if (input.minTokens !== undefined) {
        conditions.push(gte(llmCallLogs.totalTokens, input.minTokens));
      }
      if (input.maxTokens !== undefined) {
        conditions.push(lte(llmCallLogs.totalTokens, input.maxTokens));
      }
      if (input.minCost) {
        conditions.push(sql`CAST(${llmCallLogs.estimatedCost} AS DECIMAL(20,6)) >= ${input.minCost}`);
      }
      if (input.maxCost) {
        conditions.push(sql`CAST(${llmCallLogs.estimatedCost} AS DECIMAL(20,6)) <= ${input.maxCost}`);
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 查询总数
      const countResult = await db
        .select({ total: count() })
        .from(llmCallLogs)
        .where(whereClause);

      const total = countResult[0]?.total || 0;

      // 查询数据（分页）
      const offset = (input.page - 1) * input.pageSize;
      const data = await db
        .select()
        .from(llmCallLogs)
        .where(whereClause)
        .orderBy(desc(llmCallLogs.requestTime))
        .limit(input.pageSize)
        .offset(offset);

      return {
        data,
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  /**
   * 获取单条日志详情
   */
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db
        .select()
        .from(llmCallLogs)
        .where(eq(llmCallLogs.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  /**
   * 费用统计
   * 支持按企业、用户、功能、模型、时间维度统计 Token 和费用
   */
  stats: adminProcedure
    .input(
      z.object({
        companyId: z.string().optional(),
        userId: z.number().optional(),
        feature: z.string().optional(),
        modelCode: z.string().optional(),
        provider: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        // 分组维度
        groupBy: z.enum(["company", "user", "feature", "model", "provider", "day"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return {
          summary: { totalCalls: 0, successCalls: 0, failedCalls: 0, switchedCalls: 0, totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0, totalCost: "0", successRate: "0" },
          breakdown: [],
        };
      }

      // 构建筛选条件
      const conditions: any[] = [];

      if (input.companyId) conditions.push(eq(llmCallLogs.companyId, input.companyId));
      if (input.userId) conditions.push(eq(llmCallLogs.userId, input.userId));
      if (input.feature) conditions.push(eq(llmCallLogs.feature, input.feature));
      if (input.modelCode) conditions.push(eq(llmCallLogs.modelCode, input.modelCode));
      if (input.provider) conditions.push(eq(llmCallLogs.provider, input.provider));
      if (input.startTime) conditions.push(gte(llmCallLogs.requestTime, new Date(input.startTime)));
      if (input.endTime) conditions.push(lte(llmCallLogs.requestTime, new Date(input.endTime)));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // 汇总统计
      const summaryResult = await db
        .select({
          totalCalls: count(),
          successCalls: sql<number>`SUM(CASE WHEN ${llmCallLogs.success} = 1 THEN 1 ELSE 0 END)`,
          failedCalls: sql<number>`SUM(CASE WHEN ${llmCallLogs.success} = 0 THEN 1 ELSE 0 END)`,
          switchedCalls: sql<number>`SUM(CASE WHEN ${llmCallLogs.isSwitched} = 1 THEN 1 ELSE 0 END)`,
          totalInputTokens: sql<number>`COALESCE(SUM(${llmCallLogs.inputTokens}), 0)`,
          totalOutputTokens: sql<number>`COALESCE(SUM(${llmCallLogs.outputTokens}), 0)`,
          totalTokens: sql<number>`COALESCE(SUM(${llmCallLogs.totalTokens}), 0)`,
          totalCost: sql<string>`COALESCE(SUM(CAST(${llmCallLogs.estimatedCost} AS DECIMAL(20,6))), 0)`,
        })
        .from(llmCallLogs)
        .where(whereClause);

      const summary = summaryResult[0] || {
        totalCalls: 0,
        successCalls: 0,
        failedCalls: 0,
        switchedCalls: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalCost: "0",
      };

      const successRate = summary.totalCalls > 0
        ? ((Number(summary.successCalls) / summary.totalCalls) * 100).toFixed(2)
        : "0";

      // 分组统计（如果指定了 groupBy）
      let breakdown: any[] = [];

      if (input.groupBy) {
        const groupColumn = {
          company: llmCallLogs.companyId,
          user: llmCallLogs.phone,
          feature: llmCallLogs.feature,
          model: llmCallLogs.modelCode,
          provider: llmCallLogs.provider,
          day: sql`DATE(${llmCallLogs.requestTime})`,
        }[input.groupBy];

        breakdown = await db
          .select({
            groupKey: groupColumn as any,
            totalCalls: count(),
            successCalls: sql<number>`SUM(CASE WHEN ${llmCallLogs.success} = 1 THEN 1 ELSE 0 END)`,
            totalInputTokens: sql<number>`COALESCE(SUM(${llmCallLogs.inputTokens}), 0)`,
            totalOutputTokens: sql<number>`COALESCE(SUM(${llmCallLogs.outputTokens}), 0)`,
            totalTokens: sql<number>`COALESCE(SUM(${llmCallLogs.totalTokens}), 0)`,
            totalCost: sql<string>`COALESCE(SUM(CAST(${llmCallLogs.estimatedCost} AS DECIMAL(20,6))), 0)`,
          })
          .from(llmCallLogs)
          .where(whereClause)
          .groupBy(groupColumn as any)
          .orderBy(desc(sql`SUM(CAST(${llmCallLogs.estimatedCost} AS DECIMAL(20,6)))`))
          .limit(50);
      }

      return {
        summary: { ...summary, successRate },
        breakdown,
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
      db.selectDistinct({ value: llmCallLogs.modelCode }).from(llmCallLogs),
    ]);

    return {
      features: features.map((f) => f.value).filter(Boolean),
      providers: providers.map((p) => p.value).filter(Boolean) as string[],
      models: models.map((m) => m.value).filter(Boolean),
    };
  }),
});
