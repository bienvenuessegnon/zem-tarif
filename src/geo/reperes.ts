import type { Lieu } from '@/src/geo/lieux';
import jeu from '@/assets/data/reperes.json';

export type CategorieReper =
  | 'marche'
  | 'carrefour'
  | 'pharmacie'
  | 'culte'
  | 'campus'
  | 'gare'
  | 'hopital'
  | 'quartier'
  | 'autre';

export type Reper = {
  id: string;
  nom: string;
  type: string;
  categorie: CategorieReper;
  icone: string;
  detail?: string;
  lat: number;
  lon: number;
  source: string;
};

type Jeu = {
  attribution: string;
  extrait: string;
  zone: string;
  reperes: Reper[];
};

const donnees = jeu as Jeu;

export const REPERES_BUNDLES: Reper[] = donnees.reperes;
export const ATTRIBUTION_OSM = donnees.attribution;
export const EXTRAIT_OSM = donnees.extrait;
export const ZONE_REPERES = donnees.zone;
export const NOMBRE_REPERES = REPERES_BUNDLES.length;

export function reperVersLieu(reper: Reper): Lieu {
  return {
    id: reper.id,
    label: reper.nom,
    detail: reper.detail ?? reper.type,
    lat: reper.lat,
    lon: reper.lon,
    source: 'reper',
  };
}

export function reperParId(id: string): Reper | undefined {
  return REPERES_BUNDLES.find((r) => r.id === id);
}

export const ICONES_CATEGORIE: Record<CategorieReper, string> = {
  marche: 'shopping-bag',
  carrefour: 'git-merge',
  pharmacie: 'plus',
  culte: 'home',
  campus: 'book-open',
  gare: 'truck',
  hopital: 'plus-square',
  quartier: 'map-pin',
  autre: 'map-pin',
};

export const LIBELLES_CATEGORIE: Record<CategorieReper, string> = {
  marche: 'Marchés',
  carrefour: 'Carrefours',
  pharmacie: 'Pharmacies',
  culte: 'Lieux de culte',
  campus: 'Campus et écoles',
  gare: 'Gares et stations',
  hopital: 'Hôpitaux et cliniques',
  quartier: 'Quartiers',
  autre: 'Autres lieux',
};
