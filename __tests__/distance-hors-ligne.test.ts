import { haversineM } from '../src/geo/haversine';
import { calculerItineraire, itineraireVolOiseau } from '../src/geo/osrm';
import { FACTEUR_DETOUR } from '../src/pricing/constantes';

describe('distance hors ligne', () => {
  const haie = { lat: 6.35459, lon: 2.394278 };
  const ganhi = { lat: 6.354762, lon: 2.438105 };

  it('applique le facteur de détour calibré à 1,3', () => {
    expect(FACTEUR_DETOUR).toBeCloseTo(1.3, 8);
    const iti = itineraireVolOiseau(haie.lat, haie.lon, ganhi.lat, ganhi.lon);
    const vol = haversineM(haie.lat, haie.lon, ganhi.lat, ganhi.lon);
    expect(iti.source).toBe('vol-oiseau');
    expect(iti.distanceM / vol).toBeCloseTo(1.3, 8);
    expect(iti.dureeS).toBeGreaterThan(0);
  });

  it('évite OSRM lorsque le mode hors ligne est demandé', async () => {
    const iti = await calculerItineraire(
      haie.lat,
      haie.lon,
      ganhi.lat,
      ganhi.lon,
      undefined,
      true,
    );
    expect(iti.source).toBe('vol-oiseau');
    const vol = haversineM(haie.lat, haie.lon, ganhi.lat, ganhi.lon);
    expect(iti.distanceM / vol).toBeCloseTo(1.3, 8);
  });
});
