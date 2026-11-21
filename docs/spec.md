# Reaper Combo Game: spec v1

Estado: **aprobada por el dueño el 2026-11-20.**

## Idea

Un juego 2D cenital y original. Eres un espíritu menor, un aprendiz de segador que se hace más fuerte encadenando golpes. Cuando un combo sale bien tiene que notarse: el golpe pesa, la pantalla responde y el contador sube.

No usa nombres, personajes, arte ni niveles de ningún juego existente.

## Alcance de la v1: arena de práctica

Entra:
- Una arena de una sola pantalla con 3 muñecos de práctica que no mueren ni atacan.
- El espíritu se mueve en 8 direcciones y tiene 3 acciones: golpe ligero (L), golpe pesado (P) y esquiva (E).
- 5 combos con nombre (ver «Combos»).
- Un contador de combo con multiplicador.
- La lista de combos en pantalla, que se ilumina paso a paso mientras ejecutas un combo.
- La sensación del golpe: pausa al impactar, temblor de pantalla, partículas y destello del muñeco.
- Controles de teclado, mando y táctiles.
- Demo publicada en GitHub Pages.

Queda para después: oleadas de enemigos, enemigos que atacan, jefe, vida y muerte del jugador, menús, sonido y guardado.

## Combos

Hay dos capas que funcionan a la vez.

**1. Secuencias con nombre.** El detector guarda las últimas acciones con su instante. Una secuencia cuenta si cada acción llega como mucho 400 ms después de la anterior. Gana la secuencia más larga que coincida.

| Nombre | Secuencia | Efecto |
|---|---|---|
| Siega | L L L | Tres cortes rápidos; el último empuja |
| Guadañazo | L L P | Barrido en arco amplio |
| Juicio | P P | Golpe lento con mucho empuje y pausa larga |
| Paso fantasma | E L | Esquiva y corte al salir, con un pequeño avance |
| Cosecha | L P E P | Final: golpe giratorio en área |

Los nombres y los tiempos son valores iniciales; se ajustan jugando y viven en un solo archivo de datos.

**2. Contador y multiplicador.** Cada golpe que conecta suma 1. El multiplicador sube un nivel cada 10 golpes, hasta x4. El contador se rompe tras 2 s sin conectar un golpe. Como en la v1 los muñecos no atacan, la regla de que recibir daño rompe el contador queda escrita pero sin uso.

## Controles

Una sola capa de entrada traduce teclado, mando y táctil a las mismas acciones (mover, L, P, E). El resto del juego no sabe de dónde vienen.

| Acción | Teclado | Mando (Gamepad API) | Móvil |
|---|---|---|---|
| Mover | WASD o flechas | Stick izquierdo o cruceta | Joystick táctil a la izquierda |
| Golpe ligero | J | Botón inferior | Botón L |
| Golpe pesado | K | Botón izquierdo | Botón P |
| Esquiva | Espacio | Botón derecho | Botón E |

La tecla se lee por su posición física (`KeyboardEvent.code`), así que WASD, J y K caen en el mismo sitio con un teclado AZERTY.

**Pantalla.** La arena mide 480×270 y se escala por el mayor entero de píxeles de dispositivo que cabe en la ventana menos una columna de 160 px a la derecha, la del HUD, para que este no la tape. Queda centrada en el resto, con bandas oscuras; así todos los píxeles miden lo mismo. Si la ventana es más pequeña que 480×270, se usa una escala fraccionaria para no recortar.

**Móvil.** Se juega en apaisado. La arena deja una columna de 160 px a la derecha, con L, P y E abajo y el HUD plegado arriba; el joystick flota en la parte izquierda de la pantalla. En vertical el juego se pausa y muestra un aviso en HTML: «Gira el teléfono». Los controles y el canvas llevan `touch-action: none`. La pantalla completa es opcional, no imprescindible (en iPhone no funciona).

## Estilo visual

- Pixel art oscuro, con fotogramas de 32×32 escalados sin suavizado.
- El espíritu tiene dibujos para cuatro direcciones: arriba, abajo y lado. Mirar a la izquierda es el lado volteado. Todas sus animaciones existen en las tres versiones (quieto, andar, golpes, esquiva y daño). Al moverse en diagonal se usa la dirección del eje con más peso, y en un empate gana el lado. Los golpes siguen alcanzando hacia donde mira, en 8 direcciones.
- Paleta: fondo casi negro, el espíritu en blanco espectral (#eef6f8) con sombras cian, y los golpes en magenta.
- Las hojas de sprites se dibujan con Lienzo, usando el elemento `pixels` y `spritesheet` / `sheetFrame`. Lienzo saca a la vez la hoja `.png` y su `.kit.json`. Los diseños de las hojas se generan con `assets/fuentes/hojas.py` y se guardan en `assets/fuentes/`, para que el dueño pueda abrirlos en el editor de Lienzo. Se renderizan con el comando de Lienzo directamente en `assets/` (por ejemplo, `node <lienzo>/lienzo.js render assets/fuentes/espiritu.json -o assets/espiritu.png`).

| Hoja | Animaciones (fotogramas) |
|---|---|
| espiritu | quieto (2), andar (4), golpe-L (3), golpe-P (4), esquiva (3), dano (2) |
| muneco | quieto (1), golpeado (2) |
| chispas | impacto-L (3), impacto-P (4) |
| suelo | 4 baldosas |

El juego lee las regiones directamente del `.kit.json` generado. Un mismo mapa sirve a la vez a Lienzo y al juego.

## Accesibilidad y movimiento

- La casilla «Temblor de pantalla» lo apaga del todo. Con `prefers-reduced-motion` el temblor no pasa de 1 px.
- Los destellos solo afectan a los muñecos y son como mucho 3 por segundo en toda la pantalla (WCAG 2.3.1).
- El nombre del combo se anuncia una vez (aria-live="polite") cuando sale el golpe de remate, aunque no alcance a ningún muñeco; el mismo combo dos veces seguidas se anuncia las dos.
- La lista de combos y la ayuda de controles van en HTML encima del canvas. El paso actual se marca con `aria-current`, sin anunciarse en cada golpe.
- L, P y E no se distinguen solo por color: cada uno lleva su letra o su forma.
- El canvas lleva `role="img"` y una etiqueta. El límite de la arena tiene un contraste de al menos 3:1 con el fondo.

## Tecnología

- Vite + TypeScript, con Canvas 2D a mano y sin motor de juegos.
- Bucle de juego con paso fijo de 60 Hz.
- vitest para la lógica: el detector de combos, el contador y multiplicador, la máquina de estados del espíritu (quieto, andar, atacando, esquivando) y la capa de entrada.
- Despliegue en GitHub Pages con una GitHub Action.

## Qué debe lucir en el portafolio

1. La sensación del golpe. Es lo primero que se nota en la demo.
2. La lista de combos en vivo, que se ilumina mientras juegas.
3. La demo jugable online, enlazada desde el README con una captura o un GIF.

## Hecho para la v1

- La demo en GitHub Pages carga y es jugable con teclado, mando y en un móvil.
- Los 5 combos se pueden ejecutar, y la lista los marca al salir.
- El contador y el multiplicador funcionan según las reglas de arriba.
- Los tests de vitest pasan para el detector, el contador, la máquina de estados y la capa de entrada.
- Los sprites salen de hojas hechas con Lienzo, y sus diseños están en el repo.
