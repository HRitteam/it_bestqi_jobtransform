/**
 * Seed script: Import AI tools from toolsDatabase.ts into the ai_tools table
 * Run with: node server/seed-tools.mjs
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const AI_TOOLS_DATABASE = [
  { toolId: "chatgpt", name: "ChatGPT", category: "大模型对话", isDomestic: false, pricing: "freemium", description: "OpenAI旗舰对话模型，支持文本、图像、代码等多模态任务", useCases: ["文案撰写", "数据分析", "代码生成", "翻译"], officialUrl: "https://chat.openai.com", tags: ["通用", "多模态"] },
  { toolId: "claude", name: "Claude", category: "大模型对话", isDomestic: false, pricing: "freemium", description: "Anthropic出品，擅长长文本理解、逻辑推理和代码", useCases: ["长文档分析", "逻辑推理", "代码审查", "学术写作"], officialUrl: "https://claude.ai", tags: ["长文本", "推理"] },
  { toolId: "deepseek", name: "DeepSeek", category: "大模型对话", isDomestic: true, pricing: "free", description: "深度求索出品，开源免费，推理能力强，支持128K上下文", useCases: ["代码生成", "数学推理", "文本分析", "知识问答"], officialUrl: "https://chat.deepseek.com", tags: ["开源", "免费", "推理"] },
  { toolId: "doubao", name: "豆包", category: "大模型对话", isDomestic: true, pricing: "free", description: "字节跳动出品，免费使用，支持多轮对话和文件分析", useCases: ["日常问答", "文案创作", "翻译", "摘要"], officialUrl: "https://www.doubao.com", tags: ["免费", "多功能"] },
  { toolId: "kimi", name: "Kimi", category: "大模型对话", isDomestic: true, pricing: "free", description: "月之暗面出品，支持200万字超长上下文，擅长文档分析", useCases: ["长文档阅读", "论文分析", "会议纪要", "报告撰写"], officialUrl: "https://kimi.moonshot.cn", tags: ["超长上下文", "免费"] },
  { toolId: "wenxin", name: "文心一言", category: "大模型对话", isDomestic: true, pricing: "free", description: "百度出品，中文理解能力强，支持多模态", useCases: ["中文写作", "知识问答", "创意生成", "数据分析"], officialUrl: "https://yiyan.baidu.com", tags: ["中文优化", "免费"] },
  { toolId: "tongyi", name: "通义千问", category: "大模型对话", isDomestic: true, pricing: "free", description: "阿里出品，支持文本、图像、音频等多模态理解", useCases: ["文档处理", "代码生成", "图像理解", "数据分析"], officialUrl: "https://tongyi.aliyun.com", tags: ["多模态", "免费"] },
  { toolId: "coze", name: "扣子(Coze)", category: "AI Agent平台", isDomestic: true, pricing: "free", description: "字节跳动AI Agent开发平台，零代码搭建智能体，支持插件和工作流", useCases: ["自动化工作流", "客服机器人", "数据采集", "内容生成"], officialUrl: "https://www.coze.cn", tags: ["零代码", "免费", "Agent"] },
  { toolId: "dify", name: "Dify", category: "AI Agent平台", isDomestic: true, pricing: "freemium", description: "开源LLM应用开发平台，支持RAG、Agent、工作流编排", useCases: ["知识库问答", "工作流自动化", "AI应用开发"], officialUrl: "https://dify.ai", tags: ["开源", "RAG", "工作流"] },
  { toolId: "manus", name: "Manus", category: "AI Agent平台", isDomestic: false, pricing: "freemium", description: "通用AI Agent，可自主完成复杂任务，支持联网搜索和代码执行", useCases: ["深度研究", "数据分析", "自动化任务", "内容创作"], officialUrl: "https://manus.im", tags: ["通用Agent", "自主执行"] },
  { toolId: "n8n", name: "n8n", category: "自动化工作流", isDomestic: false, pricing: "freemium", description: "开源工作流自动化工具，支持400+应用集成", useCases: ["跨系统数据同步", "自动化报告", "消息通知", "数据处理"], officialUrl: "https://n8n.io", tags: ["开源", "集成", "自动化"] },
  { toolId: "cursor", name: "Cursor", category: "AI编程", isDomestic: false, pricing: "freemium", description: "AI-first代码编辑器，支持代码补全、重构、对话式编程", useCases: ["代码编写", "代码重构", "Bug修复", "代码解释"], officialUrl: "https://cursor.com", tags: ["IDE", "代码补全"] },
  { toolId: "github-copilot", name: "GitHub Copilot", category: "AI编程", isDomestic: false, pricing: "paid", description: "GitHub AI编程助手，深度集成VS Code，支持多语言代码补全", useCases: ["代码补全", "测试生成", "文档生成", "代码审查"], officialUrl: "https://github.com/features/copilot", tags: ["代码补全", "VS Code"] },
  { toolId: "tongyi-lingma", name: "通义灵码", category: "AI编程", isDomestic: true, pricing: "free", description: "阿里出品免费AI编程助手，支持VS Code和JetBrains", useCases: ["代码补全", "代码生成", "单元测试", "代码解释"], officialUrl: "https://tongyi.aliyun.com/lingma", tags: ["免费", "国产", "IDE插件"] },
  { toolId: "marscode", name: "MarsCode", category: "AI编程", isDomestic: true, pricing: "free", description: "字节跳动免费AI编程助手，支持代码补全和Cloud IDE", useCases: ["代码补全", "代码生成", "在线开发", "代码解释"], officialUrl: "https://www.marscode.cn", tags: ["免费", "Cloud IDE"] },
  { toolId: "midjourney", name: "Midjourney", category: "AI图像生成", isDomestic: false, pricing: "paid", description: "顶级AI图像生成工具，艺术质量极高", useCases: ["概念设计", "营销素材", "品牌视觉", "插画"], officialUrl: "https://midjourney.com", tags: ["艺术", "高质量"] },
  { toolId: "stable-diffusion", name: "Stable Diffusion", category: "AI图像生成", isDomestic: false, pricing: "free", description: "开源图像生成模型，可本地部署，社区生态丰富", useCases: ["图像生成", "图像编辑", "风格转换", "批量生产"], officialUrl: "https://stability.ai", tags: ["开源", "本地部署"] },
  { toolId: "jimeng", name: "即梦AI", category: "AI图像生成", isDomestic: true, pricing: "free", description: "字节跳动AI图像/视频生成平台，支持文生图、图生图", useCases: ["营销海报", "社交媒体配图", "产品展示", "创意设计"], officialUrl: "https://jimeng.jianying.com", tags: ["免费", "视频生成"] },
  { toolId: "canva", name: "Canva AI", category: "AI设计", isDomestic: false, pricing: "freemium", description: "在线设计平台，AI辅助生成设计、文案、图片", useCases: ["海报设计", "PPT制作", "社交媒体图", "品牌物料"], officialUrl: "https://www.canva.com", tags: ["设计", "模板"] },
  { toolId: "gaoding", name: "稿定设计AI", category: "AI设计", isDomestic: true, pricing: "freemium", description: "国产在线设计工具，AI智能抠图、海报生成、批量设计", useCases: ["电商海报", "社交媒体图", "批量设计", "智能抠图"], officialUrl: "https://www.gaoding.com", tags: ["国产", "电商", "批量"] },
  { toolId: "runway", name: "Runway", category: "AI视频", isDomestic: false, pricing: "freemium", description: "AI视频生成和编辑平台，支持文生视频、图生视频", useCases: ["短视频制作", "广告素材", "特效制作", "视频编辑"], officialUrl: "https://runwayml.com", tags: ["视频生成", "特效"] },
  { toolId: "kling", name: "可灵AI", category: "AI视频", isDomestic: true, pricing: "freemium", description: "快手出品AI视频生成工具，支持文生视频和图生视频", useCases: ["短视频创作", "广告制作", "创意视频", "动画"], officialUrl: "https://kling.kuaishou.com", tags: ["国产", "视频生成"] },
  { toolId: "hailuo", name: "海螺AI视频", category: "AI视频", isDomestic: true, pricing: "free", description: "MiniMax出品，免费AI视频生成，效果自然流畅", useCases: ["短视频", "社交媒体", "产品展示", "创意内容"], officialUrl: "https://hailuoai.video", tags: ["免费", "视频生成"] },
  { toolId: "heygen", name: "HeyGen", category: "AI数字人", isDomestic: false, pricing: "freemium", description: "AI数字人视频生成平台，支持多语言口播", useCases: ["培训视频", "产品介绍", "多语言营销", "虚拟主播"], officialUrl: "https://www.heygen.com", tags: ["数字人", "多语言"] },
  { toolId: "silicon-flow", name: "硅基流动", category: "AI数字人", isDomestic: true, pricing: "freemium", description: "国产AI数字人平台，支持形象克隆和实时驱动", useCases: ["直播带货", "客服数字人", "培训讲师", "企业宣传"], officialUrl: "https://www.guiji.ai", tags: ["国产", "数字人", "直播"] },
  { toolId: "elevenlabs", name: "ElevenLabs", category: "AI语音", isDomestic: false, pricing: "freemium", description: "顶级AI语音合成，支持声音克隆和多语言", useCases: ["有声书", "配音", "播客", "多语言内容"], officialUrl: "https://elevenlabs.io", tags: ["语音合成", "声音克隆"] },
  { toolId: "fish-audio", name: "Fish Audio", category: "AI语音", isDomestic: true, pricing: "freemium", description: "国产AI语音合成平台，支持中文语音克隆", useCases: ["有声内容", "配音", "语音助手", "播客"], officialUrl: "https://fish.audio", tags: ["国产", "语音合成"] },
  { toolId: "notion-ai", name: "Notion AI", category: "AI写作", isDomestic: false, pricing: "paid", description: "Notion内置AI助手，支持文档写作、总结、翻译", useCases: ["文档写作", "会议纪要", "项目管理", "知识库"], officialUrl: "https://notion.so", tags: ["文档", "协作"] },
  { toolId: "feishu-ai", name: "飞书智能伙伴", category: "AI写作", isDomestic: true, pricing: "freemium", description: "飞书内置AI，支持文档写作、表格分析、会议纪要", useCases: ["企业文档", "会议纪要", "数据分析", "协作"], officialUrl: "https://www.feishu.cn", tags: ["国产", "企业", "协作"] },
  { toolId: "wps-ai", name: "WPS AI", category: "AI写作", isDomestic: true, pricing: "freemium", description: "WPS内置AI助手，支持文档、表格、PPT智能生成", useCases: ["公文写作", "报告生成", "PPT制作", "数据分析"], officialUrl: "https://ai.wps.cn", tags: ["国产", "办公", "免费"] },
  { toolId: "tableau", name: "Tableau", category: "数据分析", isDomestic: false, pricing: "paid", description: "企业级数据可视化和分析平台，AI辅助洞察", useCases: ["数据可视化", "商业智能", "报表", "数据探索"], officialUrl: "https://www.tableau.com", tags: ["BI", "可视化"] },
  { toolId: "fanruan", name: "帆软BI", category: "数据分析", isDomestic: true, pricing: "freemium", description: "国产领先BI工具，支持报表、仪表盘、数据分析", useCases: ["企业报表", "数据仪表盘", "自助分析", "数据填报"], officialUrl: "https://www.fanruan.com", tags: ["国产", "企业BI"] },
  { toolId: "hubspot", name: "HubSpot", category: "营销自动化", isDomestic: false, pricing: "freemium", description: "一体化营销、销售、客服平台，AI辅助内容和分析", useCases: ["邮件营销", "社媒管理", "CRM", "内容营销"], officialUrl: "https://www.hubspot.com", tags: ["CRM", "营销"] },
  { toolId: "zhiqu", name: "致趣百川", category: "营销自动化", isDomestic: true, pricing: "paid", description: "国产B2B营销自动化平台，支持获客、培育、转化全链路", useCases: ["B2B获客", "线索培育", "活动管理", "内容营销"], officialUrl: "https://www.zhiqu.com", tags: ["国产", "B2B", "营销"] },
  { toolId: "linear", name: "Linear", category: "项目管理", isDomestic: false, pricing: "freemium", description: "现代化项目管理工具，AI辅助任务分配和优先级", useCases: ["任务管理", "Sprint规划", "Bug追踪", "团队协作"], officialUrl: "https://linear.app", tags: ["敏捷", "开发团队"] },
  { toolId: "feishu-project", name: "飞书项目", category: "项目管理", isDomestic: true, pricing: "freemium", description: "飞书旗下项目管理工具，支持多种视图和自动化", useCases: ["项目管理", "需求管理", "缺陷追踪", "团队协作"], officialUrl: "https://project.feishu.cn", tags: ["国产", "企业", "协作"] },
  { toolId: "beisen", name: "北森", category: "HR科技", isDomestic: true, pricing: "paid", description: "一体化HR SaaS平台，覆盖招聘、人才管理、组织发展", useCases: ["招聘管理", "绩效管理", "人才盘点", "组织诊断"], officialUrl: "https://www.beisen.com", tags: ["国产", "HR", "一体化"] },
  { toolId: "moka", name: "Moka", category: "HR科技", isDomestic: true, pricing: "paid", description: "智能招聘管理系统，AI辅助简历筛选和人才推荐", useCases: ["招聘管理", "简历筛选", "面试安排", "人才库"], officialUrl: "https://www.mokahr.com", tags: ["国产", "招聘", "AI筛选"] },
  { toolId: "zhipu-ai", name: "智谱清言", category: "AI客服", isDomestic: true, pricing: "freemium", description: "智谱AI对话平台，支持企业知识库问答和客服场景", useCases: ["智能客服", "知识库问答", "文档分析", "内容生成"], officialUrl: "https://chatglm.cn", tags: ["国产", "企业", "知识库"] },
  { toolId: "perplexity", name: "Perplexity", category: "AI搜索", isDomestic: false, pricing: "freemium", description: "AI搜索引擎，实时联网搜索并给出带引用的答案", useCases: ["信息检索", "研究调研", "事实核查", "竞品分析"], officialUrl: "https://perplexity.ai", tags: ["搜索", "引用"] },
  { toolId: "tiangong", name: "天工AI搜索", category: "AI搜索", isDomestic: true, pricing: "free", description: "昆仑万维出品，免费AI搜索引擎，支持中文搜索", useCases: ["信息搜索", "知识问答", "新闻追踪", "学术检索"], officialUrl: "https://www.tiangong.cn", tags: ["国产", "免费", "搜索"] },
  { toolId: "gamma", name: "Gamma", category: "AI演示", isDomestic: false, pricing: "freemium", description: "AI驱动的演示文稿生成工具，一键生成专业PPT", useCases: ["PPT制作", "提案演示", "报告展示", "培训材料"], officialUrl: "https://gamma.app", tags: ["PPT", "自动生成"] },
  { toolId: "aippt", name: "AiPPT", category: "AI演示", isDomestic: true, pricing: "freemium", description: "国产AI PPT生成工具，支持一键生成和模板定制", useCases: ["PPT制作", "汇报材料", "培训课件", "方案展示"], officialUrl: "https://www.aippt.cn", tags: ["国产", "PPT", "模板"] },
  { toolId: "deepl", name: "DeepL", category: "AI翻译", isDomestic: false, pricing: "freemium", description: "高质量AI翻译工具，支持文档翻译和术语定制", useCases: ["文档翻译", "网页翻译", "专业术语", "多语言"], officialUrl: "https://www.deepl.com", tags: ["翻译", "高质量"] },
  { toolId: "volcengine-translate", name: "火山翻译", category: "AI翻译", isDomestic: true, pricing: "freemium", description: "字节跳动旗下翻译服务，支持文档和实时翻译", useCases: ["文档翻译", "实时翻译", "字幕翻译", "网站本地化"], officialUrl: "https://translate.volcengine.com", tags: ["国产", "实时"] },
];

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log(`Seeding ${AI_TOOLS_DATABASE.length} AI tools...`);

  for (const tool of AI_TOOLS_DATABASE) {
    await connection.execute(
      `INSERT INTO ai_tools (toolId, name, category, isDomestic, pricing, description, useCases, officialUrl, tags, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category), isDomestic=VALUES(isDomestic),
       pricing=VALUES(pricing), description=VALUES(description), useCases=VALUES(useCases),
       officialUrl=VALUES(officialUrl), tags=VALUES(tags)`,
      [
        tool.toolId,
        tool.name,
        tool.category,
        tool.isDomestic ? 1 : 0,
        tool.pricing,
        tool.description,
        JSON.stringify(tool.useCases),
        tool.officialUrl,
        JSON.stringify(tool.tags),
      ]
    );
  }

  console.log("✅ Seed complete!");
  await connection.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
