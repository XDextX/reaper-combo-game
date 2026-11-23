// Estados alterados sobre los enemigos (spec, «Componentes RPG»). Tiempos en pasos de 60 Hz.
import type { Vector } from './traducir';

export type Estado = 'quemadura' | 'veneno' | 'sangrado' | 'lentitud' | 'aturdimiento' | 'ceguera' | 'marca';
export const ESTADOS: Estado[] = ['quemadura', 'veneno', 'sangrado', 'lentitud', 'aturdimiento', 'ceguera', 'marca'];

const QUEMADURA = 120; // 2 s, 1 de daño cada 0,5 s
const VENENO = 360; // 6 s, 1 de daño cada 2 s
export const MAX_VENENO = 3;
const SANGRADO = 300; // 5 s
export const TRAMO_SANGRADO = 40; // px recorridos por cada punto de daño
const LENTITUD = 180;
const ATURDIDO = 60; // 1 s paralizado
const REPOSO_ATURDIR = 180; // no se repite hasta pasados 3 s
const CEGUERA = 180;

export function crearEstados() {
  return {
    quemadura: 0, veneno: [] as number[], sangrado: 0, recorrido: 0, lentitud: 0,
    aturdido: 0, reposoAturdir: 0, ceguera: 0, rumbo: { x: 0, y: 0 } as Vector, marca: false,
    contagia: false, // la quemadura de un golpe se contagia; la contagiada no, para que no se reaviven sin fin
    par: false, // alterna cada paso: un enemigo lento solo avanza sus tiempos en uno de cada dos
  };
}
export type Estados = ReturnType<typeof crearEstados>;

/** Aplica un estado. `rumbo` es hacia dónde anda un enemigo cegado. */
export function aplicarEstado(s: Estados, estado: Estado, rumbo: Vector = { x: 0, y: 0 }): void {
  switch (estado) {
    case 'quemadura': s.quemadura = QUEMADURA; s.contagia = true; break;
    case 'veneno':
      if (s.veneno.length < MAX_VENENO) s.veneno.push(VENENO);
      else s.veneno[s.veneno.indexOf(Math.min(...s.veneno))] = VENENO; // con 3 dosis, renueva la más vieja
      break;
    case 'sangrado': s.sangrado = SANGRADO; s.recorrido = 0; break;
    case 'lentitud': s.lentitud = LENTITUD; break;
    case 'aturdimiento':
      if (s.reposoAturdir > 0) break;
      s.aturdido = ATURDIDO;
      s.reposoAturdir = REPOSO_ATURDIR;
      break;
    case 'ceguera': s.ceguera = CEGUERA; s.rumbo = rumbo; break;
    case 'marca': s.marca = true; break;
  }
}

/** Un paso: `movido` son los px que recorrió el enemigo. Devuelve el daño de este paso. */
export function pasoEstados(s: Estados, movido: number): number {
  let dano = 0;
  s.par = !s.par;
  if (s.quemadura > 0 && --s.quemadura % 30 === 0) dano++;
  s.veneno = s.veneno.map((t) => t - 1).filter((t) => {
    if (t % 120 === 0) dano++;
    return t > 0;
  });
  if (s.sangrado > 0) {
    s.sangrado--;
    s.recorrido += movido;
    while (s.recorrido >= TRAMO_SANGRADO) { dano++; s.recorrido -= TRAMO_SANGRADO; }
  }
  for (const k of ['lentitud', 'aturdido', 'reposoAturdir', 'ceguera'] as const) if (s[k] > 0) s[k]--;
  return dano;
}

/** Multiplicador del siguiente golpe: la marca lo dobla una vez y se gasta. */
export function gastarMarca(s: Estados): number {
  if (!s.marca) return 1;
  s.marca = false;
  return 2;
}

/** Estados activos, para dibujar sus iconos. */
export function activos(s: Estados): Estado[] {
  return ESTADOS.filter((e) => (e === 'veneno' ? s.veneno.length > 0 : e === 'marca' ? s.marca : e === 'aturdimiento' ? s.aturdido > 0 : s[e] > 0));
}
