import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { springPresets, staggerContainer, staggerItem } from "@/hooks/useSpring";
import { Brain, CheckCircle2, Circle, Loader2, FileSearch, Layers, Workflow, Zap, GitMerge, BarChart3, Users, Shield, GraduationCap } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/apiFetch";
type StepStatus = "pending" | "active" | "completed" | "error";
type AnalysisState = "idle" | "analyzing" | "completed" | "error";
const STEP_ICONS = [FileSearch, Brain, Workflow, Zap, GitMerge, BarChart3, Users, Shield, GraduationCap];
const ANALYSIS_STEPS = [
  { id: 1, title: "信息解析与假设填充", description: "自动解析JD文档，提取岗位核心信息，智能补充缺失字段" },
  { id: 2, title: "第一性思维拆解", description: "从价值创造、信息处理、决策复杂度、人际交互四维度深度分析" },
  { id: 3, title: "当前工作流拆解", description: "将岗位职责拆解为具体任务流，标注时间占比与自动化潜力" },
  { id: 4, title: "AI工具匹配", description: "基于50+国际/国产SOTA工具库，为每项任务推荐最佳AI解决方案" },
  { id: 5, title: "新工作流设计", description: "设计AI增强后的新工作流，标注人机协作比例与效率提升" },
  { id: 6, title: "转型对比与ROI", description: "量化转型前后对比，计算投资回报率与回收周期" },
  { id: 7, title: "岗位重组路线图", description: "规划技能转型路径、组织架构调整方案与分阶段实施计划" },
  { id: 8, title: "风险控制与KPI", description: "评估转型风险矩阵，设计可量化的KPI监控体系" },
  { id: 9, title: "转型能力培训评估", description: "评估思维/技能/知识/伦理四维度15项能力，生成个性化培训方案" },
];
export default function AnalysisPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [state, setState] = useState<AnalysisState>("analyzing");
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<StepStatus[]>(
    ANALYSIS_STEPS.map(() => "pending")
  );
  const completedRef = useRef(false); // Prevent double-fire of handleCompleted
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    if (state !== "analyzing") return;
    let eventSource: EventSource | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let closed = false;

    const updateStepUI = (stepIndex: number) => {
      setCurrentStep(stepIndex);
      setSteps((prev) => {
        const next = [...prev];
        for (let i = 0; i < stepIndex; i++) next[i] = "completed";
        if (stepIndex < ANALYSIS_STEPS.length) next[stepIndex] = "active";
        return next;
      });
    };

    const handleCompleted = () => {
      // Guard against multiple calls (SSE + polling both detecting completed)
      if (completedRef.current) return;
      completedRef.current = true;
      setState("completed");
      setSteps(ANALYSIS_STEPS.map(() => "completed"));
      // Clean up SSE and polling
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
      setTimeout(() => {
        setLocation(`/report/${params.id}`);
      }, 1500);
    };

    const connectSSE = () => {
      if (closed) return;
      eventSource = new EventSource(`/api/analysis/${params.id}/progress`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Only reset retryCount on meaningful data events, not "connected"
          if (data.type === "step_update" || data.type === "completed" || data.type === "error") {
            retryCountRef.current = 0;
          }
          if (data.type === "step_update") {
            updateStepUI(data.step);
          } else if (data.type === "completed") {
            eventSource?.close();
            handleCompleted();
          } else if (data.type === "error") {
            setState("error");
            eventSource?.close();
            if (pollInterval) clearInterval(pollInterval);
          }
        } catch (e) {
          console.error("SSE parse error:", e);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        if (closed || completedRef.current) return;
        
        retryCountRef.current += 1;
        if (retryCountRef.current <= maxRetries) {
          // Retry SSE connection after a short delay
          setTimeout(() => {
            if (!closed && !completedRef.current) connectSSE();
          }, 3000);
        }
        // Note: polling is always running as fallback, no need to start it here
      };
    };

    // Always start polling as unconditional fallback (every 8 seconds)
    // This ensures completion is detected even if SSE fails completely
    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        if (closed || completedRef.current) {
          if (pollInterval) clearInterval(pollInterval);
          return;
        }
        try {
          const res = await apiFetch(`/api/analysis/${params.id}/status`);
          if (!res.ok) return;
          const data = await res.json();
          if (data.status === "completed") {
            if (pollInterval) clearInterval(pollInterval);
            handleCompleted();
          } else if (data.status === "analyzing" && typeof data.currentStep === "number") {
            // currentStep is 1-indexed from DB, convert to 0-indexed for UI
            const stepIdx = Math.max(0, data.currentStep - 1);
            updateStepUI(stepIdx);
          } else if (data.status === "error") {
            if (pollInterval) clearInterval(pollInterval);
            setState("error");
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 8000);
    };

    // Start both SSE and polling simultaneously
    connectSSE();
    startPolling();

    return () => {
      closed = true;
      eventSource?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [params.id, state]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPresets.gentle}
        className="w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            animate={{ rotate: state === "analyzing" ? 360 : 0 }}
            transition={{ duration: 2, repeat: state === "analyzing" ? Infinity : 0, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {state === "analyzing" ? "AI 深度分析中..." : state === "completed" ? "分析完成" : "分析出错"}
          </h1>
          <p className="text-muted-foreground">
            {state === "analyzing"
              ? "正在通过9步推理链为您生成专业报告"
              : state === "completed"
              ? "即将跳转至报告页面"
              : "请稍后重试"}
          </p>
        </div>
        {/* Timeline */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-0"
        >
          {ANALYSIS_STEPS.map((step, index) => (
            <motion.div
              key={step.id}
              variants={staggerItem}
              className="flex gap-4 relative"
            >
              {/* Timeline line - positioned between circles, NOT through them */}
              {index < ANALYSIS_STEPS.length - 1 && (
                <div
                  className="absolute left-[19px] w-[2px]"
                  style={{ top: '2.75rem', height: 'calc(100% - 2.75rem)' }}
                >
                  {/* Background track */}
                  <div className="w-full h-full bg-border" />
                  {/* Animated fill */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: steps[index] === "completed" ? "100%" : 0 }}
                    transition={springPresets.gentle}
                    className="w-full bg-emerald-500 absolute top-0 left-0"
                  />
                </div>
              )}
              {/* Step indicator - z-10 ensures circle covers any line overlap */}
              <div className="relative z-10 shrink-0">
                {steps[index] === "completed" ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springPresets.bouncy}
                    className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center"
                  >
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </motion.div>
                ) : steps[index] === "active" ? (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-10 h-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center"
                  >
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  </motion.div>
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-white/[0.06] bg-card flex items-center justify-center">
                    <Circle className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* Step content */}
              <div className={`pb-8 pt-2 flex-1 flex items-start gap-3 ${steps[index] === "active" ? "opacity-100" : steps[index] === "completed" ? "opacity-70" : "opacity-40"}`}>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    步骤 {step.id}：{step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
                {/* Large pictographic icon */}
                {(() => { const StepIcon = STEP_ICONS[index]; return (
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${steps[index] === "active" ? "bg-primary/10" : steps[index] === "completed" ? "bg-emerald-500/10" : "bg-muted/30"}`}>
                    <StepIcon className={`w-5 h-5 ${steps[index] === "active" ? "text-primary" : steps[index] === "completed" ? "text-emerald-500" : "text-muted-foreground"}`} />
                  </div>
                ); })()}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
