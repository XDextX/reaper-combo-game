import { arrancar } from './bucle';
import { COMBOS, crearContador, crearDetector } from './combos';
import { crearEntrada } from './entrada';
import { DURACION, LIMITES, actualizar as moverEspiritu, crearEspiritu, pedir, type Espiritu } from './espiritu';
import { DESTELLO, actualizarMuneco, cajaMuneco, crearLimiteDestellos, crearMuneco, recibir, solapan } from './munecos';
import { crearInterfaz } from './interfaz';
import { ANCHO, ALTO, encuadre, seguirPantalla } from './pantalla';
import { avanzar, crearSensacion, desplazamiento, impacto } from './sensacion';
import { direccion, fotogramaEnBucle, fotogramaPorAvance } from './animacion';
import { HOJAS, pintar } from './sprites';
import { ALTO_ENEMIGO, ANCHO_ENEMIGO, MUERTE, RECUPERA, cajaEnemigo, crearCombate, pasoCombate, recibirGolpe, type Enemigo } from './enemigos';
import { INVULNERABLE, anotar, crearVida, curar, herir, pasoVida } from './vida';
import { crearEquipo, equipar, escarcha, estadoGuadana, invulnerableExtra, pasoEquipo, roboExtra, sortearObjeto, velo, ESCARCHA_RADIO, HUECO, blancoCuervo, danoFarol, frenarProyectiles, type Objeto } from './equipo';
import { aplicarEstado } from './estados';
import { pasoBotin, soltar, type Botin } from './botin';
import { aplicar, crearMejoras, danoExtra, describir, infusion, robar, sortear, type Opcion } from './mejoras';
import { activos, type Estado } from './estados';

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

let espiritu = crearEspiritu(120, ALTO / 2);
let vida = crearVida();
// Combate (enemigos) o práctica (los muñecos de la v1); el botón del HUD los alterna.
let modo: 'combate' | 'practica' = 'combate';
let combate = crearCombate(Math.random, espiritu);
let botin: Botin[] = [];
let mejoras = crearMejoras();
let equipo = crearEquipo();
const equipoHud = document.querySelector<HTMLElement>('#equipo-hud')!;
const avisoEquipo = document.querySelector<HTMLElement>('#aviso-equipo')!;
/** El HUD dice qué se lleva y qué hace. */
function pintarEquipo(): void {
  equipoHud.replaceChildren(...[equipo.guadana, equipo.amuleto, equipo.tunica, equipo.asistente].filter((o) => o !== null).map((o) => {
    const li = document.createElement('li');
    const nombre = document.createElement('strong');
    nombre.textContent = o.nombre;
    li.append(nombre, ` ${o.texto}`);
    return li;
  }));
}
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
for (const control of document.querySelectorAll<HTMLElement>('#hud summary, #hud label, #hud button')) {
  control.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') return;
    // Un clic en el texto de la etiqueta deja el foco en su casilla.
    const destino = control instanceof HTMLLabelElement ? control.control : control;
    setTimeout(() => destino?.blur());
  });
}
// Vida en el HUD (corazones a la vista, frase para lectores) y pantalla «Has caído».
const corazones = document.querySelector<HTMLElement>('#corazones')!;
const avisoVida = document.querySelector<HTMLElement>('#aviso-vida')!;
const caido = document.querySelector<HTMLElement>('#caido')!;
const resumen = document.querySelector<HTMLElement>('#caido-resumen')!;
const botonReintentar = document.querySelector<HTMLButtonElement>('#reintentar')!;
function pintarVida(anunciar: boolean): void {
  corazones.textContent = '♥'.repeat(vida.vida) + '♡'.repeat(vida.vidaMax - vida.vida);
  if (anunciar) avisoVida.textContent = `Vida: ${vida.vida} de ${vida.vidaMax}`;
}
pintarVida(false);
/** Un ataque enemigo alcanza al espíritu (lo llamarán los enemigos, tarea 2 del plan del combate). */
function danarEspiritu(): void {
  const esquivando = espiritu.estado === 'esquivando';
  if (vida.invulnerable === 0 && !esquivando && velo(equipo)) { // la túnica del velo para este golpe
    vida.invulnerable = INVULNERABLE;
    avisoEquipo.textContent = 'El velo paró el golpe';
    return;
  }
  if (!herir(vida, esquivando, invulnerableExtra(equipo))) return;
  contador.romper();
  pintarVida(true);
  if (vida.vida > 0) return;
  resumen.textContent = `${vida.golpes} ${vida.golpes === 1 ? 'golpe' : 'golpes'} · mejor combo: ${vida.mejorCombo}`;
  caido.hidden = false;
  botonReintentar.focus();
}
function reintentar(): void {
  espiritu = crearEspiritu(120, ALTO / 2);
  vida = crearVida();
  combate = crearCombate(Math.random, espiritu);
  contador.romper();
  chispas = [];
  botin = [];
  mejoras = crearMejoras();
  equipo = crearEquipo();
  pintarEquipo();
  cerrarMejora();
  pintarMejoras();
  caido.hidden = true;
  pintarVida(true);
  botonReintentar.blur(); // el foco no se queda en un botón oculto
}
botonReintentar.addEventListener('click', reintentar);

