import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { couleurs } from '@/src/theme/colors';
import { rayon } from '@/src/theme/espace';

type Props = { largeur?: number | string; hauteur?: number };

export function Squelette({ largeur = '100%', hauteur = 14 }: Props) {
  const op = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(op, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [op]);

  return (
    <Animated.View
      style={[
        styles.barre,
        { width: largeur as number, height: hauteur, opacity: op },
      ]}
    />
  );
}

export function SqueletteCartePrix() {
  return (
    <View style={styles.bloc} accessibilityLabel="Calcul en cours">
      <Squelette largeur={120} hauteur={12} />
      <View style={{ height: 12 }} />
      <Squelette largeur={160} hauteur={36} />
      <View style={{ height: 10 }} />
      <Squelette largeur={200} hauteur={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  barre: {
    backgroundColor: couleurs.ligne,
    borderRadius: rayon.sm,
  },
  bloc: {
    paddingTop: 8,
    alignItems: 'center',
  },
});
