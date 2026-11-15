import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { formatDuree, formatFcfa, formatKm } from '@/src/pricing/format';
import {
  lireHistorique,
  viderHistorique,
  type EntreeHistorique,
} from '@/src/storage/historique';
import type { Signalement } from '@/src/pricing/types';
import { lireSignalements } from '@/src/storage/signalements';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

export default function EcranHistorique() {
  const [historique, setHistorique] = useState<EntreeHistorique[]>([]);
  const [avis, setAvis] = useState<Signalement[]>([]);

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      Promise.all([lireHistorique(), lireSignalements()]).then(([h, s]) => {
        if (!actif) return;
        setHistorique(h);
        setAvis(s.filter((x) => x.source === 'utilisateur'));
      });
      return () => {
        actif = false;
      };
    }, []),
  );

  async function vider() {
    await viderHistorique();
    setHistorique([]);
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.intro}>
        Les estimations et les prix signalés restent sur cet appareil. Rien
        n’est publié tant qu’aucun serveur n’est configuré.
      </Text>

      <Text style={styles.titre}>Prix signalés</Text>
      {avis.length === 0 ? (
        <Text style={styles.vide}>Aucun prix signalé pour le moment.</Text>
      ) : (
        avis.map((s) => (
          <View key={s.id} style={styles.carte}>
            <Text style={styles.trajet}>
              {s.originLabel} → {s.destLabel}
            </Text>
            <Text style={styles.prix}>{formatFcfa(s.prixPayeFcfa)} CFA</Text>
            <Text style={styles.meta}>
              {formatKm(s.distanceM / 1000)}
              {s.nuit ? ' · nuit' : ''}
              {s.pluie ? ' · pluie' : ''}
              {' · '}
              {formaterDate(s.enregistreLe)}
            </Text>
          </View>
        ))
      )}

      <Text style={[styles.titre, styles.titreSuite]}>Estimations récentes</Text>
      {historique.length === 0 ? (
        <Text style={styles.vide}>Aucune estimation enregistrée.</Text>
      ) : (
        <>
          {historique.map((e) => (
            <View key={e.id} style={styles.carte}>
              <Text style={styles.trajet}>
                {e.origin.label} → {e.dest.label}
              </Text>
              <Text style={styles.prix}>
                {formatFcfa(e.bas)} – {formatFcfa(e.haut)}
              </Text>
              <Text style={styles.meta}>
                {formatKm(e.distanceM / 1000)} · {formatDuree(e.dureeS)}
                {e.nuit ? ' · nuit' : ''}
                {e.pluie ? ' · pluie' : ''}
                {' · '}
                {formaterDate(e.enregistreLe)}
              </Text>
            </View>
          ))}
          <Pressable onPress={vider} style={styles.vider}>
            <Text style={styles.viderTexte}>Effacer l’historique des estimations</Text>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

function formaterDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Africa/Porto-Novo',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.papier },
  contenu: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  intro: {
    fontFamily: typo.sans,
    fontSize: 15,
    lineHeight: 22,
    color: couleurs.secondaire,
    marginBottom: 24,
  },
  titre: {
    fontFamily: typo.serifMoyen,
    fontSize: 22,
    color: couleurs.encre,
    marginBottom: 12,
  },
  titreSuite: { marginTop: 28 },
  vide: { fontFamily: typo.sans, fontSize: 14, color: couleurs.muet, marginBottom: 8 },
  carte: {
    borderBottomWidth: 1,
    borderBottomColor: couleurs.ligne,
    paddingVertical: 14,
  },
  trajet: { fontFamily: typo.sansMoyen, fontSize: 16, color: couleurs.encre },
  prix: { fontFamily: typo.serifMoyen, fontSize: 20, color: couleurs.encre, marginTop: 4 },
  meta: { fontFamily: typo.sans, fontSize: 13, color: couleurs.secondaire, marginTop: 4 },
  vider: { marginTop: 20, alignSelf: 'flex-start' },
  viderTexte: {
    fontFamily: typo.sans,
    fontSize: 14,
    color: couleurs.alerte,
    textDecorationLine: 'underline',
  },
});
