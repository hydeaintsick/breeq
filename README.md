# Breeq

A brick breaker **built by players, for players**: you design a wall over your own photo from a kit of pieces, then dare everyone else to clear it.

## The core idea

Each player authors **levels** from a catalog (`game/breakout/engine/catalog.ts`) and a piece budget. Other players clear them with a paddle and one to five lives.

- **Bricks** — glass, hard, steel, explosive (chains through neighbors), ghost (blinks open), regen (comes back), magnet (pulls the ball), rotor (a slow blade), key and lock.
- **Zones** — the ball passes through them: slow / ×2 / ×3 speed, gravity and anti-gravity, paired portals and a fake portal, mirror, fog, split (a second ball), and paddle mods: shrink, grow, invert, ice, sticky.
- **Obstacles** — bumper, rail, fan, sweeping guard, trampoline, black hole.
- **Rules** — lives, a timer, a descending wall, a forced color order.

**Speed** follows the classic rule: every few paddle hits the ball gains a notch, and rapid rebounds build heat that adds more. Losing a life resets it.

**The publish rule:** you can only publish a level after clearing it yourself, and `proveClearable` (a flawless autopilot) has to beat it too. Validation also refuses the structurally broken: unpaired portals, sealed-in keys, pieces in the paddle lane, over-budget walls.

## Showcase site

This repo starts as a **marketing site** for the game, not the game itself. It should feel like the product: a light glass page with one dark, glowing board on it, then a clear path to play.

**Light Glass, Neon Bricks** is the design system — Apple frost and soft color blooms, Airbnb editorial space, Revolut confidence — with the neon reserved for the bricks and the board aura. The same tokens drive the game UI so we do not redesign later.

Cheap on purpose: CSS/SVG, one Canvas 2D element for the board, Geist, one accent, six neons, no paid assets. See `AGENTS.md` for the full policy.

## Game engine

The board on the home page is not a video. It is the real engine playing real levels in `game/breakout/`, rotating through the showcase set, with an autopilot on the paddle until you move over the board and take it (`?level=n` opens a given level):

- `game/breakout/engine` — deterministic, fixed-step (240 Hz) game with a seeded PRNG: `Game` owns lives, score, multi-ball, every piece's behavior, the rules, and the speed model (`bonus × ramp × heat`). `Autopilot` is a seeded paddle AI used for demos; `proveClearable` runs it flawlessly as the publish gate.
- `game/breakout/engine/catalog.ts` — the piece catalog: names, blurbs, glyphs, costs. The editor and the site read it; the validator prices levels with it.
- `game/breakout/engine/level.ts` — the level API the editor will call: `createLevel({...}).background("/photo.jpg").brickRows({...}).zone("gravity", x, y).portal(x1, y1, x2, y2).bumper(x, y).rules({ timer: 240 }).build()`. Validation runs on `build()`.
- `game/breakout/levels/` — the showcase levels: *First Light* (the classic wall), *Undertow* (portals, magnets, ghosts, a fan, a descending wall), *Lockdown* (keys and locks, explosives, regen, rotors, a guard, a split zone, a black hole, a timer).
- `game/breakout/render` — Canvas 2D: photo + frame painted once per resize, neon glass bricks as cached glow sprites (one per kind), zones and obstacles drawn as shapes, balls with trails and speed auras, glass paddle with mod colors, particles.
- `game/breakout/preview` — browser mount: DPR cap, resize, off-screen and hidden-tab pause, reduced motion, and pointer/touch paddle control.
- `game/plinko` — the earlier vertical trap-board engine, kept intact and unmounted.
- `game/shared` — PRNG and color helpers shared by every engine.

Zero runtime dependencies beyond React.

## Getting started

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

Engine checks live outside the repo; the pre-commit hook runs `pnpm build`.
