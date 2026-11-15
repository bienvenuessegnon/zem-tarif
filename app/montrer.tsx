import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';

import { lireBrouillon } from '@/src/contenu/brouillon';
import { formatFcfa, formatKm } from '@/src/pricing/format';
import { typo } from '@/src/theme/typo';

export default function EcranMontrer() {
  const router = useRouter();
  const brouillon = lireBrouillon();

  useEffect(() => {
    void activateKeepAwakeAsync();
    return () => {
      void deactivateKeepAwake();
    };
  }, []);

  if (!brouillon) {
    return (
      <View style={styles.page}>
        <StatusBar style="light" />
        <Text style={styles.meta}>Estimez d’abord une course.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.fermer}>Fermer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <Text style={styles.marque}>Zém Tarif</Text>
      <Text style={styles.prix}>{formatFcfa(brouillon.estimation.point)}</Text>
      <Text style={styles.meta}>
        {formatFcfa(brouillon.estimation.bas)} – {formatFcfa(brouillon.estimation.haut)}
      </Text>
      <Text style={styles.trajet}>
        {brouillon.origin.label} → {brouillon.dest.label}
      </Text>
      <Text style={styles.meta}>{formatKm(brouillon.distanceM / 1000)}</Text>
      <Text style={styles.note}>Prix de référence, à convenir ensemble.</Text>
      <Pressable onPress={() => router.back()} style={styles.bouton}>
        <Text style={styles.fermer}>Fermer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  marque: { fontFamily: typo.bold, fontSize: 16, color: '#F3B409', marginBottom: 24 },
  prix: { fontFamily: typo.bold, fontSize: 96, color: '#F3B409', letterSpacing: -3, textAlign: 'center' },
  meta: { fontFamily: typo.medium, fontSize: 18, color: '#C8C8C4', marginTop: 8, textAlign: 'center' },
  trajet: {
    fontFamily: typo.semi,
    fontSize: 22,
    color: '#FFFFFF',
    marginTop: 28,
    textAlign: 'center',
    lineHeight: 30,
  },
  note: { fontFamily: typo.regular, fontSize: 14, color: '#8A8A86', marginTop: 28, textAlign: 'center' },
  bouton: { marginTop: 40, padding: 12 },
  fermer: { fontFamily: typo.semi, fontSize: 16, color: '#F3B409' },
});
