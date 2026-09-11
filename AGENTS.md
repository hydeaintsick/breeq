<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules

- **pnpm only.** Always use `pnpm` for installing, adding, removing, or updating dependencies (`pnpm install`, `pnpm add`, `pnpm remove`, `pnpm update`). Never use `npm`, `yarn`, `bun`, or any other package manager in this repo.
- The final user-facing UI must always be in US English (`en-US`). Do not ship French or any other language in product copy, labels, buttons, empty states, or errors.
- **Mobile compatibility is mandatory.** Every page, component, and the game surface must work on a 360px-wide phone in portrait, with touch as the only input. Verify at 360px and 390px widths before calling anything done. Concretely:
  - Layouts stack; nothing depends on hover. Tap targets are at least 44px.
  - The board preview and the future game canvas size themselves from their container, cap `devicePixelRatio` at 2, and pause when off-screen or in a hidden tab.
  - No horizontal overflow, no fixed pixel widths above 320px, safe-area insets respected on fixed chrome.
  - Motion respects `prefers-reduced-motion` (static end state, no loop).

# Design policy (marketing site → game)

This repo ships a **marketing / showcase site first**. It points to the future game. The visual language must transfer to the game HUD, menus, the level editor, and the board without a redesign.

## Direction: Light Glass, Neon Bricks

Steal structure from Apple, Airbnb, and Revolut — not their brand colors.

- **Apple (showcase pages):** light frosted glass, soft color blooms in the background, dark ink type, black pill CTA. Few surfaces, high craft.
- **Airbnb:** editorial type, generous space, one clear story per section.
- **Revolut:** confident CTAs, product UI that feels expensive.

Filter all of that through the game: a brick breaker built by players, neon glass bricks over a photo the author chose, bonus zones that bend the ball's speed. The board is the one dark object on a light page — like a device on an Apple product page. **Cheerful and sober**: the color lives in the bricks, the aura around the board, and one gradient word per headline. Everything else is white, glass, and ink.

## Cost and portability (non-negotiable)

Spend almost nothing. Everything must stay portable.

- **Tokens only.** Colors, type scale, radii, blur, shadows, and motion live in one shared token source (`app/globals.css` → CSS variables + Tailwind theme). Marketing and the game read the same tokens; the canvas renderer reads them via `getComputedStyle`.
- **No paid assets.** No paid fonts, stock, icon kits, Lottie, or 3D packs. Use the bundled Geist stack (or system UI as fallback) and simple CSS/SVG/canvas shapes: brick, ball, paddle, bonus ring. Level backgrounds are the player's own photo.
- **CSS glass, not libraries.** Glass = `backdrop-filter`, translucent white fills, 1px white hairline plus a faint dark hairline. No WebGL, Three.js, or heavy animation runtimes on the showcase. The game surface is a single Canvas 2D element driven by `game/`; everything else is CSS.
- **Light-first, dark board.** Off-white page with faint neon blooms, dark ink, one accent (`--accent`) for kickers and focus rings, six neons (`--neon-*`) reserved for bricks, bonus zones, and the board aura. One danger red for lives and the bottom line. No other colors.
- **One primary CTA** per view (play / build / publish). Do not decorate for decoration.

## Visual rules

- Background: `--bg` with three or four soft radial blooms in the neon colors at ≤ 20% alpha. Never a flat white page, never a dark page.
- Surfaces: translucent white panels, 16–24px blur, 16–24px radius, white hairline + shadow. Glass is for cards, nav, and sheets — not every box.
- Board: near-black frame, photo dimmed 45–60%, neon bricks with glow, white glass paddle. HUD text is white on the board; site text is ink on glass.
- Type: large calm headlines, tight readable body. US English. One gradient word (`.text-neon`) per headline at most. No playful display fonts.
- Motion: 200–400ms, ease-out / short spring. Premium, not bouncy. The board aura may drift slowly; nothing else on the page loops.
- Motifs that must travel to the game: brick grid, glowing ball with trail, glass paddle, bonus rings with `½` / `×2` / `×3`. Reuse these as UI, not as mascots.
- Imagery: prefer the live board over screenshots or illustration farms.

## Do not

- White Airbnb hospitality without the board, pastel SaaS, cyberpunk neon everywhere, pixel-art, or comic style.
- Glass on glass on glass (unreadable, expensive to maintain).
- New colors, fonts, or effects that are not in the token file.
- Neon on text or buttons outside `.text-neon` and the board HUD.
- Game logic in `app/` or `components/`. The site only mounts `game/breakout/preview`; it never simulates, scores, or draws pieces itself.

# Game engines (`game/`)

The engine is the product. The showcase is its first consumer; the playable game and the level editor will be the next. Keep it portable.

