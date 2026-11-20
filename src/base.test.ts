import { describe, expect, it } from 'vitest';
import { PASO, repartir } from './bucle';
import { escala } from './pantalla';

describe('repartir', () => {
  it('da pasos enteros y guarda el resto', () => {
    expect(repartir(PASO * 2 + 3)).toEqual({ pasos: 2, resto: expect.closeTo(3) });
  });
  it('no da pasos con menos de uno acumulado', () => {
    expect(repartir(PASO / 2)).toEqual({ pasos: 0, resto: PASO / 2 });
  });
  it('limita los pasos y tira el resto tras un parón', () => {
    expect(repartir(10_000)).toEqual({ pasos: 5, resto: 0 });
  });
});

describe('escala', () => {
  it('usa la mayor escala entera que cabe', () => {
    expect(escala(1920, 1080)).toBe(6);
    expect(escala(1000, 1080)).toBe(3);
  });
  it('nunca baja de 1', () => {
    expect(escala(100, 100)).toBe(1);
  });
});
