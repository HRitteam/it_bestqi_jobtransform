// 确保Node.js进程使用北京时间，与数据库(阿里云RDS UTC+8)一致
process.env.TZ = "Asia/Shanghai";

import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerApiRoutes } from "../apiRoutes";
import { registerExportRoutes } from "../exportRoutes";
import { registerStorageProxy } from "./storageProxy";
import { registerAdminAuthRoute } from "../adminAuthRoute";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./serveStatic";
// [定制] setupVite 仅开发环境使用，改为动态导入，避免生产产物顶层引用 vite

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // [定制] 已移除 iframe 身份识别中间件（iframe 嵌套/域名限制逻辑已全部移除）

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerAdminAuthRoute(app);
  registerApiRoutes(app);
  registerExportRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    // 动态导入，仅开发环境加载 vite（生产环境不会执行到这里）
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
