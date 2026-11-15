import AsyncStorage from '@react-native-async-storage/async-storage';

import { nouvelId } from '../contenu/identifiants';
import { CLE_APPAREIL } from './cles';

let cache: string | null = null;

export async function idAppareil(): Promise<string> {
  if (cache) return cache;
  const existant = await AsyncStorage.getItem(CLE_APPAREIL);
  if (existant) {
    cache = existant;
    return existant;
  }
  const id = nouvelId();
  await AsyncStorage.setItem(CLE_APPAREIL, id);
  cache = id;
  return id;
}
