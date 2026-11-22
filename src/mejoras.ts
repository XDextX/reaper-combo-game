// Mejoras del alma inestable (spec, «Componentes RPG»). Se acumulan y se pierden al caer.
import { curar, type Vida } from './vida';

export type Mejora = 'vida' | 'dano' | 'robo' | 'infusion';
export const MEJORAS: Record<Mejora, { nombre: string; texto: string }> = {
  vida: { nombre: 'Más vida', texto: '+1 corazón máximo y te cura uno.' },
  dano: { nombre: 'Más daño', texto: '+1 de daño al golpe pesado y a los remates de combo.' },
  robo: { nombre: 'Robo de vida', texto: 'Cada 10 golpes de combo seguidos recuperas 1 corazón.' },
  infusion: { nombre: 'Infusión', texto: 'Tus golpes aplican un estado alterado al azar.' },
};
// shortcut: la infusión entra en el sorteo con la tarea 3 del plan RPG (estados alterados).
const DISPONIBLES: Mejora[] = ['vida', 'dano', 'robo'];
export const ROBO_CADA = 10;

export function crearMejoras(): Record<Mejora, number> {
  return { vida: 0, dano: 0, robo: 0, infusion: 0 };
}
export type Mejoras = ReturnType<typeof crearMejoras>;

/** Hasta 3 mejoras distintas al azar. */
export function sortear(azar = Math.random): Mejora[] {
  const bolsa = [...DISPONIBLES];
  for (let i = bolsa.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [bolsa[i], bolsa[j]] = [bolsa[j], bolsa[i]];
  }
  return bolsa.slice(0, 3);
}

export function aplicar(m: Mejoras, v: Vida, mejora: Mejora): void {
  m[mejora]++;
  if (mejora === 'vida') {
    v.vidaMax++;
    curar(v);
  }
}

/** Daño extra de un golpe: solo el pesado y los remates de combo. */
export function danoExtra(m: Mejoras, pesadoOCombo: boolean): number {
  return pesadoOCombo ? m.dano : 0;
}

/** Llamar con cada golpe que acierta y el número de golpes del combo: el robo cura cada 10 seguidos. */
export function robar(m: Mejoras, v: Vida, golpesCombo: number): boolean {
  if (m.robo === 0 || golpesCombo === 0 || golpesCombo % ROBO_CADA !== 0 || v.vida === v.vidaMax) return false;
  for (let i = 0; i < m.robo; i++) curar(v); // cada robo acumulado cura un corazón más
  return true;
}
