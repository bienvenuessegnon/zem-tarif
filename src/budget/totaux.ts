import { FUSEAU } from '../pricing/constantes';
import type { DepenseTransport } from '../storage/budget';

const TZ = FUSEAU;

function instantAPortoNovo(isoOuDate: string | Date): Date {
  const d = typeof isoOuDate === 'string' ? new Date(isoOuDate) : isoOuDate;
  // Découpe la date affichée à Porto-Novo pour regrouper par jour local.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [annee, mois, jour] = fmt.format(d).split('-').map(Number);
  return new Date(Date.UTC(annee, mois - 1, jour, 0, 0, 0));
}

export function cleJour(iso: string, maintenant = new Date()): string {
  void maintenant;
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date(iso));
}

export function totalDepenses(liste: DepenseTransport[]): number {
  return liste.reduce((s, d) => s + d.prixFcfa, 0);
}

export function depensesDeLaSemaine(
  liste: DepenseTransport[],
  maintenant = new Date(),
): DepenseTransport[] {
  const jours = joursGlissants(7, maintenant);
  const ensemble = new Set(jours);
  return liste.filter((d) => ensemble.has(cleJour(d.enregistreLe)));
}

export function depensesDuMois(
  liste: DepenseTransport[],
  maintenant = new Date(),
): DepenseTransport[] {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
  });
  const mois = fmt.format(maintenant);
  return liste.filter((d) => cleJour(d.enregistreLe).startsWith(mois));
}

/** Les 7 derniers jours locaux (Porto-Novo), du plus ancien au plus récent. */
export function joursGlissants(n: number, maintenant = new Date()): string[] {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const base = instantAPortoNovo(maintenant);
  const jours: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(base.getTime() + 12 * 3600 * 1000 - i * 24 * 3600 * 1000);
    jours.push(fmt.format(d));
  }
  return jours;
}

export type BarreJour = { jour: string; libelle: string; total: number };

export function seriesJours(liste: DepenseTransport[], maintenant = new Date()): BarreJour[] {
  const jours = joursGlissants(7, maintenant);
  const parJour = new Map<string, number>();
  for (const d of liste) {
    const c = cleJour(d.enregistreLe);
    parJour.set(c, (parJour.get(c) ?? 0) + d.prixFcfa);
  }
  return jours.map((jour) => {
    const [, m, d] = jour.split('-');
    return {
      jour,
      libelle: `${Number(d)}/${Number(m)}`,
      total: parJour.get(jour) ?? 0,
    };
  });
}

export function progressionBudget(
  depenseMois: number,
  plafond: number | null,
): { ratio: number; restant: number } | null {
  if (plafond == null || plafond <= 0) return null;
  return {
    ratio: Math.min(1, depenseMois / plafond),
    restant: plafond - depenseMois,
  };
}

export function csvDepenses(liste: DepenseTransport[]): string {
  const entete = 'date,depart,arrivee,prix_fcfa,source';
  const lignes = liste.map((d) => {
    const date = d.enregistreLe;
    const de = csvChamp(d.de);
    const vers = csvChamp(d.vers);
    return `${date},${de},${vers},${d.prixFcfa},${d.source}`;
  });
  return [entete, ...lignes].join('\n');
}

function csvChamp(valeur: string): string {
  const v = valeur.replace(/"/g, '""');
  return /[",\n]/.test(v) ? `"${v}"` : v;
}
