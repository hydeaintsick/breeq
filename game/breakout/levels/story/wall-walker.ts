/**
 * Episode 13 — The Wall-walker.
 *
 * Out of the roots, the sky is a story. Every Vitran hatchling was shown it
 * once: the Wall-walker, a gecko drawn in stars across the whole night, whose
 * tail points the way the first geckos came. Lys knows it from Meridian's
 * side; Kal knows it from the pod's chart, though nobody told him what it
 * was. Together they walk it — head, feet, tail, star by star — with Nul's
 * fleet behind them learning the shape, and the Hush, for the first time,
 * seeing where the road goes. At the tail's tip: a star with a circle drawn
 * around it, the same circle from the pod, and Meridian rising beyond it.
 *
 * Mechanics: constellations — hard stars joined by faint lines — under every
 * rule in the kit. The head on bumpers, the tail on rails with anti-gravity,
 * four feet with a split, Nul's eye (a black hole in steel, fog, five lives),
 * the sky-story under an order rule with ghosts, a beam of Lantern light on
 * rails with ice and fans, the chase with rotors, guards, ×3 and invert, the
 * circled star with a decoy portal and a mirror, a dark constellation with a
 * black hole and explosives descending (five lives), and Meridian rising:
 * keys and locks, regen, a guard, shrink, five minutes.
 *
 * Shapes: a gecko's head, its tail, four feet, an eye, the whole Wall-walker,
 * a beam, the chase, a circled star, the dark twin, a garden world rising.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/wall-walker.jpg";

// 121 — First stars ---------------------------------------------------------------
// The Wall-walker's head: hard amber stars for the eyes and snout, blue lines
// between them. Two bumpers where the stars are brightest.
const FIRST_STARS = createLevel({ id: "wall-walker-01", name: "First stars", author: AUTHOR, ballSpeed: 410 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "...A.....A.",
        "..bbb...bb.",
        ".bb..bAb.b.",
        "A....bbb.b.",
        ".bb.bb.bb..",
        "..bAb...A..",
        "...bb.bb...",
        "....bbb....",
      ],
      { A: hard("amber"), b: glass("blue") },
      TOP,
    ),
  )
  .bumper(110, 340)
  .bumper(250, 340)
  .bonus("slow", 180, 440)
  .build();

// 122 — The tail ------------------------------------------------------------------
// A long curling tail of stars. Rails to ride along it; anti-gravity lifts the
// ball into the curl.
const THE_TAIL = createLevel({ id: "wall-walker-02", name: "The tail", author: AUTHOR, ballSpeed: 412 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "A.........",
        "bbb.......",
        ".bbbA.....",
        "...bbbb...",
        ".....bbbA.",
        "....bbbb..",
        "...Abbb...",
        ".bbbb.....",
        ".A........",
      ],
      { A: hard("amber"), b: glass("blue") },
      TOP,
    ),
  )
  .rail(40, 340, 90)
  .rail(230, 340, 90)
  .zone("antigrav", 180, 400)
  .bonus("slow", 60, 470)
  .bonus("fast2", 300, 470)
  .build();

// 123 — Four feet -----------------------------------------------------------------
// Four clusters of stars, one per foot, each with a hard heel. A split for
// two balls, grow under the middle.
const FOUR_FEET = createLevel({ id: "wall-walker-03", name: "Four feet", author: AUTHOR, ballSpeed: 414 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "b.b.....b.b",
        "bAb.....bAb",
        ".bb.....bb.",
        "...........",
        ".bb.....bb.",
        "bAb.....bAb",
        "b.b.....b.b",
      ],
      { A: hard("amber"), b: glass("blue") },
      TOP,
    ),
  )
  .zone("split", 180, 330)
  .zone("grow", 180, 410)
  .bonus("slow", 60, 470)
  .bonus("fast2", 300, 470)
  .build();

// 124 — Nul's eye -----------------------------------------------------------------
// The Hush looks through Nul's eye: a black hole in a steel throat above an
// open chamber, violet lids, a fog bank off to one side. Five lives.
const NULS_EYE = createLevel({ id: "wall-walker-04", name: "Nul's eye", author: AUTHOR, ballSpeed: 416, lives: 5 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "...vvvvv...",
        ".vvVV#VVvv.",
        "vV..#.#..Vv",
        "v...#.#...v",
        "v.........v",
        ".vvvVVVvvv.",
        "...vvvvv...",
      ],
      { v: glass("violet"), V: hard("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .bonus("slow", 180, 360)
  .zone("grow", 60, 450)
  .zone("fog", 300, 450, 22)
  .build();

// 125 — Sky-story -----------------------------------------------------------------
// The whole Wall-walker at once, small: hard amber stars for the joints, blue
// lines for the body, ghosts where the story has faded. Amber first — the
// stars before the lines, the way the story is told.
const SKY_STORY = createLevel({ id: "wall-walker-05", name: "Sky-story", author: AUTHOR, ballSpeed: 418 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "A..o.....A.",
        ".bbbbbbbb..",
        "A.bAoAb.A.o",
        "..b....b...",
        "..A....A.bb",
        "..........A",
      ],
      { A: hard("amber"), b: glass("blue"), o: piece("ghost", "blue") },
      TOP,
    ),
  )
  .rules({ order: "amber" })
  .bonus("slow", 180, 340)
  .zone("grow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 126 — Lantern light -------------------------------------------------------------
// Lys walks a beam from a Lantern: a diagonal of pink and cyan, hard where the
// beam is brightest. Rails under it, ice where it lands, fans across it.
const LANTERN_LIGHT = createLevel({ id: "wall-walker-06", name: "Lantern light", author: AUTHOR, ballSpeed: 420 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "A.........A",
        "cc.......cc",
        ".ccP...Pcc.",
        "..cccp.ccc.",
        "....cppP...",
        "......ppp..",
        ".....ppppP.",
      ],
      { A: hard("amber"), c: glass("cyan"), p: glass("pink"), P: hard("pink") },
      TOP,
    ),
  )
  .rail(40, 330, 90)
  .rail(230, 330, 90)
  .fan(12, 410, 1, { reach: 110, spread: 36, force: 2 })
  .fan(348, 410, -1, { reach: 110, spread: 36, force: 2 })
  .zone("ice", 180, 460)
  .build();

// 127 — The chase -----------------------------------------------------------------
// Nul's fleet across the constellation: hollow ships with rotor engines,
// two guards under them, ×3 for the brave, invert for the unlucky.
const THE_CHASE = createLevel({ id: "wall-walker-07", name: "The chase", author: AUTHOR, ballSpeed: 422 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "..RVR...RVR",
        "..vvv...vvv",
        "...........",
        "RVR...RVR..",
        "vvv...vvv..",
        "...........",
        "....vAv....",
      ],
      { R: piece("rotor", "violet"), V: hard("violet"), v: glass("violet"), A: hard("amber") },
      TOP,
    ),
  )
  .guard(104, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .guard(256, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .bonus("fast3", 180, 400)
  .zone("invert", 60, 470)
  .bonus("slow", 300, 470)
  .build();

// 128 — Where the tail points -----------------------------------------------------
// The tail's last star, with a circle drawn around it — the pod's circle.
// A hard amber star in a ring of violet glass, a portal into the ring, a decoy
// beside it, a mirror under it.
const WHERE_THE_TAIL_POINTS = createLevel({ id: "wall-walker-08", name: "Where the tail points", author: AUTHOR, ballSpeed: 424 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "...vvVvv...",
        "..vv...vv..",
        ".V...A...V.",
        ".v..AAA..v.",
        ".V...A...V.",
        "..vv...vv..",
        "...vvVvv...",
        "bb.......bb",
      ],
      { v: glass("violet"), V: hard("violet"), A: hard("amber"), b: glass("blue") },
      TOP,
    ),
  )
  .portal(60, 430, 180, 150)
  .zone("fakePortal", 300, 430)
  .zone("mirror", 180, 350)
  .bonus("slow", 180, 470)
  .build();

// 129 — The Hush learns -----------------------------------------------------------
// A dark twin of the Wall-walker: the same stars, hollow, with a black hole
// where the head should be and explosive joints. The whole sky comes down
// (descend). Five lives.
const THE_HUSH_LEARNS = createLevel({ id: "wall-walker-09", name: "The Hush learns", author: AUTHOR, ballSpeed: 426, lives: 5 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "......vvvvv",
        "....vvVV#VV",
        "...vV..#.#.",
        "...v...#.#.",
        "e..vvvvvvvv",
        ".vv...e....",
        "e.....vv..e",
        "..........v",
      ],
      { v: glass("violet"), V: hard("violet"), "#": steel("violet"), e: piece("explosive", "violet") },
      TOP,
    ),
  )
  .blackhole(265, 140)
  .bonus("slow", 60, 440)
  .zone("grow", 300, 440)
  .rules({ descend: 20 })
  .build();

// 130 — Meridian rising -----------------------------------------------------------
// A garden world on the horizon: a lime globe with regen blossoms and locked
// gates that keys in the stars open. A guard on the horizon, shrink, five
// minutes.
const MERIDIAN_RISING = createLevel({ id: "wall-walker-10", name: "Meridian rising", author: AUTHOR, ballSpeed: 428 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "k.A.....A.k",
        "....lllll..",
        "...lrlllrl.",
        "..llXlllXll",
        "..lllLLlll.",
        "...lrlllr..",
        "....lllll..",
      ],
      { k: piece("key", "cyan"), A: hard("amber"), l: glass("lime"), L: hard("lime"), r: piece("regen", "lime"), X: piece("lock", "cyan") },
      TOP,
    ),
  )
  .guard(180, 310, { w: 48, h: 8, range: 90, speed: 1.6 })
  .zone("shrink", 60, 450)
  .bonus("slow", 300, 450)
  .rules({ timer: 300 })
  .build();

export const WALL_WALKER: StoryEpisodeDef = {
  slug: "wall-walker",
  title: "The Wall-walker",
  order: 13,
  tagline: "A gecko drawn in stars across the whole sky, and two who walk it together.",
  background: BG,
  chapters: [
    {
      slug: "first-stars",
      title: "First stars",
      intro: "Every Vitran hatchling was shown it once: a gecko drawn in stars. Nobody showed Kal. Lys shows him now, starting with the head.",
      xp: 8100,
      level: FIRST_STARS,
    },
    {
      slug: "the-tail",
      title: "The tail",
      intro: "The tail is the longest part and the oldest. It points the way the first geckos came, before Vitra, before the glass.",
      xp: 8200,
      level: THE_TAIL,
    },
    {
      slug: "four-feet",
      title: "Four feet",
      intro: "Four feet on the sky. Two geckos climbing. Kal has never had this much room.",
      xp: 8300,
      level: FOUR_FEET,
    },
    {
      slug: "nuls-eye",
      title: "Nul's eye",
      intro: "Nul is not following the road. He is following them. And through his eye, for the first time, the Hush sees where the road goes.",
      xp: 8400,
      level: NULS_EYE,
    },
    {
      slug: "sky-story",
      title: "Sky-story",
      intro: "The whole Wall-walker at once, small enough to hold. Lys tells it the way it is told on Meridian: the stars first, then the lines.",
      xp: 8500,
      level: SKY_STORY,
    },
    {
      slug: "lantern-light",
      title: "Lantern light",
      intro: "A Lantern's beam crosses the constellation, and Lys walks it as if it were a floor. Kal learns what light is for.",
      xp: 8600,
      level: LANTERN_LIGHT,
    },
    {
      slug: "the-chase",
      title: "The chase",
      intro: "The hollow fleet comes through the stars behind them, and every ship has his face on the hull.",
      xp: 8700,
      level: THE_CHASE,
    },
    {
      slug: "where-the-tail-points",
      title: "Where the tail points",
      intro: "The last star of the tail has a circle drawn around it. Kal knows the circle. It was etched inside the pod.",
      xp: 8800,
      level: WHERE_THE_TAIL_POINTS,
    },
    {
      slug: "the-hush-learns",
      title: "The Hush learns",
      intro: "Behind them the sky goes dark in the shape of a gecko. The Hush has learned the story too. It is telling it back.",
      xp: 8900,
      level: THE_HUSH_LEARNS,
    },
    {
      slug: "meridian-rising",
      title: "Meridian rising",
      intro: "Where the tail points, a green world comes up over the dark. Meridian. Where the loan was written.",
      xp: 9000,
      level: MERIDIAN_RISING,
    },
  ],
};
