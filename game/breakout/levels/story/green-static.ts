/**
 * Episode 9 — Green Static.
 *
 * The dome over Aurel is almost closed when a signal cuts through it: Kal's
 * own heartbeat, the rhythm from inside the egg, played back by someone who
 * knows the code. A quiet green ship lands with a courteous envoy and a
 * document — a loan, with Kal's shell marks on it, due for return. Sable goes
 * still again: the cradle was already aboard when the Migration began, and no
 * one asked what it was. Kal goes, because the envoy has the one thing he has
 * wanted since the Grey Moon — the why. The ship takes him to Vireo, a jungle
 * world under a glass roof, where cages hold creatures from a dozen skies —
 * the Tally — and where the last door closes behind him.
 *
 * Mechanics: Second Sun's kit, a touch slower to start, with two new habits —
 * regen leaves that grow back under fans, and cages of steel with locked
 * doors. A magnet in the signal, sticky on the ship, keys on the loan, ghosts
 * in Vireo's clouds, rails on the vines, explosive fireflies in fog, a locked
 * roof on ice, a guard on the Tally, and a cage that descends on a timer.
 *
 * Shapes: a waveform, a leaf-shaped ship, a sealed document, a green world,
 * the canopy, hanging vines, fireflies, a glass roof, a row of cages, a cage.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/green-static.jpg";

// 81 — The signal -----------------------------------------------------------------
// A heartbeat drawn in lime: peaks and troughs, a magnet at the loudest beat.
const THE_SIGNAL = createLevel({ id: "green-static-01", name: "The signal", author: AUTHOR, ballSpeed: 400 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        ".....l.....",
        "....lLl....",
        "l...l.l...l",
        "lL.l...l.Ll",
        "l.ll.m..ll.",
        "...........",
        "ccccccccccc",
      ],
      { l: glass("lime"), L: hard("lime"), m: piece("magnet", "lime"), c: glass("cyan") },
      TOP,
    ),
  )
  .bumper(110, 340)
  .bumper(250, 340)
  .bonus("slow", 180, 420)
  .build();

// 82 — The green ship -------------------------------------------------------------
// A leaf laid on its side: lime glass, a hard midrib, a steel keel. Sticky and grow.
const THE_GREEN_SHIP = createLevel({ id: "green-static-02", name: "The green ship", author: AUTHOR, ballSpeed: 402 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "......llll.",
        "...llllllll",
        ".lllllLllll",
        "lLlLlLlLlLl",
        ".lllllllll.",
        "...lllllll.",
        "....###....",
      ],
      { l: glass("lime"), L: hard("lime"), "#": steel("lime") },
      TOP,
    ),
  )
  .zone("sticky", 180, 340)
  .zone("grow", 60, 440)
  .bonus("fast2", 300, 440)
  .build();

// 83 — The loan -------------------------------------------------------------------
// A document in a steel frame: lines of text in cyan, a seal of locks that
// three keys open. A mirror under it: read it twice.
const THE_LOAN = createLevel({ id: "green-static-03", name: "The loan", author: AUTHOR, ballSpeed: 404 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "###########",
        "#ccccccc..#",
        "#.........#",
        "#ccccc....#",
        "#...XXX...#",
        "#ccc.XXX.k#",
        "#k.......k#",
      ],
      { "#": steel("cyan"), c: glass("cyan"), X: piece("lock", "amber"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .zone("mirror", 180, 340)
  .bonus("slow", 60, 440)
  .zone("grow", 300, 440)
  .build();

// 84 — Vireo ----------------------------------------------------------------------
// A green world: a lime globe with a hard heart, clouds of ghosts over it.
// Anti-gravity lifts the ball into the clouds.
const VIREO = createLevel({ id: "green-static-04", name: "Vireo", author: AUTHOR, ballSpeed: 406 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "..o.....o..",
        "....lllll..",
        "...llolllo.",
        "..llLLLll..",
        "..llLLLll..",
        ".o.lllllo..",
        "....lllll..",
      ],
      { l: glass("lime"), L: hard("lime"), o: piece("ghost", "cyan") },
      TOP,
    ),
  )
  .zone("antigrav", 180, 330)
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .build();

// 85 — Canopy ---------------------------------------------------------------------
// Layers of leaves that grow back; two fans blow the ball along the branches.
const CANOPY = createLevel({ id: "green-static-05", name: "Canopy", author: AUTHOR, ballSpeed: 408 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "rllr...rllr",
        ".lLl...lLl.",
        "...........",
        "..rlllllr..",
        "...lLLLl...",
        "...........",
        "lLl.rlr.lLl",
      ],
      { l: glass("lime"), L: hard("lime"), r: piece("regen", "lime") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .bonus("fast2", 180, 420)
  .build();

// 86 — Vines ----------------------------------------------------------------------
// Vines hang from the roof, knotted with hard wood. Two rails to ride between
// them; gravity pulls the ball down the stems.
const VINES = createLevel({ id: "green-static-06", name: "Vines", author: AUTHOR, ballSpeed: 410 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "lLlLlLlLlLl",
        ".l..l..l.l.",
        ".L..l..L.l.",
        ".l..L..l.L.",
        ".L..l..L.l.",
        ".l..L..l.L.",
        "....L......",
      ],
      { l: glass("lime"), L: hard("amber") },
      TOP,
    ),
  )
  .rail(40, 320, 90)
  .rail(230, 320, 90)
  .zone("gravity", 180, 400)
  .bonus("slow", 60, 460)
  .build();

// 87 — Fireflies ------------------------------------------------------------------
// Sparks in the dark: explosive fireflies in chains, a fog bank hiding the
// paddle's approach, a split so two balls hunt them.
const FIREFLIES = createLevel({ id: "green-static-07", name: "Fireflies", author: AUTHOR, ballSpeed: 412 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        ".e...a...e.",
        "a...A...a.a",
        "..a.....a..",
        "..A.a.a.A..",
        "a.....e...a",
        "...a.A.a...",
        "a.A.....A.a",
      ],
      { e: piece("explosive", "amber"), a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .zone("fog", 180, 380, 22)
  .zone("split", 180, 330)
  .bonus("slow", 60, 460)
  .build();

// 88 — The glass roof -------------------------------------------------------------
// Vireo's roof: panes in steel ribs, locked panes that keys at the eaves open.
// Ice under the roof.
const THE_GLASS_ROOF = createLevel({ id: "green-static-08", name: "The glass roof", author: AUTHOR, ballSpeed: 414 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "....###....",
        "..##cXc##..",
        ".#ccccccc#.",
        "#ccXcccXcc#",
        "#ccccccccc#",
        "k.........k",
        "..cc...cc..",
      ],
      { "#": steel("cyan"), c: glass("cyan"), X: piece("lock", "lime"), k: piece("key", "lime") },
      TOP,
    ),
  )
  .zone("ice", 180, 340)
  .bonus("slow", 60, 440)
  .zone("grow", 300, 440)
  .build();

// 89 — The Tally ------------------------------------------------------------------
// A row of cages, each with something bright inside that pulls at the ball.
// A guard sweeps the corridor; shrink at its end.
const THE_TALLY = createLevel({ id: "green-static-09", name: "The Tally", author: AUTHOR, ballSpeed: 416 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "###.###.###",
        "#m#.#m#.#m#",
        "#v#.#v#.#v#",
        "V.V.V.V.V.V",
        "...........",
        ".#v#...#v#.",
        ".#m#...#m#.",
      ],
      { "#": steel("violet"), m: piece("magnet", "pink"), v: glass("violet"), V: hard("violet") },
      TOP,
    ),
  )
  .guard(180, 320, { w: 56, h: 8, range: 90, speed: 1.6 })
  .zone("shrink", 300, 440)
  .bonus("slow", 60, 440)
  .build();

// 90 — The cage -------------------------------------------------------------------
// Kal's own cage. Steel posts, a hard door with rotor hinges, a locked latch
// with the key on the far side. The cage comes down (descend) on a timer.
// Five lives: the door is heavy.
const THE_CAGE = createLevel({ id: "green-static-10", name: "The cage", author: AUTHOR, ballSpeed: 418, lives: 5 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "#R#######R#",
        "#vvvvvvvvv#",
        "#vVVVXVVVv#",
        "#vvvvvvvvv#",
        "#.........#",
        "#....k....#",
        "#.........#",
      ],
      { "#": steel("violet"), R: piece("rotor", "violet"), v: glass("violet"), V: hard("violet"), X: piece("lock", "amber"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .bonus("slow", 180, 360)
  .zone("grow", 60, 460)
  .zone("ice", 300, 460)
  .rules({ descend: 20, timer: 240 })
  .build();

export const GREEN_STATIC: StoryEpisodeDef = {
  slug: "green-static",
  title: "Green Static",
  order: 9,
  tagline: "A signal in Kal's own heartbeat, a polite envoy, and a loan that has come due.",
  background: BG,
  chapters: [
    {
      slug: "the-signal",
      title: "The signal",
      intro: "The dome is nearly closed when a signal cuts through it: Kal's heartbeat, played back by someone who knows the code.",
      xp: 4100,
      level: THE_SIGNAL,
    },
    {
      slug: "the-green-ship",
      title: "The green ship",
      intro: "It lands without a sound, the color of a leaf. Nobody on Aurel has seen a ship like it. Sable has.",
      xp: 4200,
      level: THE_GREEN_SHIP,
    },
    {
      slug: "the-loan",
      title: "The loan",
      intro: "The envoy is courteous. The document carries the marks from Kal's shell. Specimen K-L, it says. On loan. Due.",
      xp: 4300,
      level: THE_LOAN,
    },
    {
      slug: "vireo",
      title: "Vireo",
      intro: "Kal goes, because the envoy has the one thing he has wanted since the Grey Moon: the why. The ship takes him to a green world under glass.",
      xp: 4400,
      level: VIREO,
    },
    {
      slug: "canopy",
      title: "Canopy",
      intro: "Leaves the size of sails, and a warm wind that never stops. Everything here grows back.",
      xp: 4500,
      level: CANOPY,
    },
    {
      slug: "vines",
      title: "Vines",
      intro: "Kal climbs the way he always has. The vines are the first wall that climbs back.",
      xp: 4600,
      level: VINES,
    },
    {
      slug: "fireflies",
      title: "Fireflies",
      intro: "At night the jungle lights up in his rhythm. Every firefly here pulses the way his beacon did.",
      xp: 4700,
      level: FIREFLIES,
    },
    {
      slug: "the-glass-roof",
      title: "The glass roof",
      intro: "Above the canopy, panes in steel ribs. Vireo is not a world. It is a greenhouse.",
      xp: 4800,
      level: THE_GLASS_ROOF,
    },
    {
      slug: "the-tally",
      title: "The Tally",
      intro: "Under the roof, a corridor of cages. Something bright in every one, from a dozen skies. The Tally, the envoy calls it. On loan.",
      xp: 4900,
      level: THE_TALLY,
    },
    {
      slug: "the-cage",
      title: "The cage",
      intro: "The last cage is empty and the right size. The door closes behind him. Kal has been inside a shell before.",
      xp: 5000,
      level: THE_CAGE,
    },
  ],
};
