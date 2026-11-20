import { describe, expect, it } from 'vitest';
import kit from '../assets/espiritu.kit.json';
import { cuantos, fotogramaEnBucle, fotogramaPorAvance } from './animacion';

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
