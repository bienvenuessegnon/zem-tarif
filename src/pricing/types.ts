import type { NiveauBagage } from './constantes';

export type ConditionsTrajet = {
  /** Heure locale à considérer, 0 à 23. */
  heure: number;
  /** Pluie ou voie fortement dégradée, indiquée par l'utilisateur. */
  pluie: boolean;
  /** Volume de bagages ; « aucun » par défaut. */
  bagage?: NiveauBagage;
};

export type TarifDeBase = {
  priseEnCharge: number;
  partKilometrique: number;
  avantPlancher: number;
  apresPlancher: number;
  apresNuit: number;
  apresPluie: number;
  apresBagage: number;
  point: number;
  bas: number;
  haut: number;
  nuit: boolean;
  pluie: boolean;
  bagage: NiveauBagage;
};

export type Signalement = {
  id: string;
  originLat: number;
  originLon: number;
  destLat: number;
  destLon: number;
  originLabel: string;
  destLabel: string;
  distanceM: number;
  prixPayeFcfa: number;
  nuit: boolean;
  pluie: boolean;
  enregistreLe: string;
  /** Les exemples de calibration ne sont pas des signalements d'usagers. */
  source: 'utilisateur' | 'exemple';
  heure?: number | null;
  pseudo?: string | null;
  appareilId?: string | null;
  role?: 'passager' | 'conducteur';
  bagage?: boolean;
  bagageNiveau?: NiveauBagage;
  prixRefFcfa?: number | null;
  poids?: number;
};

export type DemandeEstimation = {
  originLat: number;
  originLon: number;
  destLat: number;
  destLon: number;
  distanceM: number;
  conditions: ConditionsTrajet;
};

export type Estimation = TarifDeBase & {
  distanceKm: number;
  nbSignalementsProches: number;
  poidsSignalements: number;
  medianeSignalements: number | null;
  pointSansSignalements: number;
  sourcePrix: 'modele' | 'melange';
};
