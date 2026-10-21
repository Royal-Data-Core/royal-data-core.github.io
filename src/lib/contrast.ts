/**
 * SPEC-010 AC-010.4 — design-token contrast gate (WCAG 2.1 AA).
 *
 * The colour roles of `src/styles/global.css` are the SSOT of the brand. This
 * module is the executable proof that every role pair clears WCAG 2.1 AA in
 * every theme — the check runs in the `unit` gate, so a bad hex never reaches
 * `main` (CONSTITUTION §C10 budgets + §C9 accessibility floor).
 *
 * Pure functions only (no DOM): the CSS file is read from disk and parsed, so
 * there is exactly ONE source of truth (the stylesheet) — no duplicated token
 * table to drift.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** A theme block of the stylesheet: role name -> hex value. */
export type ThemeTokens = Record<string, string>;

/** Theme name -> role -> hex value. */
export type ThemeMap = Record<string, ThemeTokens>;

/** Minimum contrast for body text (WCAG 2.1 AA, 1.4.3). */
export const AA_TEXT = 4.5;
/** Minimum contrast for UI components/graphics (WCAG 2.1 AA, 1.4.11). */
export const AA_NON_TEXT = 3;

/**
 * Parse `#rgb`, `#rrggbb` (case-insensitive) into 8-bit channels.
 * Throws on any other shape — a malformed token is a hard failure, not a
 * silently skipped check.
 */
