import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Signalement } from '../pricing/types';
import { CLE_FILE_ATTENTE } from './cles';

export async function lireFileAttente(): Promise<Signalement[]> {
  const brut = await AsyncStorage.getItem(CLE_FILE_ATTENTE);
  if (!brut) return [];
  try {
    const data = JSON.parse(brut) as Signalement[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function empilerSignalement(s: Signalement): Promise<void> {
  const actuel = await lireFileAttente();
  if (actuel.some((x) => x.id === s.id)) return;
  await AsyncStorage.setItem(CLE_FILE_ATTENTE, JSON.stringify([s, ...actuel].slice(0, 30)));
}

export async function ecrireFileAttente(liste: Signalement[]): Promise<void> {
  await AsyncStorage.setItem(CLE_FILE_ATTENTE, JSON.stringify(liste));
}
