import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { poserTrajetInitial } from '@/src/contenu/selection-lieu';
import { decoderLieu } from '@/src/partage/lien';
import { couleurs } from '@/src/theme/colors';

export default function EcranTrajetPartage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ de?: string; vers?: string }>();

  useEffect(() => {
    const origin = decoderLieu(typeof params.de === 'string' ? params.de : undefined);
    const dest = decoderLieu(typeof params.vers === 'string' ? params.vers : undefined);
    if (origin && dest) {
      poserTrajetInitial({ origin, dest });
    }
    router.replace('/');
  }, [params.de, params.vers, router]);

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.fond, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={couleurs.orFonce} />
    </View>
  );
}
