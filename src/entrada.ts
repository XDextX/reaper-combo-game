import {
  BOTONES_ACCION, BOTONES_MOVER, TECLAS_ACCION, TECLAS_MOVER,
  esTeclaDeJuego, flancos, joystick, limitar, sumar, zonaMuerta,
  type Accion, type Pulsacion, type Vector,
} from './traducir';

export type Lectura = { mover: Vector; acciones: Pulsacion[] };

const RADIO_JOYSTICK = 48; // px CSS

/**
 * Junta teclado, mando y táctil. El juego llama a `leer()` en cada paso fijo:
 * las acciones llegan con la marca de tiempo del evento, no del fotograma.
 */
export function crearEntrada(): { leer(): Lectura } {
  const cola: Pulsacion[] = [];
  const teclas = new Set<string>();
  const botonesAntes = new Map<number, Set<number>>();
  let tactil: Vector = { x: 0, y: 0 };


  addEventListener('keydown', (e) => {
    // En Mac no llega keyup de lo que se pulsó con Cmd: se suelta todo para que nada se quede pegado.
    if (e.key === 'Meta') teclas.clear();
    if (!esTeclaDeJuego(e, e.target)) return;
    const accion = Object.hasOwn(TECLAS_ACCION, e.code) ? TECLAS_ACCION[e.code] : undefined;
    e.preventDefault(); // que Espacio y las flechas no hagan scroll
    teclas.add(e.code);
    if (accion && !e.repeat) cola.push({ accion, t: e.timeStamp });
  });
  addEventListener('keyup', (e) => (e.key === 'Meta' ? teclas.clear() : teclas.delete(e.code)));

  for (const boton of document.querySelectorAll<HTMLButtonElement>('[data-accion]')) {
    const accion = boton.dataset.accion as Accion;
    boton.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      cola.push({ accion, t: e.timeStamp });
    });
    // detail 0: activado sin puntero (teclado, lector de pantalla, pulsador).
    boton.addEventListener('click', (e) => e.detail === 0 && cola.push({ accion, t: e.timeStamp }));
  }

  const zona = document.querySelector<HTMLElement>('#joystick');
  const pomo = document.querySelector<HTMLElement>('#pomo');
  let origen: { x: number; y: number; id: number } | null = null;
  const reiniciarJoystick = () => {
    origen = null;
    tactil = { x: 0, y: 0 };
    pomo?.style.removeProperty('transform');
    zona?.classList.remove('activo');
  };
  const soltar = (e: PointerEvent) => {
    if (origen && e.pointerId === origen.id) reiniciarJoystick(); // otro dedo no suelta el joystick
  };
  zona?.addEventListener('pointerdown', (e) => {
    if (origen) return; // ya lo maneja otro dedo
    zona.setPointerCapture(e.pointerId);
    origen = { x: e.clientX, y: e.clientY, id: e.pointerId };
    zona.style.setProperty('--x', `${e.clientX}px`);
    zona.style.setProperty('--y', `${e.clientY}px`);
    zona.classList.add('activo');
  });
  zona?.addEventListener('pointermove', (e) => {
    if (!origen || e.pointerId !== origen.id) return;
    tactil = joystick(e.clientX - origen.x, e.clientY - origen.y, RADIO_JOYSTICK);
    pomo?.style.setProperty('transform', `translate(${tactil.x * RADIO_JOYSTICK}px, ${tactil.y * RADIO_JOYSTICK}px)`);
  });
  zona?.addEventListener('pointerup', soltar);
  // Al girar el móvil se pierde la captura sin pointerup: sin esto el joystick se queda pegado.
  zona?.addEventListener('lostpointercapture', soltar);

  // Al pausar se suelta todo y se tiran las acciones pendientes, para que no salgan al volver.
  const soltarTodo = () => {
    teclas.clear();
    cola.length = 0;
    reiniciarJoystick();
  };
  addEventListener('blur', soltarTodo);
  document.addEventListener('visibilitychange', () => document.hidden && soltarTodo());
  zona?.addEventListener('pointercancel', soltar);

  function leerMandos(): Vector {
    const v = { x: 0, y: 0 };
    // shortcut: usa los índices del mapeo estándar aunque el mando no lo declare; mapear otros si QA lo pide.
    for (const pad of navigator.getGamepads?.() ?? []) {
      if (!pad) continue;
      const stick = zonaMuerta({ x: pad.axes[0] ?? 0, y: pad.axes[1] ?? 0 });
      const ahora = new Set(pad.buttons.flatMap((b, i) => (b.pressed ? [i] : [])));
      const cruceta = sumar(ahora, BOTONES_MOVER);
      v.x += stick.x + cruceta.x;
      v.y += stick.y + cruceta.y;
      const t = performance.now();
      for (const i of flancos(botonesAntes.get(pad.index) ?? new Set<number>(), ahora)) {
        const accion = BOTONES_ACCION[i];
        if (accion) cola.push({ accion, t });
      }
      botonesAntes.set(pad.index, ahora);
    }
    return v;
  }

  return {
    leer() {
      const teclado = sumar(teclas, TECLAS_MOVER);
      const mando = leerMandos();
      const mover = limitar({ x: teclado.x + mando.x + tactil.x, y: teclado.y + mando.y + tactil.y });
      return { mover, acciones: cola.splice(0) };
    },
  };
}
