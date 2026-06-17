import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * 生产环境静态资源服务（不依赖 vite）
 * [定制] 从 vite.ts 中拆出，避免生产构建产物在顶层引用 vite 导致
 *        ERR_MODULE_NOT_FOUND（生产仅 pnpm install --prod，不含 devDependencies 的 vite）。
 */
export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
