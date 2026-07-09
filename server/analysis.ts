import { invokeLLM } from "./_core/llm";
import type { InvokeResult } from "./_core/llm";
import { getDb } from "./db";
import { reports } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  robustParseJson,
  normalizeStepAliases,
  detectEmptyStepKeys,
  isStepDataIncomplete,
  type ParseOutcome,
} from "./jsonRepair";
import { recordParseLog } from "./_core/llmLogger";
import {
  TOOL_CATALOG,
  getFilteredToolsForJob,
  generateProhibitionRules,
  formatFilteredTools,
  isToolInCatalog,
  isToolApplicableToJob,
  getCanonicalToolName,
  inferJobFamilies,
  type JobFamily,
  type ToolPair,
} from "./toolCatalog";

/**
 * 9-Step Prompt Chain for AI Job Transformation Analysis
 * Tool recommendations powered by structured catalog with job-family filtering.
 * See toolCatalog.ts for the tool directory.
 */

const SYSTEM_PROMPT = `你是一位资深的岗位AI转型专家，拥有20年企业管理咨询经验和深厚的AI技术背景。
你的分析风格：数据驱动、逻辑严密、洞察深刻、建议可落地。
你必须严格按照指定的JSON Schema格式输出结构化数据。

【核心约束 - AI工具推荐规则】当前时间是2026年。推荐AI工具时你必须严格遵守以下规则：

规则1：绝对禁止在工具名称中出现任何版本号、型号后缀。
  - 禁止示例：GPT-5.5 Pro、Claude 4 Opus、Gemini 2.5、DeepSeek-R2、Midjourney V7、Suno V4、Llama 4 Maverick
  - 正确示例：ChatGPT、Claude、Gemini、DeepSeek、Midjourney、Suno、Llama

规则2：你只能从每个Step中提供的【可选工具列表】中选择工具，绝对禁止自行创造或编造任何工具名称。

规则3：每个工具推荐必须同时提供「国际版」和「中国国产替代」两个版本。

规则4：推荐的工具必须与该岗位的实际工作内容直接相关，禁止推荐与岗位无关的专业工具。`;

interface AnalysisInput {
  jobTitle: string;
  company?: string;
  industry?: string;
  responsibilities?: string;
  inputText: string;
  fileContents?: string[];
  // 新增结构化事实字段（均为可选，不影响已有接口）
  teamSize?: string;
  currentTools?: string;
  painPoints?: string;
  budget?: string;
  salaryRange?: string;
}

interface StepResult {
  step: number;
  title: string;
  data: any;
}

type ProgressCallback = (step: number, title: string, status: "active" | "completed" | "error") => void;

