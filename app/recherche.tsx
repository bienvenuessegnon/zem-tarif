import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { BadgeHorsLigne } from '@/components/BadgeHorsLigne';
import { Bouton } from '@/components/Bouton';
import { Icone, iconeConnue, type NomIcone } from '@/components/Icone';
import { envoyerSuggestion } from '@/src/api/client';
import { choisirLieu, type CibleLieu } from '@/src/contenu/selection-lieu';
import { toucherLeger, toucherSucces } from '@/src/contenu/haptique';
import { ATTRIBUTION_OSM, ICONES_CATEGORIE, LIBELLES_CATEGORIE, NOMBRE_REPERES, type Reper } from '@/src/geo/reperes';
import { rechercherReperes } from '@/src/geo/recherche';
import { reperVersLieu } from '@/src/geo/reperes';
import { utiliserReseau } from '@/src/reseau/etat';
import { nouvelleSuggestion } from '@/src/storage/suggestions';
import { lireLieuxRecents, memoriserLieuRecent } from '@/src/storage/lieux-recents';
import type { Lieu } from '@/src/geo/lieux';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

export default function EcranRecherche() {
  const router = useRouter();
  const params = useLocalSearchParams<{ cible?: string }>();
  const cible: CibleLieu = params.cible === 'depart' ? 'depart' : 'arrivee';
  const enLigne = utiliserReseau();
  const [requete, setRequete] = useState('');
  const [recents, setRecents] = useState<Lieu[]>([]);
  const [suggestionOuverte, setSuggestionOuverte] = useState(false);
  const [nomManquant, setNomManquant] = useState('');
  const [detailManquant, setDetailManquant] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void lireLieuxRecents().then(setRecents);
  }, []);

  const resultats = useMemo(
    () => rechercherReperes(requete, { limite: 40 }),
    [requete],
  );

  async function valider(reper: Reper) {
    const lieu = reperVersLieu(reper);
    await memoriserLieuRecent(lieu);
    choisirLieu(lieu, cible);
    void toucherSucces();
    router.back();
  }

  async function validerLieu(lieu: Lieu) {
    await memoriserLieuRecent(lieu);
    choisirLieu(lieu, cible);
    void toucherSucces();
    router.back();
  }

  async function envoyerManque() {
    if (nomManquant.trim().length < 2) return;
    const s = nouvelleSuggestion(nomManquant, detailManquant);
    const ok = await envoyerSuggestion(s);
    setMessage(
      ok
        ? 'Suggestion envoyée. Merci, elle sera examinée pour une prochaine mise à jour.'
        : 'Suggestion enregistrée sur cet appareil. Elle partira dès qu’une connexion sera disponible.',
    );
    setSuggestionOuverte(false);
    setNomManquant('');
    setDetailManquant('');
    void toucherSucces();
  }

  return (
    <View style={styles.page}>
      <View style={styles.barre}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Retour" style={styles.retour}>
          <Icone nom="chevron-left" taille={22} couleur={couleurs.encre} />
        </Pressable>
        <TextInput
          value={requete}
          onChangeText={setRequete}
          placeholder={cible === 'depart' ? 'Point de départ' : 'Où allez-vous ?'}
          placeholderTextColor={couleurs.muet}
          autoFocus
          style={styles.champ}
          accessibilityLabel="Recherche de repère"
        />
      </View>

      <View style={styles.badges}>
        <BadgeHorsLigne visible={!enLigne} compte={NOMBRE_REPERES} />
        {enLigne ? (
          <Text style={styles.compte}>{NOMBRE_REPERES.toLocaleString('fr-FR')} repères hors ligne</Text>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.liste} keyboardShouldPersistTaps="handled">
        {requete.trim().length === 0 && recents.length > 0 ? (
          <View>
            <Text style={styles.section}>Récents</Text>
            {recents.map((lieu, i) => (
              <LigneLieu
                key={`${lieu.label}-${i}`}
                titre={lieu.label}
                sous={lieu.detail}
                icone="clock"
                onPress={() => void validerLieu(lieu)}
              />
            ))}
          </View>
        ) : null}

        {requete.trim().length > 0 ? (
          resultats.length === 0 ? (
            <Text style={styles.vide}>Aucun repère ne correspond à « {requete.trim()} ».</Text>
          ) : (
            resultats.map((r) => (
              <LigneLieu
                key={r.reper.id}
                titre={r.reper.nom}
                sous={`${r.reper.type}${r.reper.detail && r.reper.detail !== r.reper.type ? ` · ${r.reper.detail}` : ''}`}
                icone={iconeConnue(r.reper.icone || ICONES_CATEGORIE[r.reper.categorie])}
                onPress={() => void valider(r.reper)}
              />
            ))
          )
        ) : (
          <Text style={styles.aideCat}>
            Marchés, carrefours, pharmacies, églises et mosquées, campus, gares, hôpitaux et quartiers du Grand Nokoué.
          </Text>
        )}

        <Pressable
          onPress={() => setSuggestionOuverte((v) => !v)}
          style={styles.manque}
        >
          <Icone nom="plus" taille={16} couleur={couleurs.orFonce} />
          <Text style={styles.manqueTexte}>Un repère manque ?</Text>
        </Pressable>

        {suggestionOuverte ? (
          <View style={styles.form}>
            <TextInput
              value={nomManquant}
              onChangeText={setNomManquant}
              placeholder="Nom du lieu"
              placeholderTextColor={couleurs.muet}
              style={styles.champForm}
            />
            <TextInput
              value={detailManquant}
              onChangeText={setDetailManquant}
              placeholder="Quartier, ville (facultatif)"
              placeholderTextColor={couleurs.muet}
              style={styles.champForm}
            />
            <Bouton titre="Envoyer la suggestion" onPress={() => void envoyerManque()} disabled={nomManquant.trim().length < 2} />
          </View>
        ) : null}
        {message ? <Text style={styles.ok}>{message}</Text> : null}

        <Text style={styles.odbl}>{ATTRIBUTION_OSM}</Text>
        <Text style={styles.odbl}>
          {Object.values(LIBELLES_CATEGORIE).join(' · ')}
        </Text>
      </ScrollView>
    </View>
  );
}

