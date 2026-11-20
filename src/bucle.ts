export const PASO = 1000 / 60;
// Evita la espiral de la muerte con fotogramas lentos.
const MAX_PASOS = 5;
// Un hueco mayor es una pausa (pestaña oculta, depurador): no se recupera.
const MAX_HUECO = 250;

/** Cuántos pasos fijos tocan al sumar dt al tiempo acumulado, y cuánto sobra. */
export function repartir(acumulado: number, dt: number): { pasos: number; resto: number } {
  if (dt < 0 || dt > MAX_HUECO) return { pasos: 0, resto: 0 };
  const total = acumulado + dt;
  const pasos = Math.min(Math.floor(total / PASO), MAX_PASOS);
  const resto = pasos === MAX_PASOS ? 0 : total - pasos * PASO;
  return { pasos, resto };
}

export function arrancar(actualizar: () => void, dibujar: () => void): void {
  let antes: number | null = null;
  let acumulado = 0;
  let pausado = false;
  const pausar = () => { pausado = true; };
  const seguir = () => {
    // Un focus puede llegar con la pestaña oculta, y mostrarla no le devuelve el foco.
    if (document.hidden || !document.hasFocus()) return;
    pausado = false;
    antes = null;
    acumulado = 0;
  };
  addEventListener('blur', pausar);
  addEventListener('focus', seguir);
  document.addEventListener('visibilitychange', () => (document.hidden ? pausar() : seguir()));

  const marco = (ahora: number) => {
    if (!pausado && antes !== null) {
      const r = repartir(acumulado, ahora - antes);
      acumulado = r.resto;
      for (let i = 0; i < r.pasos; i++) actualizar();
    }
    antes = ahora;
    dibujar();
    requestAnimationFrame(marco);
  };
  requestAnimationFrame(marco);
}
