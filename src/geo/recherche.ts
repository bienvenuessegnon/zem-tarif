import { distanceEdition, jetons, sansAccents } from '@/src/geo/normaliser';
import { haversineM } from '@/src/geo/haversine';
import type { Reper } from '@/src/geo/reperes';
import { REPERES_BUNDLES } from '@/src/geo/reperes';

export type ResultatRecherche = {
  reper: Reper;
  score: number;
  distanceM?: number;
};

export type Position = { lat: number; lon: number };

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

  const qNorm = sansAccents(q);
  const tokens = jetons(q);
  if (!tokens.length) return [];

  const resultats: ResultatRecherche[] = [];
  for (const reper of jeu) {
    const hay = sansAccents(`${reper.nom} ${reper.detail ?? ''} ${reper.type}`);
    const nom = sansAccents(reper.nom);
    const score = noter(nom, hay, qNorm, tokens);
    if (score <= 0) continue;
    const distanceM = options.position
      ? haversineM(options.position.lat, options.position.lon, reper.lat, reper.lon)
      : undefined;
    resultats.push({ reper, score, distanceM });
  }

  resultats.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (a.distanceM ?? 1e9) - (b.distanceM ?? 1e9);
  });
  return resultats.slice(0, limite);
}

function noter(nom: string, hay: string, qNorm: string, tokens: string[]): number {
  if (nom === qNorm) return 100;
  if (nom.startsWith(qNorm)) return 92;
  if (hay.startsWith(qNorm)) return 88;
  if (nom.includes(qNorm)) return 80;
  if (hay.includes(qNorm)) return 70;

  let score = 0;
  let tous = true;
  for (const tok of tokens) {
    if (nom.startsWith(tok)) {
      score += 28;
      continue;
    }
    if (hay.includes(tok)) {
      score += 22;
      continue;
    }
    // faute d'une lettre sur un mot du nom
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
