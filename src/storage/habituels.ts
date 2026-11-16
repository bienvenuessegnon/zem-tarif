import AsyncStorage from '@react-native-async-storage/async-storage';

import { nouvelId } from '../contenu/identifiants';
import type { Lieu } from '../geo/lieux';
import { CLE_HABITUELS } from './cles';

export type IconeHabituel = 'home' | 'book-open' | 'shopping-bag' | 'briefcase' | 'map-pin';

export type TrajetHabituel = {
  id: string;
  nom: string;
  icone: IconeHabituel;
  origin: Lieu;
  dest: Lieu;
  ajouteLe: string;
};

export const MODELES_HABITUELS: Array<{ nom: string; icone: IconeHabituel }> = [
  { nom: 'Maison', icone: 'home' },
  { nom: 'École', icone: 'book-open' },
  { nom: 'Marché', icone: 'shopping-bag' },
  { nom: 'Bureau', icone: 'briefcase' },
];

export async function lireHabituels(): Promise<TrajetHabituel[]> {
  const brut = await AsyncStorage.getItem(CLE_HABITUELS);
  if (!brut) return [];
  try {
    const data = JSON.parse(brut) as TrajetHabituel[];
    return Array.isArray(data) ? data.slice(0, 12) : [];
  } catch {
    return [];
  }
}

export async function enregistrerHabituel(
  entree: Omit<TrajetHabituel, 'id' | 'ajouteLe'> & { id?: string },
): Promise<TrajetHabituel[]> {
  const actuel = await lireHabituels();
  const trajet: TrajetHabituel = {
    id: entree.id ?? nouvelId(),
    nom: entree.nom.trim().slice(0, 32),
    icone: entree.icone,
    origin: entree.origin,
    dest: entree.dest,
    ajouteLe: new Date().toISOString(),
  };
  const suivant = [trajet, ...actuel.filter((h) => h.id !== trajet.id)].slice(0, 12);
  await AsyncStorage.setItem(CLE_HABITUELS, JSON.stringify(suivant));
  return suivant;
}

export async function supprimerHabituel(id: string): Promise<TrajetHabituel[]> {
  const suivant = (await lireHabituels()).filter((h) => h.id !== id);
  await AsyncStorage.setItem(CLE_HABITUELS, JSON.stringify(suivant));
  return suivant;
}
