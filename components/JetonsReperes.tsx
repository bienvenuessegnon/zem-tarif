import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { toucherLeger } from '@/src/contenu/haptique';
import { REPERES, type Lieu } from '@/src/geo/lieux';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

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
          onPress={() => {
            void toucherLeger();
            onChoix(lieu, depart ? 'arrivee' : 'depart');
          }}
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: rayon.full,
    backgroundColor: couleurs.fond,
  },
  presse: { backgroundColor: couleurs.orPale, borderColor: couleurs.or },
  texte: { fontFamily: typo.medium, fontSize: 13, color: couleurs.encre },
});
