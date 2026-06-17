# 平台级大模型路由管理技术方案

## 1. 背景与目标

当前系统（`ai-job-transform`）的大模型调用（`server/_core/llm.ts`）硬编码了模型名称（`gemini-2.5-flash`）和 API 密钥。为了满足平台化运营需求，需要引入“平台级大模型路由管理”功能。

**核心目标**：
1. **模型池管理**：统一管理多供应商、多模型，支持动态配置 API 地址、密钥和价格。
2. **高可用路由**：实现基于优先级的模型路由，当主模型发生服务异常、限流等非业务错误时，自动降级切换到备用模型。
3. **可观测性与计费**：记录每次调用的详细日志（Token 消耗、耗时、切换轨迹），并基于配置的单价自动估算费用，为后续企业计费提供数据支撑。

## 2. 数据库表设计

基于现有的 Drizzle ORM + MySQL 架构，新增两张核心表：`llm_models`（模型配置表）和 `llm_call_logs`（调用日志表）。

### 2.1 模型配置表 (`llm_models`)

用于存储平台配置的所有大模型信息。

| 字段名 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | int | PK, Auto Increment | 主键 |
| `modelCode` | varchar(64) | Unique, Not Null | 模型编码（如 `gpt-4o`, `claude-3-5-sonnet`） |
| `modelName` | varchar(128) | Not Null | 模型展示名称 |
| `provider` | varchar(64) | Not Null | 供应商（如 `OpenAI`, `Anthropic`, `Aliyun`） |
| `apiUrl` | varchar(512) | Not Null | API 请求地址 |
| `apiKey` | varchar(512) | Not Null | API Key（需使用 AES-256-GCM 加密存储） |
| `modelType` | varchar(32) | Not Null | 模型类型（如 `chat`, `embedding`, `image`） |
| `isActive` | int | Default 1 | 启用状态：1-启用，0-停用 |
| `priority` | int | Default 100 | 调用优先级（数字越小优先级越高） |
| `inputPrice` | decimal(10,6) | Default 0 | 输入 Token 单价（元/千Token） |
| `outputPrice` | decimal(10,6) | Default 0 | 输出 Token 单价（元/千Token） |
| `maxContext` | int | Default 8192 | 最大上下文长度 |
| `maxOutput` | int | Default 4096 | 最大输出长度 |
| `remark` | text | Nullable | 备注信息 |
| `isDeleted` | int | Default 0 | 软删除标记：1-已删除，0-正常 |
| `createdAt` | timestamp | Default Now | 创建时间 |
| `updatedAt` | timestamp | On Update Now | 更新时间 |

### 2.2 模型调用日志表 (`llm_call_logs`)

用于记录每次模型调用的详细信息，支持后续的费用统计和故障排查。

| 字段名 | 类型 | 约束 | 说明 |
| :--- | :--- | :--- | :--- |
| `id` | bigint | PK, Auto Increment | 主键 |
| `requestId` | varchar(64) | Index, Not Null | 唯一请求ID（贯穿重试链路） |
| `companyId` | varchar(64) | Index, Not Null | 企业ID（关联企业隔离改造） |
| `userId` | int | Index, Not Null | 用户ID |
| `phone` | varchar(20) | Index | 用户手机号 |
| `feature` | varchar(64) | Not Null | 使用功能（如 `job_analysis`, `strategy_opt`） |
| `source` | varchar(64) | Nullable | 请求来源（如 `web`, `api`） |
| `modelCode` | varchar(64) | Index, Not Null | 最终实际调用的模型编码 |
| `provider` | varchar(64) | Not Null | 最终实际调用的供应商 |
| `isSuccess` | int | Not Null | 是否成功：1-成功，0-失败 |
| `failReason` | text | Nullable | 失败原因（包含 HTTP 状态码和错误信息） |
| `isSwitched` | int | Default 0 | 是否发生模型切换：1-是，0-否 |
| `originalModel` | varchar(64) | Nullable | 原始目标模型编码（发生切换时记录） |
| `switchTrace` | json | Nullable | 切换轨迹（记录尝试过的模型及失败原因） |
| `inputTokens` | int | Default 0 | 输入 Token 数量 |
| `outputTokens` | int | Default 0 | 输出 Token 数量 |
| `totalTokens` | int | Default 0 | 总 Token 数量 |
| `estimatedCost` | decimal(10,6) | Default 0 | 预估费用（元） |
| `requestTime` | timestamp | Not Null | 请求发起时间 |
| `responseTime` | timestamp | Nullable | 响应结束时间 |
| `durationMs` | int | Default 0 | 耗时（毫秒） |

