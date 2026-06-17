import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { isIframeMode } from "@/lib/iframeContext";
import {
  Brain, Zap, BarChart3, Shield, ArrowRight, FileText, Users, Target,
  Layers, Clock, CheckCircle2, Cpu, GitBranch, TrendingUp, AlertTriangle,
  Lightbulb, Workflow, Building2, PieChart, LineChart, Radar, Download,
  Globe, Sparkles, ChevronRight, Eye, Lock, BarChart2, Activity,
  Gauge, Network, BookOpen, Rocket, Award, Star, GraduationCap,
} from "lucide-react";

// ============ DATA ============
const ANALYSIS_STEPS = [
  { id: 1, title: "信息解析与假设填充", icon: FileText, desc: "自动解析JD文档，提取岗位核心信息，智能补充缺失字段", color: "#10B981" },
  { id: 2, title: "第一性思维拆解", icon: Brain, desc: "从价值创造、信息处理、决策复杂度、人际交互四维度深度分析", color: "#06B6D4" },
  { id: 3, title: "当前工作流拆解", icon: Workflow, desc: "将岗位职责拆解为具体任务流，标注时间占比与自动化潜力", color: "#3B82F6" },
  { id: 4, title: "AI工具匹配", icon: Cpu, desc: "基于50+国际/国产SOTA工具库，为每项任务推荐最佳AI解决方案", color: "#0EA5E9" },
  { id: 5, title: "新工作流设计", icon: GitBranch, desc: "设计AI增强后的新工作流，标注人机协作比例与效率提升", color: "#14B8A6" },
  { id: 6, title: "转型对比与ROI", icon: TrendingUp, desc: "量化转型前后对比，计算投资回报率与回收周期", color: "#F59E0B" },
  { id: 7, title: "岗位重组路线图", icon: Target, desc: "规划技能转型路径、组织架构调整方案与分阶段实施计划", color: "#EF4444" },
  { id: 8, title: "风险控制与KPI", icon: Shield, desc: "评估转型风险矩阵，设计可量化的KPI监控体系", color: "#0284C7" },
  { id: 9, title: "转型能力培训评估", icon: GraduationCap, desc: "评估思维/技能/知识/伦理四维度15项能力，生成个性化培训方案", color: "#8B5CF6" },
];

const REPORT_CHAPTERS = [
  { title: "岗位概览", icon: FileText, desc: "岗位画像、核心职责、行业定位" },
  { title: "第一性思维分析", icon: Brain, desc: "AI可替代率仪表盘、四维度深度分析" },
  { title: "当前工作流", icon: Workflow, desc: "任务流桑基图、时间分配、自动化潜力" },
  { title: "AI工具匹配", icon: Cpu, desc: "SOTA工具推荐、优化前后对比" },
  { title: "新工作流设计", icon: GitBranch, desc: "甘特图、人机协作比、效率提升" },
  { title: "转型对比", icon: BarChart3, desc: "能力雷达图、前后量化对比" },
  { title: "ROI评估", icon: TrendingUp, desc: "瀑布图、投资回报率、回收周期" },
  { title: "岗位重组", icon: Users, desc: "技能缺口雷达、组织架构变化图" },
  { title: "实施路线图", icon: Target, desc: "分阶段里程碑、时间线规划" },
  { title: "工具清单", icon: Zap, desc: "完整工具表格、国际/国产双轨" },
  { title: "风险控制", icon: AlertTriangle, desc: "风险矩阵热力图、缓解策略" },
  { title: "KPI体系", icon: Shield, desc: "量化指标仪表盘、目标追踪" },
  { title: "转型能力培训", icon: GraduationCap, desc: "四维度15项能力评估、培训优先级、季度规划" },
  { title: "结论与建议", icon: Lightbulb, desc: "综合评估、行动建议、优先级" },
];

