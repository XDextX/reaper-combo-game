# Reaper Combo Game: plan de los componentes RPG

Basado en la sección «Componentes RPG» de [spec.md](spec.md), aprobada por el dueño el 2026-11-22. Cada tarea va en su rama y worktree, se confirma con las palabras del dueño y deja algo jugable. Sin push sin aprobación.

| # | Tarea (rama) | Contenido | Hecho cuando |
|---|---|---|---|
| 1 | `botin` | Botín al morir (probabilidades, 10 s, parpadeo suave, recoger al pasar) y alma que cura | Tests de probabilidades, caducidad y recogida; se cura jugando |
| 2 | `mejoras` | Alma inestable y elección de 1 de 3 mejoras (más vida, más daño, robo de vida, infusión), accesible con teclado, mando, toque y lector | Tests de cada mejora y de su acumulación |
| 3 | `estados` | Los 7 estados alterados con su icono provisional | Tests de cada estado y de sus límites |
| 4 | `equipo` | Huecos de guadaña, amuleto y túnica; objetos que caen y se sustituyen; HUD del equipo | Tests de sustitución y efectos |
| 5 | `asistentes` | Farol, Cuervo y Polilla | Tests de cada efecto |
| 6 | `sprites-rpg` | Dibujos de Lienzo: botín, iconos de estado, objetos y asistentes | El dueño aprueba los dibujos |
| 7 | QA | Repaso en teclado, mando y móvil | Informe sin fallos abiertos |
