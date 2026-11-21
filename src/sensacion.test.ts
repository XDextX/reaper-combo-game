import { describe, expect, it } from 'vitest';
import { COMBOS } from './combos';
import type { Golpe } from './espiritu';
import { ENTRE_DESTELLOS, actualizarMuneco, crearLimiteDestellos, crearMuneco, recibir } from './munecos';
import { PAUSA, avanzar, crearSensacion, desplazamiento, impacto } from './sensacion';

const caja = { x: 0, y: 0, w: 400, h: 400 };
const normal: Golpe = { accion: 'L', caja, empuje: 2, combo: null };
const juicio: Golpe = { accion: 'P', caja, empuje: 8, combo: COMBOS.find((c) => c.nombre === 'Juicio')! };
const punto = [{ x: 50, y: 50 }];

describe('sensación del golpe', () => {
  it('congela el juego unos pasos al impactar, y más con un combo', () => {
    const s = crearSensacion();
    impacto(s, normal, punto);
    const congelados = [1, 2, 3, 4].map(() => avanzar(s));
    expect(congelados).toEqual([true, true, true, false]);
    impacto(s, juicio, punto);
    expect(s.pausa).toBe(PAUSA.Juicio);
  });
  it('con movimiento reducido el temblor no pasa de 1 px', () => {
    const s = crearSensacion();
    impacto(s, juicio, punto, 1);
    for (let i = 0; i < 20; i++) {
      avanzar(s);
      const d = desplazamiento(s);
      expect(Math.max(Math.abs(d.x), Math.abs(d.y))).toBeLessThanOrEqual(1);
    }
  });
  it('con el temblor apagado no se mueve nada', () => {
    const s = crearSensacion();
    impacto(s, juicio, punto, 0);
    avanzar(s, () => 0.99);
    expect(desplazamiento(s)).toEqual({ x: 0, y: 0 });
  });
  it('el temblor cambia solo en cada paso, se apaga solo y es entero', () => {
    const s = crearSensacion();
    impacto(s, juicio, punto);
    avanzar(s, () => 0.9);
    const d = desplazamiento(s);
    expect(desplazamiento(s)).toEqual(d);
    expect(Number.isInteger(d.x) && Number.isInteger(d.y)).toBe(true);
    for (let i = 0; i < 40; i++) avanzar(s);
    expect(desplazamiento(s)).toEqual({ x: 0, y: 0 });
  });
  it('las partículas salen del punto de impacto y desaparecen', () => {
    const s = crearSensacion();
    impacto(s, normal, punto);
    expect(s.particulas.length).toBeGreaterThan(0);
    for (let i = 0; i < 40; i++) avanzar(s);
    expect(s.particulas).toHaveLength(0);
  });
});

describe('destellos de los muñecos', () => {
  it('como mucho 3 por segundo entre todos, aunque reciban más golpes', () => {
    const munecos = [crearMuneco(50, 50), crearMuneco(80, 50)];
    const limite = crearLimiteDestellos();
    let destellos = 0;
    for (let paso = 0; paso < 60; paso++) {
      if (paso % 4 === 0) {
        const destella = limite.pedir();
        for (const m of munecos) recibir(m, normal, { x: 0, y: 50 }, destella);
        if (destella) destellos++;
      }
      munecos.forEach(actualizarMuneco);
      limite.paso();
    }
    expect(destellos).toBeLessThanOrEqual(3);
    expect(ENTRE_DESTELLOS).toBeGreaterThanOrEqual(20);
  });
});
