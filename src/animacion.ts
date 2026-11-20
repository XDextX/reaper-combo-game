// Qué fotograma toca en cada animación, sin depender del navegador.

/** Cuántos fotogramas tiene una animación: los que se llaman `nombre-1`, `nombre-2`… */
export function cuantos(fotogramas: Record<string, unknown>, animacion: string): number {
  const patron = new RegExp(`^${animacion}-\\d+$`);
  return Object.keys(fotogramas).filter((k) => patron.test(k)).length;
}

/** Fotograma de una animación según el avance de 0 a 1 (el último se queda al llegar a 1). */
export function fotogramaPorAvance(fotogramas: Record<string, unknown>, animacion: string, avance: number): string {
  const n = cuantos(fotogramas, animacion);
  return `${animacion}-${Math.min(n, 1 + Math.floor(avance * n))}`;
}

/** Fotograma de una animación en bucle, con `pasos` pasos por fotograma. */
export function fotogramaEnBucle(fotogramas: Record<string, unknown>, animacion: string, tick: number, pasos: number): string {
  const n = cuantos(fotogramas, animacion);
  return `${animacion}-${1 + (Math.floor(tick / pasos) % n)}`;
}
