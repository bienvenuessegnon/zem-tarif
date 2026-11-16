import { lienCarte, texteSos } from '../src/securite/sos';
import { jetonEncoreValide, lienSuivi } from '../src/securite/trajet-partage';

describe('SOS et trajet partagé', () => {
  it('compose un message avec la position et, s’il existe, le lien de suivi', () => {
    const texte = texteSos({
      lat: 6.35459,
      lon: 2.39428,
      lienSuivi: 'https://zem-tarif.onrender.com/suivi?jeton=abc',
    });
    expect(texte).toContain('SOS Zém Tarif');
    expect(texte).toContain(lienCarte(6.35459, 2.39428));
    expect(texte).toContain('suivi?jeton=abc');
    expect(texteSos({ lat: 6.35, lon: 2.39, horsLigne: true })).toContain('hors ligne');
  });

  it('construit le lien public de suivi', () => {
    expect(lienSuivi('abc-123')).toBe('https://zem-tarif.onrender.com/suivi?jeton=abc-123');
  });

  it('refuse un jeton périmé et accepte un jeton encore valable', () => {
    const maintenant = new Date('2026-11-16T12:00:00+01:00');
    expect(jetonEncoreValide('2026-11-16T11:00:00+01:00', maintenant)).toBe(false);
    expect(jetonEncoreValide('2026-11-16T18:00:00+01:00', maintenant)).toBe(true);
  });
});