// Alma inestable: el juego se pausa y se elige 1 de 3 mejoras (botones: teclado, toque y lector; el bucle añade stick y J).
const panelMejora = document.querySelector<HTMLElement>('#mejora')!;
const opciones = document.querySelector<HTMLElement>('#opciones')!;
const mejorasHud = document.querySelector<HTMLElement>('#mejoras-hud')!;
const ESPERA_MEJORA = 20; // pasos sin aceptar J, para que machacar no elija sin querer
let eligiendo = 0; // 0: cerrado; si no, pasos desde que se abrió
let moverAntes = 0;
const botonesMejora = () => [...opciones.children] as HTMLButtonElement[];
function pintarMejoras(): void {
  const llevadas: Opcion[] = (['vida', 'dano', 'robo'] as const).map((mejora) => ({ mejora }));
  if (mejoras.infusionEstado) llevadas.push({ mejora: 'infusion', estado: mejoras.infusionEstado });
  mejorasHud.textContent = llevadas.filter(({ mejora }) => mejoras[mejora] > 0)
    .map((o) => `${describir(o).nombre}${mejoras[o.mejora] > 1 ? ` ×${mejoras[o.mejora]}` : ''}`).join(' · ');
}
type Eleccion = { nombre: string; texto: string; elegir: () => void };
const tituloEleccion = document.querySelector<HTMLElement>('#mejora-titulo')!;
const ayudaEleccion = document.querySelector<HTMLElement>('#mejora-ayuda')!;
/** Pausa el juego con un diálogo de botones (alma inestable o equipo nuevo). */
function abrirEleccion(titulo: string, ayuda: string, lista: Eleccion[]): void {
  tituloEleccion.textContent = titulo;
  ayudaEleccion.textContent = ayuda;
  opciones.replaceChildren(...lista.map(({ nombre, texto, elegir }) => {
    const b = document.createElement('button');
    b.type = 'button';
    const n = document.createElement('strong');
    n.textContent = nombre;
    b.append(n, texto);
    b.addEventListener('click', () => { elegir(); cerrarMejora(); });
    return b;
  }));
  panelMejora.hidden = false;
  eligiendo = 1;
  moverAntes = 0;
  botonesMejora()[0].focus();
}
const abrirMejora = () => abrirEleccion('Alma inestable', 'Elige una mejora: flechas o stick para moverte, J o Intro para elegir.',
  sortear().map((m) => ({ ...describir(m), elegir: () => elegirMejora(m) })));
