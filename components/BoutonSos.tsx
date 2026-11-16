import { useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import * as Linking from 'expo-linking';

import { Icone } from '@/components/Icone';
import { toucherSucces } from '@/src/contenu/haptique';
import { utiliserReseau } from '@/src/reseau/etat';
import { contactsValides, DUREE_APPUIO_SOS_MS, texteSos, urlAppel, urlSms } from '@/src/securite/sos';
import { lienSuivi } from '@/src/securite/trajet-partage';
import { lireContactsUrgence } from '@/src/storage/contacts-urgence';
import { lireDernierePosition } from '@/src/storage/derniere-position';
import { lireTrajetActif } from '@/src/storage/trajet-partage-local';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

export function BoutonSos({ compact = false }: { compact?: boolean }) {
  const enLigne = utiliserReseau();
  const [message, setMessage] = useState<string | null>(null);
  const [appui, setAppui] = useState(false);
  const prog = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function annuler() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setAppui(false);
    Animated.timing(prog, { toValue: 0, duration: 120, useNativeDriver: false }).start();
  }

  function demarrer() {
    setMessage(null);
    setAppui(true);
    prog.setValue(0);
    Animated.timing(prog, {
      toValue: 1,
      duration: DUREE_APPUIO_SOS_MS,
      useNativeDriver: false,
    }).start();
    timer.current = setTimeout(() => {
      void declencher();
    }, DUREE_APPUIO_SOS_MS);
  }

  async function declencher() {
    setAppui(false);
    const contacts = contactsValides(await lireContactsUrgence());
    if (contacts.length === 0) {
      setMessage('Ajoutez un contact d’urgence dans le profil.');
      return;
    }
    const pos = await lireDernierePosition();
    if (!pos) {
      setMessage('Aucune position connue pour le moment.');
      return;
    }
    const actif = await lireTrajetActif();
    const corps = texteSos({
      lat: pos.lat,
      lon: pos.lon,
      lienSuivi: actif ? lienSuivi(actif.jeton) : null,
      horsLigne: !enLigne,
    });
    void toucherSucces();
    const premier = contacts[0];
    await Linking.openURL(urlSms(premier.telephone, corps));
    for (const c of contacts.slice(1)) {
      await Linking.openURL(urlSms(c.telephone, corps)).catch(() => undefined);
    }
    await Linking.openURL(urlAppel(premier.telephone)).catch(() => undefined);
  }

  const largeur = prog.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <>
      <Pressable
        onPressIn={demarrer}
        onPressOut={annuler}
        style={[styles.bouton, compact && styles.compact]}
        accessibilityLabel="SOS, maintenez trois secondes"
        accessibilityHint="Envoie un SMS et lance un appel vers vos contacts d’urgence"
      >
        <Animated.View style={[styles.jauge, { width: largeur }]} />
        <Icone nom="alert-triangle" taille={16} couleur="#FFFFFF" />
        {compact ? null : <Text style={styles.texte}>{appui ? 'Encore…' : 'SOS'}</Text>}
      </Pressable>
      {message ? <Text style={styles.msg}>{message}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: couleurs.alerte,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  compact: { paddingHorizontal: 10, paddingVertical: 10, width: 44, height: 44, justifyContent: 'center' },
  jauge: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  texte: { fontFamily: typo.semi, fontSize: 12, color: '#FFFFFF', letterSpacing: 0.6 },
  msg: { fontFamily: typo.regular, fontSize: 12, color: couleurs.alerte, marginTop: 6 },
});
