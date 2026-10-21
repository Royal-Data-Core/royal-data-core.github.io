/**
 * SPEC-012 AC-012.5 — the regional radius claim is verifiable.
 *
 * Scenarios (Gherkin, SPEC-012 §5):
 *   - AC-012.5.1  every city the copy may cite is inside the 100 km radius;
 *   - AC-012.5.2  every city outside the radius is outside it (dataset sanity);
 *   - AC-012.5.3  the published copy cites NO city outside the radius in a
 *     regional/on-site claim (the negative scenario proves the detector bites);
 *   - AC-012.5.4  the radius is centred on the hub (Matão/SP).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CITIES_INSIDE,
  CITIES_OUTSIDE,
  HUB,
  SERVICE_RADIUS_KM,
  findRegionalViolations,
  haversineKm,
  isInsideRadius,
} from "./region";

function collectFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectFiles(full, out);
    else if (full.endsWith(".astro")) out.push(full);
  }
  return out;
}

describe("SPEC-012/AC-012.5 — raio regional verificável", () => {
  it("AC-012.5.1 — as cidades citáveis estão dentro do raio", () => {
    for (const [city, point] of Object.entries(CITIES_INSIDE)) {
      const distance = haversineKm(HUB, point);
      expect(
        distance,
        `${city} a ${distance.toFixed(1)} km do hub`,
      ).toBeLessThanOrEqual(SERVICE_RADIUS_KM);
    }
  });

  it("AC-012.5.2 — as cidades fora do raio estão fora dele", () => {
    for (const [city, point] of Object.entries(CITIES_OUTSIDE)) {
      expect(isInsideRadius(point), city).toBe(false);
    }
  });

  it("AC-012.5.3 — a copy publicada não cita cidade fora do raio", () => {
    const root = process.cwd();
    const files = [
      ...collectFiles(join(root, "src/pages")),
      ...collectFiles(join(root, "src/components")),
    ].map((path) => ({
      path: relative(root, path),
      content: readFileSync(path, "utf8"),
    }));
    expect(files.length).toBeGreaterThan(5);
    expect(findRegionalViolations(files)).toEqual([]);
  });

  it("AC-012.5.4 — o raio é centrado no hub (Matão/SP)", () => {
    expect(haversineKm(HUB, HUB)).toBe(0);
    // Contraprova do detector (cenário negativo): um bloco sintético que
    // associa uma cidade fora do raio a uma promessa regional é reprovado.
    const violations = findRegionalViolations([
      {
        path: "synthetic.astro",
        content:
          "Atendimento presencial sob combinação, num raio de 100 km de Matão/SP, incluindo Piracicaba.",
      },
    ]);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.city).toBe("Piracicaba");
  });
});
