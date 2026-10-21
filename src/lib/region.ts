/**
 * SPEC-011 AC-011.6 — regional service radius (Brazil) as a verifiable claim.
 *
 * The site promises on-site work only inside a radius around Matão/SP (the
 * operational hub). The promise is only defensible if it is OBJECTIVE and
 * AUDITABLE — hence the radius (100 km, haversine) instead of an
 * unfalsifiable "we cover the whole region" (CONSTITUTION §C9).
 *
 * This module is the single source of truth for the geography: the unit gate
 * (SPEC-012 AC-012.5) asserts that no page claims a city outside the radius.
 */

export interface GeoPoint {
  readonly lat: number;
  readonly lon: number;
}

/** Operational hub — Royal Data Core's base (Matão/SP). */
export const HUB: GeoPoint = { lat: -21.7986, lon: -48.0897 };

/** Maximum distance (km) for on-site work. */
export const SERVICE_RADIUS_KM = 100;

/** Cities inside the radius — citable in the copy. */
export const CITIES_INSIDE: Record<string, GeoPoint> = {
  Matão: HUB,
  Araraquara: { lat: -21.1994, lon: -48.1049 },
  "Ribeirão Preto": { lat: -21.1785, lon: -47.8107 },
  "São Carlos": { lat: -21.9867, lon: -48.0078 },
  Jaboticabal: { lat: -21.2064, lon: -48.2694 },
  Descalvado: { lat: -21.9153, lon: -47.7136 },
};

/** Cities outside the radius — NEVER citable as covered territory. */
export const CITIES_OUTSIDE: Record<string, GeoPoint> = {
  Piracicaba: { lat: -22.7253, lon: -47.6494 },
  Bauru: { lat: -22.3155, lon: -49.0611 },
  Campinas: { lat: -22.9058, lon: -47.0608 },
  "São José do Rio Preto": { lat: -20.8197, lon: -49.3787 },
};

const EARTH_RADIUS_KM = 6371;

const toRad = (degrees: number): number => (degrees * Math.PI) / 180;

/** Great-circle distance between two points (km). */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** True when the city is within the service radius of the hub. */
export function isInsideRadius(city: GeoPoint): boolean {
  return haversineKm(HUB, city) <= SERVICE_RADIUS_KM;
}

/** Markers that introduce a regional/on-site claim in the copy. */
export const REGIONAL_MARKERS: readonly RegExp[] = [
  /\b100\s*km\b/i,
  /\braio de\b/i,
  /\bpresencial\b/i,
  /\bon-?site\b/i,
  /\bin-?person\b/i,
];

/**
 * Scans source files for blocks that make a regional claim and returns the
 * violations: a city outside the radius cited in the same block.
 */
export function findRegionalViolations(
  files: ReadonlyArray<{ path: string; content: string }>,
): Array<{ path: string; city: string; snippet: string }> {
  const violations: Array<{ path: string; city: string; snippet: string }> = [];
  for (const file of files) {
    const blocks = file.content.split(/\n\s*\n/);
    for (const block of blocks) {
      if (!REGIONAL_MARKERS.some((marker) => marker.test(block))) continue;
      for (const city of Object.keys(CITIES_OUTSIDE)) {
        if (!new RegExp(`\\b${city}\\b`, "i").test(block)) continue;
        violations.push({
          path: file.path,
          city,
          snippet: block.replace(/\s+/g, " ").slice(0, 160),
        });
      }
    }
  }
  return violations;
}
