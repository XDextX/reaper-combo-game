// Equipo (spec, «Componentes RPG»): un objeto por hueco; recoger otro del mismo hueco sustituye al anterior.
import type { Espiritu } from './espiritu';
import type { Estado } from './estados';
import type { Vida } from './vida';

export type Hueco = 'guadana' | 'amuleto' | 'tunica' | 'asistente';
export const HUECO: Record<Hueco, string> = { guadana: 'Guadaña', amuleto: 'Amuleto', tunica: 'Túnica', asistente: 'Espíritu' }; // inicial en el suelo: G, A, T, E
export type Objeto = { id: string; hueco: Hueco; nombre: string; texto: string; estado?: Estado };

export const PROB_GUADANA = 0.25; // cada golpe aplica el estado de la guadaña con esta probabilidad
export const VELO_CADA = 1200; // pasos: la túnica del velo para un golpe cada 20 s
export const RELOJ_EXTRA = 30; // pasos: +0,5 s sin recibir daño tras un golpe
export const SOMBRA_EXTRA = 7; // pasos: la esquiva dura un 50 % más (14 → 21)
export const ESCARCHA_RADIO = 40;
export const FAROL_RADIO = 60; // +1 de daño con algún enemigo a esta distancia
export const CUERVO_CADA = 240; // pasos: ciega al enemigo más cercano cada 4 s
export const POLILLA_RADIO = 40; // los proyectiles que pasan a esta distancia van a la mitad

const guadana = (id: string, nombre: string, estado: Estado, efecto: string): Objeto =>
  ({ id, hueco: 'guadana', nombre, estado, texto: `1 de cada 4 golpes ${efecto}.` });
export const OBJETOS: Objeto[] = [
  guadana('ignea', 'Guadaña ígnea', 'quemadura', 'quema'),
  guadana('venenosa', 'Guadaña venenosa', 'veneno', 'envenena'),
  guadana('sangrienta', 'Guadaña sangrienta', 'sangrado', 'hace sangrar'),
  guadana('helada', 'Guadaña helada', 'lentitud', 'ralentiza'),
  guadana('trueno', 'Guadaña del trueno', 'aturdimiento', 'aturde'),
  guadana('cuervo', 'Guadaña del cuervo', 'ceguera', 'ciega'),
  guadana('sombria', 'Guadaña sombría', 'marca', 'marca'),
  { id: 'corazon', hueco: 'amuleto', nombre: 'Amuleto del corazón', texto: '+1 corazón máximo mientras lo llevas.' },
  { id: 'sanguijuela', hueco: 'amuleto', nombre: 'Amuleto sanguijuela', texto: 'Robo de vida: cada 10 golpes de combo seguidos, 1 corazón.' },
  { id: 'reloj', hueco: 'amuleto', nombre: 'Amuleto del reloj', texto: 'Tras recibir un golpe, 0,5 s más sin recibir daño.' },
  { id: 'velo', hueco: 'tunica', nombre: 'Túnica del velo', texto: 'Cada 20 s, un golpe no te quita vida.' },
  { id: 'escarcha', hueco: 'tunica', nombre: 'Túnica de escarcha', texto: 'Los enemigos a tu lado van lentos.' },
  { id: 'sombra', hueco: 'tunica', nombre: 'Túnica de sombra', texto: 'La esquiva dura un 50 % más.' },
  { id: 'farol', hueco: 'asistente', nombre: 'Farol', texto: '+1 de daño mientras hay enemigos cerca.' },
  { id: 'cuervo-asistente', hueco: 'asistente', nombre: 'Cuervo', texto: 'Cada 4 s ciega al enemigo más cercano.' },
  { id: 'polilla', hueco: 'asistente', nombre: 'Polilla', texto: 'Los proyectiles que pasan cerca van más lentos.' },
];

export function crearEquipo() {
  return { guadana: null as Objeto | null, amuleto: null as Objeto | null, tunica: null as Objeto | null, asistente: null as Objeto | null, velo: 0, cuervo: CUERVO_CADA };
}
export type Equipo = ReturnType<typeof crearEquipo>;

export function sortearObjeto(azar = Math.random): Objeto {
  return OBJETOS[Math.floor(azar() * OBJETOS.length)];
}

const lleva = (eq: Equipo, id: string) => [eq.guadana, eq.amuleto, eq.tunica, eq.asistente].some((o) => o?.id === id);

/** Se pone el objeto en su hueco, quitando los efectos del anterior. Devuelve el que se quitó, si había. */
export function equipar(eq: Equipo, o: Objeto, v: Vida, espiritu: Espiritu): Objeto | null {
  const anterior = eq[o.hueco];
  if (anterior?.id === 'corazon') {
    v.vidaMax--;
    v.vida = Math.min(v.vida, v.vidaMax);
  }
  eq[o.hueco] = o;
  if (o.id === 'corazon') v.vidaMax++;
  espiritu.esquivaExtra = lleva(eq, 'sombra') ? SOMBRA_EXTRA : 0;
  if (o.id === 'velo' && anterior?.id !== 'velo') eq.velo = 0;
  return anterior;
}

/** Estado que aplica la guadaña en este golpe, o ninguno. */
export function estadoGuadana(eq: Equipo, azar = Math.random): Estado | null {
  return eq.guadana?.estado && azar() < PROB_GUADANA ? eq.guadana.estado : null;
}
export const roboExtra = (eq: Equipo) => (lleva(eq, 'sanguijuela') ? 1 : 0);
export const invulnerableExtra = (eq: Equipo) => (lleva(eq, 'reloj') ? RELOJ_EXTRA : 0);
export const escarcha = (eq: Equipo) => lleva(eq, 'escarcha');

/** ¿El velo para este golpe? Si lo para, empieza su espera de 20 s. */
export function velo(eq: Equipo): boolean {
  if (!lleva(eq, 'velo') || eq.velo > 0) return false;
  eq.velo = VELO_CADA;
  return true;
}

type Punto = { x: number; y: number };
const cerca = (a: Punto, b: Punto, r: number) => Math.hypot(a.x - b.x, a.y - b.y) < r;

/** Farol: +1 de daño si hay algún enemigo cerca del espíritu. */
export const danoFarol = (eq: Equipo, espiritu: Punto, enemigos: Punto[]) =>
  (lleva(eq, 'farol') && enemigos.some((e) => cerca(e, espiritu, FAROL_RADIO)) ? 1 : 0);

/** Cuervo: el enemigo más cercano al que toca cegar en este paso, o ninguno. */
export function blancoCuervo<T extends Punto>(eq: Equipo, espiritu: Punto, enemigos: T[]): T | null {
  if (!lleva(eq, 'cuervo-asistente') || eq.cuervo > 0 || enemigos.length === 0) return null;
  eq.cuervo = CUERVO_CADA;
  const d = (e: T) => Math.hypot(e.x - espiritu.x, e.y - espiritu.y);
  return enemigos.reduce((a, b) => (d(b) < d(a) ? b : a));
}

/** Polilla: los proyectiles que pasan cerca van a la mitad, una sola vez cada uno. */
export function frenarProyectiles(eq: Equipo, espiritu: Punto, lista: (Punto & { vx: number; vy: number; lento?: boolean })[]): void {
  if (!lleva(eq, 'polilla')) return;
  for (const p of lista) {
    if (p.lento || !cerca(p, espiritu, POLILLA_RADIO)) continue;
    p.vx /= 2;
    p.vy /= 2;
    p.lento = true;
  }
}

export function pasoEquipo(eq: Equipo): void {
  if (eq.velo > 0) eq.velo--;
  if (eq.cuervo > 0) eq.cuervo--;
}
