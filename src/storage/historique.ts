import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Lieu } from '../geo/lieux';
import { CLE_HISTORIQUE } from './cles';

export type EntreeHistorique = {
  id: string;
  origin: Lieu;
  dest: Lieu;
  distanceM: number;
  dureeS: number;
  point: number;
  bas: number;
  haut: number;
  nuit: boolean;
  pluie: boolean;
  sourceDistance: 'osrm' | 'vol-oiseau';
  sourcePrix: 'modele' | 'melange';
  enregistreLe: string;
};

export async function lireHistorique(): Promise<EntreeHistorique[]> {
  const brut = await AsyncStorage.getItem(CLE_HISTORIQUE);
  if (!brut) {
    return [];
  }
  try {
    const data = JSON.parse(brut) as EntreeHistorique[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function ajouterHistorique(
  entree: EntreeHistorique,
): Promise<EntreeHistorique[]> {
  const actuel = await lireHistorique();
  const suivant = [entree, ...actuel].slice(0, 40);
  await AsyncStorage.setItem(CLE_HISTORIQUE, JSON.stringify(suivant));
  return suivant;
}

export async function viderHistorique(): Promise<void> {
  await AsyncStorage.removeItem(CLE_HISTORIQUE);
}
