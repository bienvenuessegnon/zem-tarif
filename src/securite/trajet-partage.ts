import { URL_DEMO } from '../partage/lien';

export const DUREE_JETON_MS = 6 * 60 * 60 * 1000;

export type TrajetPartageLocal = {
  jeton: string;
  expireLe: string;
  originLabel: string;
  destLabel: string;
};

export function lienSuivi(jeton: string, base = URL_DEMO): string {
  return `${base.replace(/\/$/, '')}/suivi?jeton=${encodeURIComponent(jeton)}`;
}

export function jetonEncoreValide(expireLe: string, maintenant = new Date()): boolean {
  const fin = new Date(expireLe).getTime();
  if (!Number.isFinite(fin)) return false;
  return fin > maintenant.getTime();
}
