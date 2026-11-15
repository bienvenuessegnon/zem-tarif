import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';

import { couleurs } from '@/src/theme/colors';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function Racine() {
  const [loaded, error] = useFonts({
    SourceSans3_400Regular: require('../assets/fonts/SourceSans3_400Regular.ttf'),
    SourceSans3_600SemiBold: require('../assets/fonts/SourceSans3_600SemiBold.ttf'),
    SourceSans3_700Bold: require('../assets/fonts/SourceSans3_700Bold.ttf'),
    SourceSerif4_400Regular: require('../assets/fonts/SourceSerif4_400Regular.ttf'),
    SourceSerif4_600SemiBold: require('../assets/fonts/SourceSerif4_600SemiBold.ttf'),
    SourceSerif4_700Bold: require('../assets/fonts/SourceSerif4_700Bold.ttf'),
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
    return <View style={{ flex: 1, backgroundColor: couleurs.papier }} />;
  }

  const cadreWeb = Platform.OS === 'web';

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: cadreWeb ? couleurs.papierFonce : couleurs.papier,
        alignItems: cadreWeb ? 'center' : undefined,
      }}
    >
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: cadreWeb ? 480 : undefined,
          backgroundColor: couleurs.papier,
          alignSelf: cadreWeb ? 'center' : undefined,
        }}
      >
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: couleurs.papier },
            headerShadowVisible: false,
            headerTintColor: couleurs.encre,
            headerTitleStyle: {
              fontFamily: 'SourceSerif4_600SemiBold',
              fontSize: 20,
              color: couleurs.encre,
            },
            contentStyle: { backgroundColor: couleurs.papier },
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
