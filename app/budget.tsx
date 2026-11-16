import { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { Bouton } from '@/components/Bouton';
import { Icone } from '@/components/Icone';
import {
  csvDepenses,
  depensesDeLaSemaine,
  depensesDuMois,
  progressionBudget,
  seriesJours,
  totalDepenses,
} from '@/src/budget/totaux';
import { toucherSucces } from '@/src/contenu/haptique';
import { formatFcfa } from '@/src/pricing/format';
import {
  ajouterDepense,
  ecrirePlafondMensuel,
  lireDepenses,
  lirePlafondMensuel,
  supprimerDepense,
  type DepenseTransport,
} from '@/src/storage/budget';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

export default function EcranBudget() {
  const [depenses, setDepenses] = useState<DepenseTransport[]>([]);
  const [plafond, setPlafond] = useState<number | null>(null);
  const [saisiePlafond, setSaisiePlafond] = useState('');
  const [saisiePrix, setSaisiePrix] = useState('');
  const [saisieTrajet, setSaisieTrajet] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const charger = useCallback(async () => {
    const [d, p] = await Promise.all([lireDepenses(), lirePlafondMensuel()]);
    setDepenses(d);
    setPlafond(p);
    setSaisiePlafond(p ? String(p) : '');
  }, []);

  useFocusEffect(
    useCallback(() => {
      void charger();
    }, [charger]),
  );

  const semaine = totalDepenses(depensesDeLaSemaine(depenses));
  const mois = totalDepenses(depensesDuMois(depenses));
  const series = seriesJours(depenses);
  const maxBarre = Math.max(1, ...series.map((s) => s.total));
  const prog = progressionBudget(mois, plafond);

  async function sauverPlafond() {
    const n = Number(saisiePlafond.replace(/\s/g, ''));
    const valeur = Number.isFinite(n) && n > 0 ? n : null;
    await ecrirePlafondMensuel(valeur);
    setPlafond(valeur);
    void toucherSucces();
  }

  async function ajouter() {
    const n = Number(saisiePrix.replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(n) || n < 50 || n > 20_000) return;
    const [de, vers] = saisieTrajet.includes('→')
      ? saisieTrajet.split('→').map((s) => s.trim())
      : [saisieTrajet.trim() || 'Course', ''];
    const liste = await ajouterDepense({
      prixFcfa: Math.round(n),
      de: de || 'Course',
      vers: vers,
      source: 'saisie',
    });
    setDepenses(liste);
    setSaisiePrix('');
    setSaisieTrajet('');
    void toucherSucces();
  }

  async function exporter() {
    const csv = csvDepenses(depenses);
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'budget-zem-tarif.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      setMessage('Fichier CSV téléchargé.');
      return;
    }
    await Share.share({ message: csv, title: 'Budget Zém Tarif' });
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.intro}>
        Les sommes restent sur cet appareil. Ajoutez une course après l’avoir payée, ou depuis un
        signalement.
      </Text>

      <View style={styles.totaux}>
        <View style={styles.totalCarte}>
          <Text style={styles.totalLabel}>Cette semaine</Text>
          <Text style={styles.totalValeur}>{formatFcfa(semaine)}</Text>
        </View>
        <View style={styles.totalCarte}>
          <Text style={styles.totalLabel}>Ce mois</Text>
          <Text style={styles.totalValeur}>{formatFcfa(mois)}</Text>
        </View>
      </View>

      <Text style={styles.titre}>Les 7 derniers jours</Text>
      <View style={styles.graphique}>
        {series.map((s) => (
          <View key={s.jour} style={styles.barreCol}>
            <View style={styles.barrePuit}>
              <View
                style={[
                  styles.barre,
                  { height: `${Math.max(4, Math.round((s.total / maxBarre) * 100))}%` },
                ]}
              />
            </View>
            <Text style={styles.barreLib}>{s.libelle}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.titre}>Plafond mensuel (facultatif)</Text>
      <View style={styles.rang}>
        <TextInput
          value={saisiePlafond}
          onChangeText={setSaisiePlafond}
          keyboardType="numeric"
          placeholder="ex. 20 000"
          placeholderTextColor={couleurs.muet}
          style={styles.champ}
        />
        <Bouton titre="Enregistrer" onPress={() => void sauverPlafond()} />
      </View>
      {prog ? (
        <View style={styles.progression}>
          <View style={styles.progressionFond}>
            <View
              style={[
                styles.progressionFil,
                {
                  width: `${Math.round(prog.ratio * 100)}%`,
                  backgroundColor: prog.restant < 0 ? couleurs.alerte : couleurs.or,
                },
              ]}
            />
          </View>
          <Text style={styles.meta}>
            {prog.restant >= 0
              ? `${formatFcfa(prog.restant)} restants ce mois`
              : `${formatFcfa(-prog.restant)} au-delà du plafond`}
          </Text>
        </View>
      ) : (
        <Text style={styles.meta}>Aucun plafond défini pour le moment.</Text>
      )}

      <Text style={styles.titre}>Ajouter une dépense</Text>
      <TextInput
        value={saisiePrix}
        onChangeText={setSaisiePrix}
        keyboardType="numeric"
        placeholder="Prix payé, en F"
        placeholderTextColor={couleurs.muet}
        style={styles.champ}
      />
      <TextInput
        value={saisieTrajet}
        onChangeText={setSaisieTrajet}
        placeholder="Trajet, ex. Maison → Marché"
        placeholderTextColor={couleurs.muet}
        style={styles.champ}
      />
      <Bouton titre="Ajouter au budget" onPress={() => void ajouter()} />

      <View style={[styles.rang, { marginTop: 24, justifyContent: 'space-between' }]}>
        <Text style={styles.titre}>Historique</Text>
        {depenses.length > 0 ? (
          <Pressable onPress={() => void exporter()}>
            <Text style={styles.lien}>Exporter CSV</Text>
          </Pressable>
        ) : null}
      </View>
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {depenses.length === 0 ? (
        <Text style={styles.meta}>Aucune dépense enregistrée sur cet appareil.</Text>
      ) : (
        depenses.slice(0, 30).map((d) => (
          <View key={d.id} style={styles.ligne}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ligneTitre} numberOfLines={1}>
                {d.de}
                {d.vers ? ` → ${d.vers}` : ''}
              </Text>
              <Text style={styles.meta}>
                {new Intl.DateTimeFormat('fr-FR', {
                  timeZone: 'Africa/Porto-Novo',
                  day: 'numeric',
                  month: 'short',
                }).format(new Date(d.enregistreLe))}
              </Text>
            </View>
            <Text style={styles.lignePrix}>{formatFcfa(d.prixFcfa)}</Text>
            <Pressable
              onPress={async () => setDepenses(await supprimerDepense(d.id))}
              accessibilityLabel="Supprimer"
              style={{ padding: 6 }}
            >
              <Icone nom="x" taille={16} couleur={couleurs.muet} />
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { padding: 20, paddingBottom: 48 },
  intro: { fontFamily: typo.regular, fontSize: 15, lineHeight: 22, color: couleurs.encreDouce, marginBottom: 20 },
  totaux: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  totalCarte: {
    flex: 1,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    padding: 14,
  },
  totalLabel: { fontFamily: typo.medium, fontSize: 12, color: couleurs.muet },
  totalValeur: { fontFamily: typo.bold, fontSize: 24, color: couleurs.encre, marginTop: 4, letterSpacing: -0.5 },
  titre: { fontFamily: typo.semi, fontSize: 18, color: couleurs.encre, marginTop: 20, marginBottom: 10 },
  graphique: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120, marginBottom: 8 },
  barreCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barrePuit: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  barre: { width: '100%', backgroundColor: couleurs.or, borderRadius: 4, minHeight: 4 },
  barreLib: { fontFamily: typo.medium, fontSize: 9, color: couleurs.muet, marginTop: 4 },
  rang: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  champ: {
    flex: 1,
    fontFamily: typo.medium,
    fontSize: 16,
    color: couleurs.encre,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    outlineStyle: 'none',
  } as object,
  progression: { marginTop: 8 },
  progressionFond: { height: 8, borderRadius: 4, backgroundColor: couleurs.ligne, overflow: 'hidden' },
  progressionFil: { height: '100%', borderRadius: 4 },
  meta: { fontFamily: typo.regular, fontSize: 13, color: couleurs.muet, marginTop: 6 },
  lien: { fontFamily: typo.semi, fontSize: 14, color: couleurs.orFonce },
  ok: { fontFamily: typo.regular, fontSize: 13, color: couleurs.succes, marginBottom: 8 },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    padding: 12,
    marginTop: 8,
  },
  ligneTitre: { fontFamily: typo.medium, fontSize: 14, color: couleurs.encre },
  lignePrix: { fontFamily: typo.semi, fontSize: 15, color: couleurs.encre },
});
