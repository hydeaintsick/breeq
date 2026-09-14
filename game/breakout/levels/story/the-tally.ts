/**
 * Episode 16 — The Tally.
 *
 * Vireo, a season after the glasshouse came down. The roof is broken and the
 * jungle has grown through it; the creatures Kal let out of the cages — the
 * Tally, from a dozen skies — live free in it now, and Marrow keeps a ledger
 * of them the way he once kept the Curator's. He knows the Gleaner's mark; he
 * grew it into Kal. It can be grown into other things too, he says: into
 * light, if someone knows how to grow light. The Corallines do. The Tally
 * come with them — a lantern-fish that hums in the dark, a glass-eater with
 * rotor teeth, fireflies in Kal's rhythm — a menagerie fleet with nothing in
 * common but a cage they were let out of.
 *
 * Mechanics: bumpers under a broken steel roof, a ledger of keys and locks
 * behind a mirror, regen creatures, a magnet fish in fog, rotor teeth with
 * ×3, explosive fireflies with a split, ghosts in the rubble with gravity, a
 * black hole in a vat's throat (five lives), an order rule with fans for
 * Marrow's gift, and a menagerie on the clock with a guard and shrink.
 *
 * Shapes: a broken roof, a ledger, free creatures, a fish, a glass-eater,
 * fireflies, a fallen tower, a vat, a shell with a mark, a menagerie fleet.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/the-tally.jpg";

// 151 — Broken roof -----------------------------------------------------------------
// Steel ribs with the panes gone between them, glass fallen below. Two
// bumpers in the rubble.
const BROKEN_ROOF = createLevel({ id: "the-tally-01", name: "Broken roof", author: AUTHOR, ballSpeed: 436 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "#c#c.#.c#c#",
        "cccc...cccc",
        ".c.......c.",
        "...........",
        "..c.....c..",
        ".cCc...cCc.",
      ],
      { "#": steel("cyan"), c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .bumper(90, 330)
  .bumper(270, 330)
  .bonus("slow", 180, 440)
  .bonus("fast2", 60, 460)
  .build();

// 152 — Marrow's ledger -------------------------------------------------------------
// A grid of entries, two lines of it locked. The key sits at the bottom of
// the page; a mirror under it.
const MARROWS_LEDGER = createLevel({ id: "the-tally-02", name: "Marrow's ledger", author: AUTHOR, ballSpeed: 437 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "ccccc.ccccc",
        "KKKKK.ccccc",
        "ccccc.ccccc",
        "ccccc.KKKKK",
        "ccccc.ccccc",
        "....k......",
      ],
      { c: glass("cyan"), K: piece("lock", "amber"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .zone("mirror", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 153 — The Tally free --------------------------------------------------------------
// Five creatures in five colors, each with a regen tail: things that come
// back. Grow under them.
const THE_TALLY_FREE = createLevel({ id: "the-tally-03", name: "The Tally free", author: AUTHOR, ballSpeed: 438 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "bBb.pPp.lLl",
        ".rb..rp..rl",
        "...........",
        "..vVv.cCc..",
        "...rv..rc..",
      ],
      {
        b: glass("blue"),
        B: hard("blue"),
        p: glass("pink"),
        P: hard("pink"),
        l: glass("lime"),
        L: hard("lime"),
        v: glass("violet"),
        V: hard("violet"),
        c: glass("cyan"),
        C: hard("cyan"),
        r: piece("regen", "lime"),
      },
      TOP,
    ),
  )
  .zone("grow", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 154 — The lantern-fish ------------------------------------------------------------
// A fish of cyan glass with a magnet for an eye and a hard tail. Fog where it
// swims.
const THE_LANTERN_FISH = createLevel({ id: "the-tally-04", name: "The lantern-fish", author: AUTHOR, ballSpeed: 439 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "...cccc....",
        "..ccmccc...",
        ".ccccccccc.",
        "c.cccccccCc",
        "..cccccc..C",
        "...cccc....",
      ],
      { c: glass("cyan"), C: hard("cyan"), m: piece("magnet", "amber") },
      TOP,
    ),
  )
  .zone("fog", 180, 350, 22)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 155 — The glass-eater -------------------------------------------------------------
// A creature that eats glass: a hard amber jaw with rotor teeth. ×3 in its
// mouth.
const THE_GLASS_EATER = createLevel({ id: "the-tally-05", name: "The glass-eater", author: AUTHOR, ballSpeed: 440 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "...aaaaa...",
        ".aaAAAAAaa.",
        "aA.x.x.x.Aa",
        "aA.......Aa",
        ".aaaaaaaaa.",
        "..x.....x..",
      ],
      { a: glass("amber"), A: hard("amber"), x: piece("rotor", "violet") },
      TOP,
    ),
  )
  .bonus("fast3", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 156 — Fireflies again -------------------------------------------------------------
// Sparks in the dark, explosive, in Kal's rhythm. A split under them.
const FIREFLIES_AGAIN = createLevel({ id: "the-tally-06", name: "Fireflies again", author: AUTHOR, ballSpeed: 441 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "..e...l....",
        "l...e...e..",
        "..l...l..e.",
        "e...e...l..",
        "..l...e....",
        "....l...e.l",
      ],
      { e: piece("explosive", "amber"), l: glass("lime") },
      TOP,
    ),
  )
  .zone("split", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 157 — The Curator's grave ---------------------------------------------------------
// The tower where it fell: a slope of hard amber rubble and ghosts of glass
// still in the air. Gravity under the slope.
const THE_CURATORS_GRAVE = createLevel({ id: "the-tally-07", name: "The Curator's grave", author: AUTHOR, ballSpeed: 442 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "....A......",
        "...AaA.....",
        "..Aa.aA....",
        ".Aa...oA...",
        "Aa..o..oaA.",
        "....o..o...",
        "..oo..oo..A",
      ],
      { A: hard("amber"), a: glass("amber"), o: piece("ghost", "amber") },
      TOP,
    ),
  )
  .zone("gravity", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 158 — Vat-dark --------------------------------------------------------------------
// One vat never opened. Whatever grew in it is not a gecko: a black hole in
// the throat of the vessel, above an open chamber. Five lives.
const VAT_DARK = createLevel({ id: "the-tally-08", name: "Vat-dark", author: AUTHOR, ballSpeed: 443, lives: 5 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "....ccc....",
        "..ccC#Ccc..",
        ".cC.#.#.Cc.",
        ".c..#.#..c.",
        ".c.......c.",
        ".ccccccccc.",
        "..ccccccc..",
      ],
      { "#": steel("cyan"), c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .zone("mirror", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 159 — Marrow's gift ---------------------------------------------------------------
// A shell of amber with the mark grown into it in cyan: the mark first, then
// the key, then the locks at the top. Two fans across the sky.
const MARROWS_GIFT = createLevel({ id: "the-tally-09", name: "Marrow's gift", author: AUTHOR, ballSpeed: 444 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "....KaK....",
        "..aaaaaaa..",
        ".aaaaaaaaa.",
        ".aaaaaaaaa.",
        "..aaaaaaa..",
        "...c.k.c...",
        "....ccc....",
      ],
      { K: piece("lock", "amber"), a: glass("amber"), c: glass("cyan"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .rules({ order: "cyan" })
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .bonus("slow", 180, 440)
  .build();

// 160 — Menagerie fleet -------------------------------------------------------------
// Ships of every color that have nothing in common but a cage, with regen
// engines. A guard under them, shrink, four minutes.
const MENAGERIE_FLEET = createLevel({ id: "the-tally-10", name: "Menagerie fleet", author: AUTHOR, ballSpeed: 445 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        ".bBb...lLl.",
        "..b.....l..",
        "pPp.cCc.aAa",
        ".p...c...a.",
        "...vVv.....",
        "....v......",
        "..rr...rr..",
      ],
      {
        b: glass("blue"),
        B: hard("blue"),
        l: glass("lime"),
        L: hard("lime"),
        p: glass("pink"),
        P: hard("pink"),
        c: glass("cyan"),
        C: hard("cyan"),
        a: glass("amber"),
        A: hard("amber"),
        v: glass("violet"),
        V: hard("violet"),
        r: piece("regen", "cyan"),
      },
      TOP,
    ),
  )
  .guard(180, 320, { w: 48, h: 8, range: 90, speed: 1.6 })
  .zone("shrink", 180, 400)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .rules({ timer: 240 })
  .build();

export const THE_TALLY: StoryEpisodeDef = {
  slug: "the-tally",
  title: "The Tally",
  order: 16,
  tagline: "A jungle through a broken roof, an old keeper's ledger, and a fleet with nothing in common but a cage.",
  background: BG,
  chapters: [
    {
      slug: "broken-roof",
      title: "Broken roof",
      intro: "Vireo's roof is open to the sky and the jungle has climbed through it. Nothing here was grown on purpose anymore.",
      xp: 11100,
      level: BROKEN_ROOF,
    },
    {
      slug: "marrows-ledger",
      title: "Marrow's ledger",
      intro: "Marrow is still here. He keeps a ledger of the Tally the way he kept the Curator's, except this one has no column for due.",
      xp: 11200,
      level: MARROWS_LEDGER,
    },
    {
      slug: "the-tally-free",
      title: "The Tally free",
      intro: "Creatures from a dozen skies, living in a jungle none of them came from. They remember who opened the cages.",
      xp: 11300,
      level: THE_TALLY_FREE,
    },
    {
      slug: "the-lantern-fish",
      title: "The lantern-fish",
      intro: "A fish that hums in the dark and swims in air. Its light pulls things toward it. It has decided Kal is one of them.",
      xp: 11400,
      level: THE_LANTERN_FISH,
    },
    {
      slug: "the-glass-eater",
      title: "The glass-eater",
      intro: "Something with rotor teeth that eats glass. Lys says it is exactly what a wall-walker's road needs. Kal is not sure it agrees.",
      xp: 11500,
      level: THE_GLASS_EATER,
    },
    {
      slug: "fireflies-again",
      title: "Fireflies again",
      intro: "At night the jungle still lights up in his rhythm. The fireflies were grown to. Kal is starting to understand what that means.",
      xp: 11600,
      level: FIREFLIES_AGAIN,
    },
    {
      slug: "the-curators-grave",
      title: "The Curator's grave",
      intro: "The amber tower lies where it fell. Nobody has moved a pane of it. Marrow says the ghosts in the rubble are only glass. He does not sound sure.",
      xp: 11700,
      level: THE_CURATORS_GRAVE,
    },
    {
      slug: "vat-dark",
      title: "Vat-dark",
      intro: "One vat never opened. What grew in it is not a gecko. It is the thing Marrow meant when he said the Curator was not the only one feeding here.",
      xp: 11800,
      level: VAT_DARK,
    },
    {
      slug: "marrows-gift",
      title: "Marrow's gift",
      intro: "The mark can be grown into more than a gecko, Marrow says. Into light, if someone knows how to grow light. The Corallines do.",
      xp: 11900,
      level: MARROWS_GIFT,
    },
    {
      slug: "menagerie-fleet",
      title: "Menagerie fleet",
      intro: "The Tally follow the seed-ship up through the broken roof: a fleet with nothing in common but a cage they were let out of.",
      xp: 12000,
      level: MENAGERIE_FLEET,
    },
  ],
};
