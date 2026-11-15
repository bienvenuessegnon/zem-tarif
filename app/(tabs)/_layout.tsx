import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Icone, type NomIcone } from '@/components/Icone';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { toucherLeger } from '@/src/contenu/haptique';
import { couleurs } from '@/src/theme/colors';
import { typo } from '@/src/theme/typo';

export default function Onglets() {
  return (
    <Tabs
      screenOptions={{
        headerShown: useClientOnlyValue(false, true),
        headerStyle: { backgroundColor: couleurs.fond },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: typo.semi,
          fontSize: 20,
          color: couleurs.encre,
        },
        headerTintColor: couleurs.encre,
        tabBarStyle: styles.barre,
        tabBarActiveTintColor: couleurs.encre,
        tabBarInactiveTintColor: couleurs.muet,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        sceneStyle: { backgroundColor: couleurs.fond },
      }}
      screenListeners={{
        tabPress: () => {
          void toucherLeger();
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Zém Tarif',
          tabBarLabel: 'Accueil',
          headerShown: false,
          tabBarIcon: ({ color }) => <IconeOnglet nom="map-pin" couleur={String(color ?? '#8A8A86')} />,
        }}
      />
      <Tabs.Screen
        name="communaute"
        options={{
          title: 'Communauté',
          tabBarLabel: 'Communauté',
          tabBarIcon: ({ color }) => <IconeOnglet nom="users" couleur={String(color ?? '#8A8A86')} />,
        }}
      />
      <Tabs.Screen
        name="historique"
        options={{
          title: 'Historique',
          tabBarLabel: 'Trajets',
          tabBarIcon: ({ color }) => <IconeOnglet nom="clock" couleur={String(color ?? '#8A8A86')} />,
        }}
      />
      <Tabs.Screen
        name="plus"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <IconeOnglet nom="menu" couleur={String(color ?? '#8A8A86')} />,
        }}
      />
      <Tabs.Screen
        name="a-propos"
        options={{
          title: 'La méthode',
          href: null,
        }}
      />
    </Tabs>
  );
}

function IconeOnglet({ nom, couleur }: { nom: NomIcone; couleur: string }) {
  return <Icone nom={nom} taille={18} couleur={typeof couleur === 'string' ? couleur : couleurs.muet} />;
}

const styles = StyleSheet.create({
  barre: {
    backgroundColor: couleurs.surface,
    borderTopColor: couleurs.ligne,
    borderTopWidth: 1,
    height: 64,
    paddingTop: 6,
  },
  item: {
    flex: 1,
    paddingHorizontal: 0,
  },
  label: {
    fontFamily: typo.medium,
    fontSize: 10,
    letterSpacing: 0,
  },
});
