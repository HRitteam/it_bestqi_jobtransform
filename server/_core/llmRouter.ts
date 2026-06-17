import { eq, and, asc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "../db";
import { llmModels } from "../../drizzle/schema";
import type { LlmModel } from "../../drizzle/schema";
import { decrypt } from "../utils/crypto";
import { ENV } from "./env";
import type { InvokeParams, InvokeResult } from "./llm";
import { logSuccess, logFailure } from "./llmLogger";

// ============================================================
// 类型定义
// ============================================================

/** 路由调用上下文，用于日志记录 */
export type RouteContext = {
  companyId?: string;
  userId?: number;
  phone?: string;
  feature: string; // 使用功能标识，如 "job_analysis", "ai_chat"
  source?: string; // 请求来源，如 "web", "api"
};

/** 单次模型切换记录 */
export type SwitchRecord = {
  modelCode: string;
  provider: string;
  failReason: string;
  durationMs: number;
  httpStatus?: number;
};

/** 路由调用结果（包含元数据） */
export type RouteInvokeResult = {
  response: InvokeResult;
  metadata: {
    requestId: string;
    finalModel: string;
    finalProvider: string;
    isSwitched: boolean;
    originalModel: string;
    switchTrace: SwitchRecord[];
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    durationMs: number;
  };
};

// ============================================================
// 模型缓存机制
// ============================================================

/** 缓存的模型列表 */
let cachedModels: LlmModel[] | null = null;
/** 缓存过期时间戳 */
let cacheExpireAt: number = 0;
/** 缓存 TTL（毫秒），默认 60 秒 */
const CACHE_TTL_MS = 60_000;

/**
 * 获取已启用的模型列表（按优先级升序排列）
 * 使用内存缓存避免频繁查库，TTL 为 60 秒
 */
export async function getActiveModelsSorted(): Promise<LlmModel[]> {
  const now = Date.now();

  if (cachedModels && now < cacheExpireAt) {
    return cachedModels;
  }

  const db = await getDb();
  if (!db) {
    return [];
  }

  const models = await db
    .select()
    .from(llmModels)
    .where(and(eq(llmModels.isActive, 1), eq(llmModels.isDeleted, 0)))
    .orderBy(asc(llmModels.priority));

  cachedModels = models;
  cacheExpireAt = now + CACHE_TTL_MS;

  return models;
}

/**
 * 手动清除模型缓存
 * 在管理员修改模型配置后调用，确保下次请求使用最新配置
 */
export function invalidateModelCache(): void {
  cachedModels = null;
  cacheExpireAt = 0;
}

// ============================================================
// 错误分类器
// ============================================================

/** 可重试的 HTTP 状态码 */
const RETRYABLE_STATUS_CODES = new Set([
  429, // Rate Limit
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
  401, // Unauthorized (API Key 异常)
  403, // Forbidden (API Key 被封禁)
]);

/** 不可重试的 HTTP 状态码 */
const NON_RETRYABLE_STATUS_CODES = new Set([
  400, // Bad Request (参数错误、上下文超长)
  422, // Unprocessable Entity (内容安全拦截)
]);

/**
 * 判断错误是否可重试（即是否应触发降级切换）
 *
 * 触发切换的错误：
 * - HTTP 5xx（服务器内部错误、网关超时等）
 * - HTTP 429（Rate Limit 限流）
 * - HTTP 401/403（API Key 异常）
 * - 请求超时（网络层错误）
 *
 * 不触发切换的错误：
 * - HTTP 400（参数错误、上下文超长）
 * - HTTP 422（内容安全拦截）
 */
export function isRetryableError(error: unknown): {
  retryable: boolean;
  httpStatus?: number;
  reason: string;
} {
  if (error instanceof Error) {
    const message = error.message;

    // 解析 HTTP 状态码 (从 "LLM invoke failed: 429 ..." 格式中提取)
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

    // 网络超时类错误
    if (
      message.includes("timeout") ||
      message.includes("ETIMEDOUT") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ECONNRESET") ||
      message.includes("fetch failed") ||
      message.includes("network")
    ) {
      return { retryable: true, reason: `Network error: ${message}` };
    }

    // 默认：未知错误视为可重试
    return { retryable: true, reason: message };
  }

  return { retryable: true, reason: String(error) };
}

// ============================================================
// 核心路由调度器
// ============================================================

/**
 * 构建请求 payload（与原 invokeLLM 逻辑一致）
 */
function buildPayload(params: InvokeParams, model: string): Record<string, unknown> {
  // 延迟导入避免循环依赖，复用 llm.ts 中的 normalize 函数
  const { messages, tools, toolChoice, tool_choice, outputSchema, output_schema, responseFormat, response_format } = params;

  const normalizeMessage = (message: any) => {
    const { role, name, tool_call_id } = message;
    if (role === "tool" || role === "function") {
      const content = (Array.isArray(message.content) ? message.content : [message.content])
        .map((part: any) => (typeof part === "string" ? part : JSON.stringify(part)))
        .join("\n");
      return { role, name, tool_call_id, content };
    }
    const contentArr = Array.isArray(message.content) ? message.content : [message.content];
    const contentParts = contentArr.map((part: any) => {
      if (typeof part === "string") return { type: "text", text: part };
      return part;
    });
    if (contentParts.length === 1 && contentParts[0].type === "text") {
      return { role, name, content: contentParts[0].text };
    }
    return { role, name, content: contentParts };
  };

  const payload: Record<string, unknown> = {
    model,
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) {
    payload.tools = tools;
  }

  // Tool choice normalization
  const tc = toolChoice || tool_choice;
  if (tc) {
    if (tc === "none" || tc === "auto") {
      payload.tool_choice = tc;
    } else if (tc === "required") {
      if (tools && tools.length === 1) {
        payload.tool_choice = { type: "function", function: { name: tools[0].function.name } };
      }
    } else if (typeof tc === "object" && "name" in tc) {
      payload.tool_choice = { type: "function", function: { name: (tc as any).name } };
    } else {
      payload.tool_choice = tc;
    }
  }

  payload.max_tokens = 32768;
  // 注意：thinking 参数仅 Claude 模型支持，其他模型会返回 400 错误，故移除

  // Response format - auto-downgrade json_schema to json_object for compatibility
  const explicitFormat = responseFormat || response_format;
  const schema = outputSchema || output_schema;
  if (explicitFormat) {
    // If json_schema is requested, downgrade to json_object for broader model compatibility
    // Most Chinese LLM providers (Kimi, DeepSeek, MiniMax, Qwen) don't support json_schema
    if ((explicitFormat as any).type === "json_schema") {
      payload.response_format = { type: "json_object" };
      // Inject schema definition into the last user message so LLM knows the expected structure
      const jsonSchema = (explicitFormat as any).json_schema?.schema;
      if (jsonSchema && Array.isArray(payload.messages)) {
        const msgs = payload.messages as any[];
        const lastUserIdx = msgs.findLastIndex((m: any) => m.role === "user");
        if (lastUserIdx >= 0) {
          const schemaHint = `\n\n【输出JSON格式要求】请严格按照以下JSON Schema结构输出，字段名必须完全一致：\n${JSON.stringify(jsonSchema, null, 2)}`;
          msgs[lastUserIdx] = { ...msgs[lastUserIdx], content: (msgs[lastUserIdx].content || "") + schemaHint };
        }
      }
    } else {
      payload.response_format = explicitFormat;
    }
  } else if (schema && (schema as any).name && (schema as any).schema) {
    // outputSchema also gets downgraded to json_object
    payload.response_format = { type: "json_object" };
    // Also inject schema hint for outputSchema
    if (Array.isArray(payload.messages)) {
      const msgs = payload.messages as any[];
      const lastUserIdx = msgs.findLastIndex((m: any) => m.role === "user");
      if (lastUserIdx >= 0) {
        const schemaHint = `\n\n【输出JSON格式要求】请严格按照以下JSON Schema结构输出，字段名必须完全一致：\n${JSON.stringify((schema as any).schema, null, 2)}`;
        msgs[lastUserIdx] = { ...msgs[lastUserIdx], content: (msgs[lastUserIdx].content || "") + schemaHint };
      }
    }
  }

  return payload;
}

/**
 * 向指定模型发起 HTTP 请求
 */
async function executeModelRequest(
  model: LlmModel,
  params: InvokeParams
): Promise<InvokeResult> {
  const apiKey = decrypt(model.apiKey);
  // 使用 modelCode 字段作为 API 的 model 参数（如 moonshot-v1-32k, deepseek-chat, qwen-plus）
  const payload = buildPayload(params, model.modelCode);

  // 自动补全 apiUrl 路径：如果不以 /chat/completions 结尾则追加
  const apiEndpoint = model.apiUrl.replace(/\/$/, "").endsWith("/chat/completions")
    ? model.apiUrl
    : `${model.apiUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(apiEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as InvokeResult;
}

/**
 * 带路由和降级的 LLM 调用
 *
 * 核心流程：
 * 1. 获取按优先级排序的可用模型池
 * 2. 从第一顺位模型开始尝试调用
 * 3. 如果发生可重试错误，自动切换到下一顺位模型
 * 4. 如果发生不可重试错误，直接抛出
 * 5. 全部模型失败后，返回统一错误
 *
 * @param params - LLM 调用参数（与原 invokeLLM 相同）
 * @param context - 路由上下文（用于日志记录）
 * @returns 调用结果及路由元数据
 */
export async function invokeWithRouting(
  params: InvokeParams,
  context: RouteContext
): Promise<RouteInvokeResult> {
  const models = await getActiveModelsSorted();

  // 如果没有配置任何模型，回退到原有的 Forge API 调用
  if (models.length === 0) {
    return await invokeFallback(params, context);
  }

  const requestId = nanoid(16);
  const originalModel = models[0];
  const switchTrace: SwitchRecord[] = [];
  const overallStartTime = Date.now();

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const attemptStartTime = Date.now();

    try {
      const response = await executeModelRequest(model, params);

      // 提取 Token 使用量
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const totalTokens = response.usage?.total_tokens || (inputTokens + outputTokens);

      // 计算预估费用
      const inputPrice = parseFloat(model.inputPrice) || 0;
      const outputPrice = parseFloat(model.outputPrice) || 0;
      const estimatedCost =
        (inputTokens * inputPrice + outputTokens * outputPrice) / 1000;

      const routeResult: RouteInvokeResult = {
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
          durationMs: Date.now() - overallStartTime,
        },
      };

      // 异步记录成功日志
      logSuccess(routeResult, context, {
        modelName: model.modelName,
        inputPrice: model.inputPrice,
        outputPrice: model.outputPrice,
      });

      return routeResult;
    } catch (error) {
      const { retryable, httpStatus, reason } = isRetryableError(error);
      const attemptDuration = Date.now() - attemptStartTime;

      // 记录切换轨迹
      switchTrace.push({
        modelCode: model.modelCode,
        provider: model.provider,
        failReason: reason,
        durationMs: attemptDuration,
        httpStatus,
      });

      // 不可重试错误：直接抛出，不降级
      if (!retryable) {
        // 异步记录失败日志
        logFailure(requestId, context, {
          message: reason,
          httpStatus,
          switchTrace,
          modelCode: model.modelCode,
          provider: model.provider,
          originalModel: originalModel.modelCode,
        }, Date.now() - overallStartTime);

        const err = new Error(
          `[LLM Router] Non-retryable error from model "${model.modelCode}": ${reason}`
        );
        (err as any).requestId = requestId;
        (err as any).switchTrace = switchTrace;
        (err as any).httpStatus = httpStatus;
        throw err;
      }

      // 可重试但已是最后一个模型：全链路失败
      if (i === models.length - 1) {
        // 异步记录全链路失败日志
        logFailure(requestId, context, {
          message: `All ${models.length} models failed. Last error: ${reason}`,
          httpStatus,
          switchTrace,
          modelCode: model.modelCode,
          provider: model.provider,
          originalModel: originalModel.modelCode,
        }, Date.now() - overallStartTime);

        const err = new Error(
          `[LLM Router] All ${models.length} models failed. Last error: ${reason}`
        );
        (err as any).requestId = requestId;
        (err as any).switchTrace = switchTrace;
        throw err;
      }

      // 继续尝试下一个模型
      console.warn(
        `[LLM Router] Model "${model.modelCode}" failed (${reason}), switching to next model...`
      );
    }
  }

  // 理论上不会到达这里
  throw new Error("[LLM Router] Unexpected: no models processed");
}

/**
 * Fallback：当数据库中没有配置任何模型时，使用原有的 Forge API
 * 保证向后兼容，不会因为未配置模型而导致系统不可用
 */
async function invokeFallback(
  params: InvokeParams,
  context: RouteContext
): Promise<RouteInvokeResult> {
  const startTime = Date.now();
  const requestId = nanoid(16);

  // 使用原有的 Forge API 配置
  if (!ENV.forgeApiKey) {
    throw new Error("No LLM models configured and BUILT_IN_FORGE_API_KEY is not set");
  }

  const apiUrl = ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.im/v1/chat/completions";

  const payload = buildPayload(params, "gemini-2.5-flash");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed (fallback): ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const result = (await response.json()) as InvokeResult;
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
      durationMs: Date.now() - startTime,
    },
  };
}

// ============================================================
// 兼容层：保持原有 invokeLLM 接口不变
// ============================================================

/**
 * 兼容性封装：保持与原 invokeLLM 相同的调用签名和返回值
 * 内部自动使用路由服务，对调用方完全透明
 *
 * @param params - 与原 invokeLLM 相同的参数
 * @param context - 可选的路由上下文（不传则使用默认值）
 */
export async function invokeWithRoutingCompat(
  params: InvokeParams,
  context?: Partial<RouteContext>
): Promise<InvokeResult> {
  const fullContext: RouteContext = {
    feature: context?.feature || "unknown",
    companyId: context?.companyId,
    userId: context?.userId,
    phone: context?.phone,
    source: context?.source || "web",
  };

  const result = await invokeWithRouting(params, fullContext);
  return result.response;
}
