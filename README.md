# King of Thieves (Plinko)

A Next.js take on *King of Thieves* as a vertical Plinko / Fakir board: you build a trap-filled course, then other players risk gold to send a ball through it.

## The core idea

Each player owns a **vertical board**. You place nails, trampolines, fans, and fake teleport portals so other players' balls miss the chest at the bottom.

**The golden rule:** you can only publish a level after beating it yourself. That keeps every board mathematically possible, even when it feels unfair.

**The economy:** attackers pay an entry fee in gold coins. If they fall into the void or get destroyed by a trap, the level creator keeps the stake. If they reach the chest, they loot your reserve.

## Showcase site

This repo starts as a **marketing site** for the game, not the game itself. It should feel like the product: a dark vault you can almost touch, then a clear path to play (or join the waitlist) when the game exists.

**Heist Glass** is the design system — Apple frost + Airbnb editorial space + Revolut dark luxury, filtered through gold, traps, and a vertical Plinko board. Same tokens will drive the future game UI so we do not redesign later.

Cheap on purpose: CSS/SVG only, Geist, one gold accent, no paid assets. See `AGENTS.md` for the full policy.

## Getting started

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.
