/**
 * AI Tool Catalog - Structured tool directory with job-family applicability tags.
 * Used by analysis.ts Step 4 & Step 7 for dynamic tool filtering.
 *
 * Maintenance: Update TOOL_CATALOG array to add/remove/modify tool pairs.
 * No database migration needed — just edit, build, and deploy.
 *
 * Last synced with: 3.AI工具基础清单(1).md — 2026-05-21
 */

// ============================================================
// Types
// ============================================================

export interface ToolPair {
  international: string;       // International tool name (NO version numbers)
  domestic: string;            // Domestic (China) alternative name (NO version numbers)
  category: string;            // Tool category key
  applicableTo: JobFamily[];   // Which job families this tool is relevant to
  applicableTasks: string[];   // Applicable task descriptions
  coreAdvantage: string;       // Core advantage (brief, injected into prompt)
}

export type JobFamily =
  | "通用办公"
  | "软件研发"
  | "产品经理"
  | "设计创意"
  | "市场营销"
  | "销售"
  | "客服"
  | "人力资源"
  | "财务"
  | "法务合规"
  | "数据分析"
  | "管理决策"
  | "供应链/运营"
  | "视频/内容创作"
  | "会议协作"
  | "知识库/智能体";

// ============================================================
// Category Labels (for display in prompts)
// ============================================================

const CATEGORY_LABELS: Record<string, string> = {
  llm: "通用大模型",
  office: "办公协作",
  coding: "编程开发",
  image: "图像生成",
  video: "视频生成",
  audio: "音频语音",
  design: "设计工具",
  marketing: "营销推广",
  sales: "销售CRM",
  service: "客户服务",
  hr: "人力资源",
  data: "数据分析",
  legal: "法务合规",
  finance: "财务管理",
  supply_chain: "供应链",
  pm: "产品/项目管理",
  meeting: "会议纪要",
  agent: "智能体/工作流",
  knowledge: "知识库/RAG",
  writing: "写作辅助",
  research: "学术研究",
};

// ============================================================
// Tool Catalog Data (~90+ pairs)
// ============================================================

