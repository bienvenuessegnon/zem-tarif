import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Icone } from '@/components/Icone';
import { toucherLeger } from '@/src/contenu/haptique';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rang}>
        <Pilule
          actif={maintenant}
          onPress={() => onHeure(heure, true)}
          icone="clock"
          titre="Maintenant"
        />
        {HEURES.map((h) => (
          <Pilule
            key={h}
            actif={!maintenant && heure === h}
            onPress={() => onHeure(h, false)}
            titre={libelleHeure(h)}
          />
        ))}
      </ScrollView>
      <Pressable
        onPress={() => {
          void toucherLeger();
          onPluie(!pluie);
        }}
        style={[styles.pluie, pluie && styles.pluieActive]}
        accessibilityRole="switch"
        accessibilityState={{ checked: pluie }}
      >
        <Icone nom="cloud-rain" taille={16} couleur={pluie ? couleurs.encre : couleurs.muet} />
        <Text style={[styles.pluieTexte, pluie && styles.pluieTexteActif]}>
          Pluie ou voie dégradée
        </Text>
      </Pressable>
    </View>
  );
}

function Pilule({
  actif,
  onPress,
  titre,
  icone,
}: {
  actif: boolean;
  onPress: () => void;
  titre: string;
  icone?: ComponentProps<typeof Icone>['nom'];
}) {
  return (
    <Pressable
      onPress={() => {
        void toucherLeger();
        onPress();
      }}
      style={[styles.pilule, actif && styles.piluleActive]}
    >
      {icone ? (
        <Icone nom={icone} taille={13} couleur={actif ? couleurs.surface : couleurs.encre} />
      ) : null}
      <Text style={[styles.piluleTexte, actif && styles.piluleTexteActive]}>{titre}</Text>
    </Pressable>
  );
}

export function libelleHeure(h: number): string {
  return `${h.toString().padStart(2, '0')} h`;
}

const styles = StyleSheet.create({
  bloc: { marginTop: 8, gap: 10 },
  rang: { gap: 6, paddingRight: 8 },
  pilule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: rayon.full,
    backgroundColor: couleurs.fond,
  },
  piluleActive: {
    backgroundColor: couleurs.encre,
    borderColor: couleurs.encre,
  },
  piluleTexte: { fontFamily: typo.medium, fontSize: 13, color: couleurs.encre },
  piluleTexteActive: { color: couleurs.surface },
  pluie: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: rayon.full,
    backgroundColor: couleurs.fond,
  },
  pluieActive: { backgroundColor: couleurs.orPale, borderColor: couleurs.or },
  pluieTexte: { fontFamily: typo.medium, fontSize: 13, color: couleurs.muet },
  pluieTexteActif: { color: couleurs.encre },
});
