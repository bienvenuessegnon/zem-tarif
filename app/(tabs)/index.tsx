import { useCallback, useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { BadgeHorsLigne } from '@/components/BadgeHorsLigne';
import { Bouton } from '@/components/Bouton';
import { BoutonSos } from '@/components/BoutonSos';
import { JetonsBagage } from '@/components/JetonsBagage';
import { FeuilleBas, type CommandeFeuille } from '@/components/FeuilleBas';
import { CarteItineraire } from '@/components/CarteItineraire';
import { Icone } from '@/components/Icone';
import {
  ouvrirTrajetPartage,
  telechargerSignalements,
  telechargerStatsTrajet,
  terminerTrajetPartage,
  type TrajetCommunaute,
} from '@/src/api/client';
import { poserBrouillon } from '@/src/contenu/brouillon';
import { useProfil } from '@/src/contenu/contexte-profil';
import { toucherLeger, toucherSucces } from '@/src/contenu/haptique';
import { nouvelId } from '@/src/contenu/identifiants';
import { salutation } from '@/src/contenu/salutation';
import { onSelectionLieu, prendreTrajetInitial } from '@/src/contenu/selection-lieu';
import type { Lieu } from '@/src/geo/lieux';
import { NOMBRE_REPERES, reperParId, reperVersLieu } from '@/src/geo/reperes';
import { calculerItineraire, type Itineraire } from '@/src/geo/osrm';
import { dansLaZone } from '@/src/geo/zone';
import { LIBELLES_BAGAGE, type NiveauBagage } from '@/src/pricing/constantes';
import { formatDuree, formatFcfa, formatKm } from '@/src/pricing/format';
import { heurePortoNovo } from '@/src/pricing/horaire';
import { estimer } from '@/src/pricing/melange';
import type { Estimation, Signalement } from '@/src/pricing/types';
import { utiliserReseau } from '@/src/reseau/etat';
import { lienSuivi } from '@/src/securite/trajet-partage';
import { demarrerSuiviPosition } from '@/src/securite/suivre-position';
import { ajouterDepense } from '@/src/storage/budget';
import { memoriserPosition } from '@/src/storage/derniere-position';
import { lireHabituels, type TrajetHabituel } from '@/src/storage/habituels';
import {
  lireTrajetActif,
  poserTrajetActif,
  viderTrajetActif,
  type TrajetPartageLocal,
} from '@/src/storage/trajet-partage-local';
import { ajouterHistorique, lireHistorique, type EntreeHistorique } from '@/src/storage/historique';
import { basculerFavori, lireFavoris, type Favori } from '@/src/storage/favoris';
import { lireLieuxRecents } from '@/src/storage/lieux-recents';
import { lireSignalements } from '@/src/storage/signalements';
import { couleurs } from '@/src/theme/colors';
import { ombreLegere, rayon } from '@/src/theme/espace';
import { typo } from '@/src/theme/typo';

const JETONS = [
  { id: 'dantokpa', nom: 'Dantokpa' },
  { id: 'saint-michel', nom: 'Saint-Michel' },
  { id: 'uac', nom: 'UAC' },
] as const;

export default function EcranAccueil() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profil } = useProfil();
  const enLigne = utiliserReseau();
  const [depart, setDepart] = useState<Lieu | null>(null);
  const [arrivee, setArrivee] = useState<Lieu | null>(null);
  const [heure, setHeure] = useState(heurePortoNovo);
  const [pluie, setPluie] = useState(false);
  const [itineraire, setItineraire] = useState<Itineraire | null>(null);
  const [chargementIti, setChargementIti] = useState(false);
  const [avis, setAvis] = useState<Signalement[]>([]);
  const [estimation, setEstimation] = useState<Estimation | null>(null);
  const [erreurGps, setErreurGps] = useState<string | null>(null);
  const [favoris, setFavoris] = useState<Favori[]>([]);
  const [estFavoriActif, setEstFavoriActif] = useState(false);
  const [recentsLieux, setRecentsLieux] = useState<Lieu[]>([]);
  const [historique, setHistorique] = useState<EntreeHistorique[]>([]);
  const [habituels, setHabituels] = useState<TrajetHabituel[]>([]);
  const [bagage, setBagage] = useState<NiveauBagage>('aucun');
  const [invitationBudget, setInvitationBudget] = useState(false);
  const [budgetNote, setBudgetNote] = useState(false);
  const [trajetActif, setTrajetActif] = useState<TrajetPartageLocal | null>(null);
  const [messagePartage, setMessagePartage] = useState<string | null>(null);
  const [statsTrajet, setStatsTrajet] = useState<TrajetCommunaute | null>(null);
  const [paddingBas, setPaddingBas] = useState(200);
  const feuilleRef = useRef<CommandeFeuille>(null);

  useEffect(() => {
    const init = prendreTrajetInitial();
    if (init) {
      setDepart(init.origin);
      setArrivee(init.dest);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const init = prendreTrajetInitial();
      if (init) {
        setDepart(init.origin);
        setArrivee(init.dest);
        feuilleRef.current?.allerAAuMoins(1);
      }
      void lireHabituels().then(setHabituels);
      void lireTrajetActif().then(setTrajetActif);
    }, []),
  );

  useEffect(() => {
    if (!trajetActif) return;
    return demarrerSuiviPosition(trajetActif.jeton);
  }, [trajetActif]);

  useEffect(() => {
    return onSelectionLieu((lieu, cible) => {
      if (cible === 'depart') setDepart(lieu);
      else setArrivee(lieu);
      feuilleRef.current?.allerAAuMoins(1);
    });
  }, []);

  useEffect(() => {
    let actif = true;
    Promise.all([
      lireSignalements(),
      telechargerSignalements(),
      lireFavoris(),
      lireLieuxRecents(),
      lireHistorique(),
    ]).then(([locaux, distants, fav, recents, hist]) => {
      if (!actif) return;
      const vus = new Set(locaux.map((s) => s.id));
      setAvis([...locaux, ...distants.filter((s) => !vus.has(s.id))]);
      setFavoris(fav);
      setRecentsLieux(recents);
      setHistorique(hist);
    });
    return () => {
      actif = false;
    };
  }, []);

  useEffect(() => {
    setHeure(heurePortoNovo());
  }, [depart, arrivee]);

  useEffect(() => {
    if (!depart || !arrivee) {
      setItineraire(null);
      setEstimation(null);
      setStatsTrajet(null);
      return;
    }
    const controleur = new AbortController();
    setChargementIti(true);
    calculerItineraire(
      depart.lat,
      depart.lon,
      arrivee.lat,
      arrivee.lon,
      controleur.signal,
      !enLigne,
    )
      .then((iti) => {
        if (!controleur.signal.aborted) setItineraire(iti);
      })
      .finally(() => {
        if (!controleur.signal.aborted) setChargementIti(false);
      });
    return () => controleur.abort();
  }, [depart, arrivee, enLigne]);

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
          conditions: { heure, pluie, bagage },
        },
        avis,
      ),
    );
    void toucherLeger();
  }, [depart, arrivee, itineraire, heure, pluie, bagage, avis]);

  useEffect(() => {
    if (!depart || !arrivee || !enLigne) {
      setStatsTrajet(null);
      return;
    }
    let actif = true;
    telechargerStatsTrajet(depart.label, arrivee.label).then((s) => {
      if (actif) setStatsTrajet(s);
    });
    return () => {
      actif = false;
    };
  }, [depart, arrivee, enLigne]);

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
      setInvitationBudget(true);
      setBudgetNote(false);
      setMessagePartage(null);
    }
    if (!aUnResultat) setInvitationBudget(false);
    avaitResultat.current = aUnResultat;
  }, [aUnResultat]);

  const horsZone =
    (depart && !dansLaZone(depart.lat, depart.lon)) ||
    (arrivee && !dansLaZone(arrivee.lat, arrivee.lon));

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
      void memoriserPosition(lieu.lat, lieu.lon);
      void toucherSucces();
    } catch {
      setErreurGps('Impossible de lire la position pour le moment.');
    }
  }

  function preparerBrouillon() {
    if (!depart || !arrivee || !itineraire || !estimation) return;
    poserBrouillon({
      origin: depart,
      dest: arrivee,
      distanceM: itineraire.distanceM,
      dureeS: itineraire.dureeS,
      heure,
      pluie,
      bagage,
      estimation,
    });
  }

  async function garderEtSignaler() {
    if (!depart || !arrivee || !itineraire || !estimation) return;
    preparerBrouillon();
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
    router.push('/signaler');
  }

  async function partagerMonTrajet() {
    if (!depart || !arrivee) return;
    setMessagePartage(null);
    let lat = depart.lat;
    let lon = depart.lon;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        await memoriserPosition(lat, lon);
      }
    } catch {
      // On part de la position de départ déjà connue.
    }
    const cree = await ouvrirTrajetPartage({
      originLabel: depart.label,
      destLabel: arrivee.label,
      lat,
      lon,
    });
    if (!cree) {
      setMessagePartage('Le suivi en direct nécessite une connexion. Réessayez une fois en ligne.');
      return;
    }
    const local: TrajetPartageLocal = {
      jeton: cree.jeton,
      expireLe: cree.expireLe,
      originLabel: depart.label,
      destLabel: arrivee.label,
    };
    await poserTrajetActif(local);
    setTrajetActif(local);
    const url = cree.url || lienSuivi(cree.jeton);
    const message = `Je partage mon trajet en zém : ${url} (lien valable 6 h, ou jusqu’à la fin de la course).`;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: 'Suivi de mon trajet', text: message, url });
      } else {
        await Share.share({ message, url, title: 'Suivi de mon trajet' });
      }
    } catch {
      setMessagePartage(url);
      return;
    }
    setMessagePartage('Lien de suivi envoyé. Il expire à la fin du trajet, ou au plus tard dans six heures.');
    void toucherSucces();
  }

  async function terminerMonTrajet() {
    if (!trajetActif) return;
    await terminerTrajetPartage(trajetActif.jeton);
    await viderTrajetActif();
    setTrajetActif(null);
    setMessagePartage('Le suivi est terminé. Le lien n’est plus visible.');
  }

  function libelleConditions(): string {
    const moment = estimation?.nuit ? 'Nuit' : 'Jour';
    const pieces = [moment];
    if (pluie) pieces.push('pluie');
    else if (estimation?.nuit) pieces.push('tarif majoré');
    if (bagage !== 'aucun') pieces.push(LIBELLES_BAGAGE[bagage]);
    return pieces.join(' · ');
  }

  function choisirJeton(id: string) {
    const reper = reperParId(id);
    if (!reper) return;
    setArrivee(reperVersLieu(reper));
    void toucherLeger();
  }

  const heureActuelle = heurePortoNovo();

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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 }}>
          <View style={[styles.marque, ombreLegere]}>
            <Image
              source={require('../../assets/logo/marque-192.png')}
              style={styles.logo}
              accessibilityLabel="Zém Tarif"
            />
            <Text style={styles.marqueTexte}>Zém Tarif</Text>
          </View>
          <BadgeHorsLigne visible={!enLigne} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BoutonSos compact />
          <Pressable
            onPress={() => void utiliserPosition()}
            style={[styles.fab, ombreLegere]}
            accessibilityLabel="Utiliser ma position"
          >
            <Icone nom="navigation" taille={18} couleur={couleurs.encre} />
          </Pressable>
        </View>
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
              <Text style={styles.bonjour}>{salutation(heureActuelle, profil.pseudo)}</Text>
              <Text style={styles.question}>Où allez-vous ?</Text>
            </View>
          )
        }
      >
        {aUnResultat && depart && arrivee && estimation && itineraire ? (
          <VueReference
            depart={depart}
            arrivee={arrivee}
            estimation={estimation}
            itineraire={itineraire}
            conditions={libelleConditions()}
            estFavori={estFavoriActif}
            stats={statsTrajet}
            horsZone={Boolean(horsZone)}
            sourceDistance={itineraire.source}
            onRetour={() => setArrivee(null)}
            onFavori={async () => {
              const liste = await basculerFavori(depart, arrivee);
              setFavoris(liste);
              void toucherLeger();
            }}
            onPartager={() => {
              preparerBrouillon();
              router.push('/partage');
            }}
            onMontrer={() => {
              preparerBrouillon();
              router.push('/montrer');
            }}
            onSignaler={() => void garderEtSignaler()}
            onPluie={() => setPluie((v) => !v)}
            pluie={pluie}
            bagage={bagage}
            onBagage={setBagage}
            invitationBudget={invitationBudget && !budgetNote}
            onNoterBudget={async () => {
              await ajouterDepense({
                prixFcfa: estimation.point,
                de: depart.label,
                vers: arrivee.label,
                source: 'saisie',
              });
              setBudgetNote(true);
              setInvitationBudget(false);
              void toucherSucces();
            }}
            onIgnorerBudget={() => setInvitationBudget(false)}
            onHabituel={() => {
              preparerBrouillon();
              router.push('/habituel');
            }}
            trajetActif={trajetActif}
            messagePartage={messagePartage}
            onPartagerTrajet={() => void partagerMonTrajet()}
            onTerminerTrajet={() => void terminerMonTrajet()}
          />
        ) : (
          <VueAccueil
            depart={depart}
            erreurGps={erreurGps}
            chargement={chargementIti}
            favoris={favoris}
            recentsLieux={recentsLieux}
            historique={historique}
            habituels={habituels}
            onHabituel={(h) => {
              setDepart(h.origin);
              setArrivee(h.dest);
              void toucherLeger();
            }}
            onGererHabituels={() => router.push('/habituel')}
            onChercherDepart={() => router.push({ pathname: '/recherche', params: { cible: 'depart' } })}
            onChercherArrivee={() => router.push({ pathname: '/recherche', params: { cible: 'arrivee' } })}
            onPosition={() => void utiliserPosition()}
            onJeton={choisirJeton}
            onFavori={(f) => {
              setDepart(f.origin);
              setArrivee(f.dest);
              void toucherLeger();
            }}
            onRecent={(e) => {
              setDepart(e.origin);
              setArrivee(e.dest);
              void toucherLeger();
            }}
            onLieuRecent={(l) => {
              setArrivee(l);
              void toucherLeger();
            }}
          />
        )}
      </FeuilleBas>
    </View>
  );
}

