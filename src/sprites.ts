// Hojas de sprites de Lienzo: cada PNG con el .kit.json que Lienzo genera a la vez.
import chispasKit from '../assets/chispas.kit.json';
import chispasPng from '../assets/chispas.png';
import enemigosKit from '../assets/enemigos.kit.json';
import enemigosPng from '../assets/enemigos.png';
import espirituKit from '../assets/espiritu.kit.json';
import espirituPng from '../assets/espiritu.png';
import munecoKit from '../assets/muneco.kit.json';
import munecoPng from '../assets/muneco.png';
import sueloKit from '../assets/suelo.kit.json';
import sueloPng from '../assets/suelo.png';

type Region = { x: number; y: number; width: number; height: number };
type Kit = { sprites: Record<string, { frames: Record<string, Region> }> };
export type Hoja = { img: HTMLImageElement; fotogramas: Record<string, Region> };

function cargar(url: string, kit: Kit, nombre: string): Hoja {
  const img = new Image();
  img.src = url;
  return { img, fotogramas: kit.sprites[nombre].frames };
}

export const HOJAS = {
  espiritu: cargar(espirituPng, espirituKit, 'espiritu'),
  muneco: cargar(munecoPng, munecoKit, 'muneco'),
  chispas: cargar(chispasPng, chispasKit, 'chispas'),
  suelo: cargar(sueloPng, sueloKit, 'suelo'),
  enemigos: cargar(enemigosPng, enemigosKit, 'enemigos'),
};

/** Dibuja un fotograma con su esquina en (x, y) respecto al origen actual; `espejo` lo voltea en horizontal. */
export function pintar(ctx: CanvasRenderingContext2D, hoja: Hoja, nombre: string, x: number, y: number, espejo = false): void {
  const r = hoja.fotogramas[nombre];
  if (!r || !hoja.img.complete || hoja.img.naturalWidth === 0) return; // sin cargar o rota: no se pinta
  ctx.save();
  if (espejo) {
    ctx.scale(-1, 1);
    x = -x - r.width;
  }
  ctx.drawImage(hoja.img, r.x, r.y, r.width, r.height, x, y, r.width, r.height);
  ctx.restore();
}
