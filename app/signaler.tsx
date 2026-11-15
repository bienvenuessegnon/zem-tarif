import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Bouton } from '@/components/Bouton';
import { Icone } from '@/components/Icone';
import { envoyerSignalement, telechargerFiabilite } from '@/src/api/client';
import { lireBrouillon } from '@/src/contenu/brouillon';
import { toucherSucces } from '@/src/contenu/haptique';
import { nouvelId } from '@/src/contenu/identifiants';
import { formatFcfa, formatKm } from '@/src/pricing/format';
import { poidsSignalement, scoreFiabilite, type BilanFiabilite } from '@/src/pricing/fiabilite';
import { estNuit } from '@/src/pricing/horaire';
import type { Signalement } from '@/src/pricing/types';
import { utiliserReseau } from '@/src/reseau/etat';
import { idAppareil } from '@/src/storage/appareil';
import { ajouterHistorique } from '@/src/storage/historique';
import { lireProfil } from '@/src/storage/profil';
import { ajouterSignalement, lireSignalements } from '@/src/storage/signalements';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

export default function EcranSignaler() {
  const router = useRouter();
  const brouillon = lireBrouillon();
  const enLigne = utiliserReseau();
  const [prix, setPrix] = useState(brouillon ? String(brouillon.estimation.point) : '');
  const [nuit, setNuit] = useState(brouillon ? estNuit(brouillon.heure) : false);
  const [pluie, setPluie] = useState(Boolean(brouillon?.pluie));
  const [bagage, setBagage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [bilan, setBilan] = useState<BilanFiabilite | null>(null);

  useEffect(() => {
    let actif = true;
    (async () => {
      const distant = await telechargerFiabilite();
      if (!actif) return;
      if (distant) {
        setBilan({ score: distant.score, nb: distant.nb, libelle: distant.libelle, moyennePoids: 0 });
        return;
      }
      const locaux = await lireSignalements();
      if (!actif) return;
      setBilan(
        scoreFiabilite(
          locaux.map((s) => ({ prixPaye: s.prixPayeFcfa, prixRef: s.prixRefFcfa })),
        ),
      );
    })();
    return () => {
      actif = false;
    };
  }, []);

  const jetonsPrix = useMemo(() => {
    if (!brouillon) return [];
    const point = brouillon.estimation.point;
    const brut = [point - 100, point - 50, point, point + 50, point + 100].filter((n) => n >= 50);
    return Array.from(new Set(brut));
  }, [brouillon]);

  if (!brouillon) {
    return (
      <View style={styles.vide}>
        <View style={styles.videIcone}>
          <Icone nom="tag" taille={22} couleur={couleurs.orFonce} />
        </View>
        <Text style={styles.videTexte}>
          Commencez par estimer un trajet, puis signalez le prix réellement convenu.
        </Text>
        <Bouton titre="Retour à l’accueil" onPress={() => router.replace('/')} />
      </View>
    );
  }

  const valeur = Number(prix.replace(/\s/g, '').replace(',', '.'));
  const valide = Number.isFinite(valeur) && valeur >= 50 && valeur <= 20_000;
  const ref = brouillon.estimation.point;

  async function enregistrer() {
    if (!valide || !brouillon) return;
    setEnvoi(true);
    const [profilLocal, appareilId] = await Promise.all([lireProfil(), idAppareil()]);
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
      nuit,
      pluie,
      bagage,
      role: 'passager',
      prixRefFcfa: ref,
      poids: poidsSignalement(Math.round(valeur), ref),
      heure: brouillon.heure,
      pseudo: profilLocal.pseudo || null,
      appareilId,
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
      sourceDistance: 'osrm',
      sourcePrix: brouillon.estimation.sourcePrix,
      enregistreLe: avis.enregistreLe,
    });
    const distant = await envoyerSignalement(avis);
    setEnvoi(false);
    setMessage(
      distant
        ? 'Prix envoyé. Merci, il enrichit le prix de référence de la communauté.'
        : enLigne
          ? 'Envoi différé : le signalement est en file et partira dès que possible.'
          : 'Hors ligne : le signalement est en file et partira à la prochaine connexion.',
    );
    void toucherSucces();
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.trajet}>
        {brouillon.origin.label} → {brouillon.dest.label}
      </Text>
      <Text style={styles.meta}>
        {formatKm(brouillon.distanceM / 1000)} · référence {formatFcfa(ref)}
      </Text>

      <Text style={styles.etiquette}>Prix convenu</Text>
      <View style={styles.jetons}>
        {jetonsPrix.map((n) => (
          <Pressable
            key={n}
            onPress={() => setPrix(String(n))}
            style={[styles.jeton, String(n) === prix && styles.jetonActif]}
          >
            <Text style={[styles.jetonTexte, String(n) === prix && styles.jetonTexteActif]}>
              {formatFcfa(n)}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setPrix('')}
          style={[styles.jeton, !jetonsPrix.includes(valeur) && prix !== '' && styles.jetonActif]}
        >
          <Text style={styles.jetonTexte}>Autre</Text>
        </Pressable>
      </View>
      <TextInput
        value={prix}
        onChangeText={setPrix}
        keyboardType="numeric"
        placeholder="Montant en F"
        placeholderTextColor={couleurs.muet}
        style={styles.champ}
        accessibilityLabel="Prix convenu en francs CFA"
      />

      <Text style={styles.etiquette}>Conditions</Text>
      <View style={styles.jetons}>
        <JetonTag actif={nuit} titre="Nuit" icone="moon" onPress={() => setNuit((v) => !v)} />
        <JetonTag actif={pluie} titre="Pluie" icone="cloud-rain" onPress={() => setPluie((v) => !v)} />
        <JetonTag actif={bagage} titre="Bagage" icone="briefcase" onPress={() => setBagage((v) => !v)} />
      </View>


      <View style={styles.fiab}>
        {bilan && bilan.nb > 0 ? (
          <>
            <Text style={styles.fiabTitre}>
              Fiabilité {bilan.score}/100 · {bilan.libelle}
            </Text>
            <Text style={styles.aide}>
              Calculée sur vos {bilan.nb} signalement{bilan.nb > 1 ? 's' : ''} déjà envoyés, selon leur
              cohérence avec le prix de référence. Les écarts importants sont moins pondérés, pas écartés.
            </Text>
          </>
        ) : (
          <Text style={styles.aide}>
            Votre fiabilité sera calculée après vos premiers signalements, selon leur cohérence avec le
            prix de référence.
          </Text>
        )}
      </View>

      <Bouton
        titre={envoi ? 'Envoi…' : 'Envoyer'}
        onPress={enregistrer}
        disabled={!valide || envoi || Boolean(message)}
      />
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {!enLigne && !message ? (
        <Text style={styles.aide}>
          Vous êtes hors ligne. Le signalement sera mis en file et synchronisé plus tard.
        </Text>
      ) : null}
    </ScrollView>
  );
}

