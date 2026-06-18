import { useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { motion, AnimatePresence } from "framer-motion";

const IS_PRINT_MODE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('print') === '1';
import { springPresets } from "@/hooks/useSpring";
import {
  Brain, Zap, BookOpen, Shield, ChevronDown, ChevronUp,
  ExternalLink, Star, Clock, GraduationCap, Info,
  ArrowRight, CheckCircle2, AlertTriangle, Target,
} from "lucide-react";
import { useIsMobileOrTablet } from "@/hooks/useBreakpoint";

// ─── Types ───────────────────────────────────────────────────
interface Resource {
  name: string;
  platform: string;
  isFree: boolean;
}

interface Competency {
  dimension: string;
  name: string;
  preTransformDemand: number;
  postTransformDemand: number;
  demandGrowth: number;
  priority: string;
  trainingAdvice: string;
  resources: Resource[];
}

interface DimensionSummary {
  dimension: string;
  avgPreTransform: number;
  avgPostTransform: number;
  avgDemandGrowth: number;
}

interface PriorityItem {
  rank: number;
  name: string;
  priority: string;
  reason: string;
}

interface QuarterlyPlan {
  quarter: string;
  focus: string;
  items: string[];
}

interface TrainingData {
  dimensionSummary: DimensionSummary[];
  competencies: Competency[];
  priorityRanking: PriorityItem[];
  quarterlyPlan: QuarterlyPlan[];
  overallReadiness: number;
  overallSummary: string;
}

// Raw format from LLM step9
interface RawDimensionItem {
  name: string;
  preTransformDemand?: number;
  postTransformDemand?: number;
  demandGrowth?: number;
  currentLevel?: number;
  targetLevel?: number;
  gap?: number;
  priority: string;
  trainingHours?: number;
  description?: string;
}
interface RawDimension {
  category: string;
  items: RawDimensionItem[];
}
interface RawTrainingData {
  dimensions: RawDimension[];
  overallReadiness: number;
  totalTrainingHours?: number;
  quarterlyPlan: { quarter: string; focus: string; items: string[]; hours?: number }[];
  summary: string;
}

interface TrainingCompetencyProps {
  data: TrainingData | RawTrainingData | any;
}

// ─── Normalize priorityRanking: string[] → PriorityItem[] ────
function normalizePriorityRanking(pr: any, competencies?: any[]): PriorityItem[] {
  if (!pr || !Array.isArray(pr) || pr.length === 0) return [];
  let items: PriorityItem[] = [];
  // Already PriorityItem objects
  if (typeof pr[0] === 'object' && pr[0] !== null && 'name' in pr[0]) {
    items = pr.map((item: any, i: number) => ({
      rank: item.rank ?? i + 1,
      name: item.name || '',
      priority: item.priority || '延后培训',
      reason: item.reason || '',
    }));
  }
  // String array format: ["能力名称1", "能力名称2", ...]
  else if (typeof pr[0] === 'string') {
    const priorityLabels = ['立即培训', '第一优先', '第二优先', '延后培训'];
    items = pr.map((name: string, i: number) => {
      // Try to find matching competency for more info
      const comp = competencies?.find((c: any) => c.name === name);
      return {
        rank: i + 1,
        name,
        priority: comp?.priority || priorityLabels[Math.min(Math.floor(i / Math.max(1, Math.ceil(pr.length / 4))), 3)] || '延后培训',
        reason: comp?.trainingAdvice || '',
      };
    });
  }
  // Deduplicate by name (keep first occurrence, re-rank)
  const seen = new Set<string>();
  const deduped: PriorityItem[] = [];
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      deduped.push({ ...item, rank: deduped.length + 1 });
    }
  }
  return deduped;
}

