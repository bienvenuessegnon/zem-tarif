import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icone } from '@/components/Icone';
import { CONSEILS } from '@/src/contenu/conseils';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

export default function EcranConseils() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.chapo}>
        Quelques habitudes utiles pour convenir d’un prix, et pour voyager
        plus sereinement en zémidjan. Ce n’est pas un règlement.
      </Text>
      {CONSEILS.map((c, i) => (
        <Animated.View key={c.titre} entering={FadeInDown.delay(i * 50).duration(320)} style={styles.carte}>
          <View style={styles.picto}>
            <Icone nom={c.icone} taille={18} couleur={couleurs.encre} />
          </View>
          <Text style={styles.titre}>{c.titre}</Text>
          <Text style={styles.texte}>{c.texte}</Text>
        </Animated.View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  chapo: {
    fontFamily: typo.regular,
    fontSize: 15,
    lineHeight: 22,
    color: couleurs.encreDouce,
    marginBottom: 20,
  },
  carte: {
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    padding: 16,
    marginBottom: 10,
  },
  picto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: couleurs.orPale,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  titre: { fontFamily: typo.semi, fontSize: 16, color: couleurs.encre, marginBottom: 6 },
  texte: { fontFamily: typo.regular, fontSize: 15, lineHeight: 22, color: couleurs.encreDouce },
});
