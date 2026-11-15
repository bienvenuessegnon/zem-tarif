import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  origin?: { lat: number; lon: number; label: string };
  dest?: { lat: number; lon: number; label: string };
  geometrie?: [number, number][];
  hauteur?: number;
  pleinEcran?: boolean;
  paddingBas?: number;
};

function htmlCarte(
  origin?: Props['origin'],
  dest?: Props['dest'],
  geometrie?: [number, number][],
  paddingBas = 28,
): string {
  const payload = JSON.stringify({
    origin: origin ?? null,
    dest: dest ?? null,
    geometrie: geometrie ?? [],
    paddingBas,
  });
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #carte { height: 100%; margin: 0; background: #E8E8E4; }
    .leaflet-control-attribution {
      font-size: 10px;
      background: rgba(244,244,242,0.92) !important;
      color: #8A8A86;
    }
    .marqueur {
      width: 16px; height: 16px; border-radius: 16px;
      border: 2px solid #1C1917; box-sizing: border-box;
    }
    .marqueur.depart { background: #C9A227; }
    .marqueur.arrivee { background: #1C1917; }
  </style>
</head>
<body>
  <div id="carte"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const data = ${payload};
    const carte = L.map('carte', { zoomControl: true, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(carte);
    const bornes = [];
    function icone(classe) {
      return L.divIcon({ className: '', html: '<div class="marqueur ' + classe + '"></div>', iconSize: [16,16], iconAnchor: [8,8] });
    }
    if (data.origin) {
      const m = L.marker([data.origin.lat, data.origin.lon], { icon: icone('depart'), title: data.origin.label }).addTo(carte);
      m.bindTooltip(data.origin.label, { direction: 'top', offset: [0, -8] });
      bornes.push([data.origin.lat, data.origin.lon]);
    }
    if (data.dest) {
      const m = L.marker([data.dest.lat, data.dest.lon], { icon: icone('arrivee'), title: data.dest.label }).addTo(carte);
      m.bindTooltip(data.dest.label, { direction: 'top', offset: [0, -8] });
      bornes.push([data.dest.lat, data.dest.lon]);
    }
    if (data.geometrie && data.geometrie.length > 1) {
      const latlngs = data.geometrie.map(function (c) { return [c[1], c[0]]; });
      const ligne = L.polyline(latlngs, { color: '#1C1917', weight: 4, opacity: 0.85 });
      ligne.addTo(carte);
      carte.fitBounds(ligne.getBounds(), { paddingTopLeft: [28, 80], paddingBottomRight: [28, data.paddingBas || 28] });
    } else if (bornes.length === 2) {
      L.polyline(bornes, { color: '#1C1917', weight: 3, dashArray: '6 8', opacity: 0.7 }).addTo(carte);
      carte.fitBounds(L.latLngBounds(bornes), { paddingTopLeft: [28, 80], paddingBottomRight: [28, data.paddingBas || 28] });
    } else if (bornes.length === 1) {
      carte.setView(bornes[0], 14);
    } else {
      carte.setView([6.36, 2.42], 12);
    }
  </script>
</body>
</html>`;
}

export function CarteItineraire({ origin, dest, geometrie, hauteur = 210, pleinEcran = false, paddingBas = 28 }: Props) {
  const html = useMemo(
    () => htmlCarte(origin, dest, geometrie, paddingBas),
    [origin, dest, geometrie, paddingBas],
  );

  const cadre = [styles.cadre, pleinEcran ? styles.plein : { height: hauteur }];

  if (Platform.OS === 'web') {
    return (
      <View style={cadre}>
        <iframe
          title="Carte du trajet"
          srcDoc={html}
          style={{ width: '100%', height: '100%', borderWidth: 0, borderStyle: 'none' } as object}
          referrerPolicy="no-referrer"
        />
      </View>
    );
  }

  return (
    <View style={cadre}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        scrollEnabled={false}
        setSupportMultipleWindows={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cadre: {
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#E8E8E4',
  },
  plein: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 0,
    zIndex: 0,
  },
  web: { flex: 1, backgroundColor: '#EBE6DB' },
});

