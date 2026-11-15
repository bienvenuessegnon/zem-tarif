import { createContext, useContext, type ReactNode, useCallback, useState } from 'react';

import { ecrireProfil, lireProfil, type Profil } from '@/src/storage/profil';

type Contexte = {
  profil: Profil;
  pret: boolean;
  rafraichir: () => Promise<void>;
  enregistrer: (profil: Profil) => Promise<void>;
};

const Ctx = createContext<Contexte | null>(null);

export function FournisseurProfil({
  profilInitial,
  children,
}: {
  profilInitial: Profil;
  children: ReactNode;
}) {
  const [profil, setProfil] = useState<Profil>(profilInitial);

  const rafraichir = useCallback(async () => {
    setProfil(await lireProfil());
  }, []);

  const enregistrer = useCallback(async (suivant: Profil) => {
    await ecrireProfil(suivant);
    setProfil(suivant);
  }, []);

  return (
    <Ctx.Provider value={{ profil, pret: true, rafraichir, enregistrer }}>
      {children}
    </Ctx.Provider>
  );
}

export function useProfil(): Contexte {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      profil: { pseudo: '', onboardingVu: true },
      pret: false,
      rafraichir: async () => {},
      enregistrer: async () => {},
    };
  }
  return ctx;
}