// ─── Data Adapter ────────────────────────────────────────────
function adaptTrainingData(raw: any): TrainingData | null {
  // Already in processed format (new schema)
  if (raw.competencies && Array.isArray(raw.competencies)) {
    // Check if it uses old field names and convert
    const first = raw.competencies[0];
    if (first && ('currentLevel' in first || 'targetLevel' in first) && !('preTransformDemand' in first)) {
      // Convert old schema to new
      const competencies: Competency[] = raw.competencies.map((c: any) => ({
        dimension: c.dimension,
        name: c.name,
        preTransformDemand: c.preTransformDemand ?? c.currentLevel ?? 1,
        postTransformDemand: c.postTransformDemand ?? c.targetLevel ?? 3,
        demandGrowth: c.demandGrowth ?? c.gap ?? ((c.targetLevel ?? 3) - (c.currentLevel ?? 1)),
        priority: c.priority,
        trainingAdvice: c.trainingAdvice,
        resources: c.resources || [],
      }));
      const dimensionSummary: DimensionSummary[] = (raw.dimensionSummary || []).map((ds: any) => ({
        dimension: ds.dimension,
        avgPreTransform: ds.avgPreTransform ?? ds.avgCurrent ?? 0,
        avgPostTransform: ds.avgPostTransform ?? ds.avgTarget ?? 0,
        avgDemandGrowth: ds.avgDemandGrowth ?? ds.avgGap ?? 0,
      }));
      return {
        competencies,
        dimensionSummary,
        priorityRanking: normalizePriorityRanking(raw.priorityRanking, competencies),
        quarterlyPlan: raw.quarterlyPlan || [],
        overallReadiness: raw.overallReadiness ?? 0,
        overallSummary: raw.overallSummary || "",
      };
    }
    // Normalize dimensionSummary to ensure required fields exist
    const normalizedDimSummary = (raw.dimensionSummary || []).map((ds: any) => ({
      dimension: ds.dimension,
      avgPreTransform: ds.avgPreTransform ?? ds.avgCurrent ?? 0,
      avgPostTransform: ds.avgPostTransform ?? ds.avgTarget ?? 0,
      avgDemandGrowth: ds.avgDemandGrowth ?? ds.avgGap ?? 0,
    }));
    return {
      ...raw,
      dimensionSummary: normalizedDimSummary,
      priorityRanking: normalizePriorityRanking(raw.priorityRanking, raw.competencies),
      quarterlyPlan: raw.quarterlyPlan || [],
      overallReadiness: raw.overallReadiness ?? 0,
      overallSummary: raw.overallSummary || "",
    } as TrainingData;
  }
  // Raw LLM format: { dimensions: [...], overallReadiness, quarterlyPlan, summary }
  if (raw.dimensions && Array.isArray(raw.dimensions)) {
    const competencies: Competency[] = [];
    const dimensionSummary: DimensionSummary[] = [];

    for (const dim of raw.dimensions as RawDimension[]) {
      let sumPre = 0, sumPost = 0, sumGrowth = 0;
      for (const item of dim.items) {
        const pre = item.preTransformDemand ?? item.currentLevel ?? 1;
        const post = item.postTransformDemand ?? item.targetLevel ?? 3;
        const growth = item.demandGrowth ?? item.gap ?? (post - pre);
        competencies.push({
          dimension: dim.category,
          name: item.name,
          preTransformDemand: pre,
          postTransformDemand: post,
          demandGrowth: growth,
          priority: normalizePriority(item.priority),
          trainingAdvice: item.description || "",
          resources: [],
        });
        sumPre += pre;
        sumPost += post;
        sumGrowth += growth;
      }
      const count = dim.items.length || 1;
      dimensionSummary.push({
        dimension: dim.category,
        avgPreTransform: sumPre / count,
        avgPostTransform: sumPost / count,
        avgDemandGrowth: sumGrowth / count,
      });
    }

    // Build priority ranking from competencies sorted by demandGrowth desc, then priority
    const priorityOrder: Record<string, number> = { "\u7acb\u5373\u57f9\u8bad": 0, "critical": 0, "\u7b2c\u4e00\u4f18\u5148": 1, "high": 1, "\u7b2c\u4e8c\u4f18\u5148": 2, "medium": 2, "\u5ef6\u540e\u57f9\u8bad": 3, "low": 3 };
    const sorted = [...competencies].sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 3;
      const pb = priorityOrder[b.priority] ?? 3;
      if (pa !== pb) return pa - pb;
      return b.demandGrowth - a.demandGrowth;
    });
    const rawPriority: PriorityItem[] = sorted.map((c, i) => ({
      rank: i + 1,
      name: c.name,
      priority: c.priority,
      reason: c.trainingAdvice || `需求增长 ${c.demandGrowth} 级，转型前 ${c.preTransformDemand}/5 → 转型后 ${c.postTransformDemand}/5`,
    }));
    // Deduplicate by name
    const seenNames = new Set<string>();
    const priorityRanking: PriorityItem[] = [];
    for (const item of rawPriority) {
      const key = item.name.trim().toLowerCase();
      if (key && !seenNames.has(key)) {
        seenNames.add(key);
        priorityRanking.push({ ...item, rank: priorityRanking.length + 1 });
      }
    }

    const quarterlyPlan: QuarterlyPlan[] = (raw.quarterlyPlan || []).map((qp: any) => ({
      quarter: qp.quarter,
      focus: qp.focus,
      items: qp.items || [],
    }));

    return {
      competencies,
      dimensionSummary,
      priorityRanking,
      quarterlyPlan,
      overallReadiness: raw.overallReadiness ?? 0,
      overallSummary: raw.summary || "",
    };
  }
  return null;
}

function normalizePriority(p: string): string {
  if (!p) return "\u5ef6\u540e\u57f9\u8bad";
  if (p === "critical" || p.includes("\u7acb\u5373")) return "\u7acb\u5373\u57f9\u8bad";
  if (p === "high" || p.includes("\u7b2c\u4e00") || p.includes("\u9ad8")) return "\u7b2c\u4e00\u4f18\u5148";
  if (p === "medium" || p.includes("\u7b2c\u4e8c") || p.includes("\u4e2d")) return "\u7b2c\u4e8c\u4f18\u5148";
  return "\u5ef6\u540e\u57f9\u8bad";
}

// ─── Dimension metadata ──────────────────────────────────────
const DIMENSION_META: Record<string, { icon: typeof Brain; color: string; gradient: string; bg: string }> = {
  "\u601d\u7ef4/\u5fc3\u667a\u8bad\u7ec3": { icon: Brain, color: "#A78BFA", gradient: "from-violet-500/20 to-purple-500/10", bg: "bg-violet-500/10" },
  "\u6280\u80fd\u8bad\u7ec3": { icon: Zap, color: "#60A5FA", gradient: "from-blue-500/20 to-sky-500/10", bg: "bg-blue-500/10" },
  "\u77e5\u8bc6\u5b66\u4e60": { icon: BookOpen, color: "#34D399", gradient: "from-emerald-500/20 to-green-500/10", bg: "bg-emerald-500/10" },
  "\u4ef7\u503c\u89c2\u4e0e\u4f26\u7406\u8bad\u7ec3": { icon: Shield, color: "#F59E0B", gradient: "from-amber-500/20 to-yellow-500/10", bg: "bg-amber-500/10" },
};

// Fallback dimension matching
function getDimensionMeta(dim: string) {
  if (!dim || typeof dim !== "string") {
    return { key: "", icon: Brain, color: "#A78BFA", gradient: "from-violet-500/20 to-purple-500/10", bg: "bg-violet-500/10" };
  }
  for (const [key, meta] of Object.entries(DIMENSION_META)) {
    if (dim.includes(key) || key.includes(dim) || dim.includes(key.replace("\u8bad\u7ec3", "")) || dim.includes(key.replace("\u5b66\u4e60", ""))) {
      return { key, ...meta };
    }
  }
  if (dim.includes("\u601d\u7ef4") || dim.includes("\u5fc3\u667a")) return { key: "\u601d\u7ef4/\u5fc3\u667a\u8bad\u7ec3", ...DIMENSION_META["\u601d\u7ef4/\u5fc3\u667a\u8bad\u7ec3"] };
  if (dim.includes("\u6280\u80fd")) return { key: "\u6280\u80fd\u8bad\u7ec3", ...DIMENSION_META["\u6280\u80fd\u8bad\u7ec3"] };
  if (dim.includes("\u77e5\u8bc6")) return { key: "\u77e5\u8bc6\u5b66\u4e60", ...DIMENSION_META["\u77e5\u8bc6\u5b66\u4e60"] };
  if (dim.includes("\u4f26\u7406") || dim.includes("\u4ef7\u503c")) return { key: "\u4ef7\u503c\u89c2\u4e0e\u4f26\u7406\u8bad\u7ec3", ...DIMENSION_META["\u4ef7\u503c\u89c2\u4e0e\u4f26\u7406\u8bad\u7ec3"] };
  return { key: dim, icon: Brain, color: "#A78BFA", gradient: "from-violet-500/20 to-purple-500/10", bg: "bg-violet-500/10" };
}

