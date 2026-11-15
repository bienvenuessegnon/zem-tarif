import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Icone } from '@/components/Icone';
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
import { ombreLegere, rayon } from '@/src/theme/espace';

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
        <EtatVide
          icone="tag"
          texte="Aucun prix signalé pour le moment. Après une course, indiquez le montant convenu."
        />
      ) : (
        avis.map((s) => (
          <View key={s.id} style={[styles.carte, ombreLegere]}>
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
        <EtatVide
          icone="clock"
          texte="Aucune estimation enregistrée. Sur l’écran Estimer, appuyez sur Garder."
        />
      ) : (
        <>
          {historique.map((e) => (
            <View key={e.id} style={[styles.carte, ombreLegere]}>
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

function EtatVide({ icone, texte }: { icone: 'tag' | 'clock'; texte: string }) {
  return (
    <View style={styles.videBloc}>
      <View style={styles.videIcone}>
        <Icone nom={icone} taille={18} couleur={couleurs.muet} />
      </View>
      <Text style={styles.vide}>{texte}</Text>
    </View>
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
  page: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  intro: {
    fontFamily: typo.regular,
    fontSize: 15,
    lineHeight: 22,
    color: couleurs.encreDouce,
    marginBottom: 24,
  },
  titre: {
    fontFamily: typo.semi,
    fontSize: 20,
    color: couleurs.encre,
    marginBottom: 12,
  },
  titreSuite: { marginTop: 28 },
  videBloc: { alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  videIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: couleurs.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vide: { fontFamily: typo.regular, fontSize: 14, color: couleurs.muet, lineHeight: 20 },
  carte: {
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    padding: 16,
    marginBottom: 10,
  },
  trajet: { fontFamily: typo.medium, fontSize: 15, color: couleurs.encre },
  prix: { fontFamily: typo.bold, fontSize: 22, color: couleurs.encre, marginTop: 6, letterSpacing: -0.4 },
  meta: { fontFamily: typo.regular, fontSize: 13, color: couleurs.muet, marginTop: 6 },
  vider: { marginTop: 12, alignSelf: 'flex-start' },
  viderTexte: {
    fontFamily: typo.medium,
    fontSize: 14,
    color: couleurs.alerte,
  },
});
