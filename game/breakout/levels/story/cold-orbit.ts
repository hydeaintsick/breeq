/**
 * Episode 2 — Cold Orbit.
 *
 * Kal leaves the Grey Moon he hatched on. Ten walls that move from a plain
 * glass crescent to portals, magnets, bumpers and a rail: every chapter adds
 * one idea, and the ball speeds up by five units at a time.
 *
 * Shapes: a crescent moon, shell fragments, the egg pod, a star chart, a
 * rocket, an asteroid belt, a dead satellite, a wormhole ring, a ship torn in
 * two, and a radio dish pointed home.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;

// 01 — The Grey Moon --------------------------------------------------------------
// A crescent, open to the right, with one star in the sky it frames.
const GREY_MOON = createLevel({
  id: "cold-orbit-01",
  name: "The Grey Moon",
  author: AUTHOR,
  ballSpeed: 300,
})
  .background("/backgrounds/cold-orbit.jpg", { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...ccccc.",
        "..bb...c.",
        ".bb......",
        ".bb...a..",
        ".bb......",
        "..bb...c.",
        "...ccccc.",
      ],
      { b: glass("blue"), c: glass("cyan"), a: glass("amber") },
      TOP,
    ),
  )
  .bonus("slow", 180, 300)
  .build();

// 02 — Shell fragments ------------------------------------------------------------
// Three pieces of the egg, each with a harder inner layer.
const SHELL_FRAGMENTS = createLevel({
  id: "cold-orbit-02",
  name: "Shell fragments",
  author: AUTHOR,
  ballSpeed: 305,
})
  .background("/backgrounds/cold-orbit.jpg", { dim: 0.55 })
  .brickRows(
    wall(
      [
        "pp.....pp.",
        "pPp...pPPp",
        ".pp....pp.",
        "..........",
        "...pppp...",
        "..ppPPpp..",
        "...pppp...",
      ],
      { p: glass("pink"), P: hard("violet") },
      TOP,
    ),
  )
  .bonus("slow", 180, 300)
  .build();

// 03 — The pod --------------------------------------------------------------------
// A capsule: hard nose, steel hull, cyan windows, two amber thrusters. Steel enters.
const THE_POD = createLevel({
  id: "cold-orbit-03",
  name: "The pod",
  author: AUTHOR,
  ballSpeed: 310,
})
  .background("/backgrounds/cold-orbit.jpg", { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....VV....",
        "...VVVV...",
        "..#vvvv#..",
        "..#vccv#..",
        "..#vccv#..",
        "..#vvvv#..",
        "..#VVVV#..",
        "..a....a..",
      ],
      {
        V: hard("violet"),
        v: glass("violet"),
        c: glass("cyan"),
        a: glass("amber"),
        "#": steel("blue"),
      },
      TOP,
    ),
  )
  .bonus("slow", 90, 340)
  .zone("grow", 270, 340)
  .build();

// 04 — Star chart -----------------------------------------------------------------
// A constellation: hard amber stars joined by faint blue lines. The first ×2 zone.
const STAR_CHART = createLevel({
  id: "cold-orbit-04",
  name: "Star chart",
  author: AUTHOR,
  ballSpeed: 315,
})
  .background("/backgrounds/cold-orbit.jpg", { dim: 0.55 })
  .brickRows(
    wall(
      [
        "A...b.....A",
        ".b..b....b.",
        "..b.A...b..",
        "...bbbbA...",
        "....A..b...",
        "...b....b..",
        "..A......A.",
      ],
      { A: hard("amber"), b: glass("blue") },
      TOP,
    ),
  )
  .bonus("slow", 70, 330)
  .bonus("fast2", 290, 330)
  .build();

// 05 — First lift-off -------------------------------------------------------------
// A rocket: amber nose, pink body with two windows, steel fins, flames below.
const FIRST_LIFT_OFF = createLevel({
  id: "cold-orbit-05",
  name: "First lift-off",
  author: AUTHOR,
  ballSpeed: 320,
})
  .background("/backgrounds/cold-orbit.jpg", { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....A....",
        "...AAA...",
        "...ppp...",
        "..#pcp#..",
        "..#ppp#..",
        "..#pcp#..",
        ".##ppp##.",
        ".a.aaa.a.",
      ],
      {
        A: hard("amber"),
        p: glass("pink"),
        c: glass("cyan"),
        a: glass("amber"),
        "#": steel("blue"),
      },
      TOP,
    ),
  )
  .bonus("fast2", 180, 340)
  .bonus("slow", 60, 410)
  .build();

// 06 — Asteroid belt --------------------------------------------------------------
// Three rocks with hard cores, and two bumpers tumbling under them.
const ASTEROID_BELT = createLevel({
  id: "cold-orbit-06",
  name: "Asteroid belt",
  author: AUTHOR,
  ballSpeed: 320,
})
  .background("/backgrounds/cold-orbit.jpg", { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".VV....bb.",
        "VVVV..bVVb",
        ".VV....bb.",
        "..........",
        "....bb..V.",
        "...bVVb.VV",
        "....bb..V.",
      ],
      { V: hard("violet"), b: glass("blue") },
      TOP,
    ),
  )
  .bumper(90, 320)
  .bumper(270, 320)
  .bonus("slow", 180, 410)
  .build();

// 07 — The dead satellite ---------------------------------------------------------
// Two solar panels, a steel body open at both ends, a magnet in the dish, a beacon.
const DEAD_SATELLITE = createLevel({
  id: "cold-orbit-07",
  name: "The dead satellite",
  author: AUTHOR,
  ballSpeed: 325,
})
  .background("/backgrounds/cold-orbit.jpg", { dim: 0.55 })
  .brickRows(
    wall(
      [
        "bbb.....bbb",
        "bbb.#.#.bbb",
        "bbb.#c#.bbb",
        "bbb.#c#.bbb",
        "....#m#....",
        "...........",
        ".....a.....",
      ],
      {
        b: glass("blue"),
        c: glass("cyan"),
        m: piece("magnet", "blue"),
        a: glass("amber"),
        "#": steel("blue"),
      },
      TOP,
    ),
  )
  .bonus("slow", 180, 320)
  .bumper(90, 380)
  .bumper(270, 380)
  .build();

// 08 — Wormhole -------------------------------------------------------------------
// A violet ring with a cyan eye. The portal drops the ball inside the ring.
const WORMHOLE = createLevel({
  id: "cold-orbit-08",
  name: "Wormhole",
  author: AUTHOR,
  ballSpeed: 325,
})
  .background("/backgrounds/cold-orbit.jpg", { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...VVVVV...",
        "..vv...vv..",
        ".v.......v.",
        ".v...C...v.",
        ".v.......v.",
        "..vv...vv..",
        "...vvvvv...",
      ],
      { v: glass("violet"), V: hard("violet"), C: hard("cyan") },
      TOP,
    ),
  )
  .portal(300, 420, 110, 152)
  .zone("sticky", 60, 420)
  .bonus("slow", 180, 330)
  .build();

// 09 — The Drift ------------------------------------------------------------------
// A ship torn in two: the bow high on the left, the stern low on the right.
// A mirror between the halves, a rail to ride, ×2 under the bow.
const THE_DRIFT = createLevel({
  id: "cold-orbit-09",
  name: "The Drift",
  author: AUTHOR,
  ballSpeed: 330,
})
  .background("/backgrounds/cold-orbit.jpg", { dim: 0.55 })
  .brickRows(
    wall(
      [
        "VVcc......",
        "#cccc.....",
        "Vcccc.....",
        ".ccc......",
        "..........",
        "......ccc.",
        ".....ccccV",
        ".....cccc#",
        "......ccVV",
      ],
      { V: hard("violet"), c: glass("cyan"), "#": steel("blue") },
      TOP,
    ),
  )
  .zone("mirror", 180, 320)
  .rail(200, 380, 100)
  .bonus("fast2", 60, 420)
  .build();

// 10 — Signal from home -----------------------------------------------------------
// A radio dish with two magnets in the bowl, an amber feed, a hard pedestal.
// Slow left, ×2 right, two bumpers, and a portal that lifts the ball over the dish.
const SIGNAL_FROM_HOME = createLevel({
  id: "cold-orbit-10",
  name: "Signal from home",
  author: AUTHOR,
  ballSpeed: 330,
})
  .background("/backgrounds/cold-orbit.jpg", { dim: 0.55 })
  .brickRows(
    wall(
      [
        "c.........c",
        "cc.......cc",
        ".cc.....cc.",
        "..ccm.mcc..",
        "....ccc....",
        ".....A.....",
        "....VVV....",
        "...VVVVV...",
      ],
      {
        c: glass("cyan"),
        m: piece("magnet", "blue"),
        A: hard("amber"),
        V: hard("violet"),
      },
      TOP,
    ),
  )
  .bonus("slow", 50, 330)
  .bonus("fast2", 310, 330)
  .bumper(110, 400)
  .bumper(250, 400)
  .portal(40, 470, 180, 64)
  .build();

export const COLD_ORBIT: StoryEpisodeDef = {
  slug: "cold-orbit",
  title: "Cold Orbit",
  order: 2,
  tagline: "Kal leaves the Grey Moon he hatched on and learns to read the sky.",
  background: "/backgrounds/cold-orbit.jpg",
  chapters: [
    {
      slug: "the-grey-moon",
      title: "The Grey Moon",
      intro:
        "Kal has never seen a sunrise. This morning, the Grey Moon gives him one.",
      xp: 250,
      level: GREY_MOON,
    },
    {
      slug: "shell-fragments",
      title: "Shell fragments",
      intro:
        "Pieces of the shell he hatched from lie in the dust. They are not from here.",
      xp: 275,
      level: SHELL_FRAGMENTS,
    },
    {
      slug: "the-pod",
      title: "The pod",
      intro:
        "Half-buried in the regolith: a capsule the size of a house, built to carry one egg.",
      xp: 300,
      level: THE_POD,
    },
    {
      slug: "star-chart",
      title: "Star chart",
      intro: "Etched inside the pod, a map of stars. One of them is circled.",
      xp: 325,
      level: STAR_CHART,
    },
    {
      slug: "first-lift-off",
      title: "First lift-off",
      intro:
        "The pod still has a spark left. Kal points it at the circled star.",
      xp: 350,
      level: FIRST_LIFT_OFF,
    },
    {
      slug: "asteroid-belt",
      title: "Asteroid belt",
      intro:
        "Rocks the size of hills tumble past the window. Kal learns to bounce.",
      xp: 375,
      level: ASTEROID_BELT,
    },
    {
      slug: "the-dead-satellite",
      title: "The dead satellite",
      intro:
        "A silent relay hangs in the dark. Its dish still points somewhere.",
      xp: 400,
      level: DEAD_SATELLITE,
    },
    {
      slug: "wormhole",
      title: "Wormhole",
      intro: "The relay's last message is a door. Kal goes through it.",
      xp: 425,
      level: WORMHOLE,
    },
    {
      slug: "the-drift",
      title: "The Drift",
      intro:
        "On the far side, a ship torn in two. Its hull carries the same marks as his shell.",
      xp: 450,
      level: THE_DRIFT,
    },
    {
      slug: "signal-from-home",
      title: "Signal from home",
      intro:
        "The wreck's beacon still pulses, in a rhythm Kal has known since before he hatched.",
      xp: 500,
      level: SIGNAL_FROM_HOME,
    },
  ],
};
