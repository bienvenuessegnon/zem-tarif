import {
  csvDepenses,
  depensesDeLaSemaine,
  depensesDuMois,
  progressionBudget,
  seriesJours,
  totalDepenses,
} from '../src/budget/totaux';
import type { DepenseTransport } from '../src/storage/budget';

function depense(prix: number, iso: string, id = iso): DepenseTransport {
  return {
    id,
    prixFcfa: prix,
    de: 'Haie Vive',
    vers: 'Ganhi',
    enregistreLe: iso,
    source: 'saisie',
  };
}

describe('totaux du budget', () => {
  const maintenant = new Date('2026-11-16T15:00:00+01:00');

  it('additionne les montants', () => {
    expect(totalDepenses([depense(500, '2026-11-16T08:00:00+01:00'), depense(300, '2026-11-16T09:00:00+01:00')])).toBe(800);
  });

  it('sépare la semaine glissante et le mois civil à Porto-Novo', () => {
    const liste = [
      depense(500, '2026-11-16T08:00:00+01:00'),
      depense(400, '2026-11-12T08:00:00+01:00'),
      depense(900, '2026-11-01T08:00:00+01:00'),
      depense(200, '2026-10-30T08:00:00+01:00'),
    ];
    expect(totalDepenses(depensesDuMois(liste, maintenant))).toBe(1800);
    expect(totalDepenses(depensesDeLaSemaine(liste, maintenant))).toBe(900);
  });

  it('construit sept barres, y compris les jours sans dépense', () => {
    const series = seriesJours(
      [depense(500, '2026-11-16T08:00:00+01:00')],
      maintenant,
    );
    expect(series).toHaveLength(7);
    expect(series[6]?.jour).toBe('2026-11-16');
    expect(series[6]?.total).toBe(500);
    expect(series[0]?.total).toBe(0);
  });

  it('calcule le reste d’un plafond mensuel', () => {
    expect(progressionBudget(3000, 10000)).toEqual({ ratio: 0.3, restant: 7000 });
    expect(progressionBudget(12000, 10000)?.ratio).toBe(1);
    expect(progressionBudget(100, null)).toBeNull();
  });

  it('exporte un CSV utilisable', () => {
    const csv = csvDepenses([depense(500, '2026-11-16T08:00:00+01:00', 'a')]);
    expect(csv.split('\n')[0]).toBe('date,depart,arrivee,prix_fcfa,source');
    expect(csv).toContain('500');
    expect(csv).toContain('Haie Vive');
  });
});
