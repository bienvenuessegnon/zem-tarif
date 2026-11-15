import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

/** true si une connexion internet est jugée disponible. */
export async function estEnLigne(): Promise<boolean> {
  try {
    const etat = await Network.getNetworkStateAsync();
    if (etat.isInternetReachable != null) return etat.isInternetReachable;
    return Boolean(etat.isConnected);
  } catch {
    return true;
  }
}

export function utiliserReseau(): boolean {
  const [enLigne, setEnLigne] = useState(true);

  useEffect(() => {
    let actif = true;
    async function maj() {
      const ok = await estEnLigne();
      if (actif) setEnLigne(ok);
    }
    void maj();
    const sub = Network.addNetworkStateListener((etat) => {
      const ok =
        etat.isInternetReachable != null
          ? Boolean(etat.isInternetReachable)
          : Boolean(etat.isConnected);
      setEnLigne(ok);
    });
    const id = setInterval(() => void maj(), 20_000);
    return () => {
      actif = false;
      sub.remove();
      clearInterval(id);
    };
  }, []);

  return enLigne;
}
