/**
 * SPEC-010 AC-010.4 — the design-token contrast gate.
 *
 * Scenarios (Gherkin, SPEC-010 §7):
 *   - AC-010.4.1  every required role pair clears AA in every theme;
 *   - AC-010.4.2  a deliberately failing pair IS detected (negative scenario —
 *     the gate must be able to fail, otherwise it proves nothing);
 *   - AC-010.4.3  the stylesheet exposes the three canonical themes with the
 *     full role set (a missing role is a hard failure, not a skip).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  AA_TEXT,
  auditThemes,
  contrastRatio,
  parseHexColor,
  parseThemeTokens,
  relativeLuminance,
} from "./contrast";

const STYLESHEET_PATH = resolve(process.cwd(), "src/styles/global.css");
const stylesheet = readFileSync(STYLESHEET_PATH, "utf8");

describe("SPEC-010/AC-010.4 — contraste dos tokens de marca", () => {
  it("AC-010.4.1 — todo par de roles passa AA em todos os temas", () => {
    const themes = parseThemeTokens(stylesheet);
    const findings = auditThemes(themes);
    expect(findings.length).toBeGreaterThan(0);
    const failures = findings.filter((finding) => !finding.passes);
    expect(
      failures.map(
        (failure) =>
          `${failure.theme}:${failure.pair} = ${failure.ratio} (min ${failure.threshold})`,
      ),
    ).toEqual([]);
  });

  it("AC-010.4.2 — par deliberadamente inválido é detectado (cenário negativo)", () => {
    // Royal Blue sobre o próprio hover: 1.72:1 — reprova com folga.
    const ratio = contrastRatio("#1d4ed8", "#2563eb");
    expect(ratio).toBeLessThan(AA_TEXT);
    expect(ratio).toBeGreaterThan(0);
  });

  it("AC-010.4.3 — os três temas canônicos existem com o conjunto completo de roles", () => {
    const themes = parseThemeTokens(stylesheet);
    expect(Object.keys(themes).sort()).toEqual([
      "dark",
      "light",
      "mid",
      "scale",
    ]);
    for (const [theme, roles] of Object.entries(themes)) {
      if (theme === "scale") continue;
      for (const role of [
        "bg",
        "surface",
        "border",
        "border-strong",
        "ink",
        "ink-muted",
        "ink-subtle",
        "accent",
        "accent-hover",
        "accent-active",
        "on-accent",
        "on-accent-hover",
        "focus",
        "link",
        "link-hover",
      ]) {
        expect(
          roles[role],
          `SPEC-010: tema '${theme}' sem role '${role}'`,
        ).toMatch(/^#[0-9a-fA-F]{3,8}$/);
      }
    }
  });

  it("luminância e contraste seguem a fórmula da WCAG 2.1", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(parseHexColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor("#1D4ED8")).toEqual({ r: 29, g: 78, b: 216 });
  });

  it("token malformado falha duro (nunca é ignorado)", () => {
    expect(() => parseHexColor("rgb(1,2,3)")).toThrow(/SPEC-010/);
  });
});
