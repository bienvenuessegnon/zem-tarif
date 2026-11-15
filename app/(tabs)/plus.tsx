import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Bouton } from '@/components/Bouton';
import { Icone, type NomIcone } from '@/components/Icone';
import { useProfil } from '@/src/contenu/contexte-profil';
import { SLOGAN } from '@/src/contenu/slogan';
import { toucherSucces } from '@/src/contenu/haptique';
import { revoirOnboarding } from '@/src/storage/profil';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

export default function EcranPlus() {
  const router = useRouter();
  const { profil, enregistrer } = useProfil();
  const [pseudo, setPseudo] = useState(profil.pseudo);
  const [sauve, setSauve] = useState(false);

  async function sauver() {
    await enregistrer({ ...profil, pseudo: pseudo.trim().slice(0, 32) });
    setSauve(true);
    void toucherSucces();
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.chapo}>{SLOGAN}</Text>

      <Text style={styles.titre}>Votre profil</Text>
      <Text style={styles.p}>
        Aucun compte, ni téléphone, ni e-mail. Un prénom ou un pseudo suffit,
        si vous voulez apparaître à côté d’un prix signalé.
      </Text>
      <TextInput
        value={pseudo}
        onChangeText={(t) => {
          setPseudo(t);
          setSauve(false);
        }}
        placeholder="Prénom ou pseudo"
        placeholderTextColor={couleurs.muet}
        maxLength={32}
        style={styles.champ}
        accessibilityLabel="Prénom ou pseudo"
      />
      <Bouton titre={sauve ? 'Enregistré' : 'Enregistrer'} onPress={sauver} disabled={sauve} />

      <Text style={[styles.titre, { marginTop: 32 }]}>L’application</Text>
      <Ligne icone="shield" titre="Conseils de négociation et de sécurité" onPress={() => router.push('/conseils')} />
      <Ligne icone="info" titre="La méthode et les sources" onPress={() => router.push('/a-propos')} />
      <Ligne
        icone="repeat"
        titre="Revoir l’introduction"
        onPress={async () => {
          await revoirOnboarding();
          if (Platform.OS === 'web' && typeof location !== 'undefined') {
            location.reload();
          }
        }}
        note="Au prochain lancement de l’application"
      />
    </ScrollView>
  );
}

function Ligne({
  icone,
  titre,
  onPress,
  note,
}: {
  icone: NomIcone;
  titre: string;
  onPress: () => void;
  note?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ligne, pressed && { opacity: 0.7 }]}>
      <View style={styles.ligneIcone}>
        <Icone nom={icone} taille={18} couleur={couleurs.encre} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.ligneTitre}>{titre}</Text>
        {note ? <Text style={styles.ligneNote}>{note}</Text> : null}
      </View>
      <Icone nom="chevron-right" taille={18} couleur={couleurs.muet} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  chapo: { fontFamily: typo.medium, fontSize: 16, color: couleurs.orFonce, marginBottom: 24 },
  titre: { fontFamily: typo.semi, fontSize: 20, color: couleurs.encre, marginBottom: 8 },
  p: { fontFamily: typo.regular, fontSize: 15, lineHeight: 22, color: couleurs.encreDouce, marginBottom: 14 },
  champ: {
    fontFamily: typo.medium,
    fontSize: 16,
    color: couleurs.encre,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    outlineStyle: 'none',
  } as object,
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    padding: 14,
    marginTop: 8,
  },
  ligneIcone: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: couleurs.fond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ligneTitre: { fontFamily: typo.medium, fontSize: 15, color: couleurs.encre },
  ligneNote: { fontFamily: typo.regular, fontSize: 12, color: couleurs.muet, marginTop: 2 },
});
