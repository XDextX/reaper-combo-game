// Sensación del golpe: pausa al impactar, temblor de pantalla y partículas (spec, «Alcance» y «Accesibilidad»).
import type { Golpe } from './espiritu';

export type Particula = { x: number; y: number; vx: number; vy: number; vida: number; color: string };

// En pasos de 60 Hz; valores iniciales que se ajustan jugando.
export const PAUSA = { normal: 3, combo: 6, Juicio: 10 };
export const TEMBLOR = { normal: 2, combo: 4 };
const VIDA_PARTICULA = 18;

export function crearSensacion() {
  return { pausa: 0, temblor: 0, particulas: [] as Particula[] };
}
export type Sensacion = ReturnType<typeof crearSensacion>;

/** Un golpe que conectó en `puntos`. Con `suave` (movimiento reducido o la opción), el temblor no pasa de 1 px. */
export function impacto(s: Sensacion, golpe: Golpe, puntos: { x: number; y: number }[], suave: boolean, azar = Math.random): void {
  const nombre = golpe.combo?.nombre;
  s.pausa = Math.max(s.pausa, nombre === 'Juicio' ? PAUSA.Juicio : nombre ? PAUSA.combo : PAUSA.normal);
  const fuerza = nombre ? TEMBLOR.combo : TEMBLOR.normal;
  s.temblor = Math.max(s.temblor, suave ? Math.min(1, fuerza) : fuerza);
  const color = golpe.combo ? '#ff4fc3' : golpe.accion === 'P' ? '#e8fbff' : '#9fe6f0';
  for (const p of puntos) {
    for (let i = 0; i < (golpe.combo ? 10 : 6); i++) {
      const angulo = azar() * Math.PI * 2;
      const vel = 0.6 + azar() * 1.6;
      s.particulas.push({ x: p.x, y: p.y, vx: Math.cos(angulo) * vel, vy: Math.sin(angulo) * vel, vida: VIDA_PARTICULA, color });
    }
  }
}

/** Un paso fijo. Devuelve true si el juego sigue congelado por la pausa de impacto. */
export function avanzar(s: Sensacion): boolean {
  for (const p of s.particulas) {
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.88;
    p.vy *= 0.88;
    p.vida--;
  }
  s.particulas = s.particulas.filter((p) => p.vida > 0);
  if (s.temblor > 0) s.temblor = Math.max(0, s.temblor - 0.25);
  if (s.pausa > 0) {
    s.pausa--;
    return true;
  }
  return false;
}

/** Desplazamiento de la cámara en píxeles de juego enteros, para no perder la nitidez. */
export function desplazamiento(s: Sensacion, azar = Math.random): { x: number; y: number } {
  const a = Math.ceil(s.temblor);
  if (a === 0) return { x: 0, y: 0 };
  return { x: Math.round((azar() * 2 - 1) * a), y: Math.round((azar() * 2 - 1) * a) };
}
