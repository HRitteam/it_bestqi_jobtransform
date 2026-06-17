# UI Optimization Reference

## Key Design Tokens from Dashboard_UI_Package

### Color System (Dark Theme)
- Background base: #08080F (near-black with slight blue)
- Glow core: rgba(107, 47, 160, 0.35) - purple ambient
- Surface card: linear-gradient(145deg, rgba(26,26,42,0.9), rgba(18,18,30,0.95))
- Text primary: #FFFFFF
- Text secondary: #6B6B80
- Positive/Success: #4ADE80 (green)
- Negative/Destructive: #FF5252 (red)
- Accent: #4ADE80 (green tech)
- Border subtle: rgba(255,255,255,0.06)
- Border faint: rgba(255,255,255,0.02)

### Chart Color Palette (unified)
- Primary accent: #4ADE80 (green)
- Secondary: #818cf8 (indigo)
- Warning: #fbbf24 (amber)
- Danger: #FF5252 (red)
- Info: #38bdf8 (sky blue)
- Neutral: #6B6B80

### Card Style
- Background: linear-gradient(145deg, rgba(26,26,42,0.9), rgba(18,18,30,0.95))
- Border: 1px solid rgba(255,255,255,0.06)
- Border radius: 20px
- Box shadow: inset 0 1px 0 0 rgba(255,255,255,0.04), 0 8px 32px 0 rgba(0,0,0,0.4)

### Current Issues in Report.tsx Charts
1. Gauge: uses #ef4444/#f59e0b/#22c55e - OK semantic colors
2. Sankey: uses #6366f1 and #22c55e - needs unification
3. Heatmap: uses green-yellow-red gradient - OK
4. Radar: uses #c06040 (before) and #6366f1 (after) - brownish red is ugly
5. TimeAllocation bar: #4f46e5 to #818cf8 gradient - too purple
6. ClassificationPie: #34d399/#6366f1/#fbbf24/#f87171 - mixed
7. ROI bar: #4338ca to #818cf8 - too purple
8. Grid/axis colors: #3a3a3a, #2a2a2a, #a3a3a3, #8a8a8a - inconsistent

### Unified Palette for Charts (based on spec)
- Series 1 (primary): #4ADE80 (green accent)
- Series 2 (secondary): #818cf8 (indigo/purple)
- Series 3 (tertiary): #38bdf8 (sky blue)
- Series 4 (quaternary): #fbbf24 (amber)
- Series 5 (quinary): #f87171 (red)
- Axis labels: #6B6B80
- Grid lines: rgba(255,255,255,0.06)
- Axis lines: rgba(255,255,255,0.04)
