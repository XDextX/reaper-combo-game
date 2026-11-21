// Lista de combos en vivo y contador, en HTML encima del canvas (spec, «Accesibilidad y movimiento»).
import { avance, type Combo } from './combos';
import type { Accion } from './traducir';

const NOMBRE_ACCION: Record<Accion, string> = { L: 'golpe ligero', P: 'golpe pesado', E: 'esquiva' };
const DESTACAR = 700; // ms que se ilumina un combo recién hecho

export function crearInterfaz(combos: Combo[]) {
  const lista = document.querySelector<HTMLOListElement>('#combos')!;
  const contador = document.querySelector<HTMLElement>('#contador')!;
  const aviso = document.querySelector<HTMLElement>('#aviso-combo')!;

  const filas = combos.map((c) => {
    const li = document.createElement('li');
    const nombre = document.createElement('span');
    nombre.className = 'nombre';
    nombre.textContent = c.nombre;
    const pasos = c.secuencia.map((a) => {
      const paso = document.createElement('span');
      paso.className = `paso paso-${a}`;
      paso.textContent = a;
      paso.title = NOMBRE_ACCION[a];
      return paso;
    });
    li.append(nombre, ...pasos);
    lista.append(li);
    return { li, pasos };
  });

  let hecho: { combo: Combo; hasta: number } | null = null;
  let anterior = '';

  return {
    /** Llamar al completar un combo: se ilumina un momento y se anuncia una vez. */
    combo(c: Combo, t: number) {
      hecho = { combo: c, hasta: t + DESTACAR };
      // Un espacio invisible alterno hace que el lector anuncie también el mismo combo dos veces seguidas.
      aviso.textContent = aviso.textContent === c.nombre ? `${c.nombre}\u200b` : c.nombre;
    },
    /** Pinta el estado; solo toca el DOM si algo cambió. */
    actualizar(historial: readonly Accion[], golpes: number, multiplicador: number, t: number) {
      if (hecho && t > hecho.hasta) hecho = null;
      const avances = combos.map((c) => (hecho?.combo === c ? c.secuencia.length : avance(historial, c)));
      const clave = `${avances.join()}|${golpes}|${multiplicador}`;
      if (clave === anterior) return;
      anterior = clave;
      filas.forEach(({ li, pasos }, i) => {
        li.classList.toggle('completo', avances[i] === pasos.length);
        pasos.forEach((p, j) => {
          p.classList.toggle('hecho', j < avances[i]);
          if (j === avances[i] - 1) p.setAttribute('aria-current', 'step');
          else p.removeAttribute('aria-current');
        });
      });
      contador.textContent = golpes > 0 ? `${golpes} ${golpes === 1 ? 'golpe' : 'golpes'} · ×${multiplicador}` : '';
    },
  };
}
