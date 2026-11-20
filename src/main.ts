import { arrancar } from './bucle';
import { crearEntrada } from './entrada';
import { ANCHO, ALTO, encuadre, seguirPantalla } from './pantalla';
import type { Accion } from './traducir';

const canvas = document.querySelector<HTMLCanvasElement>('#juego')!;
const ctx = canvas.getContext('2d')!;
const entrada = crearEntrada();
let marco = { e: 1, x: 0, y: 0 };
seguirPantalla(canvas, (ancho, alto) => {
  marco = encuadre(ancho, alto);
  ctx.imageSmoothingEnabled = false; // cambiar el tamaño del canvas lo reinicia
  dibujar(); // y lo borra: sin esto queda un fotograma en blanco
});

// Marcador de prueba para la entrada; lo sustituye el espíritu en RC-4.
const marcador = { x: ANCHO / 2, y: ALTO / 2, accion: null as Accion | null, brillo: 0 };
const VELOCIDAD = 1.5; // píxeles de juego por paso

function actualizar(): void {
  const { mover, acciones } = entrada.leer();
  marcador.x = Math.min(ANCHO - 14, Math.max(10, marcador.x + mover.x * VELOCIDAD));
  marcador.y = Math.min(ALTO - 14, Math.max(10, marcador.y + mover.y * VELOCIDAD));
  const ultima = acciones.at(-1);
  if (ultima) { marcador.accion = ultima.accion; marcador.brillo = 12; }
  else if (marcador.brillo > 0) marcador.brillo--;
}

const COLOR: Record<Accion, string> = { L: '#9fe6f0', P: '#d0459f', E: '#ffffff' };

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
  ctx.fillStyle = marcador.brillo > 0 && marcador.accion ? COLOR[marcador.accion] : '#5d8a96';
  ctx.fillRect(Math.round(marcador.x), Math.round(marcador.y), 4, 4);
}

arrancar(actualizar, dibujar);
