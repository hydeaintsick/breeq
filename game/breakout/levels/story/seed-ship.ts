/**
 * Episode 15 — Seed-ship.
 *
 * Season 3 opens on Meridian, the morning after. The Council of Seeds has
 * watched the dark take the Curator through the hollow he made, and Nul turn
 * toward Aurel with Kal's face and the Hush behind his eyes. So they give up
 * what they have kept for an age: the Hush is theirs. Long ago the Sowers grew
 * a Gleaner — a hunger built to sweep stray light out of the dark between
 * stars and carry it to their gardens. It got out, and it never stopped being
 * hungry. The mark grown into every seed says *not for gleaning*. That mark is
 * Kal's gift; it is why the Hush has never seen him. Lys takes a seed-ship.
 * Nul is a day ahead on the straight road to Aurel, so the two of them take
 * the long one: back along the route, to every people who owes them light.
 *
 * Mechanics: the season's kit in one breath. Bumpers and fog for the
 * confession, ghosts and anti-gravity for the Gleaner, an order rule for the
 * mark, a steel hull with a regen sprout for the ship, rails and a split for
 * the launch, a portal and a mirror at the fork, rotors and gravity in the
 * roots, a black hole in a steel throat where the sap has gone dark (five
 * lives), keys and locks with fans for Lys's chart, and a descending wall
 * with explosives and a guard as Vireo rises.
 *
 * Shapes: a council ring with a dark heart, a sickle, a seed with a mark, a
 * pod-ship, pods parting, a fork in the road, root arcs, a dark throat, a
 * chart in reverse, a green world rising.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/seed-ship.jpg";

// 141 — The confession --------------------------------------------------------------
// The Council's ring, and for the first time nothing in the middle of it: a
// hollow the fog fills. Two bumpers under the ring.
const THE_CONFESSION = createLevel({ id: "seed-ship-01", name: "The confession", author: AUTHOR, ballSpeed: 432 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "..LlLlLlL..",
        ".L.......L.",
        "l.........l",
        "L.........L",
        "l.........l",
        ".L.......L.",
        "..LlLlLlL..",
      ],
      { L: hard("lime"), l: glass("lime") },
      TOP,
    ),
  )
  .zone("fog", 180, 152, 22)
  .bumper(90, 330)
  .bumper(270, 330)
  .bonus("slow", 180, 440)
  .build();

// 142 — The Gleaner -----------------------------------------------------------------
// A sickle: a hard violet blade with ghosts along its edge, and a steel
// handle. Anti-gravity under the curve.
const THE_GLEANER = createLevel({ id: "seed-ship-02", name: "The Gleaner", author: AUTHOR, ballSpeed: 433 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "....vvvvv..",
        "..vvVVVVvv.",
        ".vVo....oVv",
        ".Vo......ov",
        "..o.......o",
        "....#......",
        "....#......",
      ],
      { v: glass("violet"), V: hard("violet"), o: piece("ghost", "violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .zone("antigrav", 180, 340)
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .build();

// 143 — The mark --------------------------------------------------------------------
// A seed of amber glass, and under it the mark grown into every seed: a pink
// chevron that has to be read first. Sticky under the seed.
const THE_MARK = createLevel({ id: "seed-ship-03", name: "The mark", author: AUTHOR, ballSpeed: 434 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "....aaa....",
        "..aaaaaaa..",
        ".aaaaaaaaa.",
        ".aaaaaaaaa.",
        "..aaaaaaa..",
        "...p.a.p...",
        "....p.p....",
        ".....p.....",
      ],
      { a: glass("amber"), p: glass("pink") },
      TOP,
    ),
  )
  .rules({ order: "pink" })
  .zone("sticky", 180, 360)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 144 — Seed-ship -------------------------------------------------------------------
// Lys's ship: a pod with a steel hull, lime glass inside, a regen sprout at
// the tip and a hard keel. Grow under it.
const THE_SEED_SHIP = createLevel({ id: "seed-ship-04", name: "Seed-ship", author: AUTHOR, ballSpeed: 435 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        ".....r.....",
        "....lll....",
        "...#lll#...",
        "..#lllll#..",
        "..#lLlLl#..",
        "..#lllll#..",
        "...#lll#...",
        "....LLL....",
      ],
      { r: piece("regen", "lime"), "#": steel("lime"), l: glass("lime"), L: hard("lime") },
      TOP,
    ),
  )
  .zone("grow", 180, 350)
  .bonus("fast2", 60, 440)
  .bonus("slow", 300, 440)
  .build();

// 145 — Launch ----------------------------------------------------------------------
// The pods part and the ship rises between them. Two rails to ride, a split
// so two balls climb.
const LAUNCH = createLevel({ id: "seed-ship-05", name: "Launch", author: AUTHOR, ballSpeed: 436 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "lLl.....lLl",
        "lll..a..lll",
        ".l..aAa..l.",
        "....aaa....",
        "...aa.aa...",
        "...A...A...",
      ],
      { l: glass("lime"), L: hard("lime"), a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .rail(40, 330, 80)
  .rail(240, 330, 80)
  .zone("split", 180, 400)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .build();

// 146 — Two roads -------------------------------------------------------------------
// A fork: Nul's road on the left in ghosts, theirs on the right in lime, one
// hard trunk below. A portal from one road to the other, a mirror under the
// fork.
const TWO_ROADS = createLevel({ id: "seed-ship-06", name: "Two roads", author: AUTHOR, ballSpeed: 437 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "o.........l",
        ".o.......l.",
        "..o.....l..",
        "...o...l...",
        "....o.l....",
        ".....L.....",
        ".....L.....",
      ],
      { o: piece("ghost", "violet"), l: glass("lime"), L: hard("lime") },
      TOP,
    ),
  )
  .zone("mirror", 180, 340)
  .portal(60, 400, 300, 400)
  .bonus("slow", 180, 460)
  .build();

// 147 — The Rootway again -----------------------------------------------------------
// Root arcs with rotors in the knots. Gravity under the roots.
const THE_ROOTWAY_AGAIN = createLevel({ id: "seed-ship-07", name: "The Rootway again", author: AUTHOR, ballSpeed: 438 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "VV.......VV",
        "..VvxvV....",
        ".....vVvxvV",
        "VvxvV......",
        "...........",
        "....VvxvV..",
      ],
      { V: hard("violet"), v: glass("violet"), x: piece("rotor", "amber") },
      TOP,
    ),
  )
  .zone("gravity", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 148 — Sap dark --------------------------------------------------------------------
// A root the Hush has eaten from inside: lime bark around a violet hollow, and
// in the throat above the hollow, the dark itself. Five lives.
const SAP_DARK = createLevel({ id: "seed-ship-08", name: "Sap dark", author: AUTHOR, ballSpeed: 439, lives: 5 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "..lllllll..",
        ".lVVV#VVVl.",
        "lV..#.#..Vl",
        "l...#.#...l",
        "lV.......Vl",
        ".lvvvvvvvl.",
        "..lllllll..",
      ],
      { l: glass("lime"), v: glass("violet"), V: hard("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .bonus("slow", 60, 440)
  .zone("grow", 180, 460)
  .bonus("slow", 300, 440)
  .build();

// 149 — Lys's chart -----------------------------------------------------------------
// The route in reverse: the worlds are locks, the lines between them cyan
// glass, and the ship is the key, down at the start. Two fans across the sky.
const LYSS_CHART = createLevel({ id: "seed-ship-09", name: "Lys's chart", author: AUTHOR, ballSpeed: 440 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "K....c....K",
        ".c..c.c..c.",
        "..c.c..cc..",
        "...K....c..",
        "..cc.....c.",
        ".c........K",
        "k..........",
      ],
      { K: piece("lock", "amber"), c: glass("cyan"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .bonus("slow", 180, 440)
  .build();

// 150 — Green world behind ----------------------------------------------------------
// Vireo coming up under a steel roof: a green world with explosive seams. A
// guard under it, ice on the left, the wall descending; four minutes.
const GREEN_WORLD_BEHIND = createLevel({ id: "seed-ship-10", name: "Green world behind", author: AUTHOR, ballSpeed: 441 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "###########",
        "...lllll...",
        ".lllLeLlll.",
        "llleLLLelll",
        "lllLeLeLlll",
        ".lllLeLlll.",
        "...lllll...",
      ],
      { "#": steel("cyan"), l: glass("lime"), L: hard("lime"), e: piece("explosive", "lime") },
      TOP,
    ),
  )
  .guard(180, 320, { w: 48, h: 8, range: 90, speed: 1.6 })
  .zone("ice", 60, 440)
  .bonus("slow", 300, 440)
  .rules({ descend: 20, timer: 240 })
  .build();

export const SEED_SHIP: StoryEpisodeDef = {
  slug: "seed-ship",
  title: "Seed-ship",
  order: 15,
  tagline: "The Council's confession, a hunger with a name, and the long road back.",
  background: BG,
  chapters: [
    {
      slug: "the-confession",
      title: "The confession",
      intro: "The morning after, the Council of Seeds says what it has kept for an age: the Hush is theirs. They grew it.",
      xp: 10100,
      level: THE_CONFESSION,
    },
    {
      slug: "the-gleaner",
      title: "The Gleaner",
      intro: "A Gleaner, built to sweep stray light out of the dark between stars and carry it to the gardens. It got out. It never stopped being hungry.",
      xp: 10200,
      level: THE_GLEANER,
    },
    {
      slug: "the-mark",
      title: "The mark",
      intro: "Every seed the Sowers grow carries a mark that says: not for gleaning. That mark is Kal's gift. It is why the dark has never seen him.",
      xp: 10300,
      level: THE_MARK,
    },
    {
      slug: "seed-ship",
      title: "Seed-ship",
      intro: "Lys takes a seed-ship from the Council that raised her. Nobody stops her. Nobody on Meridian has ever refused anything either.",
      xp: 10400,
      level: THE_SEED_SHIP,
    },
    {
      slug: "launch",
      title: "Launch",
      intro: "The pods part. Two geckos on the hull, and for the first time the road ahead is one they chose.",
      xp: 10500,
      level: LAUNCH,
    },
    {
      slug: "two-roads",
      title: "Two roads",
      intro: "Nul is a day ahead on the straight road to Aurel. So they take the long one: back along the route, to every people who owes them light.",
      xp: 10600,
      level: TWO_ROADS,
    },
    {
      slug: "the-rootway-again",
      title: "The Rootway again",
      intro: "The roots know them now. The sap light runs ahead of the ship like a road being drawn.",
      xp: 10700,
      level: THE_ROOTWAY_AGAIN,
    },
    {
      slug: "sap-dark",
      title: "Sap dark",
      intro: "Where the hollow fleet passed, the roots are dark inside. The Gleaner eats what it passes. It always has.",
      xp: 10800,
      level: SAP_DARK,
    },
    {
      slug: "lyss-chart",
      title: "Lys's chart",
      intro: "Lys draws the route in reverse on the cabin glass: Vireo, the Grey Moon, Vitra, the reef, the ash, the wrecks. Then Aurel.",
      xp: 10900,
      level: LYSS_CHART,
    },
    {
      slug: "green-world-behind",
      title: "Green world behind",
      intro: "A green world comes up under a broken roof. Kal left it burning. Something has been living in the ashes.",
      xp: 11000,
      level: GREEN_WORLD_BEHIND,
    },
  ],
};