## 3. 后端接口设计

在 `server/routers.ts` 中新增 `adminLlm` 路由模块，仅限超级管理员（`role === 'admin'`）访问。

### 3.1 模型管理接口

1. **`adminLlm.listModels` (Query)**
   - **输入**：无（或分页参数）
   - **输出**：模型列表（包含今日调用次数、失败次数的统计聚合）。API Key 在返回时必须脱敏（如 `sk-****1234`）。
2. **`adminLlm.createModel` (Mutation)**
   - **输入**：模型基础信息、API Key、价格等。
   - **逻辑**：校验 `modelCode` 唯一性；使用系统环境变量 `ENCRYPTION_KEY` 对 `apiKey` 进行对称加密后存入数据库。
3. **`adminLlm.updateModel` (Mutation)**
   - **输入**：模型 ID 及允许修改的字段。
   - **逻辑**：如果传入了新的 API Key，则加密更新；否则保留原加密值。更新立即生效。
4. **`adminLlm.toggleModelStatus` (Mutation)**
   - **输入**：模型 ID，目标状态（启用/停用）。
5. **`adminLlm.deleteModel` (Mutation)**
   - **输入**：模型 ID。
   - **逻辑**：检查 `llm_call_logs` 中是否有该模型的调用记录。如果有，则拒绝物理删除，仅将 `isDeleted` 置为 1（软删除）。

### 3.2 日志与统计接口

1. **`adminLlm.searchLogs` (Query)**
   - **输入**：搜索条件（企业ID、手机号、功能、模型、状态、是否切换、时间范围、Token 范围、费用范围）、分页参数。
   - **输出**：分页的日志列表。
2. **`adminLlm.getStats` (Query)**
   - **输入**：时间范围、聚合维度（按企业、按模型、按功能）。
   - **输出**：Token 消耗总量、预估总费用、调用成功率等统计数据。

## 4. 模型路由与失败降级流程

重构 `server/_core/llm.ts` 中的 `invokeLLM` 方法，引入路由服务。

### 4.1 路由选择逻辑

1. **获取可用模型池**：从数据库查询所有 `isActive = 1` 且 `isDeleted = 0` 的模型，按 `priority` 升序（数字越小优先级越高）排序。
2. **缓存机制**：为了避免每次调用都查库，模型配置应在内存中缓存（如使用 `node-cache`），并设置较短的 TTL（如 1 分钟），或在后台修改模型时触发缓存失效。
3. **确定目标模型**：默认选择优先级最高的第一顺位模型作为 `originalModel`。

### 4.2 失败降级策略

当调用模型发生异常时，根据错误类型决定是否降级切换：

- **触发切换的错误（非业务异常）**：
  - HTTP 5xx 错误（服务器内部错误、网关超时等）。
  - HTTP 429 错误（Rate Limit 限流）。
  - 请求超时（如 Axios timeout）。
  - API Key 异常（HTTP 401/403，可能是密钥过期或被封禁）。
- **不触发切换的错误（业务异常）**：
  - HTTP 400 错误（参数错误、上下文超长）。
  - 内容安全拦截（用户输入违规）。

### 4.3 调用执行流程

