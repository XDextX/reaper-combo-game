import { describe, expect, it } from 'vitest';
import { VIDA_BOTIN, pasoBotin, soltar, type Botin } from './botin';
import { VIDA_MAX, crearVida, curar } from './vida';

describe('soltar', () => {
  it('reparte equipo 10 %, cura 15 %, inestable 8 % y nada el resto', () => {
    expect(soltar(0, 0, () => 0.05)?.tipo).toBe('equipo');
    expect(soltar(0, 0, () => 0.2)?.tipo).toBe('cura');
    expect(soltar(0, 0, () => 0.3)?.tipo).toBe('inestable');
    expect(soltar(0, 0, () => 0.34)).toBeNull();
  });
});

describe('pasoBotin', () => {
  const lejos = { x: 500, y: 500, w: 1, h: 1 };
  it('desaparece a los 10 s', () => {
    let lista: Botin[] = [{ tipo: 'cura', x: 10, y: 10, vida: VIDA_BOTIN }];
    for (let i = 0; i < VIDA_BOTIN - 1; i++) lista = pasoBotin(lista, lejos, () => {});
    expect(lista).toHaveLength(1);
    lista = pasoBotin(lista, lejos, () => {});
    expect(lista).toEqual([]);
  });
  it('se recoge al pasar por encima', () => {
    const recogidos: Botin[] = [];
    const lista = pasoBotin([{ tipo: 'cura', x: 10, y: 10, vida: VIDA_BOTIN }], { x: 8, y: 8, w: 4, h: 4 }, (b) => recogidos.push(b));
    expect(lista).toEqual([]);
    expect(recogidos.map((b) => b.tipo)).toEqual(['cura']);
  });
});

describe('curar', () => {
  it('suma un corazón sin pasar del máximo', () => {
    const v = crearVida();
    v.vida = 3;
    curar(v);
    expect(v.vida).toBe(4);
    v.vida = VIDA_MAX;
    curar(v);
    expect(v.vida).toBe(VIDA_MAX);
  });
});
