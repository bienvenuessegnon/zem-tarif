import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { CarteItineraire } from '@/components/CarteItineraire';
import { Icone } from '@/components/Icone';
import { lireTrajetPartage, type TrajetPartagePublic } from '@/src/api/client';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

export default function EcranSuiviPublic() {
  const params = useLocalSearchParams<{ jeton?: string }>();
  const jeton = typeof params.jeton === 'string' ? params.jeton : '';
  const [trajet, setTrajet] = useState<TrajetPartagePublic | null | undefined>(undefined);
  const [heure, setHeure] = useState<Date | null>(null);

  useEffect(() => {
    if (!jeton) {
      setTrajet(null);
      return;
    }
    let actif = true;
    async function charger() {
      const data = await lireTrajetPartage(jeton);
      if (!actif) return;
      setTrajet(data);
      if (data) setHeure(new Date());
    }
    void charger();
    const id = setInterval(() => void charger(), 8_000);
    return () => {
      actif = false;
      clearInterval(id);
    };
  }, [jeton]);

  if (!jeton || trajet === null) {
    return (
      <View style={styles.vide}>
        <Icone nom="map-pin" taille={22} couleur={couleurs.orFonce} />
        <Text style={styles.titre}>Lien expiré ou introuvable</Text>
        <Text style={styles.texte}>
          Le suivi d’un trajet s’arrête à la fin de la course, ou au plus tard au bout de six heures.
          Aucun compte n’est demandé, et la position n’est plus visible ensuite.
        </Text>
      </View>
    );
  }

  if (trajet === undefined) {
    return (
      <View style={styles.vide}>
        <Text style={styles.texte}>Chargement de la position…</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <CarteItineraire
        pleinEcran
        origin={{ lat: trajet.lat, lon: trajet.lon, label: trajet.originLabel || 'Position' }}
        paddingBas={160}
      />
      <View style={styles.carte}>
        <Text style={styles.chapo}>Trajet en cours</Text>
        <Text style={styles.titre}>
          {trajet.originLabel || 'Départ'}
          {trajet.destLabel ? ` → ${trajet.destLabel}` : ''}
        </Text>
        <Text style={styles.texte}>
          Dernière position reçue
          {heure
            ? ` à ${heure.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Porto-Novo' })}`
            : ''}
          . Ce lien expire automatiquement.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.carteFond },
  vide: { flex: 1, backgroundColor: couleurs.fond, padding: 28, justifyContent: 'center', gap: 12 },
  carte: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: couleurs.surface,
    borderRadius: 20,
    padding: 18,
  },
  chapo: {
    fontFamily: typo.medium,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: couleurs.muet,
    marginBottom: 6,
  },
  titre: { fontFamily: typo.semi, fontSize: 20, color: couleurs.encre, lineHeight: 26 },
  texte: { fontFamily: typo.regular, fontSize: 14, color: couleurs.encreDouce, lineHeight: 20, marginTop: 8 },
});
