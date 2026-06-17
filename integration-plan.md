# ai-job-transform 企业会员系统集成与数据隔离改造方案

## 1. 背景与目标

当前 `ai-job-transform` 项目是一个面向个人用户的独立系统，采用基于 OAuth 的单点登录和基于 Cookie 的会话管理，数据以 `userId` 为维度进行存储。

为了将其作为子系统嵌入到企业会员系统中，我们需要实现以下目标：
1. **无缝嵌入**：通过 iframe 方式嵌入到企业会员系统，支持特定域名（如 `https://academy.hrflag.com/`）。
2. **身份传递**：通过 iframe 的 URL 参数（`companyId` 和 `phone`）实现用户身份的自动识别与登录，替代现有的 OAuth 流程。
3. **数据隔离**：在现有的单实例、单数据库架构下，实现企业级别（`companyId`）的逻辑数据隔离，同时保留用户个人（`phone`）的数据筛选能力。
4. **安全防护**：通过 Nginx 配置限制 iframe 的嵌入来源，防止未授权的跨站请求伪造和点击劫劫持。

## 2. 数据库改造方案 (逻辑隔离)

为了实现企业级别的数据隔离，我们需要在核心业务表中引入 `companyId` 字段，并调整现有的用户标识逻辑。

### 2.1 Schema 修改 (`drizzle/schema.ts`)

1. **`users` 表**：
   - 新增 `companyId: varchar("companyId", { length: 64 }).notNull()`。
   - 新增 `phone: varchar("phone", { length: 20 })`。
   - 修改唯一索引：现有的 `openId` 唯一索引可能需要调整，或者将 `openId` 的生成逻辑修改为 `${companyId}_${phone}`，以确保同一手机号在不同企业下可以独立存在（如果业务允许）。

2. **`reports` 表**：
   - 新增 `companyId: varchar("companyId", { length: 64 }).notNull()`。
   - 在查询报告列表时，必须同时带上 `companyId` 条件。

3. **`files` 表**：
   - 新增 `companyId: varchar("companyId", { length: 64 }).notNull()`。
   - 存储路径 `fileKey` 的生成规则从 `${user.id}/uploads/...` 修改为 `${companyId}/${user.id}/uploads/...`。

4. **其他关联表**（如 `brand_settings`, `report_distributions`, `report_feedback`）：
   - 视业务需求决定是否需要冗余 `companyId` 字段，通常建议在顶层业务表冗余以简化查询和权限校验。

### 2.2 数据库迁移
修改 `schema.ts` 后，运行 `pnpm db:push` 或生成 migration 脚本来更新阿里云 MySQL 8.0.36 数据库结构。

## 3. 后端认证与接口改造

现有的认证逻辑高度依赖 `server/_core/sdk.ts` 中的 OAuth 和 Cookie 机制。我们需要增加一种基于 URL 参数的“静默登录”机制。

### 3.1 认证中间件改造 (`server/_core/sdk.ts` & `server/routers.ts`)

1. **解析 URL 参数**：
   - 在 `authenticateRequest` 方法中，除了检查 Cookie，还需要支持从请求头（如 `x-company-id`, `x-user-phone`）或 Query 参数中提取身份信息。
   - **建议方案**：前端在 iframe 加载时解析 URL 参数，并在后续的所有 API 请求（包括 tRPC 和普通 Express 路由）中，通过 HTTP Header 传递 `companyId` 和 `phone`。

2. **自动注册/登录逻辑**：
   - 当检测到有效的 `companyId` 和 `phone` 时，在 `users` 表中查找对应的用户。
   - 如果用户不存在，则自动创建该用户（绑定 `companyId` 和 `phone`）。
   - 签发新的 Session Cookie，或者直接信任 Header 中的身份信息（需注意防伪造，见安全章节）。

### 3.2 API 路由改造 (`server/apiRoutes.ts` & `server/exportRoutes.ts`)

1. **数据写入**：
   - 在 `/api/analysis/submit` 等写入接口中，获取当前用户的 `companyId`，并在插入 `reports` 和 `files` 表时写入该字段。
   - 调整文件上传的 S3 Key 路径，加入 `companyId` 前缀。

