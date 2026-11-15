import {
  libelleFiabilite,
  medianePonderee,
  poidsSignalement,
  scoreFiabilite,
} from '../src/pricing/fiabilite';

describe('poids d’un signalement', () => {
  it('donne un poids maximal à un prix égal à la référence', () => {
    expect(poidsSignalement(500, 500)).toBe(1);
  });

  it('réduit le poids d’un écart, sans jamais l’annuler', () => {
    const proche = poidsSignalement(550, 500);
    const loin = poidsSignalement(900, 500);
    expect(proche).toBeGreaterThan(loin);
    expect(loin).toBeGreaterThanOrEqual(0.15);
    expect(poidsSignalement(2000, 500)).toBe(0.15);
  });

  it('utilise un poids neutre si la référence est inconnue', () => {
    expect(poidsSignalement(500, null)).toBe(0.5);
    expect(poidsSignalement(500, 0)).toBe(0.5);
  });
});

describe('score de fiabilité', () => {
  it('reste à zéro sans historique', () => {
    const b = scoreFiabilite([]);
    expect(b.score).toBe(0);
    expect(b.nb).toBe(0);
    expect(b.libelle).toBe('Pas encore de signalement');
  });

  it('récompense la cohérence et le volume', () => {
    const un = scoreFiabilite([{ prixPaye: 500, prixRef: 500 }]);
    const cinq = scoreFiabilite(
      Array.from({ length: 5 }, () => ({ prixPaye: 500, prixRef: 500 })),
    );
    expect(cinq.score).toBeGreaterThan(un.score);
    expect(cinq.score).toBe(100);
    expect(cinq.libelle).toBe('Contributeur régulier');
  });

  it('abaisse le score d’un historique aberrant', () => {
    const fidele = scoreFiabilite(
      Array.from({ length: 4 }, () => ({ prixPaye: 500, prixRef: 500 })),
    );
    const aberrant = scoreFiabilite(
      Array.from({ length: 4 }, () => ({ prixPaye: 2000, prixRef: 500 })),
    );
    expect(aberrant.score).toBeLessThan(fidele.score);
    expect(aberrant.score).toBeGreaterThan(0);
  });
});

describe('médiane pondérée', () => {
  it('ignore presque un prix aberrant de poids faible', () => {
    const mediane = medianePonderee([
      { prix: 500, poids: 1 },
      { prix: 500, poids: 1 },
      { prix: 500, poids: 1 },
      { prix: 2000, poids: 0.15 },
    ]);
    expect(mediane).toBe(500);
  });

  it('renvoie null sans valeurs utiles', () => {
    expect(medianePonderee([])).toBeNull();
    expect(medianePonderee([{ prix: 400, poids: 0 }])).toBeNull();
  });

  it('libellé en fonction du score', () => {
    expect(libelleFiabilite(20, 2)).toBe('À confirmer');
    expect(libelleFiabilite(55, 3)).toBe('En construction');
  });
});
