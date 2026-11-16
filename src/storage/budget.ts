import AsyncStorage from '@react-native-async-storage/async-storage';

import { nouvelId } from '../contenu/identifiants';
import { CLE_BUDGET, CLE_BUDGET_PLAFOND } from './cles';

export type DepenseTransport = {
  id: string;
  prixFcfa: number;
  de: string;
  vers: string;
  enregistreLe: string;
  source: 'signalement' | 'saisie';
};

export async function lireDepenses(): Promise<DepenseTransport[]> {
  const brut = await AsyncStorage.getItem(CLE_BUDGET);
  if (!brut) return [];
  try {
    const data = JSON.parse(brut) as DepenseTransport[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function ajouterDepense(
  entree: Omit<DepenseTransport, 'id' | 'enregistreLe'> & {
    id?: string;
    enregistreLe?: string;
  },
): Promise<DepenseTransport[]> {
  const actuel = await lireDepenses();
  const depense: DepenseTransport = {
    id: entree.id ?? nouvelId(),
    prixFcfa: Math.round(entree.prixFcfa),
    de: entree.de,
    vers: entree.vers,
    enregistreLe: entree.enregistreLe ?? new Date().toISOString(),
    source: entree.source,
  };
  const suivant = [depense, ...actuel].slice(0, 500);
  await AsyncStorage.setItem(CLE_BUDGET, JSON.stringify(suivant));
  return suivant;
}

export async function supprimerDepense(id: string): Promise<DepenseTransport[]> {
  const suivant = (await lireDepenses()).filter((d) => d.id !== id);
  await AsyncStorage.setItem(CLE_BUDGET, JSON.stringify(suivant));
  return suivant;
}

export async function lirePlafondMensuel(): Promise<number | null> {
  const brut = await AsyncStorage.getItem(CLE_BUDGET_PLAFOND);
  if (!brut) return null;
  const n = Number(brut);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function ecrirePlafondMensuel(valeur: number | null): Promise<void> {
  if (valeur == null || valeur <= 0) {
    await AsyncStorage.removeItem(CLE_BUDGET_PLAFOND);
    return;
  }
  await AsyncStorage.setItem(CLE_BUDGET_PLAFOND, String(Math.round(valeur)));
}
