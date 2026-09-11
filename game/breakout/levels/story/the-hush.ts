/**
 * Episode 7 — The Hush.
 *
 * The battlefield. In a sky full of wrecks, the Ember Fleet — Kal's own kind,
 * amber ships that have held the line for years — almost fires on his
 * Lantern. An old gecko with a scarred tail, Sable, reads the marks on his
 * shell and goes very still: she knew the ship that launched his pod. Kal
 * takes his place on the wall. The Hush comes in waves, breaks through, looks
 * at him with a thing that has no light in it, and Kal turns the Lantern into
 * a light it cannot swallow.
 *
 * Mechanics: the war episode. Wreck fields with bumpers, regen engines and a
 * split for the fleet, keys for Sable's marks, double guards for the shield
 * wall, ghosts and a pocketed black hole for the breach, explosive chains for
 * the torchbearers, two black holes in the eye of the Hush (five lives),
 * rails and a trampoline for the counterstrike, a timed descend for the
 * Lantern, and a dawn wall with everything on the clock.
 *
 * Shapes: wrecks, a fleet in formation, a gecko, a phalanx, a broken wall,
 * torch ships, an eye, a spearhead, the Lantern, a sunrise.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/the-hush.jpg";

// 61 — Battlefront ----------------------------------------------------------------
// Wrecks: broken hulls of hard blue and steel scattered across the sky, two
// bumpers in the debris.
const BATTLEFRONT = createLevel({ id: "the-hush-01", name: "Battlefront", author: AUTHOR, ballSpeed: 396 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "BB#....bbb.",
        "bbb..#.Bb..",
        "..b.bBb..#.",
        ".#..bb..bbB",
        "bBb....#bb.",
        "..bb.Bb....",
        ".....bbb.b#",
      ],
      { b: glass("blue"), B: hard("blue"), "#": steel("blue") },
      TOP,
    ),
  )
  .bumper(110, 330)
  .bumper(250, 330)
  .bonus("slow", 60, 430)
  .bonus("fast2", 300, 430)
  .build();

// 62 — Ember Fleet ----------------------------------------------------------------
// Amber ships in formation, regen engines under each, a split zone so two
// balls fly with the fleet.
const EMBER_FLEET = createLevel({ id: "the-hush-02", name: "Ember Fleet", author: AUTHOR, ballSpeed: 398 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".....a.....",
        "....AAA....",
        ".....r.....",
        "..a.....a..",
        ".AAA...AAA.",
        "..r.....r..",
        "a....a....a",
        "AA..AAA..AA",
        "r.....r...r",
      ],
      { a: glass("amber"), A: hard("amber"), r: piece("regen", "lime") },
      TOP,
    ),
  )
  .zone("split", 180, 340)
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .build();

// 63 — Old Sable ------------------------------------------------------------------
// A gecko in profile: hard head, glass body, a long curling tail, four claw
// marks that are locks and the key that reads them. A magnet in the eye.
const OLD_SABLE = createLevel({ id: "the-hush-03", name: "Old Sable", author: AUTHOR, ballSpeed: 400 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..VVm......",
        ".VVVVvvv...",
        "..vvvvvvvv.",
        ".v.vKKKKv.v",
        ".v.vvvvvv.v",
        "........vvv",
        "k......vv..",
      ],
      { V: hard("violet"), v: glass("violet"), m: piece("magnet", "amber"), K: piece("lock", "amber"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .zone("sticky", 180, 340)
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .build();

// 64 — Shield wall ----------------------------------------------------------------
// A phalanx: a hard band with steel posts, glass behind and below it. A wide
// guard sweeps in front of the wall.
const SHIELD_WALL = createLevel({ id: "the-hush-04", name: "Shield wall", author: AUTHOR, ballSpeed: 402 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "aaaaaaaaaaa",
        "aaaaaaaaaaa",
        "#AAAA#AAAA#",
        "#aaaa#aaaa#",
        "...........",
        "..A.....A..",
      ],
      { a: glass("amber"), A: hard("amber"), "#": steel("amber") },
      TOP,
    ),
  )
  .guard(180, 320, { w: 56, h: 8, range: 90, speed: 1.6 })
  .bonus("slow", 60, 420)
  .bonus("fast2", 180, 420)
  .zone("grow", 300, 420)
  .build();

// 65 — The breach -----------------------------------------------------------------
// The wall broken in the middle: ghosts flicker in the widening gap, and the
// dark waits in the top corner of the sky for anything that slips past the
// wall's edge. Two bumpers in the rubble. Four lives.
const THE_BREACH = createLevel({ id: "the-hush-05", name: "The breach", author: AUTHOR, ballSpeed: 404, lives: 4 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "AAAAA.AAAAA",
        "AAAA...AAAA",
        "aaaa.o.aaaa",
        "aaa..o..aaa",
        "aa..ooo..aa",
        "a...o.o...a",
      ],
      { A: hard("amber"), a: glass("amber"), o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .blackhole(32, 64)
  .bumper(110, 340)
  .bumper(250, 340)
  .bonus("slow", 180, 420)
  .zone("grow", 60, 460)
  .bonus("fast2", 300, 460)
  .build();

// 66 — Torchbearers ---------------------------------------------------------------
// Three torch ships: explosive lights in a chain along the hull, rotor
// engines, hard prows. ×3 where the light falls.
const TORCHBEARERS = createLevel({ id: "the-hush-06", name: "Torchbearers", author: AUTHOR, ballSpeed: 406 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "*a*a*a*a*a*",
        "aaaaaaaaaaa",
        "x.A.....A.x",
        "...........",
        ".*aaa.aaa*.",
        "..A.....A..",
        "...........",
        "....x.x....",
      ],
      { "*": piece("explosive", "amber"), a: glass("amber"), A: hard("amber"), x: piece("rotor", "violet") },
      TOP,
    ),
  )
  .bonus("fast3", 180, 340)
  .zone("shrink", 60, 440)
  .bonus("slow", 300, 440)
  .zone("invert", 180, 470)
  .build();

// 67 — The eye --------------------------------------------------------------------
// The Hush: a wide eye, hollow inside, hardened around the throat, and for a
// pupil a black hole hanging in steel at the top of the hollow. Ice under it
// so the paddle slides. Five lives.
const THE_EYE = createLevel({ id: "the-hush-07", name: "The eye", author: AUTHOR, ballSpeed: 408, lives: 5 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...vvvvv...",
        ".vvVV#VVvv.",
        "vV..#.#..Vv",
        "v...#.#...v",
        "vV.......Vv",
        ".vvVVVVVvv.",
        "...vvvvv...",
      ],
      { V: hard("violet"), v: glass("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .zone("ice", 180, 340)
  .bonus("slow", 60, 440)
  .zone("grow", 180, 460)
  .bonus("slow", 300, 440)
  .build();

// 68 — Counterstrike --------------------------------------------------------------
// The fleet's spearhead: an arrow of hard amber pointing up, glass wake, two
// rails to ride and a trampoline to launch from. Invert in the wake, ×3 and
// ice on the flanks.
const COUNTERSTRIKE = createLevel({ id: "the-hush-08", name: "Counterstrike", author: AUTHOR, ballSpeed: 410 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".....A.....",
        "....AAA....",
        "...AAaAA...",
        "..AAaaaAA..",
        ".AAaaaaaAA.",
        "....aaa....",
        "....aaa....",
        "...aa.aa...",
      ],
      { A: hard("amber"), a: glass("amber") },
      TOP,
    ),
  )
  .rail(60, 320, 80)
  .rail(220, 320, 80)
  .zone("invert", 180, 340)
  .trampoline(180, 470, 100)
  .bonus("fast3", 60, 420)
  .zone("ice", 300, 420)
  .build();

// 69 — The Lantern's light --------------------------------------------------------
// Kal's Lantern turned into a bomb: a steel hull around an explosive core,
// open only at the tail, hard fins, a lime fuse. A guard patrols under it,
// the paddle shrinks and slides, the wall descends every 20 hits; four minutes.
const LANTERNS_LIGHT = createLevel({ id: "the-hush-09", name: "The Lantern's light", author: AUTHOR, ballSpeed: 412 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".....l.....",
        "....###....",
        "...#***#...",
        "...#*a*#...",
        "...#***#...",
        ".A..#.#..A.",
        "AAA.....AAA",
      ],
      { l: glass("lime"), "#": steel("blue"), "*": piece("explosive", "amber"), a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .guard(180, 330, { w: 48, h: 8, range: 90, speed: 1.7 })
  .zone("mirror", 180, 390)
  .bonus("fast2", 60, 440)
  .zone("ice", 300, 440)
  .zone("shrink", 180, 460)
  .rules({ descend: 20, timer: 240 })
  .build();

// 70 — Dawn over the wrecks -------------------------------------------------------
// The dark breaks: bands of a sunrise over the wreck field, a hard horizon,
// steel wrecks in the ground row, a key that opens two locks in the sun.
// Bumpers, ×3, shrink, a narrower paddle, five minutes.
const DAWN_OVER_THE_WRECKS = createLevel({
  id: "the-hush-10",
  name: "Dawn over the wrecks",
  author: AUTHOR,
  ballSpeed: 414,
  paddleWidth: 68,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....aKa....",
        "...aakaa...",
        "..aaaKaaa..",
        "ppppppppppp",
        "vvvvvvvvvvv",
        "BBBBBBBBBBB",
        "#b#..b..#b#",
      ],
      {
        a: glass("amber"),
        k: piece("key", "amber"),
        K: piece("lock", "amber"),
        p: glass("pink"),
        v: glass("violet"),
        B: hard("blue"),
        b: glass("blue"),
        "#": steel("blue"),
      },
      TOP,
    ),
  )
  .bumper(110, 330)
  .bumper(250, 330)
  .bonus("fast3", 180, 380)
  .zone("shrink", 180, 440)
  .bonus("slow", 60, 460)
  .zone("grow", 300, 460)
  .rules({ timer: 300 })
  .build();

export const THE_HUSH: StoryEpisodeDef = {
  slug: "the-hush",
  title: "The Hush",
  order: 7,
  tagline: "The Ember Fleet, the dark that hunts light, and a gecko who has come a long way.",
  background: BG,
  chapters: [
    {
      slug: "battlefront",
      title: "Battlefront",
      intro: "The sky here is full of wrecks. Somewhere in it, a fleet of geckos has held the line for years.",
      xp: 2500,
      level: BATTLEFRONT,
    },
    {
      slug: "ember-fleet",
      title: "Ember Fleet",
      intro: "Amber ships turn toward the Lantern. The Ember Fleet has not seen a Lantern in a lifetime. They almost fire.",
      xp: 2550,
      level: EMBER_FLEET,
    },
    {
      slug: "old-sable",
      title: "Old Sable",
      intro: "An old gecko with a scarred tail reads the marks on Kal's shell and goes very still. She knew the ship that launched his pod.",
      xp: 2600,
      level: OLD_SABLE,
    },
    {
      slug: "shield-wall",
      title: "Shield wall",
      intro: "The Hush comes in waves. The fleet meets each one with a wall. Kal takes his place on it.",
      xp: 2650,
      level: SHIELD_WALL,
    },
    {
      slug: "the-breach",
      title: "The breach",
      intro: "The wall breaks. The dark pours through the gap, and Kal is the smallest thing in it.",
      xp: 2700,
      level: THE_BREACH,
    },
    {
      slug: "torchbearers",
      title: "Torchbearers",
      intro: "The fleet's torchbearers light the dark so the rest can aim. Their fuel is running out.",
      xp: 2750,
      level: TORCHBEARERS,
    },
    {
      slug: "the-eye",
      title: "The eye",
      intro: "At the center of the dark, a thing with no light in it at all. The Hush looks at Kal. Kal looks back.",
      xp: 2800,
      level: THE_EYE,
    },
    {
      slug: "counterstrike",
      title: "Counterstrike",
      intro: "Sable's plan: hit the Hush where it feeds, in the light it has already swallowed. Kal knows walls. He goes first.",
      xp: 2850,
      level: COUNTERSTRIKE,
    },
    {
      slug: "the-lanterns-light",
      title: "The Lantern's light",
      intro: "The Lantern was built to keep strangers out. Kal turns it into a light the Hush cannot swallow.",
      xp: 2900,
      level: LANTERNS_LIGHT,
    },
    {
      slug: "dawn-over-the-wrecks",
      title: "Dawn over the wrecks",
      intro: "The dark breaks. In the wreck-lit dawn, the Ember Fleet counts what it has left, and what it has gained: one small gecko.",
      xp: 2950,
      level: DAWN_OVER_THE_WRECKS,
    },
  ],
};
