// Combos con nombre y contador con multiplicador (spec, «Combos»).
import type { Accion, Pulsacion } from './traducir';

export type Combo = { nombre: string; secuencia: Accion[] };

// Valores iniciales: se ajustan jugando.
export const COMBOS: Combo[] = [
  { nombre: 'Siega', secuencia: ['L', 'L', 'L'] },
  { nombre: 'Guadañazo', secuencia: ['L', 'L', 'P'] },
  { nombre: 'Juicio', secuencia: ['P', 'P'] },
  { nombre: 'Paso fantasma', secuencia: ['E', 'L'] },
  { nombre: 'Cosecha', secuencia: ['L', 'P', 'E', 'P'] },
];
export const VENTANA = 400; // ms máximos entre una acción y la siguiente
export const RUPTURA = 2000; // ms sin conectar un golpe y el contador se rompe
export const GOLPES_POR_NIVEL = 10;
export const MULTIPLICADOR_MAX = 4;

/** Combo más largo con el que acaba el historial, o null. */
export function buscar(historial: Accion[], combos = COMBOS): Combo | null {
  let mejor: Combo | null = null;
  for (const c of combos) {
    const cola = historial.slice(-c.secuencia.length);
    const coincide = cola.length === c.secuencia.length && cola.every((a, i) => a === c.secuencia[i]);
    if (coincide && (!mejor || c.secuencia.length > mejor.secuencia.length)) mejor = c;
  }
  return mejor;
}

/** Guarda las acciones dentro de la ventana y avisa cuando una completa un combo. */
export function crearDetector(combos = COMBOS) {
  let historial: Accion[] = [];
  let ultima = -Infinity;
  return {
    get historial(): readonly Accion[] { return historial; },
    registrar(p: Pulsacion): Combo | null {
      if (p.t - ultima > VENTANA) historial = [];
      ultima = p.t;
      historial.push(p.accion);
      const combo = buscar(historial, combos);
      if (combo) historial = []; // un combo cerrado no presta acciones al siguiente
      return combo;
    },
  };
}

export function multiplicador(golpes: number): number {
  return Math.min(MULTIPLICADOR_MAX, 1 + Math.floor(golpes / GOLPES_POR_NIVEL));
}

/** Cuenta los golpes que conectan; se rompe tras RUPTURA ms sin conectar o al recibir daño. */
export function crearContador() {
  let golpes = 0;
  let ultimo = -Infinity;
  return {
    get golpes() { return golpes; },
    get multiplicador() { return multiplicador(golpes); },
    golpe(t: number) { golpes++; ultimo = t; },
    actualizar(t: number) { if (t - ultimo > RUPTURA) golpes = 0; },
    romper() { golpes = 0; },
  };
}
