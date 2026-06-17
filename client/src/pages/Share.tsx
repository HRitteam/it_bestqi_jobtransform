import { motion } from "framer-motion";
import { springPresets } from "@/hooks/useSpring";
import { Share2, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SharePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={springPresets.gentle}
      className="p-4 md:p-8 max-w-5xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <Share2 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">分享中心</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invite Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">邀请好友</h3>
              <p className="text-sm text-muted-foreground">邀请3位好友解锁高级模板</p>
            </div>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">已邀请</span>
              <span className="text-foreground font-medium">0 / 3</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full w-0 transition-all" />
            </div>
          </div>
          <Button className="w-full" variant="outline">
            复制邀请链接
          </Button>
        </div>

        {/* Rewards Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Gift className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">奖励中心</h3>
              <p className="text-sm text-muted-foreground">查看可解锁的高级功能</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">深色科技风PPT模板</span>
              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">锁定</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">无水印PDF导出</span>
              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">锁定</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">批量处理功能</span>
              <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">锁定</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
