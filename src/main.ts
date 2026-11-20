import { arrancar } from './bucle';
import { crearContador, crearDetector } from './combos';
import { crearEntrada } from './entrada';
import { actualizar as moverEspiritu, crearEspiritu, pedir, type Golpe } from './espiritu';
import { actualizarMuneco, cajaMuneco, crearMuneco, recibir } from './munecos';
import { ANCHO, ALTO, encuadre, seguirPantalla } from './pantalla';

const canvas = document.querySelector<HTMLCanvasElement>('#juego')!;
const ctx = canvas.getContext('2d')!;
const entrada = crearEntrada();
let marco = { e: 1, x: 0, y: 0 };
seguirPantalla(canvas, (ancho, alto) => {
  marco = encuadre(ancho, alto);
  ctx.imageSmoothingEnabled = false; // cambiar el tamaño del canvas lo reinicia
  dibujar(); // y lo borra: sin esto queda un fotograma en blanco
});

const espiritu = crearEspiritu(80, ALTO / 2);
const munecos = [crearMuneco(200, 60), crearMuneco(240, 95), crearMuneco(200, 130)];
const detector = crearDetector();
const contador = crearContador();
let ultimoGolpe: { golpe: Golpe; vida: number } | null = null;

function actualizar(): void {
  const ahora = performance.now();
  const { mover, acciones } = entrada.leer();
  for (const p of acciones) pedir(espiritu, p.accion, detector.registrar(p));
  const golpe = moverEspiritu(espiritu, mover);
  if (golpe) {
    ultimoGolpe = { golpe, vida: 6 };
    for (const m of munecos) if (recibir(m, golpe, espiritu)) contador.golpe(ahora);
  }
  for (const m of munecos) actualizarMuneco(m);
  contador.actualizar(ahora);
  if (ultimoGolpe && --ultimoGolpe.vida <= 0) ultimoGolpe = null;
}

// shortcut: figuras provisionales; RC-5 las cambia por las hojas de sprites.
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

  for (const m of munecos) {
    const c = cajaMuneco(m);
    ctx.fillStyle = m.golpeado > 0 ? '#ffffff' : '#8a7a68';
    ctx.fillRect(Math.round(c.x), Math.round(c.y), c.w, c.h);
  }
  ctx.fillStyle = espiritu.estado === 'esquivando' ? '#e8fbff' : '#9fe6f0';
  ctx.fillRect(Math.round(espiritu.x) - 5, Math.round(espiritu.y) - 7, 10, 14);
  ctx.fillStyle = '#ff4fc3';
  ctx.fillRect(Math.round(espiritu.x + espiritu.mira.x * 6) - 1, Math.round(espiritu.y + espiritu.mira.y * 6) - 1, 2, 2);
  if (ultimoGolpe) {
    const { caja } = ultimoGolpe.golpe;
    ctx.fillStyle = ultimoGolpe.golpe.combo ? 'rgba(208, 69, 159, .6)' : 'rgba(159, 230, 240, .35)';
    ctx.fillRect(Math.round(caja.x), Math.round(caja.y), caja.w, caja.h);
  }
}

arrancar(actualizar, dibujar);
