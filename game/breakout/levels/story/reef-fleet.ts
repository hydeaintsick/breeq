/**
 * Episode 19 — Reef Fleet.
 *
 * The Lumen Reef, a second time. The Corallines glow to speak and trade in
 * light, and Kal returns the pearl they gave him with something they have
 * never been offered: a mark to grow into their light-seeds, so that what
 * they grow cannot be gleaned. They grow it. The Gnaw come at dusk as they
 * always do, and this time the reef does not only stand on its wall — it lifts
 * off it. The Corallines have ships of shell they have never had a reason to
 * fly. They leave their sea for the first time, and take the light with them.
 *
 * Mechanics: waves with hard crests on ice, a coral fan with regen tips and
 * grow, a clam with steel jaws and a ring of locks around the pearl, a
 * seedling with the mark under anti-gravity, bells with ghost tentacles and a
 * split, a wall of rotor teeth with ×3, the Gnaw's mouth as a black hole in a
 * steel throat (five lives), spiral shells with bumpers and rails, a reef
 * lifting with fans and gravity, and shell ships over waves on descend with a
 * guard and four minutes.
 *
 * Shapes: waves, a coral fan, a clam, a seedling, bells, teeth, a mouth,
 * spiral shells, a reef rising, ships over the sea.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/reef-fleet.jpg";

// 181 — Return to the shallows ------------------------------------------------------
// Waves of cyan glass with hard crests. Ice where the ship skims the water.
const RETURN_TO_THE_SHALLOWS = createLevel({ id: "reef-fleet-01", name: "Return to the shallows", author: AUTHOR, ballSpeed: 448 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        ".c...c...c.",
        "cCc.cCc.cCc",
        "ccccccccccc",
        "...........",
        "..c...c....",
        ".cCc.cCc...",
        "ccccccccc..",
      ],
      { C: hard("cyan"), c: glass("cyan") },
      TOP,
    ),
  )
  .zone("ice", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 182 — The elders ------------------------------------------------------------------
// The coral fan the elders speak from: lime branches with regen tips, a hard
// trunk. Grow under the fan.
const THE_ELDERS = createLevel({ id: "reef-fleet-02", name: "The elders", author: AUTHOR, ballSpeed: 449 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "r..r.r.r..r",
        ".l.l.l.l.l.",
        "..lLlLlLl..",
        "...lLLLl...",
        "....lll....",
        ".....L.....",
        ".....L.....",
      ],
      { r: piece("regen", "lime"), l: glass("lime"), L: hard("lime") },
      TOP,
    ),
  )
  .zone("grow", 180, 360)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .build();

// 183 — The pearl returned ----------------------------------------------------------
// The clam: steel jaws, cyan flesh, a ring of locks around the pearl, and the
// key on the sand. Sticky under the clam.
const THE_PEARL_RETURNED = createLevel({ id: "reef-fleet-03", name: "The pearl returned", author: AUTHOR, ballSpeed: 450 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "..#######..",
        ".#ccccccc#.",
        "#cccKKKccc#",
        "#ccK.p.Kcc#",
        "#cccKKKccc#",
        "..ccccccc..",
        "....k......",
      ],
      { "#": steel("cyan"), c: glass("cyan"), K: piece("lock", "amber"), p: glass("pink"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .zone("sticky", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 184 — Growing the mark ------------------------------------------------------------
// A light-seed on its stem with the mark in pink at the tip and regen buds on
// the branches. Anti-gravity under the seedling.
const GROWING_THE_MARK = createLevel({ id: "reef-fleet-04", name: "Growing the mark", author: AUTHOR, ballSpeed: 451 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "....p.p....",
        ".....p.....",
        "..r..l..r..",
        "...l.l.l...",
        "....lll....",
        ".....L.....",
        ".....L.....",
        "...LLLLL...",
      ],
      { p: glass("pink"), r: piece("regen", "lime"), l: glass("lime"), L: hard("lime") },
      TOP,
    ),
  )
  .zone("antigrav", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 185 — Bells of war ----------------------------------------------------------------
// Three bells of glass with ghost tentacles, carrying the news down the
// current. A split under them.
const BELLS_OF_WAR = createLevel({ id: "reef-fleet-05", name: "Bells of war", author: AUTHOR, ballSpeed: 452 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        ".ccc...ccc.",
        "ccccc.ccccc",
        ".o.o...o.o.",
        ".o.o...o.o.",
        "...........",
        "....ccc....",
        "...ccccc...",
        "....o.o....",
      ],
      { c: glass("cyan"), o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .zone("split", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 186 — The Gnaw return -------------------------------------------------------------
// Two rows of teeth with rotors set in the gums. ×3 between the jaws.
const THE_GNAW_RETURN = createLevel({ id: "reef-fleet-06", name: "The Gnaw return", author: AUTHOR, ballSpeed: 453 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "vvvvvvvvvvv",
        "VxVxVxVxVxV",
        ".V.V.V.V.V.",
        "...........",
        ".V.V.V.V.V.",
        "VxVxVxVxVxV",
      ],
      { v: glass("violet"), V: hard("violet"), x: piece("rotor", "pink") },
      TOP,
    ),
  )
  .bonus("fast3", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 187 — Dusk tide -------------------------------------------------------------------
// The worm's mouth again, wider, and the dark in a steel throat above the
// hollow of it. Ice under it, five lives.
const DUSK_TIDE = createLevel({ id: "reef-fleet-07", name: "Dusk tide", author: AUTHOR, ballSpeed: 454, lives: 5 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "..vvvvvvv..",
        ".vvvV#Vvvv.",
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

// 188 — Shell ships -----------------------------------------------------------------
// Three spiral shells the Corallines have never flown. Bumpers between them,
// two rails below.
const SHELL_SHIPS = createLevel({ id: "reef-fleet-08", name: "Shell ships", author: AUTHOR, ballSpeed: 455 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "..ccc......",
        ".c...c..ccc",
        ".c.cCc.c...",
        "..ccc..c.cC",
        "........ccc",
        "....ccc....",
        "...c...c...",
        "...c.cCc...",
        "....ccc....",
      ],
      { c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .bumper(60, 330)
  .bumper(300, 330)
  .rail(60, 400, 80)
  .rail(220, 400, 80)
  .bonus("slow", 180, 460)
  .build();

// 189 — Lifting the reef ------------------------------------------------------------
// The coral fan coming up off a steel floor. Two fans across the water,
// gravity under the reef.
const LIFTING_THE_REEF = createLevel({ id: "reef-fleet-09", name: "Lifting the reef", author: AUTHOR, ballSpeed: 456 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "l...l.l...l",
        ".l..l.l..l.",
        "..lLlLlLl..",
        "...LLLLL...",
        "....lll....",
        "...........",
        "..#######..",
      ],
      { l: glass("lime"), L: hard("lime"), "#": steel("cyan") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .zone("gravity", 180, 400)
  .bonus("slow", 180, 460)
  .build();

// 190 — Sea leaves the sea ----------------------------------------------------------
// Shell ships over the waves they came from, the whole wall descending. A
// guard under it, shrink; four minutes.
const SEA_LEAVES_THE_SEA = createLevel({ id: "reef-fleet-10", name: "Sea leaves the sea", author: AUTHOR, ballSpeed: 457 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "...ccc.....",
        "..cCcCc.ccc",
        "...ccc.cCcC",
        "........ccc",
        "lllllllllll",
        "LLLLLLLLLLL",
      ],
      { c: glass("cyan"), C: hard("cyan"), l: glass("lime"), L: hard("lime") },
      TOP,
    ),
  )
  .guard(180, 320, { w: 48, h: 8, range: 90, speed: 1.6 })
  .zone("shrink", 180, 420)
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .rules({ descend: 20, timer: 240 })
  .build();

export const REEF_FLEET: StoryEpisodeDef = {
  slug: "reef-fleet",
  title: "Reef Fleet",
  order: 19,
  tagline: "A pearl returned, a mark grown into light, and a sea that leaves the sea.",
  background: BG,
  chapters: [
    {
      slug: "return-to-the-shallows",
      title: "Return to the shallows",
      intro: "The ocean lit from below, the way he left it. The Corallines saw the seed-ship coming a day out; the whole reef is glowing his name.",
      xp: 14100,
      level: RETURN_TO_THE_SHALLOWS,
    },
    {
      slug: "the-elders",
      title: "The elders",
      intro: "The elders remember the gecko who paid for a pearl with a story. He has a longer one now, and someone to tell half of it.",
      xp: 14200,
      level: THE_ELDERS,
    },
    {
      slug: "the-pearl-returned",
      title: "The pearl returned",
      intro: "Kal gives the pearl back. Nobody has ever returned a gift to the reef. The Corallines do not have a color for it yet.",
      xp: 14300,
      level: THE_PEARL_RETURNED,
    },
    {
      slug: "growing-the-mark",
      title: "Growing the mark",
      intro: "The Corallines grow light. Lys shows them the mark. Under the shallows, the first light-seed that cannot be gleaned takes root.",
      xp: 14400,
      level: GROWING_THE_MARK,
    },
    {
      slug: "bells-of-war",
      title: "Bells of war",
      intro: "Bells of glass drift up the current, carrying the news to every reef in the sea: the Gnaw are coming early this year, and in numbers.",
      xp: 14500,
      level: BELLS_OF_WAR,
    },
    {
      slug: "the-gnaw-return",
      title: "The Gnaw return",
      intro: "The Hush's scouts come for the new light before it can grow. They cannot see it. They chew the reef around it instead.",
      xp: 14600,
      level: THE_GNAW_RETURN,
    },
    {
      slug: "dusk-tide",
      title: "Dusk tide",
      intro: "At dusk the big one comes up from where the reef's light does not reach. Kal has stood on this wall before. Lys has not. She learns fast.",
      xp: 14700,
      level: DUSK_TIDE,
    },
    {
      slug: "shell-ships",
      title: "Shell ships",
      intro: "The Corallines have ships of shell they have never had a reason to fly. They have one now.",
      xp: 14800,
      level: SHELL_SHIPS,
    },
    {
      slug: "lifting-the-reef",
      title: "Lifting the reef",
      intro: "The reef comes up off the sea floor with its light-seeds in its arms. The water goes dark behind it. It will come back to it.",
      xp: 14900,
      level: LIFTING_THE_REEF,
    },
    {
      slug: "sea-leaves-the-sea",
      title: "Sea leaves the sea",
      intro: "For the first time since the reef was a reef, the Corallines leave their ocean. They take the light with them, marked.",
      xp: 15000,
      level: SEA_LEAVES_THE_SEA,
    },
  ],
};
