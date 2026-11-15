import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';

import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function Racine() {
  const [loaded, error] = useFonts({
    PlusJakartaSans_400Regular: require('../assets/fonts/PlusJakartaSans_400Regular.ttf'),
    PlusJakartaSans_500Medium: require('../assets/fonts/PlusJakartaSans_500Medium.ttf'),
    PlusJakartaSans_600SemiBold: require('../assets/fonts/PlusJakartaSans_600SemiBold.ttf'),
    PlusJakartaSans_700Bold: require('../assets/fonts/PlusJakartaSans_700Bold.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: couleurs.encre }} />;
  }

  const cadreWeb = Platform.OS === 'web';

  return (
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
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="signaler"
            options={{ title: 'Signaler un prix', presentation: 'modal' }}
          />
        </Stack>
      </View>
    </View>
  );
}
