import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { REPERES, type Lieu } from '@/src/geo/lieux';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

type Props = {
  onChoix: (lieu: Lieu, role: 'depart' | 'arrivee') => void;
  depart?: Lieu | null;
};

export function JetonsReperes({ onChoix, depart }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rang}
    >
      {REPERES.map((lieu) => (
        <Pressable
          key={lieu.id ?? lieu.label}
          onPress={() => onChoix(lieu, depart ? 'arrivee' : 'depart')}
          style={({ pressed }) => [styles.jeton, pressed && styles.presse]}
        >
          <Text style={styles.texte}>{lieu.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rang: { gap: 8, paddingVertical: 4, paddingRight: 8 },
  jeton: {
    borderWidth: 1,
    borderColor: couleurs.ligne,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: couleurs.carte,
  },
  presse: { backgroundColor: couleurs.orPale, borderColor: couleurs.orFonce },
  texte: { fontFamily: typo.sans, fontSize: 13, color: couleurs.encre },
});
