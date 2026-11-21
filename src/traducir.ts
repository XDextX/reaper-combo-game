// Traducción pura de teclas, botones y toques a acciones del juego.

export type Accion = 'L' | 'P' | 'E';
export type Vector = { x: number; y: number };
export type Pulsacion = { accion: Accion; t: number };

const ARRIBA = { x: 0, y: -1 };
const ABAJO = { x: 0, y: 1 };
const IZQUIERDA = { x: -1, y: 0 };
const DERECHA = { x: 1, y: 0 };

// KeyboardEvent.code: la posición física, así que AZERTY cae en el mismo sitio.
export const TECLAS_MOVER: Record<string, Vector> = {
  KeyW: ARRIBA, ArrowUp: ARRIBA,
  KeyS: ABAJO, ArrowDown: ABAJO,
  KeyA: IZQUIERDA, ArrowLeft: IZQUIERDA,
  KeyD: DERECHA, ArrowRight: DERECHA,
};
export const TECLAS_ACCION: Record<string, Accion> = { KeyJ: 'L', KeyK: 'P', Space: 'E' };

// Mapeo estándar de la Gamepad API: 0 inferior, 1 derecho, 2 izquierdo; 12-15 cruceta.
export const BOTONES_ACCION: Record<number, Accion> = { 0: 'L', 2: 'P', 1: 'E' };
export const BOTONES_MOVER: Record<number, Vector> = { 12: ARRIBA, 13: ABAJO, 14: IZQUIERDA, 15: DERECHA };

// Donde Espacio y Enter ya hacen algo: se les dejan a ellos.
const CONTROLES = new Set(['INPUT', 'BUTTON', 'SUMMARY', 'TEXTAREA', 'SELECT']);

/** Una tecla del juego sin Ctrl, Cmd ni Alt: los atajos del navegador y los controles con foco se dejan pasar. */
export function esTeclaDeJuego(
  e: { code: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean },
  destino?: EventTarget | null,
): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  const etiqueta = (destino as { tagName?: string } | null | undefined)?.tagName;
  if ((e.code === 'Space' || e.code === 'Enter') && etiqueta && CONTROLES.has(etiqueta)) return false;
  return Object.hasOwn(TECLAS_ACCION, e.code) || Object.hasOwn(TECLAS_MOVER, e.code);
}

/** Suma las direcciones de lo que está pulsado. */
export function sumar<K extends string | number>(pulsado: Iterable<K>, mapa: Record<K, Vector>): Vector {
  const v = { x: 0, y: 0 };
  for (const k of pulsado) {
    const d = mapa[k];
    if (d) { v.x += d.x; v.y += d.y; }
  }
  return v;
}

/** Recorta a longitud 1: la diagonal no va más rápida. */
export function limitar(v: Vector): Vector {
  const largo = Math.hypot(v.x, v.y);
  return largo > 1 ? { x: v.x / largo, y: v.y / largo } : v;
}

/** Zona muerta radial: por debajo del umbral, quieto; por encima, de 0 a 1 sin salto. */
export function zonaMuerta(v: Vector, umbral = 0.2): Vector {
  const largo = Math.hypot(v.x, v.y);
  if (largo < umbral) return { x: 0, y: 0 };
  const f = Math.min(1, (largo - umbral) / (1 - umbral)) / largo;
  return { x: v.x * f, y: v.y * f };
}

/** Lo que está pulsado ahora y no lo estaba antes. */
export function flancos<K>(antes: Set<K>, ahora: Set<K>): K[] {
  return [...ahora].filter((k) => !antes.has(k));
}

/** Joystick táctil: desplazamiento desde donde empezó el toque, en un radio. */
export function joystick(dx: number, dy: number, radio: number): Vector {
  return zonaMuerta(limitar({ x: dx / radio, y: dy / radio }), 0.15);
}
