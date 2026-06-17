import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='input-area']",
    title: "输入岗位信息",
    content: "在这里输入岗位名称、职责描述等信息，也可以直接上传JD文档",
    position: "bottom",
  },
  {
    target: "[data-tour='hot-cases']",
    title: "快速体验",
    content: "点击热门案例可快速填充示例岗位信息，一键体验分析流程",
    position: "top",
  },
  {
    target: "[data-tour='submit-btn']",
    title: "开始分析",
    content: "填写完成后点击此按钮，AI将通过9步推理链为您生成专业报告",
    position: "top",
  },
  {
    target: "[data-tour='nav-history']",
    title: "历史记录",
    content: "所有已生成的报告都保存在这里，支持搜索、分享和导出",
    position: "right",
  },
];

const TOUR_STORAGE_KEY = "ai-transform-tour-completed";

export function GuidedTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed) {
      // Delay tour start to let page render
      const timer = setTimeout(() => setIsActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const updatePosition = useCallback(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    const el = document.querySelector(step.target);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pos = step.position || "bottom";
    let top = 0;
    let left = 0;
    switch (pos) {
      case "bottom":
        top = rect.bottom + 12;
        left = rect.left + rect.width / 2;
        break;
      case "top":
        top = rect.top - 12;
        left = rect.left + rect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2;
        left = rect.left - 12;
        break;
      case "right":
        top = rect.top + rect.height / 2;
        left = rect.right + 12;
        break;
    }
    setTooltipPos({ top, left });
  }, [isActive, currentStep]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [updatePosition]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isLast = currentStep === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-none">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={handleSkip} />

        {/* Highlight target */}
        <HighlightTarget selector={step.target} />

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            position: "fixed",
            top: tooltipPos.top,
            left: tooltipPos.left,
            transform: "translateX(-50%)",
          }}
          className="pointer-events-auto bg-card border border-border rounded-xl p-4 shadow-xl max-w-xs w-72 z-[10000]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
            <button onClick={handleSkip} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-sm font-semibold text-foreground mb-1">{step.title}</h4>
          <p className="text-xs text-muted-foreground mb-3">{step.content}</p>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1 text-xs"
            >
              <ArrowLeft className="w-3 h-3" /> 上一步
            </Button>
            <Button size="sm" onClick={handleNext} className="gap-1 text-xs">
              {isLast ? "完成" : "下一步"} {!isLast && <ArrowRight className="w-3 h-3" />}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function HighlightTarget({ selector }: { selector: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const el = document.querySelector(selector);
    if (el) {
      setRect(el.getBoundingClientRect());
    }
  }, [selector]);

  if (!rect) return null;

  return (
    <div
      className="absolute border-2 border-primary rounded-lg pointer-events-none"
      style={{
        top: rect.top - 4,
        left: rect.left - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.5)",
      }}
    />
  );
}

export function resetTour() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
}
