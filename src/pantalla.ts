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

// Por debajo del límite de tamaño de canvas de los navegadores.
export const MAX_LADO = 16384;

/** Lado del canvas en píxeles de dispositivo: entero, al menos 1 y sin pasar del límite. */
export function lado(n: number): number {
  return Math.min(Math.max(1, Math.round(n)), MAX_LADO);
}

/**
 * Escala y desplazamiento entero, en píxeles de dispositivo, para centrar la arena.
 * `reserva` deja libre una columna a la derecha (los botones táctiles).
 */
export function encuadre(ancho: number, alto: number, reserva = 0): { e: number; x: number; y: number } {
  const libre = Math.max(1, ancho - reserva);
  const e = escala(libre, alto);
  return { e, x: Math.floor((libre - ANCHO * e) / 2), y: Math.floor((alto - ALTO * e) / 2) };
}

/**
 * El canvas ocupa toda la ventana y su resolución es la de los píxeles de dispositivo
 * que ocupa, así que cada píxel del canvas es uno de pantalla y no hay redondeos del navegador.
 * Llama a `alCambiar` con el nuevo tamaño, en píxeles de dispositivo; fijar el tamaño
 * borra el canvas, así que `alCambiar` debe redibujar.
 */
export function seguirPantalla(
  canvas: HTMLCanvasElement,
  alCambiar: (ancho: number, alto: number) => void,
): void {
  const fijar = (ancho: number, alto: number) => {
    canvas.width = lado(ancho);
    canvas.height = lado(alto);
    alCambiar(canvas.width, canvas.height);
  };
  const observador = new ResizeObserver(([entrada]) => {
    const exacto = entrada.devicePixelContentBoxSize?.[0];
    if (exacto) fijar(exacto.inlineSize, exacto.blockSize);
    // shortcut: sin devicePixelContentBoxSize (Safari) el redondeo puede fallar 1 px con DPR no entero.
    else fijar(Math.round(canvas.clientWidth * devicePixelRatio), Math.round(canvas.clientHeight * devicePixelRatio));
  });
  try {
    // Avisa también cuando cambia el DPR sin cambiar el tamaño CSS (pasar a otro monitor).
    observador.observe(canvas, { box: 'device-pixel-content-box' });
  } catch {
    observador.observe(canvas);
  }
}
