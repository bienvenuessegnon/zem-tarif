import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { couleurs } from '@/src/theme/colors';
import { ombreCarte } from '@/src/theme/espace';

const PARTS: [number, number, number] = [0.22, 0.5, 0.9];
const RESSORT = { damping: 22, stiffness: 240, mass: 0.85, overshootClamping: true };

export type IndexFeuille = 0 | 1 | 2;

export type CommandeFeuille = {
  allerA: (index: IndexFeuille) => void;
  allerAAuMoins: (index: IndexFeuille) => void;
};

type Props = {
  entete: ReactNode;
  children: ReactNode;
  onIndex?: (index: IndexFeuille) => void;
  onHauteurStabilisee?: (pixels: number) => void;
};

function accrocher(h: number, vitesseY: number, pts: number[]): IndexFeuille {
  'worklet';
  if (pts[0] <= 0) return 0;
  // Flick vers le haut (vitesse Y négative) : palier supérieur.
  if (vitesseY < -900) {
    if (h < pts[1] - 8) return 1;
    return 2;
  }
  if (vitesseY > 900) {
    if (h > pts[1] + 8) return 1;
    return 0;
  }
  let meilleur: IndexFeuille = 0;
  let ecart = Math.abs(pts[0] - h);
  for (let i = 1; i < 3; i += 1) {
    const d = Math.abs(pts[i] - h);
    if (d < ecart) {
      ecart = d;
      meilleur = i as IndexFeuille;
    }
  }
  return meilleur;
}