// ─── Term Explanations ───────────────────────────────────────
const TERM_EXPLANATIONS: Record<string, { short: string; detail: string }> = {
  "\u7b2c\u4e00\u6027\u601d\u7ef4": {
    short: "\u56de\u5f52\u4e8b\u7269\u6700\u57fa\u672c\u7684\u771f\u7406\u548c\u5047\u8bbe\uff0c\u4ece\u96f6\u5f00\u59cb\u63a8\u7406",
    detail: "\u4e0d\u4f9d\u8d56\u7c7b\u6bd4\u6216\u7ecf\u9a8c\uff0c\u800c\u662f\u8ffd\u95ee\u201c\u8fd9\u4ef6\u4e8b\u7684\u672c\u8d28\u662f\u4ec0\u4e48\uff1f\u201d\u3002\u5728AI\u8f6c\u578b\u4e2d\uff0c\u5e2e\u52a9\u5224\u65ad\u5c97\u4f4d\u7684\u672c\u8d28\u4ef7\u503c\u2014\u2014\u54ea\u4e9b\u5de5\u4f5c\u662f\u6838\u5fc3\u7684\uff08\u4e0d\u53ef\u66ff\u4ee3\uff09\uff0c\u54ea\u4e9b\u662f\u884d\u751f\u7684\uff08\u53ef\u88abAI\u63a5\u7ba1\uff09\u3002",
  },
  "\u6279\u5224\u601d\u7ef4": {
    short: "\u5bf9\u4fe1\u606f\u3001\u8bba\u8bc1\u548c\u7ed3\u8bba\u8fdb\u884c\u7cfb\u7edf\u6027\u7684\u5206\u6790\u3001\u8bc4\u4f30\u548c\u8d28\u7591",
    detail: "AI\u751f\u6210\u7684\u5185\u5bb9\u5e76\u975e\u603b\u662f\u6b63\u786e\u7684\u3002\u6279\u5224\u601d\u7ef4\u662f\u4eba\u7c7b\u5ba1\u6838AI\u8f93\u51fa\u7684\u6838\u5fc3\u80fd\u529b\u2014\u2014\u80fd\u8bc6\u522bAI\u5e7b\u89c9\u3001\u8bc4\u4f30AI\u5efa\u8bae\u7684\u5408\u7406\u6027\u3001\u53d1\u73b0AI\u65b9\u6848\u4e2d\u7684\u903b\u8f91\u6f0f\u6d1e\u3002\u6ca1\u6709\u6279\u5224\u601d\u7ef4\u7684\u4eba\u4f1a\u76f2\u76ee\u4fe1\u4efbAI\u8f93\u51fa\u3002",
  },
  "\u7cfb\u7edf\u601d\u7ef4": {
    short: "\u5c06\u4e8b\u7269\u89c6\u4e3a\u76f8\u4e92\u5173\u8054\u7684\u7cfb\u7edf\u800c\u975e\u5b64\u7acb\u7684\u90e8\u5206",
    detail: "AI\u8f6c\u578b\u4e0d\u662f\u5355\u70b9\u4f18\u5316\uff0c\u800c\u662f\u7cfb\u7edf\u6027\u53d8\u9769\u3002\u7cfb\u7edf\u601d\u7ef4\u5e2e\u52a9\u7406\u89e3\uff1a\u5f15\u5165AI\u5de5\u5177\u4f1a\u5982\u4f55\u5f71\u54cd\u4e0a\u4e0b\u6e38\u6d41\u7a0b\uff1f\u81ea\u52a8\u5316\u4e00\u4e2a\u73af\u8282\u4f1a\u4ea7\u751f\u4ec0\u4e48\u8fde\u9501\u53cd\u5e94\uff1f\u907f\u514d\u201c\u5c40\u90e8\u4f18\u5316\u3001\u5168\u5c40\u6076\u5316\u201d\u3002",
  },
  "\u62bd\u8c61\u601d\u7ef4": {
    short: "\u4ece\u5177\u4f53\u4e8b\u7269\u4e2d\u63d0\u53d6\u5171\u6027\u6a21\u5f0f\u3001\u89c4\u5f8b\u548c\u539f\u5219",
    detail: "\u4e0eAI\u534f\u4f5c\u7684\u6838\u5fc3\u6311\u6218\u4e4b\u4e00\u662f\u5c06\u6a21\u7cca\u7684\u4e1a\u52a1\u9700\u6c42\u8f6c\u5316\u4e3aAI\u53ef\u7406\u89e3\u7684\u7ed3\u6784\u5316\u6307\u4ee4\u3002\u62bd\u8c61\u601d\u7ef4\u5e2e\u52a9\u5c06\u590d\u6742\u573a\u666f\u63d0\u70bc\u4e3a\u6e05\u6670\u7684\u95ee\u9898\u5b9a\u4e49\u548c\u53ef\u590d\u7528\u7684\u65b9\u6cd5\u8bba\u3002",
  },
  "\u5f00\u653e\u601d\u7ef4\u4e0e\u6210\u957f\u5fc3\u667a": {
    short: "\u5bf9\u65b0\u89c2\u70b9\u4fdd\u6301\u63a5\u7eb3\uff0c\u76f8\u4fe1\u80fd\u529b\u53ef\u901a\u8fc7\u52aa\u529b\u548c\u5b66\u4e60\u4e0d\u65ad\u63d0\u5347",
    detail: "AI\u6280\u672f\u8fed\u4ee3\u6781\u5feb\uff0c\u4eca\u5929\u7684\u6700\u4f73\u5b9e\u8df5\u53ef\u80fd\u57286\u4e2a\u6708\u540e\u88ab\u98a0\u8986\u3002\u6210\u957f\u5fc3\u667a\u7684\u4eba\u4f1a\u5c06AI\u89c6\u4e3a\u653e\u5927\u81ea\u8eab\u80fd\u529b\u7684\u5de5\u5177\uff0c\u4e3b\u52a8\u5b66\u4e60\u548c\u9002\u5e94\uff0c\u800c\u975e\u6050\u60e7\u88ab\u66ff\u4ee3\u3002",
  },
  "\u8bbe\u8ba1\u601d\u7ef4": {
    short: "\u4ee5\u4eba\u4e3a\u4e2d\u5fc3\u7684\u521b\u65b0\u65b9\u6cd5\u8bba\uff08\u5171\u60c5\u2192\u5b9a\u4e49\u2192\u6784\u601d\u2192\u539f\u578b\u2192\u6d4b\u8bd5\uff09",
    detail: "AI\u8f6c\u578b\u7684\u7ec8\u6781\u76ee\u6807\u4e0d\u662f\u201c\u7528AI\u66ff\u4ee3\u4eba\u201d\uff0c\u800c\u662f\u8bbe\u8ba1\u66f4\u597d\u7684\u4eba\u673a\u534f\u4f5c\u4f53\u9a8c\u3002\u8bbe\u8ba1\u601d\u7ef4\u5e2e\u52a9\u4ece\u7528\u6237\u89d2\u5ea6\u51fa\u53d1\uff0c\u8bbe\u8ba1AI\u878d\u5165\u5de5\u4f5c\u6d41\u7684\u6700\u4f73\u65b9\u5f0f\u3002",
  },
  "\u4eba\u673a\u6c9f\u901a\uff08\u63d0\u793a\u8bcd\u5de5\u7a0b\uff09": {
    short: "\u901a\u8fc7\u7cbe\u786e\u7684\u81ea\u7136\u8bed\u8a00\u6307\u4ee4\u5f15\u5bfcAI\u7cfb\u7edf\u4ea7\u751f\u9ad8\u8d28\u91cf\u8f93\u51fa",
    detail: "\u8fd9\u662fAI\u65f6\u4ee3\u6700\u57fa\u7840\u7684\u201c\u6570\u5b57\u7d20\u517b\u201d\uff0c\u7c7b\u4f3c\u4e8eOffice\u65f6\u4ee3\u7684\u201c\u4f1a\u7528Word\u548cExcel\u201d\u3002\u6838\u5fc3\u5305\u62ec\uff1a\u4efb\u52a1\u5206\u89e3\u4e0e\u6307\u4ee4\u8bbe\u8ba1\u3001\u4e0a\u4e0b\u6587\u7ba1\u7406\u3001\u8f93\u51fa\u683c\u5f0f\u63a7\u5236\u3001Few-shot\u793a\u4f8b\u6784\u9020\u7b49\u3002\u5168\u5c97\u4f4d\u5fc5\u4fee\u3002",
  },
  "\u667a\u80fd\u4f53": {
    short: "\u8bbe\u8ba1\u3001\u914d\u7f6e\u548c\u7ba1\u7406AI\u667a\u80fd\u4f53\uff08Agent\uff09\u7684\u80fd\u529b",
    detail: "\u667a\u80fd\u4f53\u662f\u5177\u5907\u81ea\u4e3b\u51b3\u7b56\u548c\u6267\u884c\u80fd\u529b\u7684AI\u7cfb\u7edf\u3002\u6838\u5fc3\u5305\u62ec\uff1aAgent\u67b6\u6784\u7406\u89e3\uff08\u611f\u77e5\u2192\u89c4\u5212\u2192\u6267\u884c\u2192\u53cd\u9988\uff09\u3001\u5de5\u5177\u94fe\u914d\u7f6e\u3001\u8bb0\u5fc6\u7ba1\u7406\u3001\u591aAgent\u534f\u4f5c\u7f16\u6392\u3002\u7ba1\u7406\u5c42\u548c\u4ea7\u54c1\u7ecf\u7406\u5c24\u5176\u9700\u8981\u3002",
  },
  "\u5de5\u4f5c\u6d41": {
    short: "\u5c06\u91cd\u590d\u6027\u4e1a\u52a1\u6d41\u7a0b\u901a\u8fc7AI+\u81ea\u52a8\u5316\u5de5\u5177\u5b9e\u73b0\u7aef\u5230\u7aef\u81ea\u52a8\u6267\u884c",
    detail: "\u6838\u5fc3\u5305\u62ec\uff1a\u6d41\u7a0b\u8bc6\u522b\u4e0e\u5206\u6790\uff08\u54ea\u4e9b\u6d41\u7a0b\u9002\u5408\u81ea\u52a8\u5316\uff09\u3001\u81ea\u52a8\u5316\u5de5\u5177\u9009\u578b\uff08n8n/Zapier/\u5f71\u5200RPA\u7b49\uff09\u3001\u89e6\u53d1\u6761\u4ef6\u8bbe\u8ba1\u3001\u5f02\u5e38\u5904\u7406\u673a\u5236\u3002\u51e0\u4e4e\u6240\u6709\u5c97\u4f4d\u90fd\u6709\u53ef\u81ea\u52a8\u5316\u7684\u91cd\u590d\u6027\u5de5\u4f5c\u3002",
  },
  "\u6c1b\u56f4\u7f16\u7a0b": {
    short: "\u901a\u8fc7\u81ea\u7136\u8bed\u8a00\u63cf\u8ff0\u9700\u6c42\uff0c\u501f\u52a9AI\u7f16\u7a0b\u52a9\u624b\u751f\u6210\u3001\u8c03\u8bd5\u548c\u4f18\u5316\u4ee3\u7801",
    detail: "\u6838\u5fc3\u4e0d\u662f\u201c\u5b66\u4f1a\u7f16\u7a0b\u8bed\u8a00\u201d\uff0c\u800c\u662f\u5b66\u4f1a\u7528\u81ea\u7136\u8bed\u8a00\u7cbe\u786e\u63cf\u8ff0\u6280\u672f\u9700\u6c42\uff0c\u5e76\u80fd\u5ba1\u6838AI\u751f\u6210\u7684\u4ee3\u7801\u662f\u5426\u6b63\u786e\u3002\u8fd9\u662f\u4e00\u79cd\u201c\u4e0d\u5199\u4ee3\u7801\u4f46\u80fd\u9a7e\u9a6d\u4ee3\u7801\u201d\u7684\u65b0\u578b\u6280\u672f\u80fd\u529b\u3002",
  },
  "\u4eba\u5de5\u667a\u80fd\u7b80\u53f2": {
    short: "\u4e86\u89e3AI\u53d1\u5c55\u5386\u7a0b\u3001\u5173\u952e\u91cc\u7a0b\u7891\u548c\u6280\u672f\u6f14\u8fdb\u8109\u7edc",
    detail: "\u4ece1956\u5e74\u8fbe\u7279\u8305\u65af\u4f1a\u8bae\u5230\u4eca\u5929\u7684\u5927\u8bed\u8a00\u6a21\u578b\uff0c\u4e86\u89e3AI\u7684\u4e09\u6b21\u6d6a\u6f6e\u3001\u4e24\u6b21\u5bd2\u51ac\u548c\u5f53\u524d\u7684\u7a81\u7834\u3002\u8fd9\u5e2e\u52a9\u4ece\u4e1a\u8005\u7406\u89e3AI\u6280\u672f\u7684\u53d1\u5c55\u89c4\u5f8b\uff0c\u907f\u514d\u5bf9AI\u7684\u8fc7\u5ea6\u795e\u5316\u6216\u8fc7\u5ea6\u6050\u60e7\u3002",
  },
  "AI\u6838\u5fc3\u6280\u672f\u4e0e\u5173\u952e\u7406\u8bba": {
    short: "\u7406\u89e3\u673a\u5668\u5b66\u4e60\u3001\u6df1\u5ea6\u5b66\u4e60\u3001\u5927\u8bed\u8a00\u6a21\u578b\u7b49\u6838\u5fc3\u6280\u672f\u539f\u7406",
    detail: "\u4e0d\u9700\u8981\u6210\u4e3a\u6280\u672f\u4e13\u5bb6\uff0c\u4f46\u9700\u8981\u7406\u89e3\u6838\u5fc3\u6982\u5ff5\uff1a\u795e\u7ecf\u7f51\u7edc\u5982\u4f55\u5b66\u4e60\u3001Transformer\u67b6\u6784\u4e3a\u4f55\u91cd\u8981\u3001\u5927\u6a21\u578b\u7684\u6d8c\u73b0\u80fd\u529b\u3001\u591a\u6a21\u6001\u878d\u5408\u7684\u8d8b\u52bf\u3002\u8fd9\u5e2e\u52a9\u5224\u65adAI\u80fd\u529b\u8fb9\u754c\u548c\u672a\u6765\u53d1\u5c55\u65b9\u5411\u3002",
  },
  "AI\u5546\u4e1a\u5e94\u7528\u4e0e\u6218\u7565\u8f6c\u578b": {
    short: "\u4e86\u89e3AI\u5728\u5404\u884c\u4e1a\u7684\u5546\u4e1a\u5e94\u7528\u6a21\u5f0f\u548c\u4f01\u4e1aAI\u6218\u7565\u8f6c\u578b\u8def\u5f84",
    detail: "\u6838\u5fc3\u5305\u62ec\uff1aAI\u5728\u91d1\u878d/\u533b\u7597/\u5236\u9020/\u96f6\u552e\u7b49\u884c\u4e1a\u7684\u5178\u578b\u5e94\u7528\u573a\u666f\u3001\u4f01\u4e1aAI\u6218\u7565\u89c4\u5212\u6846\u67b6\u3001\u6570\u5b57\u5316\u8f6c\u578b\u8def\u5f84\u3001AI\u6295\u8d44\u56de\u62a5\u8bc4\u4f30\u65b9\u6cd5\u3002\u5e2e\u52a9\u4ece\u4e1a\u8005\u4ece\u201c\u77e5\u9053AI\u201d\u5230\u201c\u7528\u597dAI\u201d\u7684\u8f6c\u53d8\u3002",
  },
  "\u4eba\u5de5\u667a\u80fd\u4f26\u7406": {
    short: "AI\u7cfb\u7edf\u7684\u516c\u5e73\u6027\u3001\u900f\u660e\u6027\u3001\u53ef\u89e3\u91ca\u6027\u548c\u95ee\u8d23\u5236",
    detail: "\u6838\u5fc3\u95ee\u9898\uff1aAI\u51b3\u7b56\u662f\u5426\u5b58\u5728\u504f\u89c1\uff1f\u63a8\u7406\u8fc7\u7a0b\u662f\u5426\u53ef\u89e3\u91ca\uff1f\u5f53AI\u72af\u9519\u65f6\u8c01\u6765\u8d1f\u8d23\uff1f\u5982\u4f55\u786e\u4fddAI\u589e\u5f3a\u800c\u975e\u524a\u5f31\u4eba\u7684\u81ea\u4e3b\u6027\uff1f\u8fd9\u4e0d\u662f\u53ef\u9009\u7684\u201c\u8f6f\u6027\u57f9\u8bad\u201d\uff0c\u800c\u662fAI\u65f6\u4ee3\u7684\u5408\u89c4\u521a\u9700\u3002",
  },
  "AI\u5b89\u5168\u3001\u9690\u79c1\u4e0e\u5408\u89c4\u610f\u8bc6": {
    short: "AI\u7cfb\u7edf\u7684\u6280\u672f\u5b89\u5168\u6027\u3001\u6570\u636e\u9690\u79c1\u4fdd\u62a4\u548c\u6cd5\u89c4\u5408\u89c4",
    detail: "\u6838\u5fc3\u5305\u62ec\uff1a\u6700\u5c0f\u6743\u9650\u539f\u5219\u3001\u4eba\u7c7b\u76d1\u7763\u3001\u6545\u969c\u5b89\u5168\u964d\u7ea7\u3001\u4e2a\u4eba\u4fe1\u606f\u4fdd\u62a4\uff08GDPR/\u300a\u4e2a\u4eba\u4fe1\u606f\u4fdd\u62a4\u6cd5\u300b\uff09\u3001\u6570\u636e\u6700\u5c0f\u5316\u539f\u5219\u3001\u77e5\u60c5\u540c\u610f\u3001\u6570\u636e\u8de8\u5883\u4f20\u8f93\u5408\u89c4\u3001AI\u751f\u6210\u5185\u5bb9\u7684\u7248\u6743\u5f52\u5c5e\u3002\u8d8a\u6765\u8d8a\u591a\u56fd\u5bb6\u6b63\u5728\u51fa\u53f0AI\u6cbb\u7406\u6cd5\u89c4\u3002",
  },
};

