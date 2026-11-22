import { describe, expect, it } from 'vitest';
import { CUERVO_CADA, OBJETOS, blancoCuervo, danoFarol, frenarProyectiles, PROB_GUADANA, SOMBRA_EXTRA, VELO_CADA, crearEquipo, equipar, estadoGuadana, pasoEquipo, roboExtra, velo } from './equipo';
import { crearEspiritu } from './espiritu';
import { crearMejoras, robar } from './mejoras';
import { VIDA_MAX, crearVida } from './vida';

const objeto = (id: string) => OBJETOS.find((o) => o.id === id)!;
const preparar = () => ({ eq: crearEquipo(), v: crearVida(), e: crearEspiritu(0, 0) });

describe('equipo', () => {
  it('un objeto del mismo hueco sustituye al anterior y lo devuelve', () => {
    const { eq, v, e } = preparar();
    expect(equipar(eq, objeto('ignea'), v, e)).toBeNull();
    expect(equipar(eq, objeto('helada'), v, e)?.id).toBe('ignea');
    expect(eq.guadana?.id).toBe('helada');
    equipar(eq, objeto('velo'), v, e);
    expect(eq.guadana?.id).toBe('helada'); // otro hueco no lo toca
  });
  it('el amuleto del corazón da +1 máximo mientras se lleva', () => {
    const { eq, v, e } = preparar();
    equipar(eq, objeto('corazon'), v, e);
    equipar(eq, objeto('corazon'), v, e);
    expect(v.vidaMax).toBe(VIDA_MAX + 1);
    v.vida = VIDA_MAX + 1;
    equipar(eq, objeto('reloj'), v, e);
    expect(v).toMatchObject({ vidaMax: VIDA_MAX, vida: VIDA_MAX });
  });
  it('la guadaña aplica su estado 1 de cada 4 golpes', () => {
    const { eq, v, e } = preparar();
    expect(estadoGuadana(eq, () => 0)).toBeNull();
    equipar(eq, objeto('venenosa'), v, e);
    expect(estadoGuadana(eq, () => 0)).toBe('veneno');
    expect(estadoGuadana(eq, () => PROB_GUADANA)).toBeNull();
  });
  it('la túnica del velo para un golpe cada 20 s', () => {
    const { eq, v, e } = preparar();
    expect(velo(eq)).toBe(false);
    equipar(eq, objeto('velo'), v, e);
    expect(velo(eq)).toBe(true);
    expect(velo(eq)).toBe(false);
    for (let i = 0; i < VELO_CADA; i++) pasoEquipo(eq);
    expect(velo(eq)).toBe(true);
  });
  it('la túnica de sombra alarga la esquiva y se quita al cambiarla', () => {
    const { eq, v, e } = preparar();
    equipar(eq, objeto('sombra'), v, e);
    expect(e.esquivaExtra).toBe(SOMBRA_EXTRA);
    equipar(eq, objeto('escarcha'), v, e);
    expect(e.esquivaExtra).toBe(0);
  });
  it('el amuleto sanguijuela roba vida sin la mejora', () => {
    const { eq, v, e } = preparar();
    v.vida = 2;
    equipar(eq, objeto('sanguijuela'), v, e);
    expect(robar(crearMejoras(), v, 10, roboExtra(eq))).toBe(true);
    expect(v.vida).toBe(3);
  });
  it('farol: +1 de daño solo con enemigos cerca', () => {
    const { eq, v, e } = preparar();
    expect(danoFarol(eq, e, [{ x: 10, y: 0 }])).toBe(0);
    equipar(eq, objeto('farol'), v, e);
    expect(danoFarol(eq, e, [{ x: 10, y: 0 }])).toBe(1);
    expect(danoFarol(eq, e, [{ x: 200, y: 0 }])).toBe(0);
  });
  it('cuervo: ciega al más cercano cada 4 s', () => {
    const { eq, v, e } = preparar();
    equipar(eq, objeto('cuervo-asistente'), v, e);
    const lejos = { x: 100, y: 0 };
    const junto = { x: 20, y: 0 };
    expect(blancoCuervo(eq, e, [lejos, junto])).toBeNull();
    for (let i = 0; i < CUERVO_CADA; i++) pasoEquipo(eq);
    expect(blancoCuervo(eq, e, [lejos, junto])).toBe(junto);
    expect(blancoCuervo(eq, e, [lejos, junto])).toBeNull(); // vuelve a esperar
  });
  it('polilla: frena a la mitad los proyectiles cercanos, una sola vez', () => {
    const { eq, v, e } = preparar();
    equipar(eq, objeto('polilla'), v, e);
    const cerca = { x: 10, y: 0, vx: 2, vy: 0 };
    const lejos = { x: 200, y: 0, vx: 2, vy: 0 };
    frenarProyectiles(eq, e, [cerca, lejos]);
    frenarProyectiles(eq, e, [cerca, lejos]);
    expect(cerca.vx).toBe(1);
    expect(lejos.vx).toBe(2);
  });
});
