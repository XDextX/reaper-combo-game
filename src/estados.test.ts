import { describe, expect, it } from 'vitest';
import { MAX_VENENO, TRAMO_SANGRADO, activos, aplicarEstado, crearEstados, gastarMarca, pasoEstados } from './estados';

const pasos = (s: ReturnType<typeof crearEstados>, n: number, movido = 0) => {
  let dano = 0;
  for (let i = 0; i < n; i++) dano += pasoEstados(s, movido);
  return dano;
};

describe('estados alterados', () => {
  it('quemadura: 1 de daño cada 0,5 s durante 2 s', () => {
    const s = crearEstados();
    aplicarEstado(s, 'quemadura');
    expect(pasos(s, 120)).toBe(4);
    expect(pasos(s, 120)).toBe(0);
  });
  it('veneno: 1 cada 2 s durante 6 s, se acumula hasta 3 dosis', () => {
    const s = crearEstados();
    aplicarEstado(s, 'veneno');
    expect(pasos(s, 360)).toBe(3);
    for (let i = 0; i < 5; i++) aplicarEstado(s, 'veneno');
    expect(s.veneno).toHaveLength(MAX_VENENO);
    expect(pasos(s, 360)).toBe(9);
  });
  it('sangrado: 1 de daño cada 40 px recorridos, durante 5 s', () => {
    const s = crearEstados();
    aplicarEstado(s, 'sangrado');
    expect(pasos(s, 10, TRAMO_SANGRADO / 10)).toBe(1);
    expect(pasos(s, 10)).toBe(0); // quieto no sangra
    pasos(s, 300);
    expect(pasos(s, 10, 10)).toBe(0); // se acabó
  });
  it('aturdimiento: 1 s y no se repite hasta pasados 3 s', () => {
    const s = crearEstados();
    aplicarEstado(s, 'aturdimiento');
    expect(s.aturdido).toBe(60);
    pasos(s, 60);
    aplicarEstado(s, 'aturdimiento');
    expect(s.aturdido).toBe(0);
    pasos(s, 120);
    aplicarEstado(s, 'aturdimiento');
    expect(s.aturdido).toBe(60);
  });
  it('lentitud y ceguera duran 3 s; la ceguera guarda su rumbo', () => {
    const s = crearEstados();
    aplicarEstado(s, 'lentitud');
    aplicarEstado(s, 'ceguera', { x: 5, y: 6 });
    expect(activos(s)).toEqual(['lentitud', 'ceguera']);
    expect(s.rumbo).toEqual({ x: 5, y: 6 });
    pasos(s, 180);
    expect(activos(s)).toEqual([]);
  });
  it('marca: dobla solo el siguiente golpe', () => {
    const s = crearEstados();
    aplicarEstado(s, 'marca');
    expect(gastarMarca(s)).toBe(2);
    expect(gastarMarca(s)).toBe(1);
  });
});
