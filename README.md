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

**What he finds when he gets there.** Nobody. Under the glass sky the city is dark, minded only by the **Keepers**, small drones left behind. The Archive opens for a Vitran claw and tells the rest: the twin suns flickered, something fed on the light between them — his people named it **the Hush** — and Vitra emptied in the **Long Migration**. Twelve pods carried the last eggs after the fleet. Eleven arrived. The twelfth fell short, on a Grey Moon. The Archive also keeps the migration's **route**: five worlds where the fleet meant to stop. Kal wakes a dark Lantern and follows it.

**The route.** First a world of light, the **Lumen Reef** — a shallow ocean lit from below whose reef is a people, the **Corallines**, who glow to speak and trade in light. They remember two fleets passing, a dark one and a hurried one, and keep a **pearl** the geckos left in thanks; Kal earns it by standing on the reef wall when **the Gnaw**, the Hush's scouts, come at dusk. Then a dark world: a burned-out star and the **Ashen Court** of the **Cindermoths**, who hoard what light is left under their queen, **the Candle**. The geckos paid for passage in light; Kal has only his glow, so the price is a cage, wardens, and a duel — one wall between him and the Candle. It falls, her hoard spills back into the ash, and she keeps her word. Then the battlefield: a sky of wrecks where the **Ember Fleet** — amber ships, his own kind — has held the line against the Hush for years. An old gecko with a scarred tail, **Sable**, reads the marks on his shell and goes very still; she knew the ship that launched his pod. Kal takes his place on the wall, faces the eye of the Hush, and turns his Lantern into a light it cannot swallow. And last, **Aurel**: one young sun, an unclaimed world the fleet chose before he was born, where a new glass sky is built pane by pane with the Corallines' light-seeds under it, and one shadow of the Hush to see off. Kal was never from Vitra. He is from the pod, the Grey Moon, and the road. Home is where they are.

### The episodes

Each episode is ten walls (Gecko Legacy, the hand-made opener, is shorter). One new idea per chapter, the ball a little faster each time, and XP that climbs with the stakes. Episodes 4 to 8 are where the kit stops arriving and starts combining: every wall after Glass Sky mixes pieces the player already knows, and the black hole, the guards, ice and the timer come back in harder company. The difficulty rating (below) peaks at each episode's boss and finale — about 50 in Empty Nest and Lumen Reef, 40 in Ashen Court, and close to 60 for the last walls of The Hush and Second Sun.

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

**Episode 4 — Empty Nest** — Under the glass sky, nobody is home. Kal finds out why.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Under the glass | a skyline of dark towers | bumpers | The wall gives. Kal drops through the glass sky into a city with no lights on. |
| 2 | The dark streets | a street grid | hard blocks, ghosts, fog | Every window is dark. Kal has never been somewhere his own kind lived. |
| 3 | The Keepers | three drones | regen arms, magnet eyes, grow | Keepers, the drones left to mind an empty city. They have never seen a gecko. |
| 4 | The hatchery | a hall of eggs | ghosts (empty shells), one solid egg, sticky | Every shell empty but one. That one fits the fragments Kal carries. |
| 5 | The Archive | a tower of tablets | steel shelves, keys and locks | The Archive opens for a Vitran claw. Inside: the day the suns flickered. |
| 6 | The flicker | twin suns, one half dark | steel, invert, ×3, shrink | Something fed on the light between the suns. They named it the Hush. |
| 7 | The last pods | pods in their cradles | a portal into the empty cradle, mirror | One launch failed and fell short of the fleet. That one was Kal's. |
| 8 | Signal fire | a Lantern on its cradle | explosive core, rotors, two fans, ice | Kal climbs the dark Lantern's hull and wakes it wall by wall. |
| 9 | The route | a chart of five worlds | order (blue first), a decoy portal | Five worlds where the fleet meant to stop. The first is a world of light. |
| 10 | Lift from Vitra | a ship rising through the dome | a guard, shrink, ice, descend, four minutes | The Lantern rises through the sky it once guarded. The Keepers turn the lights back on. |

