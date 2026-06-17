import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";

/**
 * Export report as PDF with brand watermark
 */
export async function exportToPDF(
  element: HTMLElement,
  filename: string,
  options: { watermark?: boolean; title?: string } = {}
) {
  const { watermark = true, title = "岗位/职能AI转型分析报告" } = options;

  // Capture the element
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#0a0a12",
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF("p", "mm", "a4");
  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  // Additional pages
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  // Add watermark to each page
  if (watermark) {
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(40);
      pdf.setTextColor(150, 150, 150);
      pdf.setGState(pdf.GState({ opacity: 0.1 }));
      pdf.text("岗位/职能AI转型分析", 105, 148, {
        align: "center",
        angle: 45,
      });
    }
  }

  // Add title page metadata
  pdf.setProperties({
    title,
    subject: "岗位/职能AI转型深度分析报告",
    creator: "岗位/职能AI转型分析平台",
  });

  pdf.save(`${filename}.pdf`);
}

/**
 * Export report as Word document (simplified HTML-to-Word)
 */
export async function exportToWord(
  reportData: any,
  filename: string,
  options: { watermark?: boolean } = {}
) {
  const { watermark = true } = options;

  const htmlContent = generateWordHTML(reportData, watermark);
  const blob = new Blob(
    [`\ufeff${htmlContent}`],
    { type: "application/msword;charset=utf-8" }
  );
  saveAs(blob, `${filename}.doc`);
}

