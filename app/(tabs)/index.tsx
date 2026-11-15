import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { Bouton } from '@/components/Bouton';
import { CarteItineraire } from '@/components/CarteItineraire';
import { CartePrix } from '@/components/CartePrix';
import { ChampLieu } from '@/components/ChampLieu';
import { Conditions } from '@/components/Conditions';
import { DetailTarif } from '@/components/DetailTarif';
import { Icone } from '@/components/Icone';
import { JetonsReperes } from '@/components/JetonsReperes';
import { SqueletteCartePrix } from '@/components/Squelette';
import { telechargerSignalements } from '@/src/api/client';
import { poserBrouillon } from '@/src/contenu/brouillon';
import { toucherLeger, toucherSucces } from '@/src/contenu/haptique';
import { nouvelId } from '@/src/contenu/identifiants';
import type { Lieu } from '@/src/geo/lieux';
import { calculerItineraire, type Itineraire } from '@/src/geo/osrm';
import { dansLaZone } from '@/src/geo/zone';
import { heurePortoNovo } from '@/src/pricing/horaire';
import { estimer } from '@/src/pricing/melange';
import type { Estimation, Signalement } from '@/src/pricing/types';
import { ajouterHistorique } from '@/src/storage/historique';
import { lireSignalements } from '@/src/storage/signalements';
import { couleurs } from '@/src/theme/colors';
import { ombreCarte, ombreLegere, rayon } from '@/src/theme/espace';
import { typo } from '@/src/theme/typo';

