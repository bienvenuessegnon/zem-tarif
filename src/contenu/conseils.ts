export type Conseil = {
  titre: string;
  texte: string;
  icone: 'message-circle' | 'shield' | 'sun' | 'cloud-rain' | 'user';
};

export const CONSEILS: Conseil[] = [
  {
    titre: 'Le prix se discute avant de monter',
    icone: 'message-circle',
    texte:
      'Dites votre destination clairement, proposez un montant, et attendez l’accord. Une fois en route, il est plus difficile de revenir en arrière. Zém Tarif vous donne une fourchette pour ouvrir la discussion, pas un tarif imposé.',
  },
  {
    titre: 'Gardez de la petite monnaie',
    icone: 'sun',
    texte:
      'Les courses se règlent le plus souvent en espèces, par pas de 50 ou 100 F. Un billet de 5 000 F pour une course de 300 F complique l’échange. Ayez de la monnaie, ou convenez du rendu avant de partir.',
  },
  {
    titre: 'Un visiteur se voit souvent proposer plus',
    icone: 'user',
    texte:
      'Ce n’est pas une règle écrite, mais c’est fréquent. Connaître une fourchette, ou demander à quelqu’un du quartier, aide à rester dans un prix raisonnable sans en faire un conflit.',
  },
  {
    titre: 'La nuit et la pluie se paient davantage',
    icone: 'cloud-rain',
    texte:
      'Après 22 h, et quand il pleut ou que la voie est mauvaise, les conducteurs demandent souvent 20 à 30 % de plus, parfois davantage. Prévoyez-le, et restez sur des axes éclairés la nuit.',
  },
  {
    titre: 'Le casque, c’est votre tête',
    icone: 'shield',
    texte:
      'Beaucoup de zémidjans n’en proposent pas, ou un seul casque usagé. Si vous le pouvez, emportez le vôtre. Ce n’est pas un détail : en cas de chute, c’est la protection la plus utile. Signalez aussi votre passage à quelqu’un de confiance sur un trajet tardif.',
  },
];
