import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// 设置环境变量
process.env.JWT_SECRET = "test-jwt-secret-for-router";
process.env.BUILT_IN_FORGE_API_KEY = "test-forge-key";
process.env.BUILT_IN_FORGE_API_URL = "https://forge.test.com";

// Mock db 模块
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// Mock ENV 模块使 forgeApiKey 可用
vi.mock("./env", () => ({
  ENV: {
    forgeApiUrl: "https://forge.test.com",
    forgeApiKey: "test-forge-key",
    appId: "",
    cookieSecret: "",
    databaseUrl: "",
    oAuthServerUrl: "",
    ownerOpenId: "",
    isProduction: false,
  },
}));

import {
  isRetryableError,
  getActiveModelsSorted,
  invalidateModelCache,
  invokeWithRouting,
  type RouteContext,
} from "./llmRouter";
import { getDb } from "../db";
import { encrypt } from "../utils/crypto";

const mockedGetDb = vi.mocked(getDb);

describe("llmRouter.ts - 核心路由与降级", () => {
  describe("错误分类器 (isRetryableError)", () => {
    describe("应触发降级切换的错误", () => {
      it("HTTP 429 Rate Limit 应可重试", () => {
        const error = new Error("LLM invoke failed: 429 Too Many Requests – rate limit exceeded");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(true);
        expect(result.httpStatus).toBe(429);
      });

      it("HTTP 500 Internal Server Error 应可重试", () => {
        const error = new Error("LLM invoke failed: 500 Internal Server Error – unknown");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(true);
        expect(result.httpStatus).toBe(500);
      });

      it("HTTP 502 Bad Gateway 应可重试", () => {
        const error = new Error("LLM invoke failed: 502 Bad Gateway – upstream error");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(true);
        expect(result.httpStatus).toBe(502);
      });

      it("HTTP 503 Service Unavailable 应可重试", () => {
        const error = new Error("LLM invoke failed: 503 Service Unavailable – overloaded");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(true);
        expect(result.httpStatus).toBe(503);
      });

      it("HTTP 504 Gateway Timeout 应可重试", () => {
        const error = new Error("LLM invoke failed: 504 Gateway Timeout – timed out");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(true);
        expect(result.httpStatus).toBe(504);
      });

      it("HTTP 401 Unauthorized (API Key 异常) 应可重试", () => {
        const error = new Error("LLM invoke failed: 401 Unauthorized – invalid api key");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(true);
        expect(result.httpStatus).toBe(401);
      });

      it("HTTP 403 Forbidden (API Key 被封禁) 应可重试", () => {
        const error = new Error("LLM invoke failed: 403 Forbidden – api key banned");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(true);
        expect(result.httpStatus).toBe(403);
      });

      it("网络超时错误应可重试", () => {
        const error = new Error("fetch failed: ETIMEDOUT");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(true);
        expect(result.reason).toContain("Network error");
      });

      it("连接被拒绝应可重试", () => {
        const error = new Error("ECONNREFUSED 127.0.0.1:443");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(true);
      });

      it("连接重置应可重试", () => {
        const error = new Error("ECONNRESET socket hang up");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(true);
      });
    });

    describe("不应触发降级切换的错误", () => {
      it("HTTP 400 Bad Request (参数错误) 不可重试", () => {
        const error = new Error("LLM invoke failed: 400 Bad Request – invalid messages format");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(false);
        expect(result.httpStatus).toBe(400);
      });

      it("HTTP 422 Unprocessable Entity (内容安全拦截) 不可重试", () => {
        const error = new Error("LLM invoke failed: 422 Unprocessable Entity – content policy violation");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(false);
        expect(result.httpStatus).toBe(422);
      });
    });

    describe("边界情况", () => {
      it("非 Error 对象应视为可重试", () => {
        const result = isRetryableError("string error");
        expect(result.retryable).toBe(true);
        expect(result.reason).toBe("string error");
      });

      it("无 HTTP 状态码的未知错误应视为可重试", () => {
        const error = new Error("Something went wrong");
        const result = isRetryableError(error);
        expect(result.retryable).toBe(true);
      });
    });
  });

  describe("模型缓存机制", () => {
    beforeEach(() => {
      invalidateModelCache();
    });

    it("invalidateModelCache 应清除缓存（幂等操作）", () => {
      invalidateModelCache();
      invalidateModelCache();
      // 不报错即通过
    });

    it("缓存有效期内不应重复查库", async () => {
      const mockModels = [
        { id: 1, modelCode: "gpt-4o", isActive: 1, isDeleted: 0, priority: 10 },
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockModels);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

      mockedGetDb.mockResolvedValue({ select: mockSelect } as any);

      // 第一次调用应查库
      const result1 = await getActiveModelsSorted();
      expect(result1).toEqual(mockModels);
      expect(mockSelect).toHaveBeenCalledTimes(1);

      // 第二次调用应命中缓存
      const result2 = await getActiveModelsSorted();
      expect(result2).toEqual(mockModels);
      expect(mockSelect).toHaveBeenCalledTimes(1); // 仍然只查了一次

      // 清除缓存后应重新查库
      invalidateModelCache();
      const result3 = await getActiveModelsSorted();
      expect(result3).toEqual(mockModels);
      expect(mockSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe("路由调度器 (invokeWithRouting)", () => {
    const mockContext: RouteContext = {
      companyId: "test-company",
      userId: 1,
      phone: "13800138000",
      feature: "job_analysis",
      source: "web",
    };

    const originalFetch = global.fetch;

    beforeEach(() => {
      invalidateModelCache();
      vi.clearAllMocks();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("无可用模型时应回退到 Forge API (fallback)", async () => {
      const mockOrderBy = vi.fn().mockResolvedValue([]);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      mockedGetDb.mockResolvedValue({ select: mockSelect } as any);

      const mockResponse = {
        id: "test-id",
        created: Date.now(),
        model: "gemini-2.5-flash",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Hello" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }) as any;

      const result = await invokeWithRouting(
        { messages: [{ role: "user", content: "test" }] },
        mockContext
      );

      expect(result.response.id).toBe("test-id");
      expect(result.metadata.finalModel).toBe("gemini-2.5-flash");
      expect(result.metadata.finalProvider).toBe("forge-builtin");
      expect(result.metadata.isSwitched).toBe(false);
      expect(result.metadata.switchTrace).toHaveLength(0);
    });

    it("模型调用成功时应返回正确的元数据和费用计算", async () => {
      const encryptedKey = encrypt("sk-test-key");
      const mockModels = [
        {
          id: 1,
          modelCode: "gpt-4o",
          modelName: "GPT-4o",
          provider: "OpenAI",
          apiUrl: "https://api.openai.com/v1/chat/completions",
          apiKey: encryptedKey,
          modelType: "chat",
          isActive: 1,
          isDeleted: 0,
          priority: 10,
          inputPrice: "0.005",
          outputPrice: "0.015",
          maxContext: 128000,
          maxOutput: 8192,
        },
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockModels);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      mockedGetDb.mockResolvedValue({ select: mockSelect } as any);

      const mockResponse = {
        id: "resp-123",
        created: Date.now(),
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "Response content" },
            finish_reason: "stop",
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      }) as any;

      const result = await invokeWithRouting(
        { messages: [{ role: "user", content: "test" }] },
        mockContext
      );

      expect(result.response.id).toBe("resp-123");
      expect(result.metadata.finalModel).toBe("gpt-4o");
      expect(result.metadata.finalProvider).toBe("OpenAI");
      expect(result.metadata.isSwitched).toBe(false);
      expect(result.metadata.originalModel).toBe("gpt-4o");
      expect(result.metadata.inputTokens).toBe(100);
      expect(result.metadata.outputTokens).toBe(50);
      expect(result.metadata.totalTokens).toBe(150);
      // 费用计算: (100 * 0.005 + 50 * 0.015) / 1000 = 0.00125
      expect(result.metadata.estimatedCost).toBeCloseTo(0.00125, 5);
      expect(result.metadata.requestId).toHaveLength(16);
      expect(result.metadata.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("首个模型失败时应自动切换到下一个模型", async () => {
      const encryptedKey1 = encrypt("sk-key-1");
      const encryptedKey2 = encrypt("sk-key-2");

      const mockModels = [
        {
          id: 1,
          modelCode: "model-primary",
          modelName: "Primary",
          provider: "ProviderA",
          apiUrl: "https://api-a.com/v1/chat/completions",
          apiKey: encryptedKey1,
          modelType: "chat",
          isActive: 1,
          isDeleted: 0,
          priority: 10,
          inputPrice: "0.01",
          outputPrice: "0.02",
          maxContext: 8192,
          maxOutput: 4096,
        },
        {
          id: 2,
          modelCode: "model-backup",
          modelName: "Backup",
          provider: "ProviderB",
          apiUrl: "https://api-b.com/v1/chat/completions",
          apiKey: encryptedKey2,
          modelType: "chat",
          isActive: 1,
          isDeleted: 0,
          priority: 50,
          inputPrice: "0.005",
          outputPrice: "0.01",
          maxContext: 16384,
          maxOutput: 4096,
        },
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockModels);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      mockedGetDb.mockResolvedValue({ select: mockSelect } as any);

      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // 第一个模型返回 503
          return Promise.resolve({
            ok: false,
            status: 503,
            statusText: "Service Unavailable",
            text: () => Promise.resolve("service overloaded"),
          });
        }
        // 第二个模型成功
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: "resp-backup",
              created: Date.now(),
              model: "model-backup",
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "Backup response" },
                  finish_reason: "stop",
                },
              ],
              usage: { prompt_tokens: 80, completion_tokens: 40, total_tokens: 120 },
            }),
        });
      }) as any;

      const result = await invokeWithRouting(
        { messages: [{ role: "user", content: "test" }] },
        mockContext
      );

      expect(result.metadata.isSwitched).toBe(true);
      expect(result.metadata.originalModel).toBe("model-primary");
      expect(result.metadata.finalModel).toBe("model-backup");
      expect(result.metadata.finalProvider).toBe("ProviderB");
      expect(result.metadata.switchTrace).toHaveLength(1);
      expect(result.metadata.switchTrace[0].modelCode).toBe("model-primary");
      expect(result.metadata.switchTrace[0].httpStatus).toBe(503);
      expect(result.metadata.switchTrace[0].failReason).toContain("503");
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("不可重试错误 (400) 不应触发降级", async () => {
      const encryptedKey1 = encrypt("sk-key-1");
      const encryptedKey2 = encrypt("sk-key-2");

      const mockModels = [
        {
          id: 1,
          modelCode: "model-primary",
          modelName: "Primary",
          provider: "ProviderA",
          apiUrl: "https://api-a.com/v1/chat/completions",
          apiKey: encryptedKey1,
          modelType: "chat",
          isActive: 1,
          isDeleted: 0,
          priority: 10,
          inputPrice: "0.01",
          outputPrice: "0.02",
          maxContext: 8192,
          maxOutput: 4096,
        },
        {
          id: 2,
          modelCode: "model-backup",
          modelName: "Backup",
          provider: "ProviderB",
          apiUrl: "https://api-b.com/v1/chat/completions",
          apiKey: encryptedKey2,
          modelType: "chat",
          isActive: 1,
          isDeleted: 0,
          priority: 50,
          inputPrice: "0.005",
          outputPrice: "0.01",
          maxContext: 16384,
          maxOutput: 4096,
        },
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockModels);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      mockedGetDb.mockResolvedValue({ select: mockSelect } as any);

      // 返回 400 Bad Request - 不可重试
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: () => Promise.resolve("invalid messages format"),
      }) as any;

      await expect(
        invokeWithRouting(
          { messages: [{ role: "user", content: "test" }] },
          mockContext
        )
      ).rejects.toThrow("Non-retryable error");

      // fetch 应该只被调用一次（不降级到第二个模型）
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it("全部模型失败时应抛出统一错误并包含完整切换轨迹", async () => {
      const encryptedKey1 = encrypt("sk-key-1");
      const encryptedKey2 = encrypt("sk-key-2");

      const mockModels = [
        {
          id: 1,
          modelCode: "model-a",
          modelName: "Model A",
          provider: "ProviderA",
          apiUrl: "https://api-a.com/v1/chat/completions",
          apiKey: encryptedKey1,
          modelType: "chat",
          isActive: 1,
          isDeleted: 0,
          priority: 10,
          inputPrice: "0.01",
          outputPrice: "0.02",
          maxContext: 8192,
          maxOutput: 4096,
        },
        {
          id: 2,
          modelCode: "model-b",
          modelName: "Model B",
          provider: "ProviderB",
          apiUrl: "https://api-b.com/v1/chat/completions",
          apiKey: encryptedKey2,
          modelType: "chat",
          isActive: 1,
          isDeleted: 0,
          priority: 50,
          inputPrice: "0.005",
          outputPrice: "0.01",
          maxContext: 16384,
          maxOutput: 4096,
        },
      ];

      const mockOrderBy = vi.fn().mockResolvedValue(mockModels);
      const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
      const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
      mockedGetDb.mockResolvedValue({ select: mockSelect } as any);

      // 所有模型都返回 500
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.resolve("server error"),
      }) as any;

      try {
        await invokeWithRouting(
          { messages: [{ role: "user", content: "test" }] },
          mockContext
        );
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).toContain("All 2 models failed");
        expect(err.requestId).toBeDefined();
        expect(err.requestId).toHaveLength(16);
        expect(err.switchTrace).toHaveLength(2);
        expect(err.switchTrace[0].modelCode).toBe("model-a");
        expect(err.switchTrace[0].provider).toBe("ProviderA");
        expect(err.switchTrace[1].modelCode).toBe("model-b");
        expect(err.switchTrace[1].provider).toBe("ProviderB");
      }

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