export const STEP_DEFINITIONS = [
  {
    id: 1,
    title: "信息解析与事实确认",
    prompt: (input: AnalysisInput) => `请分析以下岗位信息，提取核心字段。

【重要规则】
1. 以下字段属于“硬事实”，必须从用户输入中直接提取，绝对禁止自行编造或假设：
   - teamSize（团队规模）
   - currentTools（当前使用的工具/系统）
   - salaryRange（薪资范围）
   - budget（AI转型预算）
   如果用户未提供这些信息，对应字段必须输出“未提供”，不得填写任何假设值。

2. 以下字段允许基于行业常识推断，但必须在 assumptions 中标注：
   - level（岗位层级）
   - industry（所属行业）
   - coreResponsibilities（可基于岗位名称推断常见职责）

3. assumptions 数组中必须明确列出每一个推断项，格式为：“[字段名] 推断为 xxx，依据是 xxx”

输入信息：
${input.inputText}
${input.fileContents?.length ? `\n附件内容：\n${input.fileContents.join("\n---\n")}` : ""}
${input.teamSize ? `\n用户确认的团队规模：${input.teamSize}` : ""}
${input.currentTools ? `\n用户确认的当前工具/系统：${input.currentTools}` : ""}
${input.painPoints ? `\n用户确认的工作痛点：${input.painPoints}` : ""}
${input.salaryRange ? `\n用户确认的薪资范围：${input.salaryRange}` : ""}
${input.budget ? `\n用户确认的AI转型预算：${input.budget}` : ""}

请输出JSON格式，包含以下字段：
- jobTitle: 岗位名称
- company: 公司名称（如未提供则填“未提供”）
- industry: 所属行业（可推断）
- level: 岗位层级（初级/中级/高级/总监，可推断）
- teamSize: 团队规模（仅从用户输入提取，未提供则填“未提供”）
- currentTools: 当前使用的工具/系统（仅从用户输入提取，未提供则填“未提供”）
- salaryRange: 薪资范围（仅从用户输入提取，未提供则填“未提供”）
- budget: AI转型预算（仅从用户输入提取，未提供则填“未提供”）
- painPoints: 当前工作痛点（仅从用户输入提取，未提供则填“未提供”）
- coreResponsibilities: 核心职责列表（数组，至少5项，优先从输入提取，不足时可基于岗位名称补充）
- assumptions: 推断项列表（数组，格式：“[字段名] 推断为 xxx，依据是 xxx”）`,
    schema: {
      name: "step1_info_parsing",
      strict: true,
      schema: {
        type: "object",
        properties: {
          jobTitle: { type: "string" },
          company: { type: "string" },
          industry: { type: "string" },
          level: { type: "string" },
          teamSize: { type: "string" },
          currentTools: { type: "string" },
          salaryRange: { type: "string" },
          budget: { type: "string" },
          painPoints: { type: "string" },
          coreResponsibilities: { type: "array", items: { type: "string" } },
          assumptions: { type: "array", items: { type: "string" } },
        },
        required: ["jobTitle", "company", "industry", "level", "teamSize", "currentTools", "salaryRange", "budget", "painPoints", "coreResponsibilities", "assumptions"],
        additionalProperties: false,
      },
    },
  },
  {
    id: 2,
    title: "第一性思维拆解",
    prompt: (input: AnalysisInput, prevResults: StepResult[]) => `基于以下岗位信息，进行第一性思维四维度深度分析。每个维度分析不少于200字，并给出一句话本质总结。

岗位信息：${JSON.stringify(prevResults[0]?.data)}

四个维度：
1. 价值创造本质：这个岗位的根本价值是什么？它为组织创造了什么不可替代的价值？
2. 信息处理模式：这个岗位日常处理什么类型的信息？信息流转路径是怎样的？
3. 决策复杂度：这个岗位需要做出什么级别的决策？决策的不确定性有多高？
4. 人际交互密度：这个岗位需要与多少人协作？协作的深度和频率如何？

每个维度的aiImpactScore为0-100的整数，表示该维度被AI影响/替代的程度（越高表示越容易被AI替代）。

最后请给出overallAiReadiness（0-100整数），表示该岗位整体的AI可替代率/AI就绪度。这个值应该综合考虑四个维度的aiImpactScore，但不是简单平均，而是加权考虑各维度的重要性。

请输出JSON格式。`,
    schema: {
      name: "step2_first_principles",
      strict: true,
      schema: {
        type: "object",
        properties: {
          dimensions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                analysis: { type: "string" },
                essence: { type: "string" },
                aiImpactScore: { type: "number" },
              },
              required: ["name", "analysis", "essence", "aiImpactScore"],
              additionalProperties: false,
            },
          },
          overallConclusion: { type: "string" },
          overallAiReadiness: { type: "number" },
        },
        required: ["dimensions", "overallConclusion", "overallAiReadiness"],
        additionalProperties: false,
      },
    },
  },
  {
    id: 3,
    title: "当前工作流拆解",
    prompt: (_input: AnalysisInput, prevResults: StepResult[]) => `基于岗位信息和第一性思维分析，拆解当前工作流为8-12个核心任务节点。

岗位信息：${JSON.stringify(prevResults[0]?.data)}
第一性分析：${JSON.stringify(prevResults[1]?.data)}

对每个任务节点，请分析：
- 任务名称
- 任务描述
- 时间占比（百分比）
- 技能要求
- 重复性程度（高/中/低）
- AI可替代程度（高/中/低）

【数值估算约束】
1. timePercent（时间占比）：所有任务节点的 timePercent 之和必须等于100。
2. 时间占比应基于该岗位的行业通用工作分配规律进行合理估算，避免平均分配（如10个节点各10%）。
3. 高重复性、高频次的任务通常时间占比更高；低频的管理/规划类任务时间占比较低。
4. 如果岗位信息中用户明确描述了某项工作"占大部分时间"或"每天花X小时"，必须据此调整对应节点的 timePercent。

请输出JSON格式。`,
    schema: {
      name: "step3_workflow",
      strict: true,
      schema: {
        type: "object",
        properties: {
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                description: { type: "string" },
                timePercent: { type: "number" },
                skills: { type: "array", items: { type: "string" } },
                repetitiveness: { type: "string" },
                aiReplaceability: { type: "string" },
              },
              required: ["id", "name", "description", "timePercent", "skills", "repetitiveness", "aiReplaceability"],
              additionalProperties: false,
            },
          },
          totalNodes: { type: "number" },
        },
        required: ["tasks", "totalNodes"],
        additionalProperties: false,
      },
    },
  },
  {
    id: 4,
    title: "AI工具匹配与优化方案",
    prompt: (_input: AnalysisInput, prevResults: StepResult[]) => {
      // Dynamic tool filtering based on job info from Step 1
      const step1Data = prevResults[0]?.data;
      const jobTitle = step1Data?.jobTitle || _input.jobTitle || '';
      const coreResponsibilities = Array.isArray(step1Data?.coreResponsibilities) ? step1Data.coreResponsibilities : [];
      const { filteredTools, jobFamilies } = getFilteredToolsForJob(jobTitle, step1Data?.industry, coreResponsibilities);
      const toolListText = formatFilteredTools(filteredTools);
      const prohibitionText = generateProhibitionRules(jobFamilies);

      return `基于工作流拆解结果，为每个任务节点推荐具体的AI工具和优化方案。

工作流节点：${JSON.stringify(prevResults[2]?.data)}
岗位信息：${JSON.stringify(prevResults[0]?.data)}

【工具推荐规则】
1. 你只能从下方【可选工具列表】中选择工具，绝对禁止自行创造或编造任何工具名称。
2. 工具名称禁止包含任何版本号（如 GPT-4.1、Claude 4、V7 等）。
3. 每个工具推荐必须同时提供「国际版」和「国内替代」两个版本（已在列表中配对好）。
4. 推荐的工具必须与当前任务节点的具体工作内容直接相关。
5. 如果某个任务节点没有合适的AI工具，aiTools 数组留空即可。
6. 每个任务节点最多推荐2对工具（1对首选 + 1对备选）。
7. matchReason 必须说明：该工具在这个具体任务中怎么用、解决什么问题。
8. 必须参考岗位信息中的 currentTools（当前使用的工具/系统），推荐的工具必须能与用户现有工作环境配合使用。如果 currentTools 为"未提供"，则按行业通用场景推荐。
9. 【工具功能描述准确性】描述工具能力时，只能基于该工具的真实已知功能，严禁编造工具不具备的能力。以下是常见错误示例：
   - 错误："Perplexity可作为企业内部知识搜索的AI入口，基于私有知识库给出准确答案" → Perplexity是公开互联网AI搜索引擎，不支持企业私有知识库部署
   - 错误："Midjourney可以生成视频" → Midjourney只能生成静态图片
   - 错误："ChatExcel可以做PPT" → ChatExcel只支持Excel表格操作
   - 错误："飞书妙记可以实时翻译" → 飞书妙记是会议录音转文字工具
   如果你不确定某工具是否具备某功能，请只描述其核心已知功能（参考可选工具列表中的「核心优势」字段）。

【岗位禁区 - 以下推荐将被系统自动拦截并删除】
${prohibitionText}

【可选工具列表 - 只能从中选择】
${toolListText}

对每个节点，请推荐1-2个工具对（每对含国际版+国产替代），并说明：
- 协作模式（AI协作/Agent自动/Human主导）
- 优化方案描述
- 预期效率提升百分比
- 实施难度（简单/中等/困难）
- matchReason：为每个推荐工具对生成100-200字的场景化应用说明，内容包括：1)该工具在当前岗位的具体使用场景（举例说明）2)预期效果（量化描述，如“可将XX工作从3小时缩短到30分钟”）3)上手建议（第一步做什么）

【效率提升数值约束】
1. efficiencyGain 必须是合理的百分比整数（10-80之间），不得超过80%。
2. 不同协作模式的合理范围：
   - Human主导：10-30%（AI仅辅助，人类仍主导决策）
   - AI协作：20-50%（人机协同，各发挥优势）
   - Agent自动：40-80%（AI自主执行，人类监督）
3. 高重复性任务的效率提升通常高于低重复性任务。
4. 禁止所有节点给出相同的 efficiencyGain 值，必须体现差异化。

请输出JSON格式。`;
    },
    schema: {
      name: "step4_ai_tools",
      strict: true,
      schema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                taskId: { type: "number" },
                taskName: { type: "string" },
                aiTools: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      internationalTool: { type: "string", description: "国际版工具名称，不带版本号，必须来自白名单" },
                      domesticAlternative: { type: "string", description: "中国国产替代工具名称，必须来自白名单" },
                    },
                    required: ["internationalTool", "domesticAlternative"],
                    additionalProperties: false,
                  },
                },
                collaborationMode: { type: "string" },
                optimizationPlan: { type: "string" },
                efficiencyGain: { type: "number" },
                difficulty: { type: "string" },
                matchReason: { type: "string", description: "100-200字场景化应用说明，包含使用场景、预期效果、上手建议" },
              },
              required: ["taskId", "taskName", "aiTools", "collaborationMode", "optimizationPlan", "efficiencyGain", "difficulty", "matchReason"],
              additionalProperties: false,
            },
          },
        },
        required: ["recommendations"],
        additionalProperties: false,
      },
    },
  },
  {
    id: 5,
    title: "新工作流设计",
    prompt: (_input: AnalysisInput, prevResults: StepResult[]) => `基于AI优化方案，设计转型后的新工作流。明确人机分工与协作模式。

原工作流：${JSON.stringify(prevResults[2]?.data)}
AI优化方案：${JSON.stringify(prevResults[3]?.data)}

请设计新工作流，包含：
- 新任务节点列表（合并/拆分/新增）
- 每个节点的人机分工比例：humanRatio和aiRatio必须是0-100的整数百分比，且两者之和必须等于100。例如humanRatio:60表示人工60%，aiRatio:40表示AI占40%。绝对禁止输出小数如0.6、0.4等。
- 协作模式说明
- 新增能力要求

请输出JSON格式。`,
    schema: {
      name: "step5_new_workflow",
      strict: true,
      schema: {
        type: "object",
        properties: {
          newTasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                name: { type: "string" },
                description: { type: "string" },
                humanRatio: { type: "number" },
                aiRatio: { type: "number" },
                collaborationMode: { type: "string" },
                newSkillsRequired: { type: "array", items: { type: "string" } },
              },
              required: ["id", "name", "description", "humanRatio", "aiRatio", "collaborationMode", "newSkillsRequired"],
              additionalProperties: false,
            },
          },
          summary: { type: "string" },
        },
        required: ["newTasks", "summary"],
        additionalProperties: false,
      },
    },
  },
  {
    id: 6,
    title: "转型对比与ROI评估",
    prompt: (_input: AnalysisInput, prevResults: StepResult[]) => `进行转型前后的九维度对比分析和ROI评估。

原工作流：${JSON.stringify(prevResults[2]?.data)}
新工作流：${JSON.stringify(prevResults[4]?.data)}
AI工具方案：${JSON.stringify(prevResults[3]?.data)}
岗位信息：${JSON.stringify(prevResults[0]?.data)}

九维度对比：效率、质量、成本、创新力、响应速度、可扩展性、员工满意度、客户满意度、风险水平

ROI评估需包含三档方案（保守/标准/激进）的成本和收益预估。

【ROI数值约束】
1. 如果岗位信息中提供了 salaryRange（薪资范围）和 teamSize（团队规模），必须基于这些实际数据计算人力成本节约。
2. 如果提供了 budget（AI转型预算），investmentRange 必须在用户预算范围内。
3. 如果以上信息为"未提供"，则基于行业平均水平进行估算，并在 assumptions 中说明估算依据。
4. roiPercent 合理范围：保守方案 50-150%，标准方案 100-250%，激进方案 150-400%。禁止超过500%。
5. paybackPeriod 合理范围：3-24个月。
6. 三档方案的 investmentRange 必须体现明显梯度差异，不得雷同。

assumptions：请列出本次ROI计算的关键假设前提（如2-4条），例如"假设平均月薪1.5万元"、"假设工具订阅费用按年付"等。

【一致性约束】
- 团队规模必须引用岗位信息中的数据：${prevResults[0]?.data?.teamSize || "未提供"}。如果涉及人力成本计算，必须基于上述团队规模，不得自行假设不同的人数。
- 效率提升数值必须与AI工具方案中的 efficiencyGain 范围一致，不得出现巨大偏差。

请输出JSON格式。`,
    schema: {
      name: "step6_roi",
      strict: true,
      schema: {
        type: "object",
        properties: {
          dimensions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                before: { type: "number" },
                after: { type: "number" },
                improvement: { type: "string" },
              },
              required: ["name", "before", "after", "improvement"],
              additionalProperties: false,
            },
          },
          roiPlans: {
            type: "array",
            items: {
              type: "object",
              properties: {
                planName: { type: "string" },
                investmentRange: { type: "string" },
                annualSaving: { type: "string" },
                paybackPeriod: { type: "string" },
                roiPercent: { type: "number" },
              },
              required: ["planName", "investmentRange", "annualSaving", "paybackPeriod", "roiPercent"],
              additionalProperties: false,
            },
          },
          overallROI: { type: "string" },
          assumptions: { type: "array", items: { type: "string" }, description: "ROI计算的关键假设前提，如2-4条" },
        },
        required: ["dimensions", "roiPlans", "overallROI", "assumptions"],
        additionalProperties: false,
      },
    },
  },
  {
    id: 7,
    title: "岗位重组与实施路线图",
    prompt: (_input: AnalysisInput, prevResults: StepResult[]) => {
      // Dynamic tool filtering based on job info from Step 1
      const step1Data = prevResults[0]?.data;
      const jobTitle = step1Data?.jobTitle || _input.jobTitle || '';
      const coreResponsibilities = Array.isArray(step1Data?.coreResponsibilities) ? step1Data.coreResponsibilities : [];
      const { filteredTools, jobFamilies } = getFilteredToolsForJob(jobTitle, step1Data?.industry, coreResponsibilities);
      const toolListText = formatFilteredTools(filteredTools);
      const prohibitionText = generateProhibitionRules(jobFamilies);

      return `设计岗位重组方案和四阶段实施路线图。

岗位信息：${JSON.stringify(prevResults[0]?.data)}
新工作流：${JSON.stringify(prevResults[4]?.data)}

请包含：
1. 任务重新分类（三类）：
   - aiReplace（应被AI替代的任务）：可以完全交给AI自动完成的任务，包括原来可被淘汰的低价值重复任务
   - aiEnhance（应被AI增强的任务）：人做但AI辅助提效的任务
   - humanRetain（应保留给人类的任务）：必须由人类独立完成、需要判断力/创造力/情感的任务
   【分类要求】每类任务不少于6个，任务名称简短（4-8个字），具体明确
2. 未来岗位名称建议（futureJobTitles）：基于AI转型后的岗位定位，给出2-3个未来岗位名称建议
3. 新能力模型（需要培养的新技能）
4. 新增角色（newRoles）：AI转型后该岗位需要新设或衍生的新角色/子岗位，每个包含title、responsibilities、skills、staffingSource（"新设"/"现有XX岗位转型"/"现有人员兼任"）
   【规模约束】当前团队规模为：${prevResults[0]?.data?.teamSize || "未知"}
   - 如果团队≤10人：最多建议1-2个新角色，且优先由现有人员兼任或转型
   - 如果团队11-30人：建议2-3个新角色，分两阶段引入（第一阶段1-2个核心角色）
   - 如果团队>30人：可建议3-4个新角色
   - 如果团队规模为"未提供"或"未知"，默认按中小团队（10-20人）处理，建议2-3个角色
   - 所有新角色必须在 staffingSource 中说明是"新设"还是"由现有XX岗位转型/兼任"
5. 四阶段实施路线图（每阶段含时间、目标、关键动作）
6. 推荐工具清单（每个工具类别必须包含matchReason字段，100-200字场景化应用说明，包含具体使用场景、预期效果、上手建议）

【工具推荐规则】
1. 你只能从下方【可选工具列表】中选择工具，绝对禁止自行创造或编造任何工具名称。
2. 工具名称禁止包含任何版本号（如 GPT-4.1、Claude 4、V7 等）。
3. 每个工具推荐必须同时提供「国际版」和「国内替代」两个版本。
4. 推荐的工具必须与岗位实际工作内容直接相关。
5. 【工具功能描述准确性】描述工具能力时，只能基于该工具的真实已知功能，严禁编造工具不具备的能力。常见错误示例：
   - Perplexity是公开互联网AI搜索引擎，不支持企业私有知识库部署
   - Midjourney只能生成静态图片，不能生成视频
   - ChatExcel只支持Excel表格操作，不能做PPT/Word
   - 飞书妙记是会议录音转文字工具，不是实时翻译工具
   如果不确定某工具是否具备某功能，请只描述其核心已知功能（参考工具列表中的「核心优势」字段）。

【岗位禁区 - 以下推荐将被系统自动拦截并删除】
${prohibitionText}

【可选工具列表 - 只能从中选择】
${toolListText}

请输出JSON格式。`;
    },
    schema: {
      name: "step7_restructuring",
      strict: true,
      schema: {
        type: "object",
        properties: {
          taskClassification: {
            type: "object",
            properties: {
              aiReplace: { type: "array", items: { type: "string" }, description: "应被AI替代的任务，不少于6个" },
              aiEnhance: { type: "array", items: { type: "string" }, description: "应被AI增强的任务，不少于6个" },
              humanRetain: { type: "array", items: { type: "string" }, description: "应保留给人类的任务，不少于6个" },
            },
            required: ["aiReplace", "aiEnhance", "humanRetain"],
            additionalProperties: false,
          },
          futureJobTitles: { type: "array", items: { type: "string" }, description: "未来岗位名称建议，2-3个" },
          newCapabilityModel: { type: "array", items: { type: "string" } },
          newRoles: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "新增角色/岗位名称" },
                responsibilities: { type: "string", description: "职责描述" },
                skills: { type: "array", items: { type: "string" }, description: "所需技能" },
                staffingSource: { type: "string", description: "人员来源：新设/现有XX岗位转型/现有人员兼任" },
              },
              required: ["title", "responsibilities", "skills", "staffingSource"],
              additionalProperties: false,
            },
            description: "AI转型后需要新设或转型的角色/岗位",
          },
          roadmap: {
            type: "array",
            items: {
              type: "object",
              properties: {
                phase: { type: "number" },
                name: { type: "string" },
                duration: { type: "string" },
                goals: { type: "array", items: { type: "string" } },
                actions: { type: "array", items: { type: "string" } },
              },
              required: ["phase", "name", "duration", "goals", "actions"],
              additionalProperties: false,
            },
          },
          toolRecommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                tools: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      internationalTool: { type: "string", description: "国际版工具名称，不带版本号，必须来自白名单" },
                      domesticAlternative: { type: "string", description: "中国国产替代工具名称，必须来自白名单" },
                    },
                    required: ["internationalTool", "domesticAlternative"],
                    additionalProperties: false,
                  },
                },
              purpose: { type: "string" },
              matchReason: { type: "string", description: "100-200字场景化应用说明" },
            },
            required: ["category", "tools", "purpose", "matchReason"],
            additionalProperties: false,
            },
          },
        },
        required: ["taskClassification", "futureJobTitles", "newCapabilityModel", "newRoles", "roadmap", "toolRecommendations"],
        additionalProperties: false,
      },
    },
  },
  {
    id: 8,
    title: "风险控制与KPI",
    prompt: (_input: AnalysisInput, prevResults: StepResult[]) => `设计风险控制方案和KPI体系。

岗位信息：${JSON.stringify(prevResults[0]?.data)}
实施路线图：${JSON.stringify(prevResults[6]?.data)}

请包含：
1. 七类风险（技术风险、人员风险、流程风险、数据风险、合规风险、成本风险、变革管理风险）
2. 六维度KPI体系（每个KPI的dimension名称必须与metric描述语义一致，例如metric说"参与度"则dimension应为"员工参与度"而非"员工敬业度"；确保baseline和target值简洁明确，避免过长文字）
3. 最终结论与建议

【KPI约束】
- dimension：2-4个字的简短名称（如"效率提升"、"品牌影响力"）
- metric：一句话说明具体衡量指标（如"内容生产周期"）
- baseline和target：必须是具体的数值+单位（如"5天/篇"、"2天/篇"、"15%"、"20%"、"3.5分"），严禁使用X、Y、Z、N、M、P、Q等变量占位符，严禁写成"X天"、"Y%"、"N分"等模板格式，必须给出合理的估计数值

【一致性约束】
- 结论中引用的风险数量必须与本步骤 risks 数组的实际长度一致，禁止写"共X项风险"而实际数量不符。
- 结论中引用的效率提升数值必须与实施路线图中的数据一致。
- 团队规模引用必须与岗位信息一致：${prevResults[0]?.data?.teamSize || "未提供"}。

请输出JSON格式。`,
    schema: {
      name: "step8_risks_kpi",
      strict: true,
      schema: {
        type: "object",
        properties: {
          risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                description: { type: "string" },
                probability: { type: "string" },
                impact: { type: "string" },
                mitigation: { type: "string" },
              },
              required: ["category", "description", "probability", "impact", "mitigation"],
              additionalProperties: false,
            },
          },
          kpis: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dimension: { type: "string" },
                metric: { type: "string" },
                baseline: { type: "string" },
                target: { type: "string" },
                measureMethod: { type: "string" },
              },
              required: ["dimension", "metric", "baseline", "target", "measureMethod"],
              additionalProperties: false,
            },
          },
          conclusion: { type: "string" },
          keyRecommendations: { type: "array", items: { type: "string" } },
        },
        required: ["risks", "kpis", "conclusion", "keyRecommendations"],
        additionalProperties: false,
      },
    },
  },
  {
    id: 9,
    title: "转型能力培训评估",
    prompt: (_input: AnalysisInput, prevResults: StepResult[]) => `基于前8步的完整分析结果，为该岗位生成个性化的转型能力培训评估方案。

岗位信息：${JSON.stringify(prevResults[0]?.data)}
第一性分析：${JSON.stringify(prevResults[1]?.data)}
当前工作流：${JSON.stringify(prevResults[2]?.data)}
AI工具推荐：${JSON.stringify(prevResults[3]?.data)}
新工作流：${JSON.stringify(prevResults[4]?.data)}
岗位重组：${JSON.stringify(prevResults[6]?.data)}

你需要分析该岗位在AI转型前后，对以下四个维度、共15个能力项的需求程度变化（1-5分整数），并给出培训建议。

注意：这不是对某个人的能力测评，而是分析"该岗位在转型前后对这些能力的需求度有多高"。

【四维度15项能力清单】

维度一：思维/心智训练（6项）
1. 第一性思维：回归事物最基本的真理和假设，从零开始推理
2. 批判思维：对信息、论证和结论进行系统性的分析、评估和质疑
3. 系统思维：将事物视为相互关联的系统而非孤立的部分
4. 抽象思维：从具体事物中提取共性模式、规律和原则
5. 开放思维与成长心智：对新观点保持接纳，相信能力可通过学习提升
6. 设计思维：以人为中心的创新方法论（共情→定义→构思→原型→测试）

维度二：技能训练（4项）
1. 人机沟通（提示词工程）：通过精确的自然语言指令引导AI产生高质量输出
2. 智能体：设计、配置和管理AI智能体（Agent）的能力
3. 工作流：将重复性业务流程通过AI+自动化工具实现端到端自动执行
4. 氛围编程：通过自然语言描述需求，借助AI编程助手生成代码

维度三：知识学习（3项）
1. 人工智能简史：了解AI发展历程、关键里程碑和技术演进脉络
2. AI核心技术与关键理论：理解机器学习、深度学习、大语言模型等核心技术原理
3. AI商业应用与战略转型：了解AI在各行业的商业应用模式和企业AI战略转型路径

维度四：价值观与伦理训练（2项）
1. 人工智能伦理：AI系统的公平性、透明性、可解释性和问责制
2. AI安全、隐私与合规意识：AI系统的技术安全性、数据隐私保护和法规合规

【分析规则】
- 转型前需求度（preTransformDemand）：该岗位在AI转型之前，日常工作对此能力的需求程度。1=几乎不需要，2=偶尔需要，3=经常需要，4=高度依赖，5=核心必备
- 转型后需求度（postTransformDemand）：该岗位完成AI转型后，新工作模式对此能力的需求程度。必须>=转型前需求度
- 需求增长（demandGrowth）= 转型后需求度 - 转型前需求度
- 优先级（priority）：综合需求增长幅度、对转型成功的影响度、前置依赖关系确定，分为"立即开始"、"第一季度"、"第二季度"、"第三季度+"
- 培训建议（trainingAdvice）：针对该岗位的具体培训建议，100-200字，必须结合岗位实际场景，说明为什么转型后对此能力需求增加
- 推荐资源（resources）：推荐2-3个具体的学习资源（中文优先、免费优先），包含名称和平台

【重要约束】
- 不同岗位的分析结果必须有明显差异，体现岗位特性
- 技术类岗位在技能维度的转型后需求度通常较高
- 管理类岗位在思维维度的转型后需求度通常较高
- 所有岗位在伦理维度都应有基本要求（转型后需求度>=3）
- dimensionSummary中每个维度的avgPreTransform和avgPostTransform是该维度下所有能力项的平均分
- overallReadiness是15项能力转型前需求度的加权平均/5*100的百分比，反映岗位当前的AI就绪基础

请输出JSON格式。`,
    schema: {
      name: "step9_training_competency",
      strict: true,
      schema: {
        type: "object",
        properties: {
          dimensionSummary: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dimension: { type: "string" },
                avgPreTransform: { type: "number" },
                avgPostTransform: { type: "number" },
                avgDemandGrowth: { type: "number" },
              },
              required: ["dimension", "avgPreTransform", "avgPostTransform", "avgDemandGrowth"],
              additionalProperties: false,
            },
          },
          competencies: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dimension: { type: "string" },
                name: { type: "string" },
                preTransformDemand: { type: "number" },
                postTransformDemand: { type: "number" },
                demandGrowth: { type: "number" },
                priority: { type: "string" },
                trainingAdvice: { type: "string" },
                resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      platform: { type: "string" },
                      isFree: { type: "boolean" },
                    },
                    required: ["name", "platform", "isFree"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["dimension", "name", "preTransformDemand", "postTransformDemand", "demandGrowth", "priority", "trainingAdvice", "resources"],
              additionalProperties: false,
            },
          },
          priorityRanking: {
            type: "array",
            items: {
              type: "object",
              properties: {
                rank: { type: "number" },
                name: { type: "string" },
                priority: { type: "string" },
                reason: { type: "string" },
              },
              required: ["rank", "name", "priority", "reason"],
              additionalProperties: false,
            },
          },
          quarterlyPlan: {
            type: "array",
            items: {
              type: "object",
              properties: {
                quarter: { type: "string" },
                focus: { type: "string" },
                items: { type: "array", items: { type: "string" } },
              },
              required: ["quarter", "focus", "items"],
              additionalProperties: false,
            },
          },
          overallReadiness: { type: "number" },
          overallSummary: { type: "string" },
        },
        required: ["dimensionSummary", "competencies", "priorityRanking", "quarterlyPlan", "overallReadiness", "overallSummary"],
        additionalProperties: false,
      },
    },
  },
];