2. **数据读取**：
   - 在 SSE 进度接口和状态查询接口中，增加对 `companyId` 的校验，防止通过枚举 `reportId` 越权访问其他企业的报告。

### 3.3 tRPC 路由改造 (`server/routers.ts`)

1. **Context 注入**：
   - 修改 `createContext`，将 `companyId` 注入到 tRPC 的 `ctx` 中。
2. **查询隔离**：
   - 修改 `report.list`、`report.get` 等查询逻辑，强制增加 `eq(reports.companyId, ctx.companyId)` 条件。
   - 个人数据筛选：在企业隔离的基础上，增加 `eq(reports.userId, ctx.user.id)` 条件以实现个人数据筛选。

## 4. 前端改造

前端需要适配 iframe 嵌入场景，隐藏不必要的独立系统 UI（如外部登录跳转、全屏侧边栏等），并处理 URL 参数。

### 4.1 URL 参数解析与全局状态 (`client/src/App.tsx` 或 `main.tsx`)

1. **解析参数**：
   - 在应用初始化时，解析 `window.location.search` 中的 `companyId` 和 `phone`。
   - 将这些参数存储在全局状态（如 React Context 或 localStorage）中。

2. **请求拦截器**：
   - 修改 tRPC 的 `httpBatchLink` 和 Axios 实例，在所有发出的请求中自动附带 `x-company-id` 和 `x-user-phone` Header。

### 4.2 UI 适配

1. **隐藏独立登录逻辑**：
   - 移除或绕过 `useAuth` 中跳转到外部 OAuth 登录页面的逻辑（`getLoginUrl()`）。
   - 依赖后端的静默登录机制。

2. **布局调整**：
   - 针对 iframe 嵌入场景，可能需要隐藏顶部的全局导航栏或左侧的侧边栏（`DashboardLayout.tsx`），以更好地融入父系统的 UI。可以通过 URL 参数（如 `?embed=1`）来控制布局的显示模式。

## 5. Nginx 部署与安全策略

为了满足特定域名嵌入的安全需求，需要在现有的 Nginx 配置中增加安全响应头。

### 5.1 Nginx 配置示例

在 Nginx 的 `server` 或 `location` 块中，配置 `Content-Security-Policy` (CSP) 的 `frame-ancestors` 指令。

```nginx
server {
    listen 80;
    server_name your-ai-job-transform-domain.com;

    # 允许特定的域名嵌入 iframe
    # 注意：如果有多个域名，用空格分隔
    add_header Content-Security-Policy "frame-ancestors 'self' https://academy.hrflag.com/ https://*.hrflag.com;";
    
    # 移除旧的 X-Frame-Options (因为它不支持多个域名，CSP frame-ancestors 是现代浏览器的标准)
    # fastcgi_hide_header X-Frame-Options;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 5.2 身份伪造防护建议

由于目前明确“仅通过限制嵌入域名来保证安全”，不使用签名验证，这意味着如果有人直接访问 iframe 的 URL 并随意修改 `companyId` 和 `phone` 参数，就可以伪造身份。

**强烈建议**：
虽然限制了 iframe 嵌入域名，但直接在浏览器地址栏打开 URL 是不受 `frame-ancestors` 限制的。为了防止恶意用户直接访问接口，建议在 Nginx 层或应用层增加 `Referer` 或 `Origin` 校验，或者在父系统生成一个短期有效的 Token 替代明文的 `phone`，以提升安全性。

## 6. 实施步骤总结

1. **数据库层**：修改 Drizzle Schema，增加 `companyId` 字段，执行数据库迁移。
2. **后端层**：修改 `sdk.ts` 支持 URL/Header 参数静默登录；修改所有 API 和 tRPC 路由，强制增加 `companyId` 过滤条件。
3. **前端层**：解析 URL 参数，配置请求拦截器携带身份信息；调整 UI 布局适配 iframe。
4. **运维层**：修改 Nginx 配置，增加 CSP `frame-ancestors` 策略限制嵌入域名。
