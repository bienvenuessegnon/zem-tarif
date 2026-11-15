import { FUSEAU, HEURE_DEBUT_NUIT, HEURE_FIN_NUIT } from './constantes';

export function estNuit(heure: number): boolean {
  const h = Math.floor(heure);
  if (h < 0 || h > 23) {
    throw new RangeError(`Heure invalide : ${heure}`);
  }
  return h >= HEURE_DEBUT_NUIT || h < HEURE_FIN_NUIT;
}

/** Heure actuelle dans le fuseau Africa/Porto-Novo (UTC+1, sans heure d'été). */
export function heurePortoNovo(date: Date = new Date()): number {
  const texte = new Intl.DateTimeFormat('fr-FR', {
    timeZone: FUSEAU,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(date);
  const heure = Number.parseInt(texte, 10);
  return Number.isFinite(heure) ? heure : date.getHours();
}
