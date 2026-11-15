import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icone } from '@/components/Icone';
import { lireBrouillon } from '@/src/contenu/brouillon';
import { formatFcfa } from '@/src/pricing/format';
import { typo } from '@/src/theme/typo';

export default function EcranMontrer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        <Pressable
          onPress={() => router.back()}
          style={[styles.fermer, { top: Math.max(insets.top, 12) }]}
          accessibilityLabel="Fermer"
        >
          <Icone nom="x" taille={28} couleur="#F3B409" />
        </Pressable>
      </View>
    );
  }

  const { point, bas, haut } = brouillon.estimation;

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <Pressable
        onPress={() => router.back()}
        style={[styles.fermer, { top: Math.max(insets.top, 12) }]}
        accessibilityLabel="Fermer"
      >
        <Icone nom="x" taille={28} couleur="#F3B409" />
      </Pressable>

      <Image
        source={require('../assets/logo/marque-192.png')}
        style={styles.icone}
        accessibilityLabel="Zém Tarif"
      />
      <Text
        style={styles.prix}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        accessibilityLabel={formatFcfa(point)}
      >
        {formatFcfa(point)}
      </Text>
      <Text style={styles.fourchette} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {formatFcfa(bas)} – {formatFcfa(haut)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  fermer: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  icone: { width: 88, height: 88, borderRadius: 20, marginBottom: 36 },
  prix: {
    fontFamily: typo.bold,
    fontSize: 120,
    color: '#F3B409',
    letterSpacing: -4,
    textAlign: 'center',
    width: '100%',
  },
  fourchette: {
    fontFamily: typo.semi,
    fontSize: 36,
    color: '#FFFFFF',
    marginTop: 16,
    textAlign: 'center',
    width: '100%',
  },
});