export default function EcranEstimer() {
  const insets = useSafeAreaInsets();
  const [saisieDepart, setSaisieDepart] = useState('');
  const [saisieArrivee, setSaisieArrivee] = useState('');
  const [depart, setDepart] = useState<Lieu | null>(null);
  const [arrivee, setArrivee] = useState<Lieu | null>(null);
  const [heure, setHeure] = useState(heurePortoNovo);
  const [maintenant, setMaintenant] = useState(true);
  const [pluie, setPluie] = useState(false);
  const [itineraire, setItineraire] = useState<Itineraire | null>(null);
  const [chargementIti, setChargementIti] = useState(false);
  const [avis, setAvis] = useState<Signalement[]>([]);
  const [estimation, setEstimation] = useState<Estimation | null>(null);
  const [detailOuvert, setDetailOuvert] = useState(false);
  const [erreurGps, setErreurGps] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);

  useEffect(() => {
    let actif = true;
    Promise.all([lireSignalements(), telechargerSignalements()]).then(([locaux, distants]) => {
      if (!actif) return;
      const vus = new Set(locaux.map((s) => s.id));
      setAvis([...locaux, ...distants.filter((s) => !vus.has(s.id))]);
    });
    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    if (maintenant) setHeure(heurePortoNovo());
  }, [maintenant, depart, arrivee]);

  useEffect(() => {
    if (!depart || !arrivee) {
      setItineraire(null);
      setEstimation(null);
      setEnregistre(false);
      return;
    }
    const controleur = new AbortController();
    setChargementIti(true);
    calculerItineraire(depart.lat, depart.lon, arrivee.lat, arrivee.lon, controleur.signal)
      .then((iti) => {
        if (!controleur.signal.aborted) setItineraire(iti);
      })
      .finally(() => {
        if (!controleur.signal.aborted) setChargementIti(false);
      });
    return () => controleur.abort();
  }, [depart, arrivee]);

  useEffect(() => {
    if (!depart || !arrivee || !itineraire) {
      setEstimation(null);
      return;
    }
    setEstimation(
      estimer(
        {
          originLat: depart.lat,
          originLon: depart.lon,
          destLat: arrivee.lat,
          destLon: arrivee.lon,
          distanceM: itineraire.distanceM,
          conditions: { heure, pluie },
        },
        avis,
      ),
    );
    setEnregistre(false);
    void toucherLeger();
  }, [depart, arrivee, itineraire, heure, pluie, avis]);

  const horsZone =
    (depart && !dansLaZone(depart.lat, depart.lon)) ||
    (arrivee && !dansLaZone(arrivee.lat, arrivee.lon));
  const longTrajet = (itineraire?.distanceM ?? 0) > 20_000;

  async function utiliserPosition() {
    setErreurGps(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErreurGps('L’accès à la position a été refusé.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lieu: Lieu = {
        label: 'Ma position',
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        source: 'gps',
      };
      setDepart(lieu);
      setSaisieDepart(lieu.label);
      void toucherSucces();
    } catch {
      setErreurGps('Impossible de lire la position pour le moment.');
    }
  }

  async function garderEstimation() {
    if (!depart || !arrivee || !itineraire || !estimation) return;
    await ajouterHistorique({
      id: nouvelId(),
      origin: depart,
      dest: arrivee,
      distanceM: itineraire.distanceM,
      dureeS: itineraire.dureeS,
      point: estimation.point,
      bas: estimation.bas,
      haut: estimation.haut,
      nuit: estimation.nuit,
      pluie: estimation.pluie,
      sourceDistance: itineraire.source,
      sourcePrix: estimation.sourcePrix,
      enregistreLe: new Date().toISOString(),
    });
    setEnregistre(true);
    void toucherSucces();
  }

  function allerSignaler() {
    if (!depart || !arrivee || !itineraire || !estimation) return;
    poserBrouillon({
      origin: depart,
      dest: arrivee,
      distanceM: itineraire.distanceM,
      dureeS: itineraire.dureeS,
      heure,
      pluie,
      estimation,
    });
  }

  return (
    <View style={styles.page}>
      <CarteItineraire
        pleinEcran
        origin={depart ?? undefined}
        dest={arrivee ?? undefined}
        geometrie={itineraire?.geometrie}
        paddingBas={500}
      />

      <View style={[styles.haut, { top: Math.max(insets.top, 12) + 4 }]}>
        <View style={[styles.marque, ombreLegere]}>
          <Image
            source={require('../../assets/logo/marque-192.png')}
            style={styles.logo}
            accessibilityLabel="Zém Tarif"
          />
          <Text style={styles.marqueTexte}>Zém Tarif</Text>
        </View>
        <Pressable
          onPress={utiliserPosition}
          style={[styles.fab, ombreLegere]}
          accessibilityLabel="Utiliser ma position"
        >
          <Icone nom="navigation" taille={18} couleur={couleurs.encre} />
        </Pressable>
      </View>

      <View style={[styles.feuille, ombreCarte, { paddingBottom: 12 }]}>
        <View style={styles.poignee} />
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feuilleContenu}
        >
          <ChampLieu
            etiquette="Départ"
            icone="circle"
            valeur={depart}
            saisie={saisieDepart}
            onSaisie={(t) => {
              setSaisieDepart(t);
              setDepart(null);
            }}
            onChoix={(lieu) => {
              setDepart(lieu);
              setSaisieDepart(lieu.label);
            }}
            onEffacer={() => {
              setDepart(null);
              setSaisieDepart('');
            }}
          />
          <View style={styles.separateur} />
          <ChampLieu
            etiquette="Arrivée"
            icone="map-pin"
            valeur={arrivee}
            saisie={saisieArrivee}
            onSaisie={(t) => {
              setSaisieArrivee(t);
              setArrivee(null);
            }}
            onChoix={(lieu) => {
              setArrivee(lieu);
              setSaisieArrivee(lieu.label);
            }}
            onEffacer={() => {
              setArrivee(null);
              setSaisieArrivee('');
            }}
          />

          {erreurGps ? <Text style={styles.alerte}>{erreurGps}</Text> : null}

          {!(depart && arrivee) ? (
            <View style={{ marginTop: 8 }}>
              <JetonsReperes
                depart={depart}
                onChoix={(lieu, role) => {
                  if (role === 'depart') {
                    setDepart(lieu);
                    setSaisieDepart(lieu.label);
                  } else {
                    setArrivee(lieu);
                    setSaisieArrivee(lieu.label);
                  }
                }}
              />
            </View>
          ) : null}

          <Conditions
            heure={heure}
            maintenant={maintenant}
            pluie={pluie}
            onHeure={(h, maintenantChoisi) => {
              setHeure(maintenantChoisi ? heurePortoNovo() : h);
              setMaintenant(maintenantChoisi);
            }}
            onPluie={setPluie}
          />

          {horsZone ? (
            <Text style={styles.alerte}>
              Un des deux points sort du Grand Nokoué. Le barème a été calé pour Cotonou, Abomey-Calavi et Porto-Novo.
            </Text>
          ) : null}

          {chargementIti ? <SqueletteCartePrix /> : null}

          {estimation && itineraire && !chargementIti ? (
            <View>
              <CartePrix
                estimation={estimation}
                dureeS={itineraire.dureeS}
                sourceDistance={itineraire.source}
              />
              {longTrajet ? (
                <Text style={styles.note}>
                  Au-delà d’une vingtaine de kilomètres, un taxi collectif est souvent plus économique. Cotonou–Porto-Novo se situe autour de 1 500 F en taxi partagé, selon Parlons Fongbé.
                </Text>
              ) : null}
              <Pressable onPress={() => setDetailOuvert((v) => !v)} style={styles.lienDetail}>
                <Text style={styles.lien}>
                  {detailOuvert ? 'Masquer le détail' : 'Voir le détail du calcul'}
                </Text>
              </Pressable>
              {detailOuvert ? <DetailTarif estimation={estimation} /> : null}
              <View style={styles.boutons}>
                <Bouton
                  titre={enregistre ? 'Enregistrée' : 'Garder'}
                  variante="contour"
                  disabled={enregistre}
                  onPress={garderEstimation}
                />
                <View style={{ flex: 1 }}>
                  <Link href="/signaler" asChild onPress={allerSignaler}>
                    <Bouton titre="Signaler le prix payé" />
                  </Link>
                </View>
              </View>
            </View>
          ) : !chargementIti ? (
            <View style={styles.vide}>
              <View style={styles.videIcone}>
                <Icone nom="navigation" taille={20} couleur={couleurs.orFonce} />
              </View>
              <Text style={styles.invite}>
                Indiquez un départ et une arrivée pour voir une fourchette en francs CFA.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.carteFond },
  haut: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  marque: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: couleurs.surface,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: rayon.full,
  },
  logo: { width: 28, height: 28, borderRadius: 8 },
  marqueTexte: { fontFamily: typo.semi, fontSize: 15, color: couleurs.encre },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: couleurs.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feuille: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    maxHeight: '62%',
    backgroundColor: couleurs.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  poignee: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: couleurs.ligne,
    marginTop: 10,
    marginBottom: 6,
  },
  feuilleContenu: { paddingHorizontal: 20, paddingBottom: 20 },
  separateur: {
    height: 1,
    backgroundColor: couleurs.ligne,
    marginLeft: 40,
  },
  alerte: {
    fontFamily: typo.regular,
    fontSize: 13,
    color: couleurs.alerte,
    marginTop: 8,
    lineHeight: 18,
  },
  note: {
    fontFamily: typo.regular,
    fontSize: 13,
    color: couleurs.encreDouce,
    marginTop: 10,
    lineHeight: 19,
  },
  lienDetail: { alignSelf: 'center', marginTop: 12 },
  lien: {
    fontFamily: typo.semi,
    fontSize: 13,
    color: couleurs.orFonce,
  },
  boutons: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'stretch' },
  vide: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  videIcone: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: couleurs.orPale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invite: {
    fontFamily: typo.regular,
    fontSize: 14,
    color: couleurs.muet,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
});
