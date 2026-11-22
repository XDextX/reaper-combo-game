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

## Combate

Aprobado por el dueño el 2026-11-20.

**Modos.** Un botón del HUD alterna entre *Práctica* (los muñecos de la v1) y *Combate*. El juego empieza en Combate.

**Vida del espíritu.** Aguanta 5 golpes y no recupera vida. Al recibir uno parpadea durante 1 s y en ese tiempo no le hacen daño. Mientras esquiva (E) tampoco recibe daño. Cuando le dan, el contador de combo se rompe. Al llegar a cero aparece la pantalla «Has caído», con los golpes y el mejor combo de la partida y un botón para reintentar (o pulsar J). La vida se muestra en el HUD y se anuncia a los lectores de pantalla cuando cambia.

**Enemigos.** Siempre hay 3 en la arena. Cuando uno muere, aparece otro por un borde al cabo de 1 s. El tipo se elige al azar entre tres:

- **Segador menor** (cuerpo a cuerpo): 3 de vida. Se acerca y, antes de golpear, se queda quieto y brilla durante 0,5 s, lo que da tiempo a esquivar.
- **Lanzador** (a distancia): 2 de vida. Se mantiene a unos 120 px y dispara un proyectil lento cada 2 s, con un aviso previo. El proyectil se esquiva o se corta con un golpe.
- **Escudado**: 4 de vida. Bloquea los golpes ligeros que le llegan de frente, con una chispa gris y sin daño. P, los combos y los golpes por la espalda sí le hacen daño.

**Daño de los golpes.** L quita 1, P quita 2 y el remate de un combo quita 3. Cada enemigo tiene sus propios fotogramas de quieto, andar, aviso, ataque, golpeado y muerte. Los dibujos se hacen con Lienzo en 4 direcciones, igual que el espíritu, y el dueño los aprueba antes de usarlos.

Fuera de esta versión: oleadas, jefe, puntuación guardada y dificultad creciente.

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
- Los destellos (el blanco de un muñeco o un enemigo golpeado) son como mucho 3 por segundo en toda la pantalla (WCAG 2.3.1). El parpadeo del espíritu herido va a 3 por segundo. El aviso de ataque de un enemigo se ve siempre, aunque pase del límite, porque sin él no hay tiempo para esquivar: dura 0,5 s y ocupa un área pequeña, por debajo del umbral de destello general de WCAG.
- El nombre del combo se anuncia una vez (aria-live="polite") cuando sale el golpe de remate, aunque no alcance a ningún muñeco; el mismo combo dos veces seguidas se anuncia las dos.
- La lista de combos y la ayuda de controles van en HTML encima del canvas. El paso actual se marca con `aria-current`, sin anunciarse en cada golpe.
- L, P y E no se distinguen solo por color: cada uno lleva su letra o su forma.
- El canvas lleva `role="img"` y una etiqueta. El límite de la arena tiene un contraste de al menos 3:1 con el fondo.

## Componentes RPG

Aprobado por el dueño el 2026-11-22. Solo en el modo Combate. Todo se pierde al caer: cada partida empieza sin mejoras ni equipo.

**Botín.** Al morir, un enemigo puede soltar un objeto de equipo (10 %), un alma que cura 1 corazón (15 %) o un **alma inestable** (8 %). Lo que cae parpadea suave y desaparece a los 10 s. Se recoge pasando por encima.

**Alma inestable.** Al recogerla, el juego se pausa y se elige 1 de 3 mejoras al azar, con teclado, mando, toque o lector de pantalla. Las mejoras se acumulan:

- **Más vida:** +1 corazón máximo y cura uno.
- **Más daño:** +1 al golpe pesado (P) y a los remates de combo.
- **Robo de vida:** cada 10 golpes de combo seguidos se recupera 1 corazón.
- **Infusión:** los golpes aplican un estado al azar de la lista de abajo.

**Estados alterados** (sobre los enemigos; cada uno con su icono encima del enemigo):

- **Quemadura** (fuego): 1 de daño por segundo durante 3 s.
- **Veneno:** 1 de daño cada 2 s durante 6 s; se acumula hasta 3 veces.
- **Sangrado:** 1 de daño cada vez que el enemigo recorre 40 px; dura 5 s.
- **Lentitud** (hielo): se mueve y avisa a la mitad de velocidad durante 3 s.
- **Aturdimiento** (rayo): paralizado 1 s, y no se repite hasta pasados 3 s.
- **Ceguera:** durante 3 s pierde de vista al espíritu y anda sin rumbo; si ataca, apunta mal.
- **Marca** (sombra): el siguiente golpe que recibe hace el doble de daño.

**Equipo.** 4 huecos, un objeto por hueco; recoger otro del mismo tipo sustituye al que se llevaba. El HUD dice qué se lleva y qué hace.

- **Guadaña:** da un elemento a los golpes, una por estado (por ejemplo, la guadaña ígnea aplica quemadura y la guadaña del cuervo, ceguera).
- **Amuleto:** un efecto pasivo, por ejemplo +1 corazón, robo de vida o más tiempo sin recibir daño tras un golpe.
- **Túnica:** defensa, por ejemplo esquiva más larga, un golpe que no quita vida cada 20 s, o enemigos más lentos alrededor.
- **Asistente:** un pequeño espíritu que sigue al jugador y aplica buffs o debuffs según su tipo: el **Farol** da +1 de daño mientras hay enemigos cerca, el **Cuervo** ciega cada 4 s al enemigo más cercano y la **Polilla** ralentiza los proyectiles que pasan cerca.

**Dibujos.** El botín, los iconos de estado, los objetos y los asistentes se dibujan con Lienzo, y el dueño los aprueba antes de usarlos. Los números de esta sección son un primer reparto que se ajusta jugando.

## PWA

Aprobado por el dueño el 2026-11-22. El juego se puede instalar en el móvil y en el escritorio, y funciona sin conexión después de la primera visita.

- **Manifiesto:** nombre «Reaper Combo Game», nombre corto «Reaper», pantalla completa en horizontal (`display: fullscreen`, `orientation: landscape`) y fondo y color de tema `#07070b`.
- **Iconos:** el espíritu sobre fondo oscuro, dibujado con Lienzo a 192, 512 y 512 *maskable*. El dueño los aprueba antes de usarlos.
- **Sin conexión:** un service worker escrito a mano, sin dependencias nuevas, guarda en caché todos los archivos del juego al instalarse. Cada versión nueva lleva su propio nombre de caché, y el worker sustituye la caché anterior al activarse.
- **Ruta:** como la demo va en GitHub Pages bajo una subcarpeta, todas las rutas son relativas.

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