// ─── Course Links Mapping (aiready.hrflag.com) ──────────────
const COURSE_LINKS: Record<string, { slug: string; label: string }> = {
  "\u7b2c\u4e00\u6027\u601d\u7ef4": { slug: "first-principles", label: "\u7b2c\u4e00\u6027\u601d\u7ef4" },
  "\u6279\u5224\u601d\u7ef4": { slug: "critical-thinking", label: "\u6279\u5224\u601d\u7ef4" },
  "\u7cfb\u7edf\u601d\u7ef4": { slug: "systems-thinking", label: "\u7cfb\u7edf\u601d\u7ef4" },
  "\u62bd\u8c61\u601d\u7ef4": { slug: "abstract-thinking", label: "\u62bd\u8c61\u601d\u7ef4" },
  "\u5f00\u653e\u601d\u7ef4\u4e0e\u6210\u957f\u5fc3\u667a": { slug: "growth-mindset", label: "\u5f00\u653e\u601d\u7ef4\u4e0e\u6210\u957f\u5fc3\u667a" },
  "\u8bbe\u8ba1\u601d\u7ef4": { slug: "design-thinking", label: "\u8bbe\u8ba1\u601d\u7ef4" },
  "\u4eba\u673a\u6c9f\u901a\uff08\u63d0\u793a\u8bcd\u5de5\u7a0b\uff09": { slug: "prompt-engineering", label: "\u4eba\u673a\u6c9f\u901a" },
  "\u4eba\u673a\u6c9f\u901a": { slug: "prompt-engineering", label: "\u4eba\u673a\u6c9f\u901a" },
  "\u63d0\u793a\u8bcd\u5de5\u7a0b": { slug: "prompt-engineering", label: "\u63d0\u793a\u8bcd\u5de5\u7a0b" },
  "\u667a\u80fd\u4f53": { slug: "ai-agents", label: "\u667a\u80fd\u4f53" },
  "\u5de5\u4f5c\u6d41": { slug: "workflow", label: "\u5de5\u4f5c\u6d41" },
  "\u6c1b\u56f4\u7f16\u7a0b": { slug: "vibe-coding", label: "\u6c1b\u56f4\u7f16\u7a0b" },
  "\u4eba\u5de5\u667a\u80fd\u7b80\u53f2": { slug: "ai-history", label: "\u4eba\u5de5\u667a\u80fd\u7b80\u53f2" },
  "AI\u6838\u5fc3\u6280\u672f\u4e0e\u5173\u952e\u7406\u8bba": { slug: "ai-core-tech", label: "AI\u6838\u5fc3\u6280\u672f" },
  "AI\u5546\u4e1a\u5e94\u7528\u4e0e\u6218\u7565\u8f6c\u578b": { slug: "ai-business", label: "AI\u5546\u4e1a\u5e94\u7528" },
  "\u4eba\u5de5\u667a\u80fd\u4f26\u7406": { slug: "ai-ethics", label: "\u4eba\u5de5\u667a\u80fd\u4f26\u7406" },
  "AI\u5b89\u5168\u3001\u9690\u79c1\u4e0e\u5408\u89c4\u610f\u8bc6": { slug: "ai-safety-compliance", label: "AI\u5b89\u5168\u5408\u89c4" },
};

