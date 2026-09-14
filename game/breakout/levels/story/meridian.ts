/**
 * Episode 14 — Meridian.
 *
 * The Sowers' garden world: seed-pods the size of moons drifting in a warm
 * sky, and under them the Council of Seeds, who wrote the loan a generation
 * ago and have never had one refused. Kal refuses. He is not a specimen, not
 * a seed, not property lent and due; he is from the pod, the Grey Moon and the
 * road, and the road brought him here with someone. Lys chooses him over the
 * Council that raised her. Then the Curator's fleet comes down through the
 * pods with Nul at its head, the Hush riding every hollow hull — and the
 * Curator learns, too late, what he grew: the dark he thought he was selling
 * an answer to takes him first. Kal and Lys hold the last wall over the
 * garden. Nul is not in the wreckage. Somewhere above Meridian, something
 * with Kal's face turns toward Aurel.
 *
 * Mechanics: everything, with less room every wall. Seed-pods with regen and
 * bumpers; the Council's ring of keys and locks; the loan under an order rule
 * behind a mirror; the document as a steel frame with an explosive seal and
 * fans; Lys's choice — two geckos, a portal, sticky, a split; the fleet on
 * descend with rotors and guards; the hollow fleet as ghosts and magnets in
 * fog with invert and ×3; the Curator's end — a black hole in his chest, five
 * lives, four minutes; Nul's escape — a broken constellation under order,
 * rails, ice, shrink; and Two lights: the whole kit, three lives, the
 * narrowest paddle, five minutes.
 *
 * Shapes: drifting pods, a council ring, a scale, a torn document, two
 * geckos, ships descending, a hollow fleet, the Curator, a broken gecko of
 * stars, two geckos on the wall.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/meridian.jpg";

// 131 — The garden ----------------------------------------------------------------
// Seed-pods drifting in the warm sky: lime globes with regen blossoms and
// hard hulls. Two bumpers between them.
const THE_GARDEN = createLevel({ id: "meridian-01", name: "The garden", author: AUTHOR, ballSpeed: 412 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        ".lll.....ll",
        "lLrl....lrL",
        ".lll.....ll",
        "...........",
        "....lll....",
        "...lLrlL...",
        "....lll....",
      ],
      { l: glass("lime"), L: hard("lime"), r: piece("regen", "lime") },
      TOP,
    ),
  )
  .bumper(90, 350)
  .bumper(270, 350)
  .bonus("slow", 180, 450)
  .build();

// 132 — The Council of Seeds ------------------------------------------------------
// A ring of hard seats around a seed of locks; the keys are the Council's
// votes, out on the rim.
const THE_COUNCIL_OF_SEEDS = createLevel({ id: "meridian-02", name: "The Council of Seeds", author: AUTHOR, ballSpeed: 414 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "k..LlLlL..k",
        "..L.....L..",
        ".l...X...l.",
        ".L..XXX..L.",
        ".l...X...l.",
        "..L.....L..",
        "k..LlLlL..k",
      ],
      { k: piece("key", "amber"), L: hard("lime"), l: glass("lime"), X: piece("lock", "amber") },
      TOP,
    ),
  )
  .zone("grow", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 133 — The loan ------------------------------------------------------------------
// A scale again, and this time Kal is in one pan: blue on the left, the
// Council's cyan on the right, a steel beam. Blue first — Kal weighs in first.
// A mirror under the beam.
const THE_LOAN = createLevel({ id: "meridian-03", name: "The loan", author: AUTHOR, ballSpeed: 416 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "###########",
        ".b...#...c.",
        ".b...#...c.",
        "bbb..#..ccc",
        "bbb..#..cCc",
        "bbb.....ccc",
      ],
      { "#": steel("cyan"), b: glass("blue"), B: hard("blue"), c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .rules({ order: "blue" })
  .zone("mirror", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 134 — Not property --------------------------------------------------------------
// The document in its steel frame, and the seal that holds it: explosive. Two
// fans keep the ball off the seal until it is aimed.
const NOT_PROPERTY = createLevel({ id: "meridian-04", name: "Not property", author: AUTHOR, ballSpeed: 418 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "###########",
        "#ccccccc..#",
        "#.........#",
        "#ccccc....#",
        "#...ceec..#",
        "#ccc.ee.cc#",
        "#.........#",
      ],
      { "#": steel("cyan"), c: glass("cyan"), e: piece("explosive", "amber") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .bonus("slow", 180, 440)
  .build();

// 135 — Lys's choice --------------------------------------------------------------
// Two geckos on the same wall, facing the same way now. A portal from one to
// the other, sticky above, a split below: two balls for two.
const LYSS_CHOICE = createLevel({ id: "meridian-05", name: "Lys's choice", author: AUTHOR, ballSpeed: 420 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "..bBb..pPp.",
        ".bBbb..pPpp",
        ".bbbb..pppp",
        "b.bbb..ppp.",
        "..bBb..pPp.",
        "..bb...pp..",
        "..b.b..p.p.",
      ],
      { b: glass("blue"), B: hard("blue"), p: glass("pink"), P: hard("pink") },
      TOP,
    ),
  )
  .portal(60, 420, 300, 420)
  .zone("sticky", 180, 340)
  .zone("split", 180, 470)
  .build();

// 136 — The Curator's fleet -------------------------------------------------------
// Ships coming down through the pods: hard hulls, rotor engines, the whole
// wall descending. Two guards under it.
const THE_CURATORS_FLEET = createLevel({ id: "meridian-06", name: "The Curator's fleet", author: AUTHOR, ballSpeed: 422 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        ".aRa...aRa.",
        "aAAAa.aAAAa",
        ".aaa...aaa.",
        "...........",
        "....aRa....",
        "...aAAAa...",
        "....aaa....",
      ],
      { a: glass("amber"), A: hard("amber"), R: piece("rotor", "amber") },
      TOP,
    ),
  )
  .guard(104, 330, { w: 48, h: 8, range: 60, speed: 1.6 })
  .guard(256, 330, { w: 48, h: 8, range: 60, speed: 1.6 })
  .bonus("slow", 180, 450)
  .rules({ descend: 20 })
  .build();

// 137 — The hollow fleet ----------------------------------------------------------
// Nul's ships: ghosts that are there and not, magnet hearts that pull the ball
// in, fog over the garden, invert, ×3.
const THE_HOLLOW_FLEET = createLevel({ id: "meridian-07", name: "The hollow fleet", author: AUTHOR, ballSpeed: 424 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        ".ovo...ovo.",
        "ovmvo.ovmvo",
        ".ovo...ovo.",
        "...........",
        "....ovo....",
        "...ovmvo...",
        "....ovo....",
      ],
      { o: piece("ghost", "violet"), v: glass("violet"), m: piece("magnet", "violet") },
      TOP,
    ),
  )
  .zone("fog", 180, 350, 22)
  .bonus("fast3", 180, 420)
  .zone("invert", 60, 470)
  .bonus("slow", 300, 470)
  .build();

// 138 — The Curator's end ---------------------------------------------------------
// The Curator, tall and thin, and where his heart should be, what he grew: a
// black hole in a steel throat above an open chamber. Five lives, four
// minutes.
const THE_CURATORS_END = createLevel({ id: "meridian-08", name: "The Curator's end", author: AUTHOR, ballSpeed: 426, lives: 5 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "....VVV....",
        "...vVV#VVv.",
        "..vv#.#..v.",
        "..v.#.#..v.",
        "..v......v.",
        ".vvvVVVvvv.",
        ".vvvvvvvvv.",
        "vv.......vv",
      ],
      { V: hard("violet"), v: glass("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(175, 140)
  .zone("mirror", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .rules({ timer: 240 })
  .build();

// 139 — Nul's escape --------------------------------------------------------------
// The Wall-walker again, broken: half the stars dark and hard. A mirror under
// it, rails, ice, shrink.
const NULS_ESCAPE = createLevel({ id: "meridian-09", name: "Nul's escape", author: AUTHOR, ballSpeed: 428 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "A..V.....A.",
        ".bbvvvvbb..",
        "A.bAvAb.V.v",
        "..b....b...",
        "..V....A.bb",
        "..........A",
      ],
      { A: hard("amber"), V: hard("violet"), b: glass("blue"), v: glass("violet") },
      TOP,
    ),
  )
  .zone("mirror", 180, 340)
  .rail(40, 400, 90)
  .rail(230, 400, 90)
  .zone("ice", 60, 460)
  .zone("shrink", 300, 460)
  .build();

// 140 — Two lights ----------------------------------------------------------------
// Kal and Lys on the last wall over the garden: two geckos, hard heads, regen
// tails, a key that opens two locks in the pods above, explosives at the
// eaves. Bumpers, a guard, shrink, ice, ×3, three lives, the narrowest
// paddle, five minutes.
const TWO_LIGHTS = createLevel({ id: "meridian-10", name: "Two lights", author: AUTHOR, ballSpeed: 430, lives: 3, paddleWidth: 60 })
  .background(BG, { dim: 0.5 })
  .brickRows(
    wall(
      [
        "lXl.....lXl",
        "eLll...llLe",
        "lllll.lllll",
        "...........",
        ".bBb...pPp.",
        "bbbbr.rpppp",
        ".b.b...p.p.",
        "....k......",
      ],
      { l: glass("lime"), L: hard("lime"), X: piece("lock", "amber"), e: piece("explosive", "lime"), b: glass("blue"), B: hard("blue"), p: glass("pink"), P: hard("pink"), r: piece("regen", "cyan"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .bumper(90, 320)
  .bumper(270, 320)
  .guard(180, 300, { w: 48, h: 8, range: 90, speed: 1.6 })
  .zone("shrink", 180, 400)
  .zone("ice", 60, 460)
  .bonus("fast3", 300, 460)
  .rules({ timer: 300 })
  .build();

export const MERIDIAN: StoryEpisodeDef = {
  slug: "meridian",
  title: "Meridian",
  order: 14,
  tagline: "The garden world where the loan was written, and the wall where it is torn up.",
  background: BG,
  chapters: [
    {
      slug: "the-garden",
      title: "The garden",
      intro: "Seed-pods the size of moons drift in a warm sky. Everything here was grown on purpose, including the two of them.",
      xp: 9100,
      level: THE_GARDEN,
    },
    {
      slug: "the-council-of-seeds",
      title: "The Council of Seeds",
      intro: "Under the pods, the ones who wrote the loan. They have lent out a thousand things. They have never had one refused.",
      xp: 9200,
      level: THE_COUNCIL_OF_SEEDS,
    },
    {
      slug: "the-loan",
      title: "The loan",
      intro: "They weigh him. A seed the Hush cannot see, worth a fleet. Kal has been weighed before, by a queen. He knows what to do with a scale.",
      xp: 9300,
      level: THE_LOAN,
    },
    {
      slug: "not-property",
      title: "Not property",
      intro: "Not a specimen. Not a seed. Not lent, not due. He is from the pod, the Grey Moon and the road. The seal breaks the way glass breaks.",
      xp: 9400,
      level: NOT_PROPERTY,
    },
    {
      slug: "lyss-choice",
      title: "Lys's choice",
      intro: "The Council raised her. It asks her to bring him in. She climbs onto the wall beside him and does not look back.",
      xp: 9500,
      level: LYSS_CHOICE,
    },
    {
      slug: "the-curators-fleet",
      title: "The Curator's fleet",
      intro: "Then the sky fills with amber hulls coming down through the pods, and the Curator's voice, still polite, asks for what is his.",
      xp: 9600,
      level: THE_CURATORS_FLEET,
    },
    {
      slug: "the-hollow-fleet",
      title: "The hollow fleet",
      intro: "Behind the amber ships, ships with no light in them at all. Nul leads them. The Hush rides every hull.",
      xp: 9700,
      level: THE_HOLLOW_FLEET,
    },
    {
      slug: "the-curators-end",
      title: "The Curator's end",
      intro: "He grew the copies for the dark to sell an answer to. The dark does not buy. It takes him first, through the hollow he made.",
      xp: 9800,
      level: THE_CURATORS_END,
    },
    {
      slug: "nuls-escape",
      title: "Nul's escape",
      intro: "Half the Wall-walker goes dark above the garden. When the light comes back, Nul is not in the wreckage.",
      xp: 9900,
      level: NULS_ESCAPE,
    },
    {
      slug: "two-lights",
      title: "Two lights",
      intro: "Two geckos on the last wall over Meridian, and the loan in pieces under it. Somewhere above them, something with Kal's face turns toward Aurel.",
      xp: 10000,
      level: TWO_LIGHTS,
    },
  ],
};
