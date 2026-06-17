import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Palette, Type, Image, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const COLOR_PRESETS = [
  { name: "翠绿科技", primary: "#4ADE80", accent: "#22C55E" },
  { name: "深海蓝", primary: "#38BDF8", accent: "#0EA5E9" },
  { name: "星空紫", primary: "#A78BFA", accent: "#8B5CF6" },
  { name: "暖阳橙", primary: "#FB923C", accent: "#F97316" },
  { name: "玫瑰红", primary: "#FB7185", accent: "#F43F5E" },
];

export default function BrandSettings() {
  const { data: brand, isLoading } = trpc.brand.get.useQuery();
  const saveMutation = trpc.brand.save.useMutation({
    onSuccess: () => toast.success("品牌设置已保存"),
    onError: () => toast.error("保存失败，请重试"),
  });

  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#4ADE80");
  const [footerText, setFooterText] = useState("");

  useEffect(() => {
    if (brand) {
      setLogoUrl(brand.logoUrl || "");
      setPrimaryColor(brand.primaryColor || "#4ADE80");
      setFooterText(brand.footerText || "");
    }
  }, [brand]);

  const handleSave = () => {
    saveMutation.mutate({ logoUrl: logoUrl || undefined, primaryColor, footerText: footerText || undefined });
  };

  const handleReset = () => {
    setLogoUrl("");
    setPrimaryColor("#4ADE80");
    setFooterText("");
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl text-metallic mb-2">品牌定制</h1>
        <p className="text-sm text-muted-foreground">自定义报告中的品牌元素，包括Logo、主题色和页脚信息</p>
      </div>

      <div className="space-y-6">
        {/* Logo */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Image className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">企业Logo</h3>
              <p className="text-xs text-muted-foreground">输入Logo图片URL，将展示在报告头部</p>
            </div>
          </div>
          <input
            type="url"
            value={logoUrl}
            onChange={e => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full bg-muted/30 border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
          {logoUrl && (
            <div className="mt-3 p-3 bg-muted/20 rounded-lg border border-white/[0.04]">
              <p className="text-xs text-muted-foreground mb-2">预览：</p>
              <img src={logoUrl} alt="Logo预览" className="h-10 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
            </div>
          )}
        </div>

        {/* Primary Color */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Palette className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">主题色</h3>
              <p className="text-xs text-muted-foreground">选择预设或自定义颜色</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mb-4">
            {COLOR_PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => setPrimaryColor(preset.primary)}
                className={"flex items-center gap-2 px-3 py-2 rounded-lg border transition-all " + (primaryColor === preset.primary ? "border-primary bg-primary/10" : "border-white/[0.06] hover:border-white/[0.12]")}
              >
                <div className="w-4 h-4 rounded-full" style={{ background: preset.primary }} />
                <span className="text-xs text-foreground">{preset.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-white/[0.06] cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="flex-1 bg-muted/30 border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <div className="w-20 h-10 rounded-lg" style={{ background: primaryColor }} />
          </div>
        </div>

        {/* Footer Text */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Type className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">报告页脚</h3>
              <p className="text-xs text-muted-foreground">自定义报告底部的版权或声明文字</p>
            </div>
          </div>
          <textarea
            value={footerText}
            onChange={e => setFooterText(e.target.value)}
            placeholder="例如：© 2026 XX公司 · 仅供内部使用"
            rows={3}
            className="w-full bg-muted/30 border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RotateCcw className="w-4 h-4" />重置
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending} className="gap-2">
            <Save className="w-4 h-4" />{saveMutation.isPending ? "保存中..." : "保存设置"}
          </Button>
        </div>
      </div>
    </div>
  );
}
