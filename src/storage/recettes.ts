import AsyncStorage from '@react-native-async-storage/async-storage';

import { nouvelId } from '../contenu/identifiants';
import { CLE_RECETTES } from './cles';

export type Recette = {
  id: string;
  prixFcfa: number;
  de: string;
  vers: string;
  enregistreLe: string;
};

export async function lireRecettes(): Promise<Recette[]> {
  const brut = await AsyncStorage.getItem(CLE_RECETTES);
  if (!brut) return [];
  try {
    const data = JSON.parse(brut) as Recette[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function ajouterRecette(
  entree: Omit<Recette, 'id' | 'enregistreLe'> & { id?: string; enregistreLe?: string },
): Promise<Recette[]> {
  const actuel = await lireRecettes();
  const recette: Recette = {
    id: entree.id ?? nouvelId(),
    prixFcfa: entree.prixFcfa,
    de: entree.de,
    vers: entree.vers,
    enregistreLe: entree.enregistreLe ?? new Date().toISOString(),
  };
  const suivant = [recette, ...actuel].slice(0, 200);
  await AsyncStorage.setItem(CLE_RECETTES, JSON.stringify(suivant));
  return suivant;
}

export function recettesDuJour(liste: Recette[], maintenant = new Date()): Recette[] {
  const jour = maintenant.toLocaleDateString('fr-FR', { timeZone: 'Africa/Porto-Novo' });
  return liste.filter(
    (r) =>
      new Date(r.enregistreLe).toLocaleDateString('fr-FR', {
        timeZone: 'Africa/Porto-Novo',
      }) === jour,
  );
}

export function totalRecettes(liste: Recette[]): number {
  return liste.reduce((s, r) => s + r.prixFcfa, 0);
}
