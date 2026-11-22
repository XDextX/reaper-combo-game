import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

/**
 * Escribe sw.js al compilar, con la lista de todos los archivos del juego (spec, «PWA»).
 * La caché se llama según el contenido, así que cada versión nueva usa una caché nueva.
 */
function serviceWorker(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    generateBundle(_, bundle) {
      const publicos = readdirSync('public');
      const archivos = ['./', ...Object.keys(bundle), ...publicos].map((f) => (f === './' ? f : `./${f}`));
      const huella = createHash('sha256');
      for (const [nombre, salida] of Object.entries(bundle)) huella.update(nombre + ('code' in salida ? salida.code : salida.source));
      for (const f of publicos) huella.update(f).update(readFileSync(`public/${f}`));
      const cache = `reaper-${huella.digest('hex').slice(0, 12)}`;
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `// Generado al compilar (vite.config.ts): guarda el juego para jugar sin conexión.
const CACHE = ${JSON.stringify(cache)};
const ARCHIVOS = ${JSON.stringify(archivos)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((claves) => Promise.all(claves.filter((k) => k.startsWith('reaper-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// ignoreVary: el script del juego se pide con cabecera Origin y el servidor responde con Vary: Origin.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true, ignoreVary: true }).then((r) => r || fetch(e.request)));
});
`,
      });
    },
  };
}

// Rutas relativas: sirve en GitHub Pages bajo /reaper-combo-game/.
export default defineConfig({ base: './', plugins: [serviceWorker()] });
