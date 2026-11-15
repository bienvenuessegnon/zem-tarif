import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Icone } from '@/components/Icone';
import { filtrerReperes, type Lieu } from '@/src/geo/lieux';
import { chercherLieux } from '@/src/geo/nominatim';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

type Props = {
  etiquette: string;
  icone: 'circle' | 'map-pin';
  valeur?: Lieu | null;
  saisie: string;
  onSaisie: (texte: string) => void;
  onChoix: (lieu: Lieu) => void;
  onEffacer: () => void;
  onFocusChamp?: () => void;
};

export function ChampLieu({
  etiquette,
  icone,
  valeur,
  saisie,
  onSaisie,
  onChoix,
  onEffacer,
  onFocusChamp,
}: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [reseau, setReseau] = useState<Lieu[]>([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const locaux = useMemo(() => filtrerReperes(saisie).slice(0, 8), [saisie]);

  useEffect(() => {
    if (saisie.trim().length < 3) {
      setReseau([]);
      setChargement(false);
      setErreur(null);
      return;
    }
    const controleur = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controleur;
    const timer = setTimeout(() => {
      setChargement(true);
      setErreur(null);
      chercherLieux(saisie, controleur.signal)
        .then((lieux) => {
          if (!controleur.signal.aborted) setReseau(lieux);
        })
        .catch((e: unknown) => {
          if (!controleur.signal.aborted && (e as { name?: string }).name !== 'AbortError') {
            setErreur('La recherche en ligne est indisponible pour le moment.');
          }
        })
        .finally(() => {
          if (!controleur.signal.aborted) setChargement(false);
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controleur.abort();
    };
  }, [saisie]);

  const suggestions = dedupliquer([...locaux, ...reseau]);
  const texte = valeur && saisie === valeur.label ? valeur.label : saisie;

  return (
    <View style={styles.bloc}>
      <View style={styles.ligne}>
        <View
          style={[
            styles.picto,
            icone === 'map-pin' ? styles.pictoArrivee : styles.pictoDepart,
          ]}
        >
          <Icone
            nom={icone === 'map-pin' ? 'map-pin' : 'circle'}
            taille={icone === 'map-pin' ? 14 : 10}
            couleur={icone === 'map-pin' ? couleurs.encre : couleurs.orFonce}
          />
        </View>
        <View style={styles.champBloc}>
          <Text style={styles.etiquette}>{etiquette}</Text>
          <TextInput
            value={texte}
            onChangeText={(t) => {
              onSaisie(t);
              setOuvert(true);
            }}
            onFocus={() => {
              setOuvert(true);
              onFocusChamp?.();
            }}
            placeholder="Quartier, marché, carrefour…"
            placeholderTextColor={couleurs.muet}
            style={styles.champ}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel={etiquette}
          />
        </View>
        {valeur || saisie ? (
          <Pressable
            onPress={() => {
              onEffacer();
              setOuvert(false);
            }}
            hitSlop={10}
            accessibilityLabel="Effacer"
            style={styles.effacerBtn}
          >
            <Icone nom="x" taille={16} couleur={couleurs.muet} />
          </Pressable>
        ) : null}
      </View>
      {ouvert && (suggestions.length > 0 || chargement || erreur) ? (
        <View style={styles.liste}>
          {suggestions.map((lieu, i) => (
            <Pressable
              key={`${lieu.label}-${lieu.lat}-${i}`}
              onPress={() => {
                onChoix(lieu);
                setOuvert(false);
              }}
              style={({ pressed }) => [styles.item, pressed && styles.itemPresse]}
            >
              <Icone nom="map-pin" taille={14} couleur={couleurs.muet} />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitre}>{lieu.label}</Text>
                {lieu.detail ? <Text style={styles.itemDetail} numberOfLines={1}>{lieu.detail}</Text> : null}
              </View>
            </Pressable>
          ))}
          {chargement ? (
            <View style={styles.pied}>
              <ActivityIndicator size="small" color={couleurs.encre} />
              <Text style={styles.piedTexte}>Recherche OpenStreetMap…</Text>
            </View>
          ) : null}
          {erreur ? <Text style={styles.erreur}>{erreur}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

function dedupliquer(lieux: Lieu[]): Lieu[] {
  const vus = new Set<string>();
  const sortie: Lieu[] = [];
  for (const lieu of lieux) {
    const cle = `${lieu.label.toLowerCase()}|${lieu.lat.toFixed(4)}|${lieu.lon.toFixed(4)}`;
    if (vus.has(cle)) continue;
    vus.add(cle);
    sortie.push(lieu);
  }
  return sortie.slice(0, 8);
}

const styles = StyleSheet.create({
  bloc: { marginBottom: 2 },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  picto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pictoDepart: { backgroundColor: couleurs.orPale },
  pictoArrivee: { backgroundColor: couleurs.fond },
  champBloc: { flex: 1 },
  etiquette: {
    fontFamily: typo.medium,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: couleurs.muet,
    marginBottom: 2,
  },
  champ: {
    fontFamily: typo.semi,
    fontSize: 16,
    color: couleurs.encre,
    paddingVertical: 0,
    outlineStyle: 'none',
  } as object,
  effacerBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: couleurs.fond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liste: {
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    marginTop: 4,
    marginLeft: 40,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  itemPresse: { backgroundColor: couleurs.fond },
  itemTitre: { fontFamily: typo.medium, fontSize: 15, color: couleurs.encre },
  itemDetail: { fontFamily: typo.regular, fontSize: 12, color: couleurs.muet, marginTop: 1 },
  pied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  piedTexte: { fontFamily: typo.regular, fontSize: 12, color: couleurs.muet },
  erreur: {
    fontFamily: typo.regular,
    fontSize: 12,
    color: couleurs.alerte,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
});
