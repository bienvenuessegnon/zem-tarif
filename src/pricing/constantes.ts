/**
 * Paramètres du modèle de base.
 *
 * Il n'existe pas, à notre connaissance, de grille officielle ou syndicale
 * pour le zémidjan de rue à Cotonou : le prix se négocie avant le départ.
 * Les constantes ci-dessous sont un barème transparent, calé sur des
 * fourchettes publiées (voir data/reperes-publies.json et le README).
 * Ce n'est pas un tarif réglementaire.
 */

/** Prise en charge, égale au minimum historique encore cité (100 F). */
export const PRISE_EN_CHARGE_FCFA = 100;

/**
 * Prix au kilomètre du modèle de base, en F CFA.
 * Calé pour rester dans les fourchettes récentes tout en restant
 * compatible, une fois le carburant pris en compte, avec le rapport
 * SSATP de 2019 (voir README).
 */
export const TARIF_KM_FCFA = 60;

/**
 * Plancher pratique 2024-2026 : un trajet très court se négocie
 * rarement sous 200 F, même si 100 F reste le minimum historique.
 */
export const PLANCHER_FCFA = 200;

/** Nuit : de 22 h inclusive à 6 h exclusive, heure de Porto-Novo. */
export const HEURE_DEBUT_NUIT = 22;
export const HEURE_FIN_NUIT = 6;

/**
 * Majoration de nuit. Milieu de la fourchette +20 à 30 % indiquée
 * par le guide icotonou.com (2026). D'autres récits parlent d'une
 * hausse plus forte : la fourchette haute du modèle en tient une
 * partie, sans aller jusqu'à un doublement.
 */
export const COEFF_NUIT = 1.25;

/**
 * Majoration « pluie / voie dégradée ».
 * En 2014, La Nouvelle Tribune rapportait un trajet habituel à 400 F
 * payé 600 F sous la pluie (+50 %). Le coefficient 1,30 reste en
 * deçà de ce témoignage, volontairement prudent.
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

/** Facteur de détour appliqué à la distance à vol d'oiseau si OSRM échoue. */
export const FACTEUR_DETOUR = 1.25;

/** Vitesse moyenne de repli, en km/h, pour estimer une durée sans OSRM. */
export const VITESSE_REPLI_KMH = 25;

export const FUSEAU = 'Africa/Porto-Novo';
