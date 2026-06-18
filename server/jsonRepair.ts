/**
 * JSON 解析增强工具
 *
 * 目的：当 LLM 返回的内容不是严格合法 JSON（被截断、混入说明文字、尾随逗号、
 * 单引号、智能引号等）时，尽最大努力修复并解析，降低「调用成功但内容为空」的概率。
 *
 * 同时提供：
 * - 字段别名归一化（把 taskList/workflow 等别名映射回 schema 期望的字段名）
 * - 步骤关键字段定义与空内容检测（供生成后定向补全使用）
 */

/**
 * 从一段文本中尽量提取出 JSON 字符串。
 * 处理：<think> 标签、markdown 代码块、前后说明文字。
 */
export function extractJsonString(content: string): string {
  let s = content || "";
  // 去除 <think>...</think> 思维链
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, "");
  // 优先取 markdown 代码块中的内容
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) {
    s = fence[1];
  }
  s = s.trim();
  // 截取最外层的 { ... } 或 [ ... ]，丢弃前后多余文字
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

/**
 * 修复常见的 JSON 语法问题：
 * - 智能引号 → 普通引号
 * - 尾随逗号
 * - 截断导致的括号不闭合（按栈补全）
 */
export function repairJson(input: string): string {
  let s = input;
  // 智能引号归一化
  s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
  // 去除 // 行注释和 /* */ 块注释（保守处理，避免误伤字符串内容）
  s = s.replace(/^\s*\/\/.*$/gm, "");
  // 去除对象/数组中的尾随逗号： ,} 或 ,]
  s = s.replace(/,\s*([}\]])/g, "$1");

  // 括号闭合补全：基于字符串感知扫描，避免把字符串内的括号算进去
  const stack: string[] = [];
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
  // 如果字符串在未闭合状态结束，先补一个引号
  if (inStr) {
    s += strCh;
  }
  // 去掉可能因截断残留的尾随逗号再补括号
  s = s.replace(/,\s*$/g, "");
  while (stack.length > 0) {
    const open = stack.pop();
    s += open === "{" ? "}" : "]";
  }
  return s;
}

/**
 * 解析结果枚举，便于调用方记录日志。
 */
export type ParseOutcome = "direct" | "repaired" | "failed";

export interface ParseResult {
  data: any;
  outcome: ParseOutcome;
  error?: string;
}

/**
 * 强健解析：先尝试直接解析，失败后做提取+修复再解析。
 */
export function robustParseJson(content: string): ParseResult {
  // 1) 直接尝试
  const extracted = extractJsonString(content);
  try {
    return { data: JSON.parse(extracted), outcome: "direct" };
  } catch (_) {
    /* fall through */
  }
  // 2) 修复后再尝试
  try {
    const repaired = repairJson(extracted);
    return { data: JSON.parse(repaired), outcome: "repaired" };
  } catch (e: any) {
    return { data: null, outcome: "failed", error: e?.message || String(e) };
  }
}

/**
 * 各步骤的"主数组/主对象"关键字段及其常见别名。
 * 用于：① 字段别名归一化；② 空内容检测。
 */
export interface StepKeySpec {
  /** schema 期望的主字段名 */
  key: string;
  /** 该字段的类型：array 需非空数组，object 需非空对象 */
  type: "array" | "object";
  /** 模型可能错误使用的别名 */
  aliases: string[];
}

export const STEP_KEY_SPECS: Record<number, StepKeySpec[]> = {
  1: [{ key: "coreResponsibilities", type: "array", aliases: ["responsibilities", "duties", "coreDuties"] }],
  2: [{ key: "dimensions", type: "array", aliases: ["dimensionList", "analysis", "items"] }],
  3: [{ key: "tasks", type: "array", aliases: ["taskList", "workflow", "workflowTasks", "nodes", "taskNodes", "items"] }],
  4: [{ key: "recommendations", type: "array", aliases: ["recommendation", "tools", "toolRecommendations", "items"] }],
  5: [{ key: "newTasks", type: "array", aliases: ["tasks", "taskList", "newWorkflow", "workflow", "items"] }],
  6: [
    { key: "dimensions", type: "array", aliases: ["comparison", "comparisons", "items"] },
    { key: "roiPlans", type: "array", aliases: ["plans", "roi", "roiOptions"] },
  ],
  7: [
    { key: "taskClassification", type: "object", aliases: ["classification", "taskCategories"] },
    { key: "roadmap", type: "array", aliases: ["phases", "implementationRoadmap", "plan"] },
  ],
  8: [
    { key: "risks", type: "array", aliases: ["riskList", "riskItems", "items"] },
    { key: "kpis", type: "array", aliases: ["kpiList", "kpi", "metrics"] },
  ],
  9: [{ key: "competencies", type: "array", aliases: ["competencyList", "abilities", "items"] }],
};

function isEmptyValue(spec: StepKeySpec, value: any): boolean {
  if (value === undefined || value === null) return true;
  if (spec.type === "array") return !Array.isArray(value) || value.length === 0;
  if (spec.type === "object") return typeof value !== "object" || Object.keys(value).length === 0;
  return false;
}

/**
 * 字段别名归一化：若主字段缺失/为空但存在别名字段，则把别名值搬到主字段。
 */
export function normalizeStepAliases(stepId: number, data: any): any {
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

/**
 * 检测某步骤数据是否"内容为空"（缺少关键主字段）。
 * 返回为空的关键字段名数组；空数组表示内容完整。
 */
export function detectEmptyStepKeys(stepId: number, data: any): string[] {
  const specs = STEP_KEY_SPECS[stepId];
  if (!specs) return data ? [] : ["<all>"];
  if (!data || typeof data !== "object") return specs.map((s) => s.key);
  const empties: string[] = [];
  for (const spec of specs) {
    if (isEmptyValue(spec, data[spec.key])) empties.push(spec.key);
  }
  return empties;
}

/**
 * 判断整步数据是否为空（任一关键字段为空即视为不完整）。
 */
export function isStepDataIncomplete(stepId: number, data: any): boolean {
  if (data === null || data === undefined) return true;
  return detectEmptyStepKeys(stepId, data).length > 0;
}
