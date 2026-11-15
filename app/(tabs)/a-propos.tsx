import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { REPERES_PUBLIES } from '@/src/contenu/reperes-publies';
import {
  HEURE_DEBUT_NUIT,
  HEURE_FIN_NUIT,
  PLANCHER_FCFA,
  PRISE_EN_CHARGE_FCFA,
  TARIF_KM_FCFA,
} from '@/src/pricing/constantes';
import { formatFcfa } from '@/src/pricing/format';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

export default function EcranAPropos() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.contenu}>
      <Text style={styles.chapo}>
        À Cotonou, le prix d’un zémidjan se discute avant de monter. Il n’y a
        pas de compteur, et nous n’avons trouvé aucune grille officielle ou
        syndicale en vigueur. Zém Tarif propose une fourchette, calée sur des
        sources publiques de 2025–2026, que les usagers peuvent ensuite affiner.
      </Text>

      <Text style={styles.h2}>Le barème de base</Text>
      <Text style={styles.p}>
        Le point central vaut {formatFcfa(PRISE_EN_CHARGE_FCFA)} de prise en
        charge, plus {formatFcfa(TARIF_KM_FCFA)} par kilomètre d’itinéraire,
        avec un plancher de {formatFcfa(PLANCHER_FCFA)}. Le résultat est
        arrondi à 50 F. La fourchette affichée va de 85 % à 130 % de ce point,
        pour laisser de la place à la négociation.
      </Text>
      <Text style={styles.p}>
        En journée, un court trajet d’environ 2,4 km (Haie Vive–Cadjèhoun)
        donne 300 F, Haie Vive–Ganhi (environ 5,3 km) 500 F, Fidjrossè–Akpakpa
        (environ 11,7 km) 900 F. Tous les coefficients sont dans un seul
        fichier de configuration, pour pouvoir les ajuster dès que des prix
        réellement payés seront mieux connus.
      </Text>
      <Text style={styles.p}>
        Entre {HEURE_DEBUT_NUIT} h et {HEURE_FIN_NUIT} h, une majoration de 1,25 s’applique (ordre de grandeur : +20 à 30 % la nuit,
        selon un guide de 2026). Si vous indiquez de la pluie ou une voie
        dégradée, une majoration de 1,30 s’ajoute. Un témoignage
        de 2014 évoquait une hausse plus forte, jusqu’à +50 % : le modèle
        reste volontairement plus prudent.
      </Text>

      <Text style={styles.h2}>D’où viennent ces chiffres</Text>
      <Text style={styles.p}>
        Le barème n’est pas une moyenne statistique officielle. Il a été
        recalibré en novembre 2026 pour rester dans les fourchettes publiées
        après la hausse du carburant officiel à 725 F le litre (1er mai 2026),
        et après des témoignages de cours de zém déjà plus élevés sur les
        courts trajets. Les mentions ci-dessous sont des repères publiés, pas
        des signalements d’usagers. Les données précises, trajet par trajet,
        restent encore minces.
      </Text>
      {REPERES_PUBLIES.map((r, i) => (
        <View key={`${r.source}-${i}`} style={styles.source}>
          <Text style={styles.sourceTrajet}>{r.trajet}</Text>
          <Text style={styles.sourcePrix}>
            {r.fourchetteFcfa[0] === r.fourchetteFcfa[1]
              ? formatFcfa(r.fourchetteFcfa[0])
              : `${formatFcfa(r.fourchetteFcfa[0])} – ${formatFcfa(r.fourchetteFcfa[1])}`}
            {r.distanceKmEnviron ? ` · env. ${String(r.distanceKmEnviron).replace('.', ',')} km` : ''}
            {` · ${r.annee}`}
          </Text>
          <Pressable onPress={() => Linking.openURL(r.url)}>
            <Text style={styles.sourceLien}>{r.source}</Text>
          </Pressable>
          {r.note ? <Text style={styles.sourceNote}>{r.note}</Text> : null}
        </View>
      ))}

      <Text style={styles.h2}>Carburant</Text>
      <Text style={styles.p}>
        En 2019, le rapport SSATP citait environ 535 F le litre à la pompe.
        En 2025, le tarif officiel était de 695 F, puis 725 F à compter du
        1er mai 2026 (RFI, La Marina BJ, Fraternité). Beaucoup de zémidjans
        s’approvisionnent toutefois en essence informelle (« kpayo »), dont
        le prix est instable : un article d’Ahouandjo du 12 novembre 2026
        cite 1 000 à 1 200 F le litre à certains points, et des courses
        courtes passées de 200–250 F à 250–300 F. Il n’existe pas
        d’indexation automatique des courses : le carburant pèse sur la
        négociation, sans règle publiée.
      </Text>

      <Text style={styles.h2}>Quand les avis s’en mêlent</Text>
      <Text style={styles.p}>
        Dès que trois prix d’usagers relient à peu près les mêmes deux points
        (dans un rayon d’un kilomètre à chaque bout), le point central glisse
        vers leur médiane. Le poids de ces avis augmente jusqu’à 65 %. Les
        exemples de calibration ne sont jamais mélangés à ces avis.
      </Text>

      <Text style={styles.h2}>Limites</Text>
      <Text style={styles.p}>
        Les données récentes et précises, trajet par trajet, restent rares.
        Les guides de 2026 donnent des ordres de grandeur utiles, mais ce ne
        sont pas des enquêtes contrôlées. Le modèle ignore le nombre de
        passagers, les bagages, et le fait qu’un visiteur se voit souvent
        proposer plus cher. La durée vient d’OSRM, souvent optimiste aux
        heures de pointe. Si le calcul d’itinéraire échoue, la distance est
        celle à vol d’oiseau, majorée de 25 %.
      </Text>
      <Text style={styles.p}>
        Zém Tarif n’est pas GoZem ni Yango. GoZem Zem, tel qu’observé dans
        des guides de 2026, se situe typiquement entre 300 et 800 F, parfois
        jusqu’à 1 200 F : c’est un point de comparaison utile, pas une
        grille. La grille officielle Yango Moto à Cotonou (minimum 85 F
        comprenant 5 minutes et 2 km) est un plafond de plateforme, très
        en dessous des prix de rue : elle n’a pas servi à baisser le barème.
      </Text>

      <Text style={styles.h2}>Données personnelles</Text>
      <Text style={styles.p}>
        Les recherches de lieux passent par Nominatim (OpenStreetMap), à
        raison d’au plus une requête par seconde, avec un identifiant de
        contact. Les cartes et les itinéraires viennent d’OpenStreetMap et
        d’OSRM. Les prix signalés restent sur l’appareil, sauf si un serveur
        optionnel a été configuré. Aucun compte n’est demandé.
      </Text>
      <Text style={styles.pied}>
        Carte © les contributeurs d’OpenStreetMap. Itinéraires : OSRM.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: couleurs.fond },
  contenu: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },
  chapo: {
    fontFamily: typo.medium,
    fontSize: 18,
    lineHeight: 26,
    color: couleurs.encre,
    marginBottom: 28,
  },
  h2: {
    fontFamily: typo.semi,
    fontSize: 20,
    color: couleurs.encre,
    marginTop: 8,
    marginBottom: 10,
  },
  p: {
    fontFamily: typo.regular,
    fontSize: 15,
    lineHeight: 23,
    color: couleurs.encreDouce,
    marginBottom: 16,
  },
  source: {
    backgroundColor: couleurs.surface,
    borderRadius: rayon.md,
    padding: 14,
    marginBottom: 8,
  },
  sourceTrajet: { fontFamily: typo.medium, fontSize: 15, color: couleurs.encre },
  sourcePrix: { fontFamily: typo.regular, fontSize: 14, color: couleurs.encre, marginTop: 4 },
  sourceLien: {
    fontFamily: typo.medium,
    fontSize: 13,
    color: couleurs.orFonce,
    marginTop: 6,
  },
  sourceNote: {
    fontFamily: typo.regular,
    fontSize: 13,
    color: couleurs.muet,
    marginTop: 6,
    lineHeight: 18,
  },
  pied: {
    fontFamily: typo.regular,
    fontSize: 12,
    color: couleurs.muet,
    marginTop: 24,
  },
});
