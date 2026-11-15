import { arrondirAuPas, appliquerPlancher } from '../src/pricing/arrondi';
import {
  COEFF_NUIT,
  COEFF_PLUIE,
  PLANCHER_FCFA,
  PRISE_EN_CHARGE_FCFA,
  SEUIL_SIGNALEMENTS,
  TARIF_KM_FCFA,
} from '../src/pricing/constantes';
import { formatDuree, formatFcfa, formatKm } from '../src/pricing/format';
import { estNuit } from '../src/pricing/horaire';
import { estimer, poidsSignalements } from '../src/pricing/melange';
import { tarifDeBase } from '../src/pricing/modele';
import { mediane } from '../src/pricing/proches';
import type { DemandeEstimation, Signalement } from '../src/pricing/types';
import { haversineM } from '../src/geo/haversine';
import { itineraireVolOiseau } from '../src/geo/osrm';
import { dansLaZone } from '../src/geo/zone';

function demande(
  distanceM: number,
  heure = 10,
  pluie = false,
): DemandeEstimation {
  return {
    originLat: 6.3545898,
    originLon: 2.3942784,
    destLat: 6.3547621,
    destLon: 2.4381045,
    distanceM,
    conditions: { heure, pluie },
  };
}

function avis(
  prix: number,
  originLat = 6.3545898,
  originLon = 2.3942784,
  destLat = 6.3547621,
  destLon = 2.4381045,
): Signalement {
  return {
    id: `t-${prix}`,
    originLat,
    originLon,
    destLat,
    destLon,
    originLabel: 'Haie Vive',
    destLabel: 'Ganhi',
    distanceM: 5340,
    prixPayeFcfa: prix,
    nuit: false,
    pluie: false,
    enregistreLe: '2026-11-15T10:00:00+01:00',
    source: 'utilisateur',
  };
}

describe('horaire', () => {
  test('la nuit commence à 22 h et finit avant 6 h', () => {
    expect(estNuit(22)).toBe(true);
    expect(estNuit(23)).toBe(true);
    expect(estNuit(0)).toBe(true);
    expect(estNuit(5)).toBe(true);
    expect(estNuit(6)).toBe(false);
    expect(estNuit(10)).toBe(false);
    expect(estNuit(21)).toBe(false);
  });

  test('rejette une heure invalide', () => {
    expect(() => estNuit(24)).toThrow(RangeError);
    expect(() => estNuit(-1)).toThrow(RangeError);
  });
});

describe('arrondi', () => {
  test('arrondit au pas de 50 F', () => {
    expect(arrondirAuPas(424)).toBe(400);
    expect(arrondirAuPas(425)).toBe(450);
    expect(arrondirAuPas(200)).toBe(200);
  });

  test('applique le plancher', () => {
    expect(appliquerPlancher(150)).toBe(PLANCHER_FCFA);
    expect(appliquerPlancher(300)).toBe(300);
  });
});

describe('modèle de base, calé sur les fourchettes publiées', () => {
  test('un trajet nul ou très court reste au plancher de 250 F le jour, par temps sec', () => {
    const t = tarifDeBase(0, { heure: 10, pluie: false });
    expect(t.point).toBe(PLANCHER_FCFA);
    expect(t.bas).toBe(PLANCHER_FCFA);
    expect(t.haut).toBeGreaterThanOrEqual(t.point);
  });

  test('Haie Vive → Cadjèhoun, environ 2,4 km : autour de 300 F', () => {
    const t = tarifDeBase(2400, { heure: 11, pluie: false });
    expect(t.point).toBeGreaterThanOrEqual(250);
    expect(t.point).toBeLessThanOrEqual(350);
    expect(t.point).toBe(300);
    expect(t.bas).toBeLessThanOrEqual(t.point);
    expect(t.haut).toBeGreaterThanOrEqual(t.point);
  });

  test('Haie Vive → Ganhi, 5,3 km : autour de 500 F', () => {
    const t = tarifDeBase(5340, { heure: 11, pluie: false });
    expect(t.point).toBeGreaterThanOrEqual(450);
    expect(t.point).toBeLessThanOrEqual(550);
    expect(t.point).toBe(500);
  });

  test('Fidjrossè → Akpakpa, 11,7 km : autour de 900 F', () => {
    const t = tarifDeBase(11740, { heure: 11, pluie: false });
    expect(t.point).toBeGreaterThanOrEqual(850);
    expect(t.point).toBeLessThanOrEqual(1000);
    expect(t.point).toBe(900);
  });

  test('UAC → Dantokpa, 14,4 km : autour de 1 100 F', () => {
    const t = tarifDeBase(14370, { heure: 11, pluie: false });
    expect(t.point).toBeGreaterThanOrEqual(1000);
    expect(t.point).toBeLessThanOrEqual(1200);
  });

  test('la prise en charge et le tarif au km sont bien ceux du barème', () => {
    const distanceM = 10000;
    const t = tarifDeBase(distanceM, { heure: 10, pluie: false });
    expect(t.priseEnCharge).toBe(PRISE_EN_CHARGE_FCFA);
    expect(t.partKilometrique).toBeCloseTo(TARIF_KM_FCFA * 10, 5);
    expect(t.avantPlancher).toBeCloseTo(PRISE_EN_CHARGE_FCFA + TARIF_KM_FCFA * 10, 5);
  });

  test('la majoration de nuit applique le coefficient documenté', () => {
    const jour = tarifDeBase(8000, { heure: 14, pluie: false });
    const nuit = tarifDeBase(8000, { heure: 23, pluie: false });
    expect(nuit.apresNuit / jour.apresPlancher).toBeCloseTo(COEFF_NUIT, 8);
    expect(nuit.point).toBeGreaterThan(jour.point);
  });

  test('la majoration pluie applique le coefficient documenté', () => {
    const sec = tarifDeBase(8000, { heure: 14, pluie: false });
    const pluie = tarifDeBase(8000, { heure: 14, pluie: true });
    expect(pluie.apresPluie / sec.apresPluie).toBeCloseTo(COEFF_PLUIE, 8);
    expect(pluie.point).toBeGreaterThan(sec.point);
  });

  test('nuit et pluie se composent', () => {
    const base = tarifDeBase(8000, { heure: 14, pluie: false });
    const lesDeux = tarifDeBase(8000, { heure: 23, pluie: true });
    expect(lesDeux.apresPluie / base.apresPlancher).toBeCloseTo(COEFF_NUIT * COEFF_PLUIE, 8);
  });
});