**Episode 5 — Lumen Reef** — A sea of living light, a people who sing in it, and Kal's first fight.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Shallows | three waves | hard crests, ice | A shallow ocean lit from below. Kal's Lantern skims the surface. |
| 2 | The Corallines | a coral fan | regen tips, grow | The reef is alive, and it is a people. The Corallines glow to speak. |
| 3 | Jellies | three bells with tentacles | ghosts, anti-gravity | Bells of glass drift up the current, carrying news of a gecko to the elders. |
| 4 | The shell market | spiral shells | keys and locks, sticky | The Corallines trade in light. Kal offers the only thing he has: a story. |
| 5 | Reef song | sound waves | two rails, shrink | A dark fleet passed here once, they sing — and after it, a fleet of geckos. |
| 6 | Lighthouse coral | a tower with a beacon | explosive beacon, two fans | The geckos left a light on the tallest coral, and their claw marks in the glass. |
| 7 | The Gnaw | a worm's mouth | rotor teeth, a black hole in a steel throat, five lives | Something has been chewing the light out of the reef. The Hush has scouts. |
| 8 | Tide of teeth | a wall of teeth | explosives, a guard, ×3, shrink | The Gnaw come at dusk. Kal and the Corallines stand on the reef wall. His first fight. |
| 9 | The deep | a narrowing descent | gravity, fog, a portal back up | Kal follows the Gnaw down, past where the reef's light reaches. |
| 10 | Pearl | a clam | steel jaws, a ring of locks, split, descend, timer | A map-stone the geckos left in thanks. It shows the next world. It is dark. |

**Episode 6 — Ashen Court** — A dead star, a court of moths, and a price for the way on.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Cinder | a burned-out star | hard core, fog | Ash the size of continents. Kal lands in the dark. |
| 2 | Moth wings | a moth | ghosts in the wings, mirror | The Cindermoths hoard what light is left, and they have seen his. |
| 3 | The Candle | a candle | explosive flame, magnet wick, steel holder | Their queen asks what he wants. The way to his people, he says. |
| 4 | The hive | a honeycomb | locks, three keys | The geckos paid for passage in light. Kal's glow is not for sale. |
| 5 | Cage | steel bars | steel, invert, ice | The Candle's answer is a cage. Kal has been inside a shell before. Shells break. |
| 6 | The wardens | two moth wardens | rotor wings, two guards, ×3 | Wardens with wings of ash beat him back. Kal learns to hit what will not stay still. |
| 7 | Ash storm | a swirl of ash | rotors, ghosts, two fans, fog | Kal cannot see the wall, so he listens for it. |
| 8 | The duel | the Candle's face | explosive eyes, a black-hole mouth, descend, five lives | One wall between them. If it falls, he goes on. |
| 9 | Embers | a hall of fires | regen embers, order (pink first), trampoline, mirror | Light pours back into the ash. The Court kneels — not to Kal, to the light. |
| 10 | The way out | a tunnel | steel walls, ghosts, a guard, a portal, ice, invert, four minutes | The route: a battlefield, then a dawn. Your people are still fighting, she says. |

