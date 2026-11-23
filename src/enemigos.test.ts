import { describe, expect, it } from 'vitest';
import { COMBOS } from './combos';
import {
  LEJOS, aparecer,
  AVISO, DISTANCIA_LANZADOR, VIDA, EN_ARENA, ESPERA_REAPARECER, MUERTE, RECARGA,
  actualizarEnemigo, crearCombate, crearEnemigo, golpearEnemigos, pasoCombate, propagarQuemadura, recibirGolpe, type Enemigo,
} from './enemigos';
import type { Golpe } from './espiritu';
import { aplicarEstado } from './estados';

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
    expect(e.vida).toBe(VIDA.escudado - 1);
    const s = crearEnemigo('segador', 100, 100);
    expect(recibirGolpe(s, golpe('P'), { x: 90, y: 100 })).toBe('dano');
    expect(s.vida).toBe(VIDA.segador - 2);
    recibirGolpe(s, golpe('L', true), { x: 90, y: 100 });
    expect(s.vida).toBe(VIDA.segador - 5);
  });
  it('un muerto no recibe más golpes', () => {
    const e = crearEnemigo('lanzador', 100, 100);
    e.vida = 2;
    expect(recibirGolpe(e, golpe('P'), { x: 90, y: 100 })).toBe('muerte');
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
    expect(e.vida).toBe(VIDA.escudado);
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
  it('dispara cada 2,5 s con aviso y se queda a distancia', () => {
    const e = crearEnemigo('lanzador', 130, 100);
    const ataques = pasos(e, RECARGA + AVISO + 1);
    expect(ataques).toHaveLength(1);
    expect(ataques[0].proyectil!.vx).toBeLessThan(0);
    pasos(e, 600);
    expect(Math.abs(Math.hypot(e.x - 100, e.y - 100) - DISTANCIA_LANZADOR)).toBeLessThanOrEqual(21);
  });
  it('huye a media marcha', () => {
    const e = crearEnemigo('lanzador', 130, 100);
    pasos(e, 10);
    expect(e.x - 130).toBeCloseTo(10 * 0.25, 5);
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

describe('estados en los enemigos', () => {
  const g = (accion: 'L' | 'P'): Golpe => ({ accion, caja, empuje: 0, combo: null });
  it('la marca dobla el siguiente golpe y el aturdido no avanza su aviso', () => {
    const e = crearEnemigo('escudado', 100, 100);
    e.mira = { x: 1, y: 0 };
    recibirGolpe(e, g('L'), { x: 90, y: 100 }, 0, 'marca');
    expect(e.vida).toBe(VIDA.escudado - 1);
    recibirGolpe(e, g('L'), { x: 90, y: 100 });
    expect(e.vida).toBe(VIDA.escudado - 3);
    const s = crearEnemigo('segador', 115, 100);
    pasos(s, 1);
    expect(s.estado).toBe('aviso');
    recibirGolpe(s, g('L'), { x: 200, y: 100 }, 0, 'aturdimiento');
    s.estado = 'aviso';
    s.t = AVISO;
    expect(pasos(s, 59)).toEqual([]);
  });
  it('la quemadura mata y avisa de la muerte', () => {
    const e = crearEnemigo('lanzador', 100, 100);
    recibirGolpe(e, g('L'), { x: 90, y: 100 }, 0, 'quemadura');
    const murio = Array.from({ length: 120 }, () => actualizarEnemigo(e, { x: 300, y: 100 })).some((a) => a.murio);
    expect(murio).toBe(true);
    expect(e.estado).toBe('muerto');
  });
  it('lento avanza a la mitad', () => {
    const a = crearEnemigo('segador', 300, 100);
    const b = crearEnemigo('segador', 300, 100);
    recibirGolpe(b, g('L'), { x: 400, y: 100 }, 0, 'lentitud');
    b.vida = VIDA.segador; b.estado = 'andar'; b.t = 0; b.vx = 0; a.vx = 0;
    pasos(a, 60); pasos(b, 60);
    expect(300 - b.x).toBeCloseTo((300 - a.x) / 2, 0);
  });
});

describe('quemadura que se propaga', () => {
  it('salta a un enemigo vivo a menos de 30 px, no a uno lejano', () => {
    const c = crearCombate(() => 0.5);
    const [a, b, lejos] = c.enemigos;
    Object.assign(a, { x: 100, y: 100 }); Object.assign(b, { x: 120, y: 100 }); Object.assign(lejos, { x: 300, y: 100 });
    recibirGolpe(a, { accion: 'L', caja, empuje: 0, combo: null }, { x: 90, y: 100 }, 0, 'quemadura');
    pasoCombate(c, { x: 400, y: 250 }, { x: 0, y: 0, w: 0, h: 0 }, null, () => {});
    expect(b.estados.quemadura).toBeGreaterThan(0);
    expect(lejos.estados.quemadura).toBe(0);
  });
  it('la quemadura contagiada no se contagia de vuelta', () => {
    const a = crearEnemigo('segador', 100, 100);
    const b = crearEnemigo('segador', 110, 100);
    aplicarEstado(a.estados, 'quemadura');
    propagarQuemadura([a, b]);
    expect(b.estados.quemadura).toBeGreaterThan(0);
    a.estados.quemadura = 0; // se le apagó a A; B sigue ardiendo
    propagarQuemadura([a, b]);
    expect(a.estados.quemadura).toBe(0);
  });
});

describe('golpes y lentitud', () => {
  const sinEfecto = () => ({ extra: 0, estado: null });
  it('el golpe que mata alcanza; el bloqueado no', () => {
    const muere = crearEnemigo('lanzador', 110, 100);
    muere.vida = 1;
    const escudo = crearEnemigo('escudado', 90, 100); // mira a la izquierda: el espíritu en 50 le da de frente
    const r = golpearEnemigos([muere, escudo], golpe('L'), { x: 50, y: 100 }, sinEfecto);
    expect(r.alcanzados).toEqual([muere]);
    expect(r.muertos).toEqual([muere]);
    expect(r.bloqueados).toEqual([escudo]);
  });
  it('con la lentitud renovada cada paso (túnica de escarcha) el aviso dura el doble', () => {
    const e = crearEnemigo('segador', 100, 100);
    let pasosHastaAtacar = 0;
    for (let i = 0; i < 4 * AVISO && pasosHastaAtacar === 0; i++) {
      e.estados.lentitud = 10;
      if (actualizarEnemigo(e, { x: 105, y: 100 }).caja) pasosHastaAtacar = i;
    }
    expect(pasosHastaAtacar).toBeGreaterThanOrEqual(2 * AVISO - 2);
    expect(pasosHastaAtacar).toBeLessThanOrEqual(2 * AVISO + 2);
  });
});
