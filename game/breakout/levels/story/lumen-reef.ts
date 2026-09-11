/**
 * Episode 5 — Lumen Reef.
 *
 * The first world on the route is a shallow ocean lit from below, and the reef
 * in it is a people: the Corallines, who glow to speak and trade in light.
 * They remember two fleets passing — a dark one, then a hurried one of geckos
 * — and keep a pearl the geckos left in thanks. Before Kal can have it, the
 * reef's wound has to be defended: the Gnaw, the Hush's scouts, come at dusk.
 * Kal's first fight.
 *
 * Mechanics: a bright, mobile episode — ice and antigrav in the water, regen
 * coral, rails and a split for the song, fans on the lighthouse, then the
 * dark returns: rotors and a pocketed black hole for the Gnaw, a sweeping
 * guard and explosives for the battle, fog and gravity in the deep, a timed
 * clam with a steel jaw for the pearl.
 *
 * Shapes: waves, a coral fan, jellyfish, spiral shells, sound waves, a
 * lighthouse, worms in the reef, a wall of teeth, a descent, a clam.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/lumen-reef.jpg";

// 41 — Shallows -------------------------------------------------------------------
// Three waves of lime and cyan, hard crests. Ice where the Lantern skims.
const SHALLOWS = createLevel({ id: "lumen-reef-01", name: "Shallows", author: AUTHOR, ballSpeed: 372 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".C...C...C.",
        "cCc.cCc.cCc",
        "c.ccc.ccc.c",
        "...........",
        ".L...L...L.",
        "lLl.lLl.lLl",
        "l.lll.lll.l",
      ],
      { c: glass("cyan"), C: hard("cyan"), l: glass("lime"), L: hard("lime") },
      TOP,
    ),
  )
  .zone("ice", 180, 340)
  .bonus("slow", 60, 430)
  .bonus("fast2", 300, 430)
  .build();

// 42 — The Corallines -------------------------------------------------------------
// A coral fan: branches of glass that grow back at the tips (regen), a hard
// trunk, a grow zone in the current.
const THE_CORALLINES = createLevel({ id: "lumen-reef-02", name: "The Corallines", author: AUTHOR, ballSpeed: 374 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "r.r.r.r.r.r",
        "p.p.p.p.p.p",
        ".p.p.p.p.p.",
        "..pp.p.pp..",
        "...ppppp...",
        "....PPP....",
        "....PPP....",
      ],
      { r: piece("regen", "pink"), p: glass("pink"), P: hard("pink") },
      TOP,
    ),
  )
  .zone("grow", 180, 330)
  .bonus("fast2", 60, 430)
  .bonus("slow", 300, 430)
  .build();

// 43 — Jellies --------------------------------------------------------------------
// Three bells of glass with ghost tentacles. Anti-gravity: the ball floats up
// into the tentacles.
const JELLIES = createLevel({ id: "lumen-reef-03", name: "Jellies", author: AUTHOR, ballSpeed: 376 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".vv..vvv.vv",
        "vVVv.vVv.VV",
        "vvvv.vvv.vv",
        "o.o..o.o.oo",
        "o.o..o.o.oo",
        ".o....o..o.",
      ],
      { v: glass("violet"), V: hard("violet"), o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .zone("antigrav", 180, 330)
  .zone("ice", 60, 430)
  .bonus("slow", 300, 430)
  .build();

// 44 — The shell market -----------------------------------------------------------
// Spiral shells with a locked pearl inside each, two keys at the market's edge.
const SHELL_MARKET = createLevel({ id: "lumen-reef-04", name: "The shell market", author: AUTHOR, ballSpeed: 378 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "k.........k",
        ".aaaa.aaaa.",
        ".a..a.a..a.",
        ".aKaa.aaKa.",
        ".aaaa.aaaa.",
        "...........",
        "..AAAAAAA..",
      ],
      { k: piece("key", "amber"), a: glass("amber"), A: hard("amber"), K: piece("lock", "pink") },
      TOP,
    ),
  )
  .zone("sticky", 180, 340)
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .build();

// 45 — Reef song ------------------------------------------------------------------
// Sound waves: alternating rows of hardened notes, two rails to ride between
// them, a shrink zone where the song is loudest.
const REEF_SONG = createLevel({ id: "lumen-reef-05", name: "Reef song", author: AUTHOR, ballSpeed: 380 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "C.C.C.C.C.C",
        ".c.c.c.c.c.",
        "C.C.C.C.C.C",
        ".l.l.l.l.l.",
        "L.L.L.L.L.L",
        ".l.l.l.l.l.",
        "lllllllllll",
      ],
      { c: glass("cyan"), C: hard("cyan"), l: glass("lime"), L: hard("lime") },
      TOP,
    ),
  )
  .rail(40, 340, 90)
  .rail(230, 340, 90)
  .zone("shrink", 180, 400)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .build();

// 46 — Lighthouse coral -----------------------------------------------------------
// A tall tower with an explosive beacon on top. Fans from both sides bend the
// climb; the geckos' marks are the hard band halfway up.
const LIGHTHOUSE_CORAL = createLevel({ id: "lumen-reef-06", name: "Lighthouse coral", author: AUTHOR, ballSpeed: 382 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....a*a....",
        "....aaa....",
        "....ppp....",
        "...pPPPp...",
        "....ppp....",
        "....ppp....",
        "..ppppppp..",
        ".ppppppppp.",
      ],
      { a: glass("amber"), "*": piece("explosive", "amber"), p: glass("pink"), P: hard("pink") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .bonus("fast2", 180, 400)
  .zone("grow", 60, 460)
  .bonus("slow", 300, 460)
  .build();

// 47 — The Gnaw -------------------------------------------------------------------
// A worm's mouth chewed into the coral: a hollow of pink with rotor teeth, and
// at the top of it the first dark throat, a black hole in steel. Five lives.
const THE_GNAW = createLevel({ id: "lumen-reef-07", name: "The Gnaw", author: AUTHOR, ballSpeed: 384, lives: 5 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...ppppp...",
        ".ppPP#PPpp.",
        "pP..#.#..Pp",
        "p...#.#...p",
        "px.......xp",
        ".ppPPPPPpp.",
        "...ppppp...",
      ],
      { p: glass("pink"), P: hard("pink"), x: piece("rotor", "violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .bonus("slow", 60, 340)
  .zone("grow", 300, 340)
  .bonus("fast2", 180, 440)
  .build();

// 48 — Tide of teeth --------------------------------------------------------------
// A wall of teeth: hard violet points, explosive gums, a guard sweeping the
// reef edge, ×3 in the surf.
const TIDE_OF_TEETH = createLevel({ id: "lumen-reef-08", name: "Tide of teeth", author: AUTHOR, ballSpeed: 386 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "*vvvvvvvvv*",
        "vvvvvvvvvvv",
        "V.V.V.V.V.V",
        "...........",
        "..ppppppp..",
        ".pPpPpPpPp.",
      ],
      { "*": piece("explosive", "amber"), v: glass("violet"), V: hard("violet"), p: glass("pink"), P: hard("pink") },
      TOP,
    ),
  )
  .guard(180, 330, { w: 48, h: 8, range: 90, speed: 1.6 })
  .bonus("fast3", 180, 400)
  .zone("shrink", 60, 450)
  .bonus("slow", 300, 450)
  .build();

// 49 — The deep -------------------------------------------------------------------
// A descent: bands of blue narrowing downward, fog where the reef light ends,
// gravity pulling, a portal back up to the surface.
const THE_DEEP = createLevel({ id: "lumen-reef-09", name: "The deep", author: AUTHOR, ballSpeed: 388 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "bbbbbbbbbbb",
        ".bbbbbbbbb.",
        "..BBBBBBB..",
        "...bbbbb...",
        "....ooo....",
        ".....o.....",
      ],
      { b: glass("blue"), B: hard("blue"), o: piece("ghost", "blue") },
      TOP,
    ),
  )
  .zone("gravity", 180, 330)
  .zone("fog", 100, 420, 22)
  .portal(260, 420, 300, 64)
  .bonus("slow", 60, 330)
  .build();

// 50 — Pearl ----------------------------------------------------------------------
// A clam: steel jaws top and bottom, hard lips, the pearl (a hard pink core in
// a ring of locks, one key on each hinge). The wall descends every 26 hits;
// four and a half minutes.
const PEARL = createLevel({ id: "lumen-reef-10", name: "Pearl", author: AUTHOR, ballSpeed: 390 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..#######..",
        ".CCCCCCCCC.",
        "k.ccKKKcc.k",
        "..ccKPKcc..",
        "..ccKKKcc..",
        ".CCCCCCCCC.",
      ],
      { "#": steel("cyan"), C: hard("cyan"), c: glass("cyan"), K: piece("lock", "pink"), P: hard("pink"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .bumper(110, 330)
  .bumper(250, 330)
  .zone("split", 180, 380)
  .bonus("fast2", 60, 450)
  .bonus("slow", 300, 450)
  .rules({ descend: 26, timer: 270 })
  .build();

export const LUMEN_REEF: StoryEpisodeDef = {
  slug: "lumen-reef",
  title: "Lumen Reef",
  order: 5,
  tagline: "A sea of living light, a people who sing in it, and Kal's first fight.",
  background: BG,
  chapters: [
    {
      slug: "shallows",
      title: "Shallows",
      intro: "The first stop on the route is a shallow ocean lit from below. Kal's Lantern skims the surface.",
      xp: 1500,
      level: SHALLOWS,
    },
    {
      slug: "the-corallines",
      title: "The Corallines",
      intro: "The reef is alive, and it is a people. The Corallines glow to speak. Kal answers the only way he can: he breaks a wall.",
      xp: 1550,
      level: THE_CORALLINES,
    },
    {
      slug: "jellies",
      title: "Jellies",
      intro: "Bells of glass drift up the current. They sting, they sing, and they carry news of a gecko to the reef elders.",
      xp: 1600,
      level: JELLIES,
    },
    {
      slug: "the-shell-market",
      title: "The shell market",
      intro: "The Corallines trade in light. Kal has none to spare, so he offers the only thing he has: a story.",
      xp: 1650,
      level: SHELL_MARKET,
    },
    {
      slug: "reef-song",
      title: "Reef song",
      intro: "The elders answer in song. A dark fleet passed here once, they sing — and after it, a fleet of geckos, in a hurry.",
      xp: 1700,
      level: REEF_SONG,
    },
    {
      slug: "lighthouse-coral",
      title: "Lighthouse coral",
      intro: "The geckos left a light on the tallest coral. Kal climbs it and finds his own kind's claw marks in the glass.",
      xp: 1750,
      level: LIGHTHOUSE_CORAL,
    },
    {
      slug: "the-gnaw",
      title: "The Gnaw",
      intro: "The reef has a wound. Something has been chewing the light out of it. The Hush has scouts.",
      xp: 1800,
      level: THE_GNAW,
    },
    {
      slug: "tide-of-teeth",
      title: "Tide of teeth",
      intro: "The Gnaw come at dusk. Kal and the Corallines stand on the reef wall together. It is his first fight.",
      xp: 1850,
      level: TIDE_OF_TEETH,
    },
    {
      slug: "the-deep",
      title: "The deep",
      intro: "The Gnaw came from below. Kal follows them down, past where the reef's light reaches.",
      xp: 1900,
      level: THE_DEEP,
    },
    {
      slug: "pearl",
      title: "Pearl",
      intro: "In the deep, the Corallines kept a pearl: a map-stone the geckos left in thanks. It shows the next world. It is dark.",
      xp: 1950,
      level: PEARL,
    },
  ],
};
