/**
 * Repères publiés, clairement distincts des signalements d'usagers.
 * Ils ont servi à caler le modèle ; ils n'entrent pas dans le mélange
 * des avis.
 */
export type ReperPublie = {
  trajet: string;
  distanceKmEnviron: number | null;
  fourchetteFcfa: [number, number];
  annee: number;
  source: string;
  url: string;
  note?: string;
};

export const REPERES_PUBLIES: ReperPublie[] = [
  {
    trajet: 'Course courte, après la flambée du kpayo',
    distanceKmEnviron: 2,
    fourchetteFcfa: [250, 300],
    annee: 2026,
    source: 'Ahouandjo, Patrick Hervé Yobode, 12 novembre 2026',
    url: 'https://ahouandjo.com/article.php?slug=ahouandjo.com%2Fflambee-du-Kpayo-zemidjans-et-usagers-pris-au-piege-de-la-cherte',
    note: '« Là où une course s’évaluait jadis à 200 ou 250 francs CFA », les usagers « se résignent parfois à payer 250 ou 300 francs CFA ». Le litre de kpayo est alors cité entre 1 000 et 1 200 F dans certains points de vente.',
  },
  {
    trajet: 'Court, moins de 10 min (prix local observé / après négociation)',
    distanceKmEnviron: 3,
    fourchetteFcfa: [200, 400],
    annee: 2026,
    source: 'benin360.com, relevés de mai 2026 (Fidjrossè, Plateau, Cadjèhoun, Godomey)',
    url: 'https://benin360.com/transport-cotonou-benin/',
    note: 'Prix local observé 200-300 F ; 300-400 F après négociation. Guide pratique, pas une enquête contrôlée.',
  },
  {
    trajet: 'Moyen, 15 à 20 min, après négociation',
    distanceKmEnviron: 7,
    fourchetteFcfa: [500, 700],
    annee: 2026,
    source: 'benin360.com, mai 2026',
    url: 'https://benin360.com/transport-cotonou-benin/',
    note: 'Prix local observé 300-500 F ; 500-700 F après négociation.',
  },
  {
    trajet: 'Long, 30 min et plus, après négociation',
    distanceKmEnviron: 14,
    fourchetteFcfa: [800, 1200],
    annee: 2026,
    source: 'benin360.com, mai 2026',
    url: 'https://benin360.com/transport-cotonou-benin/',
  },
  {
    trajet: 'Haie Vive – Ganhi, trajet moyen (guide 2026, fourchette « juste prix »)',
    distanceKmEnviron: 5.3,
    fourchetteFcfa: [400, 700],
    annee: 2026,
    source: 'icotonou.com, 14 septembre 2026',
    url: 'https://www.icotonou.com/en/installation/riding-zemidjan-cotonou/',
    note: 'Le tableau indique 400-600 F ; le résumé du même article élargit à 400-700 F pour une traversée de ville.',
  },
  {
    trajet: 'Gozem Zem (moto commandée dans l’application), courses en ville observées',
    distanceKmEnviron: null,
    fourchetteFcfa: [300, 800],
    annee: 2026,
    source: 'benin360.com, 2026, et icotonou.com, 23 juillet 2026',
    url: 'https://www.icotonou.com/en/articles/ride-hailing-apps-cotonou/',
    note: 'icotonou.com cite 200-1 200 F selon la distance, « à peu près aligné sur le zém de rue ». benin360 indique 300-800 F. Référence d’application, pas un tarif de rue.',
  },
  {
    trajet: 'Yango Moto, grille officielle publiée (plafonds, Cotonou)',
    distanceKmEnviron: 2,
    fourchetteFcfa: [85, 85],
    annee: 2026,
    source: 'Yango, grille Moto Cotonou, valable jusqu’au 17 novembre 2026',
    url: 'https://yango.com/cotonou/tariff/moto/',
    note: 'Minimum « pas plus de 85 F » pour 5 min et 2 km inclus, puis au plus 18 F/km et 8 F/min en ville. Grille de plateforme, nettement sous les prix de rue ; elle n’a pas servi à caler le barème du zém de rue.',
  },
  {
    trajet: 'Minimum de la course, Cotonou',
    distanceKmEnviron: null,
    fourchetteFcfa: [100, 100],
    annee: 2017,
    source: 'franceinfo, Wikipedia (Zémidjan)',
    url: 'https://en.wikipedia.org/wiki/Zemidjan',
    note: '« The minimum rate is 100FCFA. » Franceinfo (2017) confirme : « La course démarre à 100 FCFA. »',
  },
  {
    trajet: 'Court trajet à Cotonou (0 à 3 km)',
    distanceKmEnviron: 2,
    fourchetteFcfa: [100, 250],
    annee: 2019,
    source: 'SSATP / Banque mondiale, Policies for sustainable mobility and accessibility in cities of Benin',
    url: 'https://www.ssatp.org/sites/default/files/publication/Country-Assesment-report-Benin-En.pdf',
    note: 'Rapport d’octobre 2019, p. 40 de l’édition anglaise.',
  },
  {
    trajet: 'Calavi – Cotonou, trajet domicile-travail (15 à 20 km)',
    distanceKmEnviron: 17,
    fourchetteFcfa: [500, 1000],
    annee: 2019,
    source: 'SSATP / Banque mondiale (2019)',
    url: 'https://www.ssatp.org/sites/default/files/publication/Country-Assesment-report-Benin-En.pdf',
  },
  {
    trajet: 'Course moyenne à Cotonou, pouvant aller jusqu’au triple',
    distanceKmEnviron: null,
    fourchetteFcfa: [300, 900],
    annee: 2019,
    source: 'Ouest-Afrique, repris de New African (Max-Savi Carmel)',
    url: 'https://ouest-afrique.com/cotonou-face-a-la-penurie-de-transports-publics/',
    note: '« À 300 francs CFA en moyenne, la course peut parfois grimper jusqu’au triple, en fonction de la distance. »',
  },
  {
    trajet: 'Petit trajet typique',
    distanceKmEnviron: null,
    fourchetteFcfa: [100, 1000],
    annee: 2024,
    source: 'Le Petit Journal Cotonou (Julie Ducos, mis à jour le 8 décembre 2024)',
    url: 'https://lepetitjournal.com/cotonou/zem-les-taxis-moto-du-benin-299763',
    note: 'Le tarif dépend du kilomètre, de l’heure, du nombre de passagers et de la circulation. Aucun compteur.',
  },
  {
    trajet: 'Trajet intra-urbain de moins de 10 km',
    distanceKmEnviron: 8,
    fourchetteFcfa: [200, 1500],
    annee: 2026,
    source: 'Parlons Fongbé (mise à jour du 3 novembre 2026)',
    url: 'https://parlons-fongbe.com/en/motorcycle-taxis-and-car-taxis-in-benin/',
  },
  {
    trajet: 'Court, même quartier (ex. Haie Vive – Cadjèhoun)',
    distanceKmEnviron: 2.4,
    fourchetteFcfa: [200, 300],
    annee: 2026,
    source: 'icotonou.com, guide pratique (14 septembre 2026)',
    url: 'https://www.icotonou.com/en/installation/riding-zemidjan-cotonou/',
    note: 'Guide pratique, à prendre comme ordre de grandeur et non comme enquête de terrain contrôlée.',
  },
  {
    trajet: 'Moyen (ex. Haie Vive – Ganhi ou Fidjrossè)',
    distanceKmEnviron: 5.3,
    fourchetteFcfa: [400, 600],
    annee: 2026,
    source: 'icotonou.com (2026)',
    url: 'https://www.icotonou.com/en/installation/riding-zemidjan-cotonou/',
  },
  {
    trajet: 'Long, traversée de la ville (ex. Fidjrossè – Akpakpa)',
    distanceKmEnviron: 11.7,
    fourchetteFcfa: [700, 1000],
    annee: 2026,
    source: 'icotonou.com (2026)',
    url: 'https://www.icotonou.com/en/installation/riding-zemidjan-cotonou/',
    note: 'Un autre article du même site élargit cette fourchette à 800-1 500 F.',
  },
  {
    trajet: 'Cotonou centre – débarcadère d’Abomey-Calavi',
    distanceKmEnviron: 15,
    fourchetteFcfa: [1000, 1500],
    annee: 2026,
    source: 'icotonou.com (2026)',
    url: 'https://www.icotonou.com/en/installation/riding-zemidjan-cotonou/',
  },
];
