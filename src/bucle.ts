export const PASO = 1000 / 60;
// Evita la espiral de la muerte si la pestaña se congela.
const MAX_PASOS = 5;

/** Cuántos pasos fijos tocan con el tiempo acumulado, y cuánto sobra. */
export function repartir(acumulado: number): { pasos: number; resto: number } {
  const pasos = Math.min(Math.floor(acumulado / PASO), MAX_PASOS);
  const resto = pasos === MAX_PASOS ? 0 : acumulado - pasos * PASO;
  return { pasos, resto };
}

export function arrancar(actualizar: () => void, dibujar: () => void): void {
  let antes = performance.now();
  let acumulado = 0;
  const marco = (ahora: number) => {
    const r = repartir(acumulado + ahora - antes);
    antes = ahora;
    acumulado = r.resto;
    for (let i = 0; i < r.pasos; i++) actualizar();
    dibujar();
    requestAnimationFrame(marco);
  };
  requestAnimationFrame(marco);
}
