import { StyleSheet, Text, View } from 'react-native';

import { formatDuree, formatFcfa, formatKm } from '@/src/pricing/format';
import type { Estimation } from '@/src/pricing/types';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

type Props = {
  estimation: Estimation;
  dureeS: number;
  sourceDistance: 'osrm' | 'vol-oiseau';
};

export function CartePrix({ estimation, dureeS, sourceDistance }: Props) {
  const conditions = [
    estimation.nuit ? 'tarif de nuit' : 'tarif de jour',
    estimation.pluie ? 'pluie ou voie dégradée' : 'temps sec',
  ].join(', ');

  return (
    <View style={styles.carte}>
      <Text style={styles.legende}>Fourchette raisonnable</Text>
      <Text style={styles.point}>{formatFcfa(estimation.point)}</Text>
      <Text style={styles.unite}>CFA</Text>
      <Text style={styles.fourchette}>
        {formatFcfa(estimation.bas)} – {formatFcfa(estimation.haut)}
      </Text>
      <Text style={styles.meta}>
        {formatKm(estimation.distanceKm)} · {formatDuree(dureeS)}
        {sourceDistance === 'vol-oiseau' ? ' · distance estimée' : ''}
      </Text>
      <Text style={styles.conditions}>{conditions}</Text>
      {estimation.sourcePrix === 'melange' ? (
        <Text style={styles.avis}>
          Ajusté avec {estimation.nbSignalementsProches} prix signalés sur des
          trajets proches (médiane {formatFcfa(estimation.medianeSignalements ?? 0)}).
        </Text>
      ) : (
        <Text style={styles.avis}>
          Prix issu du barème de base. Il s’ajustera quand assez d’usagers
          auront signalé un prix sur ce trajet.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.carte,
    borderWidth: 1,
    borderColor: couleurs.ligne,
    paddingHorizontal: 20,
    paddingVertical: 22,
    alignItems: 'center',
    marginTop: 16,
  },
  legende: {
    fontFamily: typo.sansMoyen,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: couleurs.secondaire,
  },
  point: {
    fontFamily: typo.serifGras,
    fontSize: 56,
    color: couleurs.encre,
    marginTop: 8,
    lineHeight: 62,
  },
  unite: {
    fontFamily: typo.sans,
    fontSize: 14,
    color: couleurs.secondaire,
    marginTop: -4,
  },
  fourchette: {
    fontFamily: typo.serifMoyen,
    fontSize: 22,
    color: couleurs.encre,
    marginTop: 10,
  },
  meta: {
    fontFamily: typo.sans,
    fontSize: 14,
    color: couleurs.secondaire,
    marginTop: 8,
  },
  conditions: {
    fontFamily: typo.sans,
    fontSize: 13,
    color: couleurs.orFonce,
    marginTop: 4,
  },
  avis: {
    fontFamily: typo.sans,
    fontSize: 13,
    color: couleurs.secondaire,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 18,
  },
});
