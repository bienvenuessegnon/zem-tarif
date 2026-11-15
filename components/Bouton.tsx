import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

type Props = PressableProps & {
  titre: string;
  variante?: 'plein' | 'contour';
};

export function Bouton({ titre, variante = 'plein', disabled, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variante === 'plein' ? styles.plein : styles.contour,
        pressed && !disabled && styles.presse,
        disabled && styles.inactif,
      ]}
    >
      <Text
        style={[
          styles.texte,
          variante === 'contour' && styles.texteContour,
          disabled && styles.texteInactif,
        ]}
      >
        {titre}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  plein: { backgroundColor: couleurs.encre, borderColor: couleurs.encre },
  contour: { backgroundColor: 'transparent', borderColor: couleurs.encre },
  presse: { opacity: 0.75 },
  inactif: { opacity: 0.4 },
  texte: {
    fontFamily: typo.sansMoyen,
    fontSize: 15,
    color: couleurs.papier,
    letterSpacing: 0.2,
  },
  texteContour: { color: couleurs.encre },
  texteInactif: {},
});
