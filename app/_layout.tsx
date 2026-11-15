import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { EcranSplash } from '@/components/EcranSplash';
import { Onboarding } from '@/components/Onboarding';
import { synchroniserFile } from '@/src/api/client';
import { FournisseurProfil } from '@/src/contenu/contexte-profil';
import { marquerOnboardingVu, lireProfil, type Profil } from '@/src/storage/profil';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

type Phase = 'chargement' | 'splash' | 'onboarding' | 'app';

export default function Racine() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular: require('../assets/fonts/PlusJakartaSans_400Regular.ttf'),
    PlusJakartaSans_500Medium: require('../assets/fonts/PlusJakartaSans_500Medium.ttf'),
    PlusJakartaSans_600SemiBold: require('../assets/fonts/PlusJakartaSans_600SemiBold.ttf'),
    PlusJakartaSans_700Bold: require('../assets/fonts/PlusJakartaSans_700Bold.ttf'),
  });
  const [phase, setPhase] = useState<Phase>('chargement');
  const [profil, setProfil] = useState<Profil>({ pseudo: '', onboardingVu: false });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    let actif = true;
    const debut = Date.now();
    (async () => {
      const actuel = await lireProfil();
      await SplashScreen.hideAsync();
      if (!actif) return;
      setProfil(actuel);
      setPhase('splash');
      const reste = Math.max(0, 2000 - (Date.now() - debut));
      await new Promise((r) => setTimeout(r, reste));
      if (!actif) return;
      setPhase(actuel.onboardingVu ? 'app' : 'onboarding');
      void synchroniserFile();
    })();
    return () => {
      actif = false;
    };
  }, [loaded]);

  if (!loaded || phase === 'chargement' || phase === 'splash') {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <EcranSplash />
      </GestureHandlerRootView>
    );
  }

  if (phase === 'onboarding') {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: couleurs.fond }}>
        <StatusBar style="dark" />
        <Onboarding
          onTerminer={async (pseudo) => {
            const suivant = await marquerOnboardingVu(pseudo);
            setProfil(suivant);
            setPhase('app');
          }}
        />
      </GestureHandlerRootView>
    );
  }

  const cadreWeb = Platform.OS === 'web';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <FournisseurProfil profilInitial={profil}>
      <View
        style={{
          flex: 1,
          backgroundColor: cadreWeb ? '#0C0C0C' : couleurs.fond,
          alignItems: cadreWeb ? 'center' : undefined,
        }}
      >
        <View
          style={{
            flex: 1,
            width: '100%',
            maxWidth: cadreWeb ? 390 : undefined,
            backgroundColor: couleurs.fond,
            alignSelf: cadreWeb ? 'center' : undefined,
          }}
        >
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: couleurs.fond },
              headerShadowVisible: false,
              headerTintColor: couleurs.encre,
              headerTitleStyle: {
                fontFamily: typo.semi,
                fontSize: 17,
                color: couleurs.encre,
              },
              contentStyle: { backgroundColor: couleurs.fond },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="signaler"
              options={{ title: 'Signaler un prix', presentation: 'modal' }}
            />
            <Stack.Screen name="conseils" options={{ title: 'Conseils' }} />
          </Stack>
        </View>
      </View>
    </FournisseurProfil>
    </GestureHandlerRootView>
  );
}
