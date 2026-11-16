import AsyncStorage from '@react-native-async-storage/async-storage';

import { CLE_DERNIERE_POSITION } from './cles';

export type PositionEnregistree = {
  lat: number;
  lon: number;
  enregistreeLe: string;
};

export async function lireDernierePosition(): Promise<PositionEnregistree | null> {
  const brut = await AsyncStorage.getItem(CLE_DERNIERE_POSITION);
  if (!brut) return null;
  try {
    const data = JSON.parse(brut) as PositionEnregistree;
    if (!Number.isFinite(data.lat) || !Number.isFinite(data.lon)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function memoriserPosition(lat: number, lon: number): Promise<void> {
  const valeur: PositionEnregistree = { lat, lon, enregistreeLe: new Date().toISOString() };
  await AsyncStorage.setItem(CLE_DERNIERE_POSITION, JSON.stringify(valeur));
}
