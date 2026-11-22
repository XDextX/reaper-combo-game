import { describe, expect, it } from 'vitest';
import { COMBOS } from './combos';
import { crearEnemigo, recibirGolpe } from './enemigos';
import type { Golpe } from './espiritu';
import { ROBO_CADA, aplicar, crearMejoras, danoExtra, robar, sortear } from './mejoras';
import { VIDA_MAX, crearVida } from './vida';

describe('sortear', () => {
  it('da 3 mejoras distintas', () => {
    const tres = sortear(() => 0.99);
    expect(new Set(tres).size).toBe(3);
  });
});

describe('más vida', () => {
  it('sube el máximo y cura uno; se acumula', () => {
    const v = crearVida();
    const m = crearMejoras();
    v.vida = 2;
    aplicar(m, v, 'vida');
    aplicar(m, v, 'vida');
    expect(v).toMatchObject({ vidaMax: VIDA_MAX + 2, vida: 4 });
  });
});

describe('más daño', () => {
  const golpe = (accion: 'L' | 'P', combo = false): Golpe => ({ accion, caja: { x: 0, y: 0, w: 1, h: 1 }, empuje: 0, combo: combo ? COMBOS[0] : null });
  it('suma al pesado y al remate, no al ligero, y se acumula', () => {
    const m = crearMejoras();
    aplicar(m, crearVida(), 'dano');
    aplicar(m, crearVida(), 'dano');
    expect(danoExtra(m, true)).toBe(2);
    expect(danoExtra(m, false)).toBe(0);
    const e = crearEnemigo('escudado', 100, 100);
    e.mira = { x: 1, y: 0 };
    recibirGolpe(e, golpe('P'), { x: 90, y: 100 }, danoExtra(m, true));
    expect(e.vida).toBe(0); // 4 de vida: 2 del pesado + 2 de mejora
  });
});

describe('robo de vida', () => {
  it('cura cada 10 golpes de combo seguidos y no pasa del máximo', () => {
    const v = crearVida();
    const m = crearMejoras();
    v.vida = 3;
    expect(robar(m, v, ROBO_CADA)).toBe(false); // sin la mejora no roba
    aplicar(m, v, 'robo');
    expect(robar(m, v, ROBO_CADA - 1)).toBe(false);
    expect(robar(m, v, ROBO_CADA)).toBe(true);
    expect(v.vida).toBe(4);
    aplicar(m, v, 'robo');
    robar(m, v, ROBO_CADA * 2);
    expect(v.vida).toBe(VIDA_MAX);
  });
});
