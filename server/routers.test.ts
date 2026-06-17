import { describe, expect, it } from "vitest";
import { checkPermission } from "./routers";

describe("checkPermission", () => {
  it("free user cannot access pro features", () => {
    const user = { tier: "free" };
    expect(checkPermission(user, "ppt_export").allowed).toBe(false);
    expect(checkPermission(user, "batch_analysis").allowed).toBe(false);
    expect(checkPermission(user, "no_watermark").allowed).toBe(false);
    expect(checkPermission(user, "custom_template").allowed).toBe(false);
    expect(checkPermission(user, "priority_queue").allowed).toBe(false);
  });

  it("free user can access non-pro features", () => {
    const user = { tier: "free" };
    expect(checkPermission(user, "basic_analysis").allowed).toBe(true);
    expect(checkPermission(user, "pdf_export").allowed).toBe(true);
    expect(checkPermission(user, "word_export").allowed).toBe(true);
  });

  it("pro user can access pro features", () => {
    const user = { tier: "pro" };
    expect(checkPermission(user, "ppt_export").allowed).toBe(true);
    expect(checkPermission(user, "batch_analysis").allowed).toBe(true);
    expect(checkPermission(user, "no_watermark").allowed).toBe(true);
  });

  it("pro user cannot access enterprise features", () => {
    const user = { tier: "pro" };
    expect(checkPermission(user, "team_management").allowed).toBe(false);
    expect(checkPermission(user, "api_access").allowed).toBe(false);
    expect(checkPermission(user, "sso").allowed).toBe(false);
  });

  it("enterprise user can access all features", () => {
    const user = { tier: "enterprise" };
    expect(checkPermission(user, "ppt_export").allowed).toBe(true);
    expect(checkPermission(user, "batch_analysis").allowed).toBe(true);
    expect(checkPermission(user, "team_management").allowed).toBe(true);
    expect(checkPermission(user, "api_access").allowed).toBe(true);
    expect(checkPermission(user, "sso").allowed).toBe(true);
  });

  it("user with no tier defaults to free", () => {
    const user = {};
    expect(checkPermission(user, "ppt_export").allowed).toBe(false);
    expect(checkPermission(user, "basic_analysis").allowed).toBe(true);
  });

  it("null user defaults to free", () => {
    expect(checkPermission(null, "ppt_export").allowed).toBe(false);
    expect(checkPermission(null, "basic_analysis").allowed).toBe(true);
  });
});
