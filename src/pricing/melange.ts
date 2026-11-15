import {
  PLANCHER_FCFA,
  POIDS_MAX_SIGNALEMENTS,
  SEUIL_SIGNALEMENTS,
} from './constantes';
import { appliquerPlancher, arrondirAuPas, arrondirPlancher, arrondirPlafond } from './arrondi';
import { COEFF_FOURCHETTE_BAS, COEFF_FOURCHETTE_HAUT } from './constantes';
import { tarifDeBase } from './modele';
import { mediane, signalementsProches } from './proches';
import type { DemandeEstimation, Estimation, Signalement } from './types';

export function poidsSignalements(n: number): number {
  if (n < SEUIL_SIGNALEMENTS) {
    return 0;
  }
  // 3 avis : poids léger ; le plafond est atteint vers 10 avis.
  const t = Math.min(1, (n - (SEUIL_SIGNALEMENTS - 1)) / 8);
  return t * POIDS_MAX_SIGNALEMENTS;
}

export function estimer(
  demande: DemandeEstimation,
  signalements: Signalement[] = [],
): Estimation {
  const base = tarifDeBase(demande.distanceM, demande.conditions);
  const proches = signalementsProches(demande, signalements);
  const medianeSignalements = mediane(proches.map((s) => s.prixPayeFcfa));
  const poids = poidsSignalements(proches.length);
  const pointSansSignalements = base.point;

  let point = pointSansSignalements;
  let sourcePrix: Estimation['sourcePrix'] = 'modele';
  if (medianeSignalements !== null && poids > 0) {
    point = appliquerPlancher(
      arrondirAuPas((1 - poids) * pointSansSignalements + poids * medianeSignalements),
      PLANCHER_FCFA,
    );
    sourcePrix = 'melange';
  }

  const reference = sourcePrix === 'melange' ? point : base.apresPluie;
  const bas = Math.min(
    point,
    appliquerPlancher(arrondirPlancher(reference * COEFF_FOURCHETTE_BAS), PLANCHER_FCFA),
  );
  const haut = Math.max(point, arrondirPlafond(reference * COEFF_FOURCHETTE_HAUT));

  return {
    ...base,
    point,
    bas,
    haut,
    distanceKm: Math.max(0, demande.distanceM) / 1000,
    nbSignalementsProches: proches.length,
    poidsSignalements: poids,
    medianeSignalements,
    pointSansSignalements,
    sourcePrix,
  };
}
