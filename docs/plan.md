# Reaper Combo Game: plan de implementación v1

Basado en [spec.md](spec.md), que el dueño aprobó el 2026-11-20. Cada tarea va en su propia rama y worktree, sale de `main` y termina en un PR revisado. Ningún commit ni push se hace sin las palabras del dueño. Las revisiones las reparte el Coordinador de roles. QA va al final, con turno de máquina.

| # | Tarea (rama) | Contenido | Depende de | Hecho cuando |
|---|---|---|---|---|
| 1 | `base` | Vite + TS + vitest, canvas a pantalla completa con escalado nítido y bucle de paso fijo a 60 Hz | — | `npm run dev` muestra la arena vacía; `npm test` pasa |
| 2 | `entrada` | Capa de entrada: teclado, mando y táctil (joystick y botones L/P/E) traducidos a acciones | 1 | Tests de traducción; se juega en un móvil |
| 3 | `combos` | Detector de secuencias (ventana de 400 ms, gana la más larga) y contador con multiplicador; datos de los combos en un archivo | 1 | Tests de cada combo, de las rupturas y del multiplicador |
| 4 | `espiritu` | Máquina de estados (quieto, andar, atacando, esquivando), movimiento, cajas de golpe y muñecos | 2, 3 | Tests de transiciones; los golpes conectan con los muñecos |
| 5 | `sprites` | Hojas de Lienzo (espíritu, muñeco, chispas, suelo) con `pixels` y `spritesheet`; diseños en `assets/fuentes/`; el juego lee el `.kit.json` | 1 | Primero se aprueba un fotograma del espíritu; luego las hojas completas se ven en el juego |
| 6 | `sensacion` | Pausa al impactar, temblor de pantalla, partículas y destello | 4, 5 | El dueño aprueba cómo se siente |
| 7 | `interfaz` | Lista de combos en vivo, contador y multiplicador en pantalla | 3, 4 | Se ilumina paso a paso al ejecutar un combo |
| 8 | `publicar` | GitHub Action a Pages; README con enlace y captura o GIF | 6, 7 | La demo pública carga y se juega |
| 9 | QA | Revisión final en teclado, mando y móvil contra la sección «Hecho» de la spec | 8 | Informe sin fallos abiertos |

Se pueden hacer en paralelo: 2, 3 y 5 tras la 1, y luego 6 y 7. La tarea 5 necesita reiniciar el servidor MCP de Lienzo para usar `pixels` y `spritesheet`.

En Telar todavía no hay tablero para este proyecto, y los agentes no pueden crearlo. Cuando el dueño lo cree, cada fila será una tarjeta.
