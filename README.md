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

## Story — Kal's way home

The Story mode is a campaign of hand-placed walls with one thread running through it: **Kal, a small galactic gecko, wakes up on a world that is not his own and goes looking for where he came from.**

### The lore

Kal's people are wall-walkers. On **Vitra**, their home planet, the sky is a dome of tinted glass warmed by twin suns, and geckos live on it the way ours live on windows — clinging, climbing, chasing the light that comes through. Every Breeq wall is glass for that reason: breaking through it is what a Vitran gecko does.

Kal never saw Vitra. His egg left it inside a **pod** built to carry a single egg across the dark — why, and from what, the pod does not say. It fell on a cold, nameless **Grey Moon** under a ringed blue giant. Kal hatched there alone, with three things he could not explain: a warmth he remembered from inside the egg, a rhythm like a heartbeat he had never heard outside it, and a pull toward any light behind any window.

The pod holds the rest: a **star chart** etched on its inner shell with one star circled, and a beacon that still pulses in the rhythm Kal remembers. Out there, Vitra is guarded by the **Lanterns** — ships of light his own kind built to keep strangers out — and by a sky that does not let anyone through easily, not even its children. Kal is not a stranger. He has to prove it the only way a gecko can: wall by wall.

### The episodes

Each episode is ten walls (Gecko Legacy, the hand-made opener, is shorter). One new idea per chapter, the ball five units faster each time, and XP that climbs with the stakes.

**Episode 1 — Gecko Legacy** *(hand-made in the admin editor)* — A light behind the window, chasing the light, a lizard is born, a first party of bugs. Glass, then hard bricks, then steel. The basics.

**Episode 2 — Cold Orbit** — Kal leaves the Grey Moon and learns to read the sky.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | The Grey Moon | a crescent and one star | glass, a slow zone | Kal has never seen a sunrise. This morning, the Grey Moon gives him one. |
| 2 | Shell fragments | three pieces of eggshell | hard cores | Pieces of the shell he hatched from lie in the dust. They are not from here. |
| 3 | The pod | a capsule with windows | steel hull, a grow zone | Half-buried in the regolith: a capsule the size of a house, built to carry one egg. |
| 4 | Star chart | a constellation | the first ×2 zone | Etched inside the pod, a map of stars. One of them is circled. |
| 5 | First lift-off | a rocket | ×2 under the flames | The pod still has a spark left. Kal points it at the circled star. |
| 6 | Asteroid belt | tumbling rocks | bumpers | Rocks the size of hills tumble past the window. Kal learns to bounce. |
| 7 | The dead satellite | panels, body, dish | a magnet | A silent relay hangs in the dark. Its dish still points somewhere. |
| 8 | Wormhole | a ring with an eye | a portal pair, sticky | The relay's last message is a door. Kal goes through it. |
| 9 | The Drift | a ship torn in two | mirror, a rail | On the far side, a ship torn in two. Its hull carries the same marks as his shell. |
| 10 | Signal from home | a radio dish | magnets, bumpers, a portal over the dish | The wreck's beacon still pulses, in a rhythm Kal has known since before he hatched. |

**Episode 3 — Glass Sky** — The way home.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Leaving orbit | a ringed planet | explosives, anti-gravity | A ringed giant blocks the road. Kal slings around it. |
| 2 | Comet tail | a comet | ghosts | A comet is going the same way. Kal rides its tail. |
| 3 | Ring storm | rings and debris | rotors, gravity | Ice and rock spin in the rings of a gas giant. Nothing here stays still. |
| 4 | The Maw | an accretion disk | a black hole in a steel throat, five lives | Something dark waits between the systems. It has swallowed ships before. |
| 5 | Sentinels | a fleet of ships | regen, a sweeping guard, ice, shrink | Ships of light bar the way. Kal's kind built them to keep strangers out. |
| 6 | Locked gate | two towers and a gate | keys and locks, a fan | The Lanterns' gate opens only for keys. Kal has to find them. |
| 7 | Solar wind | a sun and its corona | two fans, ×3, split, shrink | Twin suns. Kal remembers them from inside the egg. |
| 8 | Vitra's moons | three moons | fake portal, descend, order (pink first) | Three moons circle a planet with a glass sky. Home. |
| 9 | The storm | a tempest | ice, invert, fog, a trampoline, a timer | Vitra's sky does not let anyone through easily. Not even its children. |
| 10 | Glass Sky | six bands of sky under twin suns | everything, five minutes, a narrower paddle | One last wall. On the other side, everyone Kal has never met. |

