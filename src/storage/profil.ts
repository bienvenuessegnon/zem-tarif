import AsyncStorage from '@react-native-async-storage/async-storage';

import { CLE_PROFIL } from './cles';

export type RoleUtilisateur = 'passager' | 'conducteur';

export type Profil = {
  pseudo: string;
  onboardingVu: boolean;
  role: RoleUtilisateur;
};

const VIDE: Profil = { pseudo: '', onboardingVu: false, role: 'passager' };

export async function lireProfil(): Promise<Profil> {
  const brut = await AsyncStorage.getItem(CLE_PROFIL);
  if (!brut) return { ...VIDE };
  try {
    const data = JSON.parse(brut) as Partial<Profil>;
    return {
      pseudo: typeof data.pseudo === 'string' ? data.pseudo.slice(0, 32) : '',
      onboardingVu: Boolean(data.onboardingVu),
      role: data.role === 'conducteur' ? 'conducteur' : 'passager',
    };
  } catch {
    return { ...VIDE };
  }
}

export async function ecrireProfil(profil: Profil): Promise<void> {
  await AsyncStorage.setItem(CLE_PROFIL, JSON.stringify(profil));
}

export async function enregistrerPseudo(pseudo: string): Promise<Profil> {
  const actuel = await lireProfil();
  const suivant = { ...actuel, pseudo: pseudo.trim().slice(0, 32) };
  await ecrireProfil(suivant);
  return suivant;
}

export async function enregistrerRole(role: RoleUtilisateur): Promise<Profil> {
  const actuel = await lireProfil();
  const suivant = { ...actuel, role };
  await ecrireProfil(suivant);
  return suivant;
}

export async function marquerOnboardingVu(pseudo?: string): Promise<Profil> {
  const actuel = await lireProfil();
  const suivant: Profil = {
    ...actuel,
    onboardingVu: true,
    pseudo: (pseudo ?? actuel.pseudo).trim().slice(0, 32),
  };
  await ecrireProfil(suivant);
  return suivant;
}

export async function revoirOnboarding(): Promise<void> {
  const actuel = await lireProfil();
  await ecrireProfil({ ...actuel, onboardingVu: false });
}