/**
 * Enhanced tool name cleaning - strips ALL version numbers aggressively
 */
function cleanToolName(name: string): string {
  if (!name) return '';
  let cleaned = name
    // GPT variants → ChatGPT
    .replace(/GPT-?\d+(\.\d+)?\s*(Pro|Ultra|Opus|Turbo|Plus)?/gi, 'ChatGPT')
    // Claude variants
    .replace(/Claude\s*\d+(\.\d+)?\s*(Opus|Sonnet|Haiku)?/gi, 'Claude')
    // Gemini variants
    .replace(/Gemini\s*\d+(\.\d+)?\s*(Pro|Ultra|Flash|Nano|Advanced)?/gi, 'Gemini')
    // DeepSeek variants (R1, R2, V2, V3 etc)
    .replace(/DeepSeek[-\s]*[A-Z]?\d+(\.\d+)?/gi, 'DeepSeek')
    // Llama variants
    .replace(/Llama\s*\d+(\.\d+)?\s*(Maverick|Scout)?/gi, 'Llama')
    // Midjourney V*
    .replace(/Midjourney\s*V\d+/gi, 'Midjourney')
    // Suno V*
    .replace(/Suno\s*V\d+/gi, 'Suno')
    // Runway Gen-*
    .replace(/Runway\s*Gen-?\d+/gi, 'Runway')
    // DALL-E *
    .replace(/DALL-?E\s*\d+/gi, 'DALL-E')
    // Stable Diffusion *
    .replace(/Stable\s*Diffusion\s*\d+(\.\d+)?/gi, 'Stable Diffusion')
    // ElevenLabs V*
    .replace(/ElevenLabs\s*V\d+/gi, 'ElevenLabs')
    // Copilot variants
    .replace(/GitHub\s*Copilot\s*(X|Pro|Plus|Enterprise)?\s*\d*/gi, 'GitHub Copilot')
    .replace(/Microsoft\s*Copilot\s*(Pro|Plus|365)?\s*\d*/gi, 'Microsoft Copilot')
    // Sora variants
    .replace(/Sora\s*\d+(\.\d+)?/gi, 'Sora')
    // Generic version suffix cleanup
    .replace(/\s+V\d+(\.\d+)?/gi, '')
    .replace(/\s+\d+\.\d+(\.\d+)?/g, '')
    .replace(/\s+(Pro|Plus|Ultra|Enterprise|Advanced)\s*$/gi, '')
    .trim();
  return cleaned;
}