**Episode 7 — The Hush** — The Ember Fleet, the dark that hunts light, and a gecko who has come a long way.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Battlefront | wrecks | steel debris, bumpers | Somewhere in the wrecks, a fleet of geckos has held the line for years. |
| 2 | Ember Fleet | ships in formation | regen engines, split | The Ember Fleet has not seen a Lantern in a lifetime. They almost fire. |
| 3 | Old Sable | a gecko in profile | locks (claw marks) and a key, magnet | She knew the ship that launched his pod. |
| 4 | Shield wall | a phalanx | steel posts, a wide guard | The Hush comes in waves. Kal takes his place on the wall. |
| 5 | The breach | a broken wall | ghosts in the gap, a black hole in the corner of the sky | The dark pours through the gap, and Kal is the smallest thing in it. |
| 6 | Torchbearers | torch ships | explosive chains, rotors, ×3, invert | The torchbearers light the dark so the rest can aim. Their fuel is running out. |
| 7 | The eye | an eye | a black-hole pupil in steel, ice, five lives | A thing with no light in it at all. The Hush looks at Kal. Kal looks back. |
| 8 | Counterstrike | a spearhead | rails, trampoline, invert, ×3, ice | Hit the Hush where it feeds. Kal knows walls. He goes first. |
| 9 | The Lantern's light | the Lantern as a bomb | steel hull, explosive core, a guard, shrink, descend, timer | Kal turns the Lantern into a light the Hush cannot swallow. |
| 10 | Dawn over the wrecks | a sunrise | key and locks, bumpers, ×3, shrink, narrow paddle, five minutes | The Ember Fleet counts what it has left, and what it has gained: one small gecko. |

**Episode 8 — Second Sun** — A young world, one sun, and a glass sky that has to be built.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Aurel | a young planet | bumpers, ice | One sun, young, unclaimed. The fleet chose it before Kal was born. |
| 2 | Landing | ships coming down | regen, gravity, ice, shrink | For the first time, Kal walks among more geckos than he can count. |
| 3 | The first pane | one pane in a steel frame | steel, sticky, grow | Kal, who broke through a glass sky, learns to set one. |
| 4 | Seedlings | light-seeds on stems | regen buds, anti-gravity, split | The Corallines' light-seeds take root under Aurel's sun. |
| 5 | The Hush's shadow | a hollow shadow | a black hole in steel, mirror, fog, five lives | One shadow followed the fleet here. It goes for the seedlings first. |
| 6 | The dome | a half-built arc | steel ribs, locks and keys, two fans, shrink | Every gecko who can climb is on the dome. Kal is fastest. |
| 7 | The last wave | a wave of dark | rotors, explosives, two guards, invert, ×3, shrink | The fleet's last wall is the half-finished sky. |
| 8 | Sable's tale | a scroll of pods | order (pink first), a portal and a decoy, mirror, descend | Twelve eggs. Eleven arrived. The twelfth was Kal. |
| 9 | Twin suns remembered | a dark sun and a bright one | a black hole where the old sun's heart was, bumpers, timer, five lives | Under Aurel's one sun, the geckos light a second: the dome, glowing from inside. |
| 10 | Home | a family on the glass | everything: key and locks, explosives, regen, bumpers, a guard, shrink, ice, ×3, three lives, the narrowest paddle, four minutes | Home is where they are. He is home. |

### Authoring the campaign

Episodes 2 to 8 live in code, in `game/breakout/levels/story/`. Each wall is an ASCII map plus a legend (`wall(map, legend, top)` in `shape.ts`; the brick width follows the column count, so 8 to 11 columns all span the field). `pnpm story:seed` validates every wall, proves it with the flawless autopilot, rates its difficulty, uploads the episode photo to Cloudinary when configured, and upserts episodes and chapters by slug. Seeded episodes are owned by the code; `--dry-run` only proves and rates, `--retire <slug>` backs up and removes a hand-made episode.

### Difficulty rating

`rateDifficulty(level)` (`game/breakout/engine/difficulty.ts`) measures a wall instead of guessing: the flawless autopilot proves it, then fallible pilots (skill 0.97 — a good player who still fumbles — and 0.94, an average one) play a fixed set of seeded games. Their clear rate and mean clear time become a 0–100 score and a tier: Gentle, Easy, Fair, Hard, Brutal — or Unproven when the flawless pilot cannot clear it. Deterministic everywhere. The admin editor shows it live (`components/difficulty-meter.tsx`), computed in a Web Worker half a second after the last edit. Cold Orbit runs from about 7 to 40, Glass Sky from 20 to 45, and the later episodes climb to the high fifties on their boss and finale walls; the pilots do not see fog, do not misread mirrors or decoy portals, and undo inverted controls, so the late walls play harder for people than the number says.

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
