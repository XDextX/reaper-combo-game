// Equipo (spec, «Componentes RPG»): un objeto por hueco; recoger otro del mismo hueco sustituye al anterior.
import type { Espiritu } from './espiritu';
import type { Estado } from './estados';
import type { Vida } from './vida';

export type Hueco = 'guadana' | 'amuleto' | 'tunica';
export const HUECO: Record<Hueco, string> = { guadana: 'Guadaña', amuleto: 'Amuleto', tunica: 'Túnica' };
export type Objeto = { id: string; hueco: Hueco; nombre: string; texto: string; estado?: Estado };

export const PROB_GUADANA = 0.25; // cada golpe aplica el estado de la guadaña con esta probabilidad
export const VELO_CADA = 1200; // pasos: la túnica del velo para un golpe cada 20 s
export const RELOJ_EXTRA = 30; // pasos: +0,5 s sin recibir daño tras un golpe
export const SOMBRA_EXTRA = 7; // pasos: la esquiva dura un 50 % más (14 → 21)
export const ESCARCHA_RADIO = 40;

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
];

export function crearEquipo() {
  return { guadana: null as Objeto | null, amuleto: null as Objeto | null, tunica: null as Objeto | null, velo: 0 };
}
export type Equipo = ReturnType<typeof crearEquipo>;

export function sortearObjeto(azar = Math.random): Objeto {
  return OBJETOS[Math.floor(azar() * OBJETOS.length)];
}

const lleva = (eq: Equipo, id: string) => eq.guadana?.id === id || eq.amuleto?.id === id || eq.tunica?.id === id;

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

export function pasoEquipo(eq: Equipo): void {
  if (eq.velo > 0) eq.velo--;
}
