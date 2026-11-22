// Enemigos del combate (spec, «Combate»): segador menor, lanzador y escudado, sus proyectiles y la reaparición.
import type { Caja, Golpe } from './espiritu';
import { LIMITES } from './espiritu';
import { solapan } from './munecos';
import { aplicarEstado, crearEstados, gastarMarca, pasoEstados, type Estado } from './estados';
import type { Vector } from './traducir';

export type Tipo = 'segador' | 'lanzador' | 'escudado';
export type EstadoEnemigo = 'andar' | 'aviso' | 'recupera' | 'golpeado' | 'muerto';
export const TIPOS: Tipo[] = ['segador', 'lanzador', 'escudado'];

export const VIDA: Record<Tipo, number> = { segador: 6, lanzador: 4, escudado: 8 };
const VELOCIDAD: Record<Tipo, number> = { segador: 0.6, lanzador: 0.5, escudado: 0.45 };
export const AVISO = 30; // pasos: 0,5 s de aviso antes de cada ataque
export const RECARGA = 120; // pasos: el lanzador dispara cada 2 s
export const RECUPERA = 40;
const ATURDIDO = 12;
export const MUERTE = 30;
const ALCANCE = 22; // a esta distancia el cuerpo a cuerpo empieza su aviso
export const DISTANCIA_LANZADOR = 120;
const VEL_PROYECTIL = 1.2;
const VIDA_PROYECTIL = 360;
export const EN_ARENA = 3;
export const ESPERA_REAPARECER = 60; // pasos: 1 s
export const ANCHO_ENEMIGO = 14;
export const ALTO_ENEMIGO = 18;

export function crearEnemigo(tipo: Tipo, x: number, y: number) {
  return {
    tipo, x, y, vida: VIDA[tipo], estado: 'andar' as EstadoEnemigo, t: 0,
    recarga: RECARGA, mira: { x: -1, y: 0 } as Vector, vx: 0, vy: 0, estados: crearEstados(),
  };
}
export type Enemigo = ReturnType<typeof crearEnemigo>;
export type Proyectil = { x: number; y: number; vx: number; vy: number; vida: number };

export function cajaEnemigo(e: Enemigo): Caja {
  return { x: e.x - ANCHO_ENEMIGO / 2, y: e.y - ALTO_ENEMIGO / 2, w: ANCHO_ENEMIGO, h: ALTO_ENEMIGO };
}
export function cajaProyectil(p: Proyectil): Caja {
  return { x: p.x - 2, y: p.y - 2, w: 4, h: 4 };
}

/** Daño de un golpe del espíritu: el remate de un combo quita 3, P quita 2 y L quita 1. */
export function dano(g: Golpe): number {
  return g.combo ? 3 : g.accion === 'P' ? 2 : 1;
}

export type Resultado = 'nada' | 'bloqueo' | 'dano' | 'muerte';

/** Aplica un golpe del espíritu (que está en `desde`) al enemigo, con su daño extra y el estado que aplica. */
export function recibirGolpe(e: Enemigo, g: Golpe, desde: Vector, extra = 0, estado: Estado | null = null, rumbo?: Vector): Resultado {
  if (e.estado === 'muerto') return 'nada';
  const dx = e.x - desde.x;
  const dy = e.y - desde.y;
  // El escudado para los ligeros sueltos que le llegan de frente: el golpe viene del lado al que mira.
  const deFrente = e.mira.x * -dx + e.mira.y * -dy > 0;
  if (e.tipo === 'escudado' && g.accion === 'L' && !g.combo && deFrente) return 'bloqueo';
  e.vida = Math.max(0, e.vida - (dano(g) + extra) * gastarMarca(e.estados)); // la marca de un golpe anterior lo dobla
  if (estado) aplicarEstado(e.estados, estado, rumbo);
  const largo = Math.hypot(dx, dy) || 1;
  e.vx = (dx / largo) * g.empuje;
  e.vy = (dy / largo) * g.empuje;
  e.estado = e.vida === 0 ? 'muerto' : 'golpeado';
  e.t = e.vida === 0 ? MUERTE : ATURDIDO;
  return e.vida === 0 ? 'muerte' : 'dano';
}