function JetonTag({
  actif,
  titre,
  icone,
  onPress,
}: {
  actif: boolean;
  titre: string;
  icone: 'moon' | 'cloud-rain' | 'briefcase' | 'user' | 'truck';
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.jeton, actif && styles.jetonActif]}>
      <Icone nom={icone} taille={14} couleur={actif ? couleurs.encre : couleurs.encreDouce} />
      <Text style={[styles.jetonTexte, actif && styles.jetonTexteActif]}>{titre}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: 20, paddingBottom: 48 },
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
  trajet: { fontFamily: typo.semi, fontSize: 22, color: couleurs.encre, lineHeight: 28 },
  meta: { fontFamily: typo.regular, fontSize: 14, color: couleurs.muet, marginTop: 8, marginBottom: 24 },
  etiquette: {
    fontFamily: typo.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: couleurs.muet,
    marginBottom: 8,
    marginTop: 8,
  },
  jetons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  jeton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  jetonActif: { backgroundColor: couleurs.orPale, borderColor: couleurs.or },
  jetonTexte: { fontFamily: typo.medium, fontSize: 13, color: couleurs.encreDouce },
  jetonTexteActif: { color: couleurs.encre },
  champ: {
    fontFamily: typo.bold,
    fontSize: 36,
    color: couleurs.encre,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    letterSpacing: -1,
    outlineStyle: 'none',
  } as object,
  fiab: { marginBottom: 20 },
  fiabTitre: { fontFamily: typo.semi, fontSize: 15, color: couleurs.encre, marginBottom: 6 },
  aide: { fontFamily: typo.regular, fontSize: 13, color: couleurs.encreDouce, lineHeight: 19, marginTop: 8 },
  ok: { fontFamily: typo.regular, fontSize: 14, color: couleurs.succes, marginTop: 16, lineHeight: 20 },
});