function ponerObjeto(o: Objeto): void {
  const quitado = equipar(equipo, o, vida, espiritu);
  avisoEquipo.textContent = `${o.nombre}: ${o.texto}${quitado && quitado.id !== o.id ? ` Sustituye a ${quitado.nombre}.` : ''}`;
  pintarEquipo();
  pintarVida(false);
}
/** Equipo nuevo: con el hueco libre se pone sin preguntar; si no, se elige entre el nuevo y el que llevas. */
function recogerObjeto(o: Objeto): void {
  const actual = equipo[o.hueco];
  if (!actual) return ponerObjeto(o);
  abrirEleccion(`${HUECO[o.hueco]}: ${o.nombre}`, 'Equipa la nueva o quédate con lo que llevas (lo otro se pierde).', [
    { nombre: `Equipar ${o.nombre}`, texto: o.texto, elegir: () => ponerObjeto(o) },
    { nombre: `Seguir con ${actual.nombre}`, texto: actual.texto, elegir: () => { avisoEquipo.textContent = `Dejas ${o.nombre}.`; } },
  ]);
}
function cerrarMejora(): void {
  panelMejora.hidden = true;
  eligiendo = 0;
  (document.activeElement as HTMLElement | null)?.blur?.(); // el foco no se queda en un botón oculto
}
function elegirMejora(m: Opcion): void {
  aplicar(mejoras, vida, m);
  pintarVida(true);
  pintarMejoras();
}
panelMejora.addEventListener('keydown', (e) => { // modal: Tab da la vuelta entre las tres opciones
  if (e.key !== 'Tab') return;
  e.preventDefault();
  const b = botonesMejora();
  const i = b.indexOf(document.activeElement as HTMLButtonElement);
  b[(i + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus();
});
// «Has caído» es modal: con Tab el foco no sale de su único botón.
caido.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') { e.preventDefault(); botonReintentar.focus(); }
});
const botonModo = document.querySelector<HTMLButtonElement>('#modo')!;
botonModo.addEventListener('click', () => {
  modo = modo === 'combate' ? 'practica' : 'combate';
  botonModo.textContent = modo === 'combate' ? 'Pasar a práctica' : 'Pasar a combate';
  document.querySelector<HTMLElement>('#vida')!.hidden = modo === 'practica'; // en práctica nada hace daño
  reintentar(); // cada cambio empieza limpio: vida llena y enemigos nuevos
});
let tick = 0;
// Chispas de impacto: un sprite que se reproduce una vez en cada punto alcanzado.
const VIDA_CHISPA = 12;
let chispas: { x: number; y: number; tipo: 'L' | 'P' | 'B'; vida: number }[] = []; // B: bloqueo del escudado

const vivos = () => combate.enemigos.filter((e) => e.estado !== 'muerto');

function soltarBotin(e: { x: number; y: number }): void {
  const b = soltar(e.x, e.y);
  if (b?.tipo === 'equipo') b.objeto = sortearObjeto(); // se decide al caer, para ver su hueco en el suelo
  if (b) botin.push(b);
}

