import { arrancar } from './bucle';
import { ANCHO, ALTO, seguirPantalla } from './pantalla';

const canvas = document.querySelector<HTMLCanvasElement>('#juego')!;
canvas.width = ANCHO;
canvas.height = ALTO;
const ctx = canvas.getContext('2d')!;
ctx.imageSmoothingEnabled = false;
seguirPantalla(canvas);

function dibujar(): void {
  ctx.fillStyle = '#0d0d14';
  ctx.fillRect(0, 0, ANCHO, ALTO);
  // Límite de la arena: contraste 3:1 con el fondo, porque es un borde con el que se choca.
  ctx.strokeStyle = '#4a6470';
  ctx.strokeRect(8.5, 8.5, ANCHO - 17, ALTO - 17);
}

arrancar(() => {}, dibujar);
