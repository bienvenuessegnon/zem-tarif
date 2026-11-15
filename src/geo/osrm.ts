import { FACTEUR_DETOUR, VITESSE_REPLI_KMH } from '../pricing/constantes';
import { haversineM } from './haversine';

export type Itineraire = {
  distanceM: number;
  dureeS: number;
  geometrie: [number, number][];
  source: 'osrm' | 'vol-oiseau';
};

const OSRM = 'https://router.project-osrm.org/route/v1/driving';
const AGENT = 'ZemTarif/1.0 (contact: bienvenuessegnon01@gmail.com)';

type OsrmReponse = {
  code?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { coordinates?: [number, number][] };
  }>;
};

export function itineraireVolOiseau(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
): Itineraire {
  const vol = haversineM(originLat, originLon, destLat, destLon);
  const distanceM = vol * FACTEUR_DETOUR;
  const dureeS = (distanceM / 1000 / VITESSE_REPLI_KMH) * 3600;
  return {
    distanceM,
    dureeS,
    geometrie: [
      [originLon, originLat],
      [destLon, destLat],
    ],
    source: 'vol-oiseau',
  };
}

export async function calculerItineraire(
  originLat: number,
  originLon: number,
  destLat: number,
  destLon: number,
  signal?: AbortSignal,
): Promise<Itineraire> {
  const url = `${OSRM}/${originLon},${originLat};${destLon},${destLat}?overview=full&geometries=geojson`;
  try {
    const reponse = await fetch(url, {
      signal,
      headers: { Accept: 'application/json', 'User-Agent': AGENT },
    });
    if (!reponse.ok) {
      return itineraireVolOiseau(originLat, originLon, destLat, destLon);
    }
    const data = (await reponse.json()) as OsrmReponse;
    const route = data.routes?.[0];
    if (!route || data.code !== 'Ok') {
      return itineraireVolOiseau(originLat, originLon, destLat, destLon);
    }
    const coords = route.geometry?.coordinates ?? [
      [originLon, originLat],
      [destLon, destLat],
    ];
    return {
      distanceM: route.distance,
      dureeS: route.duration,
      geometrie: coords,
      source: 'osrm',
    };
  } catch {
    return itineraireVolOiseau(originLat, originLon, destLat, destLon);
  }
}
