/**
 * Episode 10 — The Vivarium.
 *
 * Under Vireo's jungle, a laboratory in cold cyan light. Tanks hold things
 * that are only half there. An old keeper with a grey tail, Marrow, opens the
 * cage — not to free Kal, but because he has waited a long time to tell
 * someone. The Sowers of Meridian grow living things between stars and lend
 * them out; Vireo was their vivarium. A generation ago, when Vitra's suns
 * first flickered, they lent the Vitrans one egg, grown here with one gift:
 * the Hush cannot see it. Kal was the experiment. The twelfth pod was the
 * Sowers' return cradle, launched in the panic of the Migration and lost. And
 * the Curator, Vireo's keeper who never left, has read the Ember Fleet's news
 * — a gecko the dark cannot swallow — and is growing copies in the vats.
 *
 * Mechanics: the lab's cold kit. Hard lamps on ice, ghosts in tanks under
 * anti-gravity, Marrow's key and a magnet, a ledger of keys and locks under
 * an order rule, sap pipes as rails with regen and fans, vats with explosive
 * cores in fog, copies that regen with a split and a mirror, lights out with
 * fog and invert, cages with guards, and Marrow's truth: a black hole in a
 * steel throat, five lives, four minutes.
 *
 * Shapes: ceiling lamps, three tanks, a gecko in profile, a ledger, pipes,
 * three vats, rows of copies, a dark room, cages, a seed in a shell.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/the-vivarium.jpg";

// 91 — Cold light -----------------------------------------------------------------
// Ceiling lamps: bars of cyan with hard ends, on a steel rail. Ice under them.
const COLD_LIGHT = createLevel({ id: "the-vivarium-01", name: "Cold light", author: AUTHOR, ballSpeed: 404 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "#####.#####",
        "Cccc...cccC",
        "...........",
        ".Cccc.cccC.",
        "...........",
        "..Ccc.ccC..",
        "...........",
        "....ccc....",
      ],
      { "#": steel("cyan"), c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .zone("ice", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 92 — Specimen tanks -------------------------------------------------------------
// Three cylinders of glass with ghosts inside: things that are only half there.
// Anti-gravity floats the ball up through them.
const SPECIMEN_TANKS = createLevel({ id: "the-vivarium-02", name: "Specimen tanks", author: AUTHOR, ballSpeed: 406 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "CCC.CCC.CCC",
        "c.c.c.c.c.c",
        "coc.coc.coc",
        "c.c.coc.c.c",
        "coc.c.c.coc",
        "c.c.c.c.c.c",
        "CCC.CCC.CCC",
      ],
      { C: hard("cyan"), c: glass("cyan"), o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .zone("antigrav", 180, 340)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 93 — Marrow ---------------------------------------------------------------------
// The old keeper in profile: a steel-grey head, a violet eye that pulls, a
// scarred tail, and the key he holds. The locks are the cage he opens.
const MARROW = createLevel({ id: "the-vivarium-03", name: "Marrow", author: AUTHOR, ballSpeed: 408 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "...vvvv....",
        "..vvmvvv...",
        "..vvvvvvv..",
        "...vvvvvvvv",
        "..X.vvv...v",
        "..X.......v",
        "..X.k....vv",
      ],
      { v: glass("violet"), m: piece("magnet", "violet"), X: piece("lock", "amber"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .zone("sticky", 180, 340)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 94 — The Tally's ledger ---------------------------------------------------------
// A grid of entries: cyan cells, locks in the column that says "returned",
// keys down the margin. Cyan first: read the ledger before opening it.
const THE_TALLYS_LEDGER = createLevel({ id: "the-vivarium-04", name: "The Tally's ledger", author: AUTHOR, ballSpeed: 410 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "k.ccc.ccc.X",
        "...........",
        "k.ccc.ccc.X",
        "...........",
        "k.ccc.ccc.X",
        "...........",
        "..lll.lll..",
      ],
      { k: piece("key", "amber"), c: glass("cyan"), X: piece("lock", "amber"), l: glass("lime") },
      TOP,
    ),
  )
  .rules({ order: "cyan" })
  .zone("mirror", 180, 340)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 95 — Sap lines ------------------------------------------------------------------
// Pipes carrying the jungle's sap into the lab: lime glass with regen joints,
// steel brackets, two rails to run them and fans that push along them.
const SAP_LINES = createLevel({ id: "the-vivarium-05", name: "Sap lines", author: AUTHOR, ballSpeed: 412 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "#lllrlllrl#",
        "l.........l",
        "l.#lrlll#.l",
        "r.l.....l.r",
        "l.l.....l.l",
        "l.#lllrl#.l",
        "#lllllllll#",
      ],
      { "#": steel("lime"), l: glass("lime"), r: piece("regen", "lime") },
      TOP,
    ),
  )
  .rail(60, 330, 80)
  .rail(220, 330, 80)
  .fan(12, 400, 1, { reach: 110, spread: 36, force: 2 })
  .fan(348, 400, -1, { reach: 110, spread: 36, force: 2 })
  .bonus("slow", 180, 460)
  .build();

// 96 — The vats -------------------------------------------------------------------
// Three tall vessels with something growing inside: hard walls, an explosive
// core each, gravity pulling the ball down into them, fog over the floor.
const THE_VATS = createLevel({ id: "the-vivarium-06", name: "The vats", author: AUTHOR, ballSpeed: 414 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "VVV.VVV.VVV",
        "v.v.v.v.v.v",
        "vev.vev.vev",
        "v.v.v.v.v.v",
        "vvv.vvv.vvv",
        "...........",
        "###.###.###",
      ],
      { V: hard("violet"), v: glass("violet"), e: piece("explosive", "pink"), "#": steel("violet") },
      TOP,
    ),
  )
  .zone("gravity", 180, 330)
  .zone("fog", 180, 420, 22)
  .bonus("slow", 60, 460)
  .zone("grow", 300, 460)
  .build();

// 97 — Copies ---------------------------------------------------------------------
// Rows of small geckos, each the same: hard heads, glass bodies, tails that
// keep coming back. A split so two balls work the rows; a mirror in between.
const COPIES = createLevel({ id: "the-vivarium-07", name: "Copies", author: AUTHOR, ballSpeed: 416 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "Pp.Pp.Pp.Pp",
        ".pr.pr.pr.p",
        "...........",
        "pP.pP.pP.pP",
        "rp.rp.rp.rp",
        "...........",
        "Pp.Pp.Pp.Pp",
        ".pr.pr.pr.p",
      ],
      { P: hard("pink"), p: glass("pink"), r: piece("regen", "pink") },
      TOP,
    ),
  )
  .zone("split", 180, 340)
  .zone("mirror", 180, 410)
  .bonus("slow", 60, 460)
  .zone("shrink", 300, 460)
  .build();

// 98 — Lights out -----------------------------------------------------------------
// Kal cuts the power. Ghosts flicker where the lamps were, fog over the floor,
// ice underfoot, and the controls inverted in the dark.
const LIGHTS_OUT = createLevel({ id: "the-vivarium-08", name: "Lights out", author: AUTHOR, ballSpeed: 418 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "#####.#####",
        "ooooo.ooooo",
        "...........",
        ".vvvv.vvvv.",
        "...........",
        "..ovv.vvo..",
        "...........",
        "....vvv....",
      ],
      { "#": steel("violet"), o: piece("ghost", "cyan"), v: glass("violet") },
      TOP,
    ),
  )
  .zone("fog", 180, 350, 22)
  .zone("ice", 60, 440)
  .zone("invert", 300, 440)
  .bonus("slow", 180, 470)
  .build();

// 99 — Freeing the Tally ----------------------------------------------------------
// The cages again, doors locked, the keys in the keeper's drawer at the
// bottom. Two guards patrol the corridor; grow on the far side.
const FREEING_THE_TALLY = createLevel({ id: "the-vivarium-09", name: "Freeing the Tally", author: AUTHOR, ballSpeed: 420 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "###.###.###",
        "#m#.#m#.#m#",
        "#v#.#v#.#v#",
        "#X#.#X#.#X#",
        "...........",
        "...........",
        "..k..k..k..",
      ],
      { "#": steel("violet"), m: piece("magnet", "pink"), v: glass("violet"), X: piece("lock", "amber"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .guard(104, 330, { w: 48, h: 8, range: 60, speed: 1.6 })
  .guard(256, 330, { w: 48, h: 8, range: 60, speed: 1.6 })
  .zone("grow", 300, 450)
  .bonus("slow", 60, 450)
  .build();

// 100 — Marrow's truth ------------------------------------------------------------
// A seed in a shell, drawn on the wall the way the Sowers draw it — and where
// the seed's heart should be, a black hole in a steel throat above an open
// chamber: what the Curator has been feeding. Five lives, four minutes.
const MARROWS_TRUTH = createLevel({ id: "the-vivarium-10", name: "Marrow's truth", author: AUTHOR, ballSpeed: 422, lives: 5 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "...lllll...",
        ".llLL#LLll.",
        "lL..#.#..Ll",
        "l...#.#...l",
        "lL.......Ll",
        ".llLLLLLll.",
        "...lllll...",
        "..c.....c..",
      ],
      { l: glass("lime"), L: hard("lime"), "#": steel("lime"), c: glass("cyan") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .zone("mirror", 180, 340)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .rules({ timer: 240 })
  .build();

export const THE_VIVARIUM: StoryEpisodeDef = {
  slug: "the-vivarium",
  title: "The Vivarium",
  order: 10,
  tagline: "Under the jungle, a laboratory — and the truth about the twelfth pod.",
  background: BG,
  chapters: [
    {
      slug: "cold-light",
      title: "Cold light",
      intro: "Under the jungle, a floor that hums. Lamps in a row, cold and even. Nothing here was grown by accident.",
      xp: 5100,
      level: COLD_LIGHT,
    },
    {
      slug: "specimen-tanks",
      title: "Specimen tanks",
      intro: "Cylinders of glass, and in them, things that are only half there. One of them has a tail.",
      xp: 5200,
      level: SPECIMEN_TANKS,
    },
    {
      slug: "marrow",
      title: "Marrow",
      intro: "An old gecko with a grey tail opens the cage. Not to free him. He has waited a long time to tell someone.",
      xp: 5300,
      level: MARROW,
    },
    {
      slug: "the-tallys-ledger",
      title: "The Tally's ledger",
      intro: "The Sowers grow living things and lend them out. Every loan is in the ledger. One line reads: Vitra. One egg. Not returned.",
      xp: 5400,
      level: THE_TALLYS_LEDGER,
    },
    {
      slug: "sap-lines",
      title: "Sap lines",
      intro: "The jungle feeds the lab through its roots. Vireo was never a world. It was the Sowers' vivarium, and the Curator kept it when they left.",
      xp: 5500,
      level: SAP_LINES,
    },
    {
      slug: "the-vats",
      title: "The vats",
      intro: "Three vessels, warm, in his rhythm. The Curator read the Ember Fleet's news: a gecko the dark cannot swallow. He is growing more.",
      xp: 5600,
      level: THE_VATS,
    },
    {
      slug: "copies",
      title: "Copies",
      intro: "Rows of them, small and still, with his face. Whatever made Kal invisible to the Hush, the copies do not have it.",
      xp: 5700,
      level: COPIES,
    },
    {
      slug: "lights-out",
      title: "Lights out",
      intro: "Kal cuts the power the only way he knows: wall by wall. In the dark, the lab is just another sky.",
      xp: 5800,
      level: LIGHTS_OUT,
    },
    {
      slug: "freeing-the-tally",
      title: "Freeing the Tally",
      intro: "Every cage opens the same way. The Tally pours out into the jungle, bright, from a dozen skies.",
      xp: 5900,
      level: FREEING_THE_TALLY,
    },
    {
      slug: "marrows-truth",
      title: "Marrow's truth",
      intro: "The twelfth pod was a return cradle, Marrow says. Kal was lent to Vitra as a seed the Hush could not see. The Curator is not the only one who has been feeding here.",
      xp: 6000,
      level: MARROWS_TRUTH,
    },
  ],
};
