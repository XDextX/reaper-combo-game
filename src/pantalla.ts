export const ANCHO = 320;
export const ALTO = 180;

/**
 * Píxeles de dispositivo por píxel de juego: el mayor entero que cabe, para que todos
 * midan lo mismo. Si no cabe ni a 1, una fracción para no recortar la arena.
 */
export function escala(ancho: number, alto: number): number {
  const cabe = Math.min(ancho / ANCHO, alto / ALTO);
  return cabe >= 1 ? Math.floor(cabe) : cabe;
}

export function ajustar(canvas: HTMLCanvasElement): void {
  const dpr = devicePixelRatio || 1;
  const e = escala(innerWidth * dpr, innerHeight * dpr);
  canvas.style.width = `${(ANCHO * e) / dpr}px`;
  canvas.style.height = `${(ALTO * e) / dpr}px`;
}

/** Reajusta al cambiar el tamaño o la densidad (pasar a otro monitor no siempre da resize). */
export function seguirPantalla(canvas: HTMLCanvasElement): void {
  ajustar(canvas);
  addEventListener('resize', () => ajustar(canvas));
  const vigilarDpr = () => {
    matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener(
      'change',
      () => { ajustar(canvas); vigilarDpr(); },
      { once: true },
    );
  };
  vigilarDpr();
}
