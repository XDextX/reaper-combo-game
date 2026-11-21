import { arrancar } from './bucle';
import { COMBOS, crearContador, crearDetector } from './combos';
import { crearEntrada } from './entrada';
import { DURACION, actualizar as moverEspiritu, crearEspiritu, pedir, type Espiritu } from './espiritu';
import { DESTELLO, actualizarMuneco, cajaMuneco, crearLimiteDestellos, crearMuneco, recibir, solapan } from './munecos';
import { crearInterfaz } from './interfaz';
import { ANCHO, ALTO, encuadre, seguirPantalla } from './pantalla';
import { avanzar, crearSensacion, desplazamiento, impacto } from './sensacion';
import { direccion, fotogramaEnBucle, fotogramaPorAvance } from './animacion';
import { HOJAS, pintar } from './sprites';

const canvas = document.querySelector<HTMLCanvasElement>('#juego')!;
const ctx = canvas.getContext('2d')!;
const entrada = crearEntrada();
let marco = { e: 1, x: 0, y: 0 };
// La arena deja libre una columna a la derecha para el HUD (y en táctil, para los botones).
const tactil = matchMedia('(any-pointer: coarse)');
const vertical = matchMedia('(any-pointer: coarse) and (orientation: portrait)');
const RESERVA = 160; // px CSS
seguirPantalla(canvas, (ancho, alto) => {
  marco = encuadre(ancho, alto, Math.round(RESERVA * devicePixelRatio));
  ctx.imageSmoothingEnabled = false; // cambiar el tamaño del canvas lo reinicia
  dibujar(); // y lo borra: sin esto queda un fotograma en blanco
});

const espiritu = crearEspiritu(120, ALTO / 2);
const munecos = [crearMuneco(300, 90), crearMuneco(360, 142), crearMuneco(300, 195)];
const detector = crearDetector();
const contador = crearContador();
const interfaz = crearInterfaz(COMBOS);
if (tactil.matches) document.querySelector<HTMLDetailsElement>('#lista')!.open = false; // plegada en táctil
const sensacion = crearSensacion();

// Temblor de pantalla: la casilla lo apaga del todo; con movimiento reducido no pasa de 1 px.
const opcionTemblor = document.querySelector<HTMLInputElement>('#opcion-temblor')!;
const movimientoReducido = matchMedia('(prefers-reduced-motion: reduce)');
try {
  opcionTemblor.checked = localStorage.getItem('temblor') !== '0';
} catch {
  opcionTemblor.checked = true;
}
opcionTemblor.addEventListener('change', () => {
  try { localStorage.setItem('temblor', opcionTemblor.checked ? '1' : '0'); } catch { /* sin almacenamiento: solo esta visita */ }
});
const maxTemblor = () => (!opcionTemblor.checked ? 0 : movimientoReducido.matches ? 1 : Infinity);
const destellos = crearLimiteDestellos();
// Tras un clic de ratón en el HUD el foco vuelve al juego: si no, Espacio abriría el desplegable en vez de esquivar.
// Con teclado, táctil o lector de pantalla el foco se queda donde está.
for (const control of document.querySelectorAll<HTMLElement>('#hud summary, #hud label')) {
  control.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') return;
    // Un clic en el texto de la etiqueta deja el foco en su casilla.
    const destino = control instanceof HTMLLabelElement ? control.control : control;
    setTimeout(() => destino?.blur());
  });
}
let tick = 0;
// Chispas de impacto: un sprite que se reproduce una vez en cada punto alcanzado.
const VIDA_CHISPA = 12;
let chispas: { x: number; y: number; tipo: 'L' | 'P'; vida: number }[] = [];

function actualizar(): void {
  const ahora = performance.now();
  const { mover, acciones } = entrada.leer();
  if (vertical.matches) return; // en vertical el juego espera a que se gire el teléfono
  tick++;
  for (const p of acciones) {
    pedir(espiritu, p.accion, detector.registrar(p));
  }
  if (!avanzar(sensacion)) {
    const golpe = moverEspiritu(espiritu, mover);
    if (golpe) {
      if (golpe.combo) interfaz.combo(golpe.combo, ahora);
      const tocados = munecos.filter((m) => solapan(golpe.caja, cajaMuneco(m)));
      const destella = tocados.length > 0 && destellos.pedir();
      const alcanzados = tocados.filter((m) => recibir(m, golpe, espiritu, destella));
      alcanzados.forEach(() => contador.golpe(ahora));
      if (alcanzados.length) impacto(sensacion, golpe, alcanzados, maxTemblor());
      const tipo = golpe.combo || golpe.accion === 'P' ? 'P' : 'L';
      for (const m of alcanzados) chispas.push({ x: m.x, y: m.y, tipo, vida: VIDA_CHISPA });
    }
    for (const m of munecos) actualizarMuneco(m);
  }
  destellos.paso();
  contador.actualizar(ahora);
  chispas = chispas.filter((c) => --c.vida > 0);
  interfaz.actualizar(detector.pendiente(ahora), contador.golpes, contador.multiplicador, ahora);
}

/** Animación del espíritu según su estado y hacia dónde mira (los de lado no llevan prefijo). */
function fotogramaEspiritu(e: Espiritu): string {
  const f = HOJAS.espiritu.fotogramas;
  const dir = direccion(e.mira);
  const p = dir === 'lado' ? '' : `${dir}-`;
  if (e.estado === 'atacando') return fotogramaPorAvance(f, `${p}golpe-${e.accion}`, e.paso / DURACION[e.accion!]);
  if (e.estado === 'esquivando') return fotogramaPorAvance(f, `${p}esquiva`, e.paso / DURACION.E);
  if (e.estado === 'andar') return fotogramaEnBucle(f, `${p}andar`, tick, 8);
  return fotogramaEnBucle(f, `${p}quieto`, tick, 30);
}

function dibujar(): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#07070b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // A partir de aquí se dibuja en píxeles de juego (480×270), siempre en posiciones enteras.
  const d = desplazamiento(sensacion);
  ctx.setTransform(marco.e, 0, 0, marco.e, marco.x + d.x * marco.e, marco.y + d.y * marco.e);
  ctx.fillStyle = '#12121a'; // se ve mientras cargan las hojas
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, ANCHO, ALTO);
  ctx.clip();
  for (let y = 0; y < ALTO; y += 32) {
    for (let x = 0; x < ANCHO; x += 32) pintar(ctx, HOJAS.suelo, `baldosa-${1 + ((x * 7 + y * 3) / 32) % 4}`, x, y);
  }
  ctx.restore();
  // Límite de la arena: contraste 3:1 con el fondo, porque es un borde con el que se choca.
  ctx.fillStyle = '#56747f';
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
      // El cuerpo está en (13, 18) dentro del fotograma de lado y en (16, 18) en los de frente y espalda.
      const lado = direccion(espiritu.mira) === 'lado';
      const espejo = lado && espiritu.mira.x < 0;
      const cx = !lado ? 16 : espejo ? 18 : 13;
      pintar(ctx, HOJAS.espiritu, fotogramaEspiritu(espiritu), Math.round(espiritu.x) - cx, Math.round(espiritu.y) - 18, espejo);
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
