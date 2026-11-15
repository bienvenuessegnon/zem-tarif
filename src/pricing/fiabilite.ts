/** Fiabilité d'un appareil et médiane pondérée des prix signalés. */

export const POIDS_MIN_ABERRANT = 0.15;
/** Un écart de 60 % par rapport à la référence ramène le poids au plancher. */
export const ECART_POUR_PLANCHER = 0.6;

export type HistoriqueFiabilite = {
  prixPaye: number;
  prixRef: number | null | undefined;
};

export type BilanFiabilite = {
  score: number;
  nb: number;
  libelle: string;
  moyennePoids: number;
};

export function poidsSignalement(
  prixPaye: number,
  prixRef: number | null | undefined,
): number {
  if (prixRef == null || !Number.isFinite(prixRef) || prixRef <= 0) {
    return 0.5;
  }
  const ecart = Math.abs(prixPaye - prixRef) / prixRef;
  return Math.max(POIDS_MIN_ABERRANT, Math.min(1, 1 - ecart / ECART_POUR_PLANCHER));
}

export function libelleFiabilite(score: number, nb: number): string {
  if (nb <= 0) return 'Pas encore de signalement';
  if (score < 40) return 'À confirmer';
  if (score < 70) return 'En construction';
  return 'Contributeur régulier';
}

/**
 * Score 0–100 : cohérence des prix par rapport à la référence,
 * modulée par le volume d'historique. Les valeurs aberrantes
 * restent dans le calcul, avec un poids réduit (jamais à zéro).
 */
export function scoreFiabilite(historique: HistoriqueFiabilite[]): BilanFiabilite {
  const nb = historique.length;
  if (nb === 0) {
    return { score: 0, nb: 0, libelle: libelleFiabilite(0, 0), moyennePoids: 0 };
  }
  const poids = historique.map((h) => poidsSignalement(h.prixPaye, h.prixRef));
  const moyennePoids = poids.reduce((s, p) => s + p, 0) / poids.length;
  const facteurVolume = Math.min(1, 0.45 + 0.11 * nb);
  const score = Math.round(100 * moyennePoids * facteurVolume);
  return {
    score,
    nb,
    libelle: libelleFiabilite(score, nb),
    moyennePoids,
  };
}

export function medianePonderee(
  valeurs: Array<{ prix: number; poids: number }>,
): number | null {
  const vals = valeurs
    .filter((v) => Number.isFinite(v.prix) && v.poids > 0)
    .sort((a, b) => a.prix - b.prix);
  if (vals.length === 0) return null;
  const total = vals.reduce((s, v) => s + v.poids, 0);
  if (total <= 0) return null;
  let acc = 0;
  for (const v of vals) {
    acc += v.poids;
    if (acc >= total / 2) return v.prix;
  }
  return vals[vals.length - 1].prix;
}
