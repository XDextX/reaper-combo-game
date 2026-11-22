// Vida del espíritu en el combate (spec, «Combate»).
export const VIDA_MAX = 5;
export const INVULNERABLE = 60; // pasos: 1 s a 60 Hz

export function crearVida() {
  return { vida: VIDA_MAX, invulnerable: 0, golpes: 0, mejorCombo: 0 };
}
export type Vida = ReturnType<typeof crearVida>;

/** Un ataque alcanza al espíritu; devuelve si le hizo daño (no lo hace esquivando ni recién herido). */
export function herir(v: Vida, esquivando: boolean): boolean {
  if (v.vida === 0 || v.invulnerable > 0 || esquivando) return false;
  v.vida--;
  v.invulnerable = INVULNERABLE;
  return true;
}

export function pasoVida(v: Vida): void {
  if (v.invulnerable > 0) v.invulnerable--;
}

/** Apunta un golpe dado, con el combo que lleva el contador, para el resumen de «Has caído». */
export function anotar(v: Vida, combo: number): void {
  v.golpes++;
  v.mejorCombo = Math.max(v.mejorCombo, combo);
}

/** Un alma que cura: +1 corazón sin pasar del máximo. */
export function curar(v: Vida): void {
  if (v.vida > 0) v.vida = Math.min(VIDA_MAX, v.vida + 1);
}
