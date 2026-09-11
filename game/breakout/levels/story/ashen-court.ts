/**
 * Episode 6 — Ashen Court.
 *
 * The pearl points at a star that has burned out. In the ash around it live
 * the Cindermoths, who hoard what light is left, and their queen, the Candle,
 * who sits in a hall lit by one flame. The Court remembers the geckos — they
 * paid for passage in light. Kal has only his glow, and it is not for sale.
 * The Candle's answer is a cage, then wardens, then a duel: one wall between
 * them. It falls, her hoard spills back into the ash, and she keeps her word.
 *
 * Mechanics: the dark episode — fog, mirrors and invert are the Court's
 * weapons; steel bars for the cage; two guards for the wardens; fans and
 * rotors for the ash storm; a pocketed black hole and the descend rule for
 * the duel; regen embers under an order rule; a timed steel tunnel out.
 *
 * Shapes: a dead star, a moth, a candle, a hive, a cage, two wardens, a
 * storm, the Candle's face, a hall of embers, a tunnel.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/ashen-court.jpg";

// 51 — Cinder ---------------------------------------------------------------------
// A burned-out star: a hard violet core, a crust of glass, ash falling below.
// A fog bank hides the crust.
const CINDER = createLevel({ id: "ashen-court-01", name: "Cinder", author: AUTHOR, ballSpeed: 384 })
  .background(BG, { dim: 0.58 })
  .brickRows(
    wall(
      [
        "....bbb....",
        "..bbVVVbb..",
        ".bVVVVVVVb.",
        "..bbVVVbb..",
        "....bbb....",
        "...........",
        ".b.b.b.b.b.",
      ],
      { b: glass("blue"), V: hard("violet") },
      TOP,
    ),
  )
  .zone("fog", 180, 340, 22)
  .bonus("slow", 60, 430)
  .bonus("fast2", 300, 430)
  .build();

// 52 — Moth wings -----------------------------------------------------------------
// A moth: hard body, wings of violet glass dusted with ghosts. A mirror flips
// the approach.
const MOTH_WINGS = createLevel({ id: "ashen-court-02", name: "Moth wings", author: AUTHOR, ballSpeed: 386 })
  .background(BG, { dim: 0.58 })
  .brickRows(
    wall(
      [
        "vv.......vv",
        "vovv.V.vvov",
        "vvvvv.V.vvv",
        ".vvvv.V.vvv",
        "..vov.V.vov",
        "...vv.V.vv.",
        "....v.V.v..",
      ],
      { v: glass("violet"), V: hard("violet"), o: piece("ghost", "amber") },
      TOP,
    ),
  )
  .zone("mirror", 180, 340)
  .bonus("slow", 60, 430)
  .bonus("fast2", 300, 430)
  .build();

// 53 — The Candle -----------------------------------------------------------------
// A candle: a steel holder, a hard wax column, an explosive flame. A magnet
// in the wick pulls the ball to the light.
const THE_CANDLE = createLevel({ id: "ashen-court-03", name: "The Candle", author: AUTHOR, ballSpeed: 388 })
  .background(BG, { dim: 0.58 })
  .brickRows(
    wall(
      [
        ".....*.....",
        "....a*a....",
        ".....m.....",
        "....AAA....",
        "....AAA....",
        "....AAA....",
        "....AAA....",
        "..#######..",
        ".aaaaaaaaa.",
      ],
      { "*": piece("explosive", "amber"), a: glass("amber"), m: piece("magnet", "amber"), A: hard("amber"), "#": steel("violet") },
      TOP,
    ),
  )
  .bonus("slow", 60, 340)
  .bonus("fast2", 300, 340)
  .zone("grow", 180, 440)
  .build();

// 54 — The hive -------------------------------------------------------------------
// A honeycomb of locks with hard walls, three keys hidden in the comb's edges.
const THE_HIVE = createLevel({ id: "ashen-court-04", name: "The hive", author: AUTHOR, ballSpeed: 390 })
  .background(BG, { dim: 0.58 })
  .brickRows(
    wall(
      [
        "k.AAAAAAA.k",
        ".aKaKaKaKa.",
        "aKaKaKaKaKa",
        ".aKaKaKaKa.",
        "..AAAAAAA..",
        "...........",
        ".....k.....",
      ],
      { k: piece("key", "amber"), A: hard("amber"), a: glass("amber"), K: piece("lock", "violet") },
      TOP,
    ),
  )
  .zone("sticky", 180, 340)
  .bonus("fast2", 60, 440)
  .bonus("slow", 300, 440)
  .build();

// 55 — Cage -----------------------------------------------------------------------
// Steel bars with glass between them; the ball threads the gaps. Invert turns
// the paddle the wrong way, ice makes it slide.
const CAGE = createLevel({ id: "ashen-court-05", name: "Cage", author: AUTHOR, ballSpeed: 392 })
  .background(BG, { dim: 0.58 })
  .brickRows(
    wall(
      [
        "###########",
        "#vvv#vvv#v#",
        "#vVv#vVv#V#",
        "#vvv#vvv#v#",
        "#...#...#.#",
        "#...#...#.#",
      ],
      { "#": steel("blue"), v: glass("violet"), V: hard("violet") },
      TOP,
    ),
  )
  .zone("invert", 180, 340)
  .zone("ice", 60, 430)
  .bonus("slow", 300, 430)
  .build();

// 56 — The wardens ----------------------------------------------------------------
// Two moth wardens with rotor wings and hard bodies; two guards sweep below
// them at different heights. ×3 between the guards.
const THE_WARDENS = createLevel({ id: "ashen-court-06", name: "The wardens", author: AUTHOR, ballSpeed: 394 })
  .background(BG, { dim: 0.58 })
  .brickRows(
    wall(
      [
        "x.V.....V.x",
        "xxVVV.VVVxx",
        "x.VaV.VaV.x",
        "..VVV.VVV..",
        "...v...v...",
      ],
      { x: piece("rotor", "amber"), V: hard("violet"), v: glass("violet"), a: glass("amber") },
      TOP,
    ),
  )
  .guard(104, 300, { w: 48, h: 8, range: 60, speed: 1.5 })
  .guard(256, 360, { w: 48, h: 8, range: 60, speed: 1.7 })
  .bonus("fast3", 180, 420)
  .bonus("slow", 60, 460)
  .zone("shrink", 300, 460)
  .build();

// 57 — Ash storm ------------------------------------------------------------------
// A swirl of ash: rotors in a ring, ghosts drifting, fans from both sides, fog
// low, shrink in the eye of it.
const ASH_STORM = createLevel({ id: "ashen-court-07", name: "Ash storm", author: AUTHOR, ballSpeed: 396 })
  .background(BG, { dim: 0.58 })
  .brickRows(
    wall(
      [
        "...x...x...",
        ".oVVVoVVVo.",
        "x.V.o.o.V.x",
        ".oVVVoVVVo.",
        "...x...x...",
      ],
      { x: piece("rotor", "amber"), o: piece("ghost", "violet"), V: hard("violet") },
      TOP,
    ),
  )
  .fan(12, 300, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 300, -1, { reach: 120, spread: 36, force: 2.2 })
  .zone("fog", 180, 380, 22)
  .zone("grow", 60, 450)
  .bonus("slow", 300, 450)
  .build();

// 58 — The duel -------------------------------------------------------------------
// The Candle's face: explosive eyes, a mouth that is a black hole in a steel
// throat, a hard crown. The wall descends every 22 hits. Five lives.
const THE_DUEL = createLevel({ id: "ashen-court-08", name: "The duel", author: AUTHOR, ballSpeed: 398, lives: 5 })
  .background(BG, { dim: 0.58 })
  .brickRows(
    wall(
      [
        "a.a.aaa.a.a",
        "aaaaaaaaaaa",
        ".a*a.#.a*a.",
        ".aaa#.#aaa.",
        "..aa#.#aa..",
        "...aaaaa...",
      ],
      { a: glass("amber"), "*": piece("explosive", "pink"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 160)
  .bonus("slow", 60, 340)
  .bonus("fast2", 300, 340)
  .zone("grow", 180, 440)
  .rules({ descend: 22 })
  .build();

// 59 — Embers ---------------------------------------------------------------------
// The hall's fires lit again: regen embers, a hard hearth with two flues, the
// pink hoard on top has to fall first. A trampoline flings the ball back up.
const EMBERS = createLevel({ id: "ashen-court-09", name: "Embers", author: AUTHOR, ballSpeed: 400 })
  .background(BG, { dim: 0.58 })
  .brickRows(
    wall(
      [
        "..ppppppp..",
        ".pPPPPPPPp.",
        "...........",
        "r.r.r.r.r.r",
        "aAa.AaA.aAa",
        "AaA.aAa.AaA",
      ],
      { p: glass("pink"), P: hard("pink"), r: piece("regen", "amber"), a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .trampoline(180, 470, 100)
  .bonus("fast2", 60, 340)
  .bonus("slow", 300, 340)
  .zone("mirror", 180, 380)
  .rules({ order: "pink" })
  .build();

// 60 — The way out ----------------------------------------------------------------
// A tunnel through the ash: steel walls, ghosts drifting in the throat, two
// hard floors to break, a guard at the mouth, a portal into the tunnel's end,
// ice and invert where the wind turns, four minutes.
const THE_WAY_OUT = createLevel({ id: "ashen-court-10", name: "The way out", author: AUTHOR, ballSpeed: 402 })
  .background(BG, { dim: 0.58 })
  .brickRows(
    wall(
      [
        "cccc...cccc",
        "###c...c###",
        "###cc.cc###",
        "###ccccc###",
        "###ooooo###",
        "..CCCCCCC..",
        ".CCCCCCCCC.",
      ],
      { c: glass("cyan"), C: hard("cyan"), o: piece("ghost", "cyan"), "#": steel("blue") },
      TOP,
    ),
  )
  .guard(180, 340, { w: 48, h: 8, range: 90, speed: 1.6 })
  .portal(60, 430, 180, 64)
  .zone("ice", 300, 430)
  .zone("invert", 180, 460)
  .rules({ timer: 240 })
  .build();

export const ASHEN_COURT: StoryEpisodeDef = {
  slug: "ashen-court",
  title: "Ashen Court",
  order: 6,
  tagline: "A dead star, a court of moths, and a price for the way on.",
  background: BG,
  chapters: [
    {
      slug: "cinder",
      title: "Cinder",
      intro: "The pearl points at a star that has burned out. Around it, ash the size of continents. Kal lands in the dark.",
      xp: 2000,
      level: CINDER,
    },
    {
      slug: "moth-wings",
      title: "Moth wings",
      intro: "Wings wider than the Lantern fold around him. The Cindermoths hoard what light is left, and they have seen his.",
      xp: 2050,
      level: MOTH_WINGS,
    },
    {
      slug: "the-candle",
      title: "The Candle",
      intro: "Their queen, the Candle, sits in a hall lit by one flame. She asks what he wants. The way to his people, he says.",
      xp: 2100,
      level: THE_CANDLE,
    },
    {
      slug: "the-hive",
      title: "The hive",
      intro: "The Court remembers the geckos. They paid for passage in light. Kal has only his glow, and it is not for sale.",
      xp: 2150,
      level: THE_HIVE,
    },
    {
      slug: "cage",
      title: "Cage",
      intro: "The Candle's answer is a cage. Kal has been inside a shell before. Shells break.",
      xp: 2200,
      level: CAGE,
    },
    {
      slug: "the-wardens",
      title: "The wardens",
      intro: "Wardens with wings of ash beat him back. Kal learns to hit what will not stay still.",
      xp: 2250,
      level: THE_WARDENS,
    },
    {
      slug: "ash-storm",
      title: "Ash storm",
      intro: "The Court's wind carries the ash. Kal cannot see the wall, so he listens for it.",
      xp: 2300,
      level: ASH_STORM,
    },
    {
      slug: "the-duel",
      title: "The duel",
      intro: "The Candle will trade the route for a duel. One wall between them. If it falls, he goes on.",
      xp: 2350,
      level: THE_DUEL,
    },
    {
      slug: "embers",
      title: "Embers",
      intro: "The wall falls, and the Candle's hoard with it. Light pours back into the ash. The Court kneels — not to Kal, to the light.",
      xp: 2400,
      level: EMBERS,
    },
    {
      slug: "the-way-out",
      title: "The way out",
      intro: "The Candle keeps her word. The route: a battlefield, then a dawn. Your people are still fighting, she says.",
      xp: 2450,
      level: THE_WAY_OUT,
    },
  ],
};
