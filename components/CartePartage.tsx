import { StyleSheet, Text, View } from 'react-native';

import { SLOGAN } from '@/src/contenu/slogan';
import { formatFcfa, formatKm } from '@/src/pricing/format';
import { typo } from '@/src/theme/typo';

export function CartePartageVisuel({
  prix,
  bas,
  haut,
  distanceM,
  origin,
  dest,
}: {
  prix: number;
  bas: number;
  haut: number;
  distanceM: number;
  origin: string;
  dest: string;
}) {
  return (
    <View style={styles.carte} collapsable={false}>
      <Text style={styles.marque}>Zém Tarif</Text>
      <Text style={styles.prix}>{formatFcfa(prix)}</Text>
      <Text style={styles.meta}>
        {formatFcfa(bas)} – {formatFcfa(haut)}  ·  {formatKm(distanceM / 1000)}
      </Text>
      <Text style={styles.trajet}>
        {origin}  →  {dest}
      </Text>
      <Text style={styles.slogan}>{SLOGAN}</Text>
      <Text style={styles.url}>zem-tarif.onrender.com</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: '#111111',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    minHeight: 280,
  },
  marque: { fontFamily: typo.bold, fontSize: 16, color: '#F3B409', marginBottom: 28 },
  prix: { fontFamily: typo.bold, fontSize: 64, color: '#F3B409', letterSpacing: -2 },
  meta: { fontFamily: typo.medium, fontSize: 14, color: '#C8C8C4', marginTop: 8 },
  trajet: { fontFamily: typo.semi, fontSize: 18, color: '#FFFFFF', marginTop: 28, lineHeight: 26 },
  slogan: { fontFamily: typo.medium, fontSize: 13, color: '#8A8A86', marginTop: 36 },
  url: { fontFamily: typo.medium, fontSize: 13, color: '#8A8A86', marginTop: 4 },
});