function generateWordHTML(data: any, watermark: boolean): string {
  const steps = data as any[];
  const overview = steps[0]?.data;
  const firstPrinciples = steps[1]?.data;
  const workflow = steps[2]?.data;
  const aiTools = steps[3]?.data;
  const newWorkflow = steps[4]?.data;
  const roi = steps[5]?.data;
  const restructuring = steps[6]?.data;
  const risksKpi = steps[7]?.data;
  const training = steps[8]?.data;

  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head><meta charset="utf-8"><title>岗位/职能AI转型分析报告</title>
<style>
body { font-family: "Microsoft YaHei", sans-serif; color: #333; line-height: 1.8; }
h1 { color: #1a1a2e; font-size: 24pt; border-bottom: 2px solid #4a6cf7; padding-bottom: 8px; }
h2 { color: #1a1a2e; font-size: 16pt; margin-top: 24px; }
h3 { color: #4a6cf7; font-size: 13pt; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10pt; }
th { background-color: #f5f5f5; font-weight: bold; }
.watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60pt; color: rgba(0,0,0,0.05); z-index: -1; }
</style></head>
<body>
${watermark ? '<div class="watermark">岗位/职能AI转型分析</div>' : ''}
<h1>岗位/职能AI转型分析报告</h1>
<p><strong>岗位：</strong>${overview?.jobTitle || ''} | <strong>公司：</strong>${overview?.company || ''} | <strong>行业：</strong>${overview?.industry || ''}</p>

<h2>一、岗位概览</h2>
<table><tr><th>字段</th><th>内容</th></tr>
<tr><td>岗位名称</td><td>${overview?.jobTitle || ''}</td></tr>
<tr><td>公司</td><td>${overview?.company || ''}</td></tr>
<tr><td>行业</td><td>${overview?.industry || ''}</td></tr>
<tr><td>层级</td><td>${overview?.level || ''}</td></tr>
<tr><td>团队规模</td><td>${overview?.teamSize || ''}</td></tr>
</table>
<h3>核心职责</h3>
<ul>${(overview?.coreResponsibilities || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>

<h2>二、第一性思维分析</h2>
${(firstPrinciples?.dimensions || []).map((d: any) => `
<h3>${d.name}（AI影响度：${d.aiImpactScore}/100）</h3>
<p>${d.analysis}</p>
<p><strong>本质：</strong>${d.essence}</p>
`).join('')}

<h2>三、当前工作流</h2>
<table><tr><th>任务</th><th>时间占比</th><th>重复性</th><th>AI可替代</th></tr>
${(workflow?.tasks || []).map((t: any) => `<tr><td>${t.name}</td><td>${t.timePercent}%</td><td>${t.repetitiveness}</td><td>${t.aiReplaceability}</td></tr>`).join('')}
</table>

<h2>四、AI工具匹配</h2>
<table><tr><th>任务</th><th>推荐工具</th><th>协作模式</th><th>效率提升</th></tr>
${(aiTools?.recommendations || []).map((r: any) => `<tr><td>${r.taskName}</td><td>${Array.isArray(r.aiTools) ? r.aiTools.map((t: any) => typeof t === 'string' ? t : `${t.internationalTool || ''}/${t.domesticAlternative || ''}`).join(', ') : ''}</td><td>${r.collaborationMode}</td><td>+${r.efficiencyGain}%</td></tr>`).join('')}
</table>

<h2>五、新工作流设计</h2>
<p>${newWorkflow?.summary || ''}</p>
<table><tr><th>任务</th><th>人工占比</th><th>AI占比</th><th>协作模式</th></tr>
${(newWorkflow?.newTasks || []).map((t: any) => `<tr><td>${t.name}</td><td>${t.humanRatio}%</td><td>${t.aiRatio}%</td><td>${t.collaborationMode}</td></tr>`).join('')}
</table>

<h2>六、ROI评估</h2>
<table><tr><th>方案</th><th>投资范围</th><th>年节约</th><th>回收期</th><th>ROI</th></tr>
${(roi?.roiPlans || []).map((p: any) => `<tr><td>${p.planName}</td><td>${p.investmentRange}</td><td>${p.annualSaving}</td><td>${p.paybackPeriod}</td><td>${p.roiPercent}%</td></tr>`).join('')}
</table>

<h2>七、岗位重组</h2>
<h3>任务分类</h3>
<table><tr><th>保留</th><th>增强</th><th>自动化</th><th>淘汰</th></tr>
<tr><td>${(restructuring?.taskClassification?.retain || []).join('<br>')}</td>
<td>${(restructuring?.taskClassification?.enhance || []).join('<br>')}</td>
<td>${(restructuring?.taskClassification?.automate || []).join('<br>')}</td>
<td>${(restructuring?.taskClassification?.eliminate || []).join('<br>')}</td></tr>
</table>

<h2>八、实施路线图</h2>
${(restructuring?.roadmap || []).map((p: any) => `
<h3>阶段${p.phase}：${p.name}（${p.duration}）</h3>
<ul>${(p.goals || []).map((g: string) => `<li>${g}</li>`).join('')}</ul>
`).join('')}

<h2>九、风险控制</h2>
<table><tr><th>类别</th><th>描述</th><th>概率</th><th>影响</th><th>缓解措施</th></tr>
${(risksKpi?.risks || []).map((r: any) => `<tr><td>${r.category}</td><td>${r.description}</td><td>${r.probability}</td><td>${r.impact}</td><td>${r.mitigation}</td></tr>`).join('')}
</table>

<h2>十、KPI体系</h2>
<table><tr><th>维度</th><th>指标</th><th>基线</th><th>目标</th></tr>
${(risksKpi?.kpis || []).map((k: any) => `<tr><td>${k.dimension}</td><td>${k.metric}</td><td>${k.baseline}</td><td>${k.target}</td></tr>`).join('')}
</table>

<h2>十一、转型能力培训方案</h2>
${training ? `
<p><strong>整体就绪度：</strong>${training.overallReadiness || 0}%</p>
${(function() { const dims = new Map(); (training.competencies || []).forEach((c: any) => { if (!dims.has(c.dimension)) dims.set(c.dimension, []); dims.get(c.dimension).push(c); }); return Array.from(dims.entries()).map(([dim, items]: [string, any[]]) => `
<h3>${dim}</h3>
<table><tr><th>能力项</th><th>转型前需求</th><th>转型后需求</th><th>需求增长</th><th>优先级</th></tr>
${items.map((item: any) => `<tr><td>${item.name}</td><td>${item.preTransformDemand}/5</td><td>${item.postTransformDemand}/5</td><td>+${item.demandGrowth}</td><td>${item.priority}</td></tr>`).join('')}
</table>`).join(''); })()}
<h3>季度培训规划</h3>
<table><tr><th>季度</th><th>重点</th><th>培训项目</th></tr>
${(training.quarterlyPlan || []).map((q: any) => `<tr><td>${q.quarter}</td><td>${q.focus}</td><td>${(q.items || []).join('、')}</td></tr>`).join('')}
</table>
<p>${training.overallSummary || ''}</p>
` : ''}

<h2>十二、结论与建议</h2>
<p>${risksKpi?.conclusion || ''}</p>
<h3>核心建议</h3>
<ul>${(risksKpi?.keyRecommendations || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>
</body></html>`;
}

/**
 * Export report as PPT (16:9 dark template)
 * Generates a downloadable HTML-based presentation file
 */
export async function exportToPPT(
  reportData: any,
  filename: string
) {
  const steps = reportData as any[];
  const overview = steps[0]?.data;
  const firstPrinciples = steps[1]?.data;
  const workflow = steps[2]?.data;
  const aiTools = steps[3]?.data;
  const newWorkflow = steps[4]?.data;
  const roi = steps[5]?.data;
  const restructuring = steps[6]?.data;
  const risksKpi = steps[7]?.data;
  const training = steps[8]?.data;

  const slides = [
    { title: "岗位/职能AI转型深度分析", subtitle: `${overview?.jobTitle || ''} | ${overview?.company || ''}`, type: "cover" },
    { title: "岗位概览", content: `<ul><li>岗位：${overview?.jobTitle || ''}</li><li>公司：${overview?.company || ''}</li><li>行业：${overview?.industry || ''}</li><li>层级：${overview?.level || ''}</li></ul>`, type: "content" },
    { title: "第一性思维分析", content: (firstPrinciples?.dimensions || []).map((d: any) => `<div><strong>${d.name}</strong>: ${d.essence}</div>`).join(''), type: "content" },
    { title: "当前工作流", content: `<table><tr><th>任务</th><th>时间占比</th><th>AI可替代</th></tr>${(workflow?.tasks || []).slice(0, 6).map((t: any) => `<tr><td>${t.name}</td><td>${t.timePercent}%</td><td>${t.aiReplaceability}</td></tr>`).join('')}</table>`, type: "content" },
    { title: "AI工具推荐", content: `<table><tr><th>任务</th><th>工具</th><th>效率提升</th></tr>${(aiTools?.recommendations || []).slice(0, 5).map((r: any) => `<tr><td>${r.taskName}</td><td>${Array.isArray(r.aiTools) ? r.aiTools.map((t: any) => typeof t === 'string' ? t : `${t.internationalTool || ''}/${t.domesticAlternative || ''}`).join(', ') : ''}</td><td>+${r.efficiencyGain}%</td></tr>`).join('')}</table>`, type: "content" },
    { title: "新工作流设计", content: `<p>${newWorkflow?.summary || ''}</p>`, type: "content" },
    { title: "ROI评估", content: `<table><tr><th>方案</th><th>投资</th><th>年节约</th><th>ROI</th></tr>${(roi?.roiPlans || []).map((p: any) => `<tr><td>${p.planName}</td><td>${p.investmentRange}</td><td>${p.annualSaving}</td><td>${p.roiPercent}%</td></tr>`).join('')}</table>`, type: "content" },
    { title: "岗位重组与路线图", content: `<ul>${(restructuring?.roadmap || []).map((p: any) => `<li><strong>阶段${p.phase}: ${p.name}</strong> (${p.duration})</li>`).join('')}</ul>`, type: "content" },
    { title: "风险控制与KPI", content: `<table><tr><th>类别</th><th>描述</th><th>缓解措施</th></tr>${(risksKpi?.risks || []).slice(0, 5).map((r: any) => `<tr><td>${r.category}</td><td>${r.description}</td><td>${r.mitigation}</td></tr>`).join('')}</table>`, type: "content" },
    { title: "转型能力培训", content: training ? `<p>整体就绪度：${training.overallReadiness || 0}%</p><table><tr><th>维度</th><th>能力项数</th><th>平均需求增长</th></tr>${(training.dimensionSummary || []).map((d: any) => `<tr><td>${d.dimension}</td><td>-</td><td>+${d.avgDemandGrowth?.toFixed(1) || 0}</td></tr>`).join('')}</table>` : '', type: "content" },
    { title: "结论与建议", content: `<p>${risksKpi?.conclusion || ''}</p><ul>${(risksKpi?.keyRecommendations || []).map((r: string) => `<li>${r}</li>`).join('')}</ul>`, type: "content" },
  ];

  const pptHTML = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${filename}</title>
<style>
@page { size: 16in 9in; margin: 0; }
body { margin: 0; font-family: "Microsoft YaHei", sans-serif; }
.slide { width: 16in; height: 9in; page-break-after: always; position: relative; display: flex; flex-direction: column; justify-content: center; padding: 1in 1.5in; box-sizing: border-box; background: linear-gradient(135deg, #0a0a12 0%, #12122a 100%); color: #e8e8f0; }
.slide.cover { align-items: center; text-align: center; }
.slide h1 { font-size: 48pt; color: #38BDF8; margin-bottom: 0.3em; }
.slide.cover h1 { font-size: 60pt; }
.slide .subtitle { font-size: 24pt; color: #8888aa; }
.slide table { border-collapse: collapse; width: 100%; margin-top: 20px; }
.slide th { background: rgba(56,189,248,0.2); color: #38BDF8; padding: 12px; text-align: left; border-bottom: 1px solid #333; font-size: 14pt; }
.slide td { padding: 10px 12px; border-bottom: 1px solid #222; font-size: 13pt; color: #ccc; }
.slide ul { list-style: none; padding: 0; }
.slide li { padding: 8px 0; font-size: 16pt; border-bottom: 1px solid #1a1a2e; }
.slide li:before { content: "▸ "; color: #38BDF8; }
.slide p { font-size: 16pt; line-height: 1.6; }
.slide strong { color: #38BDF8; }
.page-number { position: absolute; bottom: 30px; right: 50px; color: #555; font-size: 12pt; }
</style></head><body>
${slides.map((s, i) => `
<div class="slide ${s.type}">
  <h1>${s.title}</h1>
  ${s.type === 'cover' ? `<div class="subtitle">${s.subtitle || ''}</div>` : s.content || ''}
  <div class="page-number">${i + 1} / ${slides.length}</div>
</div>`).join('')}
</body></html>`;

  const blob = new Blob([pptHTML], { type: "application/vnd.ms-powerpoint;charset=utf-8" });
  saveAs(blob, `${filename}.ppt`);
}

/**
 * Export type definitions
 */
export type ExportFormat = "pdf" | "ppt" | "word";
