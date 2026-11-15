import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

import { Bouton } from '@/components/Bouton';
import { CarteItineraire } from '@/components/CarteItineraire';
import { CartePrix } from '@/components/CartePrix';
import { ChampLieu } from '@/components/ChampLieu';
import { Conditions } from '@/components/Conditions';
import { DetailTarif } from '@/components/DetailTarif';
import { JetonsReperes } from '@/components/JetonsReperes';
import { poserBrouillon } from '@/src/contenu/brouillon';
import { nouvelId } from '@/src/contenu/identifiants';
import { calculerItineraire, type Itineraire } from '@/src/geo/osrm';
import { dansLaZone } from '@/src/geo/zone';
import type { Lieu } from '@/src/geo/lieux';
import { heurePortoNovo } from '@/src/pricing/horaire';
import { estimer } from '@/src/pricing/melange';
import type { Estimation, Signalement } from '@/src/pricing/types';
import { telechargerSignalements } from '@/src/api/client';
import { ajouterHistorique } from '@/src/storage/historique';
import { lireSignalements } from '@/src/storage/signalements';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

export default function EcranEstimer() {
  const router = useRouter();
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
    Promise.all([lireSignalements(), telechargerSignalements()]).then(
      ([locaux, distants]) => {
        if (!actif) return;
        const vus = new Set(locaux.map((s) => s.id));
        setAvis([...locaux, ...distants.filter((s) => !vus.has(s.id))]);
      },
    );
    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    if (maintenant) {
      setHeure(heurePortoNovo());
    }
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
        if (!controleur.signal.aborted) {
          setItineraire(iti);
        }
      })
      .finally(() => {
        if (!controleur.signal.aborted) {
          setChargementIti(false);
        }
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
    router.push('/signaler');
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.contenu}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.chapeau}>
        Indiquez un départ et une arrivée dans le Grand Nokoué. L’application
        propose une fourchette, pas un prix imposé : le zém se négocie encore
        à la main.
      </Text>

      <ChampLieu
        etiquette="Départ"
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
      <ChampLieu
        etiquette="Arrivée"
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

      <View style={styles.actionsLieu}>
        <Pressable onPress={utiliserPosition}>
          <Text style={styles.lien}>Utiliser ma position</Text>
        </Pressable>
        <Text style={styles.aideJetons}>
          ou un repère, comme départ puis arrivée
        </Text>
      </View>
      {erreurGps ? <Text style={styles.alerte}>{erreurGps}</Text> : null}

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

      <View style={styles.carte}>
        <CarteItineraire
          origin={depart ?? undefined}
          dest={arrivee ?? undefined}
          geometrie={itineraire?.geometrie}
        />
      </View>
      {chargementIti ? (
        <Text style={styles.muet}>Calcul de l’itinéraire…</Text>
      ) : null}
      {horsZone ? (
        <Text style={styles.alerte}>
          Un des deux points sort du Grand Nokoué (Cotonou, Abomey-Calavi,
          Porto-Novo et alentours). Le barème a été calé pour cette zone.
        </Text>
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

      {estimation && itineraire ? (
        <View>
          <CartePrix
            estimation={estimation}
            dureeS={itineraire.dureeS}
            sourceDistance={itineraire.source}
          />
          {longTrajet ? (
            <Text style={styles.note}>
              Au-delà d’une vingtaine de kilomètres, un taxi collectif est
              souvent plus économique qu’un zém. Cotonou–Porto-Novo, par
              exemple, se situe autour de 1 500 F en taxi partagé selon
              Parlons Fongbé.
            </Text>
          ) : null}
          <Pressable onPress={() => setDetailOuvert((v) => !v)}>
            <Text style={styles.lienCentre}>
              {detailOuvert ? 'Masquer le détail du calcul' : 'Voir le détail du calcul'}
            </Text>
          </Pressable>
          {detailOuvert ? <DetailTarif estimation={estimation} /> : null}
          <View style={styles.boutons}>
            <Bouton
              titre={enregistre ? 'Enregistrée dans l’historique' : 'Garder cette estimation'}
              variante="contour"
              disabled={enregistre}
              onPress={garderEstimation}
            />
            <Bouton titre="Signaler le prix payé" onPress={allerSignaler} />
          </View>
        </View>
      ) : (
        <Text style={styles.invite}>
          Choisissez un départ et une arrivée pour voir une fourchette en francs CFA.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.papier },
  contenu: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  chapeau: {
    fontFamily: typo.sans,
    fontSize: 15,
    lineHeight: 22,
    color: couleurs.secondaire,
    marginBottom: 20,
  },
  actionsLieu: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  lien: {
    fontFamily: typo.sansMoyen,
    fontSize: 14,
    color: couleurs.orFonce,
    textDecorationLine: 'underline',
  },
  lienCentre: {
    fontFamily: typo.sansMoyen,
    fontSize: 14,
    color: couleurs.orFonce,
    textAlign: 'center',
    marginTop: 14,
    textDecorationLine: 'underline',
  },
  aideJetons: { fontFamily: typo.sans, fontSize: 13, color: couleurs.muet },
  carte: { marginTop: 12 },
  muet: {
    fontFamily: typo.sans,
    fontSize: 13,
    color: couleurs.muet,
    marginTop: 8,
  },
  alerte: {
    fontFamily: typo.sans,
    fontSize: 13,
    color: couleurs.alerte,
    marginTop: 10,
    lineHeight: 18,
  },
  note: {
    fontFamily: typo.sans,
    fontSize: 13,
    color: couleurs.secondaire,
    marginTop: 12,
    lineHeight: 19,
  },
  boutons: { marginTop: 18, gap: 10 },
  invite: {
    fontFamily: typo.sans,
    fontSize: 15,
    color: couleurs.secondaire,
    marginTop: 28,
    lineHeight: 22,
  },
});