export type Ataque = { caja?: Caja; proyectil?: Proyectil; murio?: boolean };

/** Un paso del enemigo hacia (o lejos de) el espíritu. Devuelve el ataque que suelta en este paso, si hay. */
export function actualizarEnemigo(e: Enemigo, objetivo: Vector): Ataque {
  const x0 = e.x;
  const y0 = e.y;
  e.x += e.vx;
  e.y += e.vy;
  e.vx *= 0.75;
  e.vy *= 0.75;
  const s = e.estados;
  if (s.ceguera > 0) objetivo = s.rumbo; // cegado anda hacia un punto al azar y, si ataca, apunta mal
  const lento = s.lentitud > 0;
  const pasoLento = lento && s.lentitud % 2 === 1; // lento: sus tiempos corren a la mitad
  const dx = objetivo.x - e.x;
  const dy = objetivo.y - e.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ataque: Ataque = {};
  if (e.t > 0 && !pasoLento && s.aturdido === 0) e.t--;
  switch (s.aturdido > 0 && e.estado !== 'muerto' ? 'aturdido' : e.estado) {
    case 'aturdido':
      break;
    case 'muerto':
      break;
    case 'golpeado':
    case 'recupera':
      if (e.t === 0) e.estado = 'andar';
      break;
    case 'aviso':
      if (e.t > 0) break;
      if (e.tipo === 'lanzador') {
        ataque.proyectil = { x: e.x, y: e.y, vx: e.mira.x * VEL_PROYECTIL, vy: e.mira.y * VEL_PROYECTIL, vida: VIDA_PROYECTIL };
        e.recarga = RECARGA;
        e.estado = 'recupera'; // se queda quieto un momento tras lanzar (y se ve su animación de ataque)
        e.t = RECUPERA;
      } else {
        ataque.caja = { x: e.x + e.mira.x * 12 - 10, y: e.y + e.mira.y * 12 - 8, w: 20, h: 16 };
        e.estado = 'recupera';
        e.t = RECUPERA;
      }
      break;
    case 'andar': {
      e.mira = { x: dx / dist, y: dy / dist };
      const v = VELOCIDAD[e.tipo] * (lento ? 0.5 : 1);
      if (e.tipo === 'lanzador') {
        // Se queda a unos 120 px: se aleja si está cerca y se acerca si está lejos.
        const sentido = dist < DISTANCIA_LANZADOR - 20 ? -1 : dist > DISTANCIA_LANZADOR + 20 ? 1 : 0;
        e.x += e.mira.x * v * sentido;
        e.y += e.mira.y * v * sentido;
        if (!pasoLento && --e.recarga <= 0) { e.estado = 'aviso'; e.t = AVISO; }
      } else if (dist <= ALCANCE) {
        e.estado = 'aviso';
        e.t = AVISO;
      } else {
        e.x += e.mira.x * v;
        e.y += e.mira.y * v;
      }
    }
  }
  e.x = Math.min(LIMITES.x1, Math.max(LIMITES.x0, e.x));
  e.y = Math.min(LIMITES.y1, Math.max(LIMITES.y0, e.y));
  const herida = pasoEstados(s, Math.hypot(e.x - x0, e.y - y0));
  if (herida > 0 && e.estado !== 'muerto') {
    e.vida = Math.max(0, e.vida - herida);
    if (e.vida === 0) { e.estado = 'muerto'; e.t = MUERTE; ataque.murio = true; }
  }
  return ataque;
}