/**
 * Validate tool name against the structured catalog.
 * If not found, try to find the closest canonical match.
 */
function validateToolName(name: string): string {
  if (!name) return '';
  const cleaned = cleanToolName(name);
  
  // Try canonical match (handles typo corrections + partial matches)
  const canonical = getCanonicalToolName(cleaned);
  
  // If canonical found something different and it's in catalog, use it
  if (canonical && canonical !== cleaned && isToolInCatalog(canonical)) return canonical;
  
  // Direct match in catalog
  if (isToolInCatalog(cleaned)) return cleaned;
  
  // Return canonical correction even if not in catalog (typo fix)
  // e.g. "BetterUsername AI" → "BetterYeah AI"
  if (canonical && canonical !== cleaned) return canonical;
  
  // Fallback: return cleaned name, isOutdatedOrHallucinated will filter bad ones
  return cleaned;
}

// Blacklist of outdated/hallucinated tools
const OUTDATED_TOOLS = [
  'gpt-3', 'gpt-3.5', 'gpt-4', 'gpt4', 'gpt-5', 'gpt5', 'dall-e 2', 'dall-e2',
  'midjourney v5', 'midjourney v4', 'stable diffusion 1',
  'copilot x', 'bard', 'bing chat', 'bing ai',
  'deepseek-r1', 'deepseek-r2', 'deepseek-v2', 'deepseek-v3',
  'claude 4', 'claude 3', 'claude 5', 'gpt-5.5',
  'llama 4', 'llama 3', 'gemini 2', 'gemini 3',
];

