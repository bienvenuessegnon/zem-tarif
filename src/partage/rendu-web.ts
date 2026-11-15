import { formatFcfa, formatKm } from '@/src/pricing/format';
import { SLOGAN } from '@/src/contenu/slogan';

export type DonneesCarte = {
  prix: number;
  bas: number;
  haut: number;
  distanceM: number;
  origin: string;
  dest: string;
};

/** Dessine la carte de prix (maquette 04) et renvoie un blob PNG. */
export async function rendreCartePng(donnees: DonneesCarte): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const largeur = 1080;
  const hauteur = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = largeur;
  canvas.height = hauteur;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const r = 72;
  ctx.fillStyle = '#111111';
  roundRect(ctx, 0, 0, largeur, hauteur, r);
  ctx.fill();

  ctx.fillStyle = '#F3B409';
  ctx.font = '700 42px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('Zém Tarif', 90, 160);

  ctx.fillStyle = '#F3B409';
  ctx.font = '700 220px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(formatFcfa(donnees.prix), 90, 520);

  ctx.fillStyle = '#C8C8C4';
  ctx.font = '500 36px "Plus Jakarta Sans", system-ui, sans-serif';
  const fourchette = `${formatFcfa(donnees.bas)} – ${formatFcfa(donnees.haut)}  ·  ${formatKm(donnees.distanceM / 1000)}`;
  ctx.fillText(fourchette, 90, 600);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '600 44px "Plus Jakarta Sans", system-ui, sans-serif';
  const trajet = couper(ctx, `${donnees.origin}  →  ${donnees.dest}`, largeur - 180);
  ctx.fillText(trajet, 90, 720);

  ctx.fillStyle = '#8A8A86';
  ctx.font = '500 32px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(SLOGAN, 90, 1180);
  ctx.fillText('zem-tarif.onrender.com', 90, 1232);

  return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function couper(ctx: CanvasRenderingContext2D, texte: string, max: number): string {
  if (ctx.measureText(texte).width <= max) return texte;
  let t = texte;
  while (t.length > 3 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

export async function telechargerBlob(blob: Blob, nom: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4_000);
}
