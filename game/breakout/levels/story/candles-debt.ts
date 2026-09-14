/**
 * Episode 20 — The Candle's Debt.
 *
 * The Ashen Court, where the Cindermoths hoard what light is left under their
 * queen. Kal broke her wall once and her hoard spilled back into the ash, and
 * she kept her word; she considers the account open. The moths know the one
 * thing nobody else on the road knows: how to live where there is almost no
 * light at all — at the edge of the Hush, where it has already fed. The Candle
 * has mapped that edge for a hundred years. The Hush is not one thing, she
 * says. It is a swarm with one heart, and the heart is where the light goes.
 * She pays her debt in the only coin she has: she comes herself, and brings
 * the Court.
 *
 * Mechanics: a burned-out star in fog, a hall of regen embers behind a mirror,
 * a scale under an order rule with sticky, a moth fleet with ghost wings and
 * anti-gravity, two wardens with rotor wings and two guards, the swarm drawn
 * around a magnet heart, an ember storm with rotors, fans, ×3 and invert, the
 * heart as a black hole in a steel throat (five lives), a candle with an
 * explosive flame and a trampoline, and the way out through a steel tunnel
 * with a guard, a portal, ice and four minutes.
 *
 * Shapes: a dead star, a hall of fires, a scale, moths, two wardens, a swarm,
 * a storm, a heart, a candle, a tunnel.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/candles-debt.jpg";

// 191 — Ash again -------------------------------------------------------------------
// The burned-out star, hard at the core, ash in the air. Fog under it.
const ASH_AGAIN = createLevel({ id: "candles-debt-01", name: "Ash again", author: AUTHOR, ballSpeed: 452 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...aaaaa...",
        "..aAAAAAa..",
        ".aAAaaaAAa.",
        ".aAaaaaaAa.",
        ".aAAaaaAAa.",
        "..aAAAAAa..",
        "...aaaaa...",
      ],
      { a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .zone("fog", 180, 350, 22)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 192 — The Court lit ---------------------------------------------------------------
// The hall of fires, still burning since the hoard spilled: steel braziers,
// regen embers, amber flames. A mirror under the hall.
const THE_COURT_LIT = createLevel({ id: "candles-debt-02", name: "The Court lit", author: AUTHOR, ballSpeed: 453 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "#.#.#.#.#.#",
        "r.r.r.r.r.r",
        "a.a.a.a.a.a",
        "...........",
        ".#.#.#.#.#.",
        ".r.r.r.r.r.",
        ".a.a.a.a.a.",
      ],
      { "#": steel("amber"), r: piece("regen", "amber"), a: glass("amber") },
      TOP,
    ),
  )
  .zone("mirror", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 193 — The debt --------------------------------------------------------------------
// A scale with a steel beam: what Kal gave her in pink, what she owes in
// amber. Pink first. Sticky under the beam.
const THE_DEBT = createLevel({ id: "candles-debt-03", name: "The debt", author: AUTHOR, ballSpeed: 454 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "###########",
        ".p...#...a.",
        ".p...#...a.",
        "ppp..#..aaa",
        "pPp..#..aAa",
        "ppp.....aaa",
      ],
      { "#": steel("amber"), p: glass("pink"), P: hard("pink"), a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .rules({ order: "pink" })
  .zone("sticky", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 194 — Moth fleet ------------------------------------------------------------------
// Moths with ghosts in their wings and amber bodies, a whole flight of them.
// Anti-gravity under the wings.
const MOTH_FLEET = createLevel({ id: "candles-debt-04", name: "Moth fleet", author: AUTHOR, ballSpeed: 455 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "oo.a.a.a.oo",
        "ooo.a.a.ooo",
        ".oo..a..oo.",
        "...........",
        "....oo.oo..",
        "...ooo.ooo.",
        "....o.a.o..",
      ],
      { o: piece("ghost", "amber"), a: glass("amber") },
      TOP,
    ),
  )
  .zone("antigrav", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 195 — Wardens at his side ---------------------------------------------------------
// Two moth wardens with rotor wings, flying with him this time. Two guards
// under them, ×3 between.
const WARDENS_AT_HIS_SIDE = createLevel({ id: "candles-debt-05", name: "Wardens at his side", author: AUTHOR, ballSpeed: 456 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".xAx...xAx.",
        "aAAAa.aAAAa",
        ".aaa...aaa.",
        "..a.....a..",
      ],
      { x: piece("rotor", "amber"), A: hard("amber"), a: glass("amber") },
      TOP,
    ),
  )
  .guard(104, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .guard(256, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .bonus("fast3", 180, 420)
  .bonus("slow", 60, 460)
  .zone("grow", 300, 460)
  .build();

// 196 — The Candle's map ------------------------------------------------------------
// The Hush as the Candle has mapped it: a swarm of ghosts around one heart of
// violet with a magnet in it. Slow under the heart.
const THE_CANDLES_MAP = createLevel({ id: "candles-debt-06", name: "The Candle's map", author: AUTHOR, ballSpeed: 457 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..o...o.o..",
        ".o.o.....o.",
        "o...vvv...o",
        "..ovvmvvo..",
        "o...vvv...o",
        ".o.o...o...",
        "..o...o..o.",
      ],
      { o: piece("ghost", "violet"), v: glass("violet"), m: piece("magnet", "violet") },
      TOP,
    ),
  )
  .bonus("slow", 180, 350)
  .bonus("fast2", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 197 — Ember storm -----------------------------------------------------------------
// Embers and rotors thrown across the sky. Two fans, ×3 and invert under the
// storm.
const EMBER_STORM = createLevel({ id: "candles-debt-07", name: "Ember storm", author: AUTHOR, ballSpeed: 458 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "a..x..a..x.",
        ".x..a..x..a",
        "a..a..x..a.",
        ".a..x..a..x",
        "x..a..a..a.",
      ],
      { a: glass("amber"), x: piece("rotor", "amber") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .bonus("fast3", 180, 380)
  .zone("invert", 180, 440)
  .bonus("slow", 60, 460)
  .build();

// 198 — The heart -------------------------------------------------------------------
// The swarm's one heart, in amber: a black hole in a steel throat above an
// open chamber. A mirror under it, five lives.
const THE_HEART = createLevel({ id: "candles-debt-08", name: "The heart", author: AUTHOR, ballSpeed: 459, lives: 5 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".aaa...aaa.",
        "aAaaa.aaaAa",
        "aaaAA#AAaaa",
        ".aa.#.#.aa.",
        ".aa.#.#.aa.",
        "..a.....a..",
        "...aaaaa...",
        "....aaa....",
      ],
      { a: glass("amber"), A: hard("amber"), "#": steel("amber") },
      TOP,
    ),
  )
  .blackhole(180, 160)
  .zone("mirror", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 199 — Wax and wick ----------------------------------------------------------------
// The Candle herself: an explosive flame, a magnet wick, a steel holder and a
// body of pink wax. A trampoline under her.
const WAX_AND_WICK = createLevel({ id: "candles-debt-09", name: "Wax and wick", author: AUTHOR, ballSpeed: 460 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....aea....",
        "...aeAea...",
        "....ama....",
        "....###....",
        "...#ppp#...",
        "...#ppp#...",
        "...#ppp#...",
        "...#ppp#...",
      ],
      { a: glass("amber"), e: piece("explosive", "amber"), A: hard("amber"), m: piece("magnet", "amber"), "#": steel("amber"), p: glass("pink") },
      TOP,
    ),
  )
  .trampoline(130, 470, 100)
  .bonus("slow", 60, 420)
  .bonus("fast2", 300, 420)
  .build();

// 200 — Leaving the ash -------------------------------------------------------------
// The tunnel out of the Court, steel walls and ghosts in the dark, open at the
// floor. A guard under it, a portal from the floor into the tunnel, ice; four
// minutes.
const LEAVING_THE_ASH = createLevel({ id: "candles-debt-10", name: "Leaving the ash", author: AUTHOR, ballSpeed: 461 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "#####.#####",
        "#aaa...aaa#",
        "#a.o...o.a#",
        "#a.......a#",
        "#aaa.o.aaa#",
        "####...####",
      ],
      { "#": steel("amber"), a: glass("amber"), o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .guard(180, 300, { w: 48, h: 8, range: 90, speed: 1.6 })
  .portal(60, 430, 180, 152)
  .zone("ice", 300, 430)
  .bonus("slow", 180, 460)
  .rules({ timer: 240 })
  .build();

export const CANDLES_DEBT: StoryEpisodeDef = {
  slug: "candles-debt",
  title: "The Candle's Debt",
  order: 20,
  tagline: "A queen who keeps accounts, a map of the dark's edge, and a court that comes to pay.",
  background: BG,
  chapters: [
    {
      slug: "ash-again",
      title: "Ash again",
      intro: "The dead star and its continents of ash. The Cindermoths saw the seed-ship's light before it landed, the way they saw his the first time.",
      xp: 15100,
      level: ASH_AGAIN,
    },
    {
      slug: "the-court-lit",
      title: "The Court lit",
      intro: "The hall of fires has not gone out since the hoard spilled. The Court does not kneel this time. It stands, which for moths is harder.",
      xp: 15200,
      level: THE_COURT_LIT,
    },
    {
      slug: "the-debt",
      title: "The debt",
      intro: "The Candle keeps accounts. Kal gave the Court its light back and asked for nothing. She has considered that a debt for a long time.",
      xp: 15300,
      level: THE_DEBT,
    },
    {
      slug: "moth-fleet",
      title: "Moth fleet",
      intro: "The moths know the one thing nobody else on the road knows: how to live where there is almost no light at all. At the edge of the Hush.",
      xp: 15400,
      level: MOTH_FLEET,
    },
    {
      slug: "wardens-at-his-side",
      title: "Wardens at his side",
      intro: "The wardens who beat him back from her wall fly at his side now. They still do not stay still. Kal has stopped minding.",
      xp: 15500,
      level: WARDENS_AT_HIS_SIDE,
    },
    {
      slug: "the-candles-map",
      title: "The Candle's map",
      intro: "She has mapped the edge of the dark for a hundred years. The Hush is not one thing, she says. It is a swarm with one heart, and the heart is where the light goes.",
      xp: 15600,
      level: THE_CANDLES_MAP,
    },
    {
      slug: "ember-storm",
      title: "Ember storm",
      intro: "The Court lifts off in a storm of its own embers. Kal cannot see the wall. He has listened for one here before.",
      xp: 15700,
      level: EMBER_STORM,
    },
    {
      slug: "the-heart",
      title: "The heart",
      intro: "On her map, the heart of the swarm. Lys stares at it a long time. The Gleaner was grown with a heart, she says. Everything the Sowers grow is.",
      xp: 15800,
      level: THE_HEART,
    },
    {
      slug: "wax-and-wick",
      title: "Wax and wick",
      intro: "The Candle pays her debt in the only coin she has. She comes herself.",
      xp: 15900,
      level: WAX_AND_WICK,
    },
    {
      slug: "leaving-the-ash",
      title: "Leaving the ash",
      intro: "Out through the tunnel a second time, with a court of moths behind the seed-ship. The route, she says: the wrecks. Something is waiting in them.",
      xp: 16000,
      level: LEAVING_THE_ASH,
    },
  ],
};
