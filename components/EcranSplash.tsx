import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { NOM_APP, SLOGAN } from '@/src/contenu/slogan';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

export function EcranSplash() {
  const logo = useSharedValue(0.84);
  const opaciteLogo = useSharedValue(0);
  const opaciteTexte = useSharedValue(0);

  useEffect(() => {
    opaciteLogo.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logo.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    opaciteTexte.value = withDelay(280, withTiming(1, { duration: 500 }));
  }, [logo, opaciteLogo, opaciteTexte]);

  const styleLogo = useAnimatedStyle(() => ({
    opacity: opaciteLogo.value,
    transform: [{ scale: logo.value }],
  }));
  const styleTexte = useAnimatedStyle(() => ({ opacity: opaciteTexte.value }));

  return (
    <View style={styles.page} accessibilityLabel={`${NOM_APP}. ${SLOGAN}`}>
      <Animated.View style={[styles.bloc, styleLogo]}>
        <Image
          source={require('../assets/logo/zem-tarif-marque.png')}
          style={styles.logo}
          accessibilityLabel={NOM_APP}
        />
        <Text style={styles.nom}>{NOM_APP}</Text>
      </Animated.View>
      <Animated.View style={styleTexte}>
        <Text style={styles.slogan}>{SLOGAN}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: couleurs.encre,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  bloc: { alignItems: 'center', gap: 18 },
  logo: { width: 96, height: 96, borderRadius: 24 },
  nom: {
    fontFamily: typo.bold,
    fontSize: 28,
    color: couleurs.surface,
    letterSpacing: -0.4,
  },
  slogan: {
    fontFamily: typo.medium,
    fontSize: 16,
    color: couleurs.or,
    letterSpacing: 0.2,
  },
});
