/**
 * Episode 23 — Into the Hush.
 *
 * The one thing the dark cannot see walks into it. Lys goes in behind him,
 * drawing a road of light the Hush can see — she is the lure and the lantern,
 * and the swarm turns to follow her light instead of the dome. Inside, the
 * Hush is not a monster. It is a granary: every light it has ever swallowed,
 * held the way a Gleaner holds seed, Vitra's twin suns among them, waiting for
 * a garden to deliver to that never came to collect. At the heart, the Gnaw's
 * nest and the throat that eats. Kal does what the Sowers never did: he lets
 * it see him. Lys draws him in light, and a seed — the first thing the Gleaner
 * has ever been shown that it was grown to carry, not to eat — turns and walks
 * out. The Gleaner follows, and the light comes with it.
 *
 * Mechanics: a wall of dark in ghosts and hard violet with slow, Lys's beam
 * on rails and ice, veins of light with regen and magnets, a granary of steel
 * bins with keys and locks, Vitra's suns as explosives with ×3, the Gnaw's
 * nest of rotors in fog, the throat as a black hole in steel on ice (five
 * lives), Kal drawn in light under an order rule with invert and sticky,
 * the delivery with a portal, fans and a split, and a sunrise from inside on
 * descend with a guard, shrink and four minutes.
 *
 * Shapes: a wall of dark, a beam, veins, bins, two suns, a nest, a throat, a
 * gecko in light, a beam out, a sunrise.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/into-the-hush.jpg";

// 221 — The edge --------------------------------------------------------------------
// Where the dark begins: a hard violet rim, a band of ghosts, glass under it,
// and stragglers below. Slow at the threshold.
const THE_EDGE = createLevel({ id: "into-the-hush-01", name: "The edge", author: AUTHOR, ballSpeed: 464 })
  .background(BG, { dim: 0.6 })
  .brickRows(
    wall(
      [
        "VVVVVVVVVVV",
        "ooooooooooo",
        "vvvvvvvvvvv",
        "...........",
        "..o..o..o..",
      ],
      { V: hard("violet"), o: piece("ghost", "violet"), v: glass("violet") },
      TOP,
    ),
  )
  .bonus("slow", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 222 — Lys's road ------------------------------------------------------------------
// A beam of cyan drawn corner to corner through the dark. Two rails under it,
// ice where the light lands.
const LYSS_ROAD = createLevel({ id: "into-the-hush-02", name: "Lys's road", author: AUTHOR, ballSpeed: 465 })
  .background(BG, { dim: 0.6 })
  .brickRows(
    wall(
      [
        "..........c",
        ".........c.",
        "........c..",
        ".......C...",
        "......c....",
        ".....c.....",
        "....C......",
        "...c.......",
        "..c........",
      ],
      { c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .rail(40, 340, 80)
  .rail(240, 340, 80)
  .zone("ice", 180, 400)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .build();

// 223 — Swallowed light -------------------------------------------------------------
// Veins of amber running to a magnet at the center: light the Hush has taken,
// still moving. Regen beads at the ends.
const SWALLOWED_LIGHT = createLevel({ id: "into-the-hush-03", name: "Swallowed light", author: AUTHOR, ballSpeed: 466 })
  .background(BG, { dim: 0.6 })
  .brickRows(
    wall(
      [
        "a.r.....r.a",
        ".a.a...a.a.",
        "..a.a.a.a..",
        "...a.m.a...",
        "..a.a.a.a..",
        ".a.a...a.a.",
        "a.r.....r.a",
      ],
      { a: glass("amber"), r: piece("regen", "amber"), m: piece("magnet", "amber") },
      TOP,
    ),
  )
  .bonus("slow", 180, 350)
  .bonus("fast2", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 224 — The granary -----------------------------------------------------------------
// Five bins of steel, each holding light: hard amber at the top, glass under,
// a lock at the mouth. One key on the floor opens them all.
const THE_GRANARY = createLevel({ id: "into-the-hush-04", name: "The granary", author: AUTHOR, ballSpeed: 467 })
  .background(BG, { dim: 0.6 })
  .brickRows(
    wall(
      [
        "#.#.#.#.#.#",
        "#A#A#A#A#A#",
        "#a#a#a#a#a#",
        "#K#K#K#K#K#",
        "...........",
        ".....k.....",
      ],
      { "#": steel("amber"), A: hard("amber"), a: glass("amber"), K: piece("lock", "amber"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .zone("grow", 180, 460)
  .build();

// 225 — Vitra's suns ----------------------------------------------------------------
// The twin suns, whole, held in the dark: explosive cores in amber, a band of
// ghosts under them. ×3 between the suns.
const VITRAS_SUNS = createLevel({ id: "into-the-hush-05", name: "Vitra's suns", author: AUTHOR, ballSpeed: 468 })
  .background(BG, { dim: 0.6 })
  .brickRows(
    wall(
      [
        ".aaa...aaa.",
        "aeAea.aeAea",
        ".aaa...aaa.",
        "ooooooooooo",
        "..o..o..o..",
      ],
      { a: glass("amber"), e: piece("explosive", "amber"), A: hard("amber"), o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .bonus("fast3", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 226 — The Gnaw's nest -------------------------------------------------------------
// Where the scouts are grown: rows of teeth with rotors in them. Fog under
// the nest.
const THE_GNAWS_NEST = createLevel({ id: "into-the-hush-06", name: "The Gnaw's nest", author: AUTHOR, ballSpeed: 469 })
  .background(BG, { dim: 0.6 })
  .brickRows(
    wall(
      [
        "V.V.V.V.V.V",
        "VxV.VxV.VxV",
        ".V...V...V.",
        "...........",
        "..VxV.VxV..",
        "...V...V...",
      ],
      { V: hard("violet"), x: piece("rotor", "pink") },
      TOP,
    ),
  )
  .zone("fog", 180, 350, 22)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 227 — The heart's throat ----------------------------------------------------------
// The throat that eats, at the center of everything: the dark in a steel
// throat above an open chamber. Ice under it, five lives.
const THE_HEARTS_THROAT = createLevel({ id: "into-the-hush-07", name: "The heart's throat", author: AUTHOR, ballSpeed: 470, lives: 5 })
  .background(BG, { dim: 0.6 })
  .brickRows(
    wall(
      [
        "..vvvvvvv..",
        "vvvvV#Vvvvv",
        "vV..#.#..Vv",
        "v...#.#...v",
        "vV.......Vv",
        ".vvvvvvvvv.",
        "..vvvvvvv..",
      ],
      { v: glass("violet"), V: hard("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .zone("ice", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 228 — Kal seen --------------------------------------------------------------------
// Lys draws him in light: a gecko in amber, the first thing the Hush has ever
// seen him as. The light first; the ghosts below wait. Invert and sticky.
const KAL_SEEN = createLevel({ id: "into-the-hush-08", name: "Kal seen", author: AUTHOR, ballSpeed: 471 })
  .background(BG, { dim: 0.6 })
  .brickRows(
    wall(
      [
        "..aAa......",
        ".aAaaaaa...",
        "..aaaaaaaa.",
        ".a.aaaaaa.a",
        ".a.aaaaaa.a",
        "........aaa",
        "o......aa..",
        "o.o.o.o....",
      ],
      { a: glass("amber"), A: hard("amber"), o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .rules({ order: "amber" })
  .zone("invert", 180, 350)
  .zone("sticky", 60, 450)
  .bonus("slow", 300, 450)
  .build();

// 229 — The delivery ----------------------------------------------------------------
// Lys's beam pointing out, a V of cyan to a hard point. A portal across the
// floor, two fans, a split.
const THE_DELIVERY = createLevel({ id: "into-the-hush-09", name: "The delivery", author: AUTHOR, ballSpeed: 472 })
  .background(BG, { dim: 0.6 })
  .brickRows(
    wall(
      [
        "c.........c",
        ".c.......c.",
        "..c.....c..",
        "...c...c...",
        "....c.c....",
        ".....C.....",
      ],
      { c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .zone("split", 180, 380)
  .portal(60, 430, 300, 430)
  .build();

// 230 — Out with the light ----------------------------------------------------------
// A sunrise from inside the dark: amber bands, a band of ghosts, a hard
// horizon, all of it descending. A guard under it, shrink; four minutes.
const OUT_WITH_THE_LIGHT = createLevel({ id: "into-the-hush-10", name: "Out with the light", author: AUTHOR, ballSpeed: 473 })
  .background(BG, { dim: 0.6 })
  .brickRows(
    wall(
      [
        "....aaa....",
        "..aaaAaaa..",
        ".aaAAAAAaa.",
        "aaAAAaAAAaa",
        "ooooooooooo",
        "VVVVVVVVVVV",
      ],
      { a: glass("amber"), A: hard("amber"), o: piece("ghost", "violet"), V: hard("violet") },
      TOP,
    ),
  )
  .guard(180, 320, { w: 48, h: 8, range: 90, speed: 1.6 })
  .zone("shrink", 180, 420)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .rules({ descend: 20, timer: 240 })
  .build();

export const INTO_THE_HUSH: StoryEpisodeDef = {
  slug: "into-the-hush",
  title: "Into the Hush",
  order: 23,
  tagline: "The one thing it cannot see walks in, and finds a granary where it expected a monster.",
  background: BG,
  chapters: [
    {
      slug: "the-edge",
      title: "The edge",
      intro: "Where the light stops. Kal walks across the line the way he walks onto any wall. The Hush does not notice. It never has.",
      xp: 18100,
      level: THE_EDGE,
    },
    {
      slug: "lyss-road",
      title: "Lys's road",
      intro: "Lys goes in behind him drawing a road of light the dark can see. She is the lure and the lantern, and the swarm turns to follow her instead of the dome.",
      xp: 18200,
      level: LYSS_ROAD,
    },
    {
      slug: "swallowed-light",
      title: "Swallowed light",
      intro: "Inside, the dark is full of light. Every glow it ever took, still moving, running in veins toward the center. None of it was eaten. All of it was kept.",
      xp: 18300,
      level: SWALLOWED_LIGHT,
    },
    {
      slug: "the-granary",
      title: "The granary",
      intro: "The Hush is not a monster. It is a granary. A Gleaner holds what it gathers for a garden to collect, and no garden ever came.",
      xp: 18400,
      level: THE_GRANARY,
    },
    {
      slug: "vitras-suns",
      title: "Vitra's suns",
      intro: "Among the stores, two lights larger than the rest, whole, warm, in a rhythm Kal knows from inside the egg. The twin suns. Kept.",
      xp: 18500,
      level: VITRAS_SUNS,
    },
    {
      slug: "the-gnaws-nest",
      title: "The Gnaw's nest",
      intro: "Where the scouts are grown, in rows, with teeth. Even a granary has to keep the vermin out. Kal has been called worse.",
      xp: 18600,
      level: THE_GNAWS_NEST,
    },
    {
      slug: "the-hearts-throat",
      title: "The heart's throat",
      intro: "At the center, the throat that eats. It has swallowed suns. It has never once been shown what it was grown to carry.",
      xp: 18700,
      level: THE_HEARTS_THROAT,
    },
    {
      slug: "kal-seen",
      title: "Kal seen",
      intro: "Kal does what the Sowers never did. Lys draws him in light, and for the first time in his life, the Hush sees him: a seed. Not for gleaning. For planting.",
      xp: 18800,
      level: KAL_SEEN,
    },
    {
      slug: "the-delivery",
      title: "The delivery",
      intro: "A Gleaner follows a seed to the garden. Kal turns and walks out the way he came, and the whole dark turns with him.",
      xp: 18900,
      level: THE_DELIVERY,
    },
    {
      slug: "out-with-the-light",
      title: "Out with the light",
      intro: "Two geckos come out of the Hush at dawn, and the Hush comes out behind them, carrying everything it ever took. Aurel watches a sunrise from the wrong direction.",
      xp: 19000,
      level: OUT_WITH_THE_LIGHT,
    },
  ],
};
