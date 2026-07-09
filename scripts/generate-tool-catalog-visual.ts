import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TOOL_CATALOG, type JobFamily, type ToolPair } from "../server/toolCatalog";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "docs");
const outputPath = path.join(outputDir, "tool-catalog-visual.html");

const CATEGORY_LABELS: Record<string, string> = {
  llm: "通用大模型",
  office: "办公协作",
  coding: "编程开发",
  image: "图像生成",
  video: "视频生成",
  audio: "音频语音",
  design: "设计工具",
  marketing: "营销推广",
  sales: "销售 CRM",
  service: "客户服务",
  hr: "人力资源",
  data: "数据分析",
  legal: "法务合规",
  finance: "财务管理",
  supply_chain: "供应链/运营",
  pm: "产品/项目管理",
  meeting: "会议纪要",
  agent: "智能体/工作流",
  knowledge: "知识库/RAG",
  writing: "写作辅助",
  research: "研究检索",
};

type VisualTool = ToolPair & {
  id: number;
  categoryLabel: string;
};

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function countBy<T extends string>(items: T[]): Record<T, number> {
  return items.reduce(
    (acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    },
    {} as Record<T, number>,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

const tools: VisualTool[] = TOOL_CATALOG.map((tool, index) => ({
  ...tool,
  id: index + 1,
  categoryLabel: CATEGORY_LABELS[tool.category] || tool.category,
}));

const categories = unique(tools.map((tool) => tool.category));
const families = unique(tools.flatMap((tool) => tool.applicableTo));
const categoryCounts = countBy(tools.map((tool) => tool.category));
const familyCounts = countBy(tools.flatMap((tool) => tool.applicableTo));
const generatedAt = new Date().toLocaleString("zh-CN", { hour12: false });

const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AI 工具推荐目录可视化</title>
  <style>
    :root {
      --bg: #f6f1e8;
      --paper: #fffaf1;
      --ink: #1f2623;
      --muted: #68736d;
      --line: rgba(31, 38, 35, 0.12);
      --brand: #176b5b;
      --brand-2: #d46b31;
      --soft: rgba(23, 107, 91, 0.1);
      --shadow: 0 24px 80px rgba(56, 43, 29, 0.12);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      font-family: "Noto Serif SC", "Source Han Serif SC", "Microsoft YaHei", serif;
      background:
        radial-gradient(circle at top left, rgba(212, 107, 49, 0.18), transparent 30rem),
        radial-gradient(circle at 82% 8%, rgba(23, 107, 91, 0.16), transparent 26rem),
        linear-gradient(135deg, #fbf4e6 0%, var(--bg) 48%, #edf2e6 100%);
    }

    header {
      padding: 56px clamp(20px, 5vw, 72px) 28px;
      position: relative;
      overflow: hidden;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      border: 1px solid var(--line);
      border-radius: 999px;
      background: rgba(255, 250, 241, 0.72);
      color: var(--brand);
      font-size: 13px;
      letter-spacing: 0.08em;
    }

    h1 {
      margin: 20px 0 12px;
      max-width: 980px;
      font-size: clamp(34px, 6vw, 76px);
      line-height: 0.98;
      letter-spacing: -0.06em;
    }

    .subtitle {
      max-width: 760px;
      margin: 0;
      color: var(--muted);
      font-size: 17px;
      line-height: 1.8;
    }

    main {
      padding: 0 clamp(20px, 5vw, 72px) 64px;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin: 26px 0;
    }

    .stat {
      padding: 20px;
      border: 1px solid var(--line);
      border-radius: 24px;
      background: rgba(255, 250, 241, 0.72);
      box-shadow: 0 12px 34px rgba(56, 43, 29, 0.06);
      backdrop-filter: blur(18px);
    }

    .stat strong {
      display: block;
      font-size: 34px;
      line-height: 1;
      color: var(--brand);
    }

    .stat span {
      display: block;
      margin-top: 8px;
      color: var(--muted);
      font-size: 13px;
    }

    .panel {
      border: 1px solid var(--line);
      border-radius: 30px;
      background: rgba(255, 250, 241, 0.82);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .toolbar {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr;
      gap: 12px;
      padding: 18px;
      border-bottom: 1px solid var(--line);
      background: rgba(255, 250, 241, 0.72);
      position: sticky;
      top: 0;
      z-index: 10;
      backdrop-filter: blur(16px);
    }

    input,
    select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 13px 14px;
      color: var(--ink);
      background: #fffdf7;
      font: inherit;
      outline: none;
    }

    input:focus,
    select:focus {
      border-color: rgba(23, 107, 91, 0.5);
      box-shadow: 0 0 0 4px var(--soft);
    }

    .content {
      display: grid;
      grid-template-columns: 310px minmax(0, 1fr);
      min-height: 680px;
    }

    aside {
      border-right: 1px solid var(--line);
      padding: 18px;
      background: rgba(246, 241, 232, 0.55);
    }

    .side-title {
      margin: 2px 0 12px;
      color: var(--muted);
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }

    .chip {
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 7px 10px;
      background: #fffdf7;
      color: var(--muted);
      font-size: 12px;
    }

    .chip strong {
      color: var(--brand);
      font-weight: 700;
    }

    .cards {
      padding: 18px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
      align-content: start;
    }

    .card {
      border: 1px solid var(--line);
      border-radius: 24px;
      background: #fffdf7;
      padding: 18px;
      min-height: 250px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
    }

    .card:hover {
      transform: translateY(-3px);
      border-color: rgba(23, 107, 91, 0.34);
      box-shadow: 0 18px 44px rgba(56, 43, 29, 0.1);
    }

    .card-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: flex-start;
    }

    .pair {
      margin: 0;
      font-size: 20px;
      line-height: 1.35;
      letter-spacing: -0.02em;
    }

    .pair span {
      color: var(--brand-2);
    }

    .badge {
      flex: 0 0 auto;
      border-radius: 999px;
      padding: 6px 9px;
      color: var(--brand);
      background: var(--soft);
      font-size: 12px;
      white-space: nowrap;
    }

    .advantage {
      margin: 0;
      color: var(--muted);
      line-height: 1.75;
      font-size: 14px;
    }

    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: auto;
    }

    .tag {
      border-radius: 999px;
      padding: 6px 9px;
      background: rgba(31, 38, 35, 0.06);
      color: #41504a;
      font-size: 12px;
    }

    .tasks {
      margin: 0;
      padding-left: 18px;
      color: #4b5752;
      font-size: 13px;
      line-height: 1.7;
    }

    .empty {
      grid-column: 1 / -1;
      padding: 80px 20px;
      text-align: center;
      color: var(--muted);
    }

    .footer-note {
      margin: 18px 2px 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.7;
    }

    @media (max-width: 980px) {
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .toolbar { grid-template-columns: 1fr; position: static; }
      .content { grid-template-columns: 1fr; }
      aside { border-right: 0; border-bottom: 1px solid var(--line); }
    }

    @media (max-width: 560px) {
      header { padding-top: 36px; }
      .stats { grid-template-columns: 1fr; }
      .cards { grid-template-columns: 1fr; padding: 12px; }
      .card { border-radius: 20px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">TOOL_CATALOG · ${escapeHtml(generatedAt)} 生成</div>
    <h1>AI 工具推荐目录可视化</h1>
    <p class="subtitle">数据来源：<code>server/toolCatalog.ts</code>。这个页面只负责展示当前静态白名单，不改变“开始分析”时的推荐逻辑。修改工具信息后，重新运行 <code>pnpm catalog:visual</code> 即可刷新。</p>
  </header>

  <main>
    <section class="stats">
      <div class="stat"><strong>${tools.length}</strong><span>工具对数量</span></div>
      <div class="stat"><strong>${categories.length}</strong><span>工具分类</span></div>
      <div class="stat"><strong>${families.length}</strong><span>适用岗位族</span></div>
      <div class="stat"><strong>${tools.reduce((sum, tool) => sum + tool.applicableTasks.length, 0)}</strong><span>适用任务标签</span></div>
    </section>

    <section class="panel">
      <div class="toolbar">
        <input id="search" type="search" placeholder="搜索工具名、国产替代、任务、优势..." />
        <select id="category">
          <option value="">全部工具分类</option>
          ${categories
            .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(CATEGORY_LABELS[category] || category)} (${categoryCounts[category]})</option>`)
            .join("")}
        </select>
        <select id="family">
          <option value="">全部岗位族</option>
          ${families
            .map((family) => `<option value="${escapeHtml(family)}">${escapeHtml(family)} (${familyCounts[family as JobFamily] || 0})</option>`)
            .join("")}
        </select>
      </div>

      <div class="content">
        <aside>
          <p class="side-title">分类概览</p>
          <div class="chip-list">
            ${categories
              .map((category) => `<span class="chip">${escapeHtml(CATEGORY_LABELS[category] || category)} <strong>${categoryCounts[category]}</strong></span>`)
              .join("")}
          </div>
          <p class="side-title">岗位族覆盖</p>
          <div class="chip-list">
            ${families
              .map((family) => `<span class="chip">${escapeHtml(family)} <strong>${familyCounts[family as JobFamily] || 0}</strong></span>`)
              .join("")}
          </div>
        </aside>
        <div id="cards" class="cards"></div>
      </div>
    </section>

    <p class="footer-note">提示：报告生成时，Step 4 和 Step 7 会先按岗位族过滤这个目录，再把过滤后的可选工具列表交给 LLM 生成推荐理由与匹配方案。</p>
  </main>

  <script>
    const tools = ${safeJson(tools)};
    const cards = document.getElementById("cards");
    const search = document.getElementById("search");
    const category = document.getElementById("category");
    const family = document.getElementById("family");

    function matches(tool) {
      const q = search.value.trim().toLowerCase();
      const categoryValue = category.value;
      const familyValue = family.value;
      const haystack = [
        tool.international,
        tool.domestic,
        tool.category,
        tool.categoryLabel,
        tool.coreAdvantage,
        ...(tool.applicableTo || []),
        ...(tool.applicableTasks || []),
      ].join(" ").toLowerCase();

      if (q && !haystack.includes(q)) return false;
      if (categoryValue && tool.category !== categoryValue) return false;
      if (familyValue && !tool.applicableTo.includes(familyValue)) return false;
      return true;
    }

    function render() {
      const filtered = tools.filter(matches);
      cards.innerHTML = "";

      if (filtered.length === 0) {
        cards.innerHTML = '<div class="empty">没有匹配到工具，换个关键词或筛选条件试试。</div>';
        return;
      }

      for (const tool of filtered) {
        const card = document.createElement("article");
        card.className = "card";
        card.innerHTML = \`
          <div class="card-head">
            <h2 class="pair">\${escapeHtml(tool.international)} <span>/</span> \${escapeHtml(tool.domestic)}</h2>
            <span class="badge">\${escapeHtml(tool.categoryLabel)}</span>
          </div>
          <p class="advantage">\${escapeHtml(tool.coreAdvantage)}</p>
          <ul class="tasks">\${tool.applicableTasks.map((task) => \`<li>\${escapeHtml(task)}</li>\`).join("")}</ul>
          <div class="tag-row">\${tool.applicableTo.map((tag) => \`<span class="tag">\${escapeHtml(tag)}</span>\`).join("")}</div>
        \`;
        cards.appendChild(card);
      }
    }

    function escapeHtml(value) {
      return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    search.addEventListener("input", render);
    category.addEventListener("change", render);
    family.addEventListener("change", render);
    render();
  </script>
</body>
</html>
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, html, "utf-8");

console.log(`Generated ${path.relative(projectRoot, outputPath)} from ${tools.length} tool pairs.`);
