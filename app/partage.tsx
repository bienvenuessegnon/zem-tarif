import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';

import { CartePartageVisuel } from '@/components/CartePartage';
import { Icone, type NomIcone } from '@/components/Icone';
import { lireBrouillon } from '@/src/contenu/brouillon';
import { toucherSucces } from '@/src/contenu/haptique';
import { lienTrajet } from '@/src/partage/lien';
import { rendreCartePng, telechargerBlob } from '@/src/partage/rendu-web';
import { formatFcfa } from '@/src/pricing/format';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

export default function EcranPartage() {
  const router = useRouter();
  const brouillon = lireBrouillon();
  const vueRef = useRef<View | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!brouillon) {
    return (
      <View style={styles.vide}>
        <Text style={styles.videTexte}>Estimez d’abord un trajet pour partager son prix de référence.</Text>
      </View>
    );
  }

  const { origin, dest, estimation, distanceM } = brouillon;
  const lien = lienTrajet(origin, dest);
  const texte = `${origin.label} → ${dest.label} : ${formatFcfa(estimation.point)} (fourchette ${formatFcfa(estimation.bas)}–${formatFcfa(estimation.haut)}). Prix de référence Zém Tarif. ${lien}`;

  async function imageCarte(): Promise<Blob | null> {
    if (Platform.OS === 'web') {
      return rendreCartePng({
        prix: estimation.point,
        bas: estimation.bas,
        haut: estimation.haut,
        distanceM,
        origin: origin.label,
        dest: dest.label,
      });
    }
    try {
      const ViewShot = (await import('react-native-view-shot')).default;
      // Capture via URI is handled in partagerImageNative
      return null;
    } catch {
      return null;
    }
  }

  async function partagerImageNative(): Promise<string | null> {
    if (Platform.OS === 'web') return null;
    try {
      const { captureRef } = await import('react-native-view-shot');
      if (!vueRef.current) return null;
      return await captureRef(vueRef as never, { format: 'png', quality: 0.95, result: 'tmpfile' });
    } catch {
      return null;
    }
  }

  async function partagerWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(texte)}`;
    await Linking.openURL(url);
  }

  async function partagerStatut() {
    const fichier = Platform.OS === 'web' ? await imageCarte() : null;
    const uri = await partagerImageNative();
    if (Platform.OS === 'web' && fichier) {
      const nav = navigator as Navigator & {
        share?: (data: ShareData) => Promise<void>;
        canShare?: (data: ShareData) => boolean;
      };
      const file = new File([fichier], 'zem-tarif.png', { type: 'image/png' });
      if (nav.share) {
        try {
          await nav.share({ files: [file], title: 'Zém Tarif', text: texte, url: lien });
          return;
        } catch {
          // L'utilisateur a pu annuler : on propose le téléchargement.
        }
      }
      await telechargerBlob(fichier, 'zem-tarif.png');
      setMessage('Image téléchargée. Vous pouvez la publier en statut.');
      return;
    }
    if (uri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Publier le statut' });
      return;
    }
    await partagerWhatsApp();
  }

  async function copierLien() {
    await Clipboard.setStringAsync(lien);
    setMessage('Lien copié.');
    void toucherSucces();
  }

  async function plus() {
    const uri = await partagerImageNative();
    if (uri && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Partager le prix' });
      return;
    }
    if (Platform.OS === 'web') {
      const blob = await imageCarte();
      const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
      if (blob && nav.share) {
        const file = new File([blob], 'zem-tarif.png', { type: 'image/png' });
        try {
          await nav.share({ files: [file], title: 'Zém Tarif', text: texte, url: lien });
          return;
        } catch {
          /* annulé */
        }
      }
      if (blob) {
        await telechargerBlob(blob, 'zem-tarif.png');
        setMessage('Image téléchargée.');
        return;
      }
    }
    await Clipboard.setStringAsync(texte);
    setMessage('Le texte du prix a été copié.');
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <View ref={vueRef as never} collapsable={false}>
        <CartePartageVisuel
          prix={estimation.point}
          bas={estimation.bas}
          haut={estimation.haut}
          distanceM={distanceM}
          origin={origin.label}
          dest={dest.label}
        />
      </View>
      <View style={styles.actions}>
        <Action icone="message-circle" titre="WhatsApp" onPress={() => void partagerWhatsApp()} />
        <Action icone="sun" titre="Statut" onPress={() => void partagerStatut()} />
        <Action icone="copy" titre="Copier le lien" onPress={() => void copierLien()} />
        <Action icone="share-2" titre="Plus" onPress={() => void plus()} />
      </View>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable onPress={() => router.back()} style={styles.fermer}>
        <Text style={styles.fermerTexte}>Fermer</Text>
      </Pressable>
    </ScrollView>
  );
}

function Action({
  icone,
  titre,
  onPress,
}: {
  icone: NomIcone;
  titre: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}>
      <View style={styles.actionIcone}>
        <Icone nom={icone} taille={18} couleur={couleurs.encre} />
      </View>
      <Text style={styles.actionTitre}>{titre}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: 20, paddingBottom: 48, gap: 20 },
  vide: { flex: 1, backgroundColor: couleurs.fond, padding: 24, justifyContent: 'center' },
  videTexte: { fontFamily: typo.regular, fontSize: 16, color: couleurs.encreDouce, lineHeight: 24 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  action: { width: '47%', alignItems: 'center', gap: 8, paddingVertical: 12 },
  actionIcone: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: couleurs.orPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitre: { fontFamily: typo.medium, fontSize: 13, color: couleurs.encre },
  message: { fontFamily: typo.regular, fontSize: 14, color: couleurs.succes, textAlign: 'center' },
  fermer: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: rayon.md,
  },
  fermerTexte: { fontFamily: typo.semi, fontSize: 15, color: couleurs.encreDouce },
});
