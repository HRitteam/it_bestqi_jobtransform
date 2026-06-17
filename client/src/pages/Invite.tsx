import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { motion } from "framer-motion";
import { springPresets } from "@/hooks/useSpring";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const params = useParams<{ code: string }>();
  const code = params.code || "";
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "accepting" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const acceptMutation = trpc.invitation.accept.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        setStatus("success");
        setMessage("邀请接受成功！您和邀请人都将获得额外权益。");
        toast.success("邀请接受成功");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setStatus("error");
        setMessage(result.message || "邀请码无效");
        toast.error(result.message || "邀请码无效");
      }
    },
    onError: (err) => {
      setStatus("error");
      setMessage(err.message || "接受邀请失败");
      toast.error("接受邀请失败");
    },
  });

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      // Store invite code and redirect to login
      sessionStorage.setItem("pendingInviteCode", code);
      window.location.href = getLoginUrl();
      return;
    }

    // User is logged in, accept the invitation
    if (code && status === "loading") {
      setStatus("accepting");
      acceptMutation.mutate({ inviteCode: code });
    }
  }, [isAuthenticated, loading, code]);

  // Also check on mount if there's a pending invite from before login
  useEffect(() => {
    if (!isAuthenticated || loading) return;
    const pending = sessionStorage.getItem("pendingInviteCode");
    if (pending && !code) {
      sessionStorage.removeItem("pendingInviteCode");
      setStatus("accepting");
      acceptMutation.mutate({ inviteCode: pending });
    }
  }, [isAuthenticated, loading]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={springPresets.gentle}
        className="text-center max-w-sm"
      >
        {status === "loading" || status === "accepting" ? (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
            <h2 className="text-lg font-semibold text-foreground mb-2">正在处理邀请...</h2>
            <p className="text-sm text-muted-foreground">邀请码: {code}</p>
          </>
        ) : status === "success" ? (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">邀请接受成功</h2>
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
            <Button onClick={() => navigate("/")}>开始使用</Button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <Gift className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">邀请处理失败</h2>
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
            <Button onClick={() => navigate("/")}>返回首页</Button>
          </>
        )}
      </motion.div>
    </div>
  );
}
