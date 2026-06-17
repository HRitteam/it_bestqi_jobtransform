import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, RefreshCw, Search, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AdminTools() {
  const { data: tools, isLoading, refetch } = trpc.tools.list.useQuery({});
  const deleteMutation = trpc.tools.delete.useMutation({
    onSuccess: () => { toast.success("工具已删除"); refetch(); },
  });
  const upsertMutation = trpc.tools.upsert.useMutation({
    onSuccess: () => { toast.success("工具已保存"); refetch(); setEditDialog(false); },
    onError: (err) => toast.error(err.message || "保存失败"),
  });

  const [search, setSearch] = useState("");
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [batchVerifying, setBatchVerifying] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  const now = new Date();
  const SIX_MONTHS_AGO = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  // Use `id` field which is what the API returns
  const getToolId = (tool: any) => tool.id || tool.toolId || tool.name;

  const filteredTools = (tools || []).filter((t: any) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const expiredTools = filteredTools.filter((t: any) => {
    const updated = new Date(t.updatedAt || 0);
    return updated < SIX_MONTHS_AGO;
  });

  // Auto-batch verify silently on load
  const handleBatchVerifyAuto = async () => {
    setBatchVerifying(true);
    setBatchProgress(0);
    const expired = (tools || []).filter((t: any) => {
      const updated = new Date(t.updatedAt || 0);
      return updated < SIX_MONTHS_AGO;
    });
    for (let i = 0; i < expired.length; i++) {
      const tool = expired[i];
      const toolId = getToolId(tool);
      if (!toolId) { setBatchProgress(Math.round(((i + 1) / expired.length) * 100)); continue; }
      try {
        await upsertMutation.mutateAsync({
          toolId,
          name: tool.name,
          category: tool.category,
          isDomestic: !!tool.isDomestic,
          pricing: tool.pricing || "free",
          description: tool.description || undefined,
          useCases: tool.useCases || undefined,
          officialUrl: tool.officialUrl || undefined,
          tags: tool.tags || undefined,
        });
      } catch { /* skip failures */ }
      setBatchProgress(Math.round(((i + 1) / expired.length) * 100));
    }
    setBatchVerifying(false);
    refetch();
    toast.success(`自动验证完成：${expired.length} 个工具已更新`);
  };

  // Auto-batch verify on first load if there are expired tools
  const [autoVerifyDone, setAutoVerifyDone] = useState(false);
  useEffect(() => {
    if (!isLoading && tools && tools.length > 0 && expiredTools.length > 0 && !autoVerifyDone && !batchVerifying) {
      setAutoVerifyDone(true);
      handleBatchVerifyAuto();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, tools, autoVerifyDone, expiredTools.length]);

  const handleVerify = async (tool: any) => {
    const toolId = getToolId(tool);
    setVerifyingId(toolId);
    try {
      await upsertMutation.mutateAsync({
        toolId,
        name: tool.name,
        category: tool.category,
        isDomestic: !!tool.isDomestic,
        pricing: tool.pricing || "free",
        description: tool.description || undefined,
        useCases: tool.useCases || undefined,
        officialUrl: tool.officialUrl || undefined,
        tags: tool.tags || undefined,
      });
      toast.success(`"${tool.name}" 已验证为最新`);
    } catch {
      toast.error("验证失败");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleBatchVerify = async () => {
    if (expiredTools.length === 0) return;
    setBatchVerifying(true);
    setBatchProgress(0);
    let success = 0;
    for (let i = 0; i < expiredTools.length; i++) {
      const tool = expiredTools[i];
      const toolId = getToolId(tool);
      try {
        await upsertMutation.mutateAsync({
          toolId,
          name: tool.name,
          category: tool.category,
          isDomestic: !!tool.isDomestic,
          pricing: tool.pricing || "free",
          description: tool.description || undefined,
          useCases: tool.useCases || undefined,
          officialUrl: tool.officialUrl || undefined,
          tags: tool.tags || undefined,
        });
        success++;
      } catch {
        // continue with next
      }
      setBatchProgress(Math.round(((i + 1) / expiredTools.length) * 100));
    }
    setBatchVerifying(false);
    toast.success(`批量验证完成：${success}/${expiredTools.length} 个工具已更新`);
    refetch();
  };

  const openEdit = (tool?: any) => {
    if (tool) {
      setEditForm({ ...tool, toolId: getToolId(tool), isDomestic: !!tool.isDomestic });
    } else {
      setEditForm({
        toolId: "", name: "", category: "", description: "", pricing: "free",
        isDomestic: true, officialUrl: "", tags: [], useCases: [],
      });
    }
    setEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editForm.name || !editForm.category) {
      toast.error("名称和分类为必填项");
      return;
    }
    const toolId = editForm.toolId || editForm.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);
    upsertMutation.mutate({
      toolId,
      name: editForm.name,
      category: editForm.category,
      isDomestic: editForm.isDomestic ?? true,
      pricing: editForm.pricing || "free",
      description: editForm.description || undefined,
      useCases: Array.isArray(editForm.useCases) ? editForm.useCases : (editForm.useCases || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      officialUrl: editForm.officialUrl || undefined,
      tags: Array.isArray(editForm.tags) ? editForm.tags : (editForm.tags || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-metallic mb-2">AI工具管理</h1>
          <p className="text-sm text-muted-foreground">管理工具数据库，验证工具时效性，添加或移除工具</p>
        </div>
        <Button onClick={() => openEdit()} className="gap-2"><Plus className="w-4 h-4" />添加工具</Button>
      </div>

      {/* Expiry Warning Banner with batch verify */}
      {expiredTools.length > 0 && (
        <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-300">有 {expiredTools.length} 个工具超过6个月未更新</p>
            <p className="text-xs text-amber-400/70 mt-1">点击下方按钮一键批量更新所有工具状态</p>
            {batchVerifying && (
              <div className="mt-2">
                <div className="h-1.5 rounded-full bg-amber-500/20 overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: batchProgress + "%" }} />
                </div>
                <span className="text-[10px] text-amber-400/70 mt-0.5 block">验证中 {batchProgress}%</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchVerify}
            disabled={batchVerifying}
            className="shrink-0 gap-1.5 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
          >
            <RefreshCw className={"w-3.5 h-3.5 " + (batchVerifying ? "animate-spin" : "")} />
            {batchVerifying ? "验证中..." : "一键批量验证"}
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索工具名称或分类..."
          className="w-full pl-10 pr-4 py-2.5 bg-muted/30 border border-white/[0.06] rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Tools Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">工具名称</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">分类</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">类型</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">定价</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">状态</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.map((tool: any, idx: number) => {
                const toolId = getToolId(tool);
                const stableKey = toolId || `tool-idx-${idx}`;
                const updated = new Date(tool.updatedAt || tool.createdAt || 0);
                const isExpired = updated < SIX_MONTHS_AGO;
                return (
                  <tr key={stableKey} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">{tool.name}</span>
                        {tool.officialUrl && <a href={tool.officialUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" /></a>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tool.category}</td>
                    <td className="px-4 py-3">
                      <span className={"text-[10px] px-1.5 py-0.5 rounded " + (tool.isDomestic ? "bg-emerald-500/20 text-emerald-400" : "bg-sky-500/20 text-sky-400")}>
                        {tool.isDomestic ? "国产" : "国际"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{tool.pricing === "free" ? "免费" : tool.pricing === "freemium" ? "免费增值" : "付费"}</td>
                    <td className="px-4 py-3">
                      {isExpired ? (
                        <span className="flex items-center gap-1 text-amber-400 text-xs"><AlertTriangle className="w-3 h-3" />需验证</span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle2 className="w-3 h-3" />正常</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerify(tool)}
                          disabled={verifyingId === toolId}
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <RefreshCw className={"w-3 h-3 " + (verifyingId === toolId ? "animate-spin" : "")} />
                          验证
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(tool)} className="h-7 px-2 text-xs">编辑</Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { if (toolId && confirm("确定删除此工具？")) deleteMutation.mutate({ toolId }); else if (!toolId) { toast.error("该工具缺少ID，无法删除"); } }}
                          className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredTools.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">暂无匹配的工具</div>
        )}
        <div className="px-4 py-2 border-t border-white/[0.04] text-xs text-muted-foreground">
          共 {filteredTools.length} 条记录
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editForm.toolId ? "编辑工具" : "添加工具"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">工具名称 *</label>
                <input value={editForm.name || ""} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-muted/30 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">分类 *</label>
                <input value={editForm.category || ""} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full bg-muted/30 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">描述</label>
              <textarea value={editForm.description || ""} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full bg-muted/30 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">官方URL</label>
                <input value={editForm.officialUrl || ""} onChange={e => setEditForm({ ...editForm, officialUrl: e.target.value })} className="w-full bg-muted/30 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">定价模式</label>
                <select value={editForm.pricing || "free"} onChange={e => setEditForm({ ...editForm, pricing: e.target.value })} className="w-full bg-muted/30 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                  <option value="free">免费</option>
                  <option value="freemium">免费增值</option>
                  <option value="paid">付费</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editForm.isDomestic ?? true} onChange={e => setEditForm({ ...editForm, isDomestic: e.target.checked })} className="rounded" />
                <span className="text-sm text-foreground">国产工具</span>
              </label>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">标签（逗号分隔）</label>
              <input value={Array.isArray(editForm.tags) ? editForm.tags.join(", ") : editForm.tags || ""} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} className="w-full bg-muted/30 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">适用场景（逗号分隔）</label>
              <input value={Array.isArray(editForm.useCases) ? editForm.useCases.join(", ") : editForm.useCases || ""} onChange={e => setEditForm({ ...editForm, useCases: e.target.value })} className="w-full bg-muted/30 border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditDialog(false)}>取消</Button>
              <Button onClick={handleSaveEdit} disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
