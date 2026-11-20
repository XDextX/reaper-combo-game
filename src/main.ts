import { arrancar } from './bucle';
import { ANCHO, ALTO, ajustar } from './pantalla';

const canvas = document.querySelector<HTMLCanvasElement>('#juego')!;
canvas.width = ANCHO;
canvas.height = ALTO;
const ctx = canvas.getContext('2d')!;
ajustar(canvas);
addEventListener('resize', () => ajustar(canvas));

function dibujar(): void {
  ctx.fillStyle = '#0d0d14';
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.strokeStyle = '#1f2a33';
  ctx.strokeRect(8.5, 8.5, ANCHO - 17, ALTO - 17);
}

arrancar(() => {}, dibujar);
