/** Emprise large du Grand Nokoué (Cotonou, Abomey-Calavi, Sèmè-Podji, Porto-Novo, Ouidah). */
export const EMPRISE = {
  latMin: 6.2,
  latMax: 6.62,
  lonMin: 2.0,
  lonMax: 2.75,
} as const;

export function dansLaZone(lat: number, lon: number): boolean {
  return (
    lat >= EMPRISE.latMin &&
    lat <= EMPRISE.latMax &&
    lon >= EMPRISE.lonMin &&
    lon <= EMPRISE.lonMax
  );
}
