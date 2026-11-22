// Mejoras del alma inestable (spec, «Componentes RPG»). Se acumulan y se pierden al caer.
import { ESTADOS, type Estado } from './estados';
import { curar, type Vida } from './vida';

export type Mejora = 'vida' | 'dano' | 'robo' | 'infusion';
export const MEJORAS: Record<Mejora, { nombre: string; texto: string }> = {
  vida: { nombre: 'Más vida', texto: '+1 corazón máximo y te cura uno.' },
  dano: { nombre: 'Más daño', texto: '+1 de daño al golpe pesado y a los remates de combo.' },
  robo: { nombre: 'Robo de vida', texto: 'Cada 10 golpes de combo seguidos recuperas 1 corazón.' },
  infusion: { nombre: 'Infusión', texto: 'Tus golpes aplican un estado alterado.' },
};
/** Cada infusión es de un estado; solo se lleva una a la vez. */
export const INFUSIONES: Record<Estado, { nombre: string; texto: string }> = {
  quemadura: { nombre: 'Infusión de fuego', texto: 'Quema: daño rápido que salta a los enemigos de al lado.' },
  veneno: { nombre: 'Infusión de veneno', texto: 'Envenena: daño lento que se acumula hasta 3 dosis.' },
  sangrado: { nombre: 'Infusión de sangre', texto: 'Hace sangrar: daño cada vez que el enemigo anda.' },
  lentitud: { nombre: 'Infusión de hielo', texto: 'Ralentiza: el enemigo se mueve y avisa a la mitad.' },
  aturdimiento: { nombre: 'Infusión de rayo', texto: 'Aturde: el enemigo se queda quieto 1 s.' },
  ceguera: { nombre: 'Infusión del cuervo', texto: 'Ciega: el enemigo anda sin rumbo y apunta mal.' },
  marca: { nombre: 'Infusión de sombra', texto: 'Marca: tu siguiente golpe al enemigo hace el doble.' },
};
export type Opcion = { mejora: Mejora; estado?: Estado };
const DISPONIBLES: Mejora[] = ['vida', 'dano', 'robo', 'infusion'];
export const PROB_INFUSION = 0.35; // por cada infusión acumulada, hasta el 100 %
export const ROBO_CADA = 10;

export function crearMejoras() {
  return { vida: 0, dano: 0, robo: 0, infusion: 0, infusionEstado: null as Estado | null };
}
export type Mejoras = ReturnType<typeof crearMejoras>;

/** Nombre y texto de una opción o de una mejora que se lleva. */
export function describir(o: Opcion): { nombre: string; texto: string } {
  return o.mejora === 'infusion' && o.estado ? INFUSIONES[o.estado] : MEJORAS[o.mejora];
}

/** 3 mejoras distintas al azar; si sale la infusión, es de un estado al azar. */
export function sortear(azar = Math.random): Opcion[] {
  const bolsa = [...DISPONIBLES];
  for (let i = bolsa.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [bolsa[i], bolsa[j]] = [bolsa[j], bolsa[i]];
  }
  return bolsa.slice(0, 3).map((mejora) => (mejora === 'infusion' ? { mejora, estado: ESTADOS[Math.floor(azar() * ESTADOS.length)] } : { mejora }));
}

export function aplicar(m: Mejoras, v: Vida, { mejora, estado }: Opcion): void {
  if (mejora === 'infusion' && estado !== m.infusionEstado) { // otra infusión sustituye a la que se llevaba
    m.infusionEstado = estado ?? null;
    m.infusion = 0;
  }
  m[mejora]++;
  if (mejora === 'vida') {
    v.vidaMax++;
    curar(v);
  }
}

/** Daño extra de un golpe: solo el pesado y los remates de combo. */
export function danoExtra(m: Mejoras, pesadoOCombo: boolean): number {
  return pesadoOCombo ? m.dano : 0;
}

/** El estado que aplica un golpe por la infusión, o ninguno: 35 % por cada vez que se eligió esa misma infusión. */
export function infusion(m: Mejoras, azar = Math.random): Estado | null {
  if (!m.infusionEstado || azar() >= Math.min(1, PROB_INFUSION * m.infusion)) return null;
  return m.infusionEstado;
}

/** Llamar con cada golpe que acierta y el número de golpes del combo: el robo cura cada 10 seguidos. */
export function robar(m: Mejoras, v: Vida, golpesCombo: number): boolean {
  if (m.robo === 0 || golpesCombo === 0 || golpesCombo % ROBO_CADA !== 0 || v.vida === v.vidaMax) return false;
  for (let i = 0; i < m.robo; i++) curar(v); // cada robo acumulado cura un corazón más
  return true;
}
