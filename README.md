# Reaper Combo Game

An original 2D top-down game about combos: a reaper's apprentice spirit who grows stronger by chaining hits. Version 1 is a practice arena. What is in it and why: [docs/spec.md](docs/spec.md). The build order: [docs/plan.md](docs/plan.md). Both are in Spanish.

**Play it:** https://xdextx.github.io/reaper-combo-game/ (keyboard, gamepad or touch).

## How to play

| Action | Keyboard | Gamepad | Touch |
|---|---|---|---|
| Move | WASD or arrows | Left stick or d-pad | Left-side joystick |
| Light hit (L) | J | Bottom button | L |
| Heavy hit (P) | K | Left button | P |
| Dodge (E) | Space | Right button | E |

Chain actions less than 400 ms apart to land a named combo:

| Combo | Input | Finisher |
|---|---|---|
| Siega | L L L | Third cut pushes harder |
| Guadañazo | L L P | Wide sweeping arc |
| Juicio | P P | Slow, heavy hit with a long freeze |
| Paso fantasma | E L | Dodge, then lunge and cut |
| Cosecha | L P E P | Spinning hit all around |

Every hit that connects adds to the counter; the multiplier rises every 10 hits up to ×4 and resets after 2 s without a hit. Screen shake follows `prefers-reduced-motion` and can be turned off under «Controles».

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
