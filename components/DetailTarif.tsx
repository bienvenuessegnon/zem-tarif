import { StyleSheet, Text, View } from 'react-native';

import { formatFcfa, formatKm } from '@/src/pricing/format';
import { COEFF_NUIT, COEFF_PLUIE, TARIF_KM_FCFA } from '@/src/pricing/constantes';
import type { Estimation } from '@/src/pricing/types';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

type Props = { estimation: Estimation };

export function DetailTarif({ estimation }: Props) {
  return (
    <View style={styles.bloc}>
      <Ligne libelle="Prise en charge" valeur={formatFcfa(estimation.priseEnCharge)} />
      <Ligne
        libelle={`${formatKm(estimation.distanceKm)} × ${TARIF_KM_FCFA} F`}
        valeur={formatFcfa(estimation.partKilometrique)}
      />
      {estimation.nuit ? (
        <Ligne libelle={`Majoration de nuit (× ${COEFF_NUIT})`} valeur="oui" />
      ) : null}
      {estimation.pluie ? (
        <Ligne libelle={`Pluie ou voie dégradée (× ${COEFF_PLUIE})`} valeur="oui" />
      ) : null}
      {estimation.sourcePrix === 'melange' && estimation.medianeSignalements !== null ? (
        <Ligne
          libelle={`Médiane de ${estimation.nbSignalementsProches} avis proches`}
          valeur={formatFcfa(estimation.medianeSignalements)}
        />
      ) : null}
      <Ligne libelle="Point central, après arrondi" valeur={formatFcfa(estimation.point)} gras />
    </View>
  );
}

function Ligne({
  libelle,
  valeur,
  gras,
}: {
  libelle: string;
  valeur: string;
  gras?: boolean;
}) {
  return (
    <View style={styles.ligne}>
      <Text style={[styles.libelle, gras && styles.gras]}>{libelle}</Text>
      <Text style={[styles.valeur, gras && styles.gras]}>{valeur}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: couleurs.ligne,
    gap: 8,
    width: '100%',
  },
  ligne: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  libelle: { fontFamily: typo.sans, fontSize: 13, color: couleurs.secondaire, flex: 1 },
  valeur: { fontFamily: typo.sans, fontSize: 13, color: couleurs.encre },
  gras: { fontFamily: typo.sansMoyen, color: couleurs.encre },
});
