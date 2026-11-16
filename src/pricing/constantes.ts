/**
 * Barème de base — seul fichier à modifier si de nouveaux prix
 * de terrain sont fournis.
 *
 * Il n'existe pas de grille officielle ou syndicale pour le zém de rue.
 * Les constantes ci-dessous sont un barème transparent, calé en novembre
 * 2026 sur des fourchettes publiées (voir src/contenu/reperes-publies.ts
 * et le README). Ce n'est pas un tarif réglementaire.
 *
 * Formule :
 *   prix = max(PLANCHER_FCFA, PRISE_EN_CHARGE_FCFA + TARIF_KM_FCFA × km)
 *   puis × COEFF_NUIT et/ou × COEFF_PLUIE
 *   puis × COEFF_BAGAGE (aucun / petit sac / gros colis / sacs du marché),
 *   arrondi à PAS_ARRONDI_FCFA.
 *
 * Les coefficients bagages sont des hypothèses de travail, pas une
 * enquête de terrain : un passager les active seulement s'il voyage
 * avec un volume inhabituel.
 *
 * Calage visé, de jour et par temps sec :
 *   ~2,4 km (Haie Vive – Cadjèhoun)  → 300 F
 *   ~5,3 km (Haie Vive – Ganhi)      → 500 F
 *   ~11,7 km (Fidjrossè – Akpakpa)   → 900 F
 *   ~16 km (vers Calavi)             → 1 200 F
 */

/** Prise en charge du barème 2026, en F CFA. */
export const PRISE_EN_CHARGE_FCFA = 150;

/** Prix au kilomètre du barème 2026, en F CFA. */
export const TARIF_KM_FCFA = 65;

/**
 * Plancher pratique fin 2026.
 * Une course très courte se négocie le plus souvent 250 à 300 F
 * (Ahouandjo, 12 novembre 2026). Le minimum historique de 100 F,
 * encore cité, n'est plus le plancher observé.
 */
export const PLANCHER_FCFA = 250;

/** Nuit : de 22 h inclusive à 6 h exclusive, heure de Porto-Novo. */
export const HEURE_DEBUT_NUIT = 22;
export const HEURE_FIN_NUIT = 6;

/**
 * Majoration de nuit. Milieu de la fourchette +20 à 30 %
 * (icotonou.com, 2026). D'autres récits parlent de 1,5 à 2 fois
 * (benin360, mai 2026) : la fourchette haute en absorbe une partie,
 * sans aller jusqu'à un doublement.
 */
export const COEFF_NUIT = 1.25;

/**
 * Majoration « pluie / voie dégradée ».
 * En 2014, La Nouvelle Tribune rapportait 400 F payés 600 F sous la
 * pluie (+50 %). Le coefficient 1,30 reste volontairement plus prudent.
 */
export const COEFF_PLUIE = 1.3;

/** Les prix se discutent par pas de 50 ou 100 F. */
export const PAS_ARRONDI_FCFA = 50;

/** Bornes de la fourchette affichée autour du point central. */
export const COEFF_FOURCHETTE_BAS = 0.85;
export const COEFF_FOURCHETTE_HAUT = 1.3;

/** Nombre minimal de signalements proches pour commencer à mélanger. */
export const SEUIL_SIGNALEMENTS = 3;

/** Poids maximal accordé à la médiane des signalements. */
export const POIDS_MAX_SIGNALEMENTS = 0.65;

/** Un signalement est « proche » si chaque extrémité est à moins de 1 km. */
export const RAYON_PROCHE_M = 1000;

/** Facteur de détour appliqué à la distance à vol d'oiseau hors ligne ou si OSRM échoue. Calibré à ~1,3. */
export const FACTEUR_DETOUR = 1.3;

/** Vitesse moyenne de repli, en km/h, pour estimer une durée sans OSRM. */
export const VITESSE_REPLI_KMH = 25;

export const FUSEAU = 'Africa/Porto-Novo';

/**
 * Supplément bagages — hypothèses de travail (novembre 2026).
 * Ce ne sont pas des tarifs observés trajet par trajet : un petit sac
 * à dos n'est en général pas facturé, un gros colis ou les sacs du
 * marché le sont plus souvent, sans règle unique.
 *   aucun  : 1,00 (pas de supplément)
 *   petit  : 1,10 (petit sac)
 *   gros   : 1,25 (gros colis)
 *   marche : 1,40 (sacs du marché)
 */
export type NiveauBagage = 'aucun' | 'petit' | 'gros' | 'marche';

export const COEFF_BAGAGE: Record<NiveauBagage, number> = {
  aucun: 1,
  petit: 1.1,
  gros: 1.25,
  marche: 1.4,
};

export const LIBELLES_BAGAGE: Record<NiveauBagage, string> = {
  aucun: 'Aucun',
  petit: 'Petit sac',
  gros: 'Gros colis',
  marche: 'Sacs du marché',
};
