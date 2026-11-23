// El espíritu: máquina de estados, movimiento y golpes (spec, «Alcance» y «Combos»).
import type { Combo } from './combos';
import { solapan } from './munecos';
import { ALTO, ANCHO } from './pantalla';
import { limitar, type Accion, type Vector } from './traducir';

export type Estado = 'quieto' | 'andar' | 'atacando' | 'esquivando';
export type Caja = { x: number; y: number; w: number; h: number };
export type Golpe = { accion: Accion; caja: Caja; empuje: number; combo: Combo | null };

// En pasos de 60 Hz.
export const DURACION: Record<Accion, number> = { L: 12, P: 22, E: 14 };
export const ACTIVO: Record<'L' | 'P', number> = { L: 4, P: 10 };
const VELOCIDAD = 1.2;
const VEL_ESQUIVA = 3;
export const LIMITES = { x0: 16, y0: 20, x1: ANCHO - 16, y1: ALTO - 14 };
const MAX_ESPERA = 3;
export const IMAN = 30; // a esta distancia el golpe se gira solo hacia el enemigo más cercano: lo que alcanza el golpe

type Forma = { w: number; h: number; empuje: number; centrado?: boolean; avance?: number };
const BASE: Record<'L' | 'P', Forma> = { L: { w: 18, h: 16, empuje: 2 }, P: { w: 20, h: 18, empuje: 4 } };
// Cómo cambia el golpe final de cada combo; valores iniciales que se ajustan jugando.
export const EFECTO: Record<string, Forma> = {
  Siega: { w: 16, h: 16, empuje: 5 },
  Guadañazo: { w: 30, h: 26, empuje: 4 },
  Juicio: { w: 22, h: 20, empuje: 8 },
  'Paso fantasma': { w: 16, h: 16, empuje: 4, avance: 8 },
  Cosecha: { w: 48, h: 48, empuje: 6, centrado: true },
};

export function crearEspiritu(x: number, y: number) {
  return {
    x,
    y,
    mira: { x: 1, y: 0 } as Vector,
    miraAntes: null as Vector | null, // la mira de antes de que el imán girase el golpe
    estado: 'quieto' as Estado,
    accion: null as Accion | null,
    combo: null as Combo | null,
    paso: 0,
    esquivaExtra: 0, // pasos de más que dura la esquiva (túnica de sombra)
    // Pulsaciones que esperan a que acabe la acción actual; no se pisan, así un combo no se pierde.
    siguientes: [] as { accion: Accion; combo: Combo | null }[],
  };
}
export type Espiritu = ReturnType<typeof crearEspiritu>;

const ocupado = (e: Espiritu) => e.estado === 'atacando' || e.estado === 'esquivando';

function empezar(e: Espiritu, accion: Accion, combo: Combo | null): void {
  e.estado = accion === 'E' ? 'esquivando' : 'atacando';
  if (accion === 'E' && e.miraAntes) e.mira = e.miraAntes; // la esquiva va hacia donde ibas, no hacia lo golpeado
  if (accion === 'E') e.miraAntes = null;
  e.accion = accion;
  e.combo = combo;
  e.paso = 0;
}

/** Una acción pulsada: empieza ya o, si está ocupado, espera a que acabe la actual. */
export function pedir(e: Espiritu, accion: Accion, combo: Combo | null = null): void {
  if (!ocupado(e)) empezar(e, accion, combo);
  else if (e.siguientes.length < MAX_ESPERA) e.siguientes.push({ accion, combo });
  else if (combo) e.siguientes[MAX_ESPERA - 1] = { accion, combo };
}

const cajaDe = (e: Espiritu, f: Forma): Caja => {
  const cx = f.centrado ? e.x : e.x + e.mira.x * (6 + f.w / 2);
  const cy = f.centrado ? e.y : e.y + e.mira.y * (6 + f.h / 2);
  return { x: cx - f.w / 2, y: cy - f.h / 2, w: f.w, h: f.h };
};

/** Gira la mira hacia el blanco más cercano dentro del imán, salvo que el golpe ya toque algo (enemigo o proyectil). */
function apuntar(e: Espiritu, f: Forma, blancos: Vector[], cajas: Caja[]): void {
  const caja = cajaDe(e, f);
  if (cajas.some((c) => solapan(caja, c))) return;
  let mejor: Vector | null = null;
  let cerca = IMAN;
  for (const b of blancos) {
    const d = Math.hypot(b.x - e.x, b.y - e.y);
    if (d > 0 && d <= IMAN && (!mejor || d < cerca)) { cerca = d; mejor = b; } // en un empate gana el primero
  }
  if (!mejor) return;
  e.miraAntes ??= e.mira; // en un combo se guarda la de antes del primer giro
  e.mira = { x: (mejor.x - e.x) / cerca, y: (mejor.y - e.y) / cerca };
}

function golpeDe(e: Espiritu, accion: 'L' | 'P', blancos: Vector[], cajas: Caja[]): Golpe {
  const f = (e.combo && EFECTO[e.combo.nombre]) || BASE[accion];
  if (!f.centrado) apuntar(e, f, blancos, cajas);
  if (f.avance) {
    e.x += e.mira.x * f.avance;
    e.y += e.mira.y * f.avance;
  }
  return { accion, combo: e.combo, empuje: f.empuje, caja: cajaDe(e, f) };
}

/** Un paso fijo. Devuelve el golpe si este paso es el que conecta. `blancos` son los centros que atrae el imán y `cajas` lo que ya toca el golpe sin girar (enemigos y proyectiles). */
export function actualizar(e: Espiritu, mover: Vector, blancos: Vector[] = [], cajas: Caja[] = []): Golpe | null {
  const v = limitar(mover);
  const quiereMover = v.x !== 0 || v.y !== 0;
  if (quiereMover && e.estado !== 'atacando') {
    const largo = Math.hypot(v.x, v.y);
    e.mira = { x: v.x / largo, y: v.y / largo };
    e.miraAntes = null;
  }
  let golpe: Golpe | null = null;
  if (ocupado(e)) {
    e.paso++;
    const accion = e.accion!;
    if (e.estado === 'esquivando') {
      e.x += e.mira.x * VEL_ESQUIVA;
      e.y += e.mira.y * VEL_ESQUIVA;
    } else if (accion !== 'E' && e.paso === ACTIVO[accion]) {
      golpe = golpeDe(e, accion, blancos, cajas);
    }
    if (e.paso >= DURACION[accion] + (accion === 'E' ? e.esquivaExtra : 0)) {
      e.estado = 'quieto';
      e.accion = null;
      e.combo = null;
      const s = e.siguientes.shift();
      if (s) empezar(e, s.accion, s.combo);
    }
  } else {
    e.estado = quiereMover ? 'andar' : 'quieto';
    e.x += v.x * VELOCIDAD;
    e.y += v.y * VELOCIDAD;
  }
  e.x = Math.min(LIMITES.x1, Math.max(LIMITES.x0, e.x));
  e.y = Math.min(LIMITES.y1, Math.max(LIMITES.y0, e.y));
  return golpe;
}
