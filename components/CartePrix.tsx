import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Icone } from '@/components/Icone';
import { formatDuree, formatFcfa, formatKm } from '@/src/pricing/format';
import type { Estimation } from '@/src/pricing/types';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';
import { rayon } from '@/src/theme/espace';

type Props = {
  estimation: Estimation;
  dureeS: number;
  sourceDistance: 'osrm' | 'vol-oiseau';
};

export function CartePrix({ estimation, dureeS, sourceDistance }: Props) {
  return (
    <View style={styles.carte}>
      <Text style={styles.legende}>Fourchette raisonnable</Text>
      <Text style={styles.point} accessibilityRole="header">
        <PrixAnime valeur={estimation.point} />
      </Text>
      <Text style={styles.unite}>CFA</Text>
      <Text style={styles.fourchette}>
        {formatFcfa(estimation.bas)}  –  {formatFcfa(estimation.haut)}
      </Text>
      <View style={styles.puces}>
        <Puce icone="navigation" texte={formatKm(estimation.distanceKm)} />
        <Puce icone="clock" texte={formatDuree(dureeS)} />
        <Puce
          icone={estimation.nuit ? 'moon' : 'sun'}
          texte={estimation.nuit ? 'Nuit' : 'Jour'}
        />
        {estimation.pluie ? <Puce icone="cloud-rain" texte="Pluie" /> : null}
        {sourceDistance === 'vol-oiseau' ? (
          <Puce icone="minus" texte="Distance estimée" />
        ) : null}
      </View>
      <Text style={styles.avis}>
        {estimation.sourcePrix === 'melange'
          ? `Ajusté avec ${estimation.nbSignalementsProches} prix signalés sur des trajets proches (médiane ${formatFcfa(estimation.medianeSignalements ?? 0)}).`
          : 'Issu du barème de base. Il s’ajustera quand assez d’usagers auront signalé un prix sur ce trajet.'}
      </Text>
    </View>
  );
}

function Puce({ icone, texte }: { icone: ComponentProps<typeof Icone>['nom']; texte: string }) {
  return (
    <View style={styles.puce}>
      <Icone nom={icone} taille={12} couleur={couleurs.encreDouce} />
      <Text style={styles.puceTexte}>{texte}</Text>
    </View>
  );
}

function PrixAnime({ valeur }: { valeur: number }) {
  const [affiche, setAffiche] = useState(0);
  useEffect(() => {
    let cadre = 0;
    let debut: number | null = null;
    const duree = 520;
    const pas = (t: number) => {
      if (debut == null) debut = t;
      const p = Math.min(1, (t - debut) / duree);
      const eased = 1 - (1 - p) * (1 - p);
      setAffiche(Math.round((valeur * eased) / 50) * 50);
      if (p < 1) cadre = requestAnimationFrame(pas);
    };
    cadre = requestAnimationFrame(pas);
    return () => cancelAnimationFrame(cadre);
  }, [valeur]);
  return <>{formatFcfa(affiche || valeur)}</>;
}

const styles = StyleSheet.create({
  carte: {
    alignItems: 'center',
    paddingTop: 8,
  },
  legende: {
    fontFamily: typo.medium,
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: couleurs.muet,
  },
  point: {
    fontFamily: typo.bold,
    fontSize: 52,
    color: couleurs.encre,
    marginTop: 4,
    letterSpacing: -1.5,
    lineHeight: 58,
  },
  unite: {
    fontFamily: typo.medium,
    fontSize: 13,
    color: couleurs.muet,
    marginTop: -2,
  },
  fourchette: {
    fontFamily: typo.semi,
    fontSize: 18,
    color: couleurs.encre,
    marginTop: 6,
  },
  puces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  puce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: couleurs.fond,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: rayon.full,
  },
  puceTexte: { fontFamily: typo.medium, fontSize: 12, color: couleurs.encreDouce },
  avis: {
    fontFamily: typo.regular,
    fontSize: 13,
    color: couleurs.muet,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
  },
});
