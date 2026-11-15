import { haversineM } from '../geo/haversine';
import { RAYON_PROCHE_M } from './constantes';
import type { DemandeEstimation, Signalement } from './types';

function memeOrientation(
  demande: DemandeEstimation,
  signalement: Signalement,
): { originM: number; destM: number } {
  const direct = {
    originM: haversineM(
      demande.originLat,
      demande.originLon,
      signalement.originLat,
      signalement.originLon,
    ),
    destM: haversineM(
      demande.destLat,
      demande.destLon,
      signalement.destLat,
      signalement.destLon,
    ),
  };
  const inverse = {
    originM: haversineM(
      demande.originLat,
      demande.originLon,
      signalement.destLat,
      signalement.destLon,
    ),
    destM: haversineM(
      demande.destLat,
      demande.destLon,
      signalement.originLat,
      signalement.originLon,
    ),
  };
  const scoreDirect = Math.max(direct.originM, direct.destM);
  const scoreInverse = Math.max(inverse.originM, inverse.destM);
  return scoreInverse < scoreDirect ? inverse : direct;
}

/**
 * Un signalement compte s'il relie à peu près les mêmes deux points
 * (dans un sens ou dans l'autre), et s'il a été saisi comme un vrai
 * avis d'usager. Les exemples de calibration sont exclus.
 */
export function signalementsProches(
  demande: DemandeEstimation,
  signalements: Signalement[],
  rayonM = RAYON_PROCHE_M,
): Signalement[] {
  return signalements.filter((s) => {
    if (s.source !== 'utilisateur') {
      return false;
    }
    if (!Number.isFinite(s.prixPayeFcfa) || s.prixPayeFcfa <= 0) {
      return false;
    }
    const { originM, destM } = memeOrientation(demande, s);
    return originM <= rayonM && destM <= rayonM;
  });
}

export function mediane(valeurs: number[]): number | null {
  if (valeurs.length === 0) {
    return null;
  }
  const triees = [...valeurs].sort((a, b) => a - b);
  const milieu = Math.floor(triees.length / 2);
  if (triees.length % 2 === 0) {
    return (triees[milieu - 1] + triees[milieu]) / 2;
  }
  return triees[milieu];
}