- `game/shared` — the seeded PRNG (`createRng`) and color helpers every engine uses. **No `Math.random` anywhere in `game/`.**
- `game/breakout` — the live engine (brick breaker, "by players, for players").
  - `engine/types.ts` — `Level` (bricks, bonus zones, background photo, lives, paddle, ball), `GameState`, `GameEvent`, `GameInput`. Pure data.
  - `engine/level.ts` — the only way to author a level: `createLevel({...}).background(src).brickRows({...}).bonus("slow" | "fast2" | "fast3", x, y).build()`. `build()` validates (bounds, overlaps, paddle zone, at least one breakable brick); structural errors throw. Levels live in `game/breakout/levels/`.
  - `engine/game.ts` — `Game`: fixed step (240 Hz), seeded, no DOM. Owns lives, score, the speed model (`bonus × ramp × heat`, see `RULES`), collisions, and events. Same level + seed + inputs = same game everywhere.
  - `engine/autopilot.ts` — a seeded paddle AI used for demos and for proving a level is clearable.
 - `engine/difficulty.ts` — `rateDifficulty(level)`: the flawless proof plus fallible pilots (skills 0.97 / 0.94) over fixed seeds → a 0–100 score and a tier (Gentle … Brutal, Unproven). Deterministic, no DOM. `preview/difficulty.ts` runs it in a Web Worker; the editor shows it live via `components/difficulty-meter.tsx`.
 - `levels/story/` — the Story episodes after Gecko Legacy, authored as ASCII walls (`wall(map, legend, top)`). `pnpm story:seed` proves, rates and upserts them by slug; seeded episodes are owned by the code. The lore (Kal, Vitra, the Lanterns) is in `README.md` — new chapters must fit it.
  - `render/` — Canvas 2D. `palette.ts` reads `--neon-*`, `--ink`, `--danger` tokens. `renderer.ts` paints the photo + frame once per resize and draws bricks (cached glow sprites), zones, paddle, ball, particles every frame. `scene.ts` holds visual-only state.
  - `audio/` — the sound design, Web Audio only, no sample files. `bus.ts` owns the one AudioContext (created inside a gesture), a procedurally generated hall reverb, the compressor and the master gain the sound preference drives (`setSoundEnabled`). `synth.ts` has the voice primitives (`tone`, `bell`, `noise`) with seeded detune. `sfx.ts` maps `GameEvent`s to voices in the level's key (root from the level id, six-note scale, brick color → degree, row → octave) plus a quiet pad that follows heat and speed. No square waves, nothing above 14 kHz, repeats softened. `payout.ts` is the clear screen's voice (`createPayoutSfx()`): the "+N XP" stamp, a rate-limited tick per counter step that climbs the scale as the level bar fills, a rising arpeggio on level-up, and a root-and-fifth settle when the numbers lock — in D, driven from `components/story-clear.tsx`, silent when sound is off or the animation is skipped by reduced motion. `theme.ts` is the story theme: a seeded 32-second loop in D (sub bass, dark pad, air, the tune on glass bells) held by `acquireStoryTheme()` while a story surface is mounted (`components/use-story-theme.ts`), ducked during runs and hidden tabs, gone when sound is off.
 - `haptics/` — `navigator.vibrate` patterns per event (contact 8–15 ms, short patterns for moments, nothing for walls), rate-limited, behind `setHapticsEnabled`. Hidden in the UI where unsupported (iOS, desktop).
 - `preview/mount.ts` — browser plumbing: DPR cap, ResizeObserver (a box still animating is left CSS-stretched until it settles; the photo is only re-rasterized then), IntersectionObserver, `visibilitychange`, `prefers-reduced-motion`, and pointer/touch control of the paddle (`controls: "auto" | "pointer" | "hybrid"`). `fit` makes a full-screen board: the canvas fills its parent and paints the photo edge to edge while the world is contain-fitted inside the `fit` element (the story run uses it). The site uses `hybrid`: autopilot until the visitor moves over the board. `sound` and `haptics` options turn the feedback layers on for real games only; previews stay silent. Preferences are cookies (`breeq-sound`, `breeq-haptics`) read in `app/layout.tsx` and exposed by `SoundProvider` / `HapticsProvider`; the toggles live in the game header and the pause menu.
- `game/plinko` — the earlier vertical trap-board engine (`engine`, `builder`, `assets`, `render`, `preview`, `maps`). Kept intact and unmounted; same rules apply if it is revived.
- New brick or bonus kinds touch, in order: `engine/types.ts`, `engine/level.ts` (validation), `engine/game.ts`, `render/renderer.ts`, and a token in `app/globals.css` if they need a color.
