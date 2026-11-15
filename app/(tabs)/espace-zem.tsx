import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { Bouton } from '@/components/Bouton';
import { Icone } from '@/components/Icone';
import { telechargerZonesDemandees, type ZoneDemandee } from '@/src/api/client';
import { lireBrouillon } from '@/src/contenu/brouillon';
import { LIBELLE_ESSENCE, PRIX_ESSENCE_FCFA_L } from '@/src/contenu/essence';
import { formatFcfa, formatKm } from '@/src/pricing/format';
import { lireRecettes, recettesDuJour, totalRecettes, type Recette } from '@/src/storage/recettes';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

export default function EcranEspaceZem() {
  const router = useRouter();
  const brouillon = lireBrouillon();
  const [recettes, setRecettes] = useState<Recette[]>([]);
  const [zones, setZones] = useState<ZoneDemandee[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      void lireRecettes().then((liste) => {
        if (actif) setRecettes(liste);
      });
      void telechargerZonesDemandees().then((liste) => {
        if (actif) setZones(liste);
      });
      return () => {
        actif = false;
      };
    }, []),
  );

  const duJour = recettesDuJour(recettes);
  const totalJour = totalRecettes(duJour);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.chapo}>Espace zémidjan</Text>
      <Text style={styles.intro}>
        Un prix de référence à montrer au client, les recettes du jour sur cet appareil, et les zones
        demandées quand la communauté en signale assez.
      </Text>

      <View style={styles.carteSombre}>
        <Text style={styles.carteLabel}>Course à montrer</Text>
        {brouillon ? (
          <>
            <Text style={styles.cartePrix}>{formatFcfa(brouillon.estimation.point)}</Text>
            <Text style={styles.carteTrajet}>
              {brouillon.origin.label} → {brouillon.dest.label}
            </Text>
            <Text style={styles.carteMeta}>
              {formatKm(brouillon.distanceM / 1000)} · {formatFcfa(brouillon.estimation.bas)} –{' '}
              {formatFcfa(brouillon.estimation.haut)}
            </Text>
            <Bouton titre="Plein écran pour le client" onPress={() => router.push('/montrer')} />
          </>
        ) : (
          <>
            <Text style={styles.carteVide}>
              Estimez d’abord un trajet depuis l’accueil, puis revenez ici pour l’afficher en grand.
            </Text>
            <Bouton titre="Aller à l’accueil" variante="contour" onPress={() => router.push('/')} />
          </>
        )}
      </View>

      <Text style={styles.titre}>Aujourd’hui</Text>
      <View style={styles.carte}>
        <Text style={styles.total}>{formatFcfa(totalJour)}</Text>
        <Text style={styles.sous}>
          {duJour.length === 0
            ? 'Aucune recette enregistrée aujourd’hui sur cet appareil.'
            : `${duJour.length} course${duJour.length > 1 ? 's' : ''} signalée${duJour.length > 1 ? 's' : ''} aujourd’hui.`}
        </Text>
        {duJour.slice(0, 8).map((r) => (
          <View key={r.id} style={styles.ligneRecette}>
            <Text style={styles.recetteTrajet} numberOfLines={1}>
              {r.de} → {r.vers}
            </Text>
            <Text style={styles.recettePrix}>{formatFcfa(r.prixFcfa)}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.titre}>{LIBELLE_ESSENCE}</Text>
      <View style={styles.carte}>
        <Text style={styles.sous}>
          Repère de {PRIX_ESSENCE_FCFA_L} F le litre, novembre 2026. Ce n’est pas un prix officiel
          mis à jour en direct.
        </Text>
      </View>

      <Text style={styles.titre}>Zones demandées</Text>
      <View style={styles.carte}>
        {zones == null ? (
          <Text style={styles.sous}>Chargement…</Text>
        ) : zones.length === 0 ? (
          <View style={styles.videZone}>
            <Icone nom="map-pin" taille={18} couleur={couleurs.orFonce} />
            <Text style={styles.sous}>
              Pas encore assez de signalements récents pour dessiner des zones de demande. La carte
              restera vide tant que la communauté n’aura pas assez d’avis.
            </Text>
          </View>
        ) : (
          zones.map((z) => (
            <View key={`${z.label}-${z.lat}`} style={styles.ligneRecette}>
              <Text style={styles.recetteTrajet}>{z.label}</Text>
              <Text style={styles.recettePrix}>{z.nb} avis</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#111111' },
  contenu: { padding: 20, paddingBottom: 80 },
  chapo: { fontFamily: typo.bold, fontSize: 24, color: '#F3B409', marginBottom: 8 },
  intro: { fontFamily: typo.regular, fontSize: 14, color: '#C8C8C4', lineHeight: 20, marginBottom: 20 },
  carteSombre: {
    backgroundColor: '#1C1C1C',
    borderRadius: rayon.lg ?? 20,
    padding: 20,
    marginBottom: 24,
    gap: 10,
  },
  carteLabel: {
    fontFamily: typo.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#8A8A86',
  },
  cartePrix: { fontFamily: typo.bold, fontSize: 64, color: '#F3B409', letterSpacing: -2 },
  carteTrajet: { fontFamily: typo.semi, fontSize: 16, color: '#FFFFFF', lineHeight: 22 },
  carteMeta: { fontFamily: typo.regular, fontSize: 13, color: '#C8C8C4', marginBottom: 8 },
  carteVide: { fontFamily: typo.regular, fontSize: 14, color: '#C8C8C4', lineHeight: 20, marginBottom: 8 },
  titre: { fontFamily: typo.semi, fontSize: 18, color: '#FFFFFF', marginBottom: 8, marginTop: 8 },
  carte: {
    backgroundColor: '#1C1C1C',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  total: { fontFamily: typo.bold, fontSize: 36, color: '#F3B409' },
  sous: { fontFamily: typo.regular, fontSize: 13, color: '#C8C8C4', lineHeight: 19, marginTop: 4 },
  ligneRecette: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  recetteTrajet: { fontFamily: typo.medium, fontSize: 13, color: '#FFFFFF', flex: 1 },
  recettePrix: { fontFamily: typo.semi, fontSize: 13, color: '#F3B409' },
  videZone: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
});
