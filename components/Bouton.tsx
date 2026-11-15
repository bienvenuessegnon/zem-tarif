import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { toucherLeger } from '@/src/contenu/haptique';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

type Props = PressableProps & {
  titre: string;
  variante?: 'plein' | 'contour' | 'doux';
};

export function Bouton({ titre, variante = 'plein', disabled, onPress, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      onPress={(e) => {
        if (!disabled) void toucherLeger();
        onPress?.(e);
      }}
      style={({ pressed }) => [
        styles.base,
        variante === 'plein' && styles.plein,
        variante === 'contour' && styles.contour,
        variante === 'doux' && styles.doux,
        pressed && !disabled && styles.presse,
        disabled && styles.inactif,
      ]}
    >
      <Text
        style={[
          styles.texte,
          variante !== 'plein' && styles.texteSombre,
        ]}
      >
        {titre}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: rayon.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  plein: { backgroundColor: couleurs.encre, borderColor: couleurs.encre },
  contour: { backgroundColor: couleurs.surface, borderColor: couleurs.encre },
  doux: { backgroundColor: couleurs.fond, borderColor: couleurs.ligne },
  presse: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  inactif: { opacity: 0.4 },
  texte: {
    fontFamily: typo.semi,
    fontSize: 15,
    color: couleurs.surface,
  },
  texteSombre: { color: couleurs.encre },
});
