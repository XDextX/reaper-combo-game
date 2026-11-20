import { describe, expect, it } from 'vitest';
import { COMBOS } from './combos';
import type { Golpe } from './espiritu';
import { ENTRE_DESTELLOS, actualizarMuneco, crearMuneco, recibir } from './munecos';
import { PAUSA, avanzar, crearSensacion, desplazamiento, impacto } from './sensacion';

const caja = { x: 0, y: 0, w: 400, h: 400 };
const normal: Golpe = { accion: 'L', caja, empuje: 2, combo: null };
const juicio: Golpe = { accion: 'P', caja, empuje: 8, combo: COMBOS.find((c) => c.nombre === 'Juicio')! };
const punto = [{ x: 50, y: 50 }];

describe('sensación del golpe', () => {
  it('congela el juego unos pasos al impactar, y más con un combo', () => {
    const s = crearSensacion();
    impacto(s, normal, punto, false);
    const congelados = [1, 2, 3, 4].map(() => avanzar(s));
    expect(congelados).toEqual([true, true, true, false]);
    impacto(s, juicio, punto, false);
    expect(s.pausa).toBe(PAUSA.Juicio);
  });
  it('con movimiento reducido el temblor no pasa de 1 px', () => {
    const s = crearSensacion();
    impacto(s, juicio, punto, true);
    for (let i = 0; i < 20; i++) {
      const d = desplazamiento(s);
      expect(Math.max(Math.abs(d.x), Math.abs(d.y))).toBeLessThanOrEqual(1);
    }
  });
  it('el temblor se apaga solo y el desplazamiento es entero', () => {
    const s = crearSensacion();
    impacto(s, juicio, punto, false);
    const d = desplazamiento(s, () => 0.9);
    expect(Number.isInteger(d.x) && Number.isInteger(d.y)).toBe(true);
    for (let i = 0; i < 40; i++) avanzar(s);
    expect(desplazamiento(s)).toEqual({ x: 0, y: 0 });
  });
  it('las partículas salen del punto de impacto y desaparecen', () => {
    const s = crearSensacion();
    impacto(s, normal, punto, false);
    expect(s.particulas.length).toBeGreaterThan(0);
    for (let i = 0; i < 40; i++) avanzar(s);
    expect(s.particulas).toHaveLength(0);
  });
});

describe('destellos del muñeco', () => {
  it('como mucho 3 por segundo aunque reciba más golpes', () => {
    const m = crearMuneco(50, 50);
    let destellos = 0;
    for (let paso = 0; paso < 60; paso++) {
      const antes = m.golpeado;
      if (paso % 4 === 0) recibir(m, normal, { x: 0, y: 50 });
      if (m.golpeado > antes) destellos++;
      actualizarMuneco(m);
    }
    expect(destellos).toBeLessThanOrEqual(3);
    expect(ENTRE_DESTELLOS).toBeGreaterThanOrEqual(20);
  });
});
