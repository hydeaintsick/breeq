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
 - `levels/story/` — the Story episodes after Gecko Legacy, authored as ASCII walls (`wall(map, legend, top)`). `pnpm story:seed` proves, rates and upserts them by slug; seeded episodes are owned by the code. The lore (Kal, Vitra, the Lanterns, the Hush, the peoples on the migration's route) is in `README.md` — new chapters must fit it. Black holes only stay fair in the Maw's geometry (the hole inside the wall, in a steel throat above an open chamber, five lives); a throat that opens straight onto the field swallows every ball.
  - `render/` — Canvas 2D. `palette.ts` reads `--neon-*`, `--ink`, `--danger` tokens. `renderer.ts` paints the photo + frame once per resize and draws bricks (cached glow sprites), zones, paddle, ball, particles every frame. `scene.ts` holds visual-only state.
  - `audio/` — the sound design, Web Audio only, no sample files. `bus.ts` owns the one AudioContext (created inside a gesture), a procedurally generated hall reverb, the compressor and the master gain the sound preference drives (`setSoundEnabled`). `synth.ts` has the voice primitives (`tone`, `bell`, `noise`) with seeded detune. `sfx.ts` maps `GameEvent`s to voices in the level's key (root from the level id, six-note scale, brick color → degree, row → octave) plus a quiet pad that follows heat and speed. No square waves, nothing above 14 kHz, repeats softened. `payout.ts` is the clear screen's voice (`createPayoutSfx()`): the "+N XP" stamp, a rate-limited tick per counter step that climbs the scale as the level bar fills, a rising arpeggio on level-up, and a root-and-fifth settle when the numbers lock — in D, driven from `components/story-clear.tsx`, silent when sound is off or the animation is skipped by reduced motion. `theme.ts` is the theme player: a look-ahead scheduler that loops a `ThemeScore` from `themes/` (seeded, chords the other layers read through `storyThemeChord()`), one player per score held by `acquireTheme(score)` while a surface is mounted (`components/use-story-theme.ts`: `useTheme(score, quiet)` returns the intensity setter; `useStoryTheme(quiet)` is the story wrapper over `acquireStoryTheme()`), ducked during story runs and hidden tabs, gone when sound is off. Themes stack: the score acquired last is heard, the others hold their harmony in silence and come back when it leaves — the store hands over to a run and gets the floor back on the end screen with no prop drilling. Scores that react to play implement `ThemeGraph.intensity(level, t)`. Four scores: `themes/lanterns.ts` (story theme one — the tune on glass bells over a sliding pad, 32 s), `themes/horizon.ts` (the story default — calm synthwave at 84 BPM: soft kick with a sidechain pump on pad and bass, an even eighth-note arpeggio, a gliding saw lead on the second half; nothing off the beat), `themes/arcade.ts` (the Earn store — a driving anthem at 118 BPM in D: four-on-the-floor kick, clap, off-beat hats, syncopated sixteenth saw bass, sixteenth pluck arpeggio, pumped pad and sub, a rising three-bell stinger opening each half, a lead hook on the second half, risers before returns) and `themes/pursuit.ts` (paid runs — `pursuit(root)` in the level's key from `levelKey(level)`, in its relative minor so brick notes land in the chord: 132 BPM, sixteenth staccato bass ostinato, kick on every beat, tight snare, a clock of hat ticks, a breathing dark drone, semitone-cluster stabs, a repeated-note riff on the second pass; `intensity` from lives lost and heat opens the drone and riff, brings the stabs and ticks forward and adds a heartbeat above 0.4). `themes/index.ts` picks the story default; `localStorage["breeq-theme"]` overrides it for auditioning (story surfaces only).
 - `haptics/` — `navigator.vibrate` patterns per event (contact 8–15 ms, short patterns for moments, nothing for walls), rate-limited, behind `setHapticsEnabled`. Hidden in the UI where unsupported (iOS, desktop).
 - `preview/mount.ts` — browser plumbing: DPR cap, ResizeObserver (a box still animating is left CSS-stretched until it settles; the photo is only re-rasterized then), IntersectionObserver, `visibilitychange`, `prefers-reduced-motion`, and pointer/touch control of the paddle (`controls: "auto" | "pointer" | "hybrid"`). `fit` makes a full-screen board: the canvas fills its parent and paints the photo edge to edge while the world is contain-fitted inside the `fit` element (the story run uses it). The site uses `hybrid`: autopilot until the visitor moves over the board. `sound` and `haptics` options turn the feedback layers on for real games only; previews stay silent. Preferences are cookies (`breeq-sound`, `breeq-haptics`) read in `app/layout.tsx` and exposed by `SoundProvider` / `HapticsProvider`; the toggles live in the game header and the pause menu.
- `game/plinko` — the earlier vertical trap-board engine (`engine`, `builder`, `assets`, `render`, `preview`, `maps`). Kept intact and unmounted; same rules apply if it is revived.
- New brick or bonus kinds touch, in order: `engine/types.ts`, `engine/level.ts` (validation), `engine/game.ts`, `render/renderer.ts`, and a token in `app/globals.css` if they need a color.

# Earn (player walls for gems, pots in ETH)

Players publish walls, pay a ticket in gems to try one, and a clear pays a pot in ETH to their balance — once per wall, never on their own map. Unlocks at player level 5 (`EARN_UNLOCK_LEVEL`, admins bypass) and behind the `earnEnabled` site setting.

- **Money.** Gems are an `Int`; ETH is stored as `BigInt` gwei (`ethGwei`) and only formatted at the edge (`lib/economy.ts`: `ethToGwei`, `formatEth`, `payoutFor`). The admin sets the gem price in USD and a reference ETH price (`EconomySettings`, `lib/earn.ts#getEconomy`); a clear pays `winMultiplier` (1.5) × the ticket's USD value, converted to ETH at the reference price when the ticket is bought and locked into the `EarnRun`, so a later price change never moves an open pot. Withdrawals are requests (`Withdrawal`) paid by hand from the admin space. Every movement writes a `LedgerEntry`.
- **Balance writes are atomic and guarded.** Debits are `updateMany` with `{ gte }` in the `where`; credits are `increment`. Mongo's `$inc` silently skips a missing or `null` field and `{ gte }` never matches one, so any write to `gems` / `ethGwei` is preceded by `ensureBalanceFields(userId)` (`lib/balances.ts`) — accounts created before the fields existed have none. Never read-then-write a balance.
- **Stripe is the only payment rail** (`lib/stripe.ts`, `lib/purchases.ts`): a Checkout Session per gem pack, fulfilled idempotently by the webhook (`app/api/stripe/webhook`) or by the shop sheet claiming the session on return — first one to flip `PENDING → PAID` credits. Checkout sends the player back to the game page the shop was opened from (`createGemCheckout(gems, returnTo)`, paths under `/game` only) with `?session_id=`; `GemShopProvider` watches the URL, opens the sheet, claims, and strips the query. Either way the return shows the pack landing once: `components/pack-landed.tsx` is the purchase's clear screen (bag drop, "+N" stamp, the bag total counting up on the payout voice, settle, then the CTAs; a tap skips, reduced motion starts at the end). `EARN_SANDBOX=true` credits without a card in dev only. Keys live in `.env` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`); `stripe listen --forward-to localhost:3333/api/stripe/webhook` for local hooks.
- **Publishing** (`app/actions/earn.ts#publishEarnMap`) re-validates the level server-side, runs `rateDifficulty` (the robot proof), refuses an unproven wall, uploads the sky to Cloudinary (`breeq/earn-backgrounds`) or keeps a gradient id from `lib/gradients.ts` (twenty presets rendered as SVG data URLs so the engine treats them as photos), debits `publishCostGems`, then stores the level.
- **Runs** (`startEarnRun` / `finishEarnRun` / `forfeitEarnRun`): buying a ticket forfeits any run still open, debits, creates the run with its seed and locked payout; finishing settles once (`updateMany` gate on `OPEN`), pays on a win, marks a loss; a run older than 45 min cannot win. The outcome is client-reported for now — server-side replay of the seeded game is the next hardening step.
- **Balances in the header.** `app/game/layout.tsx` seeds `BalancesProvider` (`components/balances-provider.tsx`); the Earn surfaces mirror their local balances into it with `usePublishBalances`, and a server render resets it to the truth. The game header holds two pills, one unfolded at a time: the level (`RankMeter`) and the bag (`components/wallet-chip.tsx`: gems, ETH, a "+" — the whole pill opens the shop; numbers roll to new values). The bag is unfolded by default in `/game/earn/*`, the level elsewhere; tapping the folded one swaps them, a route change resets. Below 420px the sound chip moves into the header menu to make room. The day/night toggle is out of every header for good; it lives in the account settings (`PlaySettings`).
- **The shop is a sheet, not a page.** `components/gem-shop.tsx`: `GemShopProvider` (mounted in `app/game/layout.tsx` with the economy and the Stripe flags) renders the sheet over two thirds of the screen above whatever page the player is on; `useGemShop().open()` and `TopUpButton` call it from the bag pill, the ticket sheet, the lose screen, the wizard and the wallet. Closing puts the player back where they were. `/game/earn/topup` only redirects to the store, keeping `session_id` for Checkout sessions created before the change. The header menu's first entry is "Play" (`/game/menu`).
- **Doors and the manual.** The Earn card on the game menu is `components/earn-card.tsx`, fed by `lib/earn.ts#getEarnTeaser` (walls on sale, the biggest pot and its ticket, ETH paid out): a "Top pot" glass pill over the live board, a ticket → pot line under the title, "Play for ETH". The store's title carries no paragraph — `components/earn-manual.tsx` is the "How it works" button and its action sheet (five steps with the live economy's numbers), reusing the shop sheet's classes with `data-auto` for content height.
- **Share the win (referrals).** The story clear screen (`components/story-clear.tsx`, `shareCode` prop, never on a paid skip) ends with `components/share-row.tsx`: X, Facebook, WhatsApp, Telegram and a copy button, each an anchor to the network's universal share link (`lib/share.ts#shareHref`) so the installed app opens on iOS and Android. Every link is `/r/<code>?via=<button>`; `app/r/[code]/route.ts` drops the `breeq-ref` cookie (httpOnly, 30 days, `Lax` so it survives the Google round trip) and lands on `/login?invite=<code>` — sign-up tab open, the inviter named, and dynamic Open Graph copy for Facebook. `lib/referrals.ts`: `getReferralCode(userId)` mints the eight-character code on first use (`User.referralCode`, checked for clashes in code, no Mongo unique index — every player without a code would share one null key); `applyReferral(newUserId)` runs after the row exists on all three doors (`registerAccount`, Auth.js `events.createUser`, the wallet `authorize`), creates the `Referral` (unique `referredId` is the gate), pays `REFERRAL_GEMS` (10) with a `REFERRAL` ledger line up to `REFERRAL_MAX_PAID` (10) paid sign-ups per referrer, then records later ones at 0. Facebook ignores any text: the message lives in the login page's metadata.
- **Surfaces.** `components/earn-store.tsx` (sticky strip with the wallet door and "Create my map", featured and most-played shelves, infinite grid, sort tabs, the Arcade theme), `earn-map-card.tsx` (the live board is the card, lazily mounted near the viewport, 3/4 crop like the story shelf), `earn-run.tsx` (ticket sheet → full-screen board with the Pursuit theme → paid clear or lose screen with re-buy), `earn-wizard.tsx` (name & sky → `WallEditor` → prove & price), `earn-wallet.tsx` (balances, withdrawal request, ledger). Admin: `app/admin/(space)/*` with `AdminNav` — dashboard stats, economy form, map curation (featured, hidden), players (grant gems), withdrawals (paid / rejected with refund), settings.