const AIREADY_BASE_URL = "https://aiready.hrflag.com/module-intro/";

function getCourseLink(name: string): { url: string; label: string } | null {
  if (!name || typeof name !== "string") return null;
  // Direct match
  if (COURSE_LINKS[name]) {
    return { url: AIREADY_BASE_URL + COURSE_LINKS[name].slug, label: COURSE_LINKS[name].label };
  }
  // Fuzzy match
  for (const [key, val] of Object.entries(COURSE_LINKS)) {
    if (name.includes(key) || key.includes(name) || name.replace(/[\uff08\uff09()]/g, "").includes(key.replace(/[\uff08\uff09()]/g, ""))) {
      return { url: AIREADY_BASE_URL + val.slug, label: val.label };
    }
  }
  return null;
}

// ─── Priority color helpers ──────────────────────────────────
function getPriorityColor(priority: string): string {
  if (!priority) return "text-emerald-400";
  if (priority.includes("\u7acb\u5373")) return "text-red-400";
  if (priority.includes("\u7b2c\u4e00")) return "text-amber-400";
  if (priority.includes("\u7b2c\u4e8c")) return "text-blue-400";
  return "text-emerald-400";
}

function getPriorityBg(priority: string): string {
  if (!priority) return "bg-emerald-500/10 border-emerald-500/20";
  if (priority.includes("\u7acb\u5373")) return "bg-red-500/10 border-red-500/20";
  if (priority.includes("\u7b2c\u4e00")) return "bg-amber-500/10 border-amber-500/20";
  if (priority.includes("\u7b2c\u4e8c")) return "bg-blue-500/10 border-blue-500/20";
  return "bg-emerald-500/10 border-emerald-500/20";
}

