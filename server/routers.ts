import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { llmModelRouter } from "./llmModelRouter";
import { llmLogRouter } from "./llmLogRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { reports, files, users, invitations } from "../drizzle/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { AI_TOOLS_DATABASE, getAllCategories, matchToolsForUseCase, getDomesticFreeTools } from "./toolsDatabase";
import { getAllAITools, getAIToolCategories, matchToolsFromDB, getDomesticFreeToolsFromDB, upsertAITool, deleteAITool, getAIToolById } from "./db";
import { brandSettings, reportDistributions, reportFeedback } from "../drizzle/schema";
import { robustParseJson } from "./jsonRepair";

/**
 * 清理 LLM 返回内容中的 <think>...</think> 标签和 markdown 代码块包裹，
 * 提取纯 JSON 字符串。部分模型（如 DeepSeek）会在 JSON 输出前附加思考过程。
 */
function extractJsonFromLLMResponse(raw: string): string {
  let cleaned = raw;
  // 移除 <think>...</think> 标签及其内容（支持多行）
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // 移除可能的 markdown 代码块包裹
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1];
  }
  return cleaned.trim();
}

/**
 * [修复] 强健的“调用 LLM + 解析 JSON”封装，用于行动计划/管理层汇报等结构化输出场景。
 * - 用 robustParseJson 代替裸 JSON.parse，容忍截断/尾随逗号/智能引号/混入说明文字等瀑置
 * - 解析失败或结果为空时，自动重试一次（许多是偏差性的生成报错）
 * - 仍失败则抛出可读错误，由上层 toast 提示，而不是把原始 JSON 语法错报给用户
 * @param invoke 返回 LLM 响应的函数
 * @param isEmpty 判定解析出的对象是否“内容为空”（如主数组为空）
 * @param label 用于错误信息的中文名称
 */
