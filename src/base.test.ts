import { describe, expect, it } from 'vitest';
import { PASO, repartir } from './bucle';
import { escala } from './pantalla';

describe('repartir', () => {
  it('da pasos enteros y guarda el resto', () => {
    expect(repartir(3, PASO * 2)).toEqual({ pasos: 2, resto: expect.closeTo(3) });
  });
  it('no da pasos con menos de uno acumulado', () => {
    expect(repartir(0, PASO / 2)).toEqual({ pasos: 0, resto: PASO / 2 });
  });
  it('limita los pasos de un fotograma lento y tira el resto', () => {
    expect(repartir(0, 200)).toEqual({ pasos: 5, resto: 0 });
  });
  it('trata un dt negativo como cero', () => {
    expect(repartir(5, -1)).toEqual({ pasos: 0, resto: 0 });
  });
  it('trata un hueco largo como pausa, sin ráfaga', () => {
    expect(repartir(0, 10_000)).toEqual({ pasos: 0, resto: 0 });
  });
});

describe('escala', () => {
  it('usa la mayor escala entera que cabe', () => {
    expect(escala(1920, 1080)).toBe(6);
    expect(escala(1000, 1080)).toBe(3);
  });
  it('en píxeles de dispositivo con DPR 1,5 sigue siendo entera', () => {
    expect(escala(1280 * 1.5, 720 * 1.5)).toBe(6);
  });
  it('baja de 1 con una fracción para no recortar', () => {
    expect(escala(160, 180)).toBe(0.5);
  });
});
