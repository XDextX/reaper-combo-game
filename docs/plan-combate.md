# Reaper Combo Game: plan del combate

Basado en la sección «Combate» de [spec.md](spec.md), aprobada por el dueño el 2026-11-20. Cada tarea va en su rama y worktree, pasa revisión de código y se confirma con las palabras del dueño. Sin push sin aprobación.

| # | Tarea (rama) | Contenido | Depende de | Hecho cuando |
|---|---|---|---|---|
| 1 | `vida` | Vida del espíritu (5), invulnerabilidad de 1 s y durante la esquiva, el combo se rompe al recibir, pantalla «Has caído» con reintento, vida en el HUD con anuncio | — | Tests de daño, invulnerabilidad y reinicio |
| 2 | `enemigos` | Módulo de enemigos puro: vida, daño por golpe (1/2/3), los tres comportamientos (segador con aviso de 0,5 s, lanzador con proyectil cada 2 s, escudado que bloquea L de frente), proyectiles y reaparición (3 en la arena, 1 s, por un borde) | 1 | Tests de cada comportamiento, del bloqueo y de la reaparición; se juega con rectángulos de colores |
| 3 | `modos` | Botón del HUD Práctica/Combate; empieza en Combate | 2 | Se alterna sin reiniciar la página; teclado y lector de pantalla |
| 4 | `sprites-enemigos` | Hojas de Lienzo de los tres enemigos y el proyectil en 4 direcciones (quieto, andar, aviso, ataque, golpeado, muerte) y corazones de vida | 2 | Primero el dueño aprueba un fotograma de cada enemigo; luego se ven en el juego |
| 5 | QA | Repaso en teclado, mando y móvil contra la sección «Combate» | 3, 4 | Informe sin fallos abiertos |

La tarea 4 puede ir en paralelo con la 3. El dueño aprueba cómo se siente el combate al cerrar la 2 (con rectángulos) y otra vez al cerrar la 4.