describe('mélange avec les signalements', () => {
  test('sans assez d’avis, on reste sur le modèle', () => {
    const e = estimer(demande(5340), [avis(800), avis(850)]);
    expect(e.sourcePrix).toBe('modele');
    expect(e.poidsSignalements).toBe(0);
    expect(e.point).toBe(e.pointSansSignalements);
    expect(e.nbSignalementsProches).toBe(2);
  });

  test('avec assez d’avis proches, le point se rapproche de la médiane', () => {
    const seuls = estimer(demande(5340), []);
    const avisIdentiques = Array.from({ length: 8 }, (_, i) => avis(800 + i));
    // Médiane autour de 803-804, bien au-dessus du modèle pour 5,3 km.
    const e = estimer(demande(5340), avisIdentiques);
    expect(e.sourcePrix).toBe('melange');
    expect(e.poidsSignalements).toBeGreaterThan(0);
    expect(e.medianeSignalements).toBeGreaterThan(800);
    expect(e.point).toBeGreaterThan(seuls.point);
    expect(e.point).toBeLessThan(e.medianeSignalements as number);
  });

  test('un exemple de calibration n’entre pas dans le mélange', () => {
    const exemples: Signalement[] = Array.from({ length: 8 }, (_, i) => ({
      ...avis(900),
      id: `ex-${i}`,
      source: 'exemple',
    }));
    const e = estimer(demande(5340), exemples);
    expect(e.sourcePrix).toBe('modele');
    expect(e.nbSignalementsProches).toBe(0);
  });

  test('un avis trop loin n’est pas retenu', () => {
    const loin = Array.from({ length: 5 }, (_, i) =>
      avis(900, 6.499, 2.625, 6.5, 2.63),
    );
    const e = estimer(demande(5340), loin);
    expect(e.nbSignalementsProches).toBe(0);
  });

  test('le poids est nul sous le seuil, puis plafonne', () => {
    expect(poidsSignalements(SEUIL_SIGNALEMENTS - 1)).toBe(0);
    expect(poidsSignalements(SEUIL_SIGNALEMENTS)).toBeGreaterThan(0);
    expect(poidsSignalements(20)).toBe(0.65);
    expect(poidsSignalements(10)).toBe(0.65);
  });

  test('la médiane d’une liste paire et impaire', () => {
    expect(mediane([])).toBeNull();
    expect(mediane([3])).toBe(3);
    expect(mediane([1, 3, 2])).toBe(2);
    expect(mediane([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('formatage', () => {
  test('affiche les francs avec un espace insécable pour les milliers', () => {
    expect(formatFcfa(200)).toBe('200 F');
    expect(formatFcfa(1500)).toBe('1\u00a0500 F');
  });

  test('affiche les kilomètres et la durée en français', () => {
    expect(formatKm(5.34)).toBe('5,3 km');
    expect(formatDuree(0)).toBe('moins d’une minute');
    expect(formatDuree(180)).toBe('3 min');
    expect(formatDuree(3600)).toBe('1 h');
    expect(formatDuree(3900)).toBe('1 h 5 min');
  });
});

describe('géographie', () => {
  test('la distance Haie Vive – Ganhi est d’environ 4,8 km à vol d’oiseau', () => {
    const m = haversineM(6.3545898, 2.3942784, 6.3547621, 2.4381045);
    expect(m).toBeGreaterThan(4500);
    expect(m).toBeLessThan(5200);
  });

  test('le repli vol d’oiseau allonge la distance d’un facteur 1,25', () => {
    const iti = itineraireVolOiseau(6.3545898, 2.3942784, 6.3547621, 2.4381045);
    const vol = haversineM(6.3545898, 2.3942784, 6.3547621, 2.4381045);
    expect(iti.source).toBe('vol-oiseau');
    expect(iti.distanceM / vol).toBeCloseTo(1.25, 8);
    expect(iti.dureeS).toBeGreaterThan(0);
  });

  test('Cotonou et Porto-Novo sont dans la zone, Parakou non', () => {
    expect(dansLaZone(6.3547, 2.4381)).toBe(true);
    expect(dansLaZone(6.499, 2.625)).toBe(true);
    expect(dansLaZone(9.337, 2.63)).toBe(false);
  });
});
