export const ANCHO = 320;
export const ALTO = 180;

/** Mayor escala entera que cabe, para que los píxeles sigan nítidos. */
export function escala(ventanaAncho: number, ventanaAlto: number): number {
  return Math.max(1, Math.floor(Math.min(ventanaAncho / ANCHO, ventanaAlto / ALTO)));
}

export function ajustar(canvas: HTMLCanvasElement): void {
  const e = escala(innerWidth, innerHeight);
  canvas.style.width = `${ANCHO * e}px`;
  canvas.style.height = `${ALTO * e}px`;
}
