/**
 * SOTA AI工具数据库 - 2026年5月更新
 * 基于联网搜索验证的真实工具，覆盖15个类别
 * 每个工具包含：名称、类别、是否国产、免费/付费、适用场景、官网
 */

export interface AITool {
  id: string;
  name: string;
  category: string;
  isDomestic: boolean; // 是否国产
  pricing: "free" | "freemium" | "paid"; // 免费/免费增值/付费
  description: string;
  useCases: string[];
  officialUrl: string;
  tags: string[];
}

export const AI_TOOLS_DATABASE: AITool[] = [
  // === 大模型/对话 ===
  { id: "chatgpt", name: "ChatGPT", category: "大模型对话", isDomestic: false, pricing: "freemium", description: "OpenAI旗舰对话模型，支持文本、图像、代码等多模态任务", useCases: ["文案撰写", "数据分析", "代码生成", "翻译"], officialUrl: "https://chat.openai.com", tags: ["通用", "多模态"] },
  { id: "claude", name: "Claude", category: "大模型对话", isDomestic: false, pricing: "freemium", description: "Anthropic出品，擅长长文本理解、逻辑推理和代码", useCases: ["长文档分析", "逻辑推理", "代码审查", "学术写作"], officialUrl: "https://claude.ai", tags: ["长文本", "推理"] },
  { id: "deepseek", name: "DeepSeek", category: "大模型对话", isDomestic: true, pricing: "free", description: "深度求索出品，开源免费，推理能力强，支持128K上下文", useCases: ["代码生成", "数学推理", "文本分析", "知识问答"], officialUrl: "https://chat.deepseek.com", tags: ["开源", "免费", "推理"] },
  { id: "doubao", name: "豆包", category: "大模型对话", isDomestic: true, pricing: "free", description: "字节跳动出品，免费使用，支持多轮对话和文件分析", useCases: ["日常问答", "文案创作", "翻译", "摘要"], officialUrl: "https://www.doubao.com", tags: ["免费", "多功能"] },
  { id: "kimi", name: "Kimi", category: "大模型对话", isDomestic: true, pricing: "free", description: "月之暗面出品，支持200万字超长上下文，擅长文档分析", useCases: ["长文档阅读", "论文分析", "会议纪要", "报告撰写"], officialUrl: "https://kimi.moonshot.cn", tags: ["超长上下文", "免费"] },
  { id: "wenxin", name: "文心一言", category: "大模型对话", isDomestic: true, pricing: "free", description: "百度出品，中文理解能力强，支持多模态", useCases: ["中文写作", "知识问答", "创意生成", "数据分析"], officialUrl: "https://yiyan.baidu.com", tags: ["中文优化", "免费"] },
  { id: "tongyi", name: "通义千问", category: "大模型对话", isDomestic: true, pricing: "free", description: "阿里出品，支持文本、图像、音频等多模态理解", useCases: ["文档处理", "代码生成", "图像理解", "数据分析"], officialUrl: "https://tongyi.aliyun.com", tags: ["多模态", "免费"] },

  // === AI Agent/自动化 ===
  { id: "coze", name: "扣子(Coze)", category: "AI Agent平台", isDomestic: true, pricing: "free", description: "字节跳动AI Agent开发平台，零代码搭建智能体，支持插件和工作流", useCases: ["自动化工作流", "客服机器人", "数据采集", "内容生成"], officialUrl: "https://www.coze.cn", tags: ["零代码", "免费", "Agent"] },
  { id: "dify", name: "Dify", category: "AI Agent平台", isDomestic: true, pricing: "freemium", description: "开源LLM应用开发平台，支持RAG、Agent、工作流编排", useCases: ["知识库问答", "工作流自动化", "AI应用开发"], officialUrl: "https://dify.ai", tags: ["开源", "RAG", "工作流"] },
  { id: "manus", name: "Manus", category: "AI Agent平台", isDomestic: false, pricing: "freemium", description: "通用AI Agent，可自主完成复杂任务，支持联网搜索和代码执行", useCases: ["深度研究", "数据分析", "自动化任务", "内容创作"], officialUrl: "https://manus.im", tags: ["通用Agent", "自主执行"] },
  { id: "n8n", name: "n8n", category: "自动化工作流", isDomestic: false, pricing: "freemium", description: "开源工作流自动化工具，支持400+应用集成", useCases: ["跨系统数据同步", "自动化报告", "消息通知", "数据处理"], officialUrl: "https://n8n.io", tags: ["开源", "集成", "自动化"] },

  // === 编程/开发 ===
  { id: "cursor", name: "Cursor", category: "AI编程", isDomestic: false, pricing: "freemium", description: "2026年最流行的AI原生IDE，支持代码补全、重构、Agent模式", useCases: ["代码编写", "代码重构", "Bug修复", "全栈开发"], officialUrl: "https://cursor.com", tags: ["IDE", "最流行"] },
  { id: "claude-code", name: "Claude Code", category: "AI编程", isDomestic: false, pricing: "paid", description: "Anthropic终端级编程代理，自主完成复杂编程任务", useCases: ["自主编程", "代码重构", "项目搭建", "Bug修复"], officialUrl: "https://claude.ai", tags: ["Agent", "终端", "最新"] },
  { id: "github-copilot", name: "GitHub Copilot", category: "AI编程", isDomestic: false, pricing: "paid", description: "GitHub AI编程助手，深度集成VS Code，支持Agent和多模型", useCases: ["代码补全", "测试生成", "文档生成", "代码审查"], officialUrl: "https://github.com/features/copilot", tags: ["代码补全", "VS Code"] },
  { id: "windsurf", name: "Windsurf", category: "AI编程", isDomestic: false, pricing: "freemium", description: "Codeium出品AI IDE，上下文理解强，支持大型代码库", useCases: ["代码补全", "代码理解", "重构", "大项目"], officialUrl: "https://windsurf.com", tags: ["IDE", "上下文"] },
  { id: "openai-codex", name: "OpenAI Codex", category: "AI编程", isDomestic: false, pricing: "paid", description: "OpenAI自主编程代理，可独立完成GitHub issue和PR", useCases: ["自主编程", "Issue修复", "代码审查", "自动化"], officialUrl: "https://openai.com", tags: ["Agent", "自主", "最新"] },
  { id: "tongyi-lingma", name: "通义灵码", category: "AI编程", isDomestic: true, pricing: "free", description: "阿里出品免费AI编程助手，企业级安全，支持VS Code和JetBrains", useCases: ["代码补全", "代码生成", "单元测试", "代码解释"], officialUrl: "https://tongyi.aliyun.com/lingma", tags: ["免费", "国产", "企业"] },
  { id: "marscode", name: "MarsCode", category: "AI编程", isDomestic: true, pricing: "free", description: "字节跳动免费AI编程助手，支持代码补全和Cloud IDE", useCases: ["代码补全", "代码生成", "在线开发", "代码解释"], officialUrl: "https://www.marscode.cn", tags: ["免费", "Cloud IDE"] },
  { id: "codegeex", name: "CodeGeeX", category: "AI编程", isDomestic: true, pricing: "free", description: "智谱AI开源代码模型，免费使用，支持多种IDE", useCases: ["代码补全", "代码翻译", "注释生成", "代码解释"], officialUrl: "https://codegeex.cn", tags: ["免费", "开源", "国产"] },
  { id: "codebuddy", name: "CodeBuddy", category: "AI编程", isDomestic: true, pricing: "free", description: "腾讯云AI代码编辑器，基于元宝代码大模型，支持代码补全、生成和Agent模式", useCases: ["代码补全", "代码生成", "Agent自主编程", "全栈开发"], officialUrl: "https://www.codebuddy.ai", tags: ["免费", "国产", "Agent", "腾讯"] },
  { id: "trae", name: "Trae", category: "AI编程", isDomestic: true, pricing: "free", description: "字节跳动AI IDE，支持Solo自主编程模式，免费使用，内置多模型切换", useCases: ["代码补全", "自主编程", "项目搭建", "代码重构"], officialUrl: "https://www.trae.ai", tags: ["免费", "国产", "Solo模式", "IDE"] },

  // === 图像生成/设计 ===
  { id: "gpt-image-2", name: "GPT-image-2", category: "AI图像生成", isDomestic: false, pricing: "freemium", description: "OpenAI最新图像生成模型(2026)，文字渲染能力极强，支持精确编辑和多风格", useCases: ["营销素材", "产品图", "文字海报", "图像编辑"], officialUrl: "https://openai.com", tags: ["文字渲染", "编辑", "最新"] },
  { id: "midjourney", name: "Midjourney v7", category: "AI图像生成", isDomestic: false, pricing: "paid", description: "顶级AI图像生成工具v7版，艺术质量业界最高，支持3D和视频", useCases: ["概念设计", "营销素材", "品牌视觉", "插画"], officialUrl: "https://midjourney.com", tags: ["艺术", "高质量"] },
  { id: "flux", name: "FLUX 2.0", category: "AI图像生成", isDomestic: false, pricing: "freemium", description: "Black Forest Labs开源图像模型，细节精确，开源最强", useCases: ["图像生成", "精确控制", "风格转换", "商业设计"], officialUrl: "https://blackforestlabs.ai", tags: ["开源", "精确", "最新"] },
  { id: "ideogram", name: "Ideogram 3.0", category: "AI图像生成", isDomestic: false, pricing: "freemium", description: "文字渲染和设计能力极强的图像生成工具，适合Logo和海报", useCases: ["Logo设计", "海报", "文字图像", "品牌设计"], officialUrl: "https://ideogram.ai", tags: ["文字", "设计", "Logo"] },
  { id: "nano-banana", name: "Nano Banana 2", category: "AI图像生成", isDomestic: false, pricing: "freemium", description: "2026年新锐图像生成模型，速度极快，风格多样，性价比高", useCases: ["快速出图", "批量生成", "创意设计", "社交媒体"], officialUrl: "https://nanobanana.ai", tags: ["快速", "最新", "性价比"] },
  { id: "recraft", name: "Recraft V3", category: "AI图像生成", isDomestic: false, pricing: "freemium", description: "专业矢量图和设计稿生成，支持SVG输出和品牌一致性", useCases: ["矢量设计", "图标生成", "品牌物料", "UI设计"], officialUrl: "https://www.recraft.ai", tags: ["矢量", "设计", "SVG"] },
  { id: "tongyi-wanxiang", name: "通义万相2.7", category: "AI图像生成", isDomestic: true, pricing: "free", description: "阿里最新图像生成模型，支持文生图/图生图/图像编辑/多图组合", useCases: ["营销海报", "产品图", "图像编辑", "电商素材"], officialUrl: "https://tongyi.aliyun.com/wanxiang", tags: ["国产", "免费", "编辑", "最新"] },
  { id: "jimeng", name: "即梦AI", category: "AI图像生成", isDomestic: true, pricing: "free", description: "字节跳动AI图像/视频生成平台，支持文生图、图生图", useCases: ["营销海报", "社交媒体配图", "产品展示", "创意设计"], officialUrl: "https://jimeng.jianying.com", tags: ["免费", "视频生成"] },
  { id: "ketu", name: "可图", category: "AI图像生成", isDomestic: true, pricing: "free", description: "快手出品高质量图像生成工具，写实风格出色", useCases: ["写实图像", "人像生成", "场景图", "广告素材"], officialUrl: "https://ketu.kuaishou.com", tags: ["国产", "免费", "写实"] },
  { id: "canva", name: "Canva AI", category: "AI设计", isDomestic: false, pricing: "freemium", description: "在线设计平台，AI辅助生成设计、文案、图片", useCases: ["海报设计", "PPT制作", "社交媒体图", "品牌物料"], officialUrl: "https://www.canva.com", tags: ["设计", "模板"] },
  { id: "figma-ai", name: "Figma AI", category: "AI设计", isDomestic: false, pricing: "freemium", description: "Figma内置AI功能，支持自动布局、设计生成和原型制作", useCases: ["UI设计", "原型制作", "设计系统", "协作设计"], officialUrl: "https://www.figma.com", tags: ["UI/UX", "协作"] },
  { id: "gaoding", name: "稿定设计AI", category: "AI设计", isDomestic: true, pricing: "freemium", description: "国产在线设计工具，AI智能抠图、海报生成、批量设计", useCases: ["电商海报", "社交媒体图", "批量设计", "智能抠图"], officialUrl: "https://www.gaoding.com", tags: ["国产", "电商", "批量"] },
  { id: "jishi-design", name: "即时设计AI", category: "AI设计", isDomestic: true, pricing: "freemium", description: "国产Figma替代品，内置AI设计助手，支持团队协作", useCases: ["UI设计", "原型制作", "团队协作", "设计规范"], officialUrl: "https://js.design", tags: ["国产", "UI/UX", "协作"] },

  // === 视频生成/编辑 ===
  { id: "runway", name: "Runway Gen-4.5", category: "AI视频", isDomestic: false, pricing: "freemium", description: "AI视频生成领先平台，运动笔刷精确控制，支持文/图生视频", useCases: ["短视频制作", "广告素材", "特效制作", "视频编辑"], officialUrl: "https://runwayml.com", tags: ["视频生成", "特效", "最新"] },
  { id: "google-veo", name: "Google Veo 3", category: "AI视频", isDomestic: false, pricing: "free", description: "Google最新视频生成模型，免费使用，质量高，支持音频同步", useCases: ["视频创作", "广告制作", "教育内容", "创意短片"], officialUrl: "https://deepmind.google/veo", tags: ["免费", "高质量", "最新"] },
  { id: "pika", name: "Pika 2.5", category: "AI视频", isDomestic: false, pricing: "freemium", description: "AI视频生成工具，擅长特效和风格化，操作简单", useCases: ["特效视频", "风格化", "社交媒体", "创意内容"], officialUrl: "https://pika.art", tags: ["特效", "风格化"] },
  { id: "kling", name: "可灵AI 3.0", category: "AI视频", isDomestic: true, pricing: "freemium", description: "快手出品，国产视频生成第一，AI导演系统，电影级质量", useCases: ["短视频创作", "广告制作", "创意视频", "动画"], officialUrl: "https://kling.kuaishou.com", tags: ["国产", "视频生成", "最新"] },
  { id: "jimeng-video", name: "即梦AI视频", category: "AI视频", isDomestic: true, pricing: "free", description: "字节跳动视频生成，中文理解最强，口型匹配优秀，集成Seedance 2.0", useCases: ["知识分享", "生活记录", "口播视频", "短视频"], officialUrl: "https://jimeng.jianying.com", tags: ["国产", "免费", "中文", "最新"] },
  { id: "haiyi", name: "海艺AI", category: "AI视频", isDomestic: true, pricing: "free", description: "国产免费不限次AI视频生成，性价比最高", useCases: ["短视频", "社交媒体", "产品展示", "批量制作"], officialUrl: "https://www.haiyi.art", tags: ["国产", "免费", "不限次"] },
  { id: "vidu", name: "Vidu", category: "AI视频", isDomestic: true, pricing: "freemium", description: "生数科技出品，高质量AI视频生成，支持4K输出", useCases: ["高质量视频", "广告素材", "创意内容", "产品展示"], officialUrl: "https://www.vidu.com", tags: ["国产", "高质量"] },
  { id: "heygen", name: "HeyGen", category: "AI数字人", isDomestic: false, pricing: "freemium", description: "AI数字人视频生成平台，支持多语言口播和形象克隆", useCases: ["培训视频", "产品介绍", "多语言营销", "虚拟主播"], officialUrl: "https://www.heygen.com", tags: ["数字人", "多语言"] },
  { id: "synthesia", name: "Synthesia", category: "AI数字人", isDomestic: false, pricing: "paid", description: "企业级AI数字人平台，支持160+语言，适合培训和营销", useCases: ["企业培训", "产品演示", "多语言视频", "内部沟通"], officialUrl: "https://www.synthesia.io", tags: ["企业", "数字人", "多语言"] },
  { id: "silicon-flow", name: "硅基流动", category: "AI数字人", isDomestic: true, pricing: "freemium", description: "国产AI数字人平台，支持形象克隆和实时驱动", useCases: ["直播带货", "客服数字人", "培训讲师", "企业宣传"], officialUrl: "https://www.guiji.ai", tags: ["国产", "数字人", "直播"] },

  // === 音频/语音/音乐 ===
  { id: "suno", name: "Suno v5", category: "AI音乐", isDomestic: false, pricing: "freemium", description: "AI音乐生成第一平台，30秒生成完整歌曲（歌词+人声+编曲）", useCases: ["音乐创作", "背景音乐", "广告配乐", "个人创作"], officialUrl: "https://suno.com", tags: ["音乐生成", "最新"] },
  { id: "udio", name: "Udio", category: "AI音乐", isDomestic: false, pricing: "freemium", description: "高质量AI音乐生成，人声效果业界最佳，支持remix和结构控制", useCases: ["音乐制作", "人声歌曲", "风格探索", "编曲"], officialUrl: "https://www.udio.com", tags: ["音乐生成", "人声"] },
  { id: "elevenlabs", name: "ElevenLabs", category: "AI语音", isDomestic: false, pricing: "freemium", description: "顶级AI语音合成，支持声音克隆、多语言、情感控制", useCases: ["有声书", "配音", "播客", "多语言内容"], officialUrl: "https://elevenlabs.io", tags: ["语音合成", "声音克隆"] },
  { id: "fish-audio", name: "Fish Audio", category: "AI语音", isDomestic: true, pricing: "freemium", description: "国产AI语音合成平台，支持中文语音克隆，效果自然", useCases: ["有声内容", "配音", "语音助手", "播客"], officialUrl: "https://fish.audio", tags: ["国产", "语音合成"] },
  { id: "xunfei", name: "讯飞语音", category: "AI语音", isDomestic: true, pricing: "freemium", description: "科大讯飞语音技术，语音识别/合成/翻译全栈能力", useCases: ["语音识别", "语音合成", "会议转录", "同声传译"], officialUrl: "https://www.xfyun.cn", tags: ["国产", "语音识别", "企业"] },
  { id: "tongyi-tingwu", name: "通义听悟", category: "AI语音", isDomestic: true, pricing: "free", description: "阿里出品免费会议转录工具，支持多人对话和要点提取", useCases: ["会议纪要", "访谈转录", "课程笔记", "音视频总结"], officialUrl: "https://tingwu.aliyun.com", tags: ["国产", "免费", "转录"] },

  // === 文档/写作 ===
  { id: "notion-ai", name: "Notion AI", category: "AI写作", isDomestic: false, pricing: "paid", description: "Notion内置AI助手，支持文档写作、总结、翻译", useCases: ["文档写作", "会议纪要", "项目管理", "知识库"], officialUrl: "https://notion.so", tags: ["文档", "协作"] },
  { id: "feishu-ai", name: "飞书智能伙伴", category: "AI写作", isDomestic: true, pricing: "freemium", description: "飞书内置AI，支持文档写作、表格分析、会议纪要", useCases: ["企业文档", "会议纪要", "数据分析", "协作"], officialUrl: "https://www.feishu.cn", tags: ["国产", "企业", "协作"] },
  { id: "wps-ai", name: "WPS AI", category: "AI写作", isDomestic: true, pricing: "freemium", description: "WPS内置AI助手，支持文档、表格、PPT智能生成", useCases: ["公文写作", "报告生成", "PPT制作", "数据分析"], officialUrl: "https://ai.wps.cn", tags: ["国产", "办公", "免费"] },

  // === 数据分析/BI ===
  { id: "tableau", name: "Tableau", category: "数据分析", isDomestic: false, pricing: "paid", description: "企业级数据可视化和分析平台，AI辅助洞察", useCases: ["数据可视化", "商业智能", "报表", "数据探索"], officialUrl: "https://www.tableau.com", tags: ["BI", "可视化"] },
  { id: "fanruan", name: "帆软BI", category: "数据分析", isDomestic: true, pricing: "freemium", description: "国产领先BI工具，支持报表、仪表盘、数据分析", useCases: ["企业报表", "数据仪表盘", "自助分析", "数据填报"], officialUrl: "https://www.fanruan.com", tags: ["国产", "企业BI"] },

  // === 营销/社媒 ===
  { id: "hubspot", name: "HubSpot", category: "营销自动化", isDomestic: false, pricing: "freemium", description: "一体化营销、销售、客服平台，AI辅助内容和分析", useCases: ["邮件营销", "社媒管理", "CRM", "内容营销"], officialUrl: "https://www.hubspot.com", tags: ["CRM", "营销"] },
  { id: "zhiqu", name: "致趣百川", category: "营销自动化", isDomestic: true, pricing: "paid", description: "国产B2B营销自动化平台，支持获客、培育、转化全链路", useCases: ["B2B获客", "线索培育", "活动管理", "内容营销"], officialUrl: "https://www.zhiqu.com", tags: ["国产", "B2B", "营销"] },

  // === 项目管理 ===
  { id: "linear", name: "Linear", category: "项目管理", isDomestic: false, pricing: "freemium", description: "现代化项目管理工具，AI辅助任务分配和优先级", useCases: ["任务管理", "Sprint规划", "Bug追踪", "团队协作"], officialUrl: "https://linear.app", tags: ["敏捷", "开发团队"] },
  { id: "feishu-project", name: "飞书项目", category: "项目管理", isDomestic: true, pricing: "freemium", description: "飞书旗下项目管理工具，支持多种视图和自动化", useCases: ["项目管理", "需求管理", "缺陷追踪", "团队协作"], officialUrl: "https://project.feishu.cn", tags: ["国产", "企业", "协作"] },

  // === HR/人力资源 ===
  { id: "beisen", name: "北森", category: "HR科技", isDomestic: true, pricing: "paid", description: "一体化HR SaaS平台，覆盖招聘、人才管理、组织发展", useCases: ["招聘管理", "绩效管理", "人才盘点", "组织诊断"], officialUrl: "https://www.beisen.com", tags: ["国产", "HR", "一体化"] },
  { id: "moka", name: "Moka", category: "HR科技", isDomestic: true, pricing: "paid", description: "智能招聘管理系统，AI辅助简历筛选和人才推荐", useCases: ["招聘管理", "简历筛选", "面试安排", "人才库"], officialUrl: "https://www.mokahr.com", tags: ["国产", "招聘", "AI筛选"] },

  // === 客服/沟通 ===
  { id: "zhipu-ai", name: "智谱清言", category: "AI客服", isDomestic: true, pricing: "freemium", description: "智谱AI对话平台，支持企业知识库问答和客服场景", useCases: ["智能客服", "知识库问答", "文档分析", "内容生成"], officialUrl: "https://chatglm.cn", tags: ["国产", "企业", "知识库"] },

  // === 搜索/研究 ===
  { id: "perplexity", name: "Perplexity", category: "AI搜索", isDomestic: false, pricing: "freemium", description: "AI搜索引擎，实时联网搜索并给出带引用的答案", useCases: ["信息检索", "研究调研", "事实核查", "竞品分析"], officialUrl: "https://perplexity.ai", tags: ["搜索", "引用"] },
  { id: "tiangong", name: "天工AI搜索", category: "AI搜索", isDomestic: true, pricing: "free", description: "昆仑万维出品，免费AI搜索引擎，支持中文搜索", useCases: ["信息搜索", "知识问答", "新闻追踪", "学术检索"], officialUrl: "https://www.tiangong.cn", tags: ["国产", "免费", "搜索"] },

  // === PPT/演示 ===
  { id: "gamma", name: "Gamma", category: "AI演示", isDomestic: false, pricing: "freemium", description: "AI驱动的演示文稿生成工具，一键生成专业PPT", useCases: ["PPT制作", "提案演示", "报告展示", "培训材料"], officialUrl: "https://gamma.app", tags: ["PPT", "自动生成"] },
  { id: "aippt", name: "AiPPT", category: "AI演示", isDomestic: true, pricing: "freemium", description: "国产AI PPT生成工具，支持一键生成和模板定制", useCases: ["PPT制作", "汇报材料", "培训课件", "方案展示"], officialUrl: "https://www.aippt.cn", tags: ["国产", "PPT", "模板"] },

  // === 翻译 ===
  { id: "deepl", name: "DeepL", category: "AI翻译", isDomestic: false, pricing: "freemium", description: "高质量AI翻译工具，支持文档翻译和术语定制", useCases: ["文档翻译", "网页翻译", "专业术语", "多语言"], officialUrl: "https://www.deepl.com", tags: ["翻译", "高质量"] },
  { id: "volcengine-translate", name: "火山翻译", category: "AI翻译", isDomestic: true, pricing: "freemium", description: "字节跳动旗下翻译服务，支持文档和实时翻译", useCases: ["文档翻译", "实时翻译", "字幕翻译", "网站本地化"], officialUrl: "https://translate.volcengine.com", tags: ["国产", "实时"] },
  { id: "lovart", name: "Lovart", category: "AI设计", isDomestic: false, pricing: "freemium", description: "全球首个AI设计Agent，自动化完成品牌设计全流程，统一色彩、布局和风格", useCases: ["品牌设计", "海报生成", "Logo设计", "营销物料"], officialUrl: "https://www.lovart.ai", tags: ["Agent", "品牌", "最新"] },
  { id: "seedance", name: "Seedance 2.0", category: "AI视频", isDomestic: true, pricing: "freemium", description: "字节跳动旗舰视频生成模型，支持图/文/音频多模态输入，电影级运动合成", useCases: ["电影短片", "广告制作", "创意视频", "动画生成"], officialUrl: "https://seed.bytedance.com", tags: ["国产", "电影级", "最新"] },
  { id: "happyhorse", name: "HappyHorse", category: "AI视频", isDomestic: false, pricing: "freemium", description: "一体化AI视频平台，原生1080p输出，音视频联合生成，多镜头叙事", useCases: ["视频创作", "广告素材", "社交媒体", "产品展示"], officialUrl: "https://www.happyhorse.com", tags: ["一体化", "1080p", "最新"] },
];

