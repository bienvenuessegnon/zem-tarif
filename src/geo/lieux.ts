export type Lieu = {
  id?: string;
  label: string;
  detail?: string;
  lat: number;
  lon: number;
  source: 'reper' | 'nominatim' | 'gps';
};

/**
 * Repères calés sur Nominatim (OpenStreetMap), novembre 2026.
 * Ce sont des points d'entrée, pas des adresses précises.
 */
export const REPERES: Lieu[] = [
  {
    id: 'haie-vive',
    label: 'Haie Vive',
    detail: 'Cotonou, 12e arrondissement',
    lat: 6.3545898,
    lon: 2.3942784,
    source: 'reper',
  },
  {
    id: 'cadjehoun',
    label: 'Cadjèhoun',
    detail: 'Cotonou',
    lat: 6.3614375,
    lon: 2.3994,
    source: 'reper',
  },
  {
    id: 'ganhi',
    label: 'Ganhi',
    detail: 'Cotonou centre',
    lat: 6.3547621,
    lon: 2.4381045,
    source: 'reper',
  },
  {
    id: 'fidjrosse',
    label: 'Fidjrossè',
    detail: 'Cotonou',
    lat: 6.3525033,
    lon: 2.3675491,
    source: 'reper',
  },
  {
    id: 'akpakpa',
    label: 'Akpakpa',
    detail: 'Cotonou',
    lat: 6.3588607,
    lon: 2.4556294,
    source: 'reper',
  },
  {
    id: 'aeroport',
    label: 'Aéroport Cardinal Gantin',
    detail: 'Cotonou',
    lat: 6.3577513,
    lon: 2.3859051,
    source: 'reper',
  },
  {
    id: 'dantokpa',
    label: 'Marché Dantokpa',
    detail: 'Cotonou',
    lat: 6.3727119,
    lon: 2.4335084,
    source: 'reper',
  },
  {
    id: 'etoile-rouge',
    label: 'Étoile Rouge',
    detail: 'Gbégamey, Cotonou',
    lat: 6.3714599,
    lon: 2.4097919,
    source: 'reper',
  },
  {
    id: 'jonquet',
    label: 'Jonquet',
    detail: 'Cotonou',
    lat: 6.3584067,
    lon: 2.4315012,
    source: 'reper',
  },
  {
    id: 'godomey',
    label: 'Godomey',
    detail: 'Abomey-Calavi',
    lat: 6.3854438,
    lon: 2.3432407,
    source: 'reper',
  },
  {
    id: 'uac',
    label: 'Université d’Abomey-Calavi',
    detail: 'Abomey-Calavi',
    lat: 6.4159381,
    lon: 2.3417259,
    source: 'reper',
  },
  {
    id: 'porto-novo',
    label: 'Porto-Novo centre',
    detail: 'Ouémé',
    lat: 6.4990718,
    lon: 2.6253361,
    source: 'reper',
  },
];

export function filtrerReperes(saisie: string): Lieu[] {
  const q = saisie.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  if (!q) {
    return REPERES;
  }
  return REPERES.filter((lieu) => {
    const hay = `${lieu.label} ${lieu.detail ?? ''}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '');
    return hay.includes(q);
  });
}