export const TOOL_CATALOG: ToolPair[] = [
  // ─── 通用大模型 (llm) ───
  {
    international: "ChatGPT",
    domestic: "DeepSeek",
    category: "llm",
    applicableTo: ["通用办公", "软件研发", "数据分析", "管理决策", "市场营销", "产品经理", "设计创意", "销售", "客服", "人力资源", "财务", "法务合规", "供应链/运营", "视频/内容创作", "会议协作", "知识库/智能体"],
    applicableTasks: ["日常写作", "逻辑推理", "复杂数据分析", "代码辅助"],
    coreAdvantage: "全球最强通用大模型，多模态能力顶尖；DeepSeek推理能力极强，性价比极高",
  },
  {
    international: "Claude",
    domestic: "Kimi",
    category: "llm",
    applicableTo: ["通用办公", "软件研发", "产品经理", "数据分析", "管理决策", "市场营销", "法务合规"],
    applicableTasks: ["长文档阅读", "代码分析", "需求拆解", "深度推理"],
    coreAdvantage: "超长上下文处理能力全球第一，代码和逻辑能力极强；Kimi国内超长上下文优秀，联网搜索强",
  },
  {
    international: "Gemini",
    domestic: "豆包",
    category: "llm",
    applicableTo: ["通用办公", "市场营销", "数据分析", "管理决策"],
    applicableTasks: ["资料整理", "营销文案", "谷歌生态协同", "多模态分析"],
    coreAdvantage: "与Google Workspace深度集成，多模态原生，推理能力极强；豆包免费好用，多模态能力强",
  },
  {
    international: "Grok",
    domestic: "文心一言",
    category: "llm",
    applicableTo: ["通用办公", "市场营销", "数据分析"],
    applicableTasks: ["实时信息检索", "写作", "数据分析", "搜索"],
    coreAdvantage: "实时联网能力强，推理能力突出；文心一言百度生态融合，中文理解好",
  },
  {
    international: "Perplexity",
    domestic: "腾讯元宝",
    category: "llm",
    applicableTo: ["通用办公", "管理决策", "市场营销", "数据分析"],
    applicableTasks: ["AI搜索", "行业研究", "事实核查", "微信生态资料整理"],
    coreAdvantage: "AI搜索引擎标杆，实时联网+引用源；腾讯元宝微信公众号内容检索独家优势",
  },

  // ─── 办公协作 (office) ───
  {
    international: "Microsoft Copilot",
    domestic: "WPS AI",
    category: "office",
    applicableTo: ["通用办公", "财务", "数据分析", "管理决策", "人力资源", "市场营销", "销售"],
    applicableTasks: ["Office全家桶协同", "PPT生成", "Excel分析", "文档写作"],
    coreAdvantage: "与Word/Excel/PPT深度集成，企业级安全合规",
  },
  {
    international: "Notion AI",
    domestic: "语雀AI",
    category: "office",
    applicableTo: ["通用办公", "产品经理", "知识库/智能体", "管理决策"],
    applicableTasks: ["文档协作", "知识管理", "写作辅助", "Agentic工作空间"],
    coreAdvantage: "升级为Agentic工作空间，知识库与AI无缝结合，团队协作体验极佳",
  },
  {
    international: "ChatExcel",
    domestic: "ChatExcel",
    category: "office",
    applicableTo: ["通用办公", "财务", "数据分析"],
    applicableTasks: ["自然语言处理Excel", "表格分析"],
    coreAdvantage: "聊天即可处理复杂表格，门槛极低",
  },

  // ─── 编程开发 (coding) ───
  {
    international: "OpenAI Codex",
    domestic: "Trae",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["复杂项目开发", "终端代理", "自动化编程"],
    coreAdvantage: "专为软件工程打造的AI智能体，支持1000+连续工具调用；Trae国内首款AI原生IDE，免费",
  },
  {
    international: "Claude Code",
    domestic: "通义灵码",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["代码分析", "终端代理", "架构设计", "大型重构", "Code Review"],
    coreAdvantage: "终端原生AI编码助手，大型代码库理解力顶尖；通义灵码升级至Lingma IDE，新增Code Review智能体",
  },
  {
    international: "Cursor",
    domestic: "Trae",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["代码补全", "复杂项目开发", "多文件编辑"],
    coreAdvantage: "AI原生IDE，开发效率极高，多文件上下文理解强",
  },
  {
    international: "GitHub Copilot",
    domestic: "通义灵码",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["代码补全", "单元测试", "代码审查"],
    coreAdvantage: "全球使用最广泛，与VS Code/JetBrains深度集成",
  },
  {
    international: "Windsurf",
    domestic: "Trae",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["代码补全", "项目开发"],
    coreAdvantage: "接近Cursor体验，价格更便宜",
  },
  {
    international: "Gemini Code Assist",
    domestic: "通义灵码",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["代码补全", "代码解释", "测试生成"],
    coreAdvantage: "与Google Cloud深度集成，超长上下文理解",
  },
  {
    international: "Tabnine",
    domestic: "通义灵码",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["企业级代码补全", "私有化部署"],
    coreAdvantage: "支持私有化部署，保障代码安全，合规性强",
  },

  // ─── 图像生成 (image) ───
  {
    international: "Midjourney",
    domestic: "即梦AI",
    category: "image",
    applicableTo: ["设计创意", "市场营销", "视频/内容创作"],
    applicableTasks: ["商业插画", "概念设计", "创意素材"],
    coreAdvantage: "V7版本画质显著提升，美术感最强，风格控制精准",
  },
  {
    international: "DALL-E",
    domestic: "通义万相",
    category: "image",
    applicableTo: ["设计创意", "市场营销", "视频/内容创作"],
    applicableTasks: ["商业插画", "素材生成", "文字渲染"],
    coreAdvantage: "与ChatGPT集成，理解力极强，文字渲染能力好",
  },
  {
    international: "Stable Diffusion",
    domestic: "即梦AI",
    category: "image",
    applicableTo: ["设计创意", "软件研发"],
    applicableTasks: ["本地部署图片生成", "定制化训练"],
    coreAdvantage: "开源可本地部署，生态极丰富，可定制训练",
  },
  {
    international: "Adobe Firefly",
    domestic: "稿定AI",
    category: "image",
    applicableTo: ["设计创意", "市场营销"],
    applicableTasks: ["商业插画", "图像编辑", "创意素材"],
    coreAdvantage: "与PS/AI/Premiere深度集成，商用版权绝对安全",
  },

  // ─── 视频生成 (video) ───
  {
    international: "Runway",
    domestic: "可灵AI",
    category: "video",
    applicableTo: ["视频/内容创作", "设计创意", "市场营销"],
    applicableTasks: ["影视级视频生成", "视频编辑", "特效", "商业广告"],
    coreAdvantage: "Gen-4.5电影级画质，专业控制能力强；可灵AI 3.0国产之光，最长3分钟30fps",
  },
  {
    international: "Pika",
    domestic: "即梦AI视频",
    category: "video",
    applicableTo: ["视频/内容创作", "市场营销"],
    applicableTasks: ["快速出片", "动画特效", "知识科普", "短视频制作"],
    coreAdvantage: "易用性之王，速度最快；即梦AI视频中文理解强，口型匹配优秀",
  },
  {
    international: "Pika",
    domestic: "海螺AI",
    category: "video",
    applicableTo: ["视频/内容创作", "市场营销"],
    applicableTasks: ["创意动画", "短视频"],
    coreAdvantage: "预设模板丰富；海螺AI动画风格出色，创意元素丰富",
  },
  {
    international: "HeyGen",
    domestic: "硅基流动",
    category: "video",
    applicableTo: ["视频/内容创作", "市场营销", "人力资源"],
    applicableTasks: ["数字人视频", "多语种配音", "培训视频"],
    coreAdvantage: "数字人克隆技术领先，多语种口型匹配",
  },
  {
    international: "Synthesia",
    domestic: "万兴播爆",
    category: "video",
    applicableTo: ["视频/内容创作", "市场营销", "人力资源"],
    applicableTasks: ["培训视频", "营销视频", "数字人"],
    coreAdvantage: "企业级数字人视频平台，多语种支持",
  },

  // ─── 音频语音 (audio) ───
  {
    international: "ElevenLabs",
    domestic: "火山引擎语音",
    category: "audio",
    applicableTo: ["视频/内容创作", "市场营销", "客服"],
    applicableTasks: ["AI语音合成", "多语种配音", "语音克隆"],
    coreAdvantage: "全球最强AI语音合成，多语种自然度极高",
  },
  {
    international: "Suno",
    domestic: "天工音乐",
    category: "audio",
    applicableTo: ["视频/内容创作", "市场营销"],
    applicableTasks: ["AI音乐创作", "背景音乐生成"],
    coreAdvantage: "文本生成完整歌曲，创作门槛极低",
  },
  {
    international: "Murf AI",
    domestic: "讯飞智作",
    category: "audio",
    applicableTo: ["视频/内容创作", "市场营销", "客服"],
    applicableTasks: ["语音合成", "配音", "有声内容"],
    coreAdvantage: "企业级语音合成，支持多种语言和风格",
  },

  // ─── 设计工具 (design) ───
  {
    international: "Canva",
    domestic: "稿定AI",
    category: "design",
    applicableTo: ["设计创意", "市场营销", "通用办公"],
    applicableTasks: ["海报设计", "营销物料", "社交媒体素材"],
    coreAdvantage: "模板极度丰富，AI Magic Studio强大，全球用户量最大",
  },
  {
    international: "Adobe Firefly",
    domestic: "美图设计室",
    category: "design",
    applicableTo: ["设计创意", "市场营销"],
    applicableTasks: ["商业插画", "图像编辑", "AI商品图", "营销物料"],
    coreAdvantage: "与PS/AI/Premiere深度集成，商用版权安全；美图无设计基础也可快速出图",
  },
  {
    international: "Figma AI",
    domestic: "即时设计AI",
    category: "design",
    applicableTo: ["设计创意", "产品经理"],
    applicableTasks: ["UI设计", "协作设计", "设计系统", "原型设计", "交互设计"],
    coreAdvantage: "全球UI设计协作标杆，AI辅助设计能力强，产品经理可直接画原型图；即时设计国产Figma替代品",
  },

  // ─── 营销推广 (marketing) ───
  {
    international: "Jasper AI",
    domestic: "巨量引擎",
    category: "marketing",
    applicableTo: ["市场营销"],
    applicableTasks: ["营销文案", "社交媒体运营", "SEO优化", "短视频广告投放", "AI创意生成"],
    coreAdvantage: "全球最成熟的AI营销文案工具，支持品牌语调定制；巨量引擎抖音生态内最强AI投放",
  },
  {
    international: "HubSpot AI",
    domestic: "领帆SCRM",
    category: "marketing",
    applicableTo: ["市场营销", "销售"],
    applicableTasks: ["营销自动化", "客户旅程管理", "邮件营销", "跨境多语种文案"],
    coreAdvantage: "全球领先的营销自动化平台，AI内嵌全流程；领帆多语种营销效率提升10倍",
  },

  // ─── 销售CRM (sales) ───
  {
    international: "Salesforce Agentforce",
    domestic: "纷享销客",
    category: "sales",
    applicableTo: ["销售", "管理决策"],
    applicableTasks: ["客户管理", "商机洞察", "销售预测"],
    coreAdvantage: "全球第一CRM的AI底座Agentforce，深度业务融合；纷享销客AI+CRM国内大中型企业首选",
  },
  {
    international: "Zoho CRM",
    domestic: "探迹",
    category: "sales",
    applicableTo: ["销售"],
    applicableTasks: ["客户管理", "智能获客", "销售预测", "企业图谱"],
    coreAdvantage: "性价比极高，AI助手Zia能力强；探迹AI智能获客和企业图谱数据积累深厚",
  },

  // ─── 客户服务 (service) ───
  {
    international: "Zendesk AI",
    domestic: "智齿科技",
    category: "service",
    applicableTo: ["客服"],
    applicableTasks: ["智能问答", "工单处理", "多语言客服", "人机协作"],
    coreAdvantage: "全球领先的客服系统AI化；智齿科技参与AI国家标准制定，人机协作体验优秀",
  },
  {
    international: "Intercom Fin",
    domestic: "网易七鱼",
    category: "service",
    applicableTo: ["客服"],
    applicableTasks: ["智能问答", "客户服务自动化", "全渠道接待"],
    coreAdvantage: "AI客服标杆产品，解决率极高；网易七鱼国内主流智能客服",
  },

  // ─── 人力资源 (hr) ───
  {
    international: "Workday AI",
    domestic: "北森",
    category: "hr",
    applicableTo: ["人力资源"],
    applicableTasks: ["人才管理", "招聘分析", "绩效管理", "组织发展"],
    coreAdvantage: "全球领先的HR云平台，AI嵌入全流程；北森国内最大HR SaaS平台",
  },
  {
    international: "Workday AI",
    domestic: "Moka",
    category: "hr",
    applicableTo: ["人力资源"],
    applicableTasks: ["简历筛选", "人岗匹配", "招聘流程管理"],
    coreAdvantage: "AI原生架构，流程嵌入度最高，国内招聘SaaS标杆",
  },

  // ─── 数据分析 (data) ───
  {
    international: "Power BI Copilot",
    domestic: "帆软FineBI",
    category: "data",
    applicableTo: ["数据分析", "管理决策", "财务"],
    applicableTasks: ["数据可视化", "自然语言问数", "智能报表"],
    coreAdvantage: "微软生态深度集成，Copilot驱动智能分析；帆软国内BI市场占有率第一",
  },
  {
    international: "Tableau AI",
    domestic: "阿里云Quick BI",
    category: "data",
    applicableTo: ["数据分析", "管理决策", "财务"],
    applicableTasks: ["数据可视化", "智能洞察", "自然语言分析"],
    coreAdvantage: "全球顶尖BI工具，Einstein驱动，可视化能力极强；Quick BI大模型驱动",
  },

  // ─── 法务合规 (legal) ───
  {
    international: "Harvey AI",
    domestic: "法大大iTerms",
    category: "legal",
    applicableTo: ["法务合规"],
    applicableTasks: ["法律研究", "合同分析", "文书起草"],
    coreAdvantage: "全球最强法律AI，获大量顶级律所采用；法大大一站式法律AI工作台",
  },
  {
    international: "Harvey AI",
    domestic: "幂律智能",
    category: "legal",
    applicableTo: ["法务合规"],
    applicableTasks: ["合同审查", "法律风控"],
    coreAdvantage: "合同审查极度专业，法律行业认可度高",
  },

  // ─── 财务管理 (finance) ───
  {
    international: "SAP AI",
    domestic: "金蝶AI",
    category: "finance",
    applicableTo: ["财务", "供应链/运营", "管理决策"],
    applicableTasks: ["财务分析", "智能审单", "供应链协同", "财报分析"],
    coreAdvantage: "传统ERP大厂AI转型，多款AI原生智能体，财报分析能力突出",
  },
  {
    international: "SAP AI",
    domestic: "用友网络",
    category: "finance",
    applicableTo: ["财务", "供应链/运营"],
    applicableTasks: ["ERP智能化", "财务共享", "供应链协同"],
    coreAdvantage: "国内ERP巨头，AI深度融入财务/供应链流程",
  },
  {
    international: "合合信息",
    domestic: "合合信息",
    category: "finance",
    applicableTo: ["财务"],
    applicableTasks: ["票据识别", "报销自动化", "OCR"],
    coreAdvantage: "OCR技术行业领先，识别准确率极高",
  },

  // ─── 供应链 (supply_chain) ───
  {
    international: "SAP AI",
    domestic: "旷视科技",
    category: "supply_chain",
    applicableTo: ["供应链/运营"],
    applicableTasks: ["需求预测", "库存优化", "智能物流", "仓储机器人"],
    coreAdvantage: "全球领先的供应链AI；旷视智能物流机器人和仓储自动化软硬件结合",
  },

  // ─── 产品/项目管理 (pm) ───
  {
    international: "Linear AI",
    domestic: "飞书项目AI",
    category: "pm",
    applicableTo: ["产品经理", "软件研发", "管理决策"],
    applicableTasks: ["项目管理", "任务跟踪", "需求管理"],
    coreAdvantage: "AI驱动项目管理，自动化工作流",
  },
  {
    international: "小摹AI",
    domestic: "小摹AI",
    category: "pm",
    applicableTo: ["产品经理"],
    applicableTasks: ["原型设计", "线框图生成"],
    coreAdvantage: "自然语言快速生成可编辑原型，大幅简化流程",
  },
  {
    international: "墨刀AI",
    domestic: "墨刀AI",
    category: "pm",
    applicableTo: ["产品经理"],
    applicableTasks: ["原型设计", "交互设计"],
    coreAdvantage: "AI生成组件，国内主流原型工具",
  },
  {
    international: "Google Stitch",
    domestic: "Google Stitch",
    category: "pm",
    applicableTo: ["产品经理", "设计创意"],
    applicableTasks: ["原型设计", "UI设计", "设计稿生成", "交互设计"],
    coreAdvantage: "Google新推AI设计工具，自然语言生成高保真原型和UI设计稿，产品经理和设计师均可使用",
  },

  // ─── 会议纪要 (meeting) ───
  {
    international: "Otter.ai",
    domestic: "飞书妙记",
    category: "meeting",
    applicableTo: ["会议协作", "通用办公", "管理决策"],
    applicableTasks: ["会议转写", "实时纪要", "待办提取"],
    coreAdvantage: "英文识别率极高，跨国会议首选；飞书妙记飞书生态无缝集成",
  },
  {
    international: "Fireflies.ai",
    domestic: "讯飞听见",
    category: "meeting",
    applicableTo: ["会议协作", "通用办公"],
    applicableTasks: ["会议记录", "CRM集成", "行动项提取", "实时翻译"],
    coreAdvantage: "支持主流视频会议平台；讯飞听见语音识别准确率行业领先，星火大模型加持",
  },
  {
    international: "通义听悟",
    domestic: "通义听悟",
    category: "meeting",
    applicableTo: ["会议协作", "通用办公"],
    applicableTasks: ["音视频转录", "总结", "思维导图"],
    coreAdvantage: "功能全面，支持多平台音视频转录",
  },

  // ─── 智能体/工作流 (agent) ───
  {
    international: "Manus",
    domestic: "扣子Coze",
    category: "agent",
    applicableTo: ["通用办公", "知识库/智能体", "软件研发", "管理决策"],
    applicableTasks: ["智能体搭建", "复杂任务自动化", "多平台分发", "零代码AI应用"],
    coreAdvantage: "通用AI Agent，可自主完成复杂多步骤任务；扣子零代码搭建，接入抖音/微信极度方便",
  },
  {
    international: "Zapier",
    domestic: "集简云",
    category: "agent",
    applicableTo: ["通用办公", "市场营销", "销售", "知识库/智能体"],
    applicableTasks: ["应用连接", "自动化工作流", "数据同步"],
    coreAdvantage: "Zapier支持连接全球7000+款SaaS应用；集简云国内最大iPaaS平台，对接国内主流SaaS",
  },
  {
    international: "Make",
    domestic: "BetterYeah AI",
    category: "agent",
    applicableTo: ["通用办公", "知识库/智能体", "软件研发"],
    applicableTasks: ["可视化自动化", "复杂工作流编排", "多智能体协同"],
    coreAdvantage: "可视化工作流编排，灵活度极高；BetterYeah五层安全防护，NeuroFlow引擎强大",
  },
  {
    international: "UiPath",
    domestic: "实在智能",
    category: "agent",
    applicableTo: ["通用办公", "供应链/运营", "财务", "知识库/智能体"],
    applicableTasks: ["企业级RPA+AI自动化", "遗留系统操作", "流程自动化"],
    coreAdvantage: "全球企业级RPA市场领导者；实在智能无需API即可操作任意软件，适配遗留系统",
  },
  {
    international: "n8n",
    domestic: "Dify",
    category: "agent",
    applicableTo: ["软件研发", "知识库/智能体"],
    applicableTasks: ["工作流自动化", "自托管", "AI应用开发", "RAG知识库"],
    coreAdvantage: "开源可自托管，灵活度极高；Dify开源AI应用开发平台，支持多模型",
  },

  // ─── 知识库/RAG (knowledge) ───
  {
    international: "FastGPT",
    domestic: "FastGPT",
    category: "knowledge",
    applicableTo: ["知识库/智能体", "软件研发"],
    applicableTasks: ["企业知识库", "RAG问答"],
    coreAdvantage: "国内最成熟的开源RAG框架，深度定制能力强",
  },
  {
    international: "阿里云百炼",
    domestic: "阿里云百炼",
    category: "knowledge",
    applicableTo: ["知识库/智能体", "管理决策"],
    applicableTasks: ["企业知识管理", "智能问答", "模型服务"],
    coreAdvantage: "完整的RAG+智能问答+模型服务，企业级",
  },

  // ─── 写作辅助 (writing) ───
  {
    international: "Jasper",
    domestic: "火山写作",
    category: "writing",
    applicableTo: ["市场营销", "通用办公", "视频/内容创作"],
    applicableTasks: ["营销文案", "内容创作", "品牌写作"],
    coreAdvantage: "全球最成熟的AI写作工具，支持品牌语调定制",
  },
  {
    international: "Grammarly",
    domestic: "秘塔写作猫",
    category: "writing",
    applicableTo: ["通用办公", "市场营销"],
    applicableTasks: ["语法检查", "写作润色", "风格优化"],
    coreAdvantage: "全球最流行的写作辅助工具，语法纠错精准",
  },

  // ─── 学术研究 (research) ───
  {
    international: "Consensus",
    domestic: "学术版秘塔",
    category: "research",
    applicableTo: ["数据分析", "管理决策"],
    applicableTasks: ["学术搜索", "文献综述", "证据查找"],
    coreAdvantage: "AI学术搜索引擎，直接给出研究结论",
  },
  {
    international: "Elicit",
    domestic: "天工AI搜索",
    category: "research",
    applicableTo: ["数据分析", "管理决策"],
    applicableTasks: ["研究助手", "论文分析", "数据提取"],
    coreAdvantage: "AI研究助手，自动提取论文关键信息",
  },
];