function getPriorityBadge(priority: string): string {
  if (!priority) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
  if (priority.includes("\u7acb\u5373")) return "bg-red-500/20 text-red-300 border-red-500/30";
  if (priority.includes("\u7b2c\u4e00")) return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  if (priority.includes("\u7b2c\u4e8c")) return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
}

// ─── Demand level label ─────────────────────────────────────
function getDemandLabel(level: number): string {
  const labels = ["", "\u51e0\u4e4e\u4e0d\u9700\u8981", "\u5076\u5c14\u9700\u8981", "\u7ecf\u5e38\u9700\u8981", "\u9ad8\u5ea6\u4f9d\u8d56", "\u6838\u5fc3\u5fc5\u5907"];
  return labels[Math.min(5, Math.max(1, Math.round(level)))] || "";
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export function TrainingCompetency({ data }: TrainingCompetencyProps) {
  const isMobile = useIsMobileOrTablet();
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
  const [showTermDetail, setShowTermDetail] = useState<string | null>(null);

  const adapted = useMemo(() => adaptTrainingData(data), [data]);
  if (!adapted) return null;

  const { dimensionSummary, competencies, priorityRanking, quarterlyPlan, overallReadiness, overallSummary } = adapted;

  // Group competencies by dimension
  const grouped = useMemo(() => {
    const map = new Map<string, Competency[]>();
    for (const c of competencies) {
      const meta = getDimensionMeta(c.dimension);
      const key = meta.key;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [competencies]);

  return (
    <div className="space-y-8">
      {/* ── Overall Readiness + Summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 flex flex-col items-center justify-center">
          <p className="text-xs text-muted-foreground mb-2">{"\u8f6c\u578b\u80fd\u529b\u5c31\u7eea\u5ea6"}</p>
          <ReadinessGauge value={overallReadiness} />
        </div>
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-2">{"\u57f9\u8bad\u603b\u89c8"}</p>
          <p className="text-sm text-foreground leading-relaxed">{overallSummary}</p>
          <div className="grid grid-cols-4 gap-2 mt-4">
            {(dimensionSummary || []).map((ds, i) => {
              const meta = getDimensionMeta(ds.dimension);
              const Icon = meta.icon;
              return (
                <div key={i} className={`rounded-lg p-2.5 border ${meta.bg} border-white/[0.06] text-center`}>
                  <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: meta.color }} />
                  <p className="text-[10px] text-muted-foreground truncate">{ds.dimension.replace("\u8bad\u7ec3", "").replace("\u5b66\u4e60", "")}</p>
                  <p className="text-sm font-bold" style={{ color: meta.color }}>{(ds.avgPreTransform ?? 0).toFixed(1)}<span className="text-[10px] text-muted-foreground">{"\u2192"}{(ds.avgPostTransform ?? 0).toFixed(1)}</span></p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Four-Dimension Radar Chart ── */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />{"\u5c97\u4f4d\u9700\u6c42\u5ea6\u53d8\u5316\uff08\u8f6c\u578b\u524d vs \u8f6c\u578b\u540e\uff09"}
        </h4>
        <FourDimensionRadar dimensionSummary={dimensionSummary} isMobile={isMobile} />
      </div>

      {/* ── Dimension Sections with Competency Cards ── */}
      {Array.from(grouped.entries()).map(([dimKey, comps], dimIdx) => {
        const meta = getDimensionMeta(dimKey);
        const Icon = meta.icon;
        const isExpanded = expandedDimension === dimKey || expandedDimension === null;

        return (
          <motion.div
            key={dimKey}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...springPresets.gentle, delay: dimIdx * 0.05 }}
          >
            <div
              className={`bg-gradient-to-br ${meta.gradient} border border-white/[0.06] rounded-xl overflow-hidden`}
            >
              {/* Dimension Header */}
              <button
                onClick={() => setExpandedDimension(expandedDimension === dimKey ? null : dimKey)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: meta.color + "20" }}>
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-foreground">{dimKey}</h4>
                    <p className="text-xs text-muted-foreground">{comps.length}{"\u9879\u80fd\u529b \u00b7 \u5e73\u5747\u9700\u6c42\u589e\u957f "}{(comps.reduce((s, c) => s + (c.demandGrowth ?? 0), 0) / (comps.length || 1)).toFixed(1)}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {/* Competency Cards */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {comps.map((comp, ci) => (
                        <CompetencyCard
                          key={ci}
                          comp={comp}
                          dimColor={meta.color}
                          showTermDetail={showTermDetail}
                          onToggleTerm={(name) => setShowTermDetail(showTermDetail === name ? null : name)}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}

      {/* ── Priority Ranking ── */}
      {priorityRanking && priorityRanking.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />{"\u57f9\u8bad\u4f18\u5148\u7ea7\u6392\u5e8f"}
          </h4>
          <div className="space-y-2">
            {priorityRanking.slice(0, 10).map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 p-3 rounded-lg border ${getPriorityBg(item.priority || '')}`}
              >
                <span className="text-lg font-bold text-muted-foreground w-6 text-center">{item.rank}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{item.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getPriorityBadge(item.priority || '')}`}>{item.priority || '延后培训'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.reason}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quarterly Training Timeline ── */}
      {quarterlyPlan && quarterlyPlan.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />{"\u5b63\u5ea6\u57f9\u8bad\u65f6\u95f4\u89c4\u5212"}
          </h4>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />
            <div className="space-y-6">
              {quarterlyPlan.map((qp, qi) => (
                <motion.div
                  key={qi}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: qi * 0.1 }}
                  className="relative pl-10"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  <div className="bg-muted/30 border border-white/[0.06] rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-primary px-2 py-0.5 rounded bg-primary/10">{qp.quarter}</span>
                      <span className="text-xs text-muted-foreground">{qp.focus}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {qp.items.map((item, ii) => (
                        <span key={ii} className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-foreground/80">{item}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ReadinessGauge({ value }: { value: number }) {
  const safeVal = Math.min(100, Math.max(0, Math.round(value)));
  const color = safeVal >= 70 ? "#34D399" : safeVal >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke={IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)"} strokeWidth="8" />
        <circle
          cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${(safeVal / 100) * 264} 264`}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{safeVal}%</span>
      </div>
    </div>
  );
}

function FourDimensionRadar({ dimensionSummary, isMobile }: { dimensionSummary: DimensionSummary[]; isMobile: boolean }) {
  const option = useMemo(() => {
    if (!dimensionSummary || dimensionSummary.length === 0) return {};

    const indicators = dimensionSummary.map(ds => ({
      name: ds.dimension.replace("\u8bad\u7ec3", "").replace("\u5b66\u4e60", ""),
      max: 5,
    }));

    return {
      tooltip: { trigger: "item" },
      legend: {
        data: ["\u8f6c\u578b\u524d\u9700\u6c42\u5ea6", "\u8f6c\u578b\u540e\u9700\u6c42\u5ea6"],
        bottom: 0,
        textStyle: { color: IS_PRINT_MODE ? "#333" : "#6B6B80", fontSize: 11 },
      },
      radar: {
        indicator: indicators,
        radius: isMobile ? "55%" : "65%",
        center: ["50%", "45%"],
        axisName: {
          color: IS_PRINT_MODE ? "#333" : "#9CA3AF",
          fontSize: isMobile ? 10 : 12,
        },
        splitArea: { areaStyle: { color: IS_PRINT_MODE ? ["rgba(0,0,0,0.02)", "rgba(0,0,0,0.04)"] : ["rgba(255,255,255,0.02)", "rgba(255,255,255,0.04)"] } },
        splitLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)" } },
        axisLine: { lineStyle: { color: IS_PRINT_MODE ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)" } },
      },
      series: [
        {
          type: "radar",
          data: [
            {
              name: "\u8f6c\u578b\u524d\u9700\u6c42\u5ea6",
              value: dimensionSummary.map(ds => ds.avgPreTransform),
              areaStyle: { color: "rgba(96,165,250,0.15)" },
              lineStyle: { color: "#60A5FA", width: 2 },
              itemStyle: { color: "#60A5FA" },
              symbol: "circle",
              symbolSize: 6,
            },
            {
              name: "\u8f6c\u578b\u540e\u9700\u6c42\u5ea6",
              value: dimensionSummary.map(ds => ds.avgPostTransform),
              areaStyle: { color: "rgba(52,211,153,0.12)" },
              lineStyle: { color: "#34D399", width: 2, type: "dashed" },
              itemStyle: { color: "#34D399" },
              symbol: "diamond",
              symbolSize: 6,
            },
          ],
        },
      ],
    };
  }, [dimensionSummary, isMobile]);

  if (!dimensionSummary || dimensionSummary.length === 0) return null;

  return <ReactECharts option={option} style={{ height: isMobile ? 260 : 320 }} opts={{ renderer: "svg" }} />;
}

function CompetencyCard({
  comp,
  dimColor,
  showTermDetail,
  onToggleTerm,
}: {
  comp: Competency;
  dimColor: string;
  showTermDetail: string | null;
  onToggleTerm: (name: string) => void;
}) {
  const prePct = (comp.preTransformDemand / 5) * 100;
  const postPct = (comp.postTransformDemand / 5) * 100;
  const compName = typeof comp.name === "string" ? comp.name : "";
  const termInfo = TERM_EXPLANATIONS[compName] || TERM_EXPLANATIONS[compName.replace("\uff08", "(").replace("\uff09", ")")] || null;
  const isTermExpanded = showTermDetail === compName;

  // Try fuzzy match for term
  const fuzzyTermInfo = useMemo(() => {
    if (termInfo) return termInfo;
    if (!compName) return null;
    for (const [key, val] of Object.entries(TERM_EXPLANATIONS)) {
      if (compName.includes(key) || key.includes(compName) || compName.replace(/[\uff08\uff09()]/g, "").includes(key.replace(/[\uff08\uff09()]/g, ""))) {
        return val;
      }
    }
    return null;
  }, [compName, termInfo]);

  return (
    <div className="bg-background/40 border border-white/[0.06] rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{comp.name}</span>
          {fuzzyTermInfo && (
            <button
              onClick={() => onToggleTerm(comp.name)}
              className="text-muted-foreground hover:text-primary transition-colors"
              title={"\u67e5\u770b\u672f\u8bed\u89e3\u91ca"}
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getPriorityBadge(comp.priority || '')}`}>{comp.priority || '延后培训'}</span>
      </div>

      {/* Term Explanation Popover */}
      <AnimatePresence>
        {isTermExpanded && fuzzyTermInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mb-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs font-medium text-primary mb-1">{fuzzyTermInfo.short}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{fuzzyTermInfo.detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Bars */}
      <div className="space-y-1.5 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-10 shrink-0">{"\u8f6c\u578b\u524d"}</span>
          <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${prePct}%`, backgroundColor: "#60A5FA" }}
            />
          </div>
          <span className="text-xs font-medium text-foreground w-5 text-right">{comp.preTransformDemand}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-10 shrink-0">{"\u8f6c\u578b\u540e"}</span>
          <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${postPct}%`, backgroundColor: "#34D399" }}
            />
          </div>
          <span className="text-xs font-medium text-foreground w-5 text-right">{comp.postTransformDemand}</span>
        </div>
      </div>

      {/* Demand Growth indicator */}
      {comp.demandGrowth > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <ArrowRight className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-amber-400">{"\u9700\u6c42\u589e\u957f "}{comp.demandGrowth}{" \u7ea7\uff08"}{getDemandLabel(comp.preTransformDemand)}{" \u2192 "}{getDemandLabel(comp.postTransformDemand)}{"\uff09"}</span>
        </div>
      )}
      {comp.demandGrowth === 0 && (
        <div className="flex items-center gap-1 mb-2">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400">{"\u9700\u6c42\u65e0\u53d8\u5316"}</span>
        </div>
      )}

      {/* Training Advice */}
      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{comp.trainingAdvice}</p>

      {/* Course Link */}
      {(() => {
        const courseLink = getCourseLink(comp.name);
        if (!courseLink) return null;
        return (
          <a
            href={courseLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors mb-2"
          >
            <GraduationCap className="w-3 h-3" />
            {"\u524d\u5f80\u5b66\u4e60\uff1a"}{courseLink.label}
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        );
      })()}

      {/* Resources */}
      {comp.resources && comp.resources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {comp.resources.map((res, ri) => (
            <span
              key={ri}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-foreground/70"
            >
              <GraduationCap className="w-2.5 h-2.5" />
              {res.name}
              <span className="text-muted-foreground">{"\u00b7 "}{res.platform}</span>
              {res.isFree && <span className="text-emerald-400">{"\u514d\u8d39"}</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
