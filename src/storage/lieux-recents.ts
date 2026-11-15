import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Lieu } from '../geo/lieux';
import { CLE_LIEUX_RECENTS } from './cles';

export async function lireLieuxRecents(): Promise<Lieu[]> {
  const brut = await AsyncStorage.getItem(CLE_LIEUX_RECENTS);
  if (!brut) return [];
  try {
    const data = JSON.parse(brut) as Lieu[];
    return Array.isArray(data) ? data.slice(0, 12) : [];
  } catch {
    return [];
  }
}

export async function memoriserLieuRecent(lieu: Lieu): Promise<Lieu[]> {
  const actuel = await lireLieuxRecents();
  const suivant = [lieu, ...actuel.filter((l) => l.label !== lieu.label)].slice(0, 12);
  await AsyncStorage.setItem(CLE_LIEUX_RECENTS, JSON.stringify(suivant));
  return suivant;
}
