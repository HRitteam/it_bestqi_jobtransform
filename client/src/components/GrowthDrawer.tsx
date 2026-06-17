import { motion, AnimatePresence } from "framer-motion";
import { springPresets } from "@/hooks/useSpring";
import { Button } from "@/components/ui/button";
import { X, Gift, Users, Copy, Check, Sparkles, Lock } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface GrowthDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function GrowthDrawer({ open, onClose }: GrowthDrawerProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  const { data: stats } = trpc.user.stats.useQuery(undefined, { enabled: !!user });
  const createInvite = trpc.invitation.create.useMutation();

  const handleCreateInvite = async () => {
    try {
      const { code } = await createInvite.mutateAsync();
      const url = `${window.location.origin}?invite=${code}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const proFeatures = [
    { name: "无水印PDF导出", locked: true },
    { name: "PPT演示文稿导出", locked: true },
    { name: "批量岗位分析", locked: true },
    { name: "自定义报告模板", locked: true },
    { name: "优先AI处理队列", locked: true },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={springPresets.snappy}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-card border-l border-border z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">解锁更多</h2>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Invite Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Gift className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">邀请好友</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  每邀请1位好友注册，双方各获得3次免费分析额度
                </p>

                {/* Progress */}
                <div className="bg-muted/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">邀请进度</span>
                    <span className="text-sm font-medium text-foreground">
                      {stats?.inviteCount || 0}/5
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-success rounded-full transition-all"
                      style={{ width: `${Math.min(((stats?.inviteCount || 0) / 5) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    邀请满5人解锁 Pro 功能 7 天体验
                  </p>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={handleCreateInvite}
                  disabled={createInvite.isPending}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      已复制邀请链接
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      生成邀请链接
                    </>
                  )}
                </Button>
              </div>

              {/* Pro Features */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-warning" />
                  <h3 className="font-medium text-foreground">Pro 功能</h3>
                </div>
                <div className="space-y-2">
                  {proFeatures.map((feature, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{feature.name}</span>
                    </div>
                  ))}
                </div>

                <Button variant="outline" className="w-full mt-4 gap-2">
                  <Sparkles className="w-4 h-4" />
                  升级 Pro
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
