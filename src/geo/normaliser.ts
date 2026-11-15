/** Normalise une chaîne pour une recherche insensible aux accents et à la casse. */
export function sansAccents(saisie: string): string {
  return saisie
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .toLowerCase();
}

export function jetons(saisie: string): string[] {
  return sansAccents(saisie)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((j) => j.length > 0);
}

/** Distance de Levenshtein bornée (utile pour les fautes d'une lettre). */
export function distanceEdition(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  if (Math.abs(a.length - b.length) > 2) return 99;
  const ligne = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) ligne[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    let prec = i - 1;
    ligne[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const tmp = ligne[j];
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      ligne[j] = Math.min(ligne[j] + 1, ligne[j - 1] + 1, prec + cout);
      prec = tmp;
    }
  }
  return ligne[b.length];
}

/** Forme comparable : accents, casse, tirets et ponctuation ignorés. */
export function formeRecherche(saisie: string): string {
  return sansAccents(saisie)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
