# ai-job-transform 项目部署指南

本文档提供了 `ai-job-transform` 项目在生产环境下的完整部署流程，涵盖环境准备、依赖安装、数据库配置、构建部署、PM2 进程管理以及 Nginx 反向代理配置。

## 1. 环境准备

在开始部署之前，请确保目标服务器（推荐 Ubuntu 22.04）已安装以下基础环境：

| 软件/工具 | 版本要求 | 说明 |
| :--- | :--- | :--- |
| **Node.js** | v22.13.0+ | 运行环境 |
| **pnpm** | v10.x | 包管理器（项目使用 pnpm@10.4.1） |
| **MySQL** | 8.0.36+ | 数据库（阿里云 RDS 或自建） |
| **PM2** | 最新版 | Node.js 进程管理工具 |
| **Nginx** | 最新版 | Web 服务器与反向代理 |

### 1.1 安装 Node.js 和 pnpm

如果尚未安装，可以通过以下命令安装：

```bash
# 安装 Node.js (使用 nvm 推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22.13.0
nvm use 22.13.0

# 安装 pnpm 和 pm2
npm install -g pnpm pm2
```

## 2. 环境变量配置

项目依赖多个环境变量来连接数据库、外部 API 和认证服务。在项目根目录下创建 `.env` 文件（或在部署流水线中注入）。

### 2.1 后端环境变量 (`.env`)

```env
# 运行环境
NODE_ENV=production
PORT=3000

# 数据库连接 (必须)
# 格式: mysql://用户名:密码@主机地址:端口/数据库名
DATABASE_URL=mysql://root:password@rm-xxxx.mysql.rds.aliyuncs.com:3306/ai_job_transform

# JWT 签名密钥 (必须，用于 Session Cookie)
JWT_SECRET=your_secure_random_string_here

# OAuth 认证配置 (如果采用 iframe 静默登录改造，此部分可作为 fallback)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://auth.yourdomain.com
OWNER_OPEN_ID=admin_user_open_id

# Forge API 配置 (必须，用于 LLM 调用和 S3 存储)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your_forge_api_key_here
```

### 2.2 前端环境变量 (`.env.production`)

如果前端需要独立的构建时变量，可以在根目录创建 `.env.production`：

```env
# 前端 OAuth 登录跳转地址
VITE_OAUTH_PORTAL_URL=https://portal.yourdomain.com

# 谷歌地图代理配置 (可选，如果使用了 Map 组件)
VITE_FRONTEND_FORGE_API_URL=https://forge.butterfly-effect.dev
VITE_FRONTEND_FORGE_API_KEY=your_frontend_forge_key

# 埋点统计配置 (可选，对应 index.html 中的占位符)
VITE_ANALYTICS_ENDPOINT=https://analytics.yourdomain.com
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

## 3. 依赖安装与数据库初始化

### 3.1 安装依赖

进入项目根目录，使用 pnpm 安装所有依赖：

```bash
cd /path/to/ai-job-transform
pnpm install
```

### 3.2 数据库迁移

确保 `.env` 中的 `DATABASE_URL` 配置正确，然后执行 Drizzle 的数据库迁移命令，将表结构同步到 MySQL：

```bash
pnpm db:push
```

> **注意**：如果已经完成了“企业数据隔离改造”（新增了 `companyId` 字段），请确保执行此命令前代码已更新，以便在数据库中创建最新的表结构。

## 4. 项目构建

项目包含前端（Vite + React）和后端（Express + tRPC）。使用提供的 npm script 进行全量构建：

```bash
pnpm run build
```

构建完成后，会生成以下产物：
- `dist/public/`：前端静态资源文件（由 Vite 构建）。
- `dist/index.js`：后端服务端代码（由 esbuild 打包）。

## 5. 使用 PM2 启动服务

为了保证服务在后台稳定运行并在崩溃时自动重启，我们使用 PM2 来管理 Node.js 进程。

在项目根目录创建一个 `ecosystem.config.cjs` 文件：

```javascript
module.exports = {
  apps: [
    {
      name: "ai-job-transform",
      script: "./dist/index.js",
      instances: 1, // 单实例部署
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      },
      // 日志配置
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      merge_logs: true,
      time: true
    }
  ]
};
```

启动服务：

```bash
# 创建日志目录
mkdir -p logs

# 启动 PM2 进程
pm2 start ecosystem.config.cjs

# 保存 PM2 状态，使其开机自启
pm2 save
pm2 startup
```

## 6. Nginx 反向代理与安全配置

Nginx 负责处理 HTTPS 证书、静态文件缓存、反向代理到 Node.js 服务，以及配置 iframe 嵌入的安全策略。

在 `/etc/nginx/sites-available/` 目录下创建配置文件 `ai-job-transform.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 强制跳转 HTTPS (建议配置)
    # return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    # SSL 证书配置
    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;

    # 安全响应头配置 (关键：允许特定域名 iframe 嵌入)
    # 替换 https://academy.hrflag.com/ 为实际允许的父系统域名
    add_header Content-Security-Policy "frame-ancestors 'self' https://academy.hrflag.com/;" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 代理到 Node.js 后端服务
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE (Server-Sent Events) 支持，用于分析进度推送
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # 静态资源缓存优化 (可选，因为 Express 也会处理，但 Nginx 处理更快)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

启用配置并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/ai-job-transform.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 7. 部署验证检查单

部署完成后，请按照以下步骤验证系统是否正常运行：

1. **服务状态检查**：运行 `pm2 status` 确认 `ai-job-transform` 状态为 `online`。
2. **日志检查**：运行 `pm2 logs ai-job-transform` 查看是否有启动报错（如数据库连接失败、缺少 API Key 等）。
3. **访问测试**：在浏览器中直接访问配置的域名，确认页面能正常加载。
4. **iframe 嵌入测试**：在 `https://academy.hrflag.com/` 的测试页面中通过 `<iframe>` 嵌入该系统，检查浏览器控制台是否有 CSP 拦截报错。
5. **SSE 进度测试**：提交一次分析任务，观察进度条是否能正常实时更新（验证 Nginx 的 SSE 配置是否生效）。
