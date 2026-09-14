/**
 * Episode 17 — Grey Moon.
 *
 * The road back passes the place it started. Kal has not seen the Grey Moon
 * since the morning he lifted off from it, and nothing has changed: the dust,
 * the ringed giant, his own first prints still wandering away from the pod.
 * Nul is there before them. He did not come to fight. He came to see where he
 * should have hatched, and he has one question for the gecko whose face he
 * wears: which of us is the copy? Then he takes the pod's beacon — the rhythm
 * Kal has known since before he hatched — and the eye of the Hush opens over
 * the dust. Kal leaves the moon a second time. It is harder than the first.
 *
 * Mechanics: the quietest episode of the season, until it is not. A trail of
 * glass, the pod in steel with sticky and grow, an explosive lamp on a steel
 * mast, the giant's ring with anti-gravity and rails, a gecko in ghosts with a
 * magnet eye, two geckos face to face with a mirror and a portal, hollow
 * prints in fog on ice, a black hole in a steel throat (five lives), the stolen
 * beacon under locks with rotors and invert, and a cold dawn on descend with a
 * guard and four minutes.
 *
 * Shapes: prints, the pod, a lamp on a mast, a ringed planet, a hollow gecko,
 * two geckos, hollow prints, an eye, a locked lamp, a crescent.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/grey-moon.jpg";

// 161 — Old prints ------------------------------------------------------------------
// The trail Kal left the morning he hatched, still in the dust, still
// wandering. Slow under the trail.
const OLD_PRINTS = createLevel({ id: "grey-moon-01", name: "Old prints", author: AUTHOR, ballSpeed: 440 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "bb.........",
        "..bb.......",
        "....bb.....",
        "......bb...",
        "....bb.....",
        "..bb.......",
        "....bb..bb.",
      ],
      { b: glass("blue") },
      TOP,
    ),
  )
  .bonus("slow", 180, 360)
  .zone("grow", 60, 460)
  .bonus("fast2", 300, 460)
  .build();

// 162 — The pod again ---------------------------------------------------------------
// The capsule half-buried in the regolith, steel hull, cyan windows. Sticky
// under it, grow on the left.
const THE_POD_AGAIN = createLevel({ id: "grey-moon-02", name: "The pod again", author: AUTHOR, ballSpeed: 441 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....###....",
        "...#ccc#...",
        "..#ccCcc#..",
        "..#ccccc#..",
        "..#cCcCc#..",
        "..#ccccc#..",
        "...ccccc...",
      ],
      { "#": steel("cyan"), c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .zone("sticky", 180, 350)
  .zone("grow", 60, 450)
  .bonus("slow", 300, 450)
  .build();

// 163 — The beacon ------------------------------------------------------------------
// The pod's lamp on its steel mast, still pulsing: explosives in the light, a
// hard base. Grow under the mast.
const THE_BEACON = createLevel({ id: "grey-moon-03", name: "The beacon", author: AUTHOR, ballSpeed: 442 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....aea....",
        "...aeAea...",
        "....aea....",
        ".....#.....",
        ".....#.....",
        ".....#.....",
        "...AAAAA...",
      ],
      { a: glass("amber"), e: piece("explosive", "amber"), A: hard("amber"), "#": steel("amber") },
      TOP,
    ),
  )
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .zone("grow", 180, 460)
  .build();

// 164 — Ring shadow -----------------------------------------------------------------
// The blue giant with its ring of ice across it. Anti-gravity under the
// planet, two rails below.
const RING_SHADOW = createLevel({ id: "grey-moon-04", name: "Ring shadow", author: AUTHOR, ballSpeed: 443 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...bbbbb...",
        "..bbbbbbb..",
        "CC.bbbbb.CC",
        "..CCCCCCC..",
        "..bbbbbbb..",
        "...bbbbb...",
      ],
      { b: glass("blue"), C: hard("cyan") },
      TOP,
    ),
  )
  .zone("antigrav", 180, 350)
  .rail(40, 400, 80)
  .rail(240, 400, 80)
  .bonus("slow", 180, 460)
  .build();

// 165 — Nul on the dust -------------------------------------------------------------
// A gecko in profile, drawn in ghosts: there and not there. A magnet where the
// eye should be.
const NUL_ON_THE_DUST = createLevel({ id: "grey-moon-05", name: "Nul on the dust", author: AUTHOR, ballSpeed: 444 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..oom......",
        ".ooooooo...",
        "..oooooooo.",
        ".o.oooooo.o",
        ".o.oooooo.o",
        "........ooo",
        "o......oo..",
      ],
      { o: piece("ghost", "violet"), m: piece("magnet", "violet") },
      TOP,
    ),
  )
  .bonus("slow", 60, 450)
  .zone("grow", 180, 350)
  .bonus("fast2", 300, 450)
  .build();

// 166 — The question ----------------------------------------------------------------
// Two geckos face to face on the dust: Kal in blue, Nul in violet with hard
// bones and ghost skin. A mirror between them, a portal from one to the other.
const THE_QUESTION = createLevel({ id: "grey-moon-06", name: "The question", author: AUTHOR, ballSpeed: 445 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..bBb..oOo.",
        ".bBbb..ooOo",
        ".bbbb..oooo",
        "b.bbb..ooo.",
        "..bBb..oOo.",
        "..bb...oo..",
        "..b.b..o.o.",
      ],
      { b: glass("blue"), B: hard("blue"), o: piece("ghost", "violet"), O: hard("violet") },
      TOP,
    ),
  )
  .zone("mirror", 180, 340)
  .portal(60, 420, 300, 420)
  .bonus("slow", 180, 470)
  .build();

// 167 — Hollow prints ---------------------------------------------------------------
// Prints that were never made: a second trail across the first, in ghosts.
// Fog over the dust, ice under it.
const HOLLOW_PRINTS = createLevel({ id: "grey-moon-07", name: "Hollow prints", author: AUTHOR, ballSpeed: 446 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".........oo",
        ".......oo..",
        ".....oo....",
        "...oo......",
        ".oo........",
        "...oo......",
        ".....oo..oo",
      ],
      { o: piece("ghost", "violet") },
      TOP,
    ),
  )
  .zone("fog", 180, 350, 22)
  .zone("ice", 60, 450)
  .bonus("slow", 300, 450)
  .build();

// 168 — Nul's eye -------------------------------------------------------------------
// The eye of the Hush opens over the moon: blue lids, a violet iris, and for
// a pupil the dark in a steel throat. Ice under it, five lives.
const NULS_EYE = createLevel({ id: "grey-moon-08", name: "Nul's eye", author: AUTHOR, ballSpeed: 447, lives: 5 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...bbbbb...",
        ".bbvV#Vvbb.",
        "bB..#.#..Bb",
        "b...#.#...b",
        "bB.......Bb",
        ".bbvvvvvbb.",
        "...bbbbb...",
      ],
      { b: glass("blue"), B: hard("blue"), v: glass("violet"), V: hard("violet"), "#": steel("violet") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .zone("ice", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 169 — The stolen beacon -----------------------------------------------------------
// Nul takes the lamp: the light locked inside a ring of locks on the mast,
// rotors either side, the key at the base. Invert under it.
const THE_STOLEN_BEACON = createLevel({ id: "grey-moon-09", name: "The stolen beacon", author: AUTHOR, ballSpeed: 448 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....KKK....",
        "...KaeaK...",
        "....KKK....",
        ".....#.....",
        "..x..#..x..",
        ".....#.....",
        "...AAkAA...",
      ],
      {
        K: piece("lock", "amber"),
        a: glass("amber"),
        e: piece("explosive", "amber"),
        "#": steel("amber"),
        x: piece("rotor", "violet"),
        A: hard("amber"),
        k: piece("key", "amber"),
      },
      TOP,
    ),
  )
  .zone("invert", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 170 — Cold dawn -------------------------------------------------------------------
// The crescent and one star, the way the moon gave him his first sunrise. A
// guard under it, shrink, the wall descending; four minutes.
const COLD_DAWN = createLevel({ id: "grey-moon-10", name: "Cold dawn", author: AUTHOR, ballSpeed: 449 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..........C",
        "...bbbb....",
        ".bbBBBbb...",
        "bbB.....b..",
        "bB.........",
        "bB.........",
        "bbB........",
        ".bbBB......",
        "...bbbb....",
      ],
      { C: hard("cyan"), b: glass("blue"), B: hard("blue") },
      TOP,
    ),
  )
  .guard(180, 320, { w: 48, h: 8, range: 90, speed: 1.6 })
  .zone("shrink", 180, 420)
  .bonus("slow", 60, 440)
  .bonus("fast2", 300, 440)
  .rules({ descend: 20, timer: 240 })
  .build();

export const GREY_MOON: StoryEpisodeDef = {
  slug: "grey-moon",
  title: "Grey Moon",
  order: 17,
  tagline: "The place it started, a question with no good answer, and the eye opening over the dust.",
  background: BG,
  chapters: [
    {
      slug: "old-prints",
      title: "Old prints",
      intro: "Nothing has changed. The dust, the ring, and a trail of small prints wandering away from the pod. Kal made them the morning he hatched.",
      xp: 12100,
      level: OLD_PRINTS,
    },
    {
      slug: "the-pod-again",
      title: "The pod again",
      intro: "The capsule is where he left it, half-buried, built for one egg. Lys puts a claw on the hull and reads the marks the way he never could.",
      xp: 12200,
      level: THE_POD_AGAIN,
    },
    {
      slug: "the-beacon",
      title: "The beacon",
      intro: "The lamp still pulses in his rhythm. It was never a call for help. It was a return address.",
      xp: 12300,
      level: THE_BEACON,
    },
    {
      slug: "ring-shadow",
      title: "Ring shadow",
      intro: "The blue giant fills half the sky, wearing its ring of ice. Kal knows now why it made him sad. It was the first thing that ever looked like home and was not.",
      xp: 12400,
      level: RING_SHADOW,
    },
    {
      slug: "nul-on-the-dust",
      title: "Nul on the dust",
      intro: "Someone is standing on the pod. He has Kal's face and none of his light, and he did not come to fight. He came to see where he should have hatched.",
      xp: 12500,
      level: NUL_ON_THE_DUST,
    },
    {
      slug: "the-question",
      title: "The question",
      intro: "Nul asks it quietly, the way the Curator would have: which of us is the copy? Kal does not have an answer. He has a wall.",
      xp: 12600,
      level: THE_QUESTION,
    },
    {
      slug: "hollow-prints",
      title: "Hollow prints",
      intro: "A second trail crosses the first in the dust, made by feet that were never here. Nul walked Kal's road backward to find him.",
      xp: 12700,
      level: HOLLOW_PRINTS,
    },
    {
      slug: "nuls-eye",
      title: "Nul's eye",
      intro: "The eye opens over the moon. Through Nul, the Hush is looking at the one place in the sky it has never been able to see.",
      xp: 12800,
      level: NULS_EYE,
    },
    {
      slug: "the-stolen-beacon",
      title: "The stolen beacon",
      intro: "Nul takes the lamp. The rhythm Kal has known since before he hatched goes with him, into the dark, toward Aurel.",
      xp: 12900,
      level: THE_STOLEN_BEACON,
    },
    {
      slug: "cold-dawn",
      title: "Cold dawn",
      intro: "The Grey Moon gives him a second sunrise. Kal leaves it a second time. It is harder than the first, because this time he knows what he is leaving.",
      xp: 13000,
      level: COLD_DAWN,
    },
  ],
};
