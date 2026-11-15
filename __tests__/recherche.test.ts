import { distanceEdition, formeRecherche, jetons, sansAccents } from '../src/geo/normaliser';
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
    expect(formeRecherche('Carrefour Saint-Michel')).toBe('carrefour saint michel');
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
    expect(b[0]?.reper.categorie).toBe('carrefour');
    expect(b[0]?.reper.nom).toMatch(/carrefour saint-michel/i);
  });
});

describe('priorité des repères utiles au trajet', () => {
  const eglise: Reper = {
    id: 'eglise-sm',
    nom: 'Saint Michel de Togudo',
    type: 'Église',
    categorie: 'culte',
    icone: 'home',
    detail: 'Togudo',
    lat: 6.37,
    lon: 2.42,
    source: 'osm',
  };
  const carrefour: Reper = {
    id: 'carrefour-sm',
    nom: 'Carrefour Saint-Michel',
    type: 'Carrefour',
    categorie: 'carrefour',
    icone: 'git-merge',
    detail: 'Cotonou',
    lat: 6.3655,
    lon: 2.4185,
    source: 'curate',
  };
  const pharmacie: Reper = {
    id: 'pharma-sm',
    nom: 'Pharmacie Saint-Michel',
    type: 'Pharmacie',
    categorie: 'pharmacie',
    icone: 'plus',
    lat: 6.366,
    lon: 2.419,
    source: 'osm',
  };
  const marche: Reper = {
    id: 'marche-sm',
    nom: 'Marché Saint-Michel',
    type: 'Marché',
    categorie: 'marche',
    icone: 'shopping-bag',
    lat: 6.366,
    lon: 2.42,
    source: 'osm',
  };
  const gare: Reper = {
    id: 'gare-sm',
    nom: 'Gare routière de Saint-Michel',
    type: 'Gare routière',
    categorie: 'gare',
    icone: 'truck',
    lat: 6.367,
    lon: 2.417,
    source: 'osm',
  };
  const quartier: Reper = {
    id: 'quartier-sm',
    nom: 'Saint-Michel',
    type: 'Quartier',
    categorie: 'quartier',
    icone: 'map-pin',
    detail: 'Cotonou',
    lat: 6.365,
    lon: 2.418,
    source: 'osm',
  };

  it('place le carrefour avant les églises et pharmacies pour « saint mi »', () => {
    const r = rechercherReperes('saint mi', {
      jeu: [eglise, pharmacie, carrefour],
    });
    expect(r[0]?.reper.id).toBe('carrefour-sm');
    expect(r.map((x) => x.reper.categorie)).toEqual(
      expect.arrayContaining(['carrefour', 'culte', 'pharmacie']),
    );
  });

  it('place aussi les marchés, gares et quartiers devant une église à score proche', () => {
    for (const utile of [marche, gare, quartier]) {
      const r = rechercherReperes('saint mi', { jeu: [eglise, utile] });
      expect(r[0]?.reper.id).toBe(utile.id);
    }
  });

  it('garde une église en tête quand la requête la désigne clairement', () => {
    const r = rechercherReperes('saint michel de togudo', {
      jeu: [eglise, carrefour, pharmacie],
    });
    expect(r[0]?.reper.id).toBe('eglise-sm');
  });

  it('garde une pharmacie en tête pour une requête « pharmacie … »', () => {
    const r = rechercherReperes('pharmacie saint michel', {
      jeu: [eglise, carrefour, pharmacie],
    });
    expect(r[0]?.reper.id).toBe('pharma-sm');
  });
});
