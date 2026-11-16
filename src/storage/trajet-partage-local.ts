import AsyncStorage from '@react-native-async-storage/async-storage';

import { jetonEncoreValide, type TrajetPartageLocal } from '../securite/trajet-partage';
import { CLE_TRAJET_PARTAGE } from './cles';

export type { TrajetPartageLocal };

export async function lireTrajetActif(): Promise<TrajetPartageLocal | null> {
  const brut = await AsyncStorage.getItem(CLE_TRAJET_PARTAGE);
  if (!brut) return null;
  try {
    const data = JSON.parse(brut) as TrajetPartageLocal;
    if (!data.jeton || !jetonEncoreValide(data.expireLe)) {
      await AsyncStorage.removeItem(CLE_TRAJET_PARTAGE);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function poserTrajetActif(valeur: TrajetPartageLocal): Promise<void> {
  await AsyncStorage.setItem(CLE_TRAJET_PARTAGE, JSON.stringify(valeur));
}

export async function viderTrajetActif(): Promise<void> {
  await AsyncStorage.removeItem(CLE_TRAJET_PARTAGE);
}
