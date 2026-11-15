import {
  COEFF_FOURCHETTE_BAS,
  COEFF_FOURCHETTE_HAUT,
  COEFF_NUIT,
  COEFF_PLUIE,
  PLANCHER_FCFA,
  PRISE_EN_CHARGE_FCFA,
  TARIF_KM_FCFA,
} from './constantes';
import { appliquerPlancher, arrondirAuPas, arrondirPlancher, arrondirPlafond } from './arrondi';
import { estNuit } from './horaire';
import type { ConditionsTrajet, TarifDeBase } from './types';

export function tarifDeBase(distanceM: number, conditions: ConditionsTrajet): TarifDeBase {
  const distanceKm = Math.max(0, distanceM) / 1000;
  const nuit = estNuit(conditions.heure);
  const pluie = Boolean(conditions.pluie);

  const priseEnCharge = PRISE_EN_CHARGE_FCFA;
  const partKilometrique = TARIF_KM_FCFA * distanceKm;
  const avantPlancher = priseEnCharge + partKilometrique;
  const apresPlancher = appliquerPlancher(avantPlancher, PLANCHER_FCFA);
  const apresNuit = apresPlancher * (nuit ? COEFF_NUIT : 1);
  const apresPluie = apresNuit * (pluie ? COEFF_PLUIE : 1);
  const point = appliquerPlancher(arrondirAuPas(apresPluie), PLANCHER_FCFA);
  const bas = appliquerPlancher(
    arrondirPlancher(apresPluie * COEFF_FOURCHETTE_BAS),
    PLANCHER_FCFA,
  );
  const haut = Math.max(
    point,
    arrondirPlafond(apresPluie * COEFF_FOURCHETTE_HAUT),
  );

  return {
    priseEnCharge,
    partKilometrique,
    avantPlancher,
    apresPlancher,
    apresNuit,
    apresPluie,
    point,
    bas,
    haut,
    nuit,
    pluie,
  };
}
