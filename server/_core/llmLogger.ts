import { getDb } from "../db";
import { llmCallLogs } from "../../drizzle/schema";
import type { RouteContext, RouteInvokeResult, SwitchRecord } from "./llmRouter";

// ============================================================
// 类型定义
// ============================================================

/** 日志记录参数 */
export type LogEntry = {
  requestId: string;
  context: RouteContext;
  success: boolean;
  failReason?: string;
  httpStatus?: number;
  modelCode: string;
  modelName?: string;
  provider?: string;
  isSwitched: boolean;
  originalModel?: string;
  switchTrace: SwitchRecord[];
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputPrice?: string;
  outputPrice?: string;
  estimatedCost: number;
  requestTime: Date;
  responseTime: Date;
  durationMs: number;
};

// ============================================================
// 异步日志写入（非阻塞）
// ============================================================

/**
 * 异步记录 LLM 调用日志
 *
 * 采用 fire-and-forget 模式，不阻塞主业务流程。
 * 日志写入失败仅打印警告，不影响业务返回。
 */
export function recordCallLog(entry: LogEntry): void {
  // 使用 setImmediate/Promise 确保不阻塞当前调用
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
        companyName: null, // 后续可通过企业ID关联查询
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
        durationMs: entry.durationMs,
      });
    } catch (err) {
      console.error("[LLM Logger] Failed to write log:", err);
    }
  });
}

// ============================================================
// 便捷方法：从路由结果生成日志
// ============================================================

/**
 * 记录成功调用的日志
 */
export function logSuccess(
  result: RouteInvokeResult,
  context: RouteContext,
  modelInfo: { modelName?: string; inputPrice?: string; outputPrice?: string }
): void {
  const now = new Date();
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
    durationMs: result.metadata.durationMs,
  });
}

/**
 * 记录失败调用的日志
 */
export function logFailure(
  requestId: string,
  context: RouteContext,
  error: {
    message: string;
    httpStatus?: number;
    switchTrace?: SwitchRecord[];
    modelCode?: string;
    provider?: string;
    originalModel?: string;
  },
  durationMs: number
): void {
  const now = new Date();
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
    durationMs,
  });
}

// ============================================================
// 解析结果补记日志
// ============================================================

/**
 * 记录"分析链步骤解析结果"日志。
 *
 * 背景：原有 logSuccess/logFailure 只反映 LLM 接口调用层面的成败，
 * 无法体现"接口成功但返回 JSON 解析失败/内容为空"的情况。
 * 本函数把解析结果（direct/repaired/failed/empty）以一条独立日志写入 llm_call_logs，
 * 不新增表字段：解析失败/为空记为 success=0 并在 failReason 中说明，便于在调用日志中排查。
 */
export function recordParseLog(params: {
  context: RouteContext;
  stepId: number;
  stepTitle: string;
  outcome: "direct" | "repaired" | "failed" | "empty";
  detail?: string;
  emptyKeys?: string[];
}): void {
  const { context, stepId, stepTitle, outcome, detail, emptyKeys } = params;
  // direct（一次解析成功且内容完整）不单独记日志，避免日志量翻倍
  if (outcome === "direct") return;

  const ok = outcome === "repaired";
  const reasonMap: Record<string, string> = {
    repaired: `[解析修复] Step${stepId}「${stepTitle}」原始JSON非法，已自动修复后解析成功`,
    failed: `[解析失败] Step${stepId}「${stepTitle}」JSON解析失败：${detail || "未知"}`,
    empty: `[内容为空] Step${stepId}「${stepTitle}」解析成功但关键字段缺失：${(emptyKeys || []).join(", ") || "未知"}`,
  };

  recordCallLog({
    requestId: `parse_${stepId}_${Date.now()}`,
    context: { ...context, feature: `${context.feature || "job_analysis"}:parse` },
    success: ok,
    failReason: reasonMap[outcome],
    httpStatus: ok ? 200 : 0,
    modelCode: "parse-check",
    modelName: "解析校验",
    isSwitched: false,
    switchTrace: [],
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    requestTime: new Date(),
    responseTime: new Date(),
    durationMs: 0,
  });
}
