import { COEFF_BAGAGE } from '../src/pricing/constantes';
import { tarifDeBase } from '../src/pricing/modele';

describe('supplément bagages', () => {
  it('ne change pas le prix sans bagage', () => {
    const sec = tarifDeBase(5340, { heure: 11, pluie: false });
    const aucun = tarifDeBase(5340, { heure: 11, pluie: false, bagage: 'aucun' });
    expect(aucun.point).toBe(sec.point);
    expect(aucun.bagage).toBe('aucun');
    expect(aucun.apresBagage).toBeCloseTo(aucun.apresPluie, 8);
  });

  it('applique les coefficients documentés, après la pluie', () => {
    const base = tarifDeBase(8000, { heure: 14, pluie: false, bagage: 'aucun' });
    const petit = tarifDeBase(8000, { heure: 14, pluie: false, bagage: 'petit' });
    const gros = tarifDeBase(8000, { heure: 14, pluie: false, bagage: 'gros' });
    const marche = tarifDeBase(8000, { heure: 14, pluie: false, bagage: 'marche' });
    expect(petit.apresBagage / base.apresPluie).toBeCloseTo(COEFF_BAGAGE.petit, 8);
    expect(gros.apresBagage / base.apresPluie).toBeCloseTo(COEFF_BAGAGE.gros, 8);
    expect(marche.apresBagage / base.apresPluie).toBeCloseTo(COEFF_BAGAGE.marche, 8);
    expect(marche.point).toBeGreaterThan(gros.point);
    expect(gros.point).toBeGreaterThan(petit.point);
  });

  it('se compose avec la pluie', () => {
    const sec = tarifDeBase(8000, { heure: 14, pluie: false, bagage: 'aucun' });
    const lesDeux = tarifDeBase(8000, { heure: 14, pluie: true, bagage: 'gros' });
    expect(lesDeux.apresBagage / sec.apresPluie).toBeCloseTo(
      1.3 * COEFF_BAGAGE.gros,
      8,
    );
  });
});
