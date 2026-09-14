/**
 * Episode 18 — Keepers.
 *
 * Vitra, with the lights on. The Keepers have kept them on since the day the
 * Lantern rose, for nobody, because Kal asked. Now he asks for more: every
 * Lantern in the yard, the whole fleet his people built to keep strangers out,
 * woken and sent to keep a stranger out for real this time. The Archive has
 * one file left it never showed him — the contract for the egg, in the Sowers'
 * script, with Vitra's seal under it: his people knew what they were borrowing.
 * The Keepers learn the mark from Lys and grow it into the Lanterns' light.
 * When the fleet rises through the dome, the Hush will not see it coming.
 *
 * Mechanics: a lit skyline with bumpers, three drones with regen arms and
 * magnet eyes, the Archive's shelves of steel with keys and locks behind a
 * mirror, twelve cradles and a portal into the empty one, a yard of explosive
 * lamps with rotors, an explosive chain in a steel hull with fans, one dark
 * sun as a black hole in a steel throat (five lives), the gate open with a
 * guard in the gap and ice, Keepers on the dome under an order rule with a
 * split and a trampoline, and the fleet rising on descend with shrink and four
 * minutes.
 *
 * Shapes: a skyline, three drones, a tower of tablets, twelve cradles, a
 * lantern yard, a hull, twin suns, two towers and a gate, a dome, ships rising.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/keepers.jpg";

// 171 — Lights on -------------------------------------------------------------------
// The dark city with its windows lit: violet towers, amber panes. Two bumpers
// in the streets.
const LIGHTS_ON = createLevel({ id: "keepers-01", name: "Lights on", author: AUTHOR, ballSpeed: 444 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..a....a...",
        ".vav..vav.a",
        ".vvv.vvvvav",
        "vavvavvvvvv",
        "vvvvvvvavvv",
        "vavvvvvvvav",
      ],
      { a: glass("amber"), v: glass("violet") },
      TOP,
    ),
  )
  .bumper(90, 330)
  .bumper(270, 330)
  .bonus("slow", 180, 440)
  .build();

// 172 — Keepers' welcome ------------------------------------------------------------
// Three drones, one only half in the frame: regen arms, magnet eyes, violet
// bodies. Grow under them.
const KEEPERS_WELCOME = createLevel({ id: "keepers-02", name: "Keepers' welcome", author: AUTHOR, ballSpeed: 445 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".r.m.r.....",
        "..vvv......",
        "...v....r.m",
        "..........v",
        "...r.m.r..v",
        "....vvv....",
        ".....v.....",
      ],
      { r: piece("regen", "lime"), m: piece("magnet", "amber"), v: glass("violet") },
      TOP,
    ),
  )
  .zone("grow", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 173 — The Archive's last file -----------------------------------------------------
// Three shelves with steel ends and tablets between them; the locked entries
// are the file. The key is on the floor under the tower, a mirror under that.
const THE_ARCHIVES_LAST_FILE = createLevel({ id: "keepers-03", name: "The Archive's last file", author: AUTHOR, ballSpeed: 446 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "#vvvvKvvvv#",
        "...........",
        "#vvKKKKKvv#",
        "...........",
        "#KKvvvvvKK#",
        "....k......",
      ],
      { "#": steel("violet"), v: glass("violet"), K: piece("lock", "amber"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .zone("mirror", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 174 — The cradles -----------------------------------------------------------------
// Twelve cradles in two rows, an egg of amber in each but the last. A portal
// from the floor into the empty cradle.
const THE_CRADLES = createLevel({ id: "keepers-04", name: "The cradles", author: AUTHOR, ballSpeed: 447 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "a.a.a.a.a.a",
        "V.V.V.V.V.V",
        "...........",
        "a.a.a.a.a..",
        "V.V.V.V.V.V",
      ],
      { a: glass("amber"), V: hard("violet") },
      TOP,
    ),
  )
  .portal(60, 430, 330, 152)
  .bonus("slow", 180, 440)
  .bonus("fast2", 300, 440)
  .build();

// 175 — The Lantern yard ------------------------------------------------------------
// Six Lanterns in their cradles: explosive lamps over hard hulls, rotors
// turning between the rows.
const THE_LANTERN_YARD = createLevel({ id: "keepers-05", name: "The Lantern yard", author: AUTHOR, ballSpeed: 448 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".e...e...e.",
        "aAa.aAa.aAa",
        ".a...a...a.",
        "...x...x...",
        ".e...e...e.",
        "aAa.aAa.aAa",
        ".a...a...a.",
      ],
      { e: piece("explosive", "amber"), a: glass("amber"), A: hard("amber"), x: piece("rotor", "violet") },
      TOP,
    ),
  )
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .zone("grow", 180, 460)
  .build();

// 176 — Waking the fleet ------------------------------------------------------------
// One hull, open at the bottom, an explosive chain along the deck: hit one
// lamp and the whole fleet lights. Two fans under it.
const WAKING_THE_FLEET = createLevel({ id: "keepers-06", name: "Waking the fleet", author: AUTHOR, ballSpeed: 449 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "###########",
        "#eaeaeaeae#",
        "#aaaaaaaaa#",
        "#.........#",
        "....AAA....",
      ],
      { "#": steel("amber"), e: piece("explosive", "amber"), a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .bonus("slow", 180, 440)
  .build();

// 177 — Twin suns dark --------------------------------------------------------------
// The Archive's picture of the day the suns flickered: one sun still amber,
// the other with the dark in its heart — a black hole in a steel throat above
// an open chamber. Five lives.
const TWIN_SUNS_DARK = createLevel({ id: "keepers-07", name: "Twin suns dark", author: AUTHOR, ballSpeed: 450, lives: 5 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "aaa..vvvvv.",
        "aAa..V###V.",
        "aaa..V#.#V.",
        ".....V#.#V.",
        ".AA..V...V.",
        ".....vvvvv.",
      ],
      { a: glass("amber"), A: hard("amber"), v: glass("violet"), V: hard("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(240, 140)
  .bonus("slow", 60, 440)
  .zone("grow", 180, 460)
  .bonus("slow", 300, 440)
  .build();

// 178 — The gate opens --------------------------------------------------------------
// The Lanterns' two towers, and the gate between them open for once, a steel
// sill across the gap. A guard sweeps the gap, ice on the left.
const THE_GATE_OPENS = createLevel({ id: "keepers-08", name: "The gate opens", author: AUTHOR, ballSpeed: 451 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "CC.......CC",
        "CcC.....CcC",
        "CcC.....CcC",
        "CcC.....CcC",
        "CcC#####CcC",
        "CcC.....CcC",
      ],
      { C: hard("cyan"), c: glass("cyan"), "#": steel("cyan") },
      TOP,
    ),
  )
  .guard(180, 300, { w: 48, h: 8, range: 40, speed: 1.6 })
  .zone("grow", 180, 420)
  .zone("ice", 60, 440)
  .bonus("slow", 300, 440)
  .build();

// 179 — Keepers on the dome ---------------------------------------------------------
// The dome in cyan glass, and Keepers climbing it in violet: the Keepers
// first, then the glass. A split under the dome, a trampoline at the floor.
const KEEPERS_ON_THE_DOME = createLevel({ id: "keepers-09", name: "Keepers on the dome", author: AUTHOR, ballSpeed: 452 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....ccc....",
        "..cc.v.cc..",
        ".c...v...c.",
        "c..v.....vc",
        "c..v..v..vc",
      ],
      { c: glass("cyan"), v: glass("violet") },
      TOP,
    ),
  )
  .rules({ order: "violet" })
  .zone("split", 180, 350)
  .trampoline(130, 470, 100)
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .build();

// 180 — Lanterns rising -------------------------------------------------------------
// The fleet rising through the open dome, steel ribs above with the gaps the
// ships take. Bumpers, shrink, the wall descending; four minutes.
const LANTERNS_RISING = createLevel({ id: "keepers-10", name: "Lanterns rising", author: AUTHOR, ballSpeed: 453 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "###.#.#.###",
        "..a.....a..",
        ".aAa...aAa.",
        "..a..a..a..",
        "....aAa....",
        ".....a.....",
        "a.........a",
      ],
      { "#": steel("cyan"), a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .bumper(110, 330)
  .bumper(250, 330)
  .zone("shrink", 180, 380)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .rules({ descend: 20, timer: 240 })
  .build();

export const KEEPERS: StoryEpisodeDef = {
  slug: "keepers",
  title: "Keepers",
  order: 18,
  tagline: "Vitra with the lights on, the Archive's last file, and a fleet built to keep strangers out.",
  background: BG,
  chapters: [
    {
      slug: "lights-on",
      title: "Lights on",
      intro: "Every window on Vitra is lit. The Keepers have kept them that way since the Lantern rose, for nobody, because Kal asked.",
      xp: 13100,
      level: LIGHTS_ON,
    },
    {
      slug: "keepers-welcome",
      title: "Keepers' welcome",
      intro: "The drones remember him. They have never seen two geckos at once. They circle Lys for a long time before they decide she counts.",
      xp: 13200,
      level: KEEPERS_WELCOME,
    },
    {
      slug: "the-archives-last-file",
      title: "The Archive's last file",
      intro: "One file the Archive never showed him: the contract for the egg, in the Sowers' script, and under it Vitra's seal. His people knew what they were borrowing.",
      xp: 13300,
      level: THE_ARCHIVES_LAST_FILE,
    },
    {
      slug: "the-cradles",
      title: "The cradles",
      intro: "Twelve cradles. Eleven launched toward the fleet. The twelfth was aimed somewhere else entirely, and Kal finally knows where.",
      xp: 13400,
      level: THE_CRADLES,
    },
    {
      slug: "the-lantern-yard",
      title: "The Lantern yard",
      intro: "Under the city, a yard of dark Lanterns in their cradles: the whole fleet his people built to keep strangers out. Kal asks for all of it.",
      xp: 13500,
      level: THE_LANTERN_YARD,
    },
    {
      slug: "waking-the-fleet",
      title: "Waking the fleet",
      intro: "He woke one Lantern wall by wall. The Keepers know a faster way: light one lamp, and let the light run along the deck to the rest.",
      xp: 13600,
      level: WAKING_THE_FLEET,
    },
    {
      slug: "twin-suns-dark",
      title: "Twin suns dark",
      intro: "The Archive's picture of the day it happened. One sun still burning, the other with the dark in its heart. The Gleaner's first meal here.",
      xp: 13700,
      level: TWIN_SUNS_DARK,
    },
    {
      slug: "the-gate-opens",
      title: "The gate opens",
      intro: "The Lanterns' gate opened for keys once. Today it opens for a Vitran claw, and stays open behind the fleet.",
      xp: 13800,
      level: THE_GATE_OPENS,
    },
    {
      slug: "keepers-on-the-dome",
      title: "Keepers on the dome",
      intro: "Lys teaches the Keepers the mark. They grow it into the Lanterns' light, pane by pane, on the inside of the glass sky.",
      xp: 13900,
      level: KEEPERS_ON_THE_DOME,
    },
    {
      slug: "lanterns-rising",
      title: "Lanterns rising",
      intro: "The whole fleet rises through the dome it once guarded, lit with a light the Hush cannot see. The Keepers turn the city off behind them. It can wait.",
      xp: 14000,
      level: LANTERNS_RISING,
    },
  ],
};
