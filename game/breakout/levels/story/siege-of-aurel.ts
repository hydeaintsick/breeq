/**
 * Episode 22 — Siege of Aurel.
 *
 * Home, with everyone on the wall. The Ember Fleet and Sable on the dome, the
 * Lanterns lit with a light the Hush cannot see, the Corallines' marked seeds
 * under the glass, the Cindermoths at the dark edge where nobody else can
 * fly, the Tally everywhere at once. Then the Hush arrives whole — not a
 * shadow, not scouts, the swarm and its heart — and the siege is the longest
 * night Aurel has had. The marked light holds: the dark passes over the
 * seedlings and the Lanterns as if they were not there. But a gecko is not a
 * seed. The dark can see every one of them on the dome, and it comes for the
 * glass they stand on.
 *
 * Mechanics: Aurel with bumpers, Sable on the dome with keys and locks and a
 * magnet eye, six peoples in formation with regen and grow, marked seedlings
 * under an order rule with anti-gravity, a wave of ghosts in fog, a lantern
 * wall of explosives with fans, moths with rotors and two guards and ×3, a
 * shadow on the dome as a black hole in a steel throat behind a mirror (five
 * lives), the dome cracking with explosives, ice and descend, and the dome
 * held: keys and locks, explosives, regen, bumpers, a guard, shrink, ice, ×3,
 * three lives, a narrower paddle, five minutes.
 *
 * Shapes: a young planet, a gecko on a dome, six peoples, seedlings, a wave, a
 * lantern wall, moths, a dome with a shadow, cracking panes, a dome held.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/siege-of-aurel.jpg";

// 211 — Aurel in sight --------------------------------------------------------------
// The young world, amber, its dome a ring of hard glass. Two bumpers under it.
const AUREL_IN_SIGHT = createLevel({ id: "siege-of-aurel-01", name: "Aurel in sight", author: AUTHOR, ballSpeed: 460 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "...aaaaa...",
        "..aaaAaaa..",
        ".aaAaaaAaa.",
        ".aaaaAaaaa.",
        ".aaAaaaAaa.",
        "..aaaAaaa..",
        "...aaaaa...",
      ],
      { a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .bumper(90, 330)
  .bumper(270, 330)
  .bonus("slow", 180, 440)
  .build();

// 212 — Sable on the dome -----------------------------------------------------------
// The old gecko in profile on the dome's edge, her claw marks in the glass as
// locks, a magnet eye, the key at the far end of the dome. Sticky under her.
const SABLE_ON_THE_DOME = createLevel({ id: "siege-of-aurel-02", name: "Sable on the dome", author: AUTHOR, ballSpeed: 461 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "......mVV..",
        "...vvvVVVV.",
        ".vvvvvvvv..",
        "v.vKKKKv.v.",
        "v.vvvvvv.v.",
        "vvv........",
        "..vv......k",
        "cc.......cc",
      ],
      { m: piece("magnet", "amber"), V: hard("violet"), v: glass("violet"), K: piece("lock", "amber"), k: piece("key", "amber"), c: glass("cyan") },
      TOP,
    ),
  )
  .zone("sticky", 180, 360)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .build();

// 213 — Every people ----------------------------------------------------------------
// Six peoples in formation over the dome, one color each, regen engines
// under every ship. Grow under the fleet.
const EVERY_PEOPLE = createLevel({ id: "siege-of-aurel-03", name: "Every people", author: AUTHOR, ballSpeed: 462 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "bbb.vvv.ppp",
        "bBb.vVv.pPp",
        ".r...r...r.",
        "...........",
        "ccc.lll.aaa",
        "cCc.lLl.aAa",
        ".r...r...r.",
      ],
      {
        b: glass("blue"),
        B: hard("blue"),
        v: glass("violet"),
        V: hard("violet"),
        p: glass("pink"),
        P: hard("pink"),
        c: glass("cyan"),
        C: hard("cyan"),
        l: glass("lime"),
        L: hard("lime"),
        a: glass("amber"),
        A: hard("amber"),
        r: piece("regen", "cyan"),
      },
      TOP,
    ),
  )
  .zone("grow", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 214 — Marked light ----------------------------------------------------------------
// The Corallines' seedlings under the dome, the mark in pink at every tip:
// the lime first, the way they grew. Anti-gravity under the bed.
const MARKED_LIGHT = createLevel({ id: "siege-of-aurel-04", name: "Marked light", author: AUTHOR, ballSpeed: 463 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        ".p.....p...",
        "pl.....lp..",
        ".l..p..l..p",
        ".L.pl..L.lp",
        ".L..l..L..l",
        ".L..L..L..L",
        "LLLLLLLLLLL",
      ],
      { p: glass("pink"), l: glass("lime"), L: hard("lime") },
      TOP,
    ),
  )
  .rules({ order: "lime" })
  .zone("antigrav", 180, 360)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .build();

// 215 — The dark arrives ------------------------------------------------------------
// The swarm comes down on the dome as a wave of ghosts, wide at the top,
// narrowing to a point. Fog under it.
const THE_DARK_ARRIVES = createLevel({ id: "siege-of-aurel-05", name: "The dark arrives", author: AUTHOR, ballSpeed: 464 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "ooooooooooo",
        ".ooooooooo.",
        "..ooooooo..",
        "...ooooo...",
        "....ooo....",
        ".....o.....",
      ],
      { o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .zone("fog", 180, 350, 22)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 216 — Lanterns hold ---------------------------------------------------------------
// Two rows of Lanterns over the dome, explosive lamps between hard hulls.
// Two fans under the line.
const LANTERNS_HOLD = createLevel({ id: "siege-of-aurel-06", name: "Lanterns hold", author: AUTHOR, ballSpeed: 465 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "aAa.aAa.aAa",
        "aea.aea.aea",
        "aAa.aAa.aAa",
        "...........",
        "..aAa.aAa..",
        "..aea.aea..",
        "..aAa.aAa..",
      ],
      { a: glass("amber"), A: hard("amber"), e: piece("explosive", "amber") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .bonus("slow", 180, 440)
  .build();

// 217 — Moths at the edge -----------------------------------------------------------
// The Cindermoths where nobody else can fly, rotors at the corners of the
// dark. Two guards under them, ×3 between.
const MOTHS_AT_THE_EDGE = createLevel({ id: "siege-of-aurel-07", name: "Moths at the edge", author: AUTHOR, ballSpeed: 466 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "x.a.a.a.a.x",
        ".aAa...aAa.",
        "..a.....a..",
        "x.........x",
        "....aAa....",
        "...a.x.a...",
      ],
      { x: piece("rotor", "amber"), a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .guard(104, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .guard(256, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .bonus("fast3", 180, 420)
  .bonus("slow", 60, 460)
  .zone("grow", 300, 460)
  .build();

// 218 — Shadow on the dome ----------------------------------------------------------
// The heart of the swarm settles on the glass: a black hole in a steel throat
// inside the dome's arc. A mirror under it, five lives.
const SHADOW_ON_THE_DOME = createLevel({ id: "siege-of-aurel-08", name: "Shadow on the dome", author: AUTHOR, ballSpeed: 467, lives: 5 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "...ccccc...",
        ".ccvV#Vvcc.",
        "cV..#.#..Vc",
        "c...#.#...c",
        "cV.......Vc",
        ".cvvvvvvvc.",
        "c.........c",
        "c.........c",
      ],
      { c: glass("cyan"), v: glass("violet"), V: hard("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .zone("mirror", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 219 — The dome cracks -------------------------------------------------------------
// Panes in steel ribs, some of them going, explosive where the cracks meet.
// The wall descends; ice on the left.
const THE_DOME_CRACKS = createLevel({ id: "siege-of-aurel-09", name: "The dome cracks", author: AUTHOR, ballSpeed: 468 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "#c#c#c#c#c#",
        "cecc.cc.cec",
        "#c#c#c#c#c#",
        "c.ccecc.ccc",
        "#c#.#c#c#.#",
      ],
      { "#": steel("cyan"), c: glass("cyan"), e: piece("explosive", "cyan") },
      TOP,
    ),
  )
  .zone("ice", 60, 440)
  .bonus("slow", 300, 440)
  .zone("grow", 180, 460)
  .rules({ descend: 20 })
  .build();

// 220 — Held ------------------------------------------------------------------------
// The dome whole, with everyone on it: locks at the crown and the key at the
// floor, explosives at the eaves, regen along the ribs. Bumpers, a guard,
// shrink, ice, ×3, three lives, a narrower paddle, five minutes.
const HELD = createLevel({ id: "siege-of-aurel-10", name: "Held", author: AUTHOR, ballSpeed: 469, lives: 3, paddleWidth: 68 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "....KcK....",
        "..cccccccc.",
        ".cceccccecc",
        "cc.......cc",
        "c.........c",
        "c.r.....r.c",
        "c.........c",
        "....k......",
      ],
      { K: piece("lock", "amber"), c: glass("cyan"), e: piece("explosive", "cyan"), r: piece("regen", "lime"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .bumper(90, 330)
  .bumper(270, 330)
  .guard(180, 300, { w: 48, h: 8, range: 60, speed: 1.6 })
  .zone("shrink", 180, 400)
  .zone("ice", 60, 460)
  .bonus("fast3", 300, 460)
  .rules({ timer: 300 })
  .build();

export const SIEGE_OF_AUREL: StoryEpisodeDef = {
  slug: "siege-of-aurel",
  title: "Siege of Aurel",
  order: 22,
  tagline: "Everyone on the wall, the dark arriving whole, and a light it cannot see.",
  background: BG,
  chapters: [
    {
      slug: "aurel-in-sight",
      title: "Aurel in sight",
      intro: "One young sun and a dome three panes from closed. Behind the seed-ship, a court, a reef, a fleet of Lanterns and a menagerie. Kal is home, and he brought company.",
      xp: 17100,
      level: AUREL_IN_SIGHT,
    },
    {
      slug: "sable-on-the-dome",
      title: "Sable on the dome",
      intro: "Sable has been on the dome since the beacon stopped. She reads Lys's shell the way she read his, and goes still a third time. Then she makes room on the wall.",
      xp: 17200,
      level: SABLE_ON_THE_DOME,
    },
    {
      slug: "every-people",
      title: "Every people",
      intro: "Geckos, Corallines, Cindermoths, Keepers, the Tally. Nobody on Aurel has a word for a fleet like this. Sable suggests one: a wall.",
      xp: 17300,
      level: EVERY_PEOPLE,
    },
    {
      slug: "marked-light",
      title: "Marked light",
      intro: "The Corallines plant their marked seeds under the dome and the Lanterns hang over it. Every light on Aurel now says: not for gleaning. Except the geckos.",
      xp: 17400,
      level: MARKED_LIGHT,
    },
    {
      slug: "the-dark-arrives",
      title: "The dark arrives",
      intro: "Not a shadow. Not scouts. The swarm and its heart, coming down on the dome like a tide. The longest night Aurel has had begins.",
      xp: 17500,
      level: THE_DARK_ARRIVES,
    },
    {
      slug: "lanterns-hold",
      title: "Lanterns hold",
      intro: "The Hush passes over the Lanterns as if they were not there. It cannot see the light it came for. It can see everyone standing in it.",
      xp: 17600,
      level: LANTERNS_HOLD,
    },
    {
      slug: "moths-at-the-edge",
      title: "Moths at the edge",
      intro: "Where the dark has already fed, only the moths can fly. The Candle holds the edge with her wardens and does not ask anyone to thank her.",
      xp: 17700,
      level: MOTHS_AT_THE_EDGE,
    },
    {
      slug: "shadow-on-the-dome",
      title: "Shadow on the dome",
      intro: "The heart of the swarm settles on the glass over the seedlings. It cannot see them. It can feel the geckos on the other side, and it starts on the dome.",
      xp: 17800,
      level: SHADOW_ON_THE_DOME,
    },
    {
      slug: "the-dome-cracks",
      title: "The dome cracks",
      intro: "Pane by pane. Every gecko who can climb is on the inside of the sky holding it up. Kal is fastest. Lys is second. It is not enough.",
      xp: 17900,
      level: THE_DOME_CRACKS,
    },
    {
      slug: "held",
      title: "Held",
      intro: "The dome holds until dawn, barely, because a wall is what all of them are for. At sunrise the Hush is still there, and Kal understands there is only one place left to go: inside it.",
      xp: 18000,
      level: HELD,
    },
  ],
};
