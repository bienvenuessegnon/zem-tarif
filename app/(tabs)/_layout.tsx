import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

export default function Onglets() {
  return (
    <Tabs
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),
        headerStyle: { backgroundColor: couleurs.papier },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: typo.serifMoyen,
          fontSize: 22,
          color: couleurs.encre,
        },
        headerTintColor: couleurs.encre,
        tabBarStyle: styles.barre,
        tabBarActiveTintColor: couleurs.encre,
        tabBarInactiveTintColor: couleurs.muet,
        tabBarLabelStyle: styles.label,
        sceneStyle: { backgroundColor: couleurs.papier },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Zém Tarif',
          tabBarLabel: 'Estimer',
          tabBarIcon: ({ focused, color }) => (
            <Point focused={focused} color={typeof color === 'string' ? color : '#8A847B'} />
          ),
        }}
      />
      <Tabs.Screen
        name="historique"
        options={{
          title: 'Historique',
          tabBarLabel: 'Historique',
          tabBarIcon: ({ focused, color }) => (
            <Point focused={focused} color={typeof color === 'string' ? color : '#8A847B'} />
          ),
        }}
      />
      <Tabs.Screen
        name="a-propos"
        options={{
          title: 'La méthode',
          tabBarLabel: 'Méthode',
          tabBarIcon: ({ focused, color }) => (
            <Point focused={focused} color={typeof color === 'string' ? color : '#8A847B'} />
          ),
        }}
      />
    </Tabs>
  );
}

function Point({ focused, color }: { focused: boolean; color: string }) {
  return (
    <View
      style={[
        styles.point,
        { backgroundColor: focused ? couleurs.or : color, opacity: focused ? 1 : 0.45 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  barre: {
    backgroundColor: couleurs.papier,
    borderTopColor: couleurs.ligne,
    borderTopWidth: 1,
    height: 62,
  },
  label: {
    fontFamily: typo.sansMoyen,
    fontSize: 12,
  },
  point: {
    width: 8,
    height: 8,
    borderRadius: 8,
    marginTop: 6,
  },
});
