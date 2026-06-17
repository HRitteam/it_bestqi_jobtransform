import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Server, Zap, Loader2 } from "lucide-react";

type ModelFormData = {
  modelCode: string;
  modelName: string;
  provider: string;
  apiUrl: string;
  apiKey: string;
  modelType: "chat" | "embedding" | "image" | "audio";
  isActive: number;
  priority: number;
  inputPrice: string;
  outputPrice: string;
  maxContext: number;
  maxOutput: number;
  remark: string;
};

const defaultFormData: ModelFormData = {
  modelCode: "",
  modelName: "",
  provider: "",
  apiUrl: "",
  apiKey: "",
  modelType: "chat",
  isActive: 1,
  priority: 100,
  inputPrice: "0",
  outputPrice: "0",
  maxContext: 8192,
  maxOutput: 4096,
  remark: "",
};

export default function LlmManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ModelFormData>(defaultFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);

  // 数据查询
  const modelsQuery = trpc.adminLlm.list.useQuery();
  const createMutation = trpc.adminLlm.create.useMutation({
    onSuccess: () => {
      toast.success("模型创建成功");
      setIsDialogOpen(false);
      resetForm();
      modelsQuery.refetch();
    },
    onError: (err) => toast.error(`创建失败: ${err.message}`),
  });
  const updateMutation = trpc.adminLlm.update.useMutation({
    onSuccess: () => {
      toast.success("模型更新成功");
      setIsDialogOpen(false);
      resetForm();
      modelsQuery.refetch();
    },
    onError: (err) => toast.error(`更新失败: ${err.message}`),
  });
  const toggleMutation = trpc.adminLlm.toggleStatus.useMutation({
    onSuccess: () => {
      modelsQuery.refetch();
    },
    onError: (err) => toast.error(`状态切换失败: ${err.message}`),
  });
  const deleteMutation = trpc.adminLlm.delete.useMutation({
    onSuccess: () => {
      toast.success("模型已删除");
      setDeleteConfirmId(null);
      modelsQuery.refetch();
    },
    onError: (err) => toast.error(`删除失败: ${err.message}`),
  });
  const testMutation = trpc.adminLlm.testConnection.useMutation({
    onSuccess: (data) => {
      setTestingId(null);
      if (data.success) {
        toast.success("连接测试成功", {
          description: `耗时 ${data.durationMs}ms，模型: ${data.modelCode}`,
          duration: 5000,
        });
      } else {
        toast.error("连接测试失败", {
          description: data.error || "未知错误",
          duration: 8000,
        });
      }
    },
    onError: (err) => {
      setTestingId(null);
      toast.error(`测试失败: ${err.message}`);
    },
  });

  function handleTestConnection(id: number) {
    setTestingId(id);
    testMutation.mutate({ id });
  }

  function resetForm() {
    setFormData(defaultFormData);
    setEditingId(null);
  }

  function openCreateDialog() {
    resetForm();
    setIsDialogOpen(true);
  }

  function openEditDialog(model: any) {
    setEditingId(model.id);
    setFormData({
      modelCode: model.modelCode,
      modelName: model.modelName,
      provider: model.provider,
      apiUrl: model.apiUrl,
      apiKey: "", // 编辑时留空表示不修改
      modelType: model.modelType,
      isActive: model.isActive,
      priority: model.priority,
      inputPrice: model.inputPrice,
      outputPrice: model.outputPrice,
      maxContext: model.maxContext,
      maxOutput: model.maxOutput,
      remark: model.remark || "",
    });
    setIsDialogOpen(true);
  }

  function handleSubmit() {
    if (editingId) {
      const payload: any = { id: editingId };
      if (formData.modelCode) payload.modelCode = formData.modelCode;
      if (formData.modelName) payload.modelName = formData.modelName;
      if (formData.provider) payload.provider = formData.provider;
      if (formData.apiUrl) payload.apiUrl = formData.apiUrl;
      if (formData.apiKey) payload.apiKey = formData.apiKey;
      if (formData.modelType) payload.modelType = formData.modelType;
      payload.isActive = formData.isActive;
      payload.priority = formData.priority;
      payload.inputPrice = formData.inputPrice;
      payload.outputPrice = formData.outputPrice;
      payload.maxContext = formData.maxContext;
      payload.maxOutput = formData.maxOutput;
      payload.remark = formData.remark || null;
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(formData);
    }
  }

  function handleToggleStatus(id: number, currentStatus: number) {
    toggleMutation.mutate({ id, isActive: currentStatus === 1 ? 0 : 1 });
  }

  const models = modelsQuery.data || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="w-6 h-6" />
            大模型路由管理
          </h1>
          <p className="text-muted-foreground mt-1">
            管理平台所有大模型配置，设置调用优先级和降级策略
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          新增模型
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              模型总数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{models.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已启用
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {models.filter((m) => m.isActive === 1).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              已停用
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {models.filter((m) => m.isActive === 0).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              供应商数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(models.map((m) => m.provider)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 模型列表表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">优先级</TableHead>
                <TableHead>模型名称</TableHead>
                <TableHead>模型编码</TableHead>
                <TableHead>供应商</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>输入单价</TableHead>
                <TableHead>输出单价</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    暂无模型配置，请点击"新增模型"添加
                  </TableCell>
                </TableRow>
              ) : (
                models.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell>
                      <Badge variant="outline">{model.priority}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {model.modelName}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {model.modelCode}
                      </code>
                    </TableCell>
                    <TableCell>{model.provider}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{model.modelType}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground">
                        {model.apiKey}
                      </code>
                    </TableCell>
                    <TableCell>{model.inputPrice} 元/千T</TableCell>
                    <TableCell>{model.outputPrice} 元/千T</TableCell>
                    <TableCell>
                      <Switch
                        checked={model.isActive === 1}
                        onCheckedChange={() =>
                          handleToggleStatus(model.id, model.isActive)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTestConnection(model.id)}
                        disabled={testingId === model.id}
                        title="测试连接"
                      >
                        {testingId === model.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 text-yellow-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(model)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(model.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增/编辑弹窗 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "编辑模型" : "新增模型"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>模型名称 *</Label>
              <Input
                value={formData.modelName}
                onChange={(e) =>
                  setFormData({ ...formData, modelName: e.target.value })
                }
                placeholder="如：GPT-4o"
              />
            </div>
            <div className="space-y-2">
              <Label>模型编码 *</Label>
              <Input
                value={formData.modelCode}
                onChange={(e) =>
                  setFormData({ ...formData, modelCode: e.target.value })
                }
                placeholder="如：moonshot-v1-32k, deepseek-chat, qwen-plus"
              />
              <p className="text-xs text-muted-foreground">
                模型编码即API调用时的model参数值
              </p>
            </div>
            <div className="space-y-2">
              <Label>供应商 *</Label>
              <Input
                value={formData.provider}
                onChange={(e) =>
                  setFormData({ ...formData, provider: e.target.value })
                }
                placeholder="如：OpenAI"
              />
            </div>
            <div className="space-y-2">
              <Label>模型类型 *</Label>
              <Select
                value={formData.modelType}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    modelType: v as ModelFormData["modelType"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat（对话）</SelectItem>
                  <SelectItem value="embedding">Embedding（向量）</SelectItem>
                  <SelectItem value="image">Image（图像）</SelectItem>
                  <SelectItem value="audio">Audio（音频）</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>API 地址 *</Label>
              <Input
                value={formData.apiUrl}
                onChange={(e) =>
                  setFormData({ ...formData, apiUrl: e.target.value })
                }
                placeholder="如：https://api.openai.com/v1/chat/completions"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>
                API Key *{" "}
                {editingId && (
                  <span className="text-muted-foreground font-normal">
                    （留空表示不修改）
                  </span>
                )}
              </Label>
              <Input
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData({ ...formData, apiKey: e.target.value })
                }
                placeholder={editingId ? "留空表示保持原密钥不变" : "输入 API Key"}
              />
            </div>
            <div className="space-y-2">
              <Label>调用优先级</Label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: parseInt(e.target.value) || 100,
                  })
                }
                min={1}
                max={9999}
              />
              <p className="text-xs text-muted-foreground">
                数字越小优先级越高
              </p>
            </div>
            <div className="space-y-2">
              <Label>启用状态</Label>
              <Select
                value={String(formData.isActive)}
                onValueChange={(v) =>
                  setFormData({ ...formData, isActive: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>输入 Token 单价（元/千Token）</Label>
              <Input
                value={formData.inputPrice}
                onChange={(e) =>
                  setFormData({ ...formData, inputPrice: e.target.value })
                }
                placeholder="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>输出 Token 单价（元/千Token）</Label>
              <Input
                value={formData.outputPrice}
                onChange={(e) =>
                  setFormData({ ...formData, outputPrice: e.target.value })
                }
                placeholder="0.03"
              />
            </div>
            <div className="space-y-2">
              <Label>最大上下文长度</Label>
              <Input
                type="number"
                value={formData.maxContext}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxContext: parseInt(e.target.value) || 8192,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>最大输出长度</Label>
              <Input
                type="number"
                value={formData.maxOutput}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxOutput: parseInt(e.target.value) || 4096,
                  })
                }
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>备注</Label>
              <Textarea
                value={formData.remark}
                onChange={(e) =>
                  setFormData({ ...formData, remark: e.target.value })
                }
                placeholder="可选，填写模型的补充说明"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "提交中..."
                : editingId
                  ? "保存修改"
                  : "创建模型"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog
        open={deleteConfirmId !== null}
        onOpenChange={() => setDeleteConfirmId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            删除后该模型将不再参与路由调度。已产生的调用日志仍可查询。此操作为软删除，可联系开发恢复。
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmId) deleteMutation.mutate({ id: deleteConfirmId });
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