/** La quemadura salta a los enemigos vivos que están a menos de 30 px de uno que arde. */
export function propagarQuemadura(enemigos: Enemigo[]): void {
  const ardiendo = enemigos.filter((e) => e.estado !== 'muerto' && e.estados.quemadura > 0);
  for (const e of enemigos) {
    if (e.estado === 'muerto' || e.estados.quemadura > 0) continue;
    if (ardiendo.some((f) => Math.hypot(f.x - e.x, f.y - e.y) < CONTAGIO)) aplicarEstado(e.estados, 'quemadura');
  }
}
const CONTAGIO = 30;

/** Mueve el proyectil; devuelve false cuando hay que quitarlo (se apagó o salió de la arena). */
export function actualizarProyectil(p: Proyectil): boolean {
  p.x += p.vx;
  p.y += p.vy;
  return --p.vida > 0 && p.x > LIMITES.x0 - 8 && p.x < LIMITES.x1 + 8 && p.y > LIMITES.y0 - 8 && p.y < LIMITES.y1 + 8;
}

export const LEJOS = 80; // un enemigo nuevo no aparece más cerca del espíritu que esto

/** Enemigo nuevo en un punto al azar de uno de los cuatro bordes, lejos de `espiritu` si se puede. */
export function aparecer(azar = Math.random, espiritu?: Vector): Enemigo {
  const tipo = TIPOS[Math.floor(azar() * TIPOS.length)];
  let x = 0;
  let y = 0;
  for (let intento = 0; intento < 8; intento++) {
    const lado = Math.floor(azar() * 4);
    const t = azar();
    x = lado === 0 ? LIMITES.x0 : lado === 1 ? LIMITES.x1 : LIMITES.x0 + t * (LIMITES.x1 - LIMITES.x0);
    y = lado === 2 ? LIMITES.y0 : lado === 3 ? LIMITES.y1 : LIMITES.y0 + t * (LIMITES.y1 - LIMITES.y0);
    if (!espiritu || Math.hypot(x - espiritu.x, y - espiritu.y) >= LEJOS) break;
  }
  return crearEnemigo(tipo, x, y);
}

/** La arena del combate: siempre 3 enemigos, contando los que están muriendo o por reaparecer. */
export function crearCombate(azar = Math.random, espiritu?: Vector) {
  return {
    enemigos: Array.from({ length: EN_ARENA }, () => aparecer(azar, espiritu)),
    proyectiles: [] as Proyectil[],
    esperas: [] as number[],
  };
}
export type Combate = ReturnType<typeof crearCombate>;

/**
 * Un paso del combate. `alcanza` se llama con cada ataque enemigo que toca la caja del espíritu,
 * y `corte` es la caja del golpe del espíritu en este paso (corta proyectiles), si hay.
 */
export function pasoCombate(c: Combate, objetivo: Vector, cuerpo: Caja, corte: Caja | null, alcanza: () => void, azar = Math.random, alMorir: (e: Enemigo) => void = () => {}): void {
  for (const e of c.enemigos) {
    const a = actualizarEnemigo(e, objetivo);
    if (a.caja && solapan(a.caja, cuerpo)) alcanza();
    if (a.proyectil) c.proyectiles.push(a.proyectil);
    if (a.murio) alMorir(e); // murió por un estado (quemadura, veneno, sangrado)
  }
  propagarQuemadura(c.enemigos);
  c.proyectiles = c.proyectiles.filter((p) => {
    if (!actualizarProyectil(p)) return false;
    if (corte && solapan(corte, cajaProyectil(p))) return false;
    if (solapan(cuerpo, cajaProyectil(p))) { alcanza(); return false; }
    return true;
  });
  const antes = c.enemigos.length;
  c.enemigos = c.enemigos.filter((e) => e.estado !== 'muerto' || e.t > 0);
  for (let i = c.enemigos.length; i < antes; i++) c.esperas.push(ESPERA_REAPARECER);
  c.esperas = c.esperas.map((t) => t - 1).filter((t) => {
    if (t > 0) return true;
    c.enemigos.push(aparecer(azar, objetivo));
    return false;
  });
}
