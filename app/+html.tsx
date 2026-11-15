import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

export default function RacineHtml({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta
          name="description"
          content="Zém Tarif estime une fourchette raisonnable pour une course en zémidjan à Cotonou, Abomey-Calavi et Porto-Novo."
        />
        <title>Zém Tarif</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const css = `
  html, body, #root { height: 100%; }
  body {
    background-color: #F4F1EA;
    margin: 0;
  }
  input, textarea, button { font-family: inherit; }
`;
