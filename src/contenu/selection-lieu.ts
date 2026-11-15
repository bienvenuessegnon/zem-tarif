import type { Lieu } from '@/src/geo/lieux';

export type CibleLieu = 'depart' | 'arrivee';

type Ecouteur = (lieu: Lieu, cible: CibleLieu) => void;

let ecouteur: Ecouteur | null = null;

export type TrajetInitial = { origin: Lieu; dest: Lieu };
let initial: TrajetInitial | null = null;

export function onSelectionLieu(cb: Ecouteur): () => void {
  ecouteur = cb;
  return () => {
    if (ecouteur === cb) ecouteur = null;
  };
}

export function choisirLieu(lieu: Lieu, cible: CibleLieu): void {
  ecouteur?.(lieu, cible);
}

export function poserTrajetInitial(valeur: TrajetInitial): void {
  initial = valeur;
}

export function prendreTrajetInitial(): TrajetInitial | null {
  const v = initial;
  initial = null;
  return v;
}
