/**
 * src/lib/date.test.ts — deterministic PT-BR formatting (UTC-pinned).
 */
import { describe, expect, it } from "vitest";
import { formatPublishDate, readingMinutes, toIsoDate } from "./date";

const POST_DATE = new Date(Date.UTC(2026, 9, 13)); // 2026-10-13T00:00:00Z

describe("formatPublishDate", () => {
  it("renders 'DD de mês de AAAA' exactly (SPEC-002 AC-002.4)", () => {
    expect(formatPublishDate(POST_DATE)).toBe("13 de outubro de 2026");
  });

  it("is pinned to UTC regardless of local timezone offset", () => {
    const nearMidnight = new Date("2026-10-13T23:30:00Z");
    expect(formatPublishDate(nearMidnight)).toBe("13 de outubro de 2026");
  });
});

describe("toIsoDate", () => {
  it("returns YYYY-MM-DD for <time datetime>", () => {
    expect(toIsoDate(POST_DATE)).toBe("2026-10-13");
  });
});

describe("readingMinutes (AC-004.2/AC-004.3)", () => {
  const words = (n: number): string =>
    Array.from({ length: n }, () => "palavra").join(" ");

  it("returns the minimum of 1 for undefined body", () => {
    expect(readingMinutes(undefined)).toBe(1);
  });

  it("returns the minimum of 1 for an empty body", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("   \n\t  ")).toBe(1);
  });

  it("divides by 220 words per minute, rounded up", () => {
    expect(readingMinutes(words(220))).toBe(1);
    expect(readingMinutes(words(221))).toBe(2);
    expect(readingMinutes(words(440))).toBe(2);
    expect(readingMinutes(words(441))).toBe(3);
  });

  it("collapses runs of whitespace before counting", () => {
    expect(readingMinutes("a   b\tc\nd")).toBe(1);
  });
});
