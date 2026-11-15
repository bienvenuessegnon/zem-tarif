import type { Lieu } from './lieux';
import { EMPRISE } from './zone';

const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
export const AGENT_NOMINATIM = 'ZemTarif/1.0 (contact: bienvenuessegnon01@gmail.com)';
const EMAIL = 'bienvenuessegnon01@gmail.com';

let derniereRequete = 0;
const INTERVALLE_MS = 1100;

async function respecterDebit(): Promise<void> {
  const maintenant = Date.now();
  const attendre = INTERVALLE_MS - (maintenant - derniereRequete);
  if (attendre > 0) {
    await new Promise((r) => setTimeout(r, attendre));
  }
  derniereRequete = Date.now();
}

type NominatimItem = {
  lat: string;
  lon: string;
  display_name?: string;
  name?: string;
};

export async function chercherLieux(
  saisie: string,
  signal?: AbortSignal,
): Promise<Lieu[]> {
  const q = saisie.trim();
  if (q.length < 3) {
    return [];
  }
  await respecterDebit();
  if (signal?.aborted) {
    return [];
  }

  const url = new URL(NOMINATIM);
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '6');
  url.searchParams.set('addressdetails', '0');
  url.searchParams.set('accept-language', 'fr');
  url.searchParams.set('countrycodes', 'bj');
  url.searchParams.set('email', EMAIL);
  url.searchParams.set(
    'viewbox',
    `${EMPRISE.lonMin},${EMPRISE.latMax},${EMPRISE.lonMax},${EMPRISE.latMin}`,
  );
  url.searchParams.set('bounded', '0');

  const reponse = await fetch(url.toString(), {
    signal,
    headers: {
      Accept: 'application/json',
      'User-Agent': AGENT_NOMINATIM,
    },
  });
  if (!reponse.ok) {
    throw new Error(`Nominatim a répondu ${reponse.status}`);
  }
  const data = (await reponse.json()) as NominatimItem[];
  return data.map((item) => {
    const affichage = item.display_name ?? item.name ?? q;
    const court = (item.name ?? affichage.split(',')[0] ?? q).trim();
    return {
      label: court,
      detail: affichage,
      lat: Number(item.lat),
      lon: Number(item.lon),
      source: 'nominatim' as const,
    };
  });
}
