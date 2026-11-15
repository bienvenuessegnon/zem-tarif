import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { filtrerReperes, type Lieu } from '@/src/geo/lieux';
import { chercherLieux } from '@/src/geo/nominatim';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

type Props = {
  etiquette: string;
  valeur?: Lieu | null;
  saisie: string;
  onSaisie: (texte: string) => void;
  onChoix: (lieu: Lieu) => void;
  onEffacer: () => void;
};

export function ChampLieu({
  etiquette,
  valeur,
  saisie,
  onSaisie,
  onChoix,
  onEffacer,
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
          if (!controleur.signal.aborted) {
            setReseau(lieux);
          }
        })
        .catch((e: unknown) => {
          if (!controleur.signal.aborted && (e as { name?: string }).name !== 'AbortError') {
            setErreur('La recherche en ligne est indisponible pour le moment.');
          }
        })
        .finally(() => {
          if (!controleur.signal.aborted) {
            setChargement(false);
          }
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controleur.abort();
    };
  }, [saisie]);

  const suggestions = dedupliquer([...locaux, ...reseau]);

  return (
    <View style={styles.bloc}>
      <Text style={styles.etiquette}>{etiquette}</Text>
      <View style={styles.ligne}>
        <TextInput
          value={valeur && saisie === valeur.label ? valeur.label : saisie}
          onChangeText={(t) => {
            onSaisie(t);
            setOuvert(true);
          }}
          onFocus={() => setOuvert(true)}
          placeholder="Quartier, marché, carrefour…"
          placeholderTextColor={couleurs.muet}
          style={styles.champ}
          autoCorrect={false}
          autoCapitalize="none"
          accessibilityLabel={etiquette}
        />
        {(valeur || saisie) ? (
          <Pressable onPress={onEffacer} hitSlop={8} accessibilityLabel="Effacer">
            <Text style={styles.effacer}>Effacer</Text>
          </Pressable>
        ) : null}
      </View>
      {ouvert && suggestions.length > 0 ? (
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
              <Text style={styles.itemTitre}>{lieu.label}</Text>
              {lieu.detail ? <Text style={styles.itemDetail}>{lieu.detail}</Text> : null}
            </Pressable>
          ))}
          {chargement ? (
            <View style={styles.pied}>
              <ActivityIndicator size="small" color={couleurs.orFonce} />
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
  return sortie.slice(0, 10);
}

const styles = StyleSheet.create({
  bloc: { marginBottom: 14 },
  etiquette: {
    fontFamily: typo.sansMoyen,
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: couleurs.secondaire,
    marginBottom: 6,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: couleurs.encre,
    paddingBottom: 6,
    gap: 8,
  },
  champ: {
    flex: 1,
    fontFamily: typo.sans,
    fontSize: 18,
    color: couleurs.encre,
    paddingVertical: 6,
    outlineStyle: 'none',
  } as object,
  effacer: {
    fontFamily: typo.sans,
    fontSize: 13,
    color: couleurs.secondaire,
  },
  liste: {
    backgroundColor: couleurs.carte,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    marginTop: 4,
  },
  item: { paddingHorizontal: 12, paddingVertical: 10 },
  itemPresse: { backgroundColor: couleurs.papierFonce },
  itemTitre: { fontFamily: typo.sansMoyen, fontSize: 16, color: couleurs.encre },
  itemDetail: { fontFamily: typo.sans, fontSize: 12, color: couleurs.secondaire, marginTop: 2 },
  pied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  piedTexte: { fontFamily: typo.sans, fontSize: 12, color: couleurs.secondaire },
  erreur: {
    fontFamily: typo.sans,
    fontSize: 12,
    color: couleurs.alerte,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
});