function VueAccueil({
  depart,
  erreurGps,
  chargement,
  favoris,
  recentsLieux,
  historique,
  habituels,
  onHabituel,
  onGererHabituels,
  onChercherDepart,
  onChercherArrivee,
  onPosition,
  onJeton,
  onFavori,
  onRecent,
  onLieuRecent,
}: {
  depart: Lieu | null;
  erreurGps: string | null;
  chargement: boolean;
  favoris: Favori[];
  recentsLieux: Lieu[];
  historique: EntreeHistorique[];
  habituels: TrajetHabituel[];
  onHabituel: (h: TrajetHabituel) => void;
  onGererHabituels: () => void;
  onChercherDepart: () => void;
  onChercherArrivee: () => void;
  onPosition: () => void;
  onJeton: (id: string) => void;
  onFavori: (f: Favori) => void;
  onRecent: (e: EntreeHistorique) => void;
  onLieuRecent: (l: Lieu) => void;
}) {
  return (
    <View>
      <Pressable
        onPress={onChercherArrivee}
        style={styles.champRecherche}
        accessibilityLabel="Où allez-vous ?"
      >
        <Icone nom="search" taille={18} couleur={couleurs.muet} />
        <Text style={styles.champRechercheTexte}>Rechercher un repère</Text>
      </Pressable>

      <Pressable onPress={onChercherDepart} style={styles.departLigne}>
        <Icone nom="navigation" taille={14} couleur={couleurs.orFonce} />
        <Text style={styles.departTexte} numberOfLines={1}>
          Départ : {depart ? depart.label : 'Ma position'}
          {!depart ? ' · à préciser' : ''}
        </Text>
      </Pressable>
      {!depart ? (
        <Pressable onPress={onPosition}>
          <Text style={styles.lienPosition}>Utiliser ma position</Text>
        </Pressable>
      ) : null}
      {erreurGps ? <Text style={styles.alerte}>{erreurGps}</Text> : null}

      <View style={styles.jetons}>
        {JETONS.map((j) => (
          <Pressable key={j.id} onPress={() => onJeton(j.id)} style={styles.jeton}>
            <Text style={styles.jetonTexte}>{j.nom}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 18 }}>
        <View style={styles.sectionRang}>
          <Text style={styles.section}>Trajets habituels</Text>
          <Pressable onPress={onGererHabituels}>
            <Text style={styles.lienSection}>{habituels.length ? 'Gérer' : 'Ajouter'}</Text>
          </Pressable>
        </View>
        {habituels.length === 0 ? (
          <Text style={styles.note}>
            Enregistrez Maison, l’école, le marché ou le bureau pour obtenir le prix d’un tap, même hors
            ligne.
          </Text>
        ) : (
          <View style={styles.jetons}>
            {habituels.map((h) => (
              <Pressable
                key={h.id}
                onPress={() => onHabituel(h)}
                style={styles.jetonHabituel}
                accessibilityLabel={`Estimer ${h.nom}`}
              >
                <Icone nom={h.icone} taille={14} couleur={couleurs.encre} />
                <Text style={styles.jetonTexte}>{h.nom}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {historique.length > 0 ? (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.section}>Récents</Text>
          {historique.slice(0, 4).map((e) => (
            <Pressable
              key={e.id}
              onPress={() => onRecent(e)}
              style={({ pressed }) => [styles.ligneRecent, pressed && { opacity: 0.7 }]}
            >
              <Icone nom="clock" taille={16} couleur={couleurs.encre} />
              <View style={{ flex: 1 }}>
                <Text style={styles.recentTitre} numberOfLines={1}>
                  {e.origin.label} → {e.dest.label}
                </Text>
                <Text style={styles.recentSous}>{formatFcfa(e.point)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : recentsLieux.length > 0 ? (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.section}>Récents</Text>
          {recentsLieux.slice(0, 4).map((l, i) => (
            <Pressable
              key={`${l.label}-${i}`}
              onPress={() => onLieuRecent(l)}
              style={({ pressed }) => [styles.ligneRecent, pressed && { opacity: 0.7 }]}
            >
              <Icone nom="clock" taille={16} couleur={couleurs.encre} />
              <Text style={styles.recentTitre}>{l.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {favoris.length > 0 ? (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.section}>Favoris</Text>
          {favoris.slice(0, 6).map((f) => (
            <Pressable
              key={f.id}
              onPress={() => onFavori(f)}
              style={({ pressed }) => [styles.ligneRecent, pressed && { opacity: 0.7 }]}
            >
              <Icone nom="star" taille={16} couleur={couleurs.orFonce} />
              <View style={{ flex: 1 }}>
                <Text style={styles.recentTitre} numberOfLines={1}>
                  {f.origin.label} → {f.dest.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {chargement ? <Text style={styles.note}>Calcul de l’itinéraire…</Text> : null}

      <Text style={styles.pied}>
        {NOMBRE_REPERES.toLocaleString('fr-FR')} repères du Grand Nokoué disponibles hors ligne.
      </Text>
    </View>
  );
}

function VueReference({
  depart,
  arrivee,
  estimation,
  itineraire,
  conditions,
  estFavori,
  stats,
  horsZone,
  sourceDistance,
  onRetour,
  onFavori,
  onPartager,
  onMontrer,
  onSignaler,
  onPluie,
  pluie,
  bagage,
  onBagage,
  invitationBudget,
  onNoterBudget,
  onIgnorerBudget,
  onHabituel,
  trajetActif,
  messagePartage,
  onPartagerTrajet,
  onTerminerTrajet,
}: {
  depart: Lieu;
  arrivee: Lieu;
  estimation: Estimation;
  itineraire: Itineraire;
  conditions: string;
  estFavori: boolean;
  stats: TrajetCommunaute | null;
  horsZone: boolean;
  sourceDistance: 'osrm' | 'vol-oiseau';
  onRetour: () => void;
  onFavori: () => void;
  onPartager: () => void;
  onMontrer: () => void;
  onSignaler: () => void;
  onPluie: () => void;
  pluie: boolean;
  bagage: NiveauBagage;
  onBagage: (n: NiveauBagage) => void;
  invitationBudget: boolean;
  onNoterBudget: () => void;
  onIgnorerBudget: () => void;
  onHabituel: () => void;
  trajetActif: TrajetPartageLocal | null;
  messagePartage: string | null;
  onPartagerTrajet: () => void;
  onTerminerTrajet: () => void;
}) {
  const largeur = Math.max(1, estimation.haut - estimation.bas);
  const curseur = Math.min(1, Math.max(0, (estimation.point - estimation.bas) / largeur));

  return (
    <View>
      <View style={styles.refEntete}>
        <Pressable onPress={onRetour} accessibilityLabel="Retour" style={styles.retour}>
          <Icone nom="chevron-left" taille={22} couleur={couleurs.encre} />
        </Pressable>
        <Text style={styles.conditions}>{conditions}</Text>
        <Pressable
          onPress={onFavori}
          accessibilityLabel={estFavori ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          style={styles.retour}
        >
          <Icone nom="star" taille={20} couleur={estFavori ? couleurs.orFonce : couleurs.encre} />
        </Pressable>
      </View>
      <Text style={styles.refTrajet}>
        {depart.label} → {arrivee.label}
      </Text>
      <Text style={styles.refPrix}>{formatFcfa(estimation.point)}</Text>
      <Text style={styles.refMeta}>
        {formatKm(itineraire.distanceM / 1000)}
        {' · '}
        {formatDuree(itineraire.dureeS)}
        {' · '}
        {formatFcfa(estimation.bas)} – {formatFcfa(estimation.haut)}
        {sourceDistance === 'vol-oiseau' ? ' · distance approximative' : ''}
      </Text>

      <View style={styles.barre}>
        <View style={styles.barreFond} />
        <View style={[styles.barreCurseur, { left: `${Math.round(curseur * 100)}%` }]} />
        <View style={styles.barreLabels}>
          <Text style={styles.barreLabel}>Bas</Text>
          <Text style={styles.barreLabel}>Juste</Text>
          <Text style={styles.barreLabel}>Haut</Text>
        </View>
      </View>

      <View style={styles.communaute}>
        {stats && stats.nbAvis > 0 ? (
          <>
            <Text style={styles.comTitre}>Communauté</Text>
            <Text style={styles.comTexte}>
              {stats.nbAvis} prix signalé{stats.nbAvis > 1 ? 's' : ''} · médiane {formatFcfa(stats.medianeFcfa)}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.comTitre}>Communauté</Text>
            <Text style={styles.comTexte}>
              Aucun prix signalé sur ce trajet pour le moment. Soyez le premier à indiquer ce que vous
              avez convenu.
            </Text>
          </>
        )}
      </View>

      {horsZone ? (
        <Text style={styles.alerte}>
          Un des deux points sort du Grand Nokoué. Le barème a été calé pour Cotonou, Abomey-Calavi et
          Porto-Novo.
        </Text>
      ) : null}

      <View style={{ marginTop: 4 }}>
        <JetonsBagage valeur={bagage} onChange={onBagage} />
      </View>

      {invitationBudget ? (
        <View style={styles.invitation}>
          <Text style={styles.invitationTexte}>
            Noter {formatFcfa(estimation.point)} dans le budget transport ?
          </Text>
          <View style={styles.boutons}>
            <View style={{ flex: 1 }}>
              <Bouton titre="Noter" onPress={onNoterBudget} />
            </View>
            <View style={{ flex: 1 }}>
              <Bouton titre="Plus tard" variante="contour" onPress={onIgnorerBudget} />
            </View>
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: 12 }}>
        <Bouton titre="Montrer au zém" onPress={onMontrer} />
      </View>
      <View style={styles.boutons}>
        <View style={{ flex: 1 }}>
          <Bouton titre="Partager le prix" variante="contour" onPress={onPartager} />
        </View>
        <View style={{ flex: 1 }}>
          <Bouton titre="J’ai payé" variante="contour" onPress={onSignaler} />
        </View>
      </View>

      {trajetActif ? (
        <View style={styles.invitation}>
          <Text style={styles.invitationTexte}>
            Suivi en cours. Le lien expire à la fin de la course, ou au plus tard dans six heures.
          </Text>
          <Bouton titre="Terminer le suivi" variante="contour" onPress={onTerminerTrajet} />
        </View>
      ) : (
        <View style={{ marginTop: 12 }}>
          <Bouton titre="Partager mon trajet" variante="contour" onPress={onPartagerTrajet} />
        </View>
      )}
      {messagePartage ? <Text style={styles.note}>{messagePartage}</Text> : null}

      <Pressable onPress={onHabituel} style={styles.pluie}>
        <Icone nom="bookmark" taille={14} couleur={couleurs.orFonce} />
        <Text style={styles.pluieTexte}>Enregistrer comme trajet habituel</Text>
      </Pressable>
      <Pressable onPress={onPluie} style={styles.pluie}>
        <Icone nom="cloud-rain" taille={14} couleur={pluie ? couleurs.orFonce : couleurs.muet} />
        <Text style={styles.pluieTexte}>{pluie ? 'Pluie prise en compte' : 'Ajouter la pluie'}</Text>
      </Pressable>
      <Text style={styles.disclaimer}>Prix indicatif, à convenir avec le conducteur.</Text>
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
    gap: 8,
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
  bonjour: {
    fontFamily: typo.medium,
    fontSize: 11,
    letterSpacing: 1.2,
    color: couleurs.muet,
  },
  question: { fontFamily: typo.bold, fontSize: 26, color: couleurs.encre, marginTop: 2 },
  resumeTrajet: { fontFamily: typo.medium, fontSize: 14, color: couleurs.encreDouce },
  resumePrix: { fontFamily: typo.bold, fontSize: 28, color: couleurs.encre, marginTop: 2 },
  champRecherche: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: couleurs.fond,
    borderRadius: rayon.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 4,
  },
  champRechercheTexte: { fontFamily: typo.medium, fontSize: 15, color: couleurs.muet },
  departLigne: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  departTexte: { fontFamily: typo.medium, fontSize: 13, color: couleurs.encreDouce, flex: 1 },
  lienPosition: { fontFamily: typo.semi, fontSize: 13, color: couleurs.orFonce, marginTop: 6 },
  jetons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  jeton: {
    borderWidth: 1,
    borderColor: couleurs.ligne,
    backgroundColor: couleurs.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  jetonTexte: { fontFamily: typo.medium, fontSize: 13, color: couleurs.encre },
  sectionRang: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: {
    fontFamily: typo.medium,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: couleurs.muet,
    marginBottom: 4,
  },
  lienSection: { fontFamily: typo.semi, fontSize: 13, color: couleurs.orFonce },
  jetonHabituel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: couleurs.or,
    backgroundColor: couleurs.orPale,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  invitation: {
    backgroundColor: couleurs.fond,
    borderRadius: rayon.md,
    padding: 14,
    marginTop: 14,
    gap: 10,
  },
  invitationTexte: { fontFamily: typo.medium, fontSize: 14, color: couleurs.encre, lineHeight: 20 },
  ligneRecent: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  recentTitre: { fontFamily: typo.medium, fontSize: 14, color: couleurs.encre },
  recentSous: { fontFamily: typo.regular, fontSize: 12, color: couleurs.muet, marginTop: 1 },
  note: { fontFamily: typo.regular, fontSize: 13, color: couleurs.muet, marginTop: 12 },
  pied: { fontFamily: typo.regular, fontSize: 11, color: couleurs.muet, marginTop: 20, lineHeight: 16 },
  alerte: { fontFamily: typo.regular, fontSize: 13, color: couleurs.alerte, marginTop: 8, lineHeight: 18 },
  refEntete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  retour: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  conditions: { fontFamily: typo.medium, fontSize: 13, color: couleurs.encreDouce },
  refTrajet: { fontFamily: typo.medium, fontSize: 15, color: couleurs.encreDouce, marginTop: 8, textAlign: 'center' },
  refPrix: {
    fontFamily: typo.bold,
    fontSize: 72,
    color: couleurs.encre,
    letterSpacing: -2,
    textAlign: 'center',
    marginTop: 4,
  },
  refMeta: {
    fontFamily: typo.regular,
    fontSize: 13,
    color: couleurs.muet,
    textAlign: 'center',
    marginBottom: 16,
  },
  barre: { marginBottom: 16, paddingHorizontal: 4 },
  barreFond: { height: 6, borderRadius: 3, backgroundColor: couleurs.ligne },
  barreCurseur: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    marginLeft: -7,
    borderRadius: 7,
    backgroundColor: couleurs.encre,
  },
  barreLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  barreLabel: { fontFamily: typo.medium, fontSize: 11, color: couleurs.muet },
  communaute: {
    backgroundColor: couleurs.fond,
    borderRadius: rayon.md,
    padding: 14,
    marginBottom: 8,
  },
  comTitre: { fontFamily: typo.semi, fontSize: 14, color: couleurs.encre, marginBottom: 4 },
  comTexte: { fontFamily: typo.regular, fontSize: 13, color: couleurs.encreDouce, lineHeight: 19 },
  boutons: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pluie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  pluieTexte: { fontFamily: typo.medium, fontSize: 13, color: couleurs.encreDouce },
  disclaimer: {
    fontFamily: typo.regular,
    fontSize: 12,
    color: couleurs.muet,
    textAlign: 'center',
    marginTop: 14,
  },
});
