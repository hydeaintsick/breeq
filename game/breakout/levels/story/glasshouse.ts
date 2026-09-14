/**
 * Episode 11 — Glasshouse.
 *
 * The Curator's tower rises out of the canopy: a spire of amber glass where
 * Vireo's keeper has waited a generation for his experiment to come home. He
 * is polite. He never raises his voice. He offers Kal the one thing the loan
 * never promised — a place — in exchange for standing still. The vats open
 * instead. Most of the copies do not wake. One does: Nul, hollow where Kal is
 * lit, and the Hush, which could never see Kal, looks out of his own face.
 * Kal takes the Sowers' seed-map — the way to Meridian, where the loan was
 * written and can be unwritten — and brings the glasshouse down behind him.
 *
 * Mechanics: a spire of amber on bumpers; the Curator with magnet eyes and a
 * ghost robe behind a mirror; the offer as a balance of keys and locks on
 * rails; two wardens (guards) with rotor wings and ×3; the hatching as
 * explosive chains with regen and a split; Nul — a black hole in a steel
 * throat, fog, five lives; the shatter with descend, ice and explosives; the
 * seed-map under an order rule with a decoy portal; the fall through floors
 * with gravity, portals, rotors and shrink; and the tower as a bomb: steel
 * hull, explosive core, a guard, a narrow paddle, four minutes.
 *
 * Shapes: a spire, a tall thin figure, a balance, two wardens, opening vats,
 * a hollow gecko, breaking panes, a constellation, floors, the tower.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/glasshouse.jpg";

// 101 — The spire -----------------------------------------------------------------
// A spire of amber glass with a steel spine, widening toward the base. Bumpers
// in the canopy around it.
const THE_SPIRE = createLevel({ id: "glasshouse-01", name: "The spire", author: AUTHOR, ballSpeed: 408 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        ".....A.....",
        "....a#a....",
        "....a#a....",
        "...aa#aa...",
        "...aA#Aa...",
        "..aaa#aaa..",
        "..aAa#aAa..",
        ".aaaa#aaaa.",
      ],
      { A: hard("amber"), a: glass("amber"), "#": steel("amber") },
      TOP,
    ),
  )
  .bumper(90, 350)
  .bumper(270, 350)
  .bonus("slow", 180, 450)
  .build();

// 102 — The Curator ---------------------------------------------------------------
// A tall thin figure: a hard violet head with magnet eyes, a robe of ghosts
// that is never quite there. A mirror between him and the paddle.
const THE_CURATOR = createLevel({ id: "glasshouse-02", name: "The Curator", author: AUTHOR, ballSpeed: 410 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "....VVV....",
        "....mVm....",
        "....VVV....",
        "...ovvvo...",
        "..oovvvoo..",
        "..ovvvvvo..",
        ".oovvvvvoo.",
        ".ovvvvvvvo.",
      ],
      { V: hard("violet"), m: piece("magnet", "violet"), v: glass("violet"), o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .zone("mirror", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 103 — The offer -----------------------------------------------------------------
// A balance: two pans hanging from a steel beam. Keys in one pan, locks in
// the other. Two rails under the pans; the ball rides between them.
const THE_OFFER = createLevel({ id: "glasshouse-03", name: "The offer", author: AUTHOR, ballSpeed: 412 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "###########",
        ".a...#...a.",
        ".a...#...a.",
        "aaa..#..aaa",
        "kkk..#..XXX",
        "AAA.....AAA",
      ],
      { "#": steel("amber"), a: glass("amber"), A: hard("amber"), k: piece("key", "cyan"), X: piece("lock", "cyan") },
      TOP,
    ),
  )
  .rail(40, 330, 90)
  .rail(230, 330, 90)
  .bonus("slow", 180, 420)
  .bonus("fast2", 180, 470)
  .build();

// 104 — Wardens of glass ----------------------------------------------------------
// Two wardens with rotor wings, hard shoulders and a glass body. Two guards
// sweep under them; ×3 where they cross.
const WARDENS_OF_GLASS = createLevel({ id: "glasshouse-04", name: "Wardens of glass", author: AUTHOR, ballSpeed: 414 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "R.A.....A.R",
        ".RAA...AAR.",
        "..aa...aa..",
        "..aa...aa..",
        "R.aa...aa.R",
        ".R.a...a.R.",
      ],
      { R: piece("rotor", "amber"), A: hard("amber"), a: glass("amber") },
      TOP,
    ),
  )
  .guard(104, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .guard(256, 320, { w: 48, h: 8, range: 60, speed: 1.6 })
  .bonus("fast3", 180, 400)
  .bonus("slow", 60, 460)
  .zone("grow", 300, 460)
  .build();

// 105 — The hatching --------------------------------------------------------------
// The vats crack open: explosive seams down each vessel, regen at the rims,
// a split so two balls take them together.
const THE_HATCHING = createLevel({ id: "glasshouse-05", name: "The hatching", author: AUTHOR, ballSpeed: 416 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "rPr.rPr.rPr",
        "pep.pep.pep",
        "p.p.p.p.p.p",
        "pPp.pPp.pPp",
        "p.p.p.p.p.p",
        "PPP.PPP.PPP",
      ],
      { r: piece("regen", "pink"), p: glass("pink"), e: piece("explosive", "pink"), P: hard("pink") },
      TOP,
    ),
  )
  .zone("split", 180, 330)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 106 — Nul -----------------------------------------------------------------------
// The hollow one: a gecko's shape in violet, and where Kal is lit, a black
// hole in a steel throat above an open chamber. Fog over the approach.
// Five lives.
const NUL = createLevel({ id: "glasshouse-06", name: "Nul", author: AUTHOR, ballSpeed: 418, lives: 5 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "...vvvvv...",
        ".vvVV#VVvv.",
        "vV..#.#..Vv",
        "v...#.#...v",
        "v.........v",
        ".vvvVVVvvv.",
        "..vv...vv..",
        ".vv.....vv.",
      ],
      { v: glass("violet"), V: hard("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .zone("fog", 180, 360, 22)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 107 — Shatter -------------------------------------------------------------------
// The glasshouse breaking: panes of amber with explosive stress points, the
// whole wall coming down (descend), ice where the shards fall.
const SHATTER = createLevel({ id: "glasshouse-07", name: "Shatter", author: AUTHOR, ballSpeed: 420 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "aaa.aaaa.aa",
        "aea.aaea.aa",
        "aaa.aaaa.ea",
        "...........",
        "aa.aaa.aaaa",
        "ae.aea.aaea",
        "aa.aaa.aaaa",
      ],
      { a: glass("amber"), e: piece("explosive", "amber") },
      TOP,
    ),
  )
  .zone("ice", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .rules({ descend: 20 })
  .build();

// 108 — The seed-map --------------------------------------------------------------
// The Sowers' chart: hard lime seeds joined by cyan lines. Cyan first — the
// lines before the seeds they join. A portal and a decoy beside it.
const THE_SEED_MAP = createLevel({ id: "glasshouse-08", name: "The seed-map", author: AUTHOR, ballSpeed: 422 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "L...c.....L",
        ".c..c....c.",
        "..c.L...c..",
        "...ccccL...",
        "....L..c...",
        "...c..cLc..",
        "..L....c...",
      ],
      { L: hard("lime"), c: glass("cyan") },
      TOP,
    ),
  )
  .rules({ order: "cyan" })
  .portal(60, 430, 180, 64)
  .zone("fakePortal", 300, 430)
  .bonus("slow", 180, 350)
  .build();

// 109 — The fall ------------------------------------------------------------------
// Kal drops through the floors of the tower: bands of amber with gaps,
// rotors at the stairwells, gravity, a portal from the bottom back to the top,
// shrink near the ground.
const THE_FALL = createLevel({ id: "glasshouse-09", name: "The fall", author: AUTHOR, ballSpeed: 424 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "aaaaR..aaaa",
        "...........",
        "aaa..Raaaaa",
        "...........",
        "aaaaaaR.aaa",
        "...........",
        "aa.Raaaaaaa",
      ],
      { a: glass("amber"), R: piece("rotor", "amber") },
      TOP,
    ),
  )
  .zone("gravity", 180, 330)
  .portal(300, 460, 180, 64)
  .zone("shrink", 60, 460)
  .bonus("slow", 180, 400)
  .build();

// 110 — Out of the glass ----------------------------------------------------------
// The tower as a bomb: a steel hull around an explosive core, hard amber
// panes, a guard on the roof. A narrow paddle, four minutes.
const OUT_OF_THE_GLASS = createLevel({ id: "glasshouse-10", name: "Out of the glass", author: AUTHOR, ballSpeed: 426, paddleWidth: 68 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "....aAa....",
        "...a###a...",
        "..aa#e#aa..",
        "..aA#e#Aa..",
        "..aa#e#aa..",
        ".aaa#.#aaa.",
        ".aAa...aAa.",
        "aaaaa.aaaaa",
      ],
      { a: glass("amber"), A: hard("amber"), "#": steel("amber"), e: piece("explosive", "amber") },
      TOP,
    ),
  )
  .guard(180, 300, { w: 48, h: 8, range: 90, speed: 1.6 })
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .rules({ timer: 240 })
  .build();

export const GLASSHOUSE: StoryEpisodeDef = {
  slug: "glasshouse",
  title: "Glasshouse",
  order: 11,
  tagline: "The Curator's tower, a polite offer, and a copy that wakes up hollow.",
  background: BG,
  chapters: [
    {
      slug: "the-spire",
      title: "The spire",
      intro: "Above the canopy, a tower of amber glass. Someone has been watching the jungle from it for a generation.",
      xp: 6100,
      level: THE_SPIRE,
    },
    {
      slug: "the-curator",
      title: "The Curator",
      intro: "He is tall and thin and polite, and he never raises his voice. He has waited a long time for his experiment to come home.",
      xp: 6200,
      level: THE_CURATOR,
    },
    {
      slug: "the-offer",
      title: "The offer",
      intro: "A place, he says. Not a loan. All Kal has to do is stand still. Kal has never stood still in his life.",
      xp: 6300,
      level: THE_OFFER,
    },
    {
      slug: "wardens-of-glass",
      title: "Wardens of glass",
      intro: "The Curator's wardens have wings that spin and eyes that do not blink. Kal hits what will not stay still.",
      xp: 6400,
      level: WARDENS_OF_GLASS,
    },
    {
      slug: "the-hatching",
      title: "The hatching",
      intro: "The vats open early. Most of the copies do not wake. The glass runs with something warm, in his rhythm.",
      xp: 6500,
      level: THE_HATCHING,
    },
    {
      slug: "nul",
      title: "Nul",
      intro: "One wakes. It has Kal's face and none of his light — and the Hush, which could never see Kal, looks out of its eyes.",
      xp: 6600,
      level: NUL,
    },
    {
      slug: "shatter",
      title: "Shatter",
      intro: "The Curator finally raises his voice. The glasshouse answers: every pane at once.",
      xp: 6700,
      level: SHATTER,
    },
    {
      slug: "the-seed-map",
      title: "The seed-map",
      intro: "In the wreck of the study, the Sowers' chart. Meridian, where the loan was written. Where it can be unwritten.",
      xp: 6800,
      level: THE_SEED_MAP,
    },
    {
      slug: "the-fall",
      title: "The fall",
      intro: "Floor after floor gives way. Kal has fallen before — a whole sky, once. He knows how to land.",
      xp: 6900,
      level: THE_FALL,
    },
    {
      slug: "out-of-the-glass",
      title: "Out of the glass",
      intro: "The green ship still has a spark. Behind him the tower comes down, and something hollow climbs out of it.",
      xp: 7000,
      level: OUT_OF_THE_GLASS,
    },
  ],
};
