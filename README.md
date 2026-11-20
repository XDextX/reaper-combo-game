# Reaper Combo Game

An original 2D top-down game about combos: a reaper's apprentice spirit who grows stronger by chaining hits. Version 1 is a practice arena. What is in it and why: [docs/spec.md](docs/spec.md). The build order: [docs/plan.md](docs/plan.md). Both are in Spanish.

Status: technical base (a 320×180 canvas with crisp integer scaling and a fixed 60 Hz loop). The GitHub Pages demo arrives with task 8 of the plan.

## Run

Requires Node 22.12 or later.

    npm install
    npm run dev      # opens the arena in the browser (Vite)

## Test and build

    npm test         # vitest: the logic (loop and scaling for now; later combos, input and states)
    npm run build    # type-checks (tsc) and writes the site to dist/

`dist/` uses relative paths, so it works as-is on GitHub Pages under `/reaper-combo-game/`.

## Tech

Vite + TypeScript, hand-written Canvas 2D, no game engine. Fixed 60 Hz step. Sprites drawn with Lienzo.