```typescript
async function invokeWithRouting(params, context) {
  const models = await getActiveModelsSortedByPriority();
  if (models.length === 0) throw new Error("No active LLM models available");

  const requestId = nanoid();
  const originalModel = models[0];
  let currentModelIndex = 0;
  let switchTrace = [];
  const startTime = Date.now();

  while (currentModelIndex < models.length) {
    const model = models[currentModelIndex];
    const attemptStartTime = Date.now();
    
    try {
      // 解密 API Key 并发起实际 HTTP 请求
      const response = await executeHttpRequest(model, params);
      
      // 计算 Token 和费用
      const inputTokens = response.usage?.prompt_tokens || 0;
      const outputTokens = response.usage?.completion_tokens || 0;
      const estimatedCost = (inputTokens * model.inputPrice + outputTokens * model.outputPrice) / 1000;

      // 异步记录成功日志
      await recordLog({
        requestId, context, model, isSuccess: 1, 
        isSwitched: currentModelIndex > 0 ? 1 : 0,
        originalModel: originalModel.modelCode,
        switchTrace, inputTokens, outputTokens, estimatedCost,
        durationMs: Date.now() - startTime
      });

      return response;
    } catch (error) {
      const isRetryable = checkIsRetryableError(error);
      const failReason = extractErrorMessage(error);
      
      switchTrace.push({
        modelCode: model.modelCode,
        failReason,
        durationMs: Date.now() - attemptStartTime
      });

      if (!isRetryable || currentModelIndex === models.length - 1) {
        // 异步记录最终失败日志
        await recordLog({
          requestId, context, model, isSuccess: 0, failReason,
          isSwitched: currentModelIndex > 0 ? 1 : 0,
          originalModel: originalModel.modelCode,
          switchTrace, durationMs: Date.now() - startTime
        });
        throw error; // 抛出统一错误
      }
      
      // 触发降级，尝试下一个模型
      currentModelIndex++;
    }
  }
}
```

## 5. 前端页面设计

在总后台（`AdminTools.tsx` 或新增的 `LlmManager.tsx`）中增加两个主要 Tab：

### 5.1 模型管理 Tab
- **顶部操作区**：新增模型按钮。
- **数据表格**：展示模型列表。列包括：模型名称、编码、供应商、优先级、状态（Switch 开关）、输入/输出单价、今日调用/失败次数、操作（编辑、删除）。
- **新增/编辑弹窗**：表单包含名称、编码、供应商、API 地址、API Key（密码框）、优先级、单价等。编辑时 API Key 留空表示不修改。

### 5.2 调用日志 Tab
- **高级搜索区**：包含企业ID、手机号、功能模块、模型名称、状态（成功/失败）、是否切换、时间范围选择器。
- **数据表格**：展示日志列表。列包括：请求时间、企业/用户、功能、最终模型、状态、耗时、总 Token、预估费用、操作（查看详情）。
- **详情抽屉/弹窗**：展示完整的请求上下文、失败原因、切换轨迹（`switchTrace` JSON 格式化展示）。

## 6. 关键边界情况处理

1. **并发更新与缓存一致性**：
   - 管理员修改模型配置后，必须立即清除内存缓存，确保下一次请求使用最新配置（尤其是 API Key 更新时）。
2. **API Key 安全**：
   - 数据库中绝对不能明文存储 API Key。必须在应用层使用 `crypto` 模块进行 AES-256-GCM 加密/解密。
   - 前端获取模型列表时，API Key 必须脱敏。
3. **上下文长度差异**：
   - 降级切换时，备用模型的 `maxContext` 可能小于主模型。如果当前请求的 Token 估算超过了备用模型的最大上下文，应跳过该备用模型，继续寻找下一个。
4. **日志写入性能**：
   - 日志写入应采用异步非阻塞方式（如丢入消息队列或使用 `setTimeout` / `process.nextTick`），避免增加主业务请求的延迟。

## 7. 测试用例规划

| 测试场景 | 前置条件 | 操作步骤 | 预期结果 |
| :--- | :--- | :--- | :--- |
| **模型新增与加密** | 管理员登录 | 填写模型信息并保存 | 数据库中新增记录，`apiKey` 字段为密文，列表接口返回脱敏 Key |
| **正常路由调用** | 配置了优先级 1 的模型 A | 触发业务功能调用 LLM | 成功调用模型 A，日志记录 `isSwitched=0`，费用计算正确 |
| **自动降级切换** | 模型 A (优先级1) 密钥错误，模型 B (优先级2) 正常 | 触发业务功能调用 LLM | 模型 A 报 401，自动切换到模型 B 并成功返回。日志记录 `isSwitched=1`，`originalModel=A`，`switchTrace` 包含 A 的 401 错误 |
| **业务错误不切换** | 模型 A 正常 | 触发业务功能，传入超长文本导致 400 错误 | 直接返回失败，不切换到模型 B。日志记录失败原因 |
| **全链路失败** | 所有可用模型均配置了错误的 API 地址 | 触发业务功能调用 LLM | 依次尝试所有模型后返回统一错误，日志记录最终失败及完整的 `switchTrace` |
| **软删除拦截** | 模型 A 已有调用日志 | 在后台点击删除模型 A | 提示无法物理删除，模型状态变为已删除，不再参与路由 |
