import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Signalement } from '../pricing/types';
import { CLE_SIGNALEMENTS } from './cles';

export async function lireSignalements(): Promise<Signalement[]> {
  const brut = await AsyncStorage.getItem(CLE_SIGNALEMENTS);
  if (!brut) {
    return [];
  }
  try {
    const data = JSON.parse(brut) as Signalement[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function ajouterSignalement(s: Signalement): Promise<Signalement[]> {
  const actuel = await lireSignalements();
  const suivant = [s, ...actuel];
  await AsyncStorage.setItem(CLE_SIGNALEMENTS, JSON.stringify(suivant));
  return suivant;
}

export async function viderSignalements(): Promise<void> {
  await AsyncStorage.removeItem(CLE_SIGNALEMENTS);
}
