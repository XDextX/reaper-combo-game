import { describe, expect, it } from 'vitest';
import {
  BOTONES_ACCION, BOTONES_MOVER, TECLAS_ACCION, TECLAS_MOVER,
  flancos, joystick, limitar, sumar, zonaMuerta,
} from './traducir';

describe('teclado', () => {
  it('WASD y flechas dan la misma dirección', () => {
    expect(sumar(['KeyW'], TECLAS_MOVER)).toEqual(sumar(['ArrowUp'], TECLAS_MOVER));
    expect(sumar(['KeyD', 'KeyS'], TECLAS_MOVER)).toEqual({ x: 1, y: 1 });
  });
  it('teclas opuestas se anulan', () => {
    expect(sumar(['KeyA', 'KeyD'], TECLAS_MOVER)).toEqual({ x: 0, y: 0 });
  });
  it('ignora teclas sin dirección', () => {
    expect(sumar(['KeyQ', 'KeyJ'], TECLAS_MOVER)).toEqual({ x: 0, y: 0 });
  });
  it('J, K y Espacio son L, P y E', () => {
    expect([TECLAS_ACCION.KeyJ, TECLAS_ACCION.KeyK, TECLAS_ACCION.Space]).toEqual(['L', 'P', 'E']);
  });
});

describe('mando', () => {
  it('botones inferior, izquierdo y derecho son L, P y E', () => {
    expect([BOTONES_ACCION[0], BOTONES_ACCION[2], BOTONES_ACCION[1]]).toEqual(['L', 'P', 'E']);
  });
  it('la cruceta mueve', () => {
    expect(sumar([12, 15], BOTONES_MOVER)).toEqual({ x: 1, y: -1 });
  });
  it('solo cuenta un botón al pulsarlo, no mientras sigue pulsado', () => {
    expect(flancos(new Set<number>(), new Set([0]))).toEqual([0]);
    expect(flancos(new Set([0]), new Set([0]))).toEqual([]);
    expect(flancos(new Set([0]), new Set([0, 2]))).toEqual([2]);
  });
  it('la zona muerta quita la deriva del stick', () => {
    expect(zonaMuerta({ x: 0.1, y: -0.1 })).toEqual({ x: 0, y: 0 });
  });
  it('fuera de la zona muerta sube de 0 a 1 sin salto', () => {
    expect(zonaMuerta({ x: 0.2, y: 0 }).x).toBeCloseTo(0);
    expect(zonaMuerta({ x: 0.6, y: 0 }).x).toBeCloseTo(0.5);
    expect(zonaMuerta({ x: 1, y: 0 }).x).toBeCloseTo(1);
  });
});

describe('limitar', () => {
  it('la diagonal no va más rápida', () => {
    const v = limitar({ x: 1, y: 1 });
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
  });
  it('no toca lo que ya es corto', () => {
    expect(limitar({ x: 0.3, y: 0 })).toEqual({ x: 0.3, y: 0 });
  });
});

describe('joystick táctil', () => {
  it('a radio completo da 1 y más allá no pasa de 1', () => {
    expect(joystick(48, 0, 48).x).toBeCloseTo(1);
    expect(Math.hypot(joystick(200, 200, 48).x, joystick(200, 200, 48).y)).toBeCloseTo(1);
  });
  it('un temblor pequeño del dedo no mueve', () => {
    expect(joystick(3, -3, 48)).toEqual({ x: 0, y: 0 });
  });
});
