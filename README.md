# King of Thieves (Brick Breaker)

A Next.js take on *King of Thieves* as a brick breaker **built by players, for players**: you design a wall over your own photo, place bonus zones that bend the ball's speed, then dare everyone else to clear it.

## The core idea

Each player authors **levels**: glass bricks, hard bricks, steel posts, and bonus zones laid over a photo they chose. Other players clear them with a paddle and a fixed number of lives.

**Bonus zones** stay on the field and trigger when the ball passes through: *slow* halves its speed, *×2* doubles it, *×3* triples it, each for a few seconds. Where the author puts them is the whole design.

**Speed** follows the classic rule: every few paddle hits the ball gains a notch, and rapid rebounds build heat that adds more. Losing a life resets it.

**The publish rule:** you can only publish a level after clearing it yourself. That keeps every wall beatable, even when it feels unfair.

## Showcase site

This repo starts as a **marketing site** for the game, not the game itself. It should feel like the product: a light glass page with one dark, glowing board on it, then a clear path to play.

**Light Glass, Neon Bricks** is the design system — Apple frost and soft color blooms, Airbnb editorial space, Revolut confidence — with the neon reserved for the bricks and the board aura. The same tokens drive the game UI so we do not redesign later.

Cheap on purpose: CSS/SVG, one Canvas 2D element for the board, Geist, one accent, six neons, no paid assets. See `AGENTS.md` for the full policy.

## Game engine

The board on the home page is not a video. It is the real engine playing the real level in `game/breakout/`, with an autopilot on the paddle until you move over the board and take it:

- `game/breakout/engine` — deterministic, fixed-step (240 Hz) game with a seeded PRNG: `Game` owns lives, score, collisions, and the speed model (`bonus × ramp × heat`). `Autopilot` is a seeded paddle AI used for demos and for proving a level can be cleared.
- `game/breakout/engine/level.ts` — the level API the editor will call: `createLevel({...}).background("/photo.jpg").brickRows({...}).bonus("fast3", x, y).build()`. Validation runs on `build()`.
- `game/breakout/levels/first-light.ts` — the showcase level: a hollow wall with hard bricks and steel posts, three bonus zones, a bokeh photo behind.
- `game/breakout/render` — Canvas 2D: photo + frame painted once per resize, neon glass bricks as cached glow sprites, ball with trail and speed aura, glass paddle, bonus rings, particles.
- `game/breakout/preview` — browser mount: DPR cap, resize, off-screen and hidden-tab pause, reduced motion, and pointer/touch paddle control.
- `game/plinko` — the earlier vertical trap-board engine, kept intact and unmounted.
- `game/shared` — PRNG and color helpers shared by every engine.

Zero runtime dependencies beyond React.

## Getting started

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.
