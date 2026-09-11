/**
 * Episode 8 — Second Sun.
 *
 * The route ends at Aurel: one young sun, an unclaimed world the fleet chose
 * before Kal was born. The geckos come down on the plains, and a glass sky is
 * built one pane at a time — with the Corallines' light-seeds under it, and
 * one shadow of the Hush that followed them here. Sable tells Kal the last of
 * it: twelve pods launched during the Hush's first strike, eleven arrived,
 * the twelfth was his. Under Aurel's one sun the geckos light a second — the
 * dome, glowing from inside. Kal was never from Vitra. He is from the pod,
 * the Grey Moon, and the road. Home is where they are.
 *
 * Mechanics: the whole kit, at its fastest and with the least room. A gentle
 * landing, then panes of steel framing, regen seedlings with a split, a
 * pocketed black hole in fog behind a mirror, keys and fans on the dome, a
 * last wave with two guards and rotors and invert, Sable's tale under an
 * order rule with a decoy portal and a descending wall, a timed twin-sun wall
 * with two black holes, and a final family wall — five lives, a narrow
 * paddle, five minutes, and every piece Kal has met.
 *
 * Shapes: a young planet, ships landing, one pane, seedlings, a shadow, a
 * half-built dome, a wave of dark, a scroll, two suns, a family on the glass.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/second-sun.jpg";

// 71 — Aurel ----------------------------------------------------------------------
// A young planet: a lime and cyan globe with a hard core, thin clouds above,
// two bumpers in orbit.
const AUREL = createLevel({ id: "second-sun-01", name: "Aurel", author: AUTHOR, ballSpeed: 408 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        ".c.c.....c.",
        "....lllll..",
        "...lllllll.",
        "..llLLLlll.",
        "..llLLLlll.",
        "...lllllll.",
        "....lllll..",
      ],
      { c: glass("cyan"), l: glass("lime"), L: hard("lime") },
      TOP,
    ),
  )
  .bumper(110, 330)
  .bumper(250, 330)
  .zone("ice", 60, 430)
  .bonus("fast2", 300, 430)
  .build();

// 72 — Landing --------------------------------------------------------------------
// Ships coming down in three columns, engines (regen) still hot, gravity
// pulling them to the plains. Ice where they touch down.
const LANDING = createLevel({ id: "second-sun-02", name: "Landing", author: AUTHOR, ballSpeed: 410 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        ".r...r...r.",
        "aAa.aAa.aAa",
        ".a...a...a.",
        "...........",
        "...r...r...",
        "..aAa.aAa..",
        "...a...a...",
        "...........",
        "lllllllllll",
      ],
      { r: piece("regen", "lime"), a: glass("amber"), A: hard("amber"), l: glass("lime") },
      TOP,
    ),
  )
  .zone("gravity", 180, 340)
  .zone("ice", 60, 440)
  .zone("shrink", 300, 440)
  .build();

// 73 — The first pane -------------------------------------------------------------
// One pane of the new sky: a steel frame, glass inside, a hard sill. Sticky
// lets Kal set the ball where he wants it; grow makes the paddle a hand.
const THE_FIRST_PANE = createLevel({ id: "second-sun-03", name: "The first pane", author: AUTHOR, ballSpeed: 412 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        ".#########.",
        ".#ccccccc#.",
        ".#cCcccCc#.",
        ".#ccccccc#.",
        ".#cCcccCc#.",
        ".#ccccccc#.",
        ".#.......#.",
        "CCCCCCCCCCC",
      ],
      { "#": steel("cyan"), c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .zone("sticky", 180, 340)
  .zone("grow", 60, 440)
  .bonus("fast2", 300, 440)
  .build();

// 74 — Seedlings ------------------------------------------------------------------
// Light-seeds taking root: regen buds on glass stems, hard soil. A split zone
// so two balls tend the rows; anti-gravity lifts them into the buds.
const SEEDLINGS = createLevel({ id: "second-sun-04", name: "Seedlings", author: AUTHOR, ballSpeed: 414 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        ".r...r...r.",
        ".p.r.p.r.p.",
        ".p.p.p.p.p.",
        ".p.p.p.p.p.",
        "LLLLLLLLLLL",
        "lllllllllll",
      ],
      { r: piece("regen", "pink"), p: glass("pink"), L: hard("lime"), l: glass("lime") },
      TOP,
    ),
  )
  .zone("antigrav", 180, 330)
  .zone("split", 180, 400)
  .bonus("slow", 60, 460)
  .bonus("fast2", 300, 460)
  .build();

// 75 — The Hush's shadow ----------------------------------------------------------
// One shadow that followed the fleet: a hollow shape of violet with a black
// hole in a steel throat at the top of it, a mirror and a fog bank hiding the
// approach. Five lives.
const THE_HUSHS_SHADOW = createLevel({ id: "second-sun-05", name: "The Hush's shadow", author: AUTHOR, ballSpeed: 416, lives: 5 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "...vvvvv...",
        ".vvVV#VVvv.",
        "vV..#.#..Vv",
        "v...#.#...v",
        "vV.......Vv",
        ".vvVVVVVvv.",
        "...vvvvv...",
      ],
      { V: hard("violet"), v: glass("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .zone("mirror", 180, 330)
  .zone("fog", 180, 400, 22)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 76 — The dome -------------------------------------------------------------------
// The sky half built: an arc of glass panes with steel ribs, locked panes
// waiting for keys at both feet. Fans from both sides push along the curve.
const THE_DOME = createLevel({ id: "second-sun-06", name: "The dome", author: AUTHOR, ballSpeed: 418 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "....ccc....",
        "..cc#K#cc..",
        ".cc.....cc.",
        "cK#.....#Kc",
        "c#.......#c",
        "k.........k",
      ],
      { c: glass("cyan"), "#": steel("cyan"), K: piece("lock", "cyan"), k: piece("key", "amber") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .bonus("fast2", 180, 400)
  .zone("shrink", 60, 460)
  .bonus("slow", 300, 460)
  .build();

// 77 — The last wave --------------------------------------------------------------
// The shadow's friends: a wave of hard violet with rotors in the crest and
// explosive dark in the trough, two guards below, invert under the crest.
const THE_LAST_WAVE = createLevel({ id: "second-sun-07", name: "The last wave", author: AUTHOR, ballSpeed: 420 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "x.......x..",
        "VV.....VVV.",
        "VVV...VVVVV",
        "vVVV.VVVvvv",
        "vv*VVVv*vvv",
        ".vvvvvvvvv.",
      ],
      { x: piece("rotor", "amber"), V: hard("violet"), v: glass("violet"), "*": piece("explosive", "pink") },
      TOP,
    ),
  )
  .guard(104, 320, { w: 48, h: 8, range: 60, speed: 1.7 })
  .guard(256, 320, { w: 48, h: 8, range: 60, speed: 1.7 })
  .zone("invert", 180, 380)
  .bonus("fast3", 180, 440)
  .zone("shrink", 60, 460)
  .bonus("slow", 300, 460)
  .build();

// 78 — Sable's tale ---------------------------------------------------------------
// A scroll: pods in rows, all amber but one — the pink one, in the case's
// bottom edge, falls first. A hard case open at the top, a true portal and a
// decoy, the wall descending.
const SABLES_TALE = createLevel({ id: "second-sun-08", name: "Sable's tale", author: AUTHOR, ballSpeed: 422 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "AAAA...AAAA",
        "a.a.a.a.a.a",
        "aaaaaaaaaaa",
        ".a.a.a.a.a.",
        "AAAAAAApAAA",
      ],
      { A: hard("amber"), a: glass("amber"), p: hard("pink") },
      TOP,
    ),
  )
  .portal(60, 420, 180, 64)
  .zone("fakePortal", 300, 420)
  .zone("mirror", 180, 340)
  .bonus("slow", 180, 460)
  .rules({ order: "pink", descend: 24 })
  .build();

// 79 — Twin suns remembered -------------------------------------------------------
// Two suns: the old one large and gone dark, hollow, a black hole in a steel
// throat where its heart was; the new one small, bright and hard at its
// shoulder. A lime dome band under them. Bumpers, ×2, four minutes, five lives.
const TWIN_SUNS_REMEMBERED = createLevel({
  id: "second-sun-09",
  name: "Twin suns remembered",
  author: AUTHOR,
  ballSpeed: 424,
  lives: 5,
})
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "..vvvvv..aa",
        ".vVV#VVv.aA",
        "vv.#.#...vA",
        "v..#.#....v",
        "vv.......vv",
        ".vvVVVVVvv.",
        "..vvvvv....",
        "..lllllll..",
        ".LLLLLLLLL.",
      ],
      { v: glass("violet"), V: hard("violet"), a: glass("amber"), A: hard("amber"), "#": steel("violet"), l: glass("lime"), L: hard("lime") },
      TOP,
    ),
  )
  .blackhole(150, 140)
  .bumper(110, 340)
  .bumper(250, 340)
  .bonus("fast2", 180, 400)
  .bonus("slow", 60, 460)
  .zone("grow", 300, 460)
  .rules({ timer: 240 })
  .build();

// 80 — Home -----------------------------------------------------------------------
// A family on the glass: a row of small geckos (hard heads, glass bodies,
// regen tails that keep moving) on a band of the new sky, a key that opens
// two locks in the dome, explosives at the eaves. Bumpers, a guard on the
// dome's edge, shrink and ice, ×3, three lives, the narrowest paddle, four
// minutes. The last wall asks for everything Kal has learned.
const HOME = createLevel({ id: "second-sun-10", name: "Home", author: AUTHOR, ballSpeed: 426, lives: 3, paddleWidth: 60 })
  .background(BG, { dim: 0.52 })
  .brickRows(
    wall(
      [
        "..ccKckKcc.",
        ".ccccccccc.",
        "*ccccccccc*",
        "...........",
        "V.r.V.r.V.r",
        "Vvv.Vvv.Vvv",
        ".vr..vr..vr",
        "lllllllllll",
      ],
      {
        c: glass("cyan"),
        K: piece("lock", "cyan"),
        k: piece("key", "amber"),
        "*": piece("explosive", "amber"),
        V: hard("violet"),
        v: glass("violet"),
        r: piece("regen", "pink"),
        l: glass("lime"),
      },
      TOP,
    ),
  )
  .bumper(110, 340)
  .bumper(250, 340)
  .guard(180, 300, { w: 48, h: 8, range: 90, speed: 1.6 })
  .zone("shrink", 180, 400)
  .zone("ice", 60, 460)
  .bonus("fast3", 300, 460)
  .bonus("slow", 180, 470)
  .rules({ timer: 240 })
  .build();

export const SECOND_SUN: StoryEpisodeDef = {
  slug: "second-sun",
  title: "Second Sun",
  order: 8,
  tagline: "A young world, one sun, and a glass sky that has to be built.",
  background: BG,
  chapters: [
    {
      slug: "aurel",
      title: "Aurel",
      intro: "The route ends at Aurel: one sun, young, unclaimed. The fleet chose it before Kal was born.",
      xp: 3000,
      level: AUREL,
    },
    {
      slug: "landing",
      title: "Landing",
      intro: "The fleet comes down on the plains. For the first time, Kal walks among more geckos than he can count.",
      xp: 3100,
      level: LANDING,
    },
    {
      slug: "the-first-pane",
      title: "The first pane",
      intro: "A glass sky is built one pane at a time. Kal, who broke through one, learns to set one.",
      xp: 3200,
      level: THE_FIRST_PANE,
    },
    {
      slug: "seedlings",
      title: "Seedlings",
      intro: "The Corallines sent light-seeds with the pearl. They take root under Aurel's sun.",
      xp: 3300,
      level: SEEDLINGS,
    },
    {
      slug: "the-hushs-shadow",
      title: "The Hush's shadow",
      intro: "The dark did not die. One shadow followed the fleet here. It goes for the seedlings first.",
      xp: 3400,
      level: THE_HUSHS_SHADOW,
    },
    {
      slug: "the-dome",
      title: "The dome",
      intro: "The dome closes over the plains. Every gecko who can climb is on it. Kal is fastest.",
      xp: 3500,
      level: THE_DOME,
    },
    {
      slug: "the-last-wave",
      title: "The last wave",
      intro: "The shadow brings friends. The fleet's last wall is the half-finished sky.",
      xp: 3600,
      level: THE_LAST_WAVE,
    },
    {
      slug: "sables-tale",
      title: "Sable's tale",
      intro: "Sable tells him: the pods launched during the Hush's first strike. Twelve eggs. Eleven arrived. The twelfth was Kal.",
      xp: 3700,
      level: SABLES_TALE,
    },
    {
      slug: "twin-suns-remembered",
      title: "Twin suns remembered",
      intro: "The old suns are far behind. Under Aurel's one sun, the geckos light a second: the dome, glowing from inside.",
      xp: 3800,
      level: TWIN_SUNS_REMEMBERED,
    },
    {
      slug: "home",
      title: "Home",
      intro: "Kal was never from Vitra. He is from the pod, the Grey Moon, and the road. Home is where they are. He is home.",
      xp: 4000,
      level: HOME,
    },
  ],
};
