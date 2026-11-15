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
