export const couleurs = {
  papier: '#F4F1EA',
  papierFonce: '#EBE6DB',
  carte: '#FFFCF7',
  encre: '#1C1917',
  secondaire: '#5E5953',
  muet: '#8A847B',
  ligne: '#DDD6C9',
  or: '#C9A227',
  orFonce: '#8A6D12',
  orPale: '#F3E6B8',
  vert: '#2F5D3A',
  vertPale: '#E7F0E8',
  alerte: '#8A3B21',
  alertePale: '#F6E7E1',
  nuit: '#1C1917',
  blanc: '#FFFFFF',
} as const;

export type Couleur = (typeof couleurs)[keyof typeof couleurs];
