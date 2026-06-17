import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  Activity,
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  Coins,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

// ============================================================
// 类型
// ============================================================

type SearchFilters = {
  companyId: string;
  phone: string;
  feature: string;
  modelCode: string;
  provider: string;
  success: string; // "" | "1" | "0"
  isSwitched: string; // "" | "1" | "0"
  startTime: string;
  endTime: string;
  minTokens: string;
  maxTokens: string;
  minCost: string;
  maxCost: string;
};

const defaultFilters: SearchFilters = {
  companyId: "",
  phone: "",
  feature: "",
  modelCode: "",
  provider: "",
  success: "",
  isSwitched: "",
  startTime: "",
  endTime: "",
  minTokens: "",
  maxTokens: "",
  minCost: "",
  maxCost: "",
};

// ============================================================
// 主组件
// ============================================================

export default function LlmLogs() {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [detailLog, setDetailLog] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"logs" | "stats">("logs");

  // 构建搜索参数
  const searchInput = {
    companyId: filters.companyId || undefined,
    phone: filters.phone || undefined,
    feature: filters.feature || undefined,
    modelCode: filters.modelCode || undefined,
    provider: filters.provider || undefined,
    success: filters.success !== "" ? Number(filters.success) as 0 | 1 : undefined,
    isSwitched: filters.isSwitched !== "" ? Number(filters.isSwitched) as 0 | 1 : undefined,
    startTime: filters.startTime || undefined,
    endTime: filters.endTime || undefined,
    minTokens: filters.minTokens ? Number(filters.minTokens) : undefined,
    maxTokens: filters.maxTokens ? Number(filters.maxTokens) : undefined,
    minCost: filters.minCost || undefined,
    maxCost: filters.maxCost || undefined,
    page,
    pageSize,
  };

  // 数据查询
  const logsQuery = trpc.adminLlmLog.search.useQuery(searchInput);
  const statsQuery = trpc.adminLlmLog.stats.useQuery({
    companyId: filters.companyId || undefined,
    feature: filters.feature || undefined,
    modelCode: filters.modelCode || undefined,
    provider: filters.provider || undefined,
    startTime: filters.startTime || undefined,
    endTime: filters.endTime || undefined,
  });
  const filterOptionsQuery = trpc.adminLlmLog.filterOptions.useQuery();

  const totalPages = Math.ceil((logsQuery.data?.total || 0) / pageSize);

  // 搜索处理
  const handleSearch = () => {
    setPage(1);
    logsQuery.refetch();
    statsQuery.refetch();
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">模型调用日志</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看所有大模型调用记录、Token 消耗和费用统计
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === "logs" ? "default" : "outline"}
            onClick={() => setActiveTab("logs")}
          >
            调用日志
          </Button>
          <Button
            variant={activeTab === "stats" ? "default" : "outline"}
            onClick={() => setActiveTab("stats")}
          >
            费用统计
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <StatsCards stats={statsQuery.data?.summary} />

      {/* 搜索表单 */}
      <SearchForm
        filters={filters}
        filterOptions={filterOptionsQuery.data}
        onUpdate={updateFilter}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {/* 内容区域 */}
      {activeTab === "logs" ? (
        <>
          {/* 日志列表 */}
          <LogTable
            data={logsQuery.data?.data || []}
            loading={logsQuery.isLoading}
            onViewDetail={setDetailLog}
          />

          {/* 分页 */}
          <Pagination
            page={page}
            totalPages={totalPages}
            total={logsQuery.data?.total || 0}
            onPageChange={setPage}
          />
        </>
      ) : (
        <StatsBreakdown
          filters={filters}
        />
      )}

      {/* 详情弹窗 */}
      <LogDetailDialog
        log={detailLog}
        onClose={() => setDetailLog(null)}
      />
    </div>
  );
}

// ============================================================
// 统计卡片组件
// ============================================================

