import { Pressable, StyleSheet, Text, View } from 'react-native';

import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

type Props = {
  heure: number;
  maintenant: boolean;
  pluie: boolean;
  onHeure: (heure: number, maintenant: boolean) => void;
  onPluie: (valeur: boolean) => void;
};

const HEURES = [6, 8, 10, 12, 15, 18, 20, 22, 0];

export function Conditions({ heure, maintenant, pluie, onHeure, onPluie }: Props) {
  return (
    <View style={styles.bloc}>
      <Text style={styles.etiquette}>Heure de la course</Text>
      <View style={styles.rang}>
        <Pressable
          onPress={() => onHeure(heure, true)}
          style={[styles.pilule, maintenant && styles.piluleActive]}
        >
          <Text style={[styles.piluleTexte, maintenant && styles.piluleTexteActive]}>
            Maintenant
          </Text>
        </Pressable>
        {HEURES.map((h) => {
          const active = !maintenant && heure === h;
          return (
            <Pressable
              key={h}
              onPress={() => onHeure(h, false)}
              style={[styles.pilule, active && styles.piluleActive]}
            >
              <Text style={[styles.piluleTexte, active && styles.piluleTexteActive]}>
                {libelleHeure(h)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        onPress={() => onPluie(!pluie)}
        style={[styles.interrupteur, pluie && styles.interrupteurActif]}
        accessibilityRole="switch"
        accessibilityState={{ checked: pluie }}
      >
        <View style={[styles.carre, pluie && styles.carreActif]} />
        <Text style={styles.interrupteurTexte}>Pluie ou voie dégradée</Text>
      </Pressable>
    </View>
  );
}

export function libelleHeure(h: number): string {
  return `${h.toString().padStart(2, '0')} h`;
}

const styles = StyleSheet.create({
  bloc: { marginTop: 16 },
  etiquette: {
    fontFamily: typo.sansMoyen,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: couleurs.secondaire,
    marginBottom: 8,
  },
  rang: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pilule: {
    borderWidth: 1,
    borderColor: couleurs.ligne,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: couleurs.carte,
  },
  piluleActive: {
    backgroundColor: couleurs.encre,
    borderColor: couleurs.encre,
  },
  piluleTexte: { fontFamily: typo.sans, fontSize: 13, color: couleurs.encre },
  piluleTexteActive: { color: couleurs.papier },
  interrupteur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  interrupteurActif: {},
  carre: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: couleurs.encre,
    backgroundColor: couleurs.carte,
  },
  carreActif: { backgroundColor: couleurs.or },
  interrupteurTexte: { fontFamily: typo.sans, fontSize: 15, color: couleurs.encre },
});
