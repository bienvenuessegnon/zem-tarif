import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

export default function Introuvable() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page introuvable' }} />
      <View style={styles.page}>
        <Text style={styles.titre}>Cette page n’existe pas.</Text>
        <Link href="/" style={styles.lien}>
          <Text style={styles.lienTexte}>Retour à l’estimation</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: couleurs.fond,
    padding: 24,
    justifyContent: 'center',
  },
  titre: { fontFamily: typo.semi, fontSize: 22, color: couleurs.encre },
  lien: { marginTop: 16 },
  lienTexte: {
    fontFamily: typo.medium,
    fontSize: 16,
    color: couleurs.orFonce,
  },
});
