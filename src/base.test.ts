import { describe, expect, it } from 'vitest';
import { PASO, repartir } from './bucle';
import { MAX_LADO, encuadre, escala, lado } from './pantalla';

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

describe('encuadre', () => {
  // Casos de QA con DPR no entero, ya en píxeles de dispositivo (ventana CSS × DPR).
  it.each([
    [2304, 1296, 7, 32, 18], // 1536×864 a 1,5
    [3360, 1890, 10, 80, 45], // 1280×720 a 2,625
    [5040, 2835, 15, 120, 67], // 1920×1080 a 2,625
    [1015, 469, 2, 187, 54], // 812×375 a 1,25
  ])('%i×%i da escala %i en (%i, %i), en píxeles enteros', (ancho, alto, e, x, y) => {
    expect(encuadre(ancho, alto)).toEqual({ e, x, y });
  });
});

describe('lado', () => {
  it('redondea y no baja de 1', () => {
    expect(lado(1014.6)).toBe(1015);
    expect(lado(0)).toBe(1);
  });
  it('no pasa del límite del canvas', () => {
    expect(lado(40_000)).toBe(MAX_LADO);
  });
});
