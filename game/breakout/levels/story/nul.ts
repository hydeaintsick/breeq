/**
 * Episode 21 — Nul.
 *
 * The wreck-sky where the Ember Fleet held the line, and the hollow fleet
 * waiting in it with Kal's face on every hull. Nul has the pod's beacon, and
 * he plays Kal's rhythm across the wrecks the way the green ship once did. He
 * has walked the whole road behind Kal, and hollow does not mean empty: he
 * learned the shape by watching. He draws the Wall-walker himself. He knows
 * which of them is the copy, and he has stopped caring. The Hush notices its
 * eye hesitating. Nul turns his fleet aside and lets them pass, and the dark
 * that used him for an eye turns on him. Kal does not stay to watch. He will
 * regret that.
 *
 * Mechanics: steel wrecks with bumpers, ghost ships with magnets in fog, a
 * heartbeat with rails and sticky, two geckos with a mirror and a portal, the
 * Wall-walker drawn under an order rule, wardens with rotors and two guards,
 * the eye as a black hole in a steel throat on ice (five lives), Nul's wall in
 * steel with explosives and invert, the eye closing in hard lids with a split
 * and shrink, and a gap in the fleet on descend with a guard, a narrower
 * paddle and four minutes.
 *
 * Shapes: wrecks, a hollow fleet, a waveform, two geckos, a gecko of stars, a
 * warden flight, an eye, an arch, a closing eye, a gap in a fleet.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/nul.jpg";

// 201 — Wreck field again -----------------------------------------------------------
// The battlefield as Kal left it, in pink now under a different light: hard
// hulls, steel debris, two bumpers.
const WRECK_FIELD_AGAIN = createLevel({ id: "nul-01", name: "Wreck field again", author: AUTHOR, ballSpeed: 456 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "pp#....ppp.",
        "ppp..#.Pp..",
        "..p.pPp..#.",
        ".#..pp..ppP",
        "pPp....#pp.",
        "..pp.Pp....",
      ],
      { p: glass("pink"), P: hard("pink"), "#": steel("pink") },
      TOP,
    ),
  )
  .bumper(110, 330)
  .bumper(250, 330)
  .bonus("slow", 60, 430)
  .bonus("fast2", 300, 430)
  .build();

// 202 — The hollow fleet waits ------------------------------------------------------
// Ships with no light in them: ghost hulls around magnet hearts, in
// formation. Fog under the fleet.
const THE_HOLLOW_FLEET_WAITS = createLevel({ id: "nul-02", name: "The hollow fleet waits", author: AUTHOR, ballSpeed: 457 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "ovo.....ovo",
        "vmv.ovo.vmv",
        "ovo.vmv.ovo",
        "....ovo....",
        "...........",
        ".ovo...ovo.",
        ".vmv...vmv.",
      ],
      { o: piece("ghost", "violet"), v: glass("violet"), m: piece("magnet", "violet") },
      TOP,
    ),
  )
  .zone("fog", 180, 350, 22)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 203 — The beacon's rhythm ---------------------------------------------------------
// Kal's heartbeat, played back across the wrecks: a double beat and a rest in
// amber. Two rails, sticky under the trace.
const THE_BEACONS_RHYTHM = createLevel({ id: "nul-03", name: "The beacon's rhythm", author: AUTHOR, ballSpeed: 458 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...A...A...",
        "..AaA.AaA..",
        "aaa.a.a.aaa",
        "....a.a....",
        "....A.A....",
      ],
      { a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .rail(40, 340, 80)
  .rail(240, 340, 80)
  .zone("sticky", 180, 400)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .build();

// 204 — Same face -------------------------------------------------------------------
// Kal and Nul face to face across the wrecks, one lit, one hollow. A mirror
// between them and a portal from one to the other.
const SAME_FACE = createLevel({ id: "nul-04", name: "Same face", author: AUTHOR, ballSpeed: 459 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "bBb.....oOo",
        "bbBb...oOoo",
        "bbbb...oooo",
        "bbb.b.o.ooo",
        "bBb.....oOo",
        ".bb.....oo.",
        "b.b.....o.o",
      ],
      { b: glass("blue"), B: hard("blue"), o: piece("ghost", "violet"), O: hard("violet") },
      TOP,
    ),
  )
  .zone("mirror", 180, 340)
  .portal(60, 420, 300, 420)
  .bonus("slow", 180, 470)
  .build();

// 205 — What Nul learned ------------------------------------------------------------
// The Wall-walker, drawn by Nul: hard blue stars and violet lines, told the
// way Lys told it. The stars first.
const WHAT_NUL_LEARNED = createLevel({ id: "nul-05", name: "What Nul learned", author: AUTHOR, ballSpeed: 460 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "B..v.....B.",
        ".vvBvvvvB..",
        "B.vBvBv.B.v",
        "..v....v...",
        "..B....B.vv",
        "..........B",
      ],
      { B: hard("blue"), v: glass("violet") },
      TOP,
    ),
  )
  .rules({ order: "blue" })
  .bonus("slow", 180, 350)
  .bonus("fast2", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 206 — Wardens turn ----------------------------------------------------------------
// Nul's wardens, rotor wings and violet bodies, turning to face their own
// fleet. Two guards under them, ×3 between.
const WARDENS_TURN = createLevel({ id: "nul-06", name: "Wardens turn", author: AUTHOR, ballSpeed: 461 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".xVx...xVx.",
        "vVVVv.vVVVv",
        ".vvv...vvv.",
        "..v.....v..",
        "....xVx....",
        "...vVVVv...",
        "....vvv....",
      ],
      { x: piece("rotor", "pink"), V: hard("violet"), v: glass("violet") },
      TOP,
    ),
  )
  .guard(104, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .guard(256, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .bonus("fast3", 180, 420)
  .bonus("slow", 60, 460)
  .zone("grow", 300, 460)
  .build();

// 207 — The eye turns ---------------------------------------------------------------
// The eye of the Hush, turning in Nul's face to look at what he is doing:
// pink lids, a violet iris, the dark in a steel throat. Ice under it, five
// lives.
const THE_EYE_TURNS = createLevel({ id: "nul-07", name: "The eye turns", author: AUTHOR, ballSpeed: 462, lives: 5 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...ppppp...",
        ".ppvV#Vvpp.",
        "pV..#.#..Vp",
        "p...#.#...p",
        "pV.......Vp",
        ".ppvvvvvpp.",
        "...ppppp...",
      ],
      { p: glass("pink"), v: glass("violet"), V: hard("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .zone("ice", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 208 — Nul's wall ------------------------------------------------------------------
// Nul builds a wall the way Kal would have: a steel arch, amber glass along
// the inside, explosives at the corners and the keystone. Invert under it.
const NULS_WALL = createLevel({ id: "nul-08", name: "Nul's wall", author: AUTHOR, ballSpeed: 463 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "###########",
        "#eaaaaaaae#",
        "#a.......a#",
        "#a..eee..a#",
        "#a.......a#",
        "#a.......a#",
        "#a.......a#",
      ],
      { "#": steel("amber"), e: piece("explosive", "amber"), a: glass("amber") },
      TOP,
    ),
  )
  .zone("invert", 180, 380)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .build();

// 209 — The eye closes --------------------------------------------------------------
// Nul shuts the eye: hard violet lids closing on a slit of glass. A split
// under them, shrink on the left.
const THE_EYE_CLOSES = createLevel({ id: "nul-09", name: "The eye closes", author: AUTHOR, ballSpeed: 464 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...VVVVV...",
        ".VVVVVVVVV.",
        "VVVVVVVVVVV",
        "vvvvvvvvvvv",
        "VVVVVVVVVVV",
        ".VVVVVVVVV.",
        "...VVVVV...",
      ],
      { V: hard("violet"), v: glass("violet") },
      TOP,
    ),
  )
  .zone("split", 180, 350)
  .zone("shrink", 60, 450)
  .bonus("slow", 300, 450)
  .build();

// 210 — Let them pass ---------------------------------------------------------------
// The hollow fleet parts and leaves a corridor down the middle. The wall
// descends, a guard sweeps the corridor, the paddle is narrower; four minutes.
const LET_THEM_PASS = createLevel({ id: "nul-10", name: "Let them pass", author: AUTHOR, ballSpeed: 465, paddleWidth: 68 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "ooo.....ooo",
        "omo.....omo",
        "ooo.....ooo",
        "vVv.....vVv",
        ".v.......v.",
        "oo.......oo",
        "omo.....omo",
        "oo.......oo",
      ],
      { o: piece("ghost", "violet"), m: piece("magnet", "violet"), v: glass("violet"), V: hard("violet") },
      TOP,
    ),
  )
  .guard(180, 320, { w: 48, h: 8, range: 90, speed: 1.6 })
  .zone("shrink", 180, 420)
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .rules({ descend: 20, timer: 240 })
  .build();

export const NUL: StoryEpisodeDef = {
  slug: "nul",
  title: "Nul",
  order: 21,
  tagline: "The hollow fleet in the wrecks, a copy who learned the shape, and an eye that closes.",
  background: BG,
  chapters: [
    {
      slug: "wreck-field-again",
      title: "Wreck field again",
      intro: "The sky where the Ember Fleet held the line, empty now: the fleet is on Aurel. Something else has taken up the position.",
      xp: 16100,
      level: WRECK_FIELD_AGAIN,
    },
    {
      slug: "the-hollow-fleet-waits",
      title: "The hollow fleet waits",
      intro: "Ships with no light in them, in formation, with Kal's face on every hull. They are not going anywhere. They are waiting for him.",
      xp: 16200,
      level: THE_HOLLOW_FLEET_WAITS,
    },
    {
      slug: "the-beacons-rhythm",
      title: "The beacon's rhythm",
      intro: "Across the wrecks, the pod's beacon plays Kal's heartbeat. Nul has been listening to it since the Grey Moon. He says it is the only thing he has ever owned.",
      xp: 16300,
      level: THE_BEACONS_RHYTHM,
    },
    {
      slug: "same-face",
      title: "Same face",
      intro: "Two geckos with one face, on one wall, and for once no dark between them. Nul knows which of them is the copy. He has stopped caring.",
      xp: 16400,
      level: SAME_FACE,
    },
    {
      slug: "what-nul-learned",
      title: "What Nul learned",
      intro: "He draws the Wall-walker himself, the stars first, the way Lys told it. He walked the whole road behind Kal. Hollow does not mean empty.",
      xp: 16500,
      level: WHAT_NUL_LEARNED,
    },
    {
      slug: "wardens-turn",
      title: "Wardens turn",
      intro: "Nul's wardens turn on their own fleet. They were grown to obey the face. They have never had to choose which one.",
      xp: 16600,
      level: WARDENS_TURN,
    },
    {
      slug: "the-eye-turns",
      title: "The eye turns",
      intro: "The Hush notices its eye hesitating. It turns in Nul's face to look at what he is doing, and for the first time Nul looks back.",
      xp: 16700,
      level: THE_EYE_TURNS,
    },
    {
      slug: "nuls-wall",
      title: "Nul's wall",
      intro: "He builds one, the way Kal would have. It is a good wall. Kal breaks it anyway, because that is what the two of them are for.",
      xp: 16800,
      level: NULS_WALL,
    },
    {
      slug: "the-eye-closes",
      title: "The eye closes",
      intro: "Nul shuts the eye. The Hush goes blind in the wrecks. It has never been refused anything either.",
      xp: 16900,
      level: THE_EYE_CLOSES,
    },
    {
      slug: "let-them-pass",
      title: "Let them pass",
      intro: "The hollow fleet parts. The seed-ship and everything behind it go through. Kal does not stay to watch what the dark does to its eye. He will regret that.",
      xp: 17000,
      level: LET_THEM_PASS,
    },
  ],
};