### Authoring the campaign

Episodes 2 and 3 live in code, in `game/breakout/levels/story/`. Each wall is an ASCII map plus a legend (`wall(map, legend, top)` in `shape.ts`; the brick width follows the column count, so 8 to 11 columns all span the field). `pnpm story:seed` validates every wall, proves it with the flawless autopilot, rates its difficulty, uploads the episode photo to Cloudinary when configured, and upserts episodes and chapters by slug. Seeded episodes are owned by the code; `--dry-run` only proves and rates, `--retire <slug>` backs up and removes a hand-made episode.

### Difficulty rating

`rateDifficulty(level)` (`game/breakout/engine/difficulty.ts`) measures a wall instead of guessing: the flawless autopilot proves it, then fallible pilots (skill 0.97 — a good player who still fumbles — and 0.94, an average one) play a fixed set of seeded games. Their clear rate and mean clear time become a 0–100 score and a tier: Gentle, Easy, Fair, Hard, Brutal — or Unproven when the flawless pilot cannot clear it. Deterministic everywhere. The admin editor shows it live (`components/difficulty-meter.tsx`), computed in a Web Worker half a second after the last edit. Cold Orbit runs from about 7 to 40, Glass Sky from 20 to 45; the pilots do not see fog, do not misread mirrors or decoy portals, and undo inverted controls, so the late walls play harder for people than the number says.

## Showcase site

This repo starts as a **marketing site** for the game, not the game itself. It should feel like the product: a light glass page with one dark, glowing board on it, then a clear path to play.

**Light Glass, Neon Bricks** is the design system — Apple frost and soft color blooms, Airbnb editorial space, Revolut confidence — with the neon reserved for the bricks and the board aura. The same tokens drive the game UI so we do not redesign later.

Cheap on purpose: CSS/SVG, one Canvas 2D element for the board, Geist, one accent, six neons, no paid assets. See `AGENTS.md` for the full policy.

## Game engine

The board on the home page is not a video. It is the real engine playing real levels in `game/breakout/`, rotating through the showcase set, with an autopilot on the paddle until you move over the board and take it (`?level=n` opens a given level):

- `game/breakout/engine` — deterministic, fixed-step (240 Hz) game with a seeded PRNG: `Game` owns lives, score, multi-ball, every piece's behavior, the rules, and the speed model (`bonus × ramp × heat`). `Autopilot` is a seeded paddle AI used for demos; `proveClearable` runs it flawlessly as the publish gate.
- `game/breakout/engine/catalog.ts` — the piece catalog: names, blurbs, glyphs, costs. The editor and the site read it; the validator prices levels with it.
- `game/breakout/engine/level.ts` — the level API the editor will call: `createLevel({...}).background("/photo.jpg").brickRows({...}).zone("gravity", x, y).portal(x1, y1, x2, y2).bumper(x, y).rules({ timer: 240 }).build()`. Validation runs on `build()`.
- `game/breakout/levels/` — the showcase levels: *First Light* (the classic wall), *Undertow* (portals, magnets, ghosts, a fan, a descending wall), *Lockdown* (keys and locks, explosives, regen, rotors, a guard, a split zone, a black hole, a timer). `levels/story/` holds the Story episodes authored in code (see above).
- `game/breakout/engine/difficulty.ts` — `rateDifficulty`: proof plus fallible-pilot sampling, one 0–100 score and a tier. `preview/difficulty.ts` runs it in a Web Worker for the editor.
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

Engine checks live outside the repo; the pre-commit hook runs `pnpm build`. `pnpm story:seed --dry-run` proves and rates every Story wall without touching the database.
