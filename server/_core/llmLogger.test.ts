import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock database
const mockInsert = vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: () => mockInsert(),
  }),
}));

vi.mock("../../drizzle/schema", () => ({
  llmCallLogs: { tableName: "llm_call_logs" },
}));

import { recordCallLog, logSuccess, logFailure } from "./llmLogger";
import type { RouteInvokeResult, RouteContext } from "./llmRouter";

describe("LLM Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("recordCallLog", () => {
    it("should record a successful call log asynchronously", async () => {
      const entry = {
        requestId: "test-req-001",
        context: {
          companyId: "company-1",
          userId: 1,
          phone: "13800138000",
          feature: "job_analysis",
          source: "web",
        } as RouteContext,
        success: true,
        modelCode: "gpt-4o",
        modelName: "GPT-4o",
        provider: "OpenAI",
        isSwitched: false,
        originalModel: "gpt-4o",
        switchTrace: [],
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        inputPrice: "0.03",
        outputPrice: "0.06",
        estimatedCost: 0.06,
        requestTime: new Date("2026-05-08T10:00:00Z"),
        responseTime: new Date("2026-05-08T10:00:02Z"),
        durationMs: 2000,
      };

      recordCallLog(entry);

      // Wait for async execution
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockInsert).toHaveBeenCalled();
    });

    it("should handle database unavailability gracefully", async () => {
      const { getDb } = await import("../db");
      (getDb as any).mockResolvedValueOnce(null);

      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      recordCallLog({
        requestId: "test-req-002",
        context: { feature: "test" } as RouteContext,
        success: true,
        modelCode: "test-model",
        isSwitched: false,
        switchTrace: [],
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        requestTime: new Date(),
        responseTime: new Date(),
        durationMs: 100,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Database unavailable"),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });

    it("should handle insert errors gracefully without throwing", async () => {
      mockInsert.mockReturnValueOnce({
        values: vi.fn().mockRejectedValue(new Error("DB write error")),
      });

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      recordCallLog({
        requestId: "test-req-003",
        context: { feature: "test" } as RouteContext,
        success: false,
        failReason: "timeout",
        modelCode: "test-model",
        isSwitched: false,
        switchTrace: [],
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        requestTime: new Date(),
        responseTime: new Date(),
        durationMs: 5000,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to write log"),
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("logSuccess", () => {
    it("should construct correct log entry from route result", async () => {
      const result: RouteInvokeResult = {
        response: { choices: [], usage: { prompt_tokens: 800, completion_tokens: 200, total_tokens: 1000 } } as any,
        metadata: {
          requestId: "success-001",
          finalModel: "deepseek-v3",
          finalProvider: "DeepSeek",
          isSwitched: true,
          originalModel: "gpt-4o",
          switchTrace: [
            { modelCode: "gpt-4o", provider: "OpenAI", failReason: "429 Rate Limit", durationMs: 100, httpStatus: 429 },
          ],
          inputTokens: 800,
          outputTokens: 200,
          totalTokens: 1000,
          estimatedCost: 0.004,
          durationMs: 1500,
        },
      };

      const context: RouteContext = {
        companyId: "comp-abc",
        userId: 42,
        phone: "13900139000",
        feature: "job_analysis",
        source: "web",
      };

      logSuccess(result, context, {
        modelName: "DeepSeek V3",
        inputPrice: "0.002",
        outputPrice: "0.006",
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe("logFailure", () => {
    it("should construct correct failure log entry", async () => {
      const context: RouteContext = {
        companyId: "comp-xyz",
        feature: "ai_chat",
        source: "api",
      };

      logFailure("fail-001", context, {
        message: "All 3 models failed",
        httpStatus: 503,
        switchTrace: [
          { modelCode: "gpt-4o", provider: "OpenAI", failReason: "503", durationMs: 200, httpStatus: 503 },
          { modelCode: "deepseek-v3", provider: "DeepSeek", failReason: "timeout", durationMs: 5000 },
          { modelCode: "qwen-max", provider: "Alibaba", failReason: "503", durationMs: 300, httpStatus: 503 },
        ],
        modelCode: "qwen-max",
        provider: "Alibaba",
        originalModel: "gpt-4o",
      }, 5500);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockInsert).toHaveBeenCalled();
    });

    it("should handle missing optional fields", async () => {
      const context: RouteContext = {
        feature: "unknown",
      };

      logFailure("fail-002", context, {
        message: "Network error",
      }, 3000);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockInsert).toHaveBeenCalled();
    });
  });
});
