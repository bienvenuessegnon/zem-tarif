import type { Signalement } from '../pricing/types';

/**
 * Adresse du petit backend optionnel.
 * Vide par défaut : l'application fonctionne entièrement en local.
 */
export function urlApi(): string {
  const brut =
    process.env.EXPO_PUBLIC_API_URL ??
    (typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_API_URL : undefined);
  return (brut ?? '').replace(/\/$/, '');
}

export async function envoyerSignalement(s: Signalement): Promise<boolean> {
  const base = urlApi();
  if (!base) {
    return false;
  }
  try {
    const reponse = await fetch(`${base}/api/signalements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    });
    return reponse.ok;
  } catch {
    return false;
  }
}

export async function telechargerSignalements(): Promise<Signalement[]> {
  const base = urlApi();
  if (!base) {
    return [];
  }
  try {
    const reponse = await fetch(`${base}/api/signalements`);
    if (!reponse.ok) {
      return [];
    }
    const data = (await reponse.json()) as Signalement[];
    return Array.isArray(data) ? data.filter((s) => s.source === 'utilisateur') : [];
  } catch {
    return [];
  }
}
