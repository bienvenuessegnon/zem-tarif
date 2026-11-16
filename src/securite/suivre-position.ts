import * as Location from 'expo-location';

import { majPositionTrajet } from '../api/client';
import { memoriserPosition } from '../storage/derniere-position';

/** Envoie la position toutes les 10 à 15 s tant que le trajet partagé est ouvert. */
export function demarrerSuiviPosition(jeton: string): () => void {
  let stop = false;
  let souscription: Location.LocationSubscription | undefined;
  let intervalle: ReturnType<typeof setInterval> | undefined;

  async function envoyer(lat: number, lon: number) {
    await memoriserPosition(lat, lon);
    await majPositionTrajet(jeton, lat, lon);
  }

  void (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted' || stop) return;
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!stop) await envoyer(pos.coords.latitude, pos.coords.longitude);
    } catch {
      // On réessaiera au prochain intervalle ; hors ligne, la dernière position reste en local.
    }
    try {
      souscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10_000,
          distanceInterval: 15,
        },
        (pos) => {
          if (!stop) void envoyer(pos.coords.latitude, pos.coords.longitude);
        },
      );
    } catch {
      // watchPosition n’est pas toujours disponible (web) : l’intervalle prend le relais.
    }
    intervalle = setInterval(() => {
      if (stop) return;
      void (async () => {
        try {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          await envoyer(pos.coords.latitude, pos.coords.longitude);
        } catch {
          // Hors ligne : le SMS SOS utilisera la dernière position mémorisée.
        }
      })();
    }, 15_000);
  })();

  return () => {
    stop = true;
    souscription?.remove();
    if (intervalle) clearInterval(intervalle);
  };
}