export const FeuilleBas = forwardRef<CommandeFeuille, Props>(function FeuilleBas(
  { entete, children, onIndex, onHauteurStabilisee },
  ref,
) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState<IndexFeuille>(0);
  const [mesure, setMesure] = useState({ h: 0, pts: [0, 0, 0] });
  const onIndexRef = useRef(onIndex);
  const onHautRef = useRef(onHauteurStabilisee);
  onIndexRef.current = onIndex;
  onHautRef.current = onHauteurStabilisee;

  const hauteur = useSharedValue(0);
  const debut = useSharedValue(0);
  const points = useSharedValue([0, 0, 0]);
  const indexActuel = useSharedValue<IndexFeuille>(0);
  const pret = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const notifier = (i: IndexFeuille, px: number) => {
    setIndex(i);
    onIndexRef.current?.(i);
    onHautRef.current?.(px);
  };

  const animerVers = (i: IndexFeuille) => {
    const pts = points.value;
    if (pts[2] <= 0) return;
    indexActuel.value = i;
    hauteur.value = withSpring(pts[i], RESSORT);
    notifier(i, pts[i]);
  };

  useImperativeHandle(ref, () => ({
    allerA: (i) => animerVers(i),
    allerAAuMoins: (i) => {
      if (indexActuel.value < i) animerVers(i);
    },
  }));

  function onLayout(e: LayoutChangeEvent) {
    const h = e.nativeEvent.layout.height;
    if (h <= 0) return;
    const pts = [PARTS[0] * h, PARTS[1] * h, PARTS[2] * h];
    points.value = pts;
    setMesure({ h, pts });
    if (pret.value === 0) {
      const depart = pts[indexActuel.value];
      hauteur.value = depart;
      pret.value = 1;
      onHautRef.current?.(depart);
    } else {
      hauteur.value = withSpring(pts[indexActuel.value], RESSORT);
      onHautRef.current?.(pts[indexActuel.value]);
    }
  }

  const appliquerGlissement = (translationY: number) => {
    'worklet';
    const pts = points.value;
    if (pts[2] <= 0) return;
    const peutDefiler = hauteur.value >= pts[1] - 6;
    if (peutDefiler && scrollY.value > 2 && translationY < 0) return;
    if (peutDefiler && scrollY.value > 2 && translationY > 0) return;
    const suivante = debut.value - translationY;
    const min = pts[0];
    const max = pts[2];
    hauteur.value = suivante < min ? min : suivante > max ? max : suivante;
  };

  const terminerGlissement = (vitesseY: number) => {
    'worklet';
    const pts = points.value;
    if (pts[2] <= 0) return;
    const i = accrocher(hauteur.value, vitesseY, pts);
    indexActuel.value = i;
    hauteur.value = withSpring(pts[i], RESSORT);
    runOnJS(notifier)(i, pts[i]);
  };

  const fabriquerPan = () =>
    Gesture.Pan()
      .activeOffsetY([-8, 8])
      .onStart(() => {
        debut.value = hauteur.value;
      })
      .onUpdate((e) => {
        appliquerGlissement(e.translationY);
      })
      .onEnd((e) => {
        terminerGlissement(e.velocityY);
      });

  const tap = Gesture.Tap().onEnd(() => {
    const suivant = ((indexActuel.value + 1) % 3) as IndexFeuille;
    const pts = points.value;
    if (pts[2] <= 0) return;
    indexActuel.value = suivant;
    hauteur.value = withSpring(pts[suivant], RESSORT);
    runOnJS(notifier)(suivant, pts[suivant]);
  });

  const poignee = Gesture.Exclusive(fabriquerPan(), tap);
  const panCorps = fabriquerPan();

  const styleFeuille = useAnimatedStyle(() => ({
    height: hauteur.value,
    opacity: pret.value,
  }));

  const styleEntete = useAnimatedStyle(() => {
    const pts = points.value;
    const milieu = pts[1] || 1;
    const bas = pts[0] || 0;
    const seuil = (bas + milieu) / 2;
    const visible = hauteur.value < seuil ? 1 : 0;
    return {
      opacity: visible,
      maxHeight: visible ? 120 : 0,
      overflow: 'hidden' as const,
      marginBottom: visible ? 4 : 0,
    };
  });

  const styleCorps = useAnimatedStyle(() => {
    const pts = points.value;
    const seuil = (pts[0] + pts[1]) / 2 || 1;
    const visible = hauteur.value >= seuil ? 1 : 0;
    return { flex: 1, opacity: visible };
  });

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const defile = index >= 1;

  return (
    <View style={styles.cadre} pointerEvents="box-none" onLayout={onLayout}>
      <GestureDetector gesture={panCorps}>
        <Animated.View style={[styles.feuille, ombreCarte, styleFeuille]} pointerEvents="auto">
          <GestureDetector gesture={poignee}>
            <View
              style={styles.zonePoignee}
              testID="poignee-feuille"
              nativeID="poignee-feuille"
              accessibilityRole="adjustable"
              accessibilityLabel="Taille de la feuille"
              accessibilityHint="Touchez pour passer à la taille suivante, ou faites glisser."
              accessibilityValue={{
                text: index === 0 ? 'réduite' : index === 1 ? 'moyenne' : 'étendue',
              }}
            >
              <View style={styles.poignee} />
            </View>
          </GestureDetector>

          <Animated.View style={[styles.entete, styleEntete]} pointerEvents={index === 0 ? 'auto' : 'none'}>
            {entete}
          </Animated.View>

          <Animated.View style={styleCorps}>
            <Animated.ScrollView
              onScroll={onScroll}
              scrollEventThrottle={16}
              scrollEnabled={defile}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.contenu, { paddingBottom: 28 + Math.max(insets.bottom, 12) }]}
            >
              {children}
            </Animated.ScrollView>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

export function hauteurCible(hauteurEcran: number, index: IndexFeuille): number {
  return PARTS[index] * hauteurEcran;
}

const styles = StyleSheet.create({
  cadre: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
  },
  feuille: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: couleurs.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  zonePoignee: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    minHeight: 28,
  },
  poignee: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: couleurs.ligne,
  },
  entete: {
    paddingHorizontal: 20,
  },
  contenu: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
});
