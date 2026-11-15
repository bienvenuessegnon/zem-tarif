import AsyncStorage from '@react-native-async-storage/async-storage';

import { nouvelId } from '../contenu/identifiants';
import { CLE_SUGGESTIONS } from './cles';

export type SuggestionReper = {
  id: string;
  nom: string;
  detail?: string;
  enregistreLe: string;
};

export async function lireSuggestionsLocales(): Promise<SuggestionReper[]> {
  const brut = await AsyncStorage.getItem(CLE_SUGGESTIONS);
  if (!brut) return [];
  try {
    const data = JSON.parse(brut) as SuggestionReper[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function empilerSuggestion(s: SuggestionReper): Promise<void> {
  const actuel = await lireSuggestionsLocales();
  await AsyncStorage.setItem(CLE_SUGGESTIONS, JSON.stringify([s, ...actuel].slice(0, 30)));
}

export async function ecrireSuggestionsLocales(liste: SuggestionReper[]): Promise<void> {
  await AsyncStorage.setItem(CLE_SUGGESTIONS, JSON.stringify(liste));
}

export function nouvelleSuggestion(nom: string, detail?: string): SuggestionReper {
  return {
    id: nouvelId(),
    nom: nom.trim().slice(0, 120),
    detail: detail?.trim().slice(0, 200) || undefined,
    enregistreLe: new Date().toISOString(),
  };
}
