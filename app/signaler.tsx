import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Bouton } from '@/components/Bouton';
import { Icone } from '@/components/Icone';
import { envoyerSignalement } from '@/src/api/client';
import { lireBrouillon } from '@/src/contenu/brouillon';
import { toucherSucces } from '@/src/contenu/haptique';
import { nouvelId } from '@/src/contenu/identifiants';
import { formatFcfa, formatKm } from '@/src/pricing/format';
import { estNuit } from '@/src/pricing/horaire';
import type { Signalement } from '@/src/pricing/types';
import { ajouterHistorique } from '@/src/storage/historique';
import { ajouterSignalement } from '@/src/storage/signalements';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

export default function EcranSignaler() {
  const router = useRouter();
  const brouillon = lireBrouillon();
  const [prix, setPrix] = useState(
    brouillon ? String(brouillon.estimation.point) : '',
  );
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  if (!brouillon) {
    return (
      <View style={styles.vide}>
        <View style={styles.videIcone}>
          <Icone nom="tag" taille={22} couleur={couleurs.orFonce} />
        </View>
        <Text style={styles.videTexte}>
          Commencez par estimer un trajet, puis signalez le prix réellement payé.
        </Text>
        <Bouton titre="Retour à l’estimation" onPress={() => router.replace('/')} />
      </View>
    );
  }

  const valeur = Number(prix.replace(/\s/g, '').replace(',', '.'));
  const valide = Number.isFinite(valeur) && valeur >= 50 && valeur <= 20_000;

  async function enregistrer() {
    if (!valide || !brouillon) return;
    setEnvoi(true);
    const avis: Signalement = {
      id: nouvelId(),
      originLat: brouillon.origin.lat,
      originLon: brouillon.origin.lon,
      destLat: brouillon.dest.lat,
      destLon: brouillon.dest.lon,
      originLabel: brouillon.origin.label,
      destLabel: brouillon.dest.label,
      distanceM: brouillon.distanceM,
      prixPayeFcfa: Math.round(valeur),
      nuit: estNuit(brouillon.heure),
      pluie: brouillon.pluie,
      enregistreLe: new Date().toISOString(),
      source: 'utilisateur',
    };
    await ajouterSignalement(avis);
    await ajouterHistorique({
      id: nouvelId(),
      origin: brouillon.origin,
      dest: brouillon.dest,
      distanceM: brouillon.distanceM,
      dureeS: brouillon.dureeS,
      point: brouillon.estimation.point,
      bas: brouillon.estimation.bas,
      haut: brouillon.estimation.haut,
      nuit: brouillon.estimation.nuit,
      pluie: brouillon.estimation.pluie,
      sourceDistance: brouillon.estimation.distanceKm ? 'osrm' : 'osrm',
      sourcePrix: brouillon.estimation.sourcePrix,
      enregistreLe: avis.enregistreLe,
    });
    const distant = await envoyerSignalement(avis);
    setEnvoi(false);
    setMessage(
      distant
        ? 'Prix enregistré sur cet appareil et envoyé au serveur optionnel.'
        : 'Prix enregistré sur cet appareil. Aucun serveur n’est configuré, ou l’envoi a échoué : l’avis reste local.',
    );
    void toucherSucces();
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.trajet}>
        {brouillon.origin.label} → {brouillon.dest.label}
      </Text>
      <Text style={styles.meta}>
        {formatKm(brouillon.distanceM / 1000)} · fourchette estimée{' '}
        {formatFcfa(brouillon.estimation.bas)} – {formatFcfa(brouillon.estimation.haut)}
      </Text>
      <Text style={styles.etiquette}>Prix réellement payé, en F CFA</Text>
      <TextInput
        value={prix}
        onChangeText={setPrix}
        keyboardType="numeric"
        placeholder="ex. 500"
        placeholderTextColor={couleurs.muet}
        style={styles.champ}
        accessibilityLabel="Prix payé en francs CFA"
      />
      <Text style={styles.aide}>
        Indiquez le prix convenu, pas le premier montant demandé. Les avis
        restent sur cet appareil. S’il existe un serveur, ils peuvent aussi
        servir à affiner les estimations des autres, sans compte ni nom.
      </Text>
      <Bouton
        titre={envoi ? 'Enregistrement…' : 'Enregistrer ce prix'}
        onPress={enregistrer}
        disabled={!valide || envoi || Boolean(message)}
      />
      {message ? <Text style={styles.ok}>{message}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: 20, paddingBottom: 40 },
  vide: { flex: 1, backgroundColor: couleurs.fond, padding: 24, justifyContent: 'center', gap: 16 },
  videIcone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: couleurs.orPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videTexte: { fontFamily: typo.regular, fontSize: 16, color: couleurs.encreDouce, lineHeight: 24 },
  trajet: { fontFamily: typo.semi, fontSize: 24, color: couleurs.encre, lineHeight: 30 },
  meta: { fontFamily: typo.regular, fontSize: 14, color: couleurs.muet, marginTop: 8, marginBottom: 28 },
  etiquette: {
    fontFamily: typo.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: couleurs.muet,
    marginBottom: 8,
  },
  champ: {
    fontFamily: typo.bold,
    fontSize: 44,
    color: couleurs.encre,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    letterSpacing: -1,
    outlineStyle: 'none',
  } as object,
  aide: { fontFamily: typo.regular, fontSize: 14, color: couleurs.encreDouce, lineHeight: 20, marginBottom: 24 },
  ok: { fontFamily: typo.regular, fontSize: 14, color: couleurs.succes, marginTop: 16, lineHeight: 20 },
});
