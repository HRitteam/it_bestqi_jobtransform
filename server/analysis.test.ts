import { describe, expect, it } from "vitest";
import { checkNeedsConfirmation } from "./analysis";

describe("checkNeedsConfirmation", () => {
  it("returns needsConfirmation=true when jobTitle is missing", () => {
    const result = checkNeedsConfirmation({
      jobTitle: "",
      company: "Test Corp",
      industry: "Tech",
      inputText: "some text",
      fileContents: [],
    });
    expect(result.needsConfirmation).toBe(true);
    expect(result.assumptions.length).toBeGreaterThan(0);
  });

  it("returns needsConfirmation=false when all fields are present", () => {
    const result = checkNeedsConfirmation({
      jobTitle: "产品经理",
      company: "Test Corp",
      industry: "Tech",
      inputText: "岗位名称：产品经理",
      fileContents: [],
    });
    expect(result.needsConfirmation).toBe(false);
  });

  it("generates assumptions with correct structure", () => {
    const result = checkNeedsConfirmation({
      jobTitle: "",
      company: "",
      industry: "",
      inputText: "",
      fileContents: [],
    });
    expect(result.needsConfirmation).toBe(true);
    expect(result.assumptions).toHaveLength(3);
    result.assumptions.forEach((a) => {
      expect(a).toHaveProperty("field");
      expect(a).toHaveProperty("label");
      expect(a).toHaveProperty("value");
      expect(a).toHaveProperty("editable");
      expect(a.editable).toBe(true);
    });
  });

  it("only returns assumptions for missing fields", () => {
    const result = checkNeedsConfirmation({
      jobTitle: "HRBP",
      company: "",
      industry: "金融",
      inputText: "",
      fileContents: [],
    });
    // When jobTitle is present, needsConfirmation is false even with missing company
    expect(result.needsConfirmation).toBe(false);
    const fields = result.assumptions.map((a) => a.field);
    expect(fields).not.toContain("jobTitle");
    expect(fields).toContain("company");
    expect(fields).not.toContain("industry");
  });
});

describe("report router types", () => {
  it("ANALYSIS_STEPS should have 9 steps", async () => {
    // Verify the step count matches the requirement
    const { STEP_DEFINITIONS } = await import("./analysis");
    expect(STEP_DEFINITIONS).toHaveLength(9);
  });

  it("each step definition should have required fields", async () => {
    const { STEP_DEFINITIONS } = await import("./analysis");
    STEP_DEFINITIONS.forEach((step: any) => {
      expect(step).toHaveProperty("id");
      expect(step).toHaveProperty("title");
      expect(step).toHaveProperty("prompt");
      expect(step).toHaveProperty("schema");
      expect(typeof step.prompt).toBe("function");
    });
  });
});

// We need to test the internal functions, so we import the module and test via STEP_DEFINITIONS
describe("AI Tool Catalog enforcement", () => {
  it("toolCatalog.ts should contain diverse tool pairs", async () => {
    const { TOOL_CATALOG } = await import("./toolCatalog");
    // Should have 60+ tool pairs
    expect(TOOL_CATALOG.length).toBeGreaterThan(60);
    // Should contain key tools
    const allNames = TOOL_CATALOG.map(t => `${t.international}/${t.domestic}`);
    expect(allNames.some(n => n.includes("ChatGPT"))).toBe(true);
    expect(allNames.some(n => n.includes("DeepSeek"))).toBe(true);
    expect(allNames.some(n => n.includes("Cursor"))).toBe(true);
    expect(allNames.some(n => n.includes("Midjourney"))).toBe(true);
    expect(allNames.some(n => n.includes("Zapier"))).toBe(true);
    expect(allNames.some(n => n.includes("Suno"))).toBe(true);
  });

  it("toolCatalog should contain diverse categories", async () => {
    const { TOOL_CATALOG } = await import("./toolCatalog");
    const categories = new Set(TOOL_CATALOG.map(t => t.category));
    // Should have many categories
    expect(categories.size).toBeGreaterThan(12);
    // Check key categories exist
    ["llm", "coding", "image", "video", "audio", "agent", "design", "data"].forEach(cat => {
      expect(categories.has(cat)).toBe(true);
    });
  });

  it("Step 4 prompt should reference tool list and prohibition rules", async () => {
    const { STEP_DEFINITIONS } = await import("./analysis");
    const step4 = STEP_DEFINITIONS.find((s: any) => s.id === 4);
    expect(step4).toBeDefined();
    const prompt = step4!.prompt(
      { jobTitle: "测试", inputText: "test", fileContents: [] },
      [{ step: 1, title: "test", data: {} }, { step: 2, title: "test", data: {} }, { step: 3, title: "test", data: {} }]
    );
    expect(prompt).toContain("可选工具列表");
    expect(prompt).toContain("禁止");
    expect(prompt).toContain("ChatGPT/DeepSeek");
  });

  it("Step 7 prompt should reference tool list and prohibition rules", async () => {
    const { STEP_DEFINITIONS } = await import("./analysis");
    const step7 = STEP_DEFINITIONS.find((s: any) => s.id === 7);
    expect(step7).toBeDefined();
    const prompt = step7!.prompt(
      { jobTitle: "测试", inputText: "test", fileContents: [] },
      [
        { step: 1, title: "test", data: {} },
        { step: 2, title: "test", data: {} },
        { step: 3, title: "test", data: {} },
        { step: 4, title: "test", data: {} },
        { step: 5, title: "test", data: {} },
      ]
    );
    expect(prompt).toContain("可选工具列表");
    expect(prompt).toContain("禁止");
  });

  it("getFilteredToolsForJob should filter by job family", async () => {
    const { getFilteredToolsForJob } = await import("./toolCatalog");
    // Software developer should get coding tools
    const devResult = getFilteredToolsForJob("前端开发工程师");
    const devCategories = new Set(devResult.filteredTools.map(t => t.category));
    expect(devCategories.has("coding")).toBe(true);
    // HR should NOT get coding tools
    const hrResult = getFilteredToolsForJob("HRBP");
    const hrCategories = new Set(hrResult.filteredTools.map(t => t.category));
    expect(hrCategories.has("coding")).toBe(false);
    expect(hrCategories.has("hr")).toBe(true);
  });

  it("inferJobFamilies should always include 通用办公", async () => {
    const { inferJobFamilies } = await import("./toolCatalog");
    const families = inferJobFamilies("任意岗位");
    expect(families).toContain("通用办公");
  });
});

