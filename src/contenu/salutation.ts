export function salutation(heure: number, prenom?: string): string {
  let moment = 'Bonsoir';
  if (heure >= 5 && heure < 12) moment = 'Bonjour';
  else if (heure >= 12 && heure < 18) moment = 'Bon après-midi';
  const nom = (prenom ?? '').trim();
  const texte = nom ? `${moment} ${nom}` : moment;
  return texte.toUpperCase();
}
