import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Bouton } from '@/components/Bouton';
import { Icone, type NomIcone } from '@/components/Icone';
import { toucherLeger } from '@/src/contenu/haptique';
import { SLOGAN } from '@/src/contenu/slogan';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

const DIAPOS: { titre: string; texte: string; icone: NomIcone }[] = [
  {
    titre: 'Estimer',
    icone: 'map-pin',
    texte: 'Indiquez un départ et une arrivée. Zém Tarif calcule une fourchette raisonnable, en francs CFA, selon la distance, l’heure et la pluie.',
  },
  {
    titre: 'Signaler',
    icone: 'tag',
    texte: 'Après la course, indiquez le prix réellement convenu. L’avis reste d’abord sur votre appareil, et peut aider à affiner les estimations.',
  },
  {
    titre: 'Communauté',
    icone: 'users',
    texte: 'Les prix signalés, une fois partagés, donnent une médiane par trajet. Aucun compte n’est demandé : un prénom ou un pseudo, si vous voulez.',
  },
];

type Props = {
  onTerminer: (pseudo: string) => void;
};

export function Onboarding({ onTerminer }: Props) {
  const [page, setPage] = useState(0);
  const [pseudo, setPseudo] = useState('');
  const last = page === DIAPOS.length - 1;
  const diapo = DIAPOS[page];

  return (
    <View style={styles.page}>
      <View style={styles.haut}>
        <Image source={require('../assets/logo/zem-tarif-marque.png')} style={styles.logo} />
        <Text style={styles.marque}>Zém Tarif</Text>
        <Text style={styles.sous}>{SLOGAN}</Text>
      </View>

      <Animated.View key={page} entering={FadeIn.duration(280)} exiting={FadeOut.duration(160)} style={styles.carte}>
        <View style={styles.picto}>
          <Icone nom={diapo.icone} taille={28} couleur={couleurs.encre} />
        </View>
        <Text style={styles.titre}>{diapo.titre}</Text>
        <Text style={styles.texte}>{diapo.texte}</Text>
        {last ? (
          <TextInput
            value={pseudo}
            onChangeText={setPseudo}
            placeholder="Votre prénom ou pseudo (facultatif)"
            placeholderTextColor={couleurs.muet}
            maxLength={32}
            style={styles.champ}
            autoCorrect={false}
            accessibilityLabel="Prénom ou pseudo, facultatif"
          />
        ) : null}
      </Animated.View>

      <View style={styles.points}>
        {DIAPOS.map((_, i) => (
          <View key={i} style={[styles.point, i === page && styles.pointActif]} />
        ))}
      </View>

      <View style={styles.actions}>
        {!last ? (
          <Pressable
            onPress={() => {
              void toucherLeger();
              setPage(DIAPOS.length - 1);
            }}
            style={styles.passer}
          >
            <Text style={styles.passerTexte}>Passer</Text>
          </Pressable>
        ) : (
          <View style={{ width: 72 }} />
        )}
        <View style={{ flex: 1 }}>
          <Bouton
            titre={last ? 'Commencer' : 'Suivant'}
            onPress={() => {
              if (last) onTerminer(pseudo.trim());
              else setPage((p) => p + 1);
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fond, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 28 },
  haut: { alignItems: 'center', marginBottom: 28 },
  logo: { width: 56, height: 56, borderRadius: 14, marginBottom: 12 },
  marque: { fontFamily: typo.bold, fontSize: 22, color: couleurs.encre },
  sous: { fontFamily: typo.medium, fontSize: 14, color: couleurs.orFonce, marginTop: 4 },
  carte: {
    flex: 1,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  picto: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: couleurs.orPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  titre: { fontFamily: typo.semi, fontSize: 24, color: couleurs.encre, marginBottom: 10 },
  texte: {
    fontFamily: typo.regular,
    fontSize: 16,
    lineHeight: 24,
    color: couleurs.encreDouce,
    textAlign: 'center',
  },
  champ: {
    marginTop: 24,
    width: '100%',
    fontFamily: typo.medium,
    fontSize: 16,
    color: couleurs.encre,
    backgroundColor: couleurs.fond,
    borderRadius: rayon.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    outlineStyle: 'none',
  } as object,
  points: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 20 },
  point: { width: 8, height: 8, borderRadius: 4, backgroundColor: couleurs.ligne },
  pointActif: { backgroundColor: couleurs.encre, width: 18 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  passer: { paddingVertical: 12, paddingHorizontal: 8, width: 72 },
  passerTexte: { fontFamily: typo.medium, fontSize: 15, color: couleurs.muet },
});
