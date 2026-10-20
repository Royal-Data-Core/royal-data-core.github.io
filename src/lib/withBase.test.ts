/**
 * src/lib/withBase.test.ts — ADR-004 base-resolution contract.
 *
 * Root-hosted suite imports statically (Vitest default BASE_URL = "/").
 * Sub-base suites re-import after vi.stubEnv via vi.resetModules because
 * withBase captures import.meta.env.BASE_URL at module evaluation time.
 */
import { describe, expect, it, vi } from "vitest";
import { withBase } from "./withBase";

describe("withBase — root-hosted (BASE_URL=)", () => {
  it("passes through fragment links untouched", () => {
    expect(withBase("#conteudo-principal")).toBe("#conteudo-principal");
  });

  it("passes through protocol-relative URLs untouched", () => {
    expect(withBase("//cdn.example/package.js")).toBe(
      "//cdn.example/package.js",
    );
  });

  it.each([
    ["mailto:contato@example.com", "mailto:contato@example.com"],
    ["tel:+5511999999999", "tel:+5511999999999"],
    ["https://royal-data-core.github.io", "https://royal-data-core.github.io"],
    ["data:text/plain,hi", "data:text/plain,hi"],
  ])("passes through absolute scheme %s untouched", (input, expected) => {
    expect(withBase(input)).toBe(expected);
  });

  it("keeps root-absolute paths root-absolute (no base to attach)", () => {
    expect(withBase("/servicos")).toBe("/servicos");
  });

  it("adds the leading slash to base-relative paths", () => {
    expect(withBase("servicos")).toBe("/servicos");
  });

  it("normalizes empty string to root", () => {
    expect(withBase("")).toBe("/");
  });
});

describe("withBase — base-mounted (BASE_URL=/site-io/)", () => {
  it("prefixes internal paths with the normalized base", async () => {
    vi.resetModules();
    vi.stubEnv("BASE_URL", "/site-io/");
    const mod = await import("./withBase");
    expect(mod.withBase("/blog/contract-testing-pyramid")).toBe(
      "/site-io/blog/contract-testing-pyramid",
    );
  });

  it("is idempotent — never attaches the base twice", async () => {
    vi.resetModules();
    vi.stubEnv("BASE_URL", "/site-io/");
    const mod = await import("./withBase");
    const once = mod.withBase("/busca");
    expect(mod.withBase(once)).toBe(once);
  });

  it("accepts base-relative paths without a leading slash", async () => {
    vi.resetModules();
    vi.stubEnv("BASE_URL", "/site-io/");
    const mod = await import("./withBase");
    expect(mod.withBase("contato")).toBe("/site-io/contato");
  });

  it.each([
    ["#cta", "#cta"],
    ["//cdn.example/x.js", "//cdn.example/x.js"],
    ["https://schema.org", "https://schema.org"],
  ])("still passes through %s untouched (no base semantics)", (p, e) => {
    expect(p === e).toBe(true);
  });
});

describe("withBase — base normalization (BASE_URL=/site-io, no trailing slash)", () => {
  it("appends the missing trailing slash before resolving", async () => {
    vi.resetModules();
    vi.stubEnv("BASE_URL", "/site-io");
    const mod = await import("./withBase");
    expect(mod.withBase("/rss.xml")).toBe("/site-io/rss.xml");
  });
});
