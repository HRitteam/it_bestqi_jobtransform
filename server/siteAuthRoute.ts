/**
 * Site access password verification.
 *
 * This is the first-level visitor gate for the whole app. The password is
 * configured via SITE_PASSWORD in the server environment, so production can
 * rotate it without rebuilding the frontend bundle.
 */
import type { Express } from "express";
import { ENV } from "./_core/env";

export function registerSiteAuthRoute(app: Express) {
  app.post("/api/site/verify", (req, res) => {
    const { password } = req.body;

    if (!password || typeof password !== "string") {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    if (!ENV.sitePassword) {
      return res.status(500).json({ success: false, message: "Site password is not configured" });
    }

    if (password === ENV.sitePassword) {
      return res.json({ success: true });
    }

    return res.status(401).json({ success: false, message: "Invalid password" });
  });
}
