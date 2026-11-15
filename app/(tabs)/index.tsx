import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { Bouton } from '@/components/Bouton';
import { FeuilleBas, type CommandeFeuille } from '@/components/FeuilleBas';
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
import { formatFcfa } from '@/src/pricing/format';
import type { Estimation, Signalement } from '@/src/pricing/types';
import { ajouterHistorique } from '@/src/storage/historique';
import { basculerFavori, lireFavoris, type Favori } from '@/src/storage/favoris';
import { lireSignalements } from '@/src/storage/signalements';
import { couleurs } from '@/src/theme/colors';
import { ombreLegere, rayon } from '@/src/theme/espace';
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
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [estFavoriActif, setEstFavoriActif] = useState(false);
  const [paddingBas, setPaddingBas] = useState(200);
  const feuilleRef = useRef<CommandeFeuille>(null);

  useEffect(() => {
    let actif = true;
    Promise.all([lireSignalements(), telechargerSignalements(), lireFavoris()]).then(([locaux, distants, fav]) => {
      if (!actif) return;
      const vus = new Set(locaux.map((s) => s.id));
      setAvis([...locaux, ...distants.filter((s) => !vus.has(s.id))]);
      setFavoris(fav);
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

  useEffect(() => {
    if (!depart || !arrivee) {
      setEstFavoriActif(false);
      return;
    }
    setEstFavoriActif(
      favoris.some((f) => f.origin.label === depart.label && f.dest.label === arrivee.label),
    );
  }, [depart, arrivee, favoris]);

  const aUnResultat = Boolean(estimation && itineraire && !chargementIti);
  const avaitResultat = useRef(false);
  useEffect(() => {
    if (aUnResultat && !avaitResultat.current) {
      feuilleRef.current?.allerAAuMoins(1);
    }
    avaitResultat.current = aUnResultat;
  }, [aUnResultat]);

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
        paddingBas={paddingBas}
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

      <FeuilleBas
        ref={feuilleRef}
        onHauteurStabilisee={setPaddingBas}
        entete={
          estimation && depart && arrivee ? (
            <View>
              <Text style={styles.resumeTrajet} numberOfLines={1}>
                {depart.label} → {arrivee.label}
              </Text>
              <Text style={styles.resumePrix}>{formatFcfa(estimation.point)}</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.resumeLigne} numberOfLines={1}>
                Départ · {depart?.label ?? 'À préciser'}
              </Text>
              <Text style={styles.resumeLigne} numberOfLines={1}>
                Arrivée · {arrivee?.label ?? 'À préciser'}
              </Text>
            </View>
          )
        }
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
            onFocusChamp={() => feuilleRef.current?.allerA(2)}
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
            onFocusChamp={() => feuilleRef.current?.allerA(2)}
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

          {favoris.length > 0 ? (
            <View style={{ marginTop: 8, marginBottom: 4 }}>
              {favoris.slice(0, 6).map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => {
                    setDepart(f.origin);
                    setSaisieDepart(f.origin.label);
                    setArrivee(f.dest);
                    setSaisieArrivee(f.dest.label);
                    void toucherLeger();
                  }}
                  style={({ pressed }) => [styles.favJeton, pressed && { opacity: 0.8 }]}
                >
                  <Icone nom="star" taille={12} couleur={couleurs.orFonce} />
                  <Text style={styles.favJetonTexte} numberOfLines={1}>
                    {f.origin.label} → {f.dest.label}
                  </Text>
                </Pressable>
              ))}
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
                <Pressable
                  onPress={async () => {
                    if (!depart || !arrivee) return;
                    const liste = await basculerFavori(depart, arrivee);
                    setFavoris(liste);
                    void toucherLeger();
                  }}
                  style={[styles.etoile, estFavoriActif && styles.etoileActive]}
                  accessibilityLabel={estFavoriActif ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Icone nom="star" taille={20} couleur={estFavoriActif ? couleurs.orFonce : couleurs.encre} />
                </Pressable>
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
      </FeuilleBas>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.carteFond },
  haut: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 4,
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
  etoile: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: couleurs.encre,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.surface,
  },
  etoileActive: { backgroundColor: couleurs.orPale, borderColor: couleurs.or },
  favJeton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: couleurs.or,
    backgroundColor: couleurs.orPale,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 6,
  },
  favJetonTexte: { fontFamily: typo.medium, fontSize: 13, color: couleurs.encre, maxWidth: 280 },
  resumeTrajet: {
    fontFamily: typo.medium,
    fontSize: 14,
    color: couleurs.encreDouce,
  },
  resumePrix: {
    fontFamily: typo.bold,
    fontSize: 28,
    color: couleurs.encre,
    marginTop: 2,
  },
  resumeLigne: {
    fontFamily: typo.medium,
    fontSize: 16,
    color: couleurs.encre,
    marginBottom: 4,
  },
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
