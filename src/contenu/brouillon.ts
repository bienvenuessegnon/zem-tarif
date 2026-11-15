import type { Lieu } from '../geo/lieux';
import type { Estimation } from '../pricing/types';

export type BrouillonCourse = {
  origin: Lieu;
  dest: Lieu;
  distanceM: number;
  dureeS: number;
  heure: number;
  pluie: boolean;
  estimation: Estimation;
};

const CLE = 'zem-tarif-brouillon';

let brouillon: BrouillonCourse | null = null;

function stockage(): Storage | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

export function poserBrouillon(valeur: BrouillonCourse): void {
  brouillon = valeur;
  try {
    stockage()?.setItem(CLE, JSON.stringify(valeur));
  } catch {
    // Le brouillon reste en mémoire si le stockage est indisponible.
  }
}

export function lireBrouillon(): BrouillonCourse | null {
  if (brouillon) return brouillon;
  try {
    const brut = stockage()?.getItem(CLE);
    if (brut) {
      brouillon = JSON.parse(brut) as BrouillonCourse;
    }
  } catch {
    brouillon = null;
  }
  return brouillon;
}
