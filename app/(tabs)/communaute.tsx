import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icone } from '@/components/Icone';
import { telechargerStats, type TrajetCommunaute } from '@/src/api/client';
import { formatFcfa, formatKm } from '@/src/pricing/format';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { ombreLegere, rayon } from '@/src/theme/espace';

export default function EcranCommunaute() {
  const [trajets, setTrajets] = useState<TrajetCommunaute[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    const data = await telechargerStats();
    setTrajets(data);
    setChargement(false);
    if (data.length === 0) {
      // Distinguer un réseau muet d'une communauté encore vide n'est pas fiable :
      // on affiche simplement l'état vide.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      setChargement(true);
      charger().finally(() => {
        if (actif) setChargement(false);
      });
      return () => {
        actif = false;
      };
    }, [charger]),
  );

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.contenu}
      refreshControl={
        <RefreshControl refreshing={chargement} onRefresh={charger} tintColor={couleurs.encre} />
      }
    >
      <Text style={styles.intro}>
        Médiane des prix réellement signalés, trajet par trajet. Ce ne sont
        pas des tarifs officiels : plus il y a d’avis, plus le chiffre est utile.
      </Text>

      {trajets.length === 0 && !chargement ? (
        <View style={styles.vide}>
          <View style={styles.videIcone}>
            <Icone nom="users" taille={20} couleur={couleurs.orFonce} />
          </View>
          <Text style={styles.videTexte}>
            Aucun avis partagé pour le moment. Après une course, signalez le
            prix convenu : il apparaîtra ici pour les autres usagers.
          </Text>
        </View>
      ) : (
        trajets.map((t, i) => (
          <Animated.View key={`${t.originLabel}-${t.destLabel}`} entering={FadeInDown.delay(i * 40).duration(320)}>
            <View style={[styles.carte, ombreLegere]}>
              <Text style={styles.trajet}>
                {t.originLabel} → {t.destLabel}
              </Text>
              <Text style={styles.prix}>{formatFcfa(t.medianeFcfa)} CFA</Text>
              <Text style={styles.meta}>
                médiane · {t.nbAvis} avis · {formatFcfa(t.minFcfa)} – {formatFcfa(t.maxFcfa)}
                {t.distanceM ? ` · ${formatKm(t.distanceM / 1000)}` : ''}
              </Text>
            </View>
          </Animated.View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  intro: {
    fontFamily: typo.regular,
    fontSize: 15,
    lineHeight: 22,
    color: couleurs.encreDouce,
    marginBottom: 20,
  },
  vide: { alignItems: 'flex-start', gap: 12, marginTop: 8 },
  videIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: couleurs.orPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videTexte: { fontFamily: typo.regular, fontSize: 15, lineHeight: 22, color: couleurs.muet },
  carte: {
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    padding: 16,
    marginBottom: 10,
  },
  trajet: { fontFamily: typo.medium, fontSize: 15, color: couleurs.encre },
  prix: { fontFamily: typo.bold, fontSize: 22, color: couleurs.encre, marginTop: 6, letterSpacing: -0.4 },
  meta: { fontFamily: typo.regular, fontSize: 13, color: couleurs.muet, marginTop: 6 },
});
