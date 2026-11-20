import { arrancar } from './bucle';
import { COMBOS, crearContador, crearDetector } from './combos';
import { crearEntrada } from './entrada';
import { DURACION, actualizar as moverEspiritu, crearEspiritu, pedir, type Espiritu } from './espiritu';
import { DESTELLO, actualizarMuneco, crearMuneco, recibir } from './munecos';
import { crearInterfaz } from './interfaz';
import { ANCHO, ALTO, encuadre, seguirPantalla } from './pantalla';
import { avanzar, crearSensacion, desplazamiento, impacto } from './sensacion';
import { fotogramaEnBucle, fotogramaPorAvance } from './animacion';
import { HOJAS, pintar } from './sprites';

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
const interfaz = crearInterfaz(COMBOS);
const sensacion = crearSensacion();

// Temblor de pantalla: apagado de entrada con movimiento reducido; la opción se recuerda si se puede.
const opcionTemblor = document.querySelector<HTMLInputElement>('#opcion-temblor')!;
const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)');
try {
  const guardado = localStorage.getItem('temblor');
  opcionTemblor.checked = guardado === null ? !movimientoReducido.matches : guardado === '1';
} catch {
  opcionTemblor.checked = !movimientoReducido.matches;
}
opcionTemblor.addEventListener('change', () => {
  try { localStorage.setItem('temblor', opcionTemblor.checked ? '1' : '0'); } catch { /* sin almacenamiento: solo esta visita */ }
});
const suave = () => !opcionTemblor.checked || movimientoReducido.matches;
let tick = 0;
// Chispas de impacto: un sprite que se reproduce una vez en cada punto alcanzado.
const VIDA_CHISPA = 12;
let chispas: { x: number; y: number; tipo: 'L' | 'P'; vida: number }[] = [];

function actualizar(): void {
  const ahora = performance.now();
  tick++;
  const { mover, acciones } = entrada.leer();
  for (const p of acciones) {
    const combo = detector.registrar(p);
    if (combo) interfaz.combo(combo, ahora);
    pedir(espiritu, p.accion, combo);
  }
  if (!avanzar(sensacion)) {
    const golpe = moverEspiritu(espiritu, mover);
    if (golpe) {
      const alcanzados = munecos.filter((m) => recibir(m, golpe, espiritu));
      alcanzados.forEach(() => contador.golpe(ahora));
      if (alcanzados.length) impacto(sensacion, golpe, alcanzados, suave());
      const tipo = golpe.combo || golpe.accion === 'P' ? 'P' : 'L';
      for (const m of alcanzados) chispas.push({ x: m.x, y: m.y, tipo, vida: VIDA_CHISPA });
    }
    for (const m of munecos) actualizarMuneco(m);
  }
  contador.actualizar(ahora);
  chispas = chispas.filter((c) => --c.vida > 0);
  interfaz.actualizar(detector.pendiente(ahora), contador.golpes, contador.multiplicador, ahora);
}

/** Animación del espíritu según su estado. */
function fotogramaEspiritu(e: Espiritu): string {
  const f = HOJAS.espiritu.fotogramas;
  if (e.estado === 'atacando') return fotogramaPorAvance(f, `golpe-${e.accion}`, e.paso / DURACION[e.accion!]);
  if (e.estado === 'esquivando') return fotogramaPorAvance(f, 'esquiva', e.paso / DURACION.E);
  if (e.estado === 'andar') return fotogramaEnBucle(f, 'andar', tick, 8);
  return fotogramaEnBucle(f, 'quieto', tick, 30);
}

function dibujar(): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#07070b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // A partir de aquí se dibuja en píxeles de juego (320×180), siempre en posiciones enteras.
  const d = desplazamiento(sensacion);
  ctx.setTransform(marco.e, 0, 0, marco.e, marco.x + d.x * marco.e, marco.y + d.y * marco.e);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, ANCHO, ALTO);
  ctx.clip();
  for (let y = 0; y < ALTO; y += 32) {
    for (let x = 0; x < ANCHO; x += 32) pintar(ctx, HOJAS.suelo, `baldosa-${1 + ((x * 7 + y * 3) / 32) % 4}`, x, y);
  }
  ctx.restore();
  // Límite de la arena: contraste 3:1 con el fondo, porque es un borde con el que se choca.
  ctx.fillStyle = '#4a6470';
  ctx.fillRect(8, 8, ANCHO - 16, 1);
  ctx.fillRect(8, ALTO - 9, ANCHO - 16, 1);
  ctx.fillRect(8, 8, 1, ALTO - 16);
  ctx.fillRect(ANCHO - 9, 8, 1, ALTO - 16);

  // Orden por profundidad: lo que está más abajo se pinta encima.
  const figuras = [
    ...munecos.map((m) => ({ y: m.y, pinta: () => {
      const f = m.golpeado > DESTELLO - 4 ? 'golpeado-1' : m.golpeado > 0 ? 'golpeado-2' : 'quieto-1';
      pintar(ctx, HOJAS.muneco, f, Math.round(m.x) - 16, Math.round(m.y) - 14, m.vx < 0);
    } })),
    { y: espiritu.y, pinta: () => {
      // El cuerpo del espíritu está en (13, 18) dentro de su fotograma.
      const espejo = espiritu.mira.x < 0;
      pintar(ctx, HOJAS.espiritu, fotogramaEspiritu(espiritu), Math.round(espiritu.x) - (espejo ? 18 : 13), Math.round(espiritu.y) - 18, espejo);
    } },
  ];
  figuras.sort((a, b) => a.y - b.y).forEach((f) => f.pinta());

  for (const c of chispas) {
    const nombre = fotogramaPorAvance(HOJAS.chispas.fotogramas, `impacto-${c.tipo}`, 1 - c.vida / VIDA_CHISPA);
    pintar(ctx, HOJAS.chispas, nombre, Math.round(c.x) - 16, Math.round(c.y) - 16);
  }
  for (const p of sensacion.particulas) {
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
  }
}

arrancar(actualizar, dibujar);