async function invokeAndParseJson<T = any>(
  invoke: () => Promise<any>,
  isEmpty: (data: any) => boolean,
  label: string
): Promise<T> {
  const attempt = async (): Promise<{ ok: boolean; data: any; reason?: string }> => {
    const response = await invoke();
    const content = response?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      // 部分网关可能直接返回对象
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
    console.warn(`[${label}] 首次生成不可用(reason=${last.reason})，自动重试一次`);
    try {
      last = await attempt();
    } catch (e: any) {
      console.error(`[${label}] 重试调用异常:`, e?.message || e);
    }
  }
  if (!last.ok) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `${label}生成失败，请稍后重试（模型返回内容不完整）`,
    });
  }
  return last.data as T;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  report: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      // 企业数据隔离：优先按 companyId 过滤，个人可筛选自己的数据
      const conditions = [eq(reports.userId, ctx.user.id)];
      if (ctx.companyId) {
        conditions.push(eq(reports.companyId, ctx.companyId));
      }
      const result = await db.select()
        .from(reports)
        .where(and(...conditions))
        .orderBy(desc(reports.createdAt))
        .limit(50);
      return result;
    }),

    get: publicProcedure
      .input(z.object({ reportId: z.string(), token: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db.select()
          .from(reports)
          .where(eq(reports.reportId, input.reportId))
          .limit(1);
        if (result.length === 0) return null;
        const report = result[0];
        // 如果携带了有效的分享 token，直接允许访问（跳过权限检查）
        if (input.token) {
          // 检查 reports.shareToken
          if (report.shareToken && report.shareToken === input.token) {
            return report;
          }
          // 检查 reportDistributions.linkToken
          const dist = await db.select().from(reportDistributions)
            .where(and(eq(reportDistributions.reportId, input.reportId), eq(reportDistributions.linkToken, input.token)))
            .limit(1);
          if (dist.length > 0) {
            return report;
          }
        }
        // 企业隔离校验：如果有 companyId 上下文，确保只能访问本企业数据
        const companyId = (ctx as any).companyId;
        if (companyId && report.companyId && report.companyId !== companyId) {
          return null;
        }
        // Check access: public or owner (管理员可查看所有报告)
        const isAdmin = ctx.user?.role === "admin";
        if (!isAdmin && !report.isPublic && (!ctx.user || ctx.user.id !== report.userId)) {
          return null;
        }
        return report;
      }),

    getByShareToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;
        const result = await db.select()
          .from(reports)
          .where(eq(reports.shareToken, input.token))
          .limit(1);
        return result.length > 0 ? result[0] : null;
      }),

    generateShareLink: protectedProcedure
      .input(z.object({ reportId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const token = nanoid(16);
        const conditions = [eq(reports.reportId, input.reportId), eq(reports.userId, ctx.user.id)];
        if (ctx.companyId) conditions.push(eq(reports.companyId, ctx.companyId));
        await db.update(reports)
          .set({ isPublic: 1, shareToken: token })
          .where(and(...conditions));
        return { token };
      }),

    delete: protectedProcedure
      .input(z.object({ reportId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const conditions = [eq(reports.reportId, input.reportId), eq(reports.userId, ctx.user.id)];
        if (ctx.companyId) conditions.push(eq(reports.companyId, ctx.companyId));
        await db.delete(reports)
          .where(and(...conditions));
        return { success: true };
      }),
  }),

  user: router({
    profile: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return ctx.user;
      const result = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      return result[0] || ctx.user;
    }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { totalReports: 0, completedReports: 0, inviteCount: 0 };
      const conditions = [eq(reports.userId, ctx.user.id)];
      if (ctx.companyId) conditions.push(eq(reports.companyId, ctx.companyId));
      const allReports = await db.select()
        .from(reports)
        .where(and(...conditions));
      const completed = allReports.filter(r => r.status === "completed");
      return {
        totalReports: allReports.length,
        completedReports: completed.length,
        inviteCount: ctx.user.inviteCount || 0,
      };
    }),
  }),

  invitation: router({
    create: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const code = nanoid(8);
      await db.insert(invitations).values({
        inviterId: ctx.user.id,
        inviteCode: code,
      });
      return { code };
    }),

    myInvites: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select()
        .from(invitations)
        .where(eq(invitations.inviterId, ctx.user.id))
        .orderBy(desc(invitations.createdAt));
    }),

    accept: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        // Find the invitation
        const inv = await db.select().from(invitations)
          .where(and(eq(invitations.inviteCode, input.inviteCode), eq(invitations.status, "pending")))
          .limit(1);
        if (inv.length === 0) return { success: false, message: "邀请码无效或已使用" };
        const invitation = inv[0];
        // Cannot invite yourself
        if (invitation.inviterId === ctx.user.id) return { success: false, message: "不能使用自己的邀请码" };
        // Mark invitation as accepted
        await db.update(invitations)
          .set({ inviteeId: ctx.user.id, status: "accepted" })
          .where(eq(invitations.id, invitation.id));
        // Increment inviter's inviteCount
        const inviter = await db.select().from(users).where(eq(users.id, invitation.inviterId)).limit(1);
        if (inviter.length > 0) {
          await db.update(users)
            .set({ inviteCount: (inviter[0].inviteCount || 0) + 1 })
            .where(eq(users.id, invitation.inviterId));
        }
        return { success: true };
      }),
  }),

  // SOTA AI工具数据库 (database-backed with static fallback)
  tools: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional(), search: z.string().optional(), isDomestic: z.boolean().optional(), pricing: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const dbTools = await getAllAITools({
          category: input?.category,
          isDomestic: input?.isDomestic,
          pricing: input?.pricing,
          search: input?.search,
        });
        if (dbTools.length > 0) {
          return dbTools.map(t => ({
            id: t.toolId,
            name: t.name,
            category: t.category,
            isDomestic: t.isDomestic === 1,
            pricing: t.pricing,
            description: t.description || "",
            useCases: t.useCases || [],
            officialUrl: t.officialUrl || "",
            tags: t.tags || [],
            updatedAt: t.updatedAt ? t.updatedAt.toISOString() : new Date().toISOString(),
          }));
        }
        // Fallback to static database - add updatedAt for consistency
        const addTimestamp = (t: any) => ({ ...t, updatedAt: new Date().toISOString() });
        if (input?.category) {
          return AI_TOOLS_DATABASE.filter(t => t.category === input.category).map(addTimestamp);
        }
        return AI_TOOLS_DATABASE.map(addTimestamp);
      }),
    categories: publicProcedure.query(async () => {
      const dbCats = await getAIToolCategories();
      return dbCats.length > 0 ? dbCats : getAllCategories();
    }),
    match: publicProcedure
      .input(z.object({ useCase: z.string(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        const dbResult = await matchToolsFromDB(input.useCase, input.limit || 6);
        if (dbResult.domestic.length > 0 || dbResult.international.length > 0) {
          const mapTool = (t: any) => ({
            id: t.toolId,
            name: t.name,
            category: t.category,
            isDomestic: t.isDomestic === 1,
            pricing: t.pricing,
            description: t.description || "",
            useCases: t.useCases || [],
            officialUrl: t.officialUrl || "",
            tags: t.tags || [],
          });
          return { domestic: dbResult.domestic.map(mapTool), international: dbResult.international.map(mapTool) };
        }
        return matchToolsForUseCase(input.useCase, input.limit || 6);
      }),
    domesticFree: publicProcedure.query(async () => {
      const dbTools = await getDomesticFreeToolsFromDB();
      if (dbTools.length > 0) {
        return dbTools.map(t => ({
          id: t.toolId,
          name: t.name,
          category: t.category,
          isDomestic: t.isDomestic === 1,
          pricing: t.pricing,
          description: t.description || "",
          useCases: t.useCases || [],
          officialUrl: t.officialUrl || "",
          tags: t.tags || [],
        }));
      }
      return getDomesticFreeTools();
    }),
    // Admin: add/update a tool
    upsert: protectedProcedure
      .input(z.object({
        toolId: z.string(),
        name: z.string(),
        category: z.string(),
        isDomestic: z.boolean(),
        pricing: z.enum(["free", "freemium", "paid"]),
        description: z.string().optional(),
        useCases: z.array(z.string()).optional(),
        officialUrl: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await upsertAITool({
          toolId: input.toolId,
          name: input.name,
          category: input.category,
          isDomestic: input.isDomestic ? 1 : 0,
          pricing: input.pricing,
          description: input.description || "",
          useCases: input.useCases || [],
          officialUrl: input.officialUrl || "",
          tags: input.tags || [],
        });
        return { success: true };
      }),
    // Admin: soft-delete a tool
    delete: protectedProcedure
      .input(z.object({ toolId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
        await deleteAITool(input.toolId);
        return { success: true };
      }),
  }),

  // AI-powered strategy optimization
  ai: router({
    optimizeStrategy: publicProcedure
      .input(z.object({
        category: z.string(),
        description: z.string(),
        probability: z.string(),
        impact: z.string(),
        currentMitigation: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import("./_core/llm");
        const llmContext = { companyId: (ctx as any).companyId, userId: ctx.user?.id, phone: (ctx as any).userPhone, feature: "risk_optimization" };
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "你是一位资深的企业风险管理专家和AI转型顾问。请基于用户提供的风险信息，给出更优化的应对策略建议。回复必须是JSON格式。" },
            { role: "user", content: `请为以下风险提供优化的应对策略建议：\n\n风险类别：${input.category}\n风险描述：${input.description}\n发生概率：${input.probability}\n影响程度：${input.impact}\n当前缓解措施：${input.currentMitigation}\n\n请提供3条具体的优化建议，每条建议包含标题和详细说明。` },
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
                        title: { type: "string", description: "建议标题" },
                        detail: { type: "string", description: "详细说明" },
                        priority: { type: "string", description: "优先级：高/中/低" },
                      },
                      required: ["title", "detail", "priority"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "总结性建议" },
                },
                required: ["suggestions", "summary"],
                additionalProperties: false,
              },
            },
          },
        }, llmContext);
        const content = response.choices[0]?.message?.content;
        if (typeof content === "string") {
          return JSON.parse(extractJsonFromLLMResponse(content));
        }
        return content;
      }),
  }),

  // Feedback (P1-11)
  feedback: router({
    submit: publicProcedure
      .input(z.object({
        reportId: z.string(),
        chapterIndex: z.number().optional(),
        rating: z.number().min(1).max(5),
        comment: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        await db.insert(reportFeedback).values({
          reportId: input.reportId,
          chapterIndex: input.chapterIndex ?? null,
          rating: input.rating,
          comment: input.comment || null,
        });
        return { success: true };
      }),
    list: protectedProcedure
      .input(z.object({ reportId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(reportFeedback).where(eq(reportFeedback.reportId, input.reportId)).orderBy(desc(reportFeedback.createdAt));
      }),
  }),

  // Brand settings (P1-03)
  brand: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return null;
      const result = await db.select().from(brandSettings).where(eq(brandSettings.userId, ctx.user.id)).limit(1);
      return result[0] || null;
    }),
    save: protectedProcedure
      .input(z.object({ logoUrl: z.string().optional(), primaryColor: z.string().optional(), footerText: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const existing = await db.select().from(brandSettings).where(eq(brandSettings.userId, ctx.user.id)).limit(1);
        if (existing.length > 0) {
          await db.update(brandSettings).set({ logoUrl: input.logoUrl, primaryColor: input.primaryColor, footerText: input.footerText }).where(eq(brandSettings.userId, ctx.user.id));
        } else {
          await db.insert(brandSettings).values({ userId: ctx.user.id, logoUrl: input.logoUrl, primaryColor: input.primaryColor, footerText: input.footerText });
        }
        return { success: true };
      }),
  }),

  // Report distribution (P1-06)
  distribution: router({
    create: protectedProcedure
      .input(z.object({ reportId: z.string(), recipientName: z.string().optional(), recipientEmail: z.string().optional(), viewPerspective: z.enum(["hr", "staff", "executive"]).optional() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const token = nanoid(16);
        await db.insert(reportDistributions).values({
          reportId: input.reportId,
          recipientName: input.recipientName || null,
          recipientEmail: input.recipientEmail || null,
          linkToken: token,
          viewPerspective: input.viewPerspective || "staff",
        });
        return { token };
      }),
    list: protectedProcedure
      .input(z.object({ reportId: z.string() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return [];
        return db.select().from(reportDistributions).where(eq(reportDistributions.reportId, input.reportId)).orderBy(desc(reportDistributions.createdAt));
      }),
    trackOpen: publicProcedure
      .input(z.object({ token: z.string(), progress: z.number().optional() }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) return { success: false };
        const now = new Date();
        const updates: any = { lastReadAt: now };
        if (input.progress !== undefined) updates.readProgress = input.progress;
        // Set openedAt only on first open
        const existing = await db.select().from(reportDistributions).where(eq(reportDistributions.linkToken, input.token)).limit(1);
        if (existing.length > 0 && !existing[0].openedAt) updates.openedAt = now;
        await db.update(reportDistributions).set(updates).where(eq(reportDistributions.linkToken, input.token));
        return { success: true };
      }),
  }),

  // Action plan generator (P1-07)
  actionPlan: router({
    generate: protectedProcedure
      .input(z.object({ reportId: z.string(), jobTitle: z.string(), replaceabilityRate: z.number(), risks: z.array(z.string()), tools: z.array(z.string()) }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import("./_core/llm");
        const llmContext = { companyId: ctx.companyId, userId: ctx.user.id, phone: ctx.userPhone, feature: "action_plan" };
        const invoke = () => invokeLLM({
          messages: [
            { role: "system", content: "你是一位资深的企业AI转型顾问。请基于岗位分析数据，生成一份季度行动计划。只输出严格合法的 JSON，不要包含任何解释性文字或 markdown 代码块。" },
            { role: "user", content: `请为以下岗位生成季度AI转型行动计划：\n\n岗位：${input.jobTitle}\nAI替代率：${input.replaceabilityRate}%\n主要风险：${input.risks.join("、")}\n推荐工具：${input.tools.join("、")}\n\n请生成4个阶段（每月一个+总结），每个阶段包含目标、具体行动项、预期成果和关键里程碑。` },
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
                        expectedOutcome: { type: "string" },
                      },
                      required: ["title", "duration", "objective", "actions", "milestone", "expectedOutcome"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string" },
                },
                required: ["phases", "summary"],
                additionalProperties: false,
              },
            },
          },
        }, llmContext);
        return await invokeAndParseJson(
          invoke,
          (d) => !d || !Array.isArray(d.phases) || d.phases.length === 0,
          "行动计划"
        );
      }),
  }),

  // Executive summary generator (P1-08)
  executiveSummary: router({
    generate: protectedProcedure
      .input(z.object({ reportId: z.string(), jobTitle: z.string(), replaceabilityRate: z.number(), keyFindings: z.array(z.string()), recommendations: z.array(z.string()) }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import("./_core/llm");
        const llmContext = { companyId: ctx.companyId, userId: ctx.user.id, phone: ctx.userPhone, feature: "executive_summary" };
        const invoke = () => invokeLLM({
          messages: [
            { role: "system", content: "你是一位企业管理咨询顾问。请基于岗位AI转型分析结果，生成一份适合管理层阅读的汇报摘要。只输出严格合法的 JSON，不要包含任何解释性文字或 markdown 代码块。" },
            { role: "user", content: `请为以下岗位分析生成管理层汇报材料：\n\n岗位：${input.jobTitle}\nAI替代率：${input.replaceabilityRate}%\n关键发现：${input.keyFindings.join("；")}\n建议措施：${input.recommendations.join("；")}\n\n请生成3-5页幻灯片内容，每页包含标题、要点和数据支撑。` },
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
                        dataHighlight: { type: "string" },
                      },
                      required: ["title", "bulletPoints", "dataHighlight"],
                      additionalProperties: false,
                    },
                  },
                  conclusion: { type: "string" },
                },
                required: ["slides", "conclusion"],
                additionalProperties: false,
              },
            },
          },
        }, llmContext);
        return await invokeAndParseJson(
          invoke,
          (d) => !d || !Array.isArray(d.slides) || d.slides.length === 0,
          "管理层汇报"
        );
      }),
  }),

  // 平台级大模型路由管理
  adminLlm: llmModelRouter,
  adminLlmLog: llmLogRouter,

  // Permission check utility
  permission: router({
    check: protectedProcedure
      .input(z.object({ feature: z.string() }))
      .query(({ input, ctx }) => {
        return checkPermission(ctx.user, input.feature);
      }),
  }),
});

/** Centralized permission check - used by both tRPC and API routes */
export function checkPermission(user: any, feature: string): { allowed: boolean; tier: string } {
  const tier = user?.tier || "free";
  const proFeatures = ["ppt_export", "batch_analysis", "no_watermark", "custom_template", "priority_queue"];
  const enterpriseFeatures = [...proFeatures, "team_management", "api_access", "sso"];
  if (tier === "enterprise") return { allowed: true, tier };
  if (tier === "pro") return { allowed: proFeatures.includes(feature), tier };
  return { allowed: !proFeatures.includes(feature), tier };
}

/** Middleware helper to enforce permission in tRPC procedures */
export function requireFeature(feature: string) {
  return protectedProcedure.use(({ ctx, next }) => {
    const { allowed } = checkPermission(ctx.user, feature);
    if (!allowed) {
      throw new TRPCError({ code: "FORBIDDEN", message: `此功能需要升级订阅: ${feature}` });
    }
    return next({ ctx });
  });
}

export type AppRouter = typeof appRouter;