const PLATFORM_FEATURES = [
  { icon: Building2, title: "HR工作台", desc: "部门级统计概览、报告管理、搜索筛选、一站式管理所有分析报告" },
  { icon: Users, title: "部门批量分析", desc: "一次上传多个岗位，自动批量执行分析，生成部门全景对比报告" },
  { icon: Eye, title: "多角色视图", desc: "HR视角、员工视角、管理层视角三种报告呈现模式，满足不同受众需求" },
  { icon: BarChart2, title: "报告对比", desc: "2-4份报告并排对比，雷达图+柱状图+表格多维度可视化差异" },
  { icon: Download, title: "多格式导出", desc: "支持PDF/Word/PPT多格式导出，一键分发给团队成员" },
  { icon: Sparkles, title: "AI行动计划", desc: "基于分析结果自动生成可执行的行动计划和管理层汇报材料" },
  { icon: Globe, title: "国际/国产双轨", desc: "50+工具库覆盖ChatGPT、Claude、文心一言、通义千问等主流AI工具" },
  { icon: Lock, title: "品牌定制", desc: "自定义品牌Logo、主题色、报告封面，打造企业专属分析平台" },
];

const COMPARISON_DATA = [
  { dimension: "分析深度", traditional: "表面描述", aiPlatform: "9步推理链深度分析" },
  { dimension: "覆盖维度", traditional: "3-5个维度", aiPlatform: "14个章节全景覆盖" },
  { dimension: "工具推荐", traditional: "通用建议", aiPlatform: "50+精选SOTA工具匹配" },
  { dimension: "量化指标", traditional: "定性判断", aiPlatform: "AI可替代率/ROI/KPI量化" },
  { dimension: "报告时间", traditional: "1-2周", aiPlatform: "2分钟自动生成" },
  { dimension: "可视化", traditional: "纯文字", aiPlatform: "雷达图/桑基图/甘特图等" },
  { dimension: "个性化", traditional: "模板化", aiPlatform: "基于岗位信息定制分析" },
  { dimension: "成本", traditional: "咨询费数万", aiPlatform: "免费使用" },
];

const METRICS_SHOWCASE = [
  { icon: Gauge, label: "AI可替代率", value: "72%", sub: "精确到百分比", color: "#EF4444" },
  { icon: TrendingUp, label: "效率提升", value: "3.2x", sub: "转型前后对比", color: "#10B981" },
  { icon: Clock, label: "ROI回收期", value: "4.5月", sub: "投资回报周期", color: "#F59E0B" },
  { icon: Target, label: "工具匹配", value: "12+", sub: "精选推荐工具", color: "#3B82F6" },
  { icon: Activity, label: "风险评分", value: "中等", sub: "四维度评估", color: "#0EA5E9" },
  { icon: Star, label: "技能缺口", value: "5项", sub: "转型必备技能", color: "#06B6D4" },
];

const USE_CASES = [
  { role: "HRBP/HR总监", scenario: "年度组织盘点时，批量分析部门内所有岗位的AI转型潜力，输出管理层汇报材料", icon: Building2 },
  { role: "企业战略部", scenario: "制定数字化转型规划时，评估各业务线岗位的AI替代风险和投资优先级", icon: Rocket },
  { role: "培训发展经理", scenario: "设计AI技能培训计划时，精准识别各岗位的技能缺口和学习路径", icon: BookOpen },
  { role: "业务部门负责人", scenario: "优化团队效率时，了解哪些工作可以用AI工具提效，如何分阶段落地", icon: Award },
];

