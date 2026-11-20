import { arrancar } from './bucle';
import { ANCHO, ALTO, encuadre, seguirPantalla } from './pantalla';

const canvas = document.querySelector<HTMLCanvasElement>('#juego')!;
const ctx = canvas.getContext('2d')!;
let marco = { e: 1, x: 0, y: 0 };
seguirPantalla(canvas, (ancho, alto) => {
  marco = encuadre(ancho, alto);
  ctx.imageSmoothingEnabled = false; // cambiar el tamaño del canvas lo reinicia
  dibujar(); // y lo borra: sin esto queda un fotograma en blanco
});

function dibujar(): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#07070b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // A partir de aquí se dibuja en píxeles de juego (320×180).
  ctx.setTransform(marco.e, 0, 0, marco.e, marco.x, marco.y);
  ctx.fillStyle = '#0d0d14';
  ctx.fillRect(0, 0, ANCHO, ALTO);
  // Límite de la arena: contraste 3:1 con el fondo, porque es un borde con el que se choca.
  ctx.fillStyle = '#4a6470';
  ctx.fillRect(8, 8, ANCHO - 16, 1);
  ctx.fillRect(8, ALTO - 9, ANCHO - 16, 1);
  ctx.fillRect(8, 8, 1, ALTO - 16);
  ctx.fillRect(ANCHO - 9, 8, 1, ALTO - 16);
}

arrancar(() => {}, dibujar);
