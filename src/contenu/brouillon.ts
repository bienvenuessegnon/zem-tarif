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

let brouillon: BrouillonCourse | null = null;

export function poserBrouillon(valeur: BrouillonCourse): void {
  brouillon = valeur;
}

export function lireBrouillon(): BrouillonCourse | null {
  return brouillon;
}
