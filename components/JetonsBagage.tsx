import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LIBELLES_BAGAGE, type NiveauBagage } from '@/src/pricing/constantes';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

const ORDRE: NiveauBagage[] = ['aucun', 'petit', 'gros', 'marche'];

export function JetonsBagage({
  valeur,
  onChange,
}: {
  valeur: NiveauBagage;
  onChange: (niveau: NiveauBagage) => void;
}) {
  return (
    <View>
      <Text style={styles.etiquette}>Bagages</Text>
      <View style={styles.rang}>
        {ORDRE.map((n) => {
          const actif = valeur === n;
          return (
            <Pressable
              key={n}
              onPress={() => onChange(n)}
              style={[styles.jeton, actif && styles.actif]}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
            >
              <Text style={[styles.texte, actif && styles.texteActif]}>{LIBELLES_BAGAGE[n]}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  etiquette: {
    fontFamily: typo.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: couleurs.muet,
    marginBottom: 8,
  },
  rang: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  jeton: {
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  actif: { backgroundColor: couleurs.orPale, borderColor: couleurs.or },
  texte: { fontFamily: typo.medium, fontSize: 13, color: couleurs.encreDouce },
  texteActif: { color: couleurs.encre },
});
