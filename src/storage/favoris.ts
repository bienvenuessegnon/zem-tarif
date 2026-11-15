import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Lieu } from '../geo/lieux';
import { nouvelId } from '../contenu/identifiants';
import { CLE_FAVORIS } from './cles';

export type Favori = {
  id: string;
  origin: Lieu;
  dest: Lieu;
  ajouteLe: string;
};

export async function lireFavoris(): Promise<Favori[]> {
  const brut = await AsyncStorage.getItem(CLE_FAVORIS);
  if (!brut) return [];
  try {
    const data = JSON.parse(brut) as Favori[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function memeTrajet(a: Favori, origin: Lieu, dest: Lieu): boolean {
  return a.origin.label === origin.label && a.dest.label === dest.label;
}

export async function estFavori(origin: Lieu, dest: Lieu): Promise<boolean> {
  const liste = await lireFavoris();
  return liste.some((f) => memeTrajet(f, origin, dest));
}

export async function basculerFavori(origin: Lieu, dest: Lieu): Promise<Favori[]> {
  const liste = await lireFavoris();
  const existant = liste.find((f) => memeTrajet(f, origin, dest));
  const suivant = existant
    ? liste.filter((f) => f.id !== existant.id)
    : [
        { id: nouvelId(), origin, dest, ajouteLe: new Date().toISOString() },
        ...liste,
      ].slice(0, 20);
  await AsyncStorage.setItem(CLE_FAVORIS, JSON.stringify(suivant));
  return suivant;
}
