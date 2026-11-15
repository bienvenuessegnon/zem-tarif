import { distanceEdition, jetons, sansAccents } from '../src/geo/normaliser';
import { rechercherReperes } from '../src/geo/recherche';
import { NOMBRE_REPERES, REPERES_BUNDLES, type Reper } from '../src/geo/reperes';

const MINI: Reper[] = [
  {
    id: 'saint-michel',
    nom: 'Carrefour Saint-Michel',
    type: 'Carrefour',
    categorie: 'carrefour',
    icone: 'git-merge',
    detail: 'Saint-Michel, Cotonou',
    lat: 6.3655,
    lon: 2.4185,
    source: 'curate',
  },
  {
    id: 'uac',
    nom: 'Université d’Abomey-Calavi',
    type: 'Université',
    categorie: 'campus',
    icone: 'book-open',
    detail: 'Abomey-Calavi',
    lat: 6.415938,
    lon: 2.341726,
    source: 'curate',
  },
  {
    id: 'dantokpa',
    nom: 'Marché Dantokpa',
    type: 'Marché',
    categorie: 'marche',
    icone: 'shopping-bag',
    detail: 'Cotonou',
    lat: 6.372712,
    lon: 2.433508,
    source: 'curate',
  },
  {
    id: 'ganhi',
    nom: 'Ganhi · Marché',
    type: 'Quartier',
    categorie: 'quartier',
    icone: 'map-pin',
    detail: 'Cotonou centre',
    lat: 6.354762,
    lon: 2.438105,
    source: 'curate',
  },
];

describe('normalisation', () => {
  it('ignore les accents et la casse', () => {
    expect(sansAccents('Étoile Rouge')).toBe('etoile rouge');
    expect(sansAccents('Cadjèhoun')).toBe('cadjehoun');
    expect(jetons('Saint-Michel')).toEqual(['saint', 'michel']);
  });

  it('mesure une faute d’une lettre', () => {
    expect(distanceEdition('michel', 'michel')).toBe(0);
    expect(distanceEdition('michel', 'michl')).toBe(1);
    expect(distanceEdition('abc', 'xyz')).toBeGreaterThan(1);
  });
});

describe('recherche floue', () => {
  it('trouve Saint-Michel malgré une saisie partielle et sans accent', () => {
    const r = rechercherReperes('saint mi', { jeu: MINI });
    expect(r[0]?.reper.id).toBe('saint-michel');
  });

  it('trouve l’UAC par un jeton incomplet', () => {
    const r = rechercherReperes('universite abomey', { jeu: MINI });
    expect(r[0]?.reper.id).toBe('uac');
  });

  it('corrige une faute d’une lettre sur un mot long', () => {
    const r = rechercherReperes('dantokpa', { jeu: MINI });
    expect(r[0]?.reper.id).toBe('dantokpa');
    const faute = rechercherReperes('dantokpa', { jeu: MINI });
    expect(faute[0]?.reper.id).toBe('dantokpa');
    const typo = rechercherReperes('dantokpa'.replace('k', 'c'), { jeu: MINI });
    // dantocpa vs dantokpa
    expect(typo.some((x) => x.reper.id === 'dantokpa')).toBe(true);
  });

  it('ne remonte pas un lieu sans aucun jeton commun', () => {
    const r = rechercherReperes('parakou', { jeu: MINI });
    expect(r).toHaveLength(0);
  });

  it('classe le plus proche en premier à requête vide', () => {
    const pos = { lat: 6.35459, lon: 2.394278 };
    const r = rechercherReperes('', { jeu: MINI, position: pos });
    expect(r[0]?.reper.id).not.toBe('uac');
    expect(r[0]?.distanceM).toBeDefined();
  });
});

describe('jeu bundlé', () => {
  it('dépasse 1 500 repères du Grand Nokoué', () => {
    expect(NOMBRE_REPERES).toBeGreaterThanOrEqual(1500);
    expect(REPERES_BUNDLES.length).toBe(NOMBRE_REPERES);
  });

  it('trouve Dantokpa et Saint-Michel dans le jeu réel', () => {
    const a = rechercherReperes('dantokpa');
    expect(a[0]?.reper.nom.toLowerCase()).toContain('dantokpa');
    const b = rechercherReperes('saint mi');
    expect(b.some((x) => /saint-michel|saint michel/i.test(x.reper.nom))).toBe(true);
  });
});
