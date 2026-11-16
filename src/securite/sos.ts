import type { ContactUrgence } from '../storage/contacts-urgence';

export const DUREE_APPUIO_SOS_MS = 3000;

export function lienCarte(lat: number, lon: number): string {
  return `https://www.google.com/maps?q=${lat.toFixed(5)},${lon.toFixed(5)}`;
}

export function texteSos(options: {
  lat: number;
  lon: number;
  lienSuivi?: string | null;
  horsLigne?: boolean;
}): string {
  const position = lienCarte(options.lat, options.lon);
  const lignes = ['SOS Zém Tarif. Je suis en course de zém.'];
  if (options.lienSuivi) {
    lignes.push(`Suivi en direct : ${options.lienSuivi}`);
  }
  lignes.push(`Position : ${position}`);
  if (options.horsLigne) {
    lignes.push('Dernière position connue (hors ligne).');
  }
  return lignes.join('\n');
}

export function urlSms(telephone: string, corps: string, ios = false): string {
  const n = telephone.replace(/\s+/g, '');
  const body = encodeURIComponent(corps);
  if (ios) return `sms:${n}&body=${body}`;
  return `sms:${n}?body=${body}`;
}

export function urlAppel(telephone: string): string {
  return `tel:${telephone.replace(/\s+/g, '')}`;
}

export function contactsValides(liste: ContactUrgence[]): ContactUrgence[] {
  return liste.filter((c) => c.telephone.replace(/\s+/g, '').length >= 6);
}