function isOutdatedOrHallucinated(name: string): boolean {
  if (!name) return true;
  const lower = name.toLowerCase().trim();
  if (lower.length === 0) return true;
  // Check against outdated list
  if (OUTDATED_TOOLS.some(t => lower.includes(t))) return true;
  // Check for version number patterns that shouldn't exist
  if (/\d+\.\d+/.test(lower)) return true;
  if (/\s+v\d/i.test(lower)) return true;
  if (/[-\s]r\d/i.test(lower)) return true;
  return false;
}

export function sanitizeStepData(stepId: number, data: any): any {
  if (!data) return data;
  try {
    // Step 4: AI tool recommendations - validate + filter by catalog
    if (stepId === 4 && data.recommendations) {
      data.recommendations = data.recommendations.map((rec: any) => {
        let aiTools = Array.isArray(rec.aiTools)
          ? rec.aiTools
              .map((tool: any) => {
                if (typeof tool === 'string') {
                  const cleaned = validateToolName(tool);
                  return { internationalTool: cleaned, domesticAlternative: '' };
                }
                return {
                  ...tool,
                  internationalTool: validateToolName(tool.internationalTool || ''),
                  domesticAlternative: validateToolName(tool.domesticAlternative || ''),
                };
              })
              .filter((tool: any) =>
                !isOutdatedOrHallucinated(tool.internationalTool) &&
                tool.internationalTool.length > 0
              )
          : rec.aiTools;
        // Fallback: only inject generic tools if the entire array is empty
        if (!aiTools || aiTools.length === 0) {
          aiTools = [{ internationalTool: 'ChatGPT', domesticAlternative: 'DeepSeek' }];
        }
        return { ...rec, aiTools };
      });
    }
    // Step 5: Fix humanRatio/aiRatio if LLM outputs decimals (0.6) instead of percentages (60)
    if (stepId === 5 && data.newTasks) {
      data.newTasks = data.newTasks.map((task: any) => {
        let h = Number(task.humanRatio) || 0;
        let a = Number(task.aiRatio) || 0;
        // If both are <= 1, LLM output decimals like 0.6/0.4 instead of 60/40
        if (h <= 1 && a <= 1 && (h > 0 || a > 0)) {
          h = Math.round(h * 100);
          a = Math.round(a * 100);
        }
        // If sum is not 100, normalize
        const sum = h + a;
        if (sum > 0 && sum !== 100) {
          h = Math.round((h / sum) * 100);
          a = 100 - h;
        }
        // Ensure they are integers
        return { ...task, humanRatio: h, aiRatio: a };
      });
    }
    // Step 7: taskClassification - convert old 4-category format to new 3-category format
    if (stepId === 7 && data.taskClassification) {
      const tc = data.taskClassification;
      // If old format (has retain/enhance/automate/eliminate), convert to new format
      if (tc.retain || tc.automate || tc.eliminate) {
        data.taskClassification = {
          aiReplace: [...(tc.automate || []), ...(tc.eliminate || [])],
          aiEnhance: tc.enhance || [],
          humanRetain: tc.retain || [],
        };
      }
      // Ensure each category has at least an empty array
      if (!data.taskClassification.aiReplace) data.taskClassification.aiReplace = [];
      if (!data.taskClassification.aiEnhance) data.taskClassification.aiEnhance = [];
      if (!data.taskClassification.humanRetain) data.taskClassification.humanRetain = [];
    }
    // Step 7: Ensure futureJobTitles exists
    if (stepId === 7 && !data.futureJobTitles) {
      data.futureJobTitles = [];
    }
    // Step 7: Tool recommendations in restructuring - validate + filter by catalog
    if (stepId === 7 && data.toolRecommendations) {
      data.toolRecommendations = data.toolRecommendations.map((cat: any) => {
        let tools = Array.isArray(cat.tools)
          ? cat.tools
              .map((tool: any) => {
                if (typeof tool === 'string') {
                  const cleaned = validateToolName(tool);
                  return { internationalTool: cleaned, domesticAlternative: '' };
                }
                return {
                  ...tool,
                  internationalTool: validateToolName(tool.internationalTool || ''),
                  domesticAlternative: validateToolName(tool.domesticAlternative || ''),
                };
              })
              .filter((tool: any) =>
                !isOutdatedOrHallucinated(tool.internationalTool) &&
                tool.internationalTool.length > 0
              )
          : cat.tools;
        // Fallback: only inject generic tools if the entire array is empty
        if (!tools || tools.length === 0) {
          tools = [{ internationalTool: 'ChatGPT', domesticAlternative: 'DeepSeek' }];
        }
        return { ...cat, tools };
      });
    }
  } catch (e) {
    console.warn('sanitizeStepData error:', e);
  }
  return data;
}

