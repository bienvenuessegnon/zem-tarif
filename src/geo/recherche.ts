import { distanceEdition, formeRecherche, jetons } from '@/src/geo/normaliser';
import { haversineM } from '@/src/geo/haversine';
import type { CategorieReper, Reper } from '@/src/geo/reperes';
import { REPERES_BUNDLES } from '@/src/geo/reperes';

export type ResultatRecherche = {
  reper: Reper;
  score: number;
  distanceM?: number;
};

export type Position = { lat: number; lon: number };

/**
 * Écart de score en dessous duquel un carrefour, un marché, une gare
 * ou un quartier passe devant une église ou une pharmacie.
 */
export const SEUIL_SCORE_PROCHE = 12;

/** Repères les plus utiles pour se mettre d’accord sur un trajet. */
export const PRIORITE_TRANSPORT: Partial<Record<CategorieReper, number>> = {
  carrefour: 4,
  marche: 4,
  gare: 3,
  quartier: 3,
};

export function prioriteTransport(categorie: CategorieReper): number {
  return PRIORITE_TRANSPORT[categorie] ?? 0;
}

/**
 * Recherche floue insensible aux accents.
 * Plus le score est élevé, plus le lieu est pertinent.
 */
export function rechercherReperes(
  requete: string,
  options: {
    limite?: number;
    position?: Position;
    jeu?: Reper[];
  } = {},
): ResultatRecherche[] {
  const limite = options.limite ?? 30;
  const jeu = options.jeu ?? REPERES_BUNDLES;
  const q = requete.trim();
  if (!q) {
    if (!options.position) {
      return jeu.slice(0, limite).map((reper) => ({ reper, score: 0 }));
    }
    return jeu
      .map((reper) => ({
        reper,
        score: 0,
        distanceM: haversineM(options.position!.lat, options.position!.lon, reper.lat, reper.lon),
      }))
      .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0))
      .slice(0, limite);
  }

  const qNorm = formeRecherche(q);
  const tokens = jetons(q);
  if (!tokens.length) return [];

  const resultats: ResultatRecherche[] = [];
  for (const reper of jeu) {
    const hay = formeRecherche(`${reper.nom} ${reper.detail ?? ''} ${reper.type}`);
    const nom = formeRecherche(reper.nom);
    const score = noter(nom, hay, qNorm, tokens);
    if (score <= 0) continue;
    const distanceM = options.position
      ? haversineM(options.position.lat, options.position.lon, reper.lat, reper.lon)
      : undefined;
    resultats.push({ reper, score, distanceM });
  }

  resultats.sort(comparerResultats);
  return resultats.slice(0, limite);
}

export function comparerResultats(a: ResultatRecherche, b: ResultatRecherche): number {
  const proche = Math.abs(a.score - b.score) <= SEUIL_SCORE_PROCHE;
  if (proche) {
    const pa = prioriteTransport(a.reper.categorie);
    const pb = prioriteTransport(b.reper.categorie);
    if (pb !== pa) return pb - pa;
  }
  if (b.score !== a.score) return b.score - a.score;
  return (a.distanceM ?? 1e9) - (b.distanceM ?? 1e9);
}

function noter(nom: string, hay: string, qNorm: string, tokens: string[]): number {
  if (nom === qNorm) return 100;
  if (nom.startsWith(qNorm)) return 92;
  if (hay.startsWith(qNorm)) return 88;
  // « saint mi » dans « carrefour saint michel »
  if (nom.includes(qNorm)) return 86;
  if (hay.includes(qNorm)) return 78;

  let score = 0;
  let tous = true;
  for (const tok of tokens) {
    if (nom.startsWith(tok) || nom.split(' ').some((m) => m.startsWith(tok))) {
      score += 28;
      continue;
    }
    if (hay.includes(tok)) {
      score += 22;
      continue;
    }
    const mots = nom.split(/\s+/);
    const proche = mots.some(
      (m) => m.length >= 4 && tok.length >= 4 && distanceEdition(m, tok) <= 1,
    );
    if (proche) {
      score += 16;
      continue;
    }
    tous = false;
  }
  if (!tous) return 0;
  return Math.min(68, score);
}
