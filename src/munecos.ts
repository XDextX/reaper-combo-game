// Muñecos de práctica: no mueren ni atacan; retroceden al recibir y vuelven a su sitio.
import type { Caja, Golpe } from './espiritu';

export const ANCHO_MUNECO = 12;
export const ALTO_MUNECO = 18;
export const DESTELLO = 10; // pasos

export function crearMuneco(x: number, y: number) {
  return { x, y, casaX: x, casaY: y, vx: 0, vy: 0, golpeado: 0 };
}
export type Muneco = ReturnType<typeof crearMuneco>;

export function cajaMuneco(m: Muneco): Caja {
  return { x: m.x - ANCHO_MUNECO / 2, y: m.y - ALTO_MUNECO / 2, w: ANCHO_MUNECO, h: ALTO_MUNECO };
}

export function solapan(a: Caja, b: Caja): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/** Aplica el golpe si alcanza al muñeco; lo empuja en dirección contraria a quien golpea. */
export function recibir(m: Muneco, golpe: Golpe, desde: { x: number; y: number }): boolean {
  if (!solapan(golpe.caja, cajaMuneco(m))) return false;
  const dx = m.x - desde.x;
  const dy = m.y - desde.y;
  const largo = Math.hypot(dx, dy) || 1;
  m.vx = (dx / largo) * golpe.empuje;
  m.vy = (dy / largo) * golpe.empuje;
  m.golpeado = DESTELLO;
  return true;
}

export function actualizarMuneco(m: Muneco): void {
  m.x += m.vx;
  m.y += m.vy;
  m.vx *= 0.75;
  m.vy *= 0.75;
  // Vuelve despacio a su sitio.
  m.x += (m.casaX - m.x) * 0.04;
  m.y += (m.casaY - m.y) * 0.04;
  if (m.golpeado > 0) m.golpeado--;
}