type LlmCtx = { companyId?: string; userId?: number; phone?: string; feature: string; source?: string };

/**
 * 调用单个步骤的 LLM 并健壮解析。
 * - 使用 robustParseJson（提取 + 修复）避免被截断/混入说明文字导致的解析失败
 * - 使用 normalizeStepAliases 容错字段别名（如 taskList → tasks）
 * - 通过 recordParseLog 把解析结果（repaired/failed/empty）补记到调用日志
 * 解析失败返回 null。
 */
async function invokeAndParseStep(
  step: typeof STEP_DEFINITIONS[number],
  input: AnalysisInput,
  results: StepResult[],
  ctx: LlmCtx,
  reportId: string
): Promise<any> {
  const userPrompt = step.prompt(input, results);
  const schemaInstruction = `\n\n【输出格式要求】请严格按照以下JSON结构输出，不要输出任何其他内容（不要加说明、不要用markdown代码块）：\n${JSON.stringify(step.schema.schema, null, 2)}`;
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt + schemaInstruction },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: step.schema.name,
          schema: step.schema.schema,
          strict: true,
        },
      },
    }, ctx);

    const content = response.choices[0]?.message?.content;
    let parsed: any;
    let outcome: ParseOutcome = "direct";

    if (typeof content === "string") {
      const pr = robustParseJson(content);
      parsed = pr.data;
      outcome = pr.outcome;
      if (outcome === "failed") {
        console.error(`[Report ${reportId}] Step ${step.id} JSON解析失败:`, pr.error);
        recordParseLog({ context: ctx, stepId: step.id, stepTitle: step.title, outcome: "failed", detail: pr.error });
        return null;
      }
      if (outcome === "repaired") {
        recordParseLog({ context: ctx, stepId: step.id, stepTitle: step.title, outcome: "repaired" });
      }
    } else {
      parsed = content;
    }

    // 字段别名归一化 + 业务清洗
    parsed = normalizeStepAliases(step.id, parsed);
    parsed = sanitizeStepData(step.id, parsed);

    // 解析成功但关键字段仍为空，补记日志
    const emptyKeys = detectEmptyStepKeys(step.id, parsed);
    if (emptyKeys.length > 0) {
      recordParseLog({ context: ctx, stepId: step.id, stepTitle: step.title, outcome: "empty", emptyKeys });
    }
    return parsed;
  } catch (error: any) {
    console.error(`[Report ${reportId}] Step ${step.id} 调用失败:`, error?.message || error);
    recordParseLog({ context: ctx, stepId: step.id, stepTitle: step.title, outcome: "failed", detail: error?.message || String(error) });
    return null;
  }
}

