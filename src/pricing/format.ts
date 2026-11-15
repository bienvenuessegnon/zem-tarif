export function formatFcfa(valeur: number): string {
  const n = Math.round(valeur);
  const corps = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${corps} F`;
}

export function formatFcfaLong(valeur: number): string {
  return `${formatFcfa(valeur)} CFA`;
}

export function formatKm(distanceKm: number): string {
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1).replace('.', ',')} km`;
  }
  return `${distanceKm.toFixed(1).replace('.', ',')} km`.replace(',0 km', ' km');
}

export function formatDuree(secondes: number): string {
  const total = Math.max(0, Math.round(secondes / 60));
  if (total < 1) {
    return 'moins d’une minute';
  }
  if (total < 60) {
    return `${total} min`;
  }
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (m === 0) {
    return `${h} h`;
  }
  return `${h} h ${m} min`;
}
