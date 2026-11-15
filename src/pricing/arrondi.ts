import { PAS_ARRONDI_FCFA, PLANCHER_FCFA } from './constantes';

export function arrondirAuPas(valeur: number, pas = PAS_ARRONDI_FCFA): number {
  if (!Number.isFinite(valeur)) {
    return PLANCHER_FCFA;
  }
  return Math.round(valeur / pas) * pas;
}

export function arrondirPlancher(valeur: number, pas = PAS_ARRONDI_FCFA): number {
  return Math.floor(valeur / pas) * pas;
}

export function arrondirPlafond(valeur: number, pas = PAS_ARRONDI_FCFA): number {
  return Math.ceil(valeur / pas) * pas;
}

export function appliquerPlancher(valeur: number, plancher = PLANCHER_FCFA): number {
  return Math.max(plancher, valeur);
}