export function parseHexColor(hex: string): Rgb {
  const normalized = hex.trim().replace(/^#/, "").toLowerCase();
  const short = /^([0-9a-f])([0-9a-f])([0-9a-f])$/.exec(normalized);
  if (short) {
    const [, r, g, b] = short;
    if (!r || !g || !b) {
      throw new Error(`SPEC-010: token de cor inválido '${hex}'`);
    }
    return {
      r: parseInt(r + r, 16),
      g: parseInt(g + g, 16),
      b: parseInt(b + b, 16),
    };
  }
  const full = /^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(normalized);
  if (!full) {
    throw new Error(`SPEC-010: token de cor inválido '${hex}'`);
  }
  const [, r, g, b] = full;
  if (!r || !g || !b) {
    throw new Error(`SPEC-010: token de cor inválido '${hex}'`);
  }
  return { r: parseInt(r, 16), g: parseInt(g, 16), b: parseInt(b, 16) };
}

/** WCAG 2.1 relative luminance (sRGB, linearised channels). */
export function relativeLuminance(color: string): number {
  const { r, g, b } = parseHexColor(color);
  const channel = (value: number): number => {
    const ratio = value / 255;
    return ratio <= 0.03928 ? ratio / 12.92 : ((ratio + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.1 contrast ratio between two colours (1..21). */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Extract a CSS block body by brace matching (the `@theme` block contains
 * nested `@keyframes`, so a regex with `[^}]*` would truncate it).
 */
export function extractBlock(css: string, header: string): string | null {
  const headerIndex = css.indexOf(header);
  if (headerIndex === -1) return null;
  const start = css.indexOf("{", headerIndex + header.length - 1);
  if (start === -1) return null;
  let depth = 0;
  for (let index = start; index < css.length; index += 1) {
    const char = css[index];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(start + 1, index);
    }
  }
  return null;
}

/** Collect `--<prefix><name>: <hex>;` declarations of a block body. */
function collectTokens(body: string, pattern: RegExp): ThemeTokens {
  const roles: ThemeTokens = {};
  const regex = new RegExp(pattern.source, pattern.flags);
  let match = regex.exec(body);
  while (match !== null) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined) {
      roles[name] = value;
    }
    match = regex.exec(body);
  }
  return roles;
}

/**
 * Extract the theme blocks of the stylesheet.
 * `:root` is the Light theme; `[data-theme="<name>"]` are the others; the
 * `@theme` scale block is exposed under the pseudo-theme `scale`.
 */
export function parseThemeTokens(css: string): ThemeMap {
  const themes: ThemeMap = {};
  const blockPattern = /(?::root|\[data-theme="([a-z]+)"\])\s*\{([^}]*)\}/g;
  let match = blockPattern.exec(css);
  while (match !== null) {
    const themeName = match[1] ?? "light";
    const body = match[2] ?? "";
    const roles = collectTokens(
      body,
      /--theme-([a-z-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g,
    );
    themes[themeName] = { ...(themes[themeName] ?? {}), ...roles };
    match = blockPattern.exec(css);
  }

  const scaleBody = extractBlock(css, "@theme");
  if (scaleBody) {
    const scale = collectTokens(
      scaleBody,
      /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g,
    );
    themes.scale = { ...(themes.scale ?? {}), ...scale };
  }

  return themes;
}

export interface ContrastPair {
  /** Human-readable pair id (used in the failure message). */
  id: string;
  /** Foreground role (text/icon colour). */
  foreground: string;
  /** Background role. */
  background: string;
  /** Minimum ratio (defaults to AA text). */
  threshold?: number;
}

/** The role pairs that MUST clear AA in every theme (SPEC-010 §2.5). */
export const REQUIRED_PAIRS: readonly ContrastPair[] = [
  { id: "ink/bg", foreground: "ink", background: "bg" },
  { id: "ink/surface", foreground: "ink", background: "surface" },
  { id: "ink-muted/bg", foreground: "ink-muted", background: "bg" },
  { id: "ink-muted/surface", foreground: "ink-muted", background: "surface" },
  { id: "ink-subtle/bg", foreground: "ink-subtle", background: "bg" },
  { id: "ink-subtle/surface", foreground: "ink-subtle", background: "surface" },
  { id: "link/bg", foreground: "link", background: "bg" },
  { id: "link/surface", foreground: "link", background: "surface" },
  { id: "link-hover/bg", foreground: "link-hover", background: "bg" },
  { id: "link-hover/surface", foreground: "link-hover", background: "surface" },
  {
    id: "on-accent/accent",
    foreground: "on-accent",
    background: "accent",
  },
  {
    id: "on-accent/accent-active",
    foreground: "on-accent",
    background: "accent-active",
  },
  {
    id: "on-accent-hover/accent-hover",
    foreground: "on-accent-hover",
    background: "accent-hover",
  },
  // Non-text (WCAG 1.4.11): the focus ring and the brand-coloured borders are
  // the only affordances that MUST be perceivable without colour-independent
  // cues. Decorative hairlines (`--theme-border`) are exempt by design.
  {
    id: "focus/bg",
    foreground: "focus",
    background: "bg",
    threshold: AA_NON_TEXT,
  },
  {
    id: "focus/surface",
    foreground: "focus",
    background: "surface",
    threshold: AA_NON_TEXT,
  },
  {
    id: "accent/bg",
    foreground: "accent",
    background: "bg",
    threshold: AA_NON_TEXT,
  },
  {
    id: "accent/surface",
    foreground: "accent",
    background: "surface",
    threshold: AA_NON_TEXT,
  },
  {
    id: "accent-hover/bg",
    foreground: "accent-hover",
    background: "bg",
    threshold: AA_NON_TEXT,
  },
];

export interface ContrastFinding {
  theme: string;
  pair: string;
  ratio: number;
  threshold: number;
  passes: boolean;
}

/** Audit every required pair in every theme. */
export function auditThemes(themes: ThemeMap): ContrastFinding[] {
  const findings: ContrastFinding[] = [];
  const resolveRole = (theme: string, role: string): string => {
    if (role.startsWith("scale.")) {
      const scaleRole = role.slice("scale.".length);
      const value = themes.scale?.[scaleRole];
      if (!value) {
        throw new Error(
          `SPEC-010: escala sem role '${scaleRole}' (usado no tema '${theme}')`,
        );
      }
      return value;
    }
    const value = themes[theme]?.[role];
    if (!value) {
      throw new Error(`SPEC-010: tema '${theme}' sem role '${role}'`);
    }
    return value;
  };
  for (const theme of Object.keys(themes)) {
    if (theme === "scale") continue;
    for (const pair of REQUIRED_PAIRS) {
      const foreground = resolveRole(theme, pair.foreground);
      const background = resolveRole(theme, pair.background);
      const ratio = contrastRatio(foreground, background);
      const threshold = pair.threshold ?? AA_TEXT;
      findings.push({
        theme,
        pair: pair.id,
        ratio: Number(ratio.toFixed(2)),
        threshold,
        passes: ratio >= threshold,
      });
    }
  }
  return findings;
}
