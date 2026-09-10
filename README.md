# King of Thieves (Plinko)

A Next.js take on *King of Thieves* as a vertical Plinko / Fakir board: you build a trap-filled course, then other players risk gold to send a ball through it.

## The core idea

Each player owns a **vertical board**. You place nails, trampolines, fans, and fake teleport portals so other players' balls miss the chest at the bottom.

**The golden rule:** you can only publish a level after beating it yourself. That keeps every board mathematically possible, even when it feels unfair.

**The economy:** attackers pay an entry fee in gold coins. If they fall into the void or get destroyed by a trap, the level creator keeps the stake. If they reach the chest, they loot your reserve.

## Getting started

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.
