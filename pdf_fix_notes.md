# PDF导出问题分析

## 根因
PDF通过Puppeteer在服务端生成，访问 `http://127.0.0.1:PORT/report/{id}?token=xxx&print=1`。
页面默认是dark主题（`defaultTheme="dark"`），所有CSS变量都是暗色主题值。

虽然 `@media print` 设置了 `body { background: white; color: black; }`，但：
1. 所有组件使用的CSS变量（`--foreground`, `--card`, `--muted-foreground`等）仍然是dark主题的值
2. ECharts图表组件硬编码了 `theme="dark"` 和暗色配色
3. 很多组件使用了硬编码的暗色样式（`bg-[rgba(18,18,30,0.95)]`, `text-white/90`等）

## 修复方案
最佳方案：当URL包含 `print=1` 参数时，强制使用light主题而非dark主题。

具体修改：
1. **ThemeContext.tsx** 或 **Report.tsx**: 检测 `print=1` URL参数，强制使用light主题
2. **@media print CSS**: 在print媒体查询中强制覆盖dark主题变量为light主题值
3. **ECharts组件**: 检测print模式，使用light theme而非dark theme

## 涉及的文件
- client/src/index.css - print CSS
- client/src/contexts/ThemeContext.tsx - 主题控制
- client/src/pages/Report.tsx - 报告页面
- client/src/components/report/SkillRadar.tsx - 雷达图（theme="dark"）
- client/src/components/report/ROIWaterfall.tsx - 瀑布图（theme="dark"）
- server/exportRoutes.ts - PDF生成（Puppeteer）
