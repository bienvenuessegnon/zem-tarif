import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Bouton } from '@/components/Bouton';
import { Icone } from '@/components/Icone';
import { lireBrouillon } from '@/src/contenu/brouillon';
import { onSelectionLieu } from '@/src/contenu/selection-lieu';
import { toucherSucces } from '@/src/contenu/haptique';
import type { Lieu } from '@/src/geo/lieux';
import {
  enregistrerHabituel,
  MODELES_HABITUELS,
  type IconeHabituel,
} from '@/src/storage/habituels';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

export default function EcranHabituel() {
  const router = useRouter();
  const brouillon = lireBrouillon();
  const [nom, setNom] = useState('Maison');
  const [icone, setIcone] = useState<IconeHabituel>('home');
  const [depart, setDepart] = useState<Lieu | null>(brouillon?.origin ?? null);
  const [arrivee, setArrivee] = useState<Lieu | null>(brouillon?.dest ?? null);

  useEffect(() => {
    return onSelectionLieu((lieu, cible) => {
      if (cible === 'depart') setDepart(lieu);
      else setArrivee(lieu);
    });
  }, []);

  async function sauver() {
    if (!depart || !arrivee || nom.trim().length < 1) return;
    await enregistrerHabituel({ nom, icone, origin: depart, dest: arrivee });
    void toucherSucces();
    router.back();
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.intro}>
        Un trajet habituel s’ouvre d’un tap sur l’accueil, même hors ligne.
      </Text>
      <Text style={styles.etiquette}>Nom</Text>
      <View style={styles.rang}>
        {MODELES_HABITUELS.map((m) => (
          <Pressable
            key={m.nom}
            onPress={() => {
              setNom(m.nom);
              setIcone(m.icone);
            }}
            style={[styles.jeton, nom === m.nom && styles.jetonActif]}
          >
            <Icone nom={m.icone} taille={14} couleur={couleurs.encre} />
            <Text style={styles.jetonTexte}>{m.nom}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        value={nom}
        onChangeText={setNom}
        placeholder="Autre nom"
        placeholderTextColor={couleurs.muet}
        maxLength={32}
        style={styles.champ}
      />

      <LieuRang
        etiquette="Départ"
        lieu={depart}
        onPress={() => router.push({ pathname: '/recherche', params: { cible: 'depart' } })}
      />
      <LieuRang
        etiquette="Arrivée"
        lieu={arrivee}
        onPress={() => router.push({ pathname: '/recherche', params: { cible: 'arrivee' } })}
      />

      <Bouton
        titre="Enregistrer ce trajet"
        onPress={() => void sauver()}
        disabled={!depart || !arrivee || nom.trim().length < 1}
      />
    </ScrollView>
  );
}

function LieuRang({
  etiquette,
  lieu,
  onPress,
}: {
  etiquette: string;
  lieu: Lieu | null;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.lieu}>
      <View style={styles.lieuIcone}>
        <Icone nom={etiquette === 'Départ' ? 'navigation' : 'map-pin'} taille={16} couleur={couleurs.encre} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.etiquette}>{etiquette}</Text>
        <Text style={styles.lieuNom}>{lieu?.label ?? 'Choisir un repère'}</Text>
      </View>
      <Icone nom="chevron-right" taille={18} couleur={couleurs.muet} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: 20, paddingBottom: 48 },
  intro: { fontFamily: typo.regular, fontSize: 15, lineHeight: 22, color: couleurs.encreDouce, marginBottom: 20 },
  etiquette: {
    fontFamily: typo.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: couleurs.muet,
    marginBottom: 8,
  },
  rang: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
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
  jetonTexte: { fontFamily: typo.medium, fontSize: 13, color: couleurs.encre },
  champ: {
    fontFamily: typo.medium,
    fontSize: 16,
    color: couleurs.encre,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    outlineStyle: 'none',
  } as object,
  lieu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    padding: 14,
    marginBottom: 10,
  },
  lieuIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: couleurs.fond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lieuNom: { fontFamily: typo.medium, fontSize: 15, color: couleurs.encre },
});
