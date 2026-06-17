import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ThumbsUp, ThumbsDown, Star, Send } from "lucide-react";

interface ReportFeedbackProps {
  reportId: string;
  chapterIndex?: number;
  mode?: "chapter" | "overall";
}

export function ReportFeedback({ reportId, chapterIndex, mode = "chapter" }: ReportFeedbackProps) {
  const [thumbs, setThumbs] = useState<"up" | "down" | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      toast.success("感谢您的反馈！");
      setSubmitted(true);
    },
    onError: () => toast.error("提交失败，请重试"),
  });

  const handleSubmit = () => {
    submitFeedback.mutate({
      reportId,
      chapterIndex: chapterIndex ?? undefined,
      rating: mode === "overall" ? stars : (thumbs === "up" ? 5 : thumbs === "down" ? 1 : 3),
      comment: comment || undefined,
    });
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-400">
        <ThumbsUp className="w-4 h-4" />
        <span>已收到反馈，感谢！</span>
      </div>
    );
  }

  if (mode === "chapter") {
    return (
      <div className="flex items-center gap-2">
        <Button size="icon" variant={thumbs === "up" ? "default" : "ghost"} className="w-7 h-7" onClick={() => { setThumbs("up"); handleSubmit(); }}>
          <ThumbsUp className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant={thumbs === "down" ? "default" : "ghost"} className="w-7 h-7" onClick={() => { setThumbs("down"); handleSubmit(); }}>
          <ThumbsDown className="w-3.5 h-3.5" />
        </Button>
      </div>
    );
  }

  // Overall mode with stars
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="text-sm font-medium">为本报告评分</div>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} onClick={() => setStars(i)} className="p-0.5">
            <Star className={`w-5 h-5 transition-colors ${i <= stars ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`} />
          </button>
        ))}
        {stars > 0 && <span className="text-sm text-muted-foreground ml-2">{stars}/5</span>}
      </div>
      <Textarea placeholder="有什么建议或意见？（可选）" value={comment} onChange={e => setComment(e.target.value)} className="min-h-[60px] text-sm" />
      <Button size="sm" onClick={handleSubmit} disabled={stars === 0 || submitFeedback.isPending}>
        <Send className="w-3.5 h-3.5 mr-1" />{submitFeedback.isPending ? "提交中..." : "提交反馈"}
      </Button>
    </div>
  );
}
