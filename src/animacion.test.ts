import { describe, expect, it } from 'vitest';
import kit from '../assets/espiritu.kit.json';
import { cuantos, fotogramaEnBucle, fotogramaPorAvance } from './animacion';
import { direccion } from './animacion';

const f = kit.sprites.espiritu.frames;

describe('hoja del espíritu', () => {
  it('tiene las animaciones de la spec con sus fotogramas', () => {
    expect(['quieto', 'andar', 'golpe-L', 'golpe-P', 'esquiva', 'dano'].map((a) => cuantos(f, a))).toEqual([2, 4, 3, 4, 3, 2]);
  });
  it('cada fotograma mide 32×32', () => {
    expect(Object.values(f).every((r) => r.width === 32 && r.height === 32)).toBe(true);
  });
});

describe('elegir fotograma', () => {
  it('por avance: del primero al último sin pasarse', () => {
    expect([0, 0.34, 0.99, 1].map((a) => fotogramaPorAvance(f, 'golpe-L', a))).toEqual(['golpe-L-1', 'golpe-L-2', 'golpe-L-3', 'golpe-L-3']);
  });
  it('en bucle: vuelve al primero', () => {
    expect([0, 8, 16, 24, 32].map((t) => fotogramaEnBucle(f, 'andar', t, 8))).toEqual(['andar-1', 'andar-2', 'andar-3', 'andar-4', 'andar-1']);
  });
  it('golpe-L no cuenta los de golpe-P', () => {
    expect(cuantos(f, 'golpe')).toBe(0);
  });
});

describe('direccion', () => {
  it('elige el eje con más peso y el lado en las diagonales exactas', () => {
    expect(direccion({ x: 1, y: 0 })).toBe('lado');
    expect(direccion({ x: -1, y: 0 })).toBe('lado');
    expect(direccion({ x: 0, y: -1 })).toBe('arriba');
    expect(direccion({ x: 0.3, y: 0.95 })).toBe('abajo');
    expect(direccion({ x: Math.SQRT1_2, y: -Math.SQRT1_2 })).toBe('lado');
  });
});
