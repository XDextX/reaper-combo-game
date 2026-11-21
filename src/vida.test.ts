import { describe, expect, it } from 'vitest';
import { INVULNERABLE, VIDA_MAX, anotar, crearVida, herir, pasoVida } from './vida';

describe('vida', () => {
  it('cae tras 5 golpes separados por la invulnerabilidad', () => {
    const v = crearVida();
    for (let i = 0; i < VIDA_MAX; i++) {
      expect(herir(v, false)).toBe(true);
      for (let j = 0; j < INVULNERABLE; j++) pasoVida(v);
    }
    expect(v.vida).toBe(0);
    expect(herir(v, false)).toBe(false);
  });
  it('no recibe daño durante el segundo siguiente a un golpe', () => {
    const v = crearVida();
    herir(v, false);
    for (let j = 0; j < INVULNERABLE - 1; j++) pasoVida(v);
    expect(herir(v, false)).toBe(false);
    pasoVida(v);
    expect(herir(v, false)).toBe(true);
    expect(v.vida).toBe(VIDA_MAX - 2);
  });
  it('no recibe daño mientras esquiva', () => {
    const v = crearVida();
    expect(herir(v, true)).toBe(false);
    expect(v.vida).toBe(VIDA_MAX);
  });
  it('apunta los golpes y el mejor combo', () => {
    const v = crearVida();
    anotar(v, 1);
    anotar(v, 7);
    anotar(v, 2);
    expect(v).toMatchObject({ golpes: 3, mejorCombo: 7 });
  });
  it('reintentar empieza con la vida llena', () => {
    expect(crearVida()).toEqual({ vida: VIDA_MAX, invulnerable: 0, golpes: 0, mejorCombo: 0 });
  });
});
