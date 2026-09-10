<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project rules

- The final user-facing UI must always be in US English (`en-US`). Do not ship French or any other language in product copy, labels, buttons, empty states, or errors.

# Design policy (marketing site → game)

This repo ships a **marketing / showcase site first**. It points to the future game. The visual language must transfer to the game HUD, menus, and boards without a redesign.

## Direction: Heist Glass

Steal structure from Apple, Airbnb, and Revolut — not their brand colors.

- **Apple:** frosted glass, depth, restraint. Few surfaces, high craft.
- **Airbnb:** editorial type, generous space, one clear story per section.
- **Revolut:** dark luxury, confident CTAs, product UI that feels expensive.

Filter all of that through the game: a vertical dungeon vault, gold at stake, traps that look beautiful and unfair. This is **heist glass**, not a white travel site and not a neon fintech app.

## Cost and portability (non-negotiable)

Spend almost nothing. Everything must stay portable.

- **Tokens only.** Colors, type scale, radii, blur, shadows, and motion live in one shared token source (CSS variables / Tailwind theme). Marketing and the future game read the same tokens.
- **No paid assets.** No paid fonts, stock, icon kits, Lottie, or 3D packs. Use the bundled Geist stack (or system UI as fallback) and simple CSS/SVG shapes: peg, ball, chest, coin.
- **CSS glass, not libraries.** Glass = `backdrop-filter`, translucent fills, 1px gold-tinted hairline. No WebGL, Three.js, or heavy animation runtimes on the showcase.
- **Dark-first.** Near-black vault background, one gold accent, one danger red for traps. No rainbow palettes.
- **One primary CTA** per view (waitlist / play / enter). Do not decorate for decoration.

## Visual rules

- Background: near-black slate with a *faint* warm gold glow (the vault). Never flat pure black walls of noise.
- Surfaces: translucent panels, 16–24px blur, 12–20px radius, hairline border. Glass is for cards, nav, and HUD — not every box.
- Type: large calm headlines, tight readable body. US English. No playful display fonts.
- Motion: 200–400ms, ease-out / short spring. Premium, not bouncy.
- Motifs that must travel to the game: vertical board silhouette, falling ball/coin, peg dots, chest. Reuse these as UI, not as mascots.
- Imagery: prefer live CSS/SVG board fragments over screenshots or illustration farms.

## Do not

- White Airbnb hospitality, pastel SaaS, cyberpunk neon, pixel-art dungeon, or comic heist.
- Glass on glass on glass (unreadable, expensive to maintain).
- New colors, fonts, or effects that are not in the token file.
- Building game systems on the showcase. The site sells the fantasy and links to the game.