/**
 * 根据类别获取工具
 */
export function getToolsByCategory(category: string): AITool[] {
  return AI_TOOLS_DATABASE.filter(t => t.category === category);
}

/**
 * 获取所有类别
 */
export function getAllCategories(): string[] {
  return Array.from(new Set(AI_TOOLS_DATABASE.map(t => t.category)));
}

/**
 * 根据场景匹配工具（国产优先）
 */
export function matchToolsForUseCase(useCase: string, limit = 6): { domestic: AITool[]; international: AITool[] } {
  const matched = AI_TOOLS_DATABASE.filter(t =>
    t.useCases.some(uc => uc.includes(useCase)) || t.tags.some(tag => tag.includes(useCase))
  );
  const domestic = matched.filter(t => t.isDomestic).sort((a, b) => {
    // 免费优先
    const pricingOrder = { free: 0, freemium: 1, paid: 2 };
    return pricingOrder[a.pricing] - pricingOrder[b.pricing];
  }).slice(0, limit);
  const international = matched.filter(t => !t.isDomestic).slice(0, limit);
  return { domestic, international };
}

/**
 * 获取国产免费工具（推荐首选）
 */
export function getDomesticFreeTools(): AITool[] {
  return AI_TOOLS_DATABASE.filter(t => t.isDomestic && (t.pricing === "free" || t.pricing === "freemium"))
    .sort((a, b) => {
      if (a.pricing === "free" && b.pricing !== "free") return -1;
      if (a.pricing !== "free" && b.pricing === "free") return 1;
      return 0;
    });
}

/**
 * 验证工具名是否在数据库中
 */
export function isValidToolName(name: string): boolean {
  return AI_TOOLS_DATABASE.some(t =>
    t.name.toLowerCase() === name.toLowerCase() ||
    t.id === name.toLowerCase()
  );
}

/**
 * 根据名称查找工具
 */
export function findToolByName(name: string): AITool | undefined {
  return AI_TOOLS_DATABASE.find(t =>
    t.name.toLowerCase() === name.toLowerCase() ||
    t.id === name.toLowerCase()
  );
}