/**
 * 生成后空内容检测与定向补全。
 * 针对仍为 null 或关键字段缺失的步骤，再独立调一次模型补充（最多一轮）。
 */
async function refillEmptySteps(
  input: AnalysisInput,
  results: StepResult[],
  ctx: LlmCtx,
  reportId: string,
  onProgress: ProgressCallback
): Promise<void> {
  for (const step of STEP_DEFINITIONS) {
    const idx = results.findIndex(r => r.step === step.id);
    if (idx === -1) continue;
    const current = results[idx].data;
    if (current !== null && !isStepDataIncomplete(step.id, current)) continue;

    const emptyKeys = detectEmptyStepKeys(step.id, current);
    console.warn(`[Report ${reportId}] Step ${step.id} 生成后仍为空(${emptyKeys.join(",") || "null"})，发起定向补全`);
    onProgress(step.id, step.title, "active");

    const refilled = await invokeAndParseStep(step, input, results, ctx, reportId);
    if (refilled !== null && !isStepDataIncomplete(step.id, refilled)) {
      results[idx].data = refilled;
      onProgress(step.id, step.title, "completed");
      console.warn(`[Report ${reportId}] Step ${step.id} 定向补全成功`);
    } else {
      // 补全仍失败：保留原值（可能为部分内容或 null）
      if (refilled !== null && (current === null || isStepDataIncomplete(step.id, current))) {
        results[idx].data = refilled; // 至少比 null 好
      }
      onProgress(step.id, step.title, results[idx].data === null ? "error" : "completed");
      console.warn(`[Report ${reportId}] Step ${step.id} 定向补全仍不完整`);
    }
  }
}

