// Botín que sueltan los enemigos al morir (spec, «Componentes RPG»).
import type { Caja } from './espiritu';
import { solapan } from './munecos';
import type { Objeto } from './equipo';

export type TipoBotin = 'equipo' | 'cura' | 'inestable';
export const PROBABILIDAD: Record<TipoBotin, number> = { equipo: 0.1, cura: 0.15, inestable: 0.08 };
export const VIDA_BOTIN = 600; // pasos: desaparece a los 10 s
const LADO = 8;

export type Botin = { tipo: TipoBotin; x: number; y: number; vida: number; objeto?: Objeto };

/** Lo que suelta un enemigo al morir en (x, y), o nada. Con una sola tirada, los tipos no se pisan. */
export function soltar(x: number, y: number, azar = Math.random): Botin | null {
  let r = azar();
  for (const tipo of Object.keys(PROBABILIDAD) as TipoBotin[]) {
    if (r < PROBABILIDAD[tipo]) return { tipo, x, y, vida: VIDA_BOTIN };
    r -= PROBABILIDAD[tipo];
  }
  return null;
}

export function cajaBotin(b: Botin): Caja {
  return { x: b.x - LADO / 2, y: b.y - LADO / 2, w: LADO, h: LADO };
}

/** Un paso: caduca lo viejo y recoge lo que toca el cuerpo del espíritu. Devuelve lo que queda en el suelo;
 * `recoger` devuelve true si lo deja en el suelo. */
export function pasoBotin(lista: Botin[], cuerpo: Caja, recoger: (b: Botin) => boolean | void): Botin[] {
  return lista.filter((b) => {
    if (--b.vida <= 0) return false;
    if (!solapan(cuerpo, cajaBotin(b))) return true;
    return recoger(b) === true;
  });
}