// ============ COMPONENT ============
export default function About() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const opacity1 = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const y1 = useTransform(scrollYProgress, [0, 0.08], [0, -50]);
  const [activeStep, setActiveStep] = useState(0);

  const handleCTA = () => {
    if (authLoading || isIframeMode()) {
      // 认证加载中或iframe模式，直接跳转首页（首页不需要认证）
      setLocation("/");
      return;
    }
    if (user) {
      setLocation("/");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "linear-gradient(rgba(16,185,129,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px"
        }} />
        <motion.div style={{ opacity: opacity1, y: y1 }} className="text-center max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center"
          >
            <Brain className="w-10 h-10 text-primary" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
          >
            AI正在重塑每一个岗位
            <br />
            <span className="text-primary">您的团队准备好了吗？</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto"
          >
            基于9步AI推理链的岗位转型深度分析平台，2分钟生成14章节全景报告，
            覆盖AI可替代率、工具推荐、ROI评估、风险控制等全维度洞察
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" onClick={handleCTA} className="gap-2 text-base px-8">
              免费开始分析 <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/report/demo")} className="gap-2 text-base px-8">
              查看示例报告
            </Button>
          </motion.div>
          {/* Hero metrics strip */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { label: "分析维度", value: "14章节" },
              { label: "推理深度", value: "9步链" },
              { label: "工具库", value: "50+" },
              { label: "生成时间", value: "≈2分钟" },
            ].map((m, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-primary">{m.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ===== SECTION: 核心指标展示 ===== */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">每份报告输出的核心指标</h2>
            <p className="text-muted-foreground text-lg">数据驱动决策，量化每一个转型维度</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {METRICS_SHOWCASE.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-5 text-center group hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
                  <m.icon className="w-6 h-6" style={{ color: m.color }} />
                </div>
                <p className="text-2xl font-bold text-foreground mb-1">{m.value}</p>
                <p className="text-sm font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION: 9步分析流程（交互式） ===== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">9步AI推理链</h2>
            <p className="text-muted-foreground text-lg">每一步都有严谨的推理逻辑和结构化输出</p>
          </motion.div>
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
            {/* Step selector */}
            <div className="space-y-2">
              {ANALYSIS_STEPS.map((step, i) => (
                <motion.button
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setActiveStep(i)}
                  className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                    activeStep === i
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-card/60 border border-border hover:border-border/80"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${step.color}20` }}>
                    <span className="text-xs font-bold" style={{ color: step.color }}>{step.id}</span>
                  </div>
                  <span className={`text-sm font-medium ${activeStep === i ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.title}
                  </span>
                </motion.button>
              ))}
            </div>
            {/* Step detail */}
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card border border-border rounded-2xl p-8 flex flex-col justify-center min-h-[400px]"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${ANALYSIS_STEPS[activeStep].color}15` }}>
                  {(() => { const Icon = ANALYSIS_STEPS[activeStep].icon; return <Icon className="w-8 h-8" style={{ color: ANALYSIS_STEPS[activeStep].color }} />; })()}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Step {ANALYSIS_STEPS[activeStep].id} / {ANALYSIS_STEPS.length}</p>
                  <h3 className="text-2xl font-bold text-foreground">{ANALYSIS_STEPS[activeStep].title}</h3>
                </div>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">{ANALYSIS_STEPS[activeStep].desc}</p>
              {/* Visual indicator for each step */}
              <div className="bg-background/50 rounded-xl p-4 border border-white/[0.04]">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">输出示例</p>
                <div className="flex flex-wrap gap-2">
                  {activeStep === 0 && ["岗位名称", "所属行业", "核心职责", "技能要求", "团队规模"].map(t => <span key={t} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">{t}</span>)}
                  {activeStep === 1 && ["价值创造本质", "信息处理模式", "决策复杂度", "人际交互密度", "AI可替代率"].map(t => <span key={t} className="px-3 py-1 bg-cyan-500/10 text-cyan-400 text-xs rounded-full border border-cyan-500/20">{t}</span>)}
                  {activeStep === 2 && ["任务流列表", "时间占比", "自动化潜力", "桑基图数据", "瓶颈识别"].map(t => <span key={t} className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">{t}</span>)}
                  {activeStep === 3 && ["工具名称", "匹配度评分", "使用场景", "国际/国产分类", "上手建议"].map(t => <span key={t} className="px-3 py-1 bg-sky-500/10 text-sky-400 text-xs rounded-full border border-sky-500/20">{t}</span>)}
                  {activeStep === 4 && ["新任务流", "AI/人工比例", "效率提升率", "甘特图数据", "协作模式"].map(t => <span key={t} className="px-3 py-1 bg-teal-500/10 text-teal-400 text-xs rounded-full border border-teal-500/20">{t}</span>)}
                  {activeStep === 5 && ["ROI百分比", "回收周期", "成本节约", "效率倍数", "瀑布图数据"].map(t => <span key={t} className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs rounded-full border border-amber-500/20">{t}</span>)}
                  {activeStep === 6 && ["技能缺口", "培训路径", "组织架构图", "里程碑计划", "资源需求"].map(t => <span key={t} className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/20">{t}</span>)}
                  {activeStep === 7 && ["风险类别", "概率评估", "影响程度", "缓解策略", "KPI指标"].map(t => <span key={t} className="px-3 py-1 bg-sky-600/10 text-sky-400 text-xs rounded-full border border-sky-600/20">{t}</span>)}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== SECTION: 14章节报告内容 ===== */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">14章节全景报告</h2>
            <p className="text-muted-foreground text-lg">每份报告包含以下完整章节，覆盖转型分析的方方面面</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {REPORT_CHAPTERS.map((ch, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <ch.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">Ch.{i + 1}</span>
                      <h3 className="text-sm font-semibold text-foreground">{ch.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ch.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION: 平台功能 ===== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">平台核心功能</h2>
            <p className="text-muted-foreground text-lg">不只是分析报告，更是完整的AI转型管理平台</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLATFORM_FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION: 对比表格 ===== */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">对比传统方式</h2>
            <p className="text-muted-foreground text-lg">AI驱动 vs 传统咨询，效率提升数十倍</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-border rounded-2xl overflow-hidden"
          >
            <div className="grid grid-cols-3 bg-white/[0.03] border-b border-white/[0.06]">
              <div className="p-4 text-sm font-semibold text-muted-foreground">对比维度</div>
              <div className="p-4 text-sm font-semibold text-red-400 text-center">传统方式</div>
              <div className="p-4 text-sm font-semibold text-emerald-400 text-center">本平台</div>
            </div>
            {COMPARISON_DATA.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 ${i < COMPARISON_DATA.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                <div className="p-4 text-sm font-medium text-foreground flex items-center">{row.dimension}</div>
                <div className="p-4 text-sm text-muted-foreground text-center flex items-center justify-center">{row.traditional}</div>
                <div className="p-4 text-sm text-emerald-400 text-center flex items-center justify-center font-medium">{row.aiPlatform}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== SECTION: 可视化图表展示 ===== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">丰富的可视化图表</h2>
            <p className="text-muted-foreground text-lg">一图胜千言，每份报告包含10+种专业图表</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: Gauge, name: "仪表盘", desc: "AI可替代率" },
              { icon: Radar, name: "雷达图", desc: "能力对比" },
              { icon: Network, name: "桑基图", desc: "工作流可视化" },
              { icon: BarChart3, name: "甘特图", desc: "时间规划" },
              { icon: LineChart, name: "瀑布图", desc: "ROI分解" },
              { icon: PieChart, name: "环形图", desc: "占比分析" },
              { icon: Activity, name: "热力图", desc: "风险矩阵" },
              { icon: GitBranch, name: "组织图", desc: "架构变化" },
              { icon: TrendingUp, name: "对比图", desc: "前后变化" },
              { icon: Target, name: "路线图", desc: "里程碑" },
            ].map((chart, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <chart.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{chart.name}</p>
                <p className="text-xs text-muted-foreground">{chart.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION: 使用场景 ===== */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">适用场景</h2>
            <p className="text-muted-foreground text-lg">无论您是HR、战略部还是业务负责人，都能从中获益</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {USE_CASES.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 flex gap-4"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <uc.icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{uc.role}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{uc.scenario}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION: 使用流程 ===== */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">简单四步，获取专业报告</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { num: "01", title: "输入岗位信息", desc: "粘贴JD文本或上传岗位说明文档", icon: FileText },
              { num: "02", title: "AI深度分析", desc: "9步推理链自动执行，实时展示进度", icon: Brain },
              { num: "03", title: "查看全景报告", desc: "14章节可视化报告，多角色视图切换", icon: Eye },
              { num: "04", title: "导出与分发", desc: "PDF/Word/PPT多格式，一键分享团队", icon: Download },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-xs font-bold text-primary">{s.num}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
                {i < 3 && <ChevronRight className="w-5 h-5 text-muted-foreground/30 mx-auto mt-4 hidden md:block rotate-90 md:rotate-0" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION: CTA ===== */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              立即开始您的AI转型评估
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              输入任意岗位信息，2分钟内获得专业的AI转型分析报告，完全免费
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleCTA} className="gap-2 text-base px-8">
                免费开始分析 <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLocation("/batch")} className="gap-2 text-base px-8">
                <Building2 className="w-4 h-4" /> 部门批量分析
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