// ============================================================
// Job Family Inference
// ============================================================

const KEYWORD_MAP: Record<string, JobFamily[]> = {
  "开发|研发|工程师|架构|测试|运维|DevOps|前端|后端|全栈|程序员|码农|SRE|DBA": ["软件研发"],
  "产品|需求|PRD|用户体验|产品经理|产品总监": ["产品经理"],
  "设计|UI|UX|视觉|美术|创意|平面|插画|动效": ["设计创意"],
  "营销|市场|品牌|推广|增长|内容运营|新媒体|SEO|SEM|投放|公关|PR|广告": ["市场营销"],
  "销售|商务|BD|客户开发|大客户|渠道|业务拓展": ["销售"],
  "客服|售后|服务|呼叫中心|在线客服|客户支持|客户成功": ["客服"],
  "HR|人力|招聘|培训|绩效|薪酬|HRBP|组织发展|人事|劳动关系": ["人力资源"],
  "财务|会计|审计|税务|出纳|成本|资金|预算": ["财务"],
  "法务|合规|法律|风控|知识产权|律师|法规": ["法务合规"],
  "数据|BI|分析师|数据科学|统计|算法|机器学习|大数据": ["数据分析"],
  "总监|VP|总经理|CEO|COO|CTO|CFO|管理|决策|战略|总裁": ["管理决策"],
  "供应链|采购|物流|仓储|生产|制造|运营|质量|品控|工厂": ["供应链/运营"],
  "视频|剪辑|自媒体|主播|内容创作|编导|摄影|短视频|直播": ["视频/内容创作"],
  "会议|行政|秘书|助理|前台": ["会议协作"],
  "知识管理|智能体|AI应用|RPA|自动化": ["知识库/智能体"],
};

