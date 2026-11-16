import type { Lieu } from '@/src/geo/lieux';

export type CibleLieu = 'depart' | 'arrivee';

type Ecouteur = (lieu: Lieu, cible: CibleLieu) => void;

const pile: Ecouteur[] = [];

export type TrajetInitial = { origin: Lieu; dest: Lieu };
let initial: TrajetInitial | null = null;

export function onSelectionLieu(cb: Ecouteur): () => void {
  pile.push(cb);
  return () => {
    const i = pile.lastIndexOf(cb);
    if (i >= 0) pile.splice(i, 1);
  };
}

export function choisirLieu(lieu: Lieu, cible: CibleLieu): void {
  pile[pile.length - 1]?.(lieu, cible);
}

export function poserTrajetInitial(valeur: TrajetInitial): void {
  initial = valeur;
}

export function prendreTrajetInitial(): TrajetInitial | null {
  const v = initial;
  initial = null;
  return v;
}