function LigneLieu({
  titre,
  sous,
  icone,
  onPress,
}: {
  titre: string;
  sous?: string;
  icone: NomIcone;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        void toucherLeger();
        onPress();
      }}
      style={({ pressed }) => [styles.ligne, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.iconeBoite}>
        <Icone nom={icone} taille={16} couleur={couleurs.encre} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.titreLigne} numberOfLines={1}>
          {titre}
        </Text>
        {sous ? (
          <Text style={styles.sousLigne} numberOfLines={1}>
            {sous}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fond },
  barre: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    gap: 4,
  },
  retour: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  champ: {
    flex: 1,
    fontFamily: typo.medium,
    fontSize: 16,
    color: couleurs.encre,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    outlineStyle: 'none',
  } as object,
  badges: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 10 },
  compte: { fontFamily: typo.medium, fontSize: 11, color: couleurs.muet },
  liste: { paddingHorizontal: 16, paddingBottom: 48 },
  section: {
    fontFamily: typo.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: couleurs.muet,
    marginTop: 12,
    marginBottom: 6,
  },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  iconeBoite: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: couleurs.orPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titreLigne: { fontFamily: typo.medium, fontSize: 15, color: couleurs.encre },
  sousLigne: { fontFamily: typo.regular, fontSize: 12, color: couleurs.muet, marginTop: 2 },
  vide: { fontFamily: typo.regular, fontSize: 14, color: couleurs.encreDouce, marginTop: 24, lineHeight: 20 },
  aideCat: { fontFamily: typo.regular, fontSize: 13, color: couleurs.muet, marginTop: 16, lineHeight: 20 },
  manque: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28 },
  manqueTexte: { fontFamily: typo.semi, fontSize: 15, color: couleurs.orFonce },
  form: { marginTop: 12, gap: 8 },
  champForm: {
    fontFamily: typo.medium,
    fontSize: 15,
    color: couleurs.encre,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    outlineStyle: 'none',
  } as object,
  ok: { fontFamily: typo.regular, fontSize: 13, color: couleurs.succes, marginTop: 12, lineHeight: 18 },
  odbl: { fontFamily: typo.regular, fontSize: 11, color: couleurs.muet, marginTop: 16, lineHeight: 16 },
});