function StatsCards({ stats }: { stats: any }) {
  if (!stats) return null;

  const cards = [
    {
      title: "总调用次数",
      value: stats.totalCalls?.toLocaleString() || "0",
      icon: Activity,
      color: "text-blue-600",
    },
    {
      title: "成功率",
      value: `${stats.successRate || "0"}%`,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "失败次数",
      value: stats.failedCalls?.toLocaleString() || "0",
      icon: XCircle,
      color: "text-red-600",
    },
    {
      title: "模型切换次数",
      value: stats.switchedCalls?.toLocaleString() || "0",
      icon: ArrowRightLeft,
      color: "text-orange-600",
    },
    {
      title: "总 Token",
      value: Number(stats.totalTokens || 0).toLocaleString(),
      icon: Activity,
      color: "text-purple-600",
    },
    {
      title: "总费用(元)",
      value: `¥${Number(stats.totalCost || 0).toFixed(4)}`,
      icon: Coins,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`w-4 h-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.title}</span>
            </div>
            <p className="text-lg font-semibold">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// 搜索表单组件
// ============================================================

function SearchForm({
  filters,
  filterOptions,
  onUpdate,
  onSearch,
  onReset,
}: {
  filters: SearchFilters;
  filterOptions: any;
  onUpdate: (key: keyof SearchFilters, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        {/* 基础筛选 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div>
            <Label className="text-xs">企业 ID</Label>
            <Input
              placeholder="输入企业ID"
              value={filters.companyId}
              onChange={(e) => onUpdate("companyId", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">手机号</Label>
            <Input
              placeholder="输入手机号"
              value={filters.phone}
              onChange={(e) => onUpdate("phone", e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">功能</Label>
            <Select value={filters.feature} onValueChange={(v) => onUpdate("feature", v === "_all" ? "" : v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="全部功能" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">全部功能</SelectItem>
                {filterOptions?.features?.map((f: string) => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">模型</Label>
            <Select value={filters.modelCode} onValueChange={(v) => onUpdate("modelCode", v === "_all" ? "" : v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="全部模型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">全部模型</SelectItem>
                {filterOptions?.models?.map((m: string) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">状态</Label>
            <Select value={filters.success} onValueChange={(v) => onUpdate("success", v === "_all" ? "" : v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">全部状态</SelectItem>
                <SelectItem value="1">成功</SelectItem>
                <SelectItem value="0">失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button size="sm" onClick={onSearch} className="h-8">
              <Search className="w-3 h-3 mr-1" />
              搜索
            </Button>
            <Button size="sm" variant="outline" onClick={onReset} className="h-8">
              重置
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="h-8 text-xs"
            >
              {expanded ? "收起" : "更多"}
            </Button>
          </div>
        </div>

        {/* 高级筛选 */}
        {expanded && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-3 pt-3 border-t">
            <div>
              <Label className="text-xs">供应商</Label>
              <Select value={filters.provider} onValueChange={(v) => onUpdate("provider", v === "_all" ? "" : v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="全部供应商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">全部供应商</SelectItem>
                  {filterOptions?.providers?.map((p: string) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">是否切换</Label>
              <Select value={filters.isSwitched} onValueChange={(v) => onUpdate("isSwitched", v === "_all" ? "" : v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">全部</SelectItem>
                  <SelectItem value="1">已切换</SelectItem>
                  <SelectItem value="0">未切换</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">开始时间</Label>
              <Input
                type="datetime-local"
                value={filters.startTime}
                onChange={(e) => onUpdate("startTime", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">结束时间</Label>
              <Input
                type="datetime-local"
                value={filters.endTime}
                onChange={(e) => onUpdate("endTime", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Token 范围</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder="最小"
                  value={filters.minTokens}
                  onChange={(e) => onUpdate("minTokens", e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  placeholder="最大"
                  value={filters.maxTokens}
                  onChange={(e) => onUpdate("maxTokens", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">费用范围(元)</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  step="0.01"
                  placeholder="最小"
                  value={filters.minCost}
                  onChange={(e) => onUpdate("minCost", e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="最大"
                  value={filters.maxCost}
                  onChange={(e) => onUpdate("maxCost", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// 日志表格组件
// ============================================================

function LogTable({
  data,
  loading,
  onViewDetail,
}: {
  data: any[];
  loading: boolean;
  onViewDetail: (log: any) => void;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          加载中...
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          暂无调用日志
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>企业</TableHead>
                <TableHead>功能</TableHead>
                <TableHead>模型</TableHead>
                <TableHead>供应商</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>切换</TableHead>
                <TableHead className="text-right">Token</TableHead>
                <TableHead className="text-right">费用</TableHead>
                <TableHead className="text-right">耗时</TableHead>
                <TableHead className="w-[60px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {log.id}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatTime(log.requestTime)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.companyId || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {log.feature}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {log.modelCode}
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.provider || "-"}
                  </TableCell>
                  <TableCell>
                    {log.success ? (
                      <Badge className="bg-green-100 text-green-700 text-xs">成功</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 text-xs">失败</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {log.isSwitched ? (
                      <Badge className="bg-orange-100 text-orange-700 text-xs">已切换</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {log.totalTokens?.toLocaleString() || "0"}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    ¥{Number(log.estimatedCost || 0).toFixed(4)}
                  </TableCell>
                  <TableCell className="text-xs text-right">
                    {log.durationMs ? `${log.durationMs}ms` : "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => onViewDetail(log)}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// 分页组件
// ============================================================

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        共 {total.toLocaleString()} 条记录
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm">
          {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// 日志详情弹窗
// ============================================================

function LogDetailDialog({
  log,
  onClose,
}: {
  log: any | null;
  onClose: () => void;
}) {
  if (!log) return null;

  return (
    <Dialog open={!!log} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>调用日志详情</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 基础信息 */}
          <section>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">基础信息</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <DetailItem label="请求 ID" value={log.requestId} mono />
              <DetailItem label="功能" value={log.feature} />
              <DetailItem label="请求来源" value={log.source || "web"} />
              <DetailItem label="请求时间" value={formatTime(log.requestTime)} />
              <DetailItem label="响应时间" value={formatTime(log.responseTime)} />
              <DetailItem label="耗时" value={`${log.durationMs || 0}ms`} />
            </div>
          </section>

          {/* 企业/用户信息 */}
          <section>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">企业与用户</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <DetailItem label="企业 ID" value={log.companyId || "-"} />
              <DetailItem label="企业名称" value={log.companyName || "-"} />
              <DetailItem label="用户 ID" value={log.userId?.toString() || "-"} />
              <DetailItem label="手机号" value={log.phone || "-"} />
            </div>
          </section>

          {/* 模型信息 */}
          <section>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">模型与状态</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <DetailItem label="最终模型" value={log.modelCode} mono />
              <DetailItem label="供应商" value={log.provider || "-"} />
              <DetailItem
                label="调用状态"
                value={log.success ? "成功" : "失败"}
                badge={log.success ? "green" : "red"}
              />
              <DetailItem label="HTTP 状态码" value={log.httpStatus?.toString() || "-"} />
              <DetailItem
                label="是否切换"
                value={log.isSwitched ? "是" : "否"}
                badge={log.isSwitched ? "orange" : undefined}
              />
              <DetailItem label="原始模型" value={log.originalModel || "-"} mono />
            </div>
            {log.failReason && (
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">失败原因</Label>
                <p className="text-sm bg-red-50 text-red-800 p-2 rounded mt-1 break-all">
                  {log.failReason}
                </p>
              </div>
            )}
          </section>

          {/* Token 与费用 */}
          <section>
            <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Token 与费用</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <DetailItem label="输入 Token" value={log.inputTokens?.toLocaleString() || "0"} />
              <DetailItem label="输出 Token" value={log.outputTokens?.toLocaleString() || "0"} />
              <DetailItem label="总 Token" value={log.totalTokens?.toLocaleString() || "0"} />
              <DetailItem label="输入单价" value={`¥${log.inputPrice || "0"}/千Token`} />
              <DetailItem label="输出单价" value={`¥${log.outputPrice || "0"}/千Token`} />
              <DetailItem label="预估费用" value={`¥${Number(log.estimatedCost || 0).toFixed(6)}`} />
            </div>
          </section>

          {/* 切换轨迹 */}
          {log.switchTrace && log.switchTrace.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">切换轨迹</h4>
              <div className="bg-muted/50 rounded p-3 space-y-2">
                {log.switchTrace.map((trace: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <Badge variant="outline" className="text-xs">
                      #{idx + 1}
                    </Badge>
                    <span className="font-mono">{trace.modelCode}</span>
                    <span className="text-muted-foreground">({trace.provider})</span>
                    <Badge className="bg-red-100 text-red-700 text-xs">
                      {trace.httpStatus || "ERR"}
                    </Badge>
                    <span className="text-muted-foreground">{trace.durationMs}ms</span>
                    <span className="text-red-600 truncate max-w-[200px]" title={trace.failReason}>
                      {trace.failReason}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 费用统计分组视图
// ============================================================

function StatsBreakdown({ filters }: { filters: SearchFilters }) {
  const [groupBy, setGroupBy] = useState<"company" | "model" | "feature" | "provider" | "day">("model");

  const statsQuery = trpc.adminLlmLog.stats.useQuery({
    companyId: filters.companyId || undefined,
    feature: filters.feature || undefined,
    modelCode: filters.modelCode || undefined,
    provider: filters.provider || undefined,
    startTime: filters.startTime || undefined,
    endTime: filters.endTime || undefined,
    groupBy,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">分组统计</CardTitle>
          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="model">按模型</SelectItem>
              <SelectItem value="company">按企业</SelectItem>
              <SelectItem value="feature">按功能</SelectItem>
              <SelectItem value="provider">按供应商</SelectItem>
              <SelectItem value="day">按日期</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {statsQuery.isLoading ? (
          <div className="py-8 text-center text-muted-foreground">加载中...</div>
        ) : (statsQuery.data?.breakdown?.length || 0) === 0 ? (
          <div className="py-8 text-center text-muted-foreground">暂无统计数据</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{getGroupLabel(groupBy)}</TableHead>
                <TableHead className="text-right">调用次数</TableHead>
                <TableHead className="text-right">成功次数</TableHead>
                <TableHead className="text-right">输入 Token</TableHead>
                <TableHead className="text-right">输出 Token</TableHead>
                <TableHead className="text-right">总 Token</TableHead>
                <TableHead className="text-right">总费用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statsQuery.data?.breakdown?.map((row: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-sm">
                    {row.groupKey || "-"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {Number(row.totalCalls).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {Number(row.successCalls).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {Number(row.totalInputTokens).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {Number(row.totalOutputTokens).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    {Number(row.totalTokens).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">
                    ¥{Number(row.totalCost || 0).toFixed(4)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// 辅助组件与工具函数
// ============================================================

function DetailItem({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value: string;
  mono?: boolean;
  badge?: "green" | "red" | "orange";
}) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className={`text-sm ${mono ? "font-mono" : ""}`}>
        {badge ? (
          <Badge
            className={`text-xs ${
              badge === "green"
                ? "bg-green-100 text-green-700"
                : badge === "red"
                ? "bg-red-100 text-red-700"
                : "bg-orange-100 text-orange-700"
            }`}
          >
            {value}
          </Badge>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function formatTime(time: string | Date | null): string {
  if (!time) return "-";
  const d = new Date(time);
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getGroupLabel(groupBy: string): string {
  const labels: Record<string, string> = {
    company: "企业 ID",
    model: "模型",
    feature: "功能",
    provider: "供应商",
    day: "日期",
    user: "用户",
  };
  return labels[groupBy] || groupBy;
}