describe("Brand naming consistency", () => {
  it("index.html should use new platform name", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/index.html", "utf-8");
    expect(content).toContain("岗位/职能AI转型分析平台");
    expect(content).not.toContain("岗位AI转型智能体交互系统");
  });

  it("AppLayout should use new platform name", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/components/AppLayout.tsx", "utf-8");
    expect(content).toContain("岗位/职能AI转型分析平台");
    expect(content).not.toContain("AI 转型平台");
  });

  it("Home page should use updated title", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/pages/Home.tsx", "utf-8");
    expect(content).toContain("岗位/职能AI转型");
    expect(content).not.toContain("AI 岗位转型深度分析");
  });

  it("Export utils should use new brand name", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("client/src/lib/exportUtils.ts", "utf-8");
    expect(content).toContain("岗位/职能AI转型");
    expect(content).not.toContain("AI Job Transform Platform");
  });
});


describe("sanitizeStepData - Step 5 ratio normalization", () => {
  it("should convert decimal ratios (0.6/0.4) to percentages (60/40)", async () => {
    const { sanitizeStepData } = await import("./analysis");
    const data = {
      newTasks: [
        { id: 1, name: "Test", description: "test", humanRatio: 0.6, aiRatio: 0.4, collaborationMode: "hybrid", newSkillsRequired: [] },
      ],
      summary: "test",
    };
    const result = sanitizeStepData(5, data);
    expect(result.newTasks[0].humanRatio).toBe(60);
    expect(result.newTasks[0].aiRatio).toBe(40);
  });

  it("should leave correct percentages (60/40) unchanged", async () => {
    const { sanitizeStepData } = await import("./analysis");
    const data = {
      newTasks: [
        { id: 1, name: "Test", description: "test", humanRatio: 60, aiRatio: 40, collaborationMode: "hybrid", newSkillsRequired: [] },
      ],
      summary: "test",
    };
    const result = sanitizeStepData(5, data);
    expect(result.newTasks[0].humanRatio).toBe(60);
    expect(result.newTasks[0].aiRatio).toBe(40);
  });

  it("should normalize ratios that don't sum to 100", async () => {
    const { sanitizeStepData } = await import("./analysis");
    const data = {
      newTasks: [
        { id: 1, name: "Test", description: "test", humanRatio: 30, aiRatio: 30, collaborationMode: "hybrid", newSkillsRequired: [] },
      ],
      summary: "test",
    };
    const result = sanitizeStepData(5, data);
    expect(result.newTasks[0].humanRatio + result.newTasks[0].aiRatio).toBe(100);
  });

  it("should handle edge case of 0/0 ratios", async () => {
    const { sanitizeStepData } = await import("./analysis");
    const data = {
      newTasks: [
        { id: 1, name: "Test", description: "test", humanRatio: 0, aiRatio: 0, collaborationMode: "hybrid", newSkillsRequired: [] },
      ],
      summary: "test",
    };
    const result = sanitizeStepData(5, data);
    expect(result.newTasks[0].humanRatio).toBe(0);
    expect(result.newTasks[0].aiRatio).toBe(0);
  });
});
