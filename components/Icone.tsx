import type { ComponentProps } from 'react';
import { Feather } from '@expo/vector-icons';

import { couleurs } from '@/src/theme/colors';

type Nom = ComponentProps<typeof Feather>['name'];

type Props = {
  nom: Nom;
  taille?: number;
  couleur?: string;
};

export function Icone({ nom, taille = 20, couleur = couleurs.encre }: Props) {
  return <Feather name={nom} size={taille} color={couleur} />;
}

export type NomIcone = Nom;

const SECOURS: NomIcone = 'map-pin';

const CONNUES = new Set<string>([
  'shopping-bag',
  'git-merge',
  'plus',
  'home',
  'book-open',
  'truck',
  'plus-square',
  'map-pin',
  'send',
]);

export function iconeConnue(nom: string | undefined): NomIcone {
  if (nom && CONNUES.has(nom)) return nom as NomIcone;
  return SECOURS;
}
