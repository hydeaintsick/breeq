/**
 * Episode 12 — Rootway.
 *
 * The Sowers do not fly between stars. They grow there: the Rootway, living
 * tunnels of violet root and lime sap that the seed-map follows to Meridian.
 * Kal goes in with Nul's hollow fleet behind him — and, in the fifth tunnel,
 * meets the one thing the Curator never mentioned. Lys. The other egg. Grown
 * in the same vat a generation ago, kept by the Sowers as the control, raised
 * on Meridian as a scout who walks on light the way Kal walks on glass. She
 * was sent to bring the loan home. She finds him instead. From here there are
 * two on the wall, and the road ahead is drawn in stars.
 *
 * Mechanics: root arcs with hard knots and gravity, sap pulses (regen) on
 * rails, knots of rotors behind a mirror, a fog of ghosts and explosives for
 * what follows, two geckos facing each other with a portal between them and
 * sticky, a split for two on the wall, the wardens' hunt with guards, fans,
 * shrink and invert, a burrow with a black hole in its throat (five lives),
 * Lys's light on rails with anti-gravity and ice and ×3, and the tunnel mouth:
 * keys and locks, a guard, a descending wall, four minutes.
 *
 * Shapes: root arcs, pulses, a tangle, shapes in fog, two geckos, twins, the
 * hunt, a burrow, beams of light, the tunnel's mouth.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/rootway.jpg";

// 111 — Roots ---------------------------------------------------------------------
// Arcs of root across the tunnel, hard where they knot. Gravity pulls the ball
// down the grain; a slow zone at the bottom.
const ROOTS = createLevel({ id: "rootway-01", name: "Roots", author: AUTHOR, ballSpeed: 406 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "vv.......vv",
        ".vvV...Vvv.",
        "...vvvvv...",
        "...........",
        "Vvv.....vvV",
        "..vvvVvvv..",
        "...........",
        ".vvv...vvv.",
      ],
      { v: glass("violet"), V: hard("violet") },
      TOP,
    ),
  )
  .zone("gravity", 180, 330)
  .bonus("slow", 180, 440)
  .build();

// 112 — Sap light -----------------------------------------------------------------
// Pulses of lime running through the roots: regen beads on glass threads, two
// rails to ride the flow.
const SAP_LIGHT = createLevel({ id: "rootway-02", name: "Sap light", author: AUTHOR, ballSpeed: 408 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "l.r.l.r.l.r",
        "vvvvvvvvvvv",
        "r.l.r.l.r.l",
        "...........",
        "l.r.l.r.l.r",
        "vvvvvvvvvvv",
        "r.l.r.l.r.l",
      ],
      { l: glass("lime"), r: piece("regen", "lime"), v: glass("violet") },
      TOP,
    ),
  )
  .rail(40, 330, 90)
  .rail(230, 330, 90)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 113 — Knots ---------------------------------------------------------------------
// A tangle where three roots cross: rotors at the crossings, hard wood around
// them, a mirror under the knot.
const KNOTS = createLevel({ id: "rootway-03", name: "Knots", author: AUTHOR, ballSpeed: 410 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "v...v...v..",
        ".v..v..v...",
        "..vVRVv....",
        "...vvv.....",
        "..vVRVv..vv",
        ".v..v..vRVv",
        "v...v...vv.",
      ],
      { v: glass("violet"), V: hard("violet"), R: piece("rotor", "violet") },
      TOP,
    ),
  )
  .zone("mirror", 180, 340)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 114 — Something following -------------------------------------------------------
// Shapes in the fog behind him: ghosts that are there and not, explosive
// engines. ×2 for going fast.
const SOMETHING_FOLLOWING = createLevel({ id: "rootway-04", name: "Something following", author: AUTHOR, ballSpeed: 412 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "..ovo...ovo",
        ".ovVvo.ovVv",
        "..oeo...oeo",
        "...........",
        "ovo...ovo..",
        "vVvo.ovVvo.",
        "oeo...oeo..",
      ],
      { o: piece("ghost", "violet"), v: glass("violet"), V: hard("violet"), e: piece("explosive", "pink") },
      TOP,
    ),
  )
  .zone("fog", 180, 350, 22)
  .bonus("fast2", 180, 430)
  .bonus("slow", 60, 470)
  .build();

// 115 — Lys -----------------------------------------------------------------------
// Two geckos in profile, facing: Kal in blue on the left, Lys in pink on the
// right, hard heads, a portal between them so the ball crosses from one to the
// other. Sticky: for once, the ball waits.
const LYS = createLevel({ id: "rootway-05", name: "Lys", author: AUTHOR, ballSpeed: 414 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "..bb....pp.",
        ".bBbb..ppPp",
        ".bbbb..pppp",
        "b.bbb..ppp.",
        "..b.b..p.p.",
        "..bb....pp.",
      ],
      { b: glass("blue"), B: hard("blue"), p: glass("pink"), P: hard("pink") },
      TOP,
    ),
  )
  .portal(60, 400, 300, 400)
  .zone("sticky", 180, 340)
  .bonus("slow", 180, 460)
  .build();

// 116 — Two on the wall -----------------------------------------------------------
// Twins: the same shape twice, blue and pink, a split so there are two balls
// as there are now two geckos. Grow under it.
const TWO_ON_THE_WALL = createLevel({ id: "rootway-06", name: "Two on the wall", author: AUTHOR, ballSpeed: 416 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        ".bbbb.pppp.",
        "bBbbb.pppPp",
        "bbbbb.ppppp",
        ".bbb...ppp.",
        "..b.....p..",
        "..bb...pp..",
      ],
      { b: glass("blue"), B: hard("blue"), p: glass("pink"), P: hard("pink") },
      TOP,
    ),
  )
  .zone("split", 180, 330)
  .zone("grow", 180, 410)
  .bonus("slow", 60, 470)
  .bonus("fast2", 300, 470)
  .build();

// 117 — The wardens' hunt ---------------------------------------------------------
// Nul's wardens in the tunnel: hard shapes with rotor wings, two guards
// below, two fans pushing the ball off course, shrink and invert.
const THE_WARDENS_HUNT = createLevel({ id: "rootway-07", name: "The wardens' hunt", author: AUTHOR, ballSpeed: 418 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        ".RVV...VVR.",
        "..vv...vv..",
        "...........",
        "....RVR....",
        ".....v.....",
        "...........",
        "VV.......VV",
      ],
      { R: piece("rotor", "violet"), V: hard("violet"), v: glass("violet") },
      TOP,
    ),
  )
  .guard(104, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .guard(256, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .fan(12, 400, 1, { reach: 110, spread: 36, force: 2 })
  .fan(348, 400, -1, { reach: 110, spread: 36, force: 2 })
  .zone("shrink", 60, 470)
  .zone("invert", 300, 470)
  .bonus("slow", 180, 470)
  .build();

// 118 — The burrow ----------------------------------------------------------------
// The tunnel narrows to a throat, and in the throat, something that eats
// light: a black hole in steel above an open chamber, a mirror below. Five lives.
const THE_BURROW = createLevel({ id: "rootway-08", name: "The burrow", author: AUTHOR, ballSpeed: 420, lives: 5 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "..vvvvvvv..",
        ".vvVV#VVvv.",
        "vV..#.#..Vv",
        "v...#.#...v",
        "v.........v",
        ".vvvVVVvvv.",
        "..vvvvvvv..",
      ],
      { v: glass("violet"), V: hard("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .zone("mirror", 180, 340)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 119 — Lys's light ---------------------------------------------------------------
// She walks on light. Beams of pink and cyan drawn across the dark, rails to
// ride them, anti-gravity where they rise, ice where they cross. ×3.
const LYSS_LIGHT = createLevel({ id: "rootway-09", name: "Lys's light", author: AUTHOR, ballSpeed: 422 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "pP.......Cc",
        ".pp.....cc.",
        "..pp...cc..",
        "...pP.Cc...",
        "....pPc....",
        "...cC.Pp...",
        "..cc...pp..",
        ".cc.....pp.",
      ],
      { p: glass("pink"), P: hard("pink"), c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .rail(40, 320, 90)
  .rail(230, 320, 90)
  .zone("antigrav", 180, 380)
  .zone("ice", 60, 460)
  .bonus("fast3", 300, 460)
  .build();

// 120 — Out of the roots ----------------------------------------------------------
// The tunnel's mouth: a ring of steel and violet, locked panes that keys at
// the rim open, stars showing through. A guard on the rim, the ring closing
// (descend), four minutes.
const OUT_OF_THE_ROOTS = createLevel({ id: "rootway-10", name: "Out of the roots", author: AUTHOR, ballSpeed: 424 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "...#####...",
        "..#vvXvv#..",
        ".#vv...vv#.",
        "#vX..c..Xv#",
        ".#vv...vv#.",
        "..#vvvvv#..",
        "k....#....k",
      ],
      { "#": steel("violet"), v: glass("violet"), X: piece("lock", "cyan"), k: piece("key", "cyan"), c: glass("cyan") },
      TOP,
    ),
  )
  .guard(180, 310, { w: 48, h: 8, range: 90, speed: 1.6 })
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .rules({ descend: 20, timer: 240 })
  .build();

export const ROOTWAY: StoryEpisodeDef = {
  slug: "rootway",
  title: "Rootway",
  order: 12,
  tagline: "Living tunnels between the stars, something hollow behind, and someone ahead.",
  background: BG,
  chapters: [
    {
      slug: "roots",
      title: "Roots",
      intro: "The Sowers do not fly between stars. They grow there. The seed-map leads into a root the width of a moon.",
      xp: 7100,
      level: ROOTS,
    },
    {
      slug: "sap-light",
      title: "Sap light",
      intro: "Light runs through the walls in pulses. Kal counts them without meaning to. They are not his rhythm. They are close.",
      xp: 7200,
      level: SAP_LIGHT,
    },
    {
      slug: "knots",
      title: "Knots",
      intro: "Where roots cross, the tunnel turns on itself. Kal climbs. Kal always climbs.",
      xp: 7300,
      level: KNOTS,
    },
    {
      slug: "something-following",
      title: "Something following",
      intro: "Behind him, engines that make no sound and a shape with his face. Nul has learned the road by watching him walk it.",
      xp: 7400,
      level: SOMETHING_FOLLOWING,
    },
    {
      slug: "lys",
      title: "Lys",
      intro: "In the fifth tunnel, another gecko, on the ceiling, waiting. The other egg. She was sent to bring the loan home. She looks at him a long time.",
      xp: 7500,
      level: LYS,
    },
    {
      slug: "two-on-the-wall",
      title: "Two on the wall",
      intro: "She does not bring him home. She climbs beside him instead, and for the first time since the Grey Moon, Kal is not the only one on the wall.",
      xp: 7600,
      level: TWO_ON_THE_WALL,
    },
    {
      slug: "the-wardens-hunt",
      title: "The wardens' hunt",
      intro: "Nul's wardens come through the roots with the Curator's patience and none of his manners.",
      xp: 7700,
      level: THE_WARDENS_HUNT,
    },
    {
      slug: "the-burrow",
      title: "The burrow",
      intro: "The tunnel narrows to a throat, and something in it has been eating the sap light. The Hush is in the roots too.",
      xp: 7800,
      level: THE_BURROW,
    },
    {
      slug: "lyss-light",
      title: "Lys's light",
      intro: "She walks on light the way he walks on glass. Where the roots go dark, she draws a road across the dark, and he follows it.",
      xp: 7900,
      level: LYSS_LIGHT,
    },
    {
      slug: "out-of-the-roots",
      title: "Out of the roots",
      intro: "The tunnel opens on stars. Lys points: the old Vitran sky-story, a gecko drawn in stars, its tail pointing the way. They go together.",
      xp: 8000,
      level: OUT_OF_THE_ROOTS,
    },
  ],
};
