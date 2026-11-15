import type { Lieu } from '@/src/geo/lieux';

export const URL_DEMO = 'https://zem-tarif.onrender.com';

export function encoderLieu(lieu: Lieu): string {
  return [lieu.lat.toFixed(6), lieu.lon.toFixed(6), lieu.label].join(',');
}

export function decoderLieu(brut: string | undefined | null): Lieu | null {
  if (!brut) return null;
  const parties = brut.split(',');
  if (parties.length < 3) return null;
  const lat = Number(parties[0]);
  const lon = Number(parties[1]);
  const label = parties.slice(2).join(',').trim();
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !label) return null;
  return { label, lat, lon, source: 'reper' };
}

export function lienTrajet(origin: Lieu, dest: Lieu): string {
  const de = encodeURIComponent(encoderLieu(origin));
  const vers = encodeURIComponent(encoderLieu(dest));
  return `${URL_DEMO}/trajet?de=${de}&vers=${vers}`;
}