/**
 * Infer job families from job title and responsibilities.
 * Always includes "通用办公" as a baseline.
 */
export function inferJobFamilies(jobTitle: string, coreResponsibilities?: string[]): JobFamily[] {
  const families = new Set<JobFamily>(["通用办公"]);

  const combinedText = [
    jobTitle,
    ...(coreResponsibilities || []),
  ].join(" ");

  for (const [pattern, fams] of Object.entries(KEYWORD_MAP)) {
    if (new RegExp(pattern, "i").test(combinedText)) {
      fams.forEach(f => families.add(f));
    }
  }

  // If management-level title detected, also add "管理决策"
  if (/主管|经理|总监|VP|负责人|主任|部长/.test(jobTitle)) {
    families.add("管理决策");
  }

  return Array.from(families);
}

// ============================================================
// Tool Filtering
// ============================================================

/**
 * Filter TOOL_CATALOG to return only tools relevant to the given job.
 * Typically returns 20-35 tool pairs.
 */
export function getFilteredToolsForJob(
  jobTitle: string,
  industry?: string,
  coreResponsibilities?: string[]
): { filteredTools: ToolPair[]; jobFamilies: JobFamily[] } {
  const jobFamilies = inferJobFamilies(jobTitle, coreResponsibilities);

  const filtered = TOOL_CATALOG.filter(pair =>
    pair.applicableTo.some(tag => jobFamilies.includes(tag))
  );

  // Deduplicate by international+domestic key
  const seen = new Set<string>();
  const deduplicated = filtered.filter(pair => {
    const key = `${pair.international}|${pair.domestic}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { filteredTools: deduplicated, jobFamilies };
}

// ============================================================
// Prompt Generation Helpers
// ============================================================

/**
 * Generate prohibition rules text based on job families.
 * Tells the LLM which tool categories are off-limits.
 */
export function generateProhibitionRules(jobFamilies: JobFamily[]): string {
  const rules: string[] = [];

  if (!jobFamilies.includes("软件研发")) {
    rules.push("- 禁止推荐编程IDE和代码工具（如 Cursor、GitHub Copilot、通义灵码、Trae等）");
  }
  if (!jobFamilies.includes("设计创意") && !jobFamilies.includes("产品经理")) {
    rules.push("- 禁止推荐专业UI设计工具（如 Figma AI、即时设计AI等），但通用设计工具（如Canva/稿定AI）允许");
  }
  if (!jobFamilies.includes("市场营销")) {
    rules.push("- 禁止推荐广告投放和营销自动化工具（如 巨量引擎、HubSpot AI等）");
  }
  if (!jobFamilies.includes("人力资源")) {
    rules.push("- 禁止推荐招聘ATS和HR管理系统（如 Moka、北森、Workday AI等）");
  }
  if (!jobFamilies.includes("法务合规")) {
    rules.push("- 禁止推荐法律专业工具（如 Harvey AI、法大大iTerms、幂律智能等）");
  }
  if (!jobFamilies.includes("财务")) {
    rules.push("- 禁止推荐财务ERP和会计工具（如 金蝶AI、用友网络、合合信息等）");
  }
  if (!jobFamilies.includes("供应链/运营")) {
    rules.push("- 禁止推荐供应链和物流工具（如 SAP AI、旷视科技等）");
  }
  if (!jobFamilies.includes("客服")) {
    rules.push("- 禁止推荐专业客服系统（如 Zendesk AI、智齿科技、网易七鱼等）");
  }
  if (!jobFamilies.includes("销售")) {
    rules.push("- 禁止推荐CRM和销售工具（如 Salesforce Agentforce、纷享销客、探迹等）");
  }

  if (rules.length === 0) {
    return "（当前岗位无特殊禁区限制）";
  }
  return rules.join("\n");
}

/**
 * Format filtered tools into a prompt-friendly text block.
 * Groups by category with core advantage and applicable tasks.
 */
export function formatFilteredTools(tools: ToolPair[]): string {
  // Group by category
  const grouped: Record<string, ToolPair[]> = {};
  for (const tool of tools) {
    if (!grouped[tool.category]) {
      grouped[tool.category] = [];
    }
    grouped[tool.category].push(tool);
  }

  let result = "";
  for (const [category, pairs] of Object.entries(grouped)) {
    const label = CATEGORY_LABELS[category] || category;
    result += `[${label}]\n`;
    for (const pair of pairs) {
      result += `- ${pair.international}/${pair.domestic}：${pair.coreAdvantage} | 适用：${pair.applicableTasks.join("、")}\n`;
    }
    result += "\n";
  }
  return result.trim();
}

// ============================================================
// Validation Helpers (used by sanitizeStepData)
// ============================================================

// Build a lookup set of all valid tool names (lowercase)
const ALL_CATALOG_TOOLS = new Set<string>();
TOOL_CATALOG.forEach(pair => {
  ALL_CATALOG_TOOLS.add(pair.international.toLowerCase());
  ALL_CATALOG_TOOLS.add(pair.domestic.toLowerCase());
});

/**
 * Check if a tool name exists in the catalog.
 */
export function isToolInCatalog(toolName: string): boolean {
  if (!toolName) return false;
  return ALL_CATALOG_TOOLS.has(toolName.toLowerCase().trim());
}

/**
 * Check if a tool is applicable to the given job families.
 * Returns true if the tool's applicableTo has any overlap with jobFamilies.
 */
export function isToolApplicableToJob(toolName: string, jobFamilies: JobFamily[]): boolean {
  if (!toolName) return false;
  const lower = toolName.toLowerCase().trim();

  const tool = TOOL_CATALOG.find(pair =>
    pair.international.toLowerCase() === lower ||
    pair.domestic.toLowerCase() === lower
  );

  if (!tool) return false;
  return tool.applicableTo.some(tag => jobFamilies.includes(tag));
}

/**
 * Get the properly cased tool name from the catalog.
 * Returns the original name if not found.
 */
// Common LLM hallucination / typo corrections
const TOOL_NAME_CORRECTIONS: Record<string, string> = {
  'betterusername ai': 'BetterYeah AI',
  'betterusername': 'BetterYeah AI',
  'betteryeahai': 'BetterYeah AI',
  'kimii': 'Kimi',
  'kimi ai': 'Kimi',
  'deepseek ai': 'DeepSeek',
  'deep seek': 'DeepSeek',
  'chatexcel': 'ChatExcel',
  'chat excel': 'ChatExcel',
  'notion ai (agentic)': 'Notion AI',
  'notionai': 'Notion AI',
  'wps ai': 'WPS AI',
  'wpsai': 'WPS AI',
  'midjourney ai': 'Midjourney',
  'stable diffusion ai': 'Stable Diffusion',
  'figma ai': 'Figma AI',
  'figmaai': 'Figma AI',
  '即时设计ai': '即时设计AI',
  '墨刀ai': '墨刀AI',
  '通义灵码': 'Lingma IDE',
  'lingma': 'Lingma IDE',
  '文心一言4': '文心一言',
  '文心一言4.0': '文心一言',
  'perplexity ai': 'Perplexity',
  '秘塔ai搜索': '秘塔AI搜索',
  '秘塔ai': '秘塔AI搜索',
  '网易七鱼': '网易七鱼',
  '智齿科技': '智齿科技',
  'google stich': 'Google Stitch',
  'google stitch ai': 'Google Stitch',
};

export function getCanonicalToolName(toolName: string): string {
  if (!toolName) return '';
  const lower = toolName.toLowerCase().trim();

  // Check typo corrections first
  if (TOOL_NAME_CORRECTIONS[lower]) return TOOL_NAME_CORRECTIONS[lower];

  for (const pair of TOOL_CATALOG) {
    if (pair.international.toLowerCase() === lower) return pair.international;
    if (pair.domestic.toLowerCase() === lower) return pair.domestic;
  }

  // Try partial match
  for (const pair of TOOL_CATALOG) {
    if (lower.includes(pair.international.toLowerCase()) || pair.international.toLowerCase().includes(lower)) {
      return pair.international;
    }
    if (lower.includes(pair.domestic.toLowerCase()) || pair.domestic.toLowerCase().includes(lower)) {
      return pair.domestic;
    }
  }

  return toolName;
}
