import AsyncStorage from '@react-native-async-storage/async-storage';

import { nouvelId } from '../contenu/identifiants';
import { CLE_CONTACTS_URGENCE } from './cles';

export type ContactUrgence = {
  id: string;
  nom: string;
  telephone: string;
};

export async function lireContactsUrgence(): Promise<ContactUrgence[]> {
  const brut = await AsyncStorage.getItem(CLE_CONTACTS_URGENCE);
  if (!brut) return [];
  try {
    const data = JSON.parse(brut) as ContactUrgence[];
    return Array.isArray(data) ? data.slice(0, 3) : [];
  } catch {
    return [];
  }
}

export async function ecrireContactsUrgence(liste: ContactUrgence[]): Promise<void> {
  await AsyncStorage.setItem(CLE_CONTACTS_URGENCE, JSON.stringify(liste.slice(0, 3)));
}

export async function ajouterContactUrgence(nom: string, telephone: string): Promise<ContactUrgence[]> {
  const actuel = await lireContactsUrgence();
  if (actuel.length >= 3) return actuel;
  const suivant = [
    ...actuel,
    { id: nouvelId(), nom: nom.trim().slice(0, 40), telephone: telephone.trim().slice(0, 20) },
  ];
  await ecrireContactsUrgence(suivant);
  return suivant;
}

export async function supprimerContactUrgence(id: string): Promise<ContactUrgence[]> {
  const suivant = (await lireContactsUrgence()).filter((c) => c.id !== id);
  await ecrireContactsUrgence(suivant);
  return suivant;
}
