/**
 * Episode 4 — Empty Nest.
 *
 * Kal drops through the glass sky and finds Vitra dark: towers with no lights,
 * a hatchery with one shell missing, an Archive that opens for his claw. The
 * Keepers — small drones left to mind the city — show him what happened: the
 * suns flickered, something fed on the light between them (the Hush), and his
 * people left in the Long Migration. His pod was the one launch that fell
 * short. He wakes a dark Lantern and follows the route.
 *
 * Mechanics: everything from Glass Sky comes back at a steadier pace — fog and
 * ghosts in the dark city, regen for the Keepers, keys for the Archive, invert
 * for the flicker, portals for the pods, rotors and fans on the Lantern, decoy
 * portals on the chart, and a timed lift-off with a guard.
 *
 * Shapes: a skyline, a street grid, three drones, a hall of eggs, a tower of
 * tablets, twin suns half dark, a row of pods, a ship on a cradle, a star
 * route, a ship rising through the dome.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/empty-nest.jpg";

// 31 — Under the glass ------------------------------------------------------------
// A skyline of dark towers, violet and blue. Two bumpers under the rooftops.
const UNDER_THE_GLASS = createLevel({ id: "empty-nest-01", name: "Under the glass", author: AUTHOR, ballSpeed: 360 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..v.....b..",
        "..v..v..b..",
        ".vv.vv.bb.b",
        ".vv.vv.bb.b",
        "vvv.vvvbbbb",
        "vvvvvvvbbbb",
        "VVVVVVVBBBB",
      ],
      { v: glass("violet"), V: hard("violet"), b: glass("blue"), B: hard("blue") },
      TOP,
    ),
  )
  .bumper(110, 320)
  .bumper(250, 320)
  .bonus("slow", 60, 430)
  .bonus("fast2", 300, 430)
  .build();

// 32 — The dark streets -----------------------------------------------------------
// A street grid: hard blocks, glass avenues, a fog bank where the lamps are out.
const DARK_STREETS = createLevel({ id: "empty-nest-02", name: "The dark streets", author: AUTHOR, ballSpeed: 362 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "BB.BBB.BB",
        "bb.bbb.bb",
        "ccccccccc",
        "vv.vvv.vv",
        "vv.vvv.vv",
        "ccccccccc",
        "oo.ooo.oo",
      ],
      { B: hard("blue"), b: glass("blue"), v: glass("violet"), c: glass("cyan"), o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .zone("fog", 180, 340, 22)
  .bonus("slow", 60, 430)
  .bonus("fast2", 300, 430)
  .build();

// 33 — The Keepers ----------------------------------------------------------------
// Three small drones: a hard head, regen arms that grow back, a magnet eye.
const THE_KEEPERS = createLevel({ id: "empty-nest-03", name: "The Keepers", author: AUTHOR, ballSpeed: 364 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".r.......r.",
        "rCr.....rCr",
        ".m.......m.",
        "...........",
        "....rCr....",
        ".....m.....",
        "...........",
        "..lllllll..",
      ],
      { r: piece("regen", "lime"), C: hard("cyan"), m: piece("magnet", "blue"), l: glass("lime") },
      TOP,
    ),
  )
  .bonus("slow", 60, 380)
  .bonus("fast2", 300, 380)
  .zone("grow", 180, 440)
  .build();

// 34 — The hatchery ---------------------------------------------------------------
// A hall of cradles: ovals of glass, most of them ghosts (empty shells). One
// solid pink egg in the middle row — the one that fits Kal's fragments.
const THE_HATCHERY = createLevel({ id: "empty-nest-04", name: "The hatchery", author: AUTHOR, ballSpeed: 366 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".o.o.o.o.o.",
        "ooooooooooo",
        ".o.o.o.o.o.",
        "...........",
        ".o.o.p.o.o.",
        "oooooPooooo",
        ".o.o.p.o.o.",
        "...........",
        "VVVVVVVVVVV",
      ],
      { o: piece("ghost", "cyan"), p: glass("pink"), P: hard("pink"), V: hard("violet") },
      TOP,
    ),
  )
  .zone("grow", 180, 340)
  .bonus("slow", 60, 440)
  .zone("sticky", 300, 440)
  .build();

// 35 — The Archive ----------------------------------------------------------------
// A tower of tablets: steel shelves, locked records, two keys at the top.
const THE_ARCHIVE = createLevel({ id: "empty-nest-05", name: "The Archive", author: AUTHOR, ballSpeed: 368 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..k.....k..",
        ".#########.",
        ".#KKKKKKK#.",
        ".#ccccccc#.",
        ".#KKKKKKK#.",
        ".#ccccccc#.",
        ".#.......#.",
        "vvvvvvvvvvv",
      ],
      { k: piece("key", "amber"), K: piece("lock", "violet"), c: glass("cyan"), v: glass("violet"), "#": steel("blue") },
      TOP,
    ),
  )
  .zone("sticky", 180, 340)
  .bonus("fast2", 60, 440)
  .bonus("slow", 300, 440)
  .build();

// 36 — The flicker ----------------------------------------------------------------
// Twin suns, one half gone dark (steel). Invert under them: the sky turns.
const THE_FLICKER = createLevel({ id: "empty-nest-06", name: "The flicker", author: AUTHOR, ballSpeed: 370 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".aaa...##a.",
        "aAAAa.#AAaa",
        "aAAAa.##Aaa",
        ".aaa...aaa.",
        "...........",
        ".ooooooooo.",
      ],
      { a: glass("amber"), A: hard("amber"), "#": steel("violet"), o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .zone("invert", 180, 330)
  .bonus("fast3", 60, 420)
  .zone("shrink", 300, 420)
  .build();

// 37 — The last pods --------------------------------------------------------------
// Cradles in a row, three pods still in them, one cradle empty. A portal carries
// the ball from the floor into the empty cradle.
const THE_LAST_PODS = createLevel({ id: "empty-nest-07", name: "The last pods", author: AUTHOR, ballSpeed: 372 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".c...c...c.",
        "cCc.cCc.cCc",
        "cCc.cCc.cCc",
        ".c...c...c.",
        "#.#.#.#.#.#",
        "#.#.#.#.#.#",
      ],
      { c: glass("cyan"), C: hard("cyan"), "#": steel("blue") },
      TOP,
    ),
  )
  .portal(60, 420, 300, 64)
  .zone("mirror", 180, 340)
  .bonus("slow", 300, 420)
  .build();

// 38 — Signal fire ----------------------------------------------------------------
// A dark Lantern on its cradle: hard hull, rotor engines, an explosive core.
// Two fans blow across the hangar floor.
const SIGNAL_FIRE = createLevel({ id: "empty-nest-08", name: "Signal fire", author: AUTHOR, ballSpeed: 374 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....aaa....",
        "...aAAAa...",
        "..aAA*AAa..",
        ".x.aAAAa.x.",
        ".x..aaa..x.",
        "....###....",
      ],
      { a: glass("amber"), A: hard("amber"), "*": piece("explosive", "amber"), x: piece("rotor", "blue"), "#": steel("blue") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .bonus("fast2", 180, 400)
  .zone("grow", 60, 450)
  .zone("ice", 300, 450)
  .build();

// 39 — The route ------------------------------------------------------------------
// The migration's chart: five worlds joined by a line of glass. Vitra, the
// blue world at the start of the line, has to fall first; the pink one
// (Aurel) is last. A decoy portal and a true one.
const THE_ROUTE = createLevel({ id: "empty-nest-09", name: "The route", author: AUTHOR, ballSpeed: 376 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "bb.........",
        "bbv...L....",
        "..vv.v.v...",
        "...vvv.v.A.",
        "...vv..vA..",
        "..........P",
        ".........P.",
      ],
      { b: glass("blue"), v: glass("violet"), L: hard("lime"), A: hard("amber"), P: hard("pink") },
      TOP,
    ),
  )
  .portal(60, 420, 300, 64)
  .zone("fakePortal", 300, 440)
  .bonus("slow", 60, 330)
  .bonus("fast2", 180, 380)
  .rules({ order: "blue" })
  .build();

// 40 — Lift from Vitra ------------------------------------------------------------
// The Lantern rising through the dome: two arcs of hardened glass overhead
// with ghosts flickering where the panes are cracked, the ship below, a guard
// sweeping the launch floor, the wall descending, four minutes.
const LIFT_FROM_VITRA = createLevel({ id: "empty-nest-10", name: "Lift from Vitra", author: AUTHOR, ballSpeed: 378 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..CCCCCCC..",
        ".CC.....CC.",
        "Cc.......cC",
        "..cocccoc..",
        "....aAa....",
        "...aAAAa...",
        "..aAAAAAa..",
        "...*...*...",
      ],
      {
        C: hard("cyan"),
        c: glass("cyan"),
        o: piece("ghost", "cyan"),
        a: glass("amber"),
        A: hard("amber"),
        "*": piece("explosive", "amber"),
      },
      TOP,
    ),
  )
  .guard(180, 350, { w: 48, h: 8, range: 90, speed: 1.6 })
  .bonus("fast2", 60, 430)
  .zone("shrink", 180, 440)
  .zone("ice", 300, 430)
  .rules({ descend: 24, timer: 240 })
  .build();

export const EMPTY_NEST: StoryEpisodeDef = {
  slug: "empty-nest",
  title: "Empty Nest",
  order: 4,
  tagline: "Under the glass sky, nobody is home. Kal finds out why.",
  background: BG,
  chapters: [
    {
      slug: "under-the-glass",
      title: "Under the glass",
      intro: "The wall gives. Kal drops through the glass sky into a city with no lights on.",
      xp: 1000,
      level: UNDER_THE_GLASS,
    },
    {
      slug: "the-dark-streets",
      title: "The dark streets",
      intro: "Every window is dark. Kal has never been somewhere his own kind lived. It is very quiet.",
      xp: 1050,
      level: DARK_STREETS,
    },
    {
      slug: "the-keepers",
      title: "The Keepers",
      intro: "Something small hums in the dark: Keepers, the drones left to mind an empty city. They have never seen a gecko.",
      xp: 1100,
      level: THE_KEEPERS,
    },
    {
      slug: "the-hatchery",
      title: "The hatchery",
      intro: "A hall of cradles, every shell empty but one. That one fits the fragments Kal carries.",
      xp: 1150,
      level: THE_HATCHERY,
    },
    {
      slug: "the-archive",
      title: "The Archive",
      intro: "The Archive opens for a Vitran claw. Kal's works. Inside: the day the suns flickered and the Long Migration began.",
      xp: 1200,
      level: THE_ARCHIVE,
    },
    {
      slug: "the-flicker",
      title: "The flicker",
      intro: "The record shows the suns stutter, and something feeding on the light between them. They named it the Hush.",
      xp: 1250,
      level: THE_FLICKER,
    },
    {
      slug: "the-last-pods",
      title: "The last pods",
      intro: "Rows of pod cradles. One launch failed and fell short of the fleet. That one was Kal's.",
      xp: 1300,
      level: THE_LAST_PODS,
    },
    {
      slug: "signal-fire",
      title: "Signal fire",
      intro: "The Keepers lead him to a Lantern, dark for years. Kal climbs its hull and wakes it wall by wall.",
      xp: 1350,
      level: SIGNAL_FIRE,
    },
    {
      slug: "the-route",
      title: "The route",
      intro: "The Archive gives up the route: five worlds where the fleet meant to stop. The first is a world of light.",
      xp: 1400,
      level: THE_ROUTE,
    },
    {
      slug: "lift-from-vitra",
      title: "Lift from Vitra",
      intro: "The Lantern rises through the sky it once guarded. Behind it, the Keepers turn the lights back on.",
      xp: 1450,
      level: LIFT_FROM_VITRA,
    },
  ],
};
