/**
 * Episode 3 — Glass Sky.
 *
 * The way home. Ten walls that bring in the rest of the kit one piece at a
 * time — explosives, ghosts, rotors, a black hole, a guard and regen, keys
 * and locks, fans and ×3, portals with a decoy, the descend and order rules,
 * ice, invert, fog, a trampoline, a timer — and end on the glass sky of
 * Vitra itself.
 *
 * Shapes: a ringed planet, a comet, storm rings, an accretion disk, a fleet
 * of sentinel ships, a gate, a sun, three moons, a tempest, and the sky.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/glass-sky.jpg";

// 11 — Leaving orbit --------------------------------------------------------------
// A violet planet with an amber ring; three explosives in the ring. Anti-gravity
// under the planet: the ball climbs.
const LEAVING_ORBIT = createLevel({ id: "glass-sky-01", name: "Leaving orbit", author: AUTHOR, ballSpeed: 330 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....vvv....",
        "...vvvvv...",
        "..vvvvvvv..",
        "a*aaa*aaa*a",
        "..vvvvvvv..",
        "...vvvvv...",
        "....vvv....",
      ],
      { v: glass("violet"), a: glass("amber"), "*": piece("explosive", "amber") },
      TOP,
    ),
  )
  .zone("antigrav", 180, 320)
  .bonus("slow", 60, 420)
  .bonus("fast2", 300, 420)
  .build();

// 12 — Comet tail -----------------------------------------------------------------
// A hard amber head top-right; a tail of cyan glass and ghosts falling to the left.
const COMET_TAIL = createLevel({ id: "glass-sky-02", name: "Comet tail", author: AUTHOR, ballSpeed: 335 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".........AA",
        "........AAA",
        ".......ccAA",
        "......coc..",
        ".....occ...",
        "....coc....",
        "...occ.....",
        "..coc......",
        ".oc........",
      ],
      { A: hard("amber"), c: glass("cyan"), o: piece("ghost", "cyan") },
      TOP,
    ),
  )
  .bonus("fast2", 280, 340)
  .bonus("slow", 80, 420)
  .build();

// 13 — Ring storm -----------------------------------------------------------------
// The rings of a gas giant: a hard band, blue debris, two rotors. Gravity pulls.
const RING_STORM = createLevel({ id: "glass-sky-03", name: "Ring storm", author: AUTHOR, ballSpeed: 335 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..vvvvvv..",
        ".vVVVVVVv.",
        "vvvvvvvvvv",
        "..........",
        ".x.bbbb.x.",
        "..........",
        "..xbbbbx..",
      ],
      { v: glass("violet"), V: hard("violet"), b: glass("blue"), x: piece("rotor", "amber") },
      TOP,
    ),
  )
  .zone("gravity", 180, 330)
  .bonus("fast2", 60, 430)
  .bonus("slow", 300, 430)
  .build();

// 14 — The Maw --------------------------------------------------------------------
// An accretion disk: an eye of glass and hard bricks around a black hole that
// sits in a steel throat, open only from below. A ball that climbs the throat
// is gone. Five lives, because the Maw will take some.
const THE_MAW = createLevel({ id: "glass-sky-04", name: "The Maw", author: AUTHOR, ballSpeed: 340, lives: 5 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...bbbbb...",
        ".bbVV#VVbb.",
        "bV..#.#..Vb",
        "b...#.#...b",
        "bV.......Vb",
        ".bbVVVVVbb.",
        "...bbbbb...",
      ],
      { b: glass("blue"), v: glass("violet"), V: hard("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .bonus("slow", 60, 340)
  .zone("grow", 300, 340)
  .bonus("fast2", 180, 440)
  .build();

// 15 — Sentinels ------------------------------------------------------------------
// Four ships of light with regen engines, and a guard sweeping under the fleet.
const SENTINELS = createLevel({ id: "glass-sky-05", name: "Sentinels", author: AUTHOR, ballSpeed: 340 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".A...A...A.",
        "AAA.AAA.AAA",
        ".r...r...r.",
        "...........",
        "..A.....A..",
        ".AAA...AAA.",
        "..r.....r..",
        "...........",
        ".....A.....",
        "....AAA....",
        ".....r.....",
      ],
      { A: hard("blue"), r: piece("regen", "lime") },
      TOP,
    ),
  )
  .guard(180, 350, { w: 48, h: 8, range: 90, speed: 1.6 })
  .zone("ice", 60, 420)
  .bonus("slow", 300, 420)
  .zone("shrink", 180, 460)
  .build();

// 16 — Locked gate ----------------------------------------------------------------
// Two steel towers with a key on top of each; a gate of locks between them.
// A fan pushes the ball across the bottom; sticky lets Kal cling and aim.
const LOCKED_GATE = createLevel({ id: "glass-sky-06", name: "Locked gate", author: AUTHOR, ballSpeed: 345 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".k.......k.",
        ".#.......#.",
        "##.KKKKK.##",
        "##.KKKKK.##",
        "##.KKKKK.##",
        "##.KKKKK.##",
        "##.lllll.##",
      ],
      { k: piece("key", "amber"), K: piece("lock", "violet"), l: glass("lime"), "#": steel("blue") },
      TOP,
    ),
  )
  .fan(12, 320, 1, { reach: 140, spread: 36, force: 2.2 })
  .zone("sticky", 180, 400)
  .bonus("fast2", 300, 440)
  .build();

// 17 — Solar wind -----------------------------------------------------------------
// A sun: hard amber core, glass corona. Fans from both sides, ×3 dead center,
// a split zone for a second ball.
const SOLAR_WIND = createLevel({ id: "glass-sky-07", name: "Solar wind", author: AUTHOR, ballSpeed: 345 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....a....",
        ".a.aAa.a.",
        "..AAAAA..",
        ".aAAAAAa.",
        "a.AAAAA.a",
        ".a.aAa.a.",
        "....a....",
        ".a.....a.",
      ],
      { a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .fan(12, 340, 1, { reach: 110, spread: 36, force: 2.2 })
  .fan(348, 340, -1, { reach: 110, spread: 36, force: 2.2 })
  .bonus("fast3", 180, 400)
  .zone("shrink", 60, 440)
  .zone("split", 180, 460)
  .build();

// 18 — Vitra's moons --------------------------------------------------------------
// Three moons. The pink one, with its magnets, has to fall first; the wall
// descends every 24 paddle hits. A portal lifts the ball behind the moons,
// a decoy portal does nothing, a mirror flips the approach.
const VITRAS_MOONS = createLevel({ id: "glass-sky-08", name: "Vitra's moons", author: AUTHOR, ballSpeed: 355 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".vvv...ccc.",
        "vvVvv.cCCcc",
        ".vvv...ccc.",
        "...........",
        "....ppp....",
        "...pmPmp...",
        "....ppp....",
      ],
      {
        v: glass("violet"),
        V: hard("violet"),
        c: glass("cyan"),
        C: hard("cyan"),
        p: glass("pink"),
        P: hard("pink"),
        m: piece("magnet", "pink"),
      },
      TOP,
    ),
  )
  .zone("mirror", 180, 330)
  .portal(50, 400, 180, 64)
  .zone("fakePortal", 310, 400)
  .rules({ descend: 24, order: "pink" })
  .build();

// 19 — The storm ------------------------------------------------------------------
// Rotors at the edges, ghosts blinking in the hard band, ice and invert traps,
// a fog bank, a trampoline, and four minutes on the clock.
const THE_STORM = createLevel({ id: "glass-sky-09", name: "The storm", author: AUTHOR, ballSpeed: 355 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".x.cccc.x.",
        ".oVVVVVVo.",
        "..cccccc..",
        ".cVVccVVc.",
        "...oooo...",
        "..........",
        "..VVxxVV..",
      ],
      { x: piece("rotor", "amber"), c: glass("cyan"), o: piece("ghost", "cyan"), V: hard("violet") },
      TOP,
    ),
  )
  .zone("ice", 100, 340)
  .zone("invert", 260, 340)
  .bonus("fast2", 180, 300)
  .zone("fog", 180, 420, 22)
  .trampoline(130, 480, 100)
  .rules({ timer: 240 })
  .build();

// 20 — Glass Sky ------------------------------------------------------------------
// The sky of Vitra: six bands of color under the twin suns, the pink band
// hardened. One key in the blue band opens two locks, two explosives sit in
// the ground row. A split zone, slow and grow, ×2 low, two bumpers, five minutes.
const GLASS_SKY_FINALE = createLevel({ id: "glass-sky-10", name: "Glass Sky", author: AUTHOR, ballSpeed: 360, paddleWidth: 68 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....aAa....",
        "..PPaAaPP..",
        ".pPpppppPp.",
        "vvvvvvvvvvv",
        "bbbKbkbKbbb",
        "ccccccccccc",
        "l*lllllll*l",
      ],
      {
        a: glass("amber"),
        A: hard("amber"),
        p: glass("pink"),
        P: hard("pink"),
        v: glass("violet"),
        b: glass("blue"),
        c: glass("cyan"),
        l: glass("lime"),
        k: piece("key", "amber"),
        K: piece("lock", "blue"),
        "*": piece("explosive", "amber"),
      },
      TOP,
    ),
  )
  .bumper(110, 320)
  .bumper(250, 320)
  .zone("split", 180, 380)
  .bonus("slow", 60, 440)
  .zone("grow", 300, 440)
  .bonus("fast2", 180, 470)
  .rules({ timer: 300 })
  .build();

export const GLASS_SKY: StoryEpisodeDef = {
  slug: "glass-sky",
  title: "Glass Sky",
  order: 3,
  tagline: "The way home: a chart, a storm, a maw, and the sky of Vitra.",
  background: BG,
  chapters: [
    {
      slug: "leaving-orbit",
      title: "Leaving orbit",
      intro: "A ringed giant blocks the road. Kal slings around it.",
      xp: 500,
      level: LEAVING_ORBIT,
    },
    {
      slug: "comet-tail",
      title: "Comet tail",
      intro: "A comet is going the same way. Kal rides its tail.",
      xp: 550,
      level: COMET_TAIL,
    },
    {
      slug: "ring-storm",
      title: "Ring storm",
      intro: "Ice and rock spin in the rings of a gas giant. Nothing here stays still.",
      xp: 600,
      level: RING_STORM,
    },
    {
      slug: "the-maw",
      title: "The Maw",
      intro: "Something dark waits between the systems. It has swallowed ships before.",
      xp: 650,
      level: THE_MAW,
    },
    {
      slug: "sentinels",
      title: "Sentinels",
      intro: "Ships of light bar the way. Kal's kind built them to keep strangers out.",
      xp: 700,
      level: SENTINELS,
    },
    {
      slug: "locked-gate",
      title: "Locked gate",
      intro: "The Lanterns' gate opens only for keys. Kal has to find them.",
      xp: 750,
      level: LOCKED_GATE,
    },
    {
      slug: "solar-wind",
      title: "Solar wind",
      intro: "Twin suns. Kal remembers them from inside the egg.",
      xp: 800,
      level: SOLAR_WIND,
    },
    {
      slug: "vitras-moons",
      title: "Vitra's moons",
      intro: "Three moons circle a planet with a glass sky. Home.",
      xp: 850,
      level: VITRAS_MOONS,
    },
    {
      slug: "the-storm",
      title: "The storm",
      intro: "Vitra's sky does not let anyone through easily. Not even its children.",
      xp: 900,
      level: THE_STORM,
    },
    {
      slug: "glass-sky",
      title: "Glass Sky",
      intro: "One last wall. On the other side, everyone Kal has never met.",
      xp: 1000,
      level: GLASS_SKY_FINALE,
    },
  ],
};
