import { describe, expect, it } from 'vitest';
import { COMBOS, crearContador, crearDetector, multiplicador } from './combos';
import type { Accion } from './traducir';

/** Registra acciones separadas por `paso` ms y devuelve los combos que salen. */
function jugar(acciones: string, paso = 100) {
  const d = crearDetector();
  return [...acciones].map((a, i) => d.registrar({ accion: a as Accion, t: i * paso })?.nombre ?? null);
}

describe('detector', () => {
  it.each(COMBOS.map((c) => [c.nombre, c.secuencia.join('')]))('%s sale con %s', (nombre, secuencia) => {
    expect(jugar(secuencia).at(-1)).toBe(nombre);
  });
  it('a medias no da combo', () => {
    expect(jugar('LL')).toEqual([null, null]);
  });
  it('pasada la ventana de 400 ms empieza de cero', () => {
    expect(jugar('LLL', 401).at(-1)).toBeNull();
    expect(jugar('LLL', 400).at(-1)).toBe('Siega');
  });
  it('tras un combo, las acciones no se reutilizan', () => {
    expect(jugar('LLLL')).toEqual([null, null, 'Siega', null]);
  });
  it('gana la secuencia más larga', () => {
    const d = crearDetector([
      { nombre: 'corto', secuencia: ['P', 'P'] },
      { nombre: 'largo', secuencia: ['L', 'P', 'P'] },
    ]);
    d.registrar({ accion: 'L', t: 0 });
    d.registrar({ accion: 'P', t: 100 });
    expect(d.registrar({ accion: 'P', t: 200 })?.nombre).toBe('largo');
  });
  it('una acción suelta antes no estropea el combo', () => {
    expect(jugar('PLLL').at(-1)).toBe('Siega');
  });
});

describe('contador', () => {
  it('el multiplicador sube cada 10 golpes, hasta x4', () => {
    expect([0, 9, 10, 19, 20, 30, 99].map(multiplicador)).toEqual([1, 1, 2, 2, 3, 4, 4]);
  });
  it('se rompe tras 2 s sin conectar', () => {
    const c = crearContador();
    c.golpe(0);
    c.golpe(100);
    c.actualizar(2100);
    expect(c.golpes).toBe(2);
    c.actualizar(2101);
    expect(c.golpes).toBe(0);
  });
  it('recibir daño lo rompe', () => {
    const c = crearContador();
    for (let i = 0; i < 12; i++) c.golpe(i);
    expect(c.multiplicador).toBe(2);
    c.romper();
    expect([c.golpes, c.multiplicador]).toEqual([0, 1]);
  });
});
