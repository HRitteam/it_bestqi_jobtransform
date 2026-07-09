/**
 * AI Tool Catalog - Structured tool directory with job-family applicability tags.
 * Used by analysis.ts Step 4 & Step 7 for dynamic tool filtering.
 *
 * Maintenance: Update TOOL_CATALOG array to add/remove/modify tool pairs.
 * No database migration needed — just edit, build, and deploy.
 *
 * Last reviewed & web-verified: 2026-07-09
 * 本次更新要点：
 *  - 删除/替换已停用或更名的工具：DALL-E→GPT Image、火山写作→豆包、Windsurf→Google Antigravity/Devin、
 *    个人版 Gemini Code Assist→Google Antigravity、天工AI搜索→天工超级智能体。
 *  - 更名：通义灵码→Qoder CN、HubSpot AI→HubSpot Breeze、Intercom Fin→Fin、Moka→Moka AI、WPS AI→WPS灵犀。
 *  - 修正错误/自我配对：HeyGen 的国内替代由“硅基流动”(模型API平台) 改为“硅基智能”(数字人)；
 *    Harvey 重复项之一改为 Spellbook/幂律智能；合合信息自我配对补国际对标 ABBYY。
 *  - 大幅补充销售、市场、客服、法务、财务、HR、供应链、编程、创意及智能体类新工具。
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
// Tool Catalog Data (~100+ pairs)
// ============================================================

export const TOOL_CATALOG: ToolPair[] = [
  // ─── 通用大模型 (llm) ───
  {
    international: "ChatGPT",
    domestic: "DeepSeek",
    category: "llm",
    applicableTo: ["通用办公", "软件研发", "数据分析", "管理决策", "市场营销", "产品经理", "设计创意", "销售", "客服", "人力资源", "财务", "法务合规", "供应链/运营", "视频/内容创作", "会议协作", "知识库/智能体"],
    applicableTasks: ["日常写作", "逻辑推理", "复杂数据分析", "代码辅助", "Agent任务"],
    coreAdvantage: "全球顶级通用大模型，多模态与Agent能力领先；DeepSeek开源、超长上下文、推理与中文能力强，性价比极高且可私有化",
  },
  {
    international: "Claude",
    domestic: "Kimi",
    category: "llm",
    applicableTo: ["通用办公", "软件研发", "产品经理", "数据分析", "管理决策", "市场营销", "法务合规"],
    applicableTasks: ["长文档阅读", "代码分析", "需求拆解", "深度推理", "长任务可靠执行"],
    coreAdvantage: "编码与长任务可靠性顶尖，Artifacts/Projects/MCP生态完善；Kimi开源万亿MoE Agent模型，超长上下文、Agentic编码强",
  },
  {
    international: "Gemini",
    domestic: "豆包",
    category: "llm",
    applicableTo: ["通用办公", "市场营销", "数据分析", "管理决策", "视频/内容创作"],
    applicableTasks: ["资料整理", "营销文案", "谷歌生态协同", "多模态分析"],
    coreAdvantage: "推理与多模态标杆，深度嵌入Google Workspace；豆包字节旗舰多模态模型，Agent/编码强、价格低、生态广(飞书/抖音)",
  },
  {
    international: "Grok",
    domestic: "文心一言",
    category: "llm",
    applicableTo: ["通用办公", "市场营销", "数据分析"],
    applicableTasks: ["实时信息检索", "写作", "数据分析", "搜索"],
    coreAdvantage: "实时X数据接入，推理与编码能力强；文心一言国产全模态一体化，中文创作与Agent成熟",
  },
  {
    international: "Perplexity",
    domestic: "腾讯元宝",
    category: "llm",
    applicableTo: ["通用办公", "管理决策", "市场营销", "数据分析"],
    applicableTasks: ["AI搜索", "行业研究", "事实核查", "自主浏览操作"],
    coreAdvantage: "AI原生搜索+Comet智能浏览器可自主多步操作，答案带溯源；腾讯元宝混元+DeepSeek双引擎，深度绑定微信生态",
  },
  {
    international: "Meta Llama",
    domestic: "通义千问",
    category: "llm",
    applicableTo: ["通用办公", "软件研发", "数据分析", "知识库/智能体"],
    applicableTasks: ["开源模型私有化部署", "定制微调", "本地推理"],
    coreAdvantage: "全球开源模型标杆，可自由微调与私有化；通义千问阿里开源旗舰，中文与Agent能力强、生态完整",
  },
  {
    international: "Mistral",
    domestic: "智谱GLM",
    category: "llm",
    applicableTo: ["通用办公", "软件研发", "知识库/智能体"],
    applicableTasks: ["开源高效推理", "私有化部署", "Agentic编码"],
    coreAdvantage: "欧洲开源高效模型，合规友好；智谱GLM为MIT开源、百万上下文，长程Agentic Coding强，适合私有化部署",
  },

  // ─── 办公协作 (office) ───
  {
    international: "Microsoft 365 Copilot",
    domestic: "WPS灵犀",
    category: "office",
    applicableTo: ["通用办公", "财务", "数据分析", "管理决策", "人力资源", "市场营销", "销售"],
    applicableTasks: ["Office全家桶协同", "PPT生成", "Excel分析", "端到端自主交付"],
    coreAdvantage: "深度嵌入Word/Excel/PPT/Teams，Cowork可端到端自主完成任务并交付成品；WPS灵犀原生中文Office智能体，自然语言完成文档/PPT/表格",
  },
  {
    international: "Notion AI",
    domestic: "语雀AI",
    category: "office",
    applicableTo: ["通用办公", "产品经理", "知识库/智能体", "管理决策"],
    applicableTasks: ["文档协作", "知识管理", "多智能体协作", "多步任务自主执行"],
    coreAdvantage: "升级为可自主执行多步任务的Agent，支持多智能体协作与外部智能体(Claude/Cursor)接入；语雀基于知识库AI问答与多文档推理",
  },
  {
    international: "ChatExcel",
    domestic: "ChatExcel",
    category: "office",
    applicableTo: ["通用办公", "财务", "数据分析"],
    applicableTasks: ["自然语言处理Excel", "多模态成表", "一键出图出PPT"],
    coreAdvantage: "聊天即可处理复杂表格，支持图片/PDF/网页多模态一键成表并自动分析出图出PPT，门槛极低",
  },
  {
    international: "Google Workspace",
    domestic: "飞书",
    category: "office",
    applicableTo: ["通用办公", "会议协作", "知识库/智能体", "人力资源", "管理决策"],
    applicableTasks: ["文档/表格/邮件内调用AI", "搭建团队自定义智能体", "自然语言生成数据表/仪表盘"],
    coreAdvantage: "Gemini深度融入协作套件全流程；飞书智能伙伴有知识有记忆更主动，可操作文档与多维表格",
  },
  {
    international: "Gamma",
    domestic: "讯飞智文",
    category: "office",
    applicableTo: ["通用办公", "市场营销", "产品经理", "管理决策", "设计创意"],
    applicableTasks: ["一键生成演示文稿", "Word直转PPT", "AI排版与配图"],
    coreAdvantage: "一句话或一篇文档一键生成高质量PPT，Gamma设计感强可发布为网页；讯飞智文中文与专业术语适配好、秒级出稿",
  },

  // ─── 编程开发 (coding) ───
  {
    international: "OpenAI Codex",
    domestic: "字节Trae",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["复杂项目开发", "终端代理", "自动化编程"],
    coreAdvantage: "统一终端/IDE/云端多形态的编码Agent，自主完成复杂工程；Trae国内AI原生IDE，SOLO模式免费",
  },
  {
    international: "Claude Code",
    domestic: "Qoder CN",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["代码分析", "终端代理", "架构设计", "大型重构", "Code Review"],
    coreAdvantage: "终端原生编码Agent，大型代码库理解与长任务可靠性顶尖；Qoder CN(原通义灵码)仓库级上下文+Code Review智能体",
  },
  {
    international: "Cursor",
    domestic: "腾讯CodeBuddy",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["代码补全", "复杂项目开发", "多文件编辑", "后台Agent任务"],
    coreAdvantage: "AI原生IDE，Agents窗口并行后台任务+云端接管，主流vibe coding工具；CodeBuddy腾讯出品，含Craft/SPEC模式",
  },
  {
    international: "GitHub Copilot",
    domestic: "百度文心快码(Comate)",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["代码补全", "单元测试", "云端issue转PR"],
    coreAdvantage: "全球使用最广，Agent模式(IDE内)+Coding Agent(云端issue→PR)双形态；Comate基于文心大模型，贴合国内信创研发",
  },
  {
    international: "Tabnine",
    domestic: "Qoder CN",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["企业级代码补全", "私有化部署", "合规Code Review"],
    coreAdvantage: "企业级隐私合规首选，支持气隙/私有化部署、零代码留存与企业上下文引擎",
  },
  {
    international: "Google Antigravity",
    domestic: "字节Trae",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["自主多文件开发", "跨IDE/CLI/浏览器agent协同", "计划-编码-测试全流程"],
    coreAdvantage: "Google以agent为核心重构的AI-first IDE(已统一原Gemini Code Assist/CLI)，自主规划并跨文件编码+跑测试",
  },
  {
    international: "Devin",
    domestic: "腾讯CodeBuddy",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["自主完成端到端任务", "后台并行处理工单", "自动QA与PR生成"],
    coreAdvantage: "Cognition出品的自主软件工程师，支持桌面/云/CLI多形态与端到端自测，企业级显著提效",
  },
  {
    international: "Amazon Kiro",
    domestic: "Qoder CN",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["规范驱动开发(spec)", "事件钩子自动化", "需求→设计→任务→代码"],
    coreAdvantage: "原生spec规范驱动开发+事件钩子(hooks)的agent IDE；Qoder CN以Quest模式对应自主交付特性",
  },
  {
    international: "CodeRabbit",
    domestic: "Qoder CN",
    category: "coding",
    applicableTo: ["软件研发"],
    applicableTasks: ["Pull Request自动评审", "缺陷/安全隐患检测", "代码规范把关"],
    coreAdvantage: "安装量最大的AI代码评审工具，自动逐行审查PR并给修复建议；国产可用Qoder CN的Code Review智能体",
  },

  // ─── 图像生成 (image) ───
  {
    international: "Midjourney",
    domestic: "即梦AI",
    category: "image",
    applicableTo: ["设计创意", "市场营销", "视频/内容创作"],
    applicableTasks: ["商业插画", "概念设计", "创意素材"],
    coreAdvantage: "最新版出图更快、原生2K高清，美学质感行业标杆；即梦Seedream中文语义与人像质感强",
  },
  {
    international: "GPT Image",
    domestic: "通义万相",
    category: "image",
    applicableTo: ["设计创意", "市场营销", "视频/内容创作"],
    applicableTasks: ["商业插画", "素材生成", "文字渲染"],
    coreAdvantage: "对话式生成+原生推理，多语言文字渲染准确、一次多图一致(接替已停用的DALL-E)；通义万相电商与文字渲染出色",
  },
  {
    international: "FLUX",
    domestic: "哩布哩布LiblibAI",
    category: "image",
    applicableTo: ["设计创意", "软件研发", "视频/内容创作"],
    applicableTasks: ["开源模型本地/私有化出图", "LoRA微调定制画风", "可控高保真生成"],
    coreAdvantage: "FLUX为当前最强开源权重模型、真实光影可控；哩布哩布是国内最大开源模型+LoRA社区，可微调可私有化",
  },
  {
    international: "Adobe Firefly",
    domestic: "稿定AI",
    category: "image",
    applicableTo: ["设计创意", "市场营销"],
    applicableTasks: ["商业插画", "图像编辑", "创意素材"],
    coreAdvantage: "商用版权安全+对话式创意代理，跨PS/AI/PR；稿定模板丰富、AI一站式出图",
  },
  {
    international: "Google Nano Banana",
    domestic: "豆包",
    category: "image",
    applicableTo: ["设计创意", "市场营销", "通用办公"],
    applicableTasks: ["对话式图像编辑与合成", "多图角色/风格一致性", "中文海报文字渲染"],
    coreAdvantage: "Gemini图像对话式多轮编辑、角色一致性极强；豆包Seedream中文语义与海报文字渲染出色",
  },

  // ─── 视频生成 (video) ───
  {
    international: "Runway",
    domestic: "可灵AI",
    category: "video",
    applicableTo: ["视频/内容创作", "设计创意", "市场营销"],
    applicableTasks: ["影视级视频生成", "视频编辑", "特效", "商业广告"],
    coreAdvantage: "Gen-4.5电影级运动与世界一致性；可灵3.0物理引擎+长视频+智能分镜与原生音画同步",
  },
  {
    international: "Google Veo",
    domestic: "通义万相",
    category: "video",
    applicableTo: ["视频/内容创作", "市场营销", "设计创意"],
    applicableTasks: ["电影级短视频生成", "原生音画同步", "4K升采样与场景延展"],
    coreAdvantage: "Veo原生音画同步、4K与长镜头延展；通义万相参考生视频、多镜头叙事，均为影视级生成",
  },
  {
    international: "Pika",
    domestic: "即梦AI视频",
    category: "video",
    applicableTo: ["视频/内容创作", "市场营销"],
    applicableTasks: ["快速出片", "动画特效", "短视频制作"],
    coreAdvantage: "Pika主打社交短视频特效、出片快；即梦视频接入Seedance，多模态混合输入+音画同步",
  },
  {
    international: "Luma",
    domestic: "海螺AI",
    category: "video",
    applicableTo: ["视频/内容创作", "市场营销"],
    applicableTasks: ["创意运镜", "动画", "短视频"],
    coreAdvantage: "Luma Dream Machine创意运镜强；海螺(MiniMax)运动自然、多风格(写实/动漫/水墨)，性价比高",
  },
  {
    international: "HeyGen",
    domestic: "硅基智能",
    category: "video",
    applicableTo: ["视频/内容创作", "市场营销", "人力资源"],
    applicableTasks: ["数字人视频", "多语种配音", "培训视频"],
    coreAdvantage: "HeyGen手机素材即生成数字分身、175+语言口型匹配；硅基智能国内数字人市占率领先",
  },
  {
    international: "Synthesia",
    domestic: "万兴播爆",
    category: "video",
    applicableTo: ["视频/内容创作", "市场营销", "人力资源"],
    applicableTasks: ["培训视频", "合规数字人", "营销视频"],
    coreAdvantage: "Synthesia企业级培训/合规数字人、230+形象库、多语言微表情；万兴播爆多语言口播",
  },
  {
    international: "D-ID",
    domestic: "腾讯智影",
    category: "video",
    applicableTo: ["视频/内容创作", "市场营销", "人力资源", "客服"],
    applicableTasks: ["数字人口播批量生成", "PPT/文章转视频", "电商直播分身"],
    coreAdvantage: "D-ID快速批量数字人口播；腾讯智影浏览器免下载、PPT转视频、基础功能免费，适合国内培训与电商",
  },

  // ─── 音频语音 (audio) ───
  {
    international: "ElevenLabs",
    domestic: "火山引擎语音",
    category: "audio",
    applicableTo: ["视频/内容创作", "市场营销", "客服"],
    applicableTasks: ["AI语音合成", "多语种配音", "语音克隆", "多角色对话"],
    coreAdvantage: "情感表现力最强+多角色对话，多语种自然度极高；火山(豆包)语音中文音色丰富、实时合成",
  },
  {
    international: "Suno",
    domestic: "天工音乐",
    category: "audio",
    applicableTo: ["视频/内容创作", "市场营销"],
    applicableTasks: ["AI音乐创作", "背景音乐生成", "人声克隆"],
    coreAdvantage: "文本生成完整歌曲，支持人声克隆与母带级音质；天工支持粤语/方言演唱",
  },
  {
    international: "Murf AI",
    domestic: "讯飞智作",
    category: "audio",
    applicableTo: ["视频/内容创作", "市场营销", "客服"],
    applicableTasks: ["语音合成", "配音", "有声内容"],
    coreAdvantage: "企业级商用配音工作室，支持多语言多风格；讯飞智作中文配音+虚拟人一站式",
  },

  // ─── 设计工具 (design) ───
  {
    international: "Canva",
    domestic: "稿定AI",
    category: "design",
    applicableTo: ["设计创意", "市场营销", "通用办公"],
    applicableTasks: ["海报设计", "营销物料", "社交媒体素材"],
    coreAdvantage: "模板极丰富+Magic Studio AI设计一体，全球用户量最大；稿定中文场景模板丰富",
  },
  {
    international: "Adobe Firefly",
    domestic: "美图设计室",
    category: "design",
    applicableTo: ["设计创意", "市场营销"],
    applicableTasks: ["商业插画", "图像编辑", "AI商品图", "营销物料"],
    coreAdvantage: "版权安全的对话式创意代理，跨Adobe全家桶；美图设计室电商/商品图AI，无设计基础也能快速出图",
  },
  {
    international: "Figma AI",
    domestic: "即时设计AI",
    category: "design",
    applicableTo: ["设计创意", "产品经理"],
    applicableTasks: ["UI设计", "协作设计", "设计系统", "原型设计", "交互设计"],
    coreAdvantage: "画布AI Agent直接设计+Figma Make生成可运行代码，UI协作标杆；即时设计国产协作UI",
  },
  {
    international: "Recraft",
    domestic: "稿定AI",
    category: "design",
    applicableTo: ["设计创意", "市场营销"],
    applicableTasks: ["矢量/SVG图标与插画", "品牌统一风格素材", "营销物料设计"],
    coreAdvantage: "唯一可导出真·可编辑SVG矢量的AI模型，擅长品牌统一风格与营销素材；稿定AI中文模板一键设计",
  },

  // ─── 营销推广 (marketing) ───
  {
    international: "Jasper AI",
    domestic: "巨量引擎",
    category: "marketing",
    applicableTo: ["市场营销"],
    applicableTasks: ["营销文案", "品牌语调内容", "GEO生成式引擎优化", "全自动投放"],
    coreAdvantage: "企业级品牌语调一致性内容生成+GEO优化AI搜索曝光；巨量'即创'全链路AIGC创意+全自动放量投放",
  },
  {
    international: "HubSpot Breeze",
    domestic: "领帆SCRM",
    category: "marketing",
    applicableTo: ["市场营销", "销售"],
    applicableTasks: ["营销自动化", "客户旅程管理", "邮件营销", "私域运营"],
    coreAdvantage: "CRM原生的营销/销售/服务全域AI Agent；领帆企微私域全流程AI(智能打标签/话术推荐/会话总结)",
  },
  {
    international: "Copy.ai",
    domestic: "秒创AI",
    category: "marketing",
    applicableTo: ["市场营销", "通用办公"],
    applicableTasks: ["批量内容生成", "营销文案/邮件/社媒", "GTM内容工作流"],
    coreAdvantage: "从写作助手升级为GTM AI平台，内置获客/内容/SEO工作流，一键批量产出全渠道文案",
  },
  {
    international: "Surfer SEO",
    domestic: "5118",
    category: "marketing",
    applicableTo: ["市场营销"],
    applicableTasks: ["SEO内容优化", "关键词/实体覆盖", "AI搜索可见性(GEO)"],
    coreAdvantage: "基于实时SERP的排名信号打分，并追踪内容在AI引擎中的被引用率；5118提供中文关键词与SEO数据",
  },
  {
    international: "Hootsuite",
    domestic: "新榜",
    category: "marketing",
    applicableTo: ["市场营销"],
    applicableTasks: ["多平台社媒排期发布", "AI生成/改写文案", "社交聆听与舆情"],
    coreAdvantage: "一站式管理多账号排期发布+AI热点文案+社交聆听；新榜提供中文全域内容数据与投放洞察",
  },
  {
    international: "Meta Advantage+",
    domestic: "腾讯广告妙思",
    category: "marketing",
    applicableTo: ["市场营销"],
    applicableTasks: ["自动化广告投放", "AI创意生成", "受众自动匹配", "放量优化"],
    coreAdvantage: "AI接管定向与创意自动放量；腾讯妙思基于混元大模型秒生成素材、过审快、人像免授权",
  },
  {
    international: "Klaviyo",
    domestic: "致趣百川",
    category: "marketing",
    applicableTo: ["市场营销"],
    applicableTasks: ["邮件/短信营销自动化", "智能分层与旅程", "预测CLV分流"],
    coreAdvantage: "Flows AI自然语言描述即搭建营销旅程，按预测客户价值智能分流；致趣百川主打B2B私域与线索培育",
  },
  {
    international: "CreatorIQ",
    domestic: "小红书蒲公英",
    category: "marketing",
    applicableTo: ["市场营销"],
    applicableTasks: ["达人/KOL筛选与合作", "种草内容投放", "效果数据追踪"],
    coreAdvantage: "达人营销全流程管理(选人-合作-数据)；蒲公英打通'内容种草-站内成交'闭环，是中国种草营销核心平台",
  },

  // ─── 销售CRM (sales) ───
  {
    international: "Salesforce Agentforce",
    domestic: "纷享销客",
    category: "sales",
    applicableTo: ["销售", "管理决策"],
    applicableTasks: ["客户管理", "商机洞察", "销售预测", "多智能体编排"],
    coreAdvantage: "企业级多智能体编排+语音Agent+信任层；纷享销客懂中国业务的Agentic CRM，获客到服务归因全链AI",
  },
  {
    international: "Zoho CRM",
    domestic: "探迹",
    category: "sales",
    applicableTo: ["销售"],
    applicableTasks: ["客户管理", "智能获客", "销售预测", "自动触达"],
    coreAdvantage: "低代码自建AI Agent(Zia)+预测评分；探迹5万+企业数据底座的端到端找客户/背调/自动触达",
  },
  {
    international: "Gong",
    domestic: "深维智信Megaview",
    category: "sales",
    applicableTo: ["销售", "管理决策"],
    applicableTasks: ["销售会话智能分析", "商机风险预警", "AI通话评分/陪练", "团队复盘"],
    coreAdvantage: "以销售录音为核心数据源，AI提取异议与购买信号并预测风险；深维智信为国产会话智能对标",
  },
  {
    international: "Apollo.io",
    domestic: "火眼云",
    category: "sales",
    applicableTo: ["销售", "市场营销"],
    applicableTasks: ["B2B线索挖掘", "AI批量外呼序列", "账户/意向评分", "个性化触达"],
    coreAdvantage: "2亿+联系人库+代理式GTM，从建名单到启动触达序列多步自动执行；火眼云为中国B2B获客与意向数据代表",
  },
  {
    international: "Microsoft Dynamics 365 Sales",
    domestic: "销售易",
    category: "sales",
    applicableTo: ["销售", "管理决策"],
    applicableTasks: ["企业级CRM销售管理", "AI销售助理/教练", "商机预测", "线索到回款"],
    coreAdvantage: "Copilot深度嵌入销售全流程；销售易AI原生CRM NeoAgent含助理/经理/教练等多Agent，覆盖营销销售服务全场景",
  },
  {
    international: "Salesloft",
    domestic: "容联云",
    category: "sales",
    applicableTo: ["销售"],
    applicableTasks: ["销售触达节奏(Cadence)", "智能外呼", "多渠道跟进自动化"],
    coreAdvantage: "AI驱动的销售参与与外呼节奏管理，自动排布多渠道跟进；容联云提供本土智能语音外呼与联络中心",
  },

  // ─── 客户服务 (service) ───
  {
    international: "Zendesk AI",
    domestic: "智齿科技",
    category: "service",
    applicableTo: ["客服"],
    applicableTasks: ["智能问答", "工单处理", "多语言客服", "语音Agent"],
    coreAdvantage: "升级为按'已验证解决量'计费的自主AI Agent，文本+语音+邮件全渠道；智齿对接多模型的全渠道客服Agent",
  },
  {
    international: "Fin",
    domestic: "网易七鱼",
    category: "service",
    applicableTo: ["客服"],
    applicableTasks: ["智能问答", "客户服务自动化", "全渠道接待"],
    coreAdvantage: "Fin(原Intercom)按解决结果计费的高解决率客服Agent；网易七鱼强合规(等保三级)、金融政务语料深厚",
  },
  {
    international: "Sierra",
    domestic: "追一科技",
    category: "service",
    applicableTo: ["客服"],
    applicableTasks: ["全渠道自主客服Agent", "复杂多轮任务", "退款/账户变更等动作执行"],
    coreAdvantage: "Bret Taylor创立的客服Agent OS，可从SOP/通话记录直接构建生产级Agent；追一科技为国产对话式AI数字员工代表",
  },
  {
    international: "Decagon",
    domestic: "快商通",
    category: "service",
    applicableTo: ["客服", "市场营销"],
    applicableTasks: ["端到端客服自动化", "自然语言定义Agent流程", "获客留资"],
    coreAdvantage: "用自然语言定义Agent逻辑端到端处理支持任务；快商通自研大模型主打获客留资，医美/营销场景领先",
  },
  {
    international: "Gorgias",
    domestic: "阿里店小蜜",
    category: "service",
    applicableTo: ["客服"],
    applicableTasks: ["电商售前售后客服", "订单/退换处理", "询单转化"],
    coreAdvantage: "面向Shopify等电商的AI客服；店小蜜日对话千万级，'AI优先+人工兜底'显著提升询单转化",
  },
  {
    international: "Freshworks Freddy AI",
    domestic: "Udesk沃丰科技",
    category: "service",
    applicableTo: ["客服"],
    applicableTasks: ["工单自动分派与解答", "坐席辅助", "全渠道智能客服"],
    coreAdvantage: "Freddy AI覆盖客服全流程；Udesk(沃丰)大模型私有化部署+全渠道客服/呼叫中心一体化，适配中大型企业",
  },

  // ─── 人力资源 (hr) ───
  {
    international: "Workday AI",
    domestic: "北森",
    category: "hr",
    applicableTo: ["人力资源"],
    applicableTasks: ["人才管理", "招聘分析", "绩效管理", "组织发展"],
    coreAdvantage: "一体化HCM+Paradox对话式招聘Agent；北森全模块一体化+AI人才测评",
  },
  {
    international: "Workday AI",
    domestic: "Moka AI",
    category: "hr",
    applicableTo: ["人力资源"],
    applicableTasks: ["简历筛选", "人岗匹配", "招聘流程管理"],
    coreAdvantage: "Moka AI原生招聘智能体'Eva'，覆盖简历解析/人才推荐/招聘全流程，国内招聘SaaS标杆",
  },
  {
    international: "HireVue",
    domestic: "e成科技",
    category: "hr",
    applicableTo: ["人力资源"],
    applicableTasks: ["AI视频面试", "人才测评", "结构化评估"],
    coreAdvantage: "结构化AI视频面试+测评、缩短招聘周期；e成科技人才画像与智能匹配",
  },
  {
    international: "Eightfold AI",
    domestic: "用友大易",
    category: "hr",
    applicableTo: ["人力资源"],
    applicableTasks: ["人才智能匹配", "内部人才市场", "技能盘点"],
    coreAdvantage: "技能图谱驱动的人才智能匹配，新增AI自主面试；用友大易招聘一体化",
  },
  {
    international: "Paradox",
    domestic: "智联招聘",
    category: "hr",
    applicableTo: ["人力资源"],
    applicableTasks: ["高频/蓝领招聘", "简历初筛", "面试自动安排"],
    coreAdvantage: "对话式招聘机器人自动完成筛选/答疑/面试预约(已并入Workday)；智联招聘AI高频招聘提效",
  },

  // ─── 数据分析 (data) ───
  {
    international: "Power BI Copilot",
    domestic: "帆软FineBI",
    category: "data",
    applicableTo: ["数据分析", "管理决策", "财务"],
    applicableTasks: ["数据可视化", "自然语言问数", "智能报表"],
    coreAdvantage: "微软生态深度集成，自然语言生成报表/DAX；帆软FineChatBI对话式业务分析、异常识别",
  },
  {
    international: "Tableau AI",
    domestic: "阿里云Quick BI",
    category: "data",
    applicableTo: ["数据分析", "管理决策", "财务"],
    applicableTasks: ["数据可视化", "智能洞察", "自然语言分析"],
    coreAdvantage: "Pulse指标层+Tableau Agent(支持MCP)，可视化能力极强；Quick BI'智能小Q'大模型驱动连续问数",
  },
  {
    international: "Julius AI",
    domestic: "观远数据",
    category: "data",
    applicableTo: ["数据分析"],
    applicableTasks: ["自然语言问数", "自动出图", "数据探索"],
    coreAdvantage: "上传表格或连库即用自然语言提问，自动生成代码/图表/结论；观远数据一站式BI+AI分析",
  },
  {
    international: "DataGPT",
    domestic: "数势科技",
    category: "data",
    applicableTo: ["数据分析", "管理决策"],
    applicableTasks: ["指标问答", "自动归因分析"],
    coreAdvantage: "对话式指标平台，自动完成异动归因与洞察生成；数势科技企业级指标与分析Agent",
  },

  // ─── 法务合规 (legal) ───
  {
    international: "Harvey AI",
    domestic: "法大大iTerms",
    category: "legal",
    applicableTo: ["法务合规"],
    applicableTasks: ["法律研究", "合同分析", "文书起草"],
    coreAdvantage: "全球最强法律AI，Agent Builder+500+预置法律智能体；法大大iTerms中文非标合同智审",
  },
  {
    international: "Spellbook",
    domestic: "幂律智能",
    category: "legal",
    applicableTo: ["法务合规"],
    applicableTasks: ["合同起草", "条款风险审查"],
    coreAdvantage: "Word内嵌AI起草与逐条红线建议、面向单份合同高效审改；幂律MeCheck合同审查专业度高",
  },
  {
    international: "Legora",
    domestic: "通义法睿",
    category: "legal",
    applicableTo: ["法务合规"],
    applicableTasks: ["合同审查与红线", "法律研究", "文书起草"],
    coreAdvantage: "Word/Outlook原生协作式法律AI，支持playbook规则审查与合同数据提取；通义法睿中文法律研究与咨询",
  },
  {
    international: "Robin AI",
    domestic: "iCourt Alpha",
    category: "legal",
    applicableTo: ["法务合规"],
    applicableTasks: ["合同审查", "合同全生命周期管理(CLM)"],
    coreAdvantage: "亿级条款训练+数据私有化环境，审查与CLM一体化；iCourt Alpha国内律所智能工作台",
  },
  {
    international: "Vanta",
    domestic: "合规猫",
    category: "legal",
    applicableTo: ["法务合规"],
    applicableTasks: ["安全合规认证(SOC2/ISO)", "合规问卷与制度起草", "证据自动收集"],
    coreAdvantage: "AI Agent自动化合规:证据采集/制度起草/问卷应答，覆盖EU AI Act；合规猫国内合规管理",
  },

  // ─── 财务管理 (finance) ───
  {
    international: "SAP AI",
    domestic: "金蝶AI",
    category: "finance",
    applicableTo: ["财务", "供应链/运营", "管理决策"],
    applicableTasks: ["财务分析", "智能审单", "凭证/对账自治", "财报分析"],
    coreAdvantage: "Joule财务自治Agent(凭证/对账/计提)减负显著；金蝶'AI超级套件'内置多智能体，苍穹GPT为国产财务大模型",
  },
  {
    international: "SAP AI",
    domestic: "用友网络",
    category: "finance",
    applicableTo: ["财务", "供应链/运营"],
    applicableTasks: ["ERP智能化", "财务共享", "供应链协同"],
    coreAdvantage: "SAP Joule供应链与财务Agent；用友YonClaw企业超级智能体自主拆解并回写业务结果，YonGPT适配DeepSeek",
  },
  {
    international: "ABBYY",
    domestic: "合合信息",
    category: "finance",
    applicableTo: ["财务"],
    applicableTasks: ["票据识别", "报销自动化", "OCR"],
    coreAdvantage: "ABBYY全球文档智能与IDP领先；合合(TextIn)增值税发票/行程单等20+国内票据高精度识别与报销自动化",
  },
  {
    international: "SAP Concur",
    domestic: "汇联易",
    category: "finance",
    applicableTo: ["财务", "通用办公"],
    applicableTasks: ["费用报销", "发票OCR识别", "费控与差旅管理"],
    coreAdvantage: "全球差旅费控标杆；汇联易OCR高精度识票+自动分类审核的智能费控报销",
  },
  {
    international: "Pigment",
    domestic: "元年科技",
    category: "finance",
    applicableTo: ["财务", "管理决策"],
    applicableTasks: ["财务预测FP&A", "预算编制", "情景/滚动模拟"],
    coreAdvantage: "AI Agent驱动的连接式实时业务规划与FP&A；元年科技国产全面预算与财务分析",
  },

  // ─── 供应链 (supply_chain) ───
  {
    international: "SAP AI",
    domestic: "旷视科技",
    category: "supply_chain",
    applicableTo: ["供应链/运营"],
    applicableTasks: ["仓储物流自动化", "视觉调度", "仓储机器人"],
    coreAdvantage: "SAP IBP+Joule供应链Agent；旷视河图AI+视觉/机器人主打仓储物流软硬件结合",
  },
  {
    international: "o9 Solutions",
    domestic: "菜鸟",
    category: "supply_chain",
    applicableTo: ["供应链/运营", "管理决策"],
    applicableTasks: ["需求预测", "库存优化", "集成业务计划(IBP)"],
    coreAdvantage: "数字大脑打通供、销、财一体化计划与情景推演；菜鸟供应链智能预测与物流协同",
  },
  {
    international: "Kinaxis",
    domestic: "京东物流",
    category: "supply_chain",
    applicableTo: ["供应链/运营"],
    applicableTasks: ["供应链协同", "实时调度", "产能/约束模拟"],
    coreAdvantage: "并发计算引擎实现供应链约束的实时联动响应；京东物流一体化供应链与智能调度",
  },

  // ─── 产品/项目管理 (pm) ───
  {
    international: "Linear AI",
    domestic: "飞书项目AI",
    category: "pm",
    applicableTo: ["产品经理", "软件研发", "管理决策"],
    applicableTasks: ["项目管理", "任务跟踪", "需求管理", "AI Triage"],
    coreAdvantage: "AI Triage+Agent+语义搜索，自动化研发工作流；飞书项目AI持续接入大模型",
  },
  {
    international: "小摹AI",
    domestic: "小摹AI",
    category: "pm",
    applicableTo: ["产品经理"],
    applicableTasks: ["原型设计", "线框图生成", "PRD生成"],
    coreAdvantage: "自然语言快速生成可编辑原型与PRD，大幅简化流程",
  },
  {
    international: "墨刀AI",
    domestic: "墨刀AI",
    category: "pm",
    applicableTo: ["产品经理"],
    applicableTasks: ["原型设计", "交互设计"],
    coreAdvantage: "AI一键生成原型+PRD，原型→UI→交付协作一体化，国内主流原型工具",
  },
  {
    international: "Google Stitch",
    domestic: "Google Stitch",
    category: "pm",
    applicableTo: ["产品经理", "设计创意"],
    applicableTasks: ["原型设计", "UI设计", "设计稿生成", "交互设计"],
    coreAdvantage: "免费实时AI生成高保真UI+多框架代码导出，产品经理与设计师均可使用",
  },
  {
    international: "Jira",
    domestic: "钉钉Teambition",
    category: "pm",
    applicableTo: ["产品经理", "软件研发", "管理决策"],
    applicableTasks: ["任务/需求管理", "自然语言查询(JQL)", "流程自动化"],
    coreAdvantage: "企业级敏捷管理+Rovo搜索/对话/自动化Agent；钉钉Teambition项目协作AI",
  },
  {
    international: "v0",
    domestic: "即时设计",
    category: "pm",
    applicableTo: ["产品经理", "设计创意", "软件研发"],
    applicableTasks: ["AI生成原型", "前端组件生成"],
    coreAdvantage: "文本生成可直接使用的React/Next.js+Tailwind组件与界面；即时设计国产AI原型",
  },
  {
    international: "Figma Make",
    domestic: "Pixso",
    category: "pm",
    applicableTo: ["设计创意", "产品经理"],
    applicableTasks: ["文本生成高保真原型", "可交互原型"],
    coreAdvantage: "Claude驱动的text-to-UI，产出可点击高保真原型并复用设计系统；Pixso国产协作设计+AI",
  },

  // ─── 会议纪要 (meeting) ───
  {
    international: "Otter.ai",
    domestic: "飞书妙记",
    category: "meeting",
    applicableTo: ["会议协作", "通用办公", "管理决策"],
    applicableTasks: ["会议转写", "实时纪要", "待办提取", "会议知识沉淀"],
    coreAdvantage: "从纪要工具升级为会话知识引擎，跨会议沉淀可检索知识并触发动作(支持MCP)；飞书妙记生态无缝集成",
  },
  {
    international: "Fireflies.ai",
    domestic: "讯飞听见",
    category: "meeting",
    applicableTo: ["会议协作", "通用办公"],
    applicableTasks: ["会议记录", "会中实时教练", "行动项提取", "实时翻译"],
    coreAdvantage: "跨平台自动纪要+会中实时教练(Live Assist)+MCP接入AI工具；讯飞听见ASR准确率行业领先",
  },
  {
    international: "通义听悟",
    domestic: "通义听悟",
    category: "meeting",
    applicableTo: ["会议协作", "通用办公"],
    applicableTasks: ["音视频转录", "总结", "思维导图"],
    coreAdvantage: "功能全面，适配腾讯会议/钉钉，多人识别与企业会议纪要强",
  },

  // ─── 智能体/工作流 (agent) ───
  {
    international: "Manus",
    domestic: "扣子Coze",
    category: "agent",
    applicableTo: ["通用办公", "知识库/智能体", "软件研发", "管理决策"],
    applicableTasks: ["智能体搭建", "复杂任务自动化", "多平台分发", "零代码AI应用"],
    coreAdvantage: "通用AI Agent自主完成复杂多步任务，桌面版可操作本机；扣子2.0零代码多智能体协同，接入抖音/微信方便",
  },
  {
    international: "Zapier",
    domestic: "集简云",
    category: "agent",
    applicableTo: ["通用办公", "市场营销", "销售", "知识库/智能体"],
    applicableTasks: ["应用连接", "自动化工作流", "数据同步"],
    coreAdvantage: "目标驱动自主Agent+安全护栏，连接9000+应用；集简云国内最大iPaaS，对接国内主流SaaS",
  },
  {
    international: "Make",
    domestic: "BetterYeah AI",
    category: "agent",
    applicableTo: ["通用办公", "知识库/智能体", "软件研发"],
    applicableTasks: ["可视化自动化", "复杂工作流编排", "多智能体协同"],
    coreAdvantage: "可视化Agent编排+推理透明，3000+应用；BetterYeah NeuroFlow编排+多模态知识引擎，企业级私有化",
  },
  {
    international: "UiPath",
    domestic: "实在智能",
    category: "agent",
    applicableTo: ["通用办公", "供应链/运营", "财务", "知识库/智能体"],
    applicableTasks: ["企业级RPA+AI自动化", "遗留系统操作", "流程自动化"],
    coreAdvantage: "RPA+Agent+编排治理，支持本地化Agentic AI；实在智能免接口即可操作任意软件，适配遗留系统",
  },
  {
    international: "n8n",
    domestic: "Dify",
    category: "agent",
    applicableTo: ["软件研发", "知识库/智能体"],
    applicableTasks: ["工作流自动化", "自托管", "AI应用开发", "RAG知识库"],
    coreAdvantage: "n8n开源可自托管Agentic工作流+多模型编排；Dify开源LLMOps标杆，原生集成MCP+RAG+可观测",
  },
  {
    international: "Claude Cowork",
    domestic: "WorkBuddy",
    category: "agent",
    applicableTo: ["通用办公", "会议协作", "知识库/智能体", "软件研发", "管理决策"],
    applicableTasks: ["跨文件/邮件/网页多步长任务自主执行", "复杂目标拆解并持续工作到交付", "绑定技能与子智能体"],
    coreAdvantage: "交给一个目标即跨工具自主长时执行到完成，可绑定技能/连接器/子智能体成为岗位专家；WorkBuddy为腾讯多智能体桌面工作台",
  },
  {
    international: "ChatGPT Agent",
    domestic: "纳米AI",
    category: "agent",
    applicableTo: ["通用办公", "数据分析", "市场营销", "知识库/智能体"],
    applicableTasks: ["自主浏览网页并操作表单/预订/下单", "调研并一体生成报告与图表"],
    coreAdvantage: "自带虚拟机可浏览网页、操作应用、处理文件，关键操作(登录/支付)前暂停确认；纳米AI国产多智能体搜索与执行",
  },
  {
    international: "Microsoft Copilot Studio",
    domestic: "百度千帆",
    category: "agent",
    applicableTo: ["通用办公", "客服", "知识库/智能体", "软件研发"],
    applicableTasks: ["低代码搭建企业自定义智能体", "接入内部系统并编排自动化流程"],
    coreAdvantage: "低代码可视化构建可治理的企业级智能体，深度打通办公/云生态与内部工具；百度千帆企业级模型+Agent开发平台",
  },

  // ─── 知识库/RAG (knowledge) ───
  {
    international: "FastGPT",
    domestic: "FastGPT",
    category: "knowledge",
    applicableTo: ["知识库/智能体", "软件研发"],
    applicableTasks: ["企业知识库", "RAG问答", "可视化Agent编排"],
    coreAdvantage: "国内最成熟的开源RAG框架，融合可视化Agent编排与实时知识更新，深度定制能力强",
  },
  {
    international: "阿里云百炼",
    domestic: "阿里云百炼",
    category: "knowledge",
    applicableTo: ["知识库/智能体", "管理决策"],
    applicableTasks: ["企业知识管理", "智能问答", "模型服务"],
    coreAdvantage: "一站式MaaS+Agent平台，集成Qwen/DeepSeek百万上下文，零代码知识库问答，企业级",
  },
  {
    international: "Glean",
    domestic: "RAGFlow",
    category: "knowledge",
    applicableTo: ["知识库/智能体", "通用办公", "数据分析", "人力资源"],
    applicableTasks: ["跨100+企业应用统一语义检索", "基于私域知识的问答与智能体"],
    coreAdvantage: "Glean企业级统一搜索+RAG跨全部内部系统精准检索并支撑多步智能体；RAGFlow国产开源深度文档理解RAG，可自部署",
  },
  {
    international: "Google NotebookLM",
    domestic: "腾讯ima",
    category: "knowledge",
    applicableTo: ["知识库/智能体", "通用办公", "市场营销", "管理决策"],
    applicableTasks: ["上传文档生成摘要/思维导图/播客", "基于指定资料的可溯源问答"],
    coreAdvantage: "以指定资料为唯一来源做可溯源的总结/问答/再创作；腾讯ima搜-读-写一体'第二大脑'，绑定微信生态",
  },

  // ─── 写作辅助 (writing) ───
  {
    international: "Grammarly",
    domestic: "秘塔写作猫",
    category: "writing",
    applicableTo: ["通用办公", "市场营销"],
    applicableTasks: ["语法检查", "写作润色", "风格优化"],
    coreAdvantage: "全球最流行英文写作辅助，语法纠错与改写精准(现隶属Superhuman Suite)；秘塔写作猫中文校对/纠错/润色",
  },
  {
    international: "Jasper",
    domestic: "豆包",
    category: "writing",
    applicableTo: ["市场营销", "通用办公", "视频/内容创作"],
    applicableTasks: ["营销文案", "内容创作", "品牌写作", "文档改写润色"],
    coreAdvantage: "面向营销的品牌语调内容生成；豆包(原火山写作能力已并入)支持生成/改写/润色与文档处理，多端覆盖",
  },

  // ─── 学术研究 (research) ───
  {
    international: "Consensus",
    domestic: "学术版秘塔",
    category: "research",
    applicableTo: ["数据分析", "管理决策"],
    applicableTasks: ["学术搜索", "文献综述", "证据查找"],
    coreAdvantage: "基于2亿+论文的证据发现，用共识度量表快速判断研究是否支持某结论；学术版秘塔中文文献搜索与脑图",
  },
  {
    international: "Elicit",
    domestic: "天工超级智能体",
    category: "research",
    applicableTo: ["数据分析", "管理决策"],
    applicableTasks: ["研究助手", "论文分析", "数据提取", "深度检索"],
    coreAdvantage: "系统综述级文献抽取，自动生成带引文的结构化研究报告；天工超级智能体深度检索+文档/PPT/表格一体产出",
  },
];

// ============================================================
// Job Family Inference
// ============================================================

const KEYWORD_MAP: Record<string, JobFamily[]> = {
  "开发|研发|工程师|架构|测试|运维|DevOps|前端|后端|全栈|程序员|码农|SRE|DBA": ["软件研发"],
  "产品|需求|PRD|用户体验|产品经理|产品总监": ["产品经理"],
  "设计|UI|UX|视觉|美术|创意|平面|插画|动效": ["设计创意"],
  "营销|市场|品牌|推广|增长|内容运营|新媒体|SEO|SEM|投放|公关|PR|广告|种草": ["市场营销"],
  "销售|商务|BD|客户开发|大客户|渠道|业务拓展|拓展经理|招商|渠道拓展": ["销售"],
  "客服|售后|服务|呼叫中心|在线客服|客户支持|客户成功": ["客服"],
  "HR|人力|招聘|培训|绩效|薪酬|HRBP|组织发展|人事|劳动关系": ["人力资源"],
  "财务|会计|审计|税务|出纳|成本|资金|预算": ["财务"],
  "法务|合规|法律|风控|知识产权|律师|法规": ["法务合规"],
  "数据|BI|分析师|数据科学|统计|算法|机器学习|大数据": ["数据分析"],
  "总监|VP|总经理|CEO|COO|CTO|CFO|管理|决策|战略|总裁": ["管理决策"],
  "供应链|采购|物流|仓储|生产|制造|运营|营运|督导|质量|品控|工厂": ["供应链/运营"],
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
    rules.push("- 禁止推荐编程IDE和代码工具（如 Cursor、GitHub Copilot、Qoder CN、Trae、Devin等）");
  }
  if (!jobFamilies.includes("设计创意") && !jobFamilies.includes("产品经理")) {
    rules.push("- 禁止推荐专业UI设计工具（如 Figma AI、即时设计AI、Figma Make等），但通用设计工具（如Canva/稿定AI）允许");
  }
  if (!jobFamilies.includes("市场营销")) {
    rules.push("- 禁止推荐广告投放和营销自动化工具（如 巨量引擎、HubSpot Breeze、Klaviyo、Surfer SEO等）");
  }
  if (!jobFamilies.includes("人力资源")) {
    rules.push("- 禁止推荐招聘ATS和HR管理系统（如 Moka AI、北森、Workday AI、HireVue等）");
  }
  if (!jobFamilies.includes("法务合规")) {
    rules.push("- 禁止推荐法律专业工具（如 Harvey AI、法大大iTerms、Spellbook、幂律智能等）");
  }
  if (!jobFamilies.includes("财务")) {
    rules.push("- 禁止推荐财务ERP和会计工具（如 金蝶AI、用友网络、合合信息、汇联易等）");
  }
  if (!jobFamilies.includes("供应链/运营")) {
    rules.push("- 禁止推荐供应链和物流工具（如 SAP AI、旷视科技、o9 Solutions、Kinaxis等）");
  }
  if (!jobFamilies.includes("客服")) {
    rules.push("- 禁止推荐专业客服系统（如 Zendesk AI、Fin、智齿科技、网易七鱼等）");
  }
  if (!jobFamilies.includes("销售")) {
    rules.push("- 禁止推荐CRM和销售工具（如 Salesforce Agentforce、纷享销客、探迹、Gong等）");
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
// Common LLM hallucination / typo corrections & renamed-tool mappings
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
  'wps ai': 'WPS灵犀',
  'wpsai': 'WPS灵犀',
  'wps灵犀': 'WPS灵犀',
  'microsoft copilot': 'Microsoft 365 Copilot',
  'microsoft 365 copilot': 'Microsoft 365 Copilot',
  'm365 copilot': 'Microsoft 365 Copilot',
  'midjourney ai': 'Midjourney',
  'stable diffusion ai': 'Stable Diffusion',
  'dall-e': 'GPT Image',
  'dalle': 'GPT Image',
  'dall·e': 'GPT Image',
  'dall e': 'GPT Image',
  'gpt image': 'GPT Image',
  'figma ai': 'Figma AI',
  'figmaai': 'Figma AI',
  'figma make': 'Figma Make',
  '即时设计ai': '即时设计AI',
  '墨刀ai': '墨刀AI',
  '通义灵码': 'Qoder CN',
  'lingma': 'Qoder CN',
  'lingma ide': 'Qoder CN',
  'qoder cn': 'Qoder CN',
  'qoder': 'Qoder CN',
  'windsurf': 'Google Antigravity',
  'gemini code assist': 'Google Antigravity',
  'antigravity': 'Google Antigravity',
  'codebuddy': '腾讯CodeBuddy',
  'trae': '字节Trae',
  'comate': '百度文心快码(Comate)',
  '文心快码': '百度文心快码(Comate)',
  '文心一言4': '文心一言',
  '文心一言4.0': '文心一言',
  'perplexity ai': 'Perplexity',
  '秘塔ai搜索': '秘塔AI搜索',
  '秘塔ai': '秘塔AI搜索',
  '网易七鱼': '网易七鱼',
  '智齿科技': '智齿科技',
  'hubspot ai': 'HubSpot Breeze',
  'hubspot breeze': 'HubSpot Breeze',
  'breeze': 'HubSpot Breeze',
  'intercom fin': 'Fin',
  'intercom': 'Fin',
  'moka': 'Moka AI',
  'moka ai': 'Moka AI',
  '火山写作': '豆包',
  'doubao': '豆包',
  '天工ai搜索': '天工超级智能体',
  '天工超级智能体': '天工超级智能体',
  'notebooklm': 'Google NotebookLM',
  'google notebooklm': 'Google NotebookLM',
  'claude cowork': 'Claude Cowork',
  'chatgpt agent': 'ChatGPT Agent',
  'copilot studio': 'Microsoft Copilot Studio',
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
