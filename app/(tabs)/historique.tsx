import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Icone } from '@/components/Icone';
import { poserTrajetInitial } from '@/src/contenu/selection-lieu';
import { lireFavoris, type Favori } from '@/src/storage/favoris';
import {
  lireHabituels,
  supprimerHabituel,
  type TrajetHabituel,
} from '@/src/storage/habituels';
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
  const router = useRouter();
  const [historique, setHistorique] = useState<EntreeHistorique[]>([]);
  const [avis, setAvis] = useState<Signalement[]>([]);
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [habituels, setHabituels] = useState<TrajetHabituel[]>([]);

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      Promise.all([lireHistorique(), lireSignalements(), lireFavoris(), lireHabituels()]).then(([h, s, f, hab]) => {
        if (!actif) return;
        setHistorique(h);
        setAvis(s.filter((x) => x.source === 'utilisateur'));
        setFavoris(f);
        setHabituels(hab);
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
        Les estimations, les trajets habituels et le budget restent sur cet appareil.
      </Text>

      <Pressable style={styles.lienBudget} onPress={() => router.push('/budget')}>
        <Icone nom="pie-chart" taille={16} couleur={couleurs.encre} />
        <Text style={styles.lienBudgetTexte}>Budget transport</Text>
        <Icone nom="chevron-right" taille={16} couleur={couleurs.muet} />
      </Pressable>

      <View style={styles.entete}>
        <Text style={styles.titre}>Trajets habituels</Text>
        <Pressable onPress={() => router.push('/habituel')}>
          <Text style={styles.lien}>Ajouter</Text>
        </Pressable>
      </View>
      {habituels.length === 0 ? (
        <EtatVide
          icone="home"
          texte="Enregistrez Maison, l’école, le marché ou le bureau. Un tap sur l’accueil recalcule le prix, même hors ligne."
        />
      ) : (
        habituels.map((h) => (
          <Pressable
            key={h.id}
            style={[styles.carte, ombreLegere, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
            onPress={() => {
              poserTrajetInitial({ origin: h.origin, dest: h.dest });
              router.push('/');
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.trajet}>{h.nom}</Text>
              <Text style={styles.meta}>
                {h.origin.label} → {h.dest.label}
              </Text>
            </View>
            <Pressable
              onPress={async () => setHabituels(await supprimerHabituel(h.id))}
              accessibilityLabel="Supprimer ce trajet habituel"
              style={{ padding: 6 }}
            >
              <Icone nom="x" taille={16} couleur={couleurs.muet} />
            </Pressable>
          </Pressable>
        ))
      )}

      <Text style={[styles.titre, styles.titreSuite]}>Trajets fréquents</Text>
      {favoris.length === 0 ? (
        <EtatVide
          icone="star"
          texte="Aucun trajet favori pour le moment. Sur l’écran Estimer, ajoutez une étoile à un trajet habituel."
        />
      ) : (
        favoris.map((f) => (
          <View key={f.id} style={[styles.carte, ombreLegere]}>
            <Text style={styles.trajet}>
              {f.origin.label} → {f.dest.label}
            </Text>
            <Text style={styles.meta}>Favori enregistré sur cet appareil</Text>
          </View>
        ))
      )}

      <Text style={[styles.titre, styles.titreSuite]}>Prix signalés</Text>
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

function EtatVide({ icone, texte }: { icone: 'tag' | 'clock' | 'star' | 'home'; texte: string }) {
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
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  lien: { fontFamily: typo.semi, fontSize: 14, color: couleurs.orFonce, marginBottom: 12 },
  lienBudget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    padding: 14,
    marginBottom: 8,
  },
  lienBudgetTexte: { fontFamily: typo.semi, fontSize: 15, color: couleurs.encre, flex: 1 },
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
