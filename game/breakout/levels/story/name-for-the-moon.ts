/**
 * Episode 24 — A Name for the Moon.
 *
 * The Gleaner follows the seed. Kal leads it the whole way back along the
 * road, lit by Lys so it can see him, with Nul — hollow, blind, the one thing
 * the dark cannot use — holding its eye shut from the inside. Past the wrecks,
 * the ash, the reef. Past Vitra, where a Gleaner does what a Gleaner was grown
 * to do at a garden: it delivers. The twin suns come back into the sky they
 * were taken from, and the Keepers watch the glass warm. Then on to the one
 * place in the sky with nothing to eat: a cold, nameless Grey Moon under a
 * ringed blue giant, where a tool that has finished its work settles into the
 * dust and sleeps. Kal gives the moon its name. Then he goes home to set the
 * last pane, with two geckos on the glass beside him, and two suns far off in
 * a sky that used to be his.
 *
 * Mechanics: the road as a constellation with bumpers, a seed drawn in light
 * under an order rule with sticky, Nul's eye shut in hard lids behind a
 * mirror, Vitra's suns relit as explosives with fans, the crescent on ice,
 * the pod in steel with regen and grow, the Gleaner at rest as a black hole in
 * a steel throat (five lives), a ring of locks around a moon with rails, the
 * last pane in a steel frame with sticky and descend, and three geckos on the
 * glass with everything: locks and a key, explosives, regen, bumpers, a
 * guard, shrink, ice, ×3, three lives, the narrowest paddle, five minutes.
 *
 * Shapes: a route of stars, a seed in light, a closed eye, twin suns, a
 * crescent, the pod, a dark moon, a moon with a ring of stars, one pane,
 * three geckos.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const TOP = 84;
const BG = "/backgrounds/name-for-the-moon.jpg";

// 231 — The long road ---------------------------------------------------------------
// The whole route as a constellation: cyan stars, two hard ones for Aurel and
// the moon at either end. Bumpers under the road.
const THE_LONG_ROAD = createLevel({ id: "name-for-the-moon-01", name: "The long road", author: AUTHOR, ballSpeed: 468 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "c....c....c",
        ".c..c.c..c.",
        "..cc...cc..",
        "..........C",
        "C..........",
        ".cc.....cc.",
        "...cc.cc...",
      ],
      { c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .bumper(90, 330)
  .bumper(270, 330)
  .bonus("slow", 180, 440)
  .build();

// 232 — Seed in light ---------------------------------------------------------------
// Kal as the Gleaner sees him now: a seed of amber inside a ring of cyan
// light. Lys draws the light first. Sticky under the ring.
const SEED_IN_LIGHT = createLevel({ id: "name-for-the-moon-02", name: "Seed in light", author: AUTHOR, ballSpeed: 469 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....ccc....",
        "..cc...cc..",
        ".c..aaa..c.",
        ".c.aAaAa.c.",
        ".c..aaa..c.",
        "..cc...cc..",
        "....ccc....",
      ],
      { c: glass("cyan"), a: glass("amber"), A: hard("amber") },
      TOP,
    ),
  )
  .rules({ order: "cyan" })
  .zone("sticky", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 233 — Nul's eye shut --------------------------------------------------------------
// The eye of the Hush held closed from the inside: hard violet lids, glass
// between them. A mirror under the eye.
const NULS_EYE_SHUT = createLevel({ id: "name-for-the-moon-03", name: "Nul's eye shut", author: AUTHOR, ballSpeed: 470 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...vvvvv...",
        ".vvVVVVVvv.",
        "vVVVVVVVVVv",
        "vvvvvvvvvvv",
        ".vvvvvvvvv.",
        "...vvvvv...",
      ],
      { v: glass("violet"), V: hard("violet") },
      TOP,
    ),
  )
  .zone("mirror", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 234 — Vitra relit -----------------------------------------------------------------
// The twin suns back in the glass sky, explosive at the core, hard around it.
// Two fans under them, ×2 where the light falls.
const VITRA_RELIT = createLevel({ id: "name-for-the-moon-04", name: "Vitra relit", author: AUTHOR, ballSpeed: 471 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".aaa...aaa.",
        "aaAaa.aaAaa",
        "aAeAa.aAeAa",
        "aaAaa.aaAaa",
        ".aaa...aaa.",
      ],
      { a: glass("amber"), A: hard("amber"), e: piece("explosive", "amber") },
      TOP,
    ),
  )
  .fan(12, 330, 1, { reach: 120, spread: 36, force: 2.2 })
  .fan(348, 330, -1, { reach: 120, spread: 36, force: 2.2 })
  .bonus("fast2", 180, 380)
  .bonus("slow", 180, 440)
  .build();

// 235 — The Grey Moon ---------------------------------------------------------------
// The crescent, one last time. Ice under it, slow on the left.
const THE_GREY_MOON = createLevel({ id: "name-for-the-moon-05", name: "The Grey Moon", author: AUTHOR, ballSpeed: 472 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....bbbb...",
        "..bbBBBbb..",
        ".bbB.....b.",
        "bbB........",
        "bB.........",
        "bB.........",
        "bbB........",
        ".bbBB......",
        "...bbbb....",
      ],
      { b: glass("blue"), B: hard("blue") },
      TOP,
    ),
  )
  .zone("ice", 180, 350)
  .bonus("slow", 60, 450)
  .zone("grow", 300, 450)
  .build();

// 236 — The pod's cradle ------------------------------------------------------------
// The pod with something growing in it at last: regen sprouts under a glass
// cap, cyan windows in a steel hull, a hard keel. Grow under it.
const THE_PODS_CRADLE = createLevel({ id: "name-for-the-moon-06", name: "The pod's cradle", author: AUTHOR, ballSpeed: 473 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....ccc....",
        "...#rrr#...",
        "..#ccccc#..",
        "..#cCcCc#..",
        "..#ccccc#..",
        "...#ccc#...",
        "....CCC....",
      ],
      { "#": steel("cyan"), r: piece("regen", "lime"), c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .zone("grow", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .build();

// 237 — Gleaner's rest --------------------------------------------------------------
// The dark settling into the moon: a black hole in a steel throat inside a
// sphere of blue glass. Five lives.
const GLEANERS_REST = createLevel({ id: "name-for-the-moon-07", name: "Gleaner's rest", author: AUTHOR, ballSpeed: 474, lives: 5 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...bbbbb...",
        ".bbbB#Bbbb.",
        "bB..#.#..Bb",
        "b...#.#...b",
        "bB.......Bb",
        ".bbbbbbbbb.",
        "...bbbbb...",
      ],
      { b: glass("blue"), B: hard("blue"), "#": steel("blue") },
      TOP,
    ),
  )
  .blackhole(180, 140)
  .bonus("slow", 60, 440)
  .zone("grow", 180, 460)
  .bonus("slow", 300, 440)
  .build();

// 238 — A name ----------------------------------------------------------------------
// The moon with a ring of locks around it, and the stars that are the keys
// out at the corners of the sky. Two rails under the ring.
const A_NAME = createLevel({ id: "name-for-the-moon-08", name: "A name", author: AUTHOR, ballSpeed: 475 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "k....c....k",
        "...KKKKK...",
        "..K.....K..",
        "..K.bBb.K..",
        "..K.....K..",
        "...KKKKK...",
        "c....c....c",
      ],
      { k: piece("key", "amber"), c: glass("cyan"), K: piece("lock", "amber"), b: glass("blue"), B: hard("blue") },
      TOP,
    ),
  )
  .rail(40, 340, 80)
  .rail(240, 340, 80)
  .bonus("slow", 180, 400)
  .bonus("fast2", 60, 460)
  .zone("grow", 300, 460)
  .build();

// 239 — The last pane ---------------------------------------------------------------
// One pane of cyan in a steel frame, open at the bottom, going in. Sticky
// under it, the wall descending.
const THE_LAST_PANE = createLevel({ id: "name-for-the-moon-09", name: "The last pane", author: AUTHOR, ballSpeed: 476 })
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "###########",
        "#ccccccccc#",
        "#ccccccccc#",
        "#cccCcCccc#",
        "#ccccccccc#",
        "#ccccccccc#",
        "#.........#",
      ],
      { "#": steel("cyan"), c: glass("cyan"), C: hard("cyan") },
      TOP,
    ),
  )
  .zone("sticky", 180, 350)
  .bonus("slow", 60, 450)
  .bonus("fast2", 300, 450)
  .rules({ descend: 20 })
  .build();

// 240 — Two suns, three geckos ------------------------------------------------------
// The finished dome with the suns locked in the sky above it, and three
// geckos on the glass: Kal in blue, Nul in violet, Lys in pink, regen tails,
// the key under Nul. Bumpers, a guard, shrink, ice, ×3, three lives, the
// narrowest paddle, five minutes.
const TWO_SUNS_THREE_GECKOS = createLevel({
  id: "name-for-the-moon-10",
  name: "Two suns, three geckos",
  author: AUTHOR,
  ballSpeed: 477,
  lives: 3,
  paddleWidth: 60,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "aXa.....aXa",
        "eAa.....aAe",
        "...........",
        "bBb.oOo.pPp",
        "bbbr.o.rppp",
        "b.b.o.o.p.p",
        ".....k.....",
      ],
      {
        a: glass("amber"),
        X: piece("lock", "amber"),
        e: piece("explosive", "amber"),
        A: hard("amber"),
        b: glass("blue"),
        B: hard("blue"),
        o: piece("ghost", "violet"),
        O: hard("violet"),
        p: glass("pink"),
        P: hard("pink"),
        r: piece("regen", "cyan"),
        k: piece("key", "amber"),
      },
      TOP,
    ),
  )
  .bumper(90, 330)
  .bumper(270, 330)
  .guard(180, 300, { w: 48, h: 8, range: 90, speed: 1.6 })
  .zone("shrink", 180, 400)
  .zone("ice", 60, 460)
  .bonus("fast3", 300, 460)
  .rules({ timer: 300 })
  .build();

export const NAME_FOR_THE_MOON: StoryEpisodeDef = {
  slug: "name-for-the-moon",
  title: "A Name for the Moon",
  order: 24,
  tagline: "The Gleaner follows the seed home, two suns come back, and a nameless moon gets a name.",
  background: BG,
  chapters: [
    {
      slug: "the-long-road",
      title: "The long road",
      intro: "The Gleaner follows the seed. Kal leads it back along the whole road, lit by Lys so it can see him. Behind them, Aurel's dome is dark and whole.",
      xp: 19100,
      level: THE_LONG_ROAD,
    },
    {
      slug: "seed-in-light",
      title: "Seed in light",
      intro: "For the first time since the egg, Kal is the most visible thing in the sky. He does not like it. He keeps walking.",
      xp: 19200,
      level: SEED_IN_LIGHT,
    },
    {
      slug: "nuls-eye-shut",
      title: "Nul's eye shut",
      intro: "Nul is still in there. Hollow, blind, the one thing the dark cannot use, holding its eye shut from the inside so it can only follow the light it is shown.",
      xp: 19300,
      level: NULS_EYE_SHUT,
    },
    {
      slug: "vitra-relit",
      title: "Vitra relit",
      intro: "At Vitra, a Gleaner does what it was grown to do at a garden: it delivers. The twin suns come back into the sky they were taken from. The Keepers watch the glass warm.",
      xp: 19400,
      level: VITRA_RELIT,
    },
    {
      slug: "the-grey-moon",
      title: "The Grey Moon",
      intro: "Then on, to the one place in the sky with nothing to eat. A cold grey moon under a ringed blue giant, where a pod fell short once.",
      xp: 19500,
      level: THE_GREY_MOON,
    },
    {
      slug: "the-pods-cradle",
      title: "The pod's cradle",
      intro: "The pod is still there. Lys plants a light-seed in the cradle where an egg was. Something on the Grey Moon is growing for the first time.",
      xp: 19600,
      level: THE_PODS_CRADLE,
    },
    {
      slug: "gleaners-rest",
      title: "Gleaner's rest",
      intro: "A tool that has finished its work settles into the dust and goes quiet. Not dead. Kept, the way it kept everything. Nul climbs out of it and sits down on the pod.",
      xp: 19700,
      level: GLEANERS_REST,
    },
    {
      slug: "a-name",
      title: "A name",
      intro: "Kal gives the moon its name, the one thing nobody ever gave it. Hush. A dark moon around a blue giant, and a small green light on it.",
      xp: 19800,
      level: A_NAME,
    },
    {
      slug: "the-last-pane",
      title: "The last pane",
      intro: "Home. The dome over Aurel has been three panes from closed for a year. Kal sets the last one himself.",
      xp: 19900,
      level: THE_LAST_PANE,
    },
    {
      slug: "two-suns-three-geckos",
      title: "Two suns, three geckos",
      intro: "Three geckos on the finished glass, and far off, two suns in a sky that used to be his. Home is where they are. He is home, and so is the road.",
      xp: 20000,
      level: TWO_SUNS_THREE_GECKOS,
    },
  ],
};