export async function runAnalysisChain(
  input: AnalysisInput,
  reportId: string,
  onProgress: ProgressCallback,
  llmContext?: { companyId?: string; userId?: number; phone?: string; feature?: string; source?: string }
): Promise<StepResult[]> {
  const results: StepResult[] = [];
  const db = await getDb();
  const ctx = { ...llmContext, feature: llmContext?.feature || "job_analysis" };

  for (const step of STEP_DEFINITIONS) {
    onProgress(step.id, step.title, "active");

    // Update DB status
    if (db) {
      await db.update(reports)
        .set({ currentStep: step.id, status: "analyzing" })
        .where(eq(reports.reportId, reportId));
    }

    // 首次尝试
    let parsed = await invokeAndParseStep(step, input, results, ctx, reportId);
    // 解析失败或内容为空时，重试一次
    if (parsed === null || isStepDataIncomplete(step.id, parsed)) {
      console.warn(`[Report ${reportId}] Step ${step.id} 首次结果不完整，重试一次`);
      const retryParsed = await invokeAndParseStep(step, input, results, ctx, reportId);
      // 重试结果更完整则采用重试结果
      if (retryParsed !== null && !isStepDataIncomplete(step.id, retryParsed)) {
        parsed = retryParsed;
      } else if (parsed === null && retryParsed !== null) {
        parsed = retryParsed;
      }
    }

    results.push({ step: step.id, title: step.title, data: parsed });
    onProgress(step.id, step.title, parsed === null ? "error" : "completed");
  }

  // [修复3] 生成后空内容检测与定向补全：对仍为空的关键步骤专门再调一次模型补充
  await refillEmptySteps(input, results, ctx, reportId, onProgress);

  // Cross-step consistency validation (log warnings only, do not block)
  const consistencyWarnings = validateCrossStepConsistency(results);
  if (consistencyWarnings.length > 0) {
    console.warn(`[Report ${reportId}] Cross-step consistency warnings:`, consistencyWarnings);
  }

  // Save final report data
  // Step 9 (training) failure should not prevent report from being marked completed
  const hasStep9Failed = results.find(r => r.step === 9)?.data === null;
  if (db) {
    await db.update(reports)
      .set({
        status: "completed",
        currentStep: hasStep9Failed ? 8 : 9,
        reportData: results,
        completedAt: new Date(),
      })
      .where(eq(reports.reportId, reportId));
  }

  return results;
}

/**
 * Lightweight cross-step consistency validation.
 * Only logs warnings, does not block report generation.
 */
function validateCrossStepConsistency(results: StepResult[]): string[] {
  const warnings: string[] = [];
  const step1 = results.find(r => r.step === 1)?.data;
  const step4 = results.find(r => r.step === 4)?.data;
  const step6 = results.find(r => r.step === 6)?.data;
  const step8 = results.find(r => r.step === 8)?.data;

  // Check: conclusion risk count matches actual risks array length
  if (step8?.risks && step8?.conclusion) {
    const actualRiskCount = Array.isArray(step8.risks) ? step8.risks.length : 0;
    const mentionedMatch = step8.conclusion.match(/(\d+)\s*(?:项|个|类).*风险/);
    if (mentionedMatch) {
      const mentionedCount = parseInt(mentionedMatch[1]);
      if (mentionedCount !== actualRiskCount) {
        warnings.push(`结论中提到${mentionedCount}项风险，实际risks数组为${actualRiskCount}项`);
      }
    }
  }

  // Check: ROI teamSize reference consistency
  if (step1?.teamSize && step6?.assumptions) {
    const teamSize = step1.teamSize;
    if (teamSize !== "未提供" && Array.isArray(step6.assumptions)) {
      const hasTeamRef = step6.assumptions.some((a: string) => 
        a.includes(teamSize) || a.includes("人") || a.includes("团队")
      );
      if (!hasTeamRef) {
        warnings.push(`Step 1 teamSize="${teamSize}"，但ROI assumptions未引用团队规模`);
      }
    }
  }

  // Check: Step 4 efficiencyGain values are within bounds
  if (step4?.recommendations && Array.isArray(step4.recommendations)) {
    for (const rec of step4.recommendations) {
      if (rec.efficiencyGain !== undefined) {
        const gain = typeof rec.efficiencyGain === 'number' ? rec.efficiencyGain : parseInt(rec.efficiencyGain);
        if (gain > 80) {
          warnings.push(`Step 4 节点"${rec.taskName || 'unknown'}" efficiencyGain=${gain}% 超过80%上限`);
        }
      }
    }
  }

  // Check: ROI roiPercent within bounds
  if (step6?.roiPlans && Array.isArray(step6.roiPlans)) {
    for (const plan of step6.roiPlans) {
      if (plan.roiPercent > 500) {
        warnings.push(`ROI方案"${plan.planName}" roiPercent=${plan.roiPercent}% 超过500%上限`);
      }
    }
  }

  return warnings;
}

/**
 * Parse assumptions from input text to check if confirmation is needed
 */
export function checkNeedsConfirmation(input: AnalysisInput): { needsConfirmation: boolean; assumptions: any[] } {
  const assumptions: any[] = [];

  if (!input.company) {
    assumptions.push({ field: "company", label: "公司名称", value: "未指定（将基于行业推断）", editable: true });
  }
  if (!input.industry) {
    assumptions.push({ field: "industry", label: "所属行业", value: "未指定（将基于岗位推断）", editable: true });
  }
  if (!input.jobTitle) {
    assumptions.push({ field: "jobTitle", label: "岗位名称", value: "", editable: true });
  }

  return {
    needsConfirmation: assumptions.length > 0 && !input.jobTitle,
    assumptions,
  };
}
