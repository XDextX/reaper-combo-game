import { describe, expect, it } from 'vitest';
import { COMBOS } from './combos';
import {
  LEJOS, aparecer,
  AVISO, DISTANCIA_LANZADOR, EN_ARENA, ESPERA_REAPARECER, MUERTE, RECARGA,
  actualizarEnemigo, crearCombate, crearEnemigo, pasoCombate, recibirGolpe, type Enemigo,
} from './enemigos';
import type { Golpe } from './espiritu';

const caja = { x: 0, y: 0, w: 1, h: 1 };
const golpe = (accion: 'L' | 'P', combo = false): Golpe => ({ accion, caja, empuje: 0, combo: combo ? COMBOS[0] : null });
function pasos(e: Enemigo, n: number, objetivo = { x: 100, y: 100 }) {
  const ataques = [];
  for (let i = 0; i < n; i++) ataques.push(actualizarEnemigo(e, objetivo));
  return ataques.filter((a) => a.caja || a.proyectil);
}

describe('daño', () => {
  it('L quita 1, P quita 2 y el remate de un combo quita 3', () => {
    const e = crearEnemigo('escudado', 100, 100);
    e.mira = { x: 1, y: 0 }; // de espaldas al espíritu, que está a la izquierda
    recibirGolpe(e, golpe('L'), { x: 90, y: 100 });
    expect(e.vida).toBe(3);
    const s = crearEnemigo('segador', 100, 100);
    expect(recibirGolpe(s, golpe('P'), { x: 90, y: 100 })).toBe('dano');
    expect(s.vida).toBe(1);
    expect(recibirGolpe(crearEnemigo('segador', 100, 100), golpe('L', true), { x: 90, y: 100 })).toBe('muerte');
  });
  it('un muerto no recibe más golpes', () => {
    const e = crearEnemigo('lanzador', 100, 100);
    recibirGolpe(e, golpe('P'), { x: 90, y: 100 });
    expect(recibirGolpe(e, golpe('P'), { x: 90, y: 100 })).toBe('nada');
  });
});

describe('escudado', () => {
  const deFrente = () => {
    const e = crearEnemigo('escudado', 100, 100);
    e.mira = { x: -1, y: 0 }; // mira al espíritu, que está a la izquierda
    return e;
  };
  it('para el ligero que le llega de frente', () => {
    const e = deFrente();
    expect(recibirGolpe(e, golpe('L'), { x: 90, y: 100 })).toBe('bloqueo');
    expect(e.vida).toBe(4);
  });
  it('no para el pesado, el remate de un combo ni el ligero por la espalda', () => {
    expect(recibirGolpe(deFrente(), golpe('P'), { x: 90, y: 100 })).toBe('dano');
    expect(recibirGolpe(deFrente(), golpe('L', true), { x: 90, y: 100 })).toBe('dano');
    expect(recibirGolpe(deFrente(), golpe('L'), { x: 110, y: 100 })).toBe('dano');
  });
});

describe('segador', () => {
  it('se acerca, avisa 0,5 s y golpea delante', () => {
    const e = crearEnemigo('segador', 160, 100);
    pasos(e, 200);
    const nuevo = crearEnemigo('segador', 115, 100);
    pasos(nuevo, 1);
    expect(nuevo.estado).toBe('aviso');
    expect(pasos(nuevo, AVISO - 1)).toEqual([]);
    const [a] = pasos(nuevo, 1);
    expect(a.caja).toBeDefined();
    expect(e.x).toBeLessThan(160);
  });
  it('un golpe recibido cancela su aviso', () => {
    const e = crearEnemigo('segador', 115, 100);
    pasos(e, 1);
    recibirGolpe(e, golpe('L'), { x: 100, y: 100 });
    expect(pasos(e, AVISO)).toEqual([]);
  });
});

describe('lanzador', () => {
  it('dispara cada 2 s con aviso y se queda a distancia', () => {
    const e = crearEnemigo('lanzador', 130, 100);
    const ataques = pasos(e, RECARGA + AVISO + 1);
    expect(ataques).toHaveLength(1);
    expect(ataques[0].proyectil!.vx).toBeLessThan(0);
    pasos(e, 600);
    expect(Math.abs(Math.hypot(e.x - 100, e.y - 100) - DISTANCIA_LANZADOR)).toBeLessThanOrEqual(21);
  });
});

describe('combate', () => {
  it('reaparece 1 s después de terminar de morir y mantiene 3', () => {
    const c = crearCombate(() => 0.5);
    const cuerpo = { x: 0, y: 0, w: 0, h: 0 };
    recibirGolpe(c.enemigos[0], golpe('L', true), { x: 0, y: 0 });
    recibirGolpe(c.enemigos[0], golpe('L', true), { x: 0, y: 0 });
    for (let i = 0; i < MUERTE; i++) pasoCombate(c, { x: 240, y: 135 }, cuerpo, null, () => {});
    expect(c.enemigos).toHaveLength(EN_ARENA - 1);
    for (let i = 0; i < ESPERA_REAPARECER; i++) pasoCombate(c, { x: 240, y: 135 }, cuerpo, null, () => {});
    expect(c.enemigos).toHaveLength(EN_ARENA);
  });
  it('un proyectil daña al tocar y un golpe lo corta', () => {
    const c = crearCombate(() => 0);
    c.enemigos = [];
    c.esperas = [9999, 9999, 9999];
    let heridas = 0;
    c.proyectiles = [{ x: 50, y: 50, vx: 1, vy: 0, vida: 100 }];
    pasoCombate(c, { x: 0, y: 0 }, { x: 51, y: 48, w: 4, h: 4 }, null, () => heridas++);
    expect(heridas).toBe(1);
    c.proyectiles = [{ x: 50, y: 50, vx: 1, vy: 0, vida: 100 }];
    pasoCombate(c, { x: 0, y: 0 }, { x: 0, y: 0, w: 0, h: 0 }, { x: 49, y: 48, w: 6, h: 6 }, () => heridas++);
    expect(c.proyectiles).toEqual([]);
    expect(heridas).toBe(1);
  });
});

describe('aparición', () => {
  it('no aparece pegado al espíritu si está junto a un borde', () => {
    let n = 0;
    const azar = () => [0, 0.05, 0, 0.3, 0.5][n++ % 5]; // primero un punto al lado del espíritu
    const e = aparecer(azar, { x: 20, y: 30 });
    expect(Math.hypot(e.x - 20, e.y - 30)).toBeGreaterThanOrEqual(LEJOS);
  });
});
