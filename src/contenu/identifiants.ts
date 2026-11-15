export function nouvelId(): string {
  const alea = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${alea}`;
}
