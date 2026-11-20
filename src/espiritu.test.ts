import { describe, expect, it } from 'vitest';
import { COMBOS } from './combos';
import { ACTIVO, DURACION, LIMITES, actualizar, crearEspiritu, pedir, type Espiritu, type Golpe } from './espiritu';
import { actualizarMuneco, crearMuneco, recibir } from './munecos';

const QUIETO = { x: 0, y: 0 };
const combo = (nombre: string) => COMBOS.find((c) => c.nombre === nombre)!;
function pasos(e: Espiritu, n: number, mover = QUIETO): Golpe[] {
  const golpes: Golpe[] = [];
  for (let i = 0; i < n; i++) {
    const g = actualizar(e, mover);
    if (g) golpes.push(g);
  }
  return golpes;
}

describe('estados', () => {
  it('quieto pasa a andar al moverse y vuelve al soltar', () => {
    const e = crearEspiritu(100, 100);
    pasos(e, 1, { x: 1, y: 0 });
    expect(e.estado).toBe('andar');
    expect(e.x).toBeGreaterThan(100);
    pasos(e, 1);
    expect(e.estado).toBe('quieto');
  });
  it('un golpe ligero dura lo suyo, conecta una vez y vuelve a quieto', () => {
    const e = crearEspiritu(100, 100);
    pedir(e, 'L');
    expect(e.estado).toBe('atacando');
    expect(pasos(e, DURACION.L)).toHaveLength(1);
    expect(e.estado).toBe('quieto');
  });
  it('no se mueve mientras ataca ni cambia de dirección', () => {
    const e = crearEspiritu(100, 100);
    pedir(e, 'P');
    pasos(e, 3, { x: 0, y: 1 });
    expect([e.x, e.y, e.mira]).toEqual([100, 100, { x: 1, y: 0 }]);
  });
  it('la esquiva avanza hacia donde mira', () => {
    const e = crearEspiritu(100, 100);
    pedir(e, 'E');
    pasos(e, DURACION.E);
    expect(e.x).toBeGreaterThan(130);
    expect(e.estado).toBe('quieto');
  });
  it('una acción pulsada durante otra espera y luego se ejecuta', () => {
    const e = crearEspiritu(100, 100);
    pedir(e, 'L');
    pasos(e, 2);
    pedir(e, 'P');
    pasos(e, DURACION.L - 2);
    expect([e.estado, e.accion]).toEqual(['atacando', 'P']);
  });
  it('no sale de la arena', () => {
    const e = crearEspiritu(LIMITES.x1, 100);
    pasos(e, 10, { x: 1, y: 0 });
    expect(e.x).toBe(LIMITES.x1);
  });
});

describe('golpes y muñecos', () => {
  it('el golpe sale delante: alcanza a un muñeco cercano, no a uno lejano ni a uno detrás', () => {
    const e = crearEspiritu(100, 100);
    pedir(e, 'L');
    const [golpe] = pasos(e, ACTIVO.L);
    expect(recibir(crearMuneco(115, 100), golpe, e)).toBe(true);
    expect(recibir(crearMuneco(160, 100), golpe, e)).toBe(false);
    expect(recibir(crearMuneco(85, 100), golpe, e)).toBe(false);
  });
  it('el muñeco golpeado retrocede, destella y vuelve a su sitio', () => {
    const e = crearEspiritu(100, 100);
    pedir(e, 'P');
    const [golpe] = pasos(e, ACTIVO.P);
    const m = crearMuneco(118, 100);
    recibir(m, golpe, e);
    expect(m.golpeado).toBeGreaterThan(0);
    actualizarMuneco(m);
    expect(m.x).toBeGreaterThan(118);
    for (let i = 0; i < 300; i++) actualizarMuneco(m);
    expect(m.x).toBeCloseTo(118, 0);
    expect(m.golpeado).toBe(0);
  });
  it('Cosecha golpea alrededor, también por detrás', () => {
    const e = crearEspiritu(100, 100);
    pedir(e, 'P', combo('Cosecha'));
    const [golpe] = pasos(e, ACTIVO.P);
    expect(recibir(crearMuneco(82, 100), golpe, e)).toBe(true);
  });
  it('el golpe final de un combo empuja más que uno normal', () => {
    const normal = crearEspiritu(100, 100);
    pedir(normal, 'P');
    const juicio = crearEspiritu(100, 100);
    pedir(juicio, 'P', combo('Juicio'));
    expect(pasos(juicio, ACTIVO.P)[0].empuje).toBeGreaterThan(pasos(normal, ACTIVO.P)[0].empuje);
  });
});
