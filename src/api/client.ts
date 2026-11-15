import type { Signalement } from '../pricing/types';
import { idAppareil } from '../storage/appareil';
import { ecrireFileAttente, empilerSignalement, lireFileAttente } from '../storage/file-attente';
import {
  ecrireSuggestionsLocales,
  empilerSuggestion,
  lireSuggestionsLocales,
  type SuggestionReper,
} from '../storage/suggestions';

const DEFAUT = 'https://zem-tarif-api.onrender.com';

export type TrajetCommunaute = {
  originLabel: string;
  destLabel: string;
  nbAvis: number;
  medianeFcfa: number;
  minFcfa: number;
  maxFcfa: number;
  distanceM: number;
};

export type BilanFiabiliteDistant = {
  score: number;
  nb: number;
  libelle: string;
};


/**
 * Adresse de l'API. Une chaîne vide (EXPO_PUBLIC_API_URL=) désactive
 * le réseau et reste uniquement en local.
 */
export function urlApi(): string {
  const brut = process.env.EXPO_PUBLIC_API_URL;
  if (brut === '') return '';
  return (brut ?? DEFAUT).replace(/\/$/, '');
}

async function entetes(): Promise<Record<string, string>> {
  return {
    'Content-Type': 'application/json',
    'X-Device-Id': await idAppareil(),
  };
}

async function poster(s: Signalement): Promise<boolean> {
  const base = urlApi();
  if (!base) return false;
  const appareilId = await idAppareil();
  const controleur = new AbortController();
  const timer = setTimeout(() => controleur.abort(), 10_000);
  try {
    const reponse = await fetch(`${base}/signalements`, {
      method: 'POST',
      headers: await entetes(),
      body: JSON.stringify({ ...s, appareilId }),
      signal: controleur.signal,
    });
    return reponse.ok || reponse.status === 409;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function envoyerSignalement(s: Signalement): Promise<boolean> {
  const ok = await poster(s);
  if (!ok) await empilerSignalement(s);
  return ok;
}

async function posterSuggestion(s: SuggestionReper): Promise<boolean> {
  const base = urlApi();
  if (!base) return false;
  const controleur = new AbortController();
  const timer = setTimeout(() => controleur.abort(), 10_000);
  try {
    const reponse = await fetch(`${base}/suggestions`, {
      method: 'POST',
      headers: await entetes(),
      body: JSON.stringify({
        id: s.id,
        nom: s.nom,
        detail: s.detail,
        enregistreLe: s.enregistreLe,
      }),
      signal: controleur.signal,
    });
    return reponse.ok || reponse.status === 409;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function envoyerSuggestion(s: SuggestionReper): Promise<boolean> {
  const ok = await posterSuggestion(s);
  if (!ok) await empilerSuggestion(s);
  return ok;
}

export async function synchroniserFile(): Promise<number> {
  const file = await lireFileAttente();
  const suggestions = await lireSuggestionsLocales();
  if (file.length === 0 && suggestions.length === 0) return 0;
  const restants: Signalement[] = [];
  let envoyes = 0;
  for (const s of file) {
    if (await poster(s)) envoyes += 1;
    else restants.push(s);
  }
  await ecrireFileAttente(restants);
  const restSugg: SuggestionReper[] = [];
  for (const s of suggestions) {
    if (await posterSuggestion(s)) envoyes += 1;
    else restSugg.push(s);
  }
  await ecrireSuggestionsLocales(restSugg);
  return envoyes;
}

export async function telechargerSignalements(): Promise<Signalement[]> {
  const base = urlApi();
  if (!base) return [];
  const controleur = new AbortController();
  const timer = setTimeout(() => controleur.abort(), 10_000);
  try {
    const reponse = await fetch(`${base}/signalements`, { signal: controleur.signal });
    if (!reponse.ok) return [];
    const data = (await reponse.json()) as Signalement[];
    return Array.isArray(data) ? data.filter((s) => s.source === 'utilisateur') : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function telechargerStats(zone?: string): Promise<TrajetCommunaute[]> {
  const base = urlApi();
  if (!base) return [];
  const controleur = new AbortController();
  const timer = setTimeout(() => controleur.abort(), 10_000);
  const url = zone
    ? `${base}/stats?zone=${encodeURIComponent(zone)}`
    : `${base}/stats`;
  try {
    const reponse = await fetch(url, { signal: controleur.signal });
    if (!reponse.ok) return [];
    const data = (await reponse.json()) as { trajets?: TrajetCommunaute[] };
    return Array.isArray(data.trajets) ? data.trajets : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function telechargerStatsTrajet(
  originLabel: string,
  destLabel: string,
): Promise<TrajetCommunaute | null> {
  const base = urlApi();
  if (!base) return null;
  const controleur = new AbortController();
  const timer = setTimeout(() => controleur.abort(), 10_000);
  const qs = `origin=${encodeURIComponent(originLabel)}&dest=${encodeURIComponent(destLabel)}`;
  try {
    const reponse = await fetch(`${base}/stats?${qs}`, { signal: controleur.signal });
    if (!reponse.ok) return null;
    const data = (await reponse.json()) as { trajets?: TrajetCommunaute[] };
    return data.trajets?.[0] ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function telechargerFiabilite(): Promise<BilanFiabiliteDistant | null> {
  const base = urlApi();
  if (!base) return null;
  const controleur = new AbortController();
  const timer = setTimeout(() => controleur.abort(), 10_000);
  try {
    const reponse = await fetch(`${base}/fiabilite`, {
      headers: await entetes(),
      signal: controleur.signal,
    });
    if (!reponse.ok) return null;
    return (await reponse.json()) as BilanFiabiliteDistant;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}


export async function supprimerSignalementDistant(id: string): Promise<boolean> {
  const base = urlApi();
  if (!base) return false;
  const controleur = new AbortController();
  const timer = setTimeout(() => controleur.abort(), 10_000);
  try {
    const reponse = await fetch(`${base}/signalements/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: await entetes(),
      signal: controleur.signal,
    });
    return reponse.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
