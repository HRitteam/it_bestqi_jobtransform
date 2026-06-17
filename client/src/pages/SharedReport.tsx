import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { springPresets } from "@/hooks/useSpring";
import { Brain, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 分享报告跳转页面
 * URL格式: /share/:token
 * 通过 shareToken 查找报告，然后跳转到 /report/:reportId?token=:token
 */
export default function SharedReport() {
  const params = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const token = params.token || "";

  const { data: report, isLoading, error } = trpc.report.getByShareToken.useQuery(
    { token },
    { enabled: !!token, retry: 1 }
  );

  useEffect(() => {
    if (report && report.reportId) {
      // 找到报告，跳转到报告页面并携带token
      setLocation(`/report/${report.reportId}?token=${token}`);
    }
  }, [report, token, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Brain className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springPresets.gentle}
        className="min-h-[60vh] flex items-center justify-center"
      >
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">分享链接无效</h2>
          <p className="text-sm text-muted-foreground mb-4">
            该分享链接可能已过期或不存在
          </p>
          <Button onClick={() => setLocation("/")}>返回首页</Button>
        </div>
      </motion.div>
    );
  }

  // 正在跳转中（report已找到，useEffect会处理跳转）
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Brain className="w-8 h-8 text-primary" />
      </motion.div>
    </div>
  );
}
