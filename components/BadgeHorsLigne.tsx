import { StyleSheet, Text, View } from 'react-native';

import { Icone } from '@/components/Icone';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

export function BadgeHorsLigne({ visible, compte }: { visible: boolean; compte?: number }) {
  if (!visible) return null;
  return (
    <View style={styles.badge} accessibilityRole="text">
      <Icone nom="wifi-off" taille={12} couleur={couleurs.encre} />
      <Text style={styles.texte}>
        {typeof compte === 'number'
          ? `Hors ligne · ${compte} repères`
          : 'Hors ligne · prix disponibles'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: couleurs.orPale,
    borderColor: couleurs.or,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  texte: {
    fontFamily: typo.medium,
    fontSize: 11,
    color: couleurs.encre,
  },
});