function actualizar(): void {
  const ahora = performance.now();
  const { mover, acciones } = entrada.leer();
  if (vertical.matches) return; // en vertical el juego espera a que se gire el teléfono
  if (vida.vida === 0) {
    if (acciones.some((p) => p.accion === 'L')) reintentar(); // J reintenta
    return;
  }
  if (eligiendo) {
    eligiendo++;
    const b = botonesMejora();
    const i = b.indexOf(document.activeElement as HTMLButtonElement);
    const dir = Math.abs(mover.x) > 0.5 ? Math.sign(mover.x) : Math.abs(mover.y) > 0.5 ? Math.sign(mover.y) : 0;
    if (dir !== 0 && dir !== moverAntes) b[(Math.max(i, 0) + dir + b.length) % b.length].focus();
    moverAntes = dir;
    if (eligiendo > ESPERA_MEJORA && i >= 0 && acciones.some((p) => p.accion === 'L')) b[i].click();
    return;
  }
  tick++;
  pasoVida(vida);
  pasoEquipo(equipo);
  for (const p of acciones) {
    pedir(espiritu, p.accion, detector.registrar(p));
  }
  if (!avanzar(sensacion)) {
    const golpe = moverEspiritu(espiritu, mover);
    if (golpe) {
      if (golpe.combo) interfaz.combo(golpe.combo, ahora);
      let alcanzados: { x: number; y: number }[];
      if (modo === 'combate') {
        const tocados = combate.enemigos.filter((e) => e.estado !== 'muerto' && solapan(golpe.caja, cajaEnemigo(e)));
        alcanzados = [];
        // El blanco de «golpeado» es un destello: pasa por el mismo límite de 3 por segundo que los muñecos.
        const destella = tocados.length > 0 && destellos.pedir();
        for (const e of tocados) {
          if (destella) destellan.add(e);
          else destellan.delete(e);
          const rumbo = { x: LIMITES.x0 + Math.random() * (LIMITES.x1 - LIMITES.x0), y: LIMITES.y0 + Math.random() * (LIMITES.y1 - LIMITES.y0) };
          const r = recibirGolpe(e, golpe, espiritu, danoExtra(mejoras, golpe.combo !== null || golpe.accion === 'P') + danoFarol(equipo, espiritu, vivos()), infusion(mejoras) ?? estadoGuadana(equipo), rumbo);
          if (r === 'bloqueo') chispas.push({ x: e.x, y: e.y, tipo: 'B', vida: VIDA_CHISPA });
          if (r === 'muerte') soltarBotin(e);
          else alcanzados.push(e);
        }
      } else {
        const tocados = munecos.filter((m) => solapan(golpe.caja, cajaMuneco(m)));
        const destella = tocados.length > 0 && destellos.pedir();
        alcanzados = tocados.filter((m) => recibir(m, golpe, espiritu, destella));
      }
      alcanzados.forEach(() => {
        contador.golpe(ahora);
        anotar(vida, contador.golpes);
        if (robar(mejoras, vida, contador.golpes, roboExtra(equipo))) pintarVida(true);
      });
      if (alcanzados.length) impacto(sensacion, golpe, alcanzados, maxTemblor());
      const tipo = golpe.combo || golpe.accion === 'P' ? 'P' : 'L';
      for (const m of alcanzados) chispas.push({ x: m.x, y: m.y, tipo, vida: VIDA_CHISPA });
    }
    if (modo === 'combate') {
      const cuerpo = { x: espiritu.x - 6, y: espiritu.y - 14, w: 12, h: 16 };
      pasoCombate(combate, espiritu, cuerpo, golpe?.caja ?? null, danarEspiritu, Math.random, soltarBotin);
      frenarProyectiles(equipo, espiritu, combate.proyectiles);
      const cegado = blancoCuervo(equipo, espiritu, vivos());
      if (cegado) aplicarEstado(cegado.estados, 'ceguera', { x: LIMITES.x0 + Math.random() * (LIMITES.x1 - LIMITES.x0), y: LIMITES.y0 + Math.random() * (LIMITES.y1 - LIMITES.y0) });
      if (escarcha(equipo)) { // túnica de escarcha: los enemigos de al lado van lentos
        for (const e of combate.enemigos) {
          if (e.estado !== 'muerto' && Math.hypot(e.x - espiritu.x, e.y - espiritu.y) < ESCARCHA_RADIO) aplicarEstado(e.estados, 'lentitud');
        }
      }
      botin = pasoBotin(botin, cuerpo, (b) => {
        if (b.tipo === 'cura') { curar(vida); pintarVida(true); }
        if (b.tipo === 'inestable') abrirMejora();
        if (b.objeto) recogerObjeto(b.objeto);
      });
    } else for (const m of munecos) actualizarMuneco(m);
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

const destellan = new WeakSet<Enemigo>(); // enemigos cuyo último golpe recibido destella
const COLOR_ESTADO: Record<Estado, string> = {
  quemadura: '#ff7a1a', veneno: '#6fd04f', sangrado: '#c0182a', lentitud: '#7fd8ff',
  aturdimiento: '#ffe14f', ceguera: '#8a8aa0', marca: '#b04fff',
};
/** Fotograma del enemigo según su estado y hacia dónde mira (los de lado no llevan dirección en el nombre). */
function fotogramaEnemigo(e: Enemigo): string {
  const f = HOJAS.enemigos.fotogramas;
  const dir = direccion(e.mira);
  const p = `${e.tipo}-${dir === 'lado' ? '' : `${dir}-`}`;
  if (e.estado === 'muerto') return fotogramaPorAvance(f, `${p}muerte`, 1 - e.t / MUERTE);
  if (e.estado === 'golpeado') return destellan.has(e) ? `${p}golpeado-1` : `${p}quieto-1`;
  if (e.estado === 'aviso') return `${p}aviso-1`;
  if (e.estado === 'recupera') return e.t > RECUPERA - 12 ? fotogramaPorAvance(f, `${p}ataque`, (RECUPERA - e.t) / 12) : `${p}quieto-1`;
  return fotogramaEnBucle(f, `${p}andar`, tick, 10);
}
function pintarEnemigo(e: Enemigo): void {
  const espejo = direccion(e.mira) === 'lado' && e.mira.x < 0;
  pintar(ctx, HOJAS.enemigos, fotogramaEnemigo(e), Math.round(e.x) - 16, Math.round(e.y) - 17, espejo);
  if (e.estado === 'muerto') return;
  ctx.fillStyle = '#ff7fd4'; // vida que le queda
  const x = Math.round(e.x - ANCHO_ENEMIGO / 2);
  const y = Math.round(e.y - ALTO_ENEMIGO / 2);
  for (let i = 0; i < e.vida; i++) ctx.fillRect(x + i * 3, y - 6, 2, 2);
  activos(e.estados).forEach((estado, i) => { // shortcut: iconos provisionales hasta la tarea 6 (dibujos)
    ctx.fillStyle = COLOR_ESTADO[estado];
    ctx.fillRect(x + i * 4, y - 11, 3, 3);
  });
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
    ...(modo === 'combate' ? combate.enemigos : []).map((e) => ({ y: e.y, pinta: () => pintarEnemigo(e) })),
    ...(modo === 'practica' ? munecos : []).map((m) => ({ y: m.y, pinta: () => {
      const f = m.golpeado > DESTELLO - 4 ? 'golpeado-1' : m.golpeado > 0 ? 'golpeado-2' : 'quieto-1';
      pintar(ctx, HOJAS.muneco, f, Math.round(m.x) - 16, Math.round(m.y) - 14, m.vx < 0);
    } })),
    { y: espiritu.y, pinta: () => {
      if (vida.invulnerable > 0 && Math.floor(vida.invulnerable / 10) % 2) return; // parpadea 3 veces por segundo mientras no le hacen daño
      // El cuerpo está en (13, 18) dentro del fotograma de lado y en (16, 18) en los de frente y espalda.
      const lado = direccion(espiritu.mira) === 'lado';
      const espejo = lado && espiritu.mira.x < 0;
      const cx = !lado ? 16 : espejo ? 18 : 13;
      pintar(ctx, HOJAS.espiritu, fotogramaEspiritu(espiritu), Math.round(espiritu.x) - cx, Math.round(espiritu.y) - 18, espejo);
    } },
  ];
  figuras.sort((a, b) => a.y - b.y).forEach((f) => f.pinta());

  for (const b of botin) {
    // shortcut: alma provisional hasta la tarea 6 (dibujos). En sus últimos 3 s late suave, sin destellar.
    ctx.globalAlpha = b.vida > 180 ? 1 : 0.55 + 0.45 * Math.cos(b.vida / 6);
    ctx.fillStyle = b.tipo === 'inestable' ? '#ff3fb8' : b.tipo === 'equipo' ? '#e0c050' : '#9fe6f0';
    ctx.fillRect(Math.round(b.x) - 3, Math.round(b.y) - 3, 6, 6);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 2, 2, 2);
    if (b.objeto) { // inicial del hueco: G guadaña, A amuleto, T túnica, E espíritu asistente
      ctx.fillStyle = '#e0c050';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(HUECO[b.objeto.hueco][0], Math.round(b.x), Math.round(b.y) - 5);
    }
    ctx.globalAlpha = 1;
  }
  if (equipo.asistente && modo === 'combate') { // shortcut: asistente provisional (un punto que flota detrás) hasta la tarea 6
    ctx.fillStyle = { farol: '#ffb347', 'cuervo-asistente': '#8a7bd8', polilla: '#e8e0c0' }[equipo.asistente.id] ?? '#fff';
    ctx.fillRect(Math.round(espiritu.x - espiritu.mira.x * 12) - 2, Math.round(espiritu.y - 14 + Math.sin(tick / 20) * 2) - 2, 4, 4);
  }
  for (const p of combate.proyectiles) {
    pintar(ctx, HOJAS.enemigos, 'orbe-1', Math.round(p.x) - 16, Math.round(p.y) - 16);
  }
  for (const c of chispas) {
    if (c.tipo === 'B') { // chispa gris del bloqueo: una cruz que se abre
      const r = Math.round((1 - c.vida / VIDA_CHISPA) * 8);
      ctx.fillStyle = '#9aa4ab';
      ctx.fillRect(Math.round(c.x) - r, Math.round(c.y), 2 * r + 1, 1);
      ctx.fillRect(Math.round(c.x), Math.round(c.y) - r, 1, 2 * r + 1);
      continue;
    }
    const nombre = fotogramaPorAvance(HOJAS.chispas.fotogramas, `impacto-${c.tipo}`, 1 - c.vida / VIDA_CHISPA);
    pintar(ctx, HOJAS.chispas, nombre, Math.round(c.x) - 16, Math.round(c.y) - 16);
  }
  for (const p of sensacion.particulas) {
    ctx.fillStyle = p.color;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
  }
}

arrancar(actualizar, dibujar);

// PWA: el service worker solo existe en la versión compilada (vite.config.ts lo genera).
if (import.meta.env.PROD && 'serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
