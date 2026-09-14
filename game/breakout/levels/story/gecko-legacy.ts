/**
 * Episode 1 — Gecko Legacy.
 *
 * Kal hatches on the Grey Moon. Ten gentle walls that teach the game one idea
 * at a time: plain glass, then a hard brick, then steel, then the first speed
 * zones, a bumper, a magnet — never more than one new thing per chapter, and
 * the ball never above 305. The first four slugs are the ones the shelf has
 * always had, so early clears are kept.
 *
 * Shapes: a lit window, a moving light, a cracking egg, a party of bugs, a
 * trail of prints, the pod's beacon, dunes of grey dust, the ringed giant, a
 * cold night of stars, and one star with a circle drawn around it.
 */
import { createLevel } from "../../engine/level";
import { glass, hard, piece, steel, wall } from "./shape";
import type { StoryEpisodeDef } from "./types";

const AUTHOR = "Breeq";
const BG = "/backgrounds/gecko-legacy.jpg";
const TOP = 96;

// 01 — A light behind the window ---------------------------------------------------
// A pane with an amber glow in the middle. Glass only, slow ball, a slow zone.
const A_LIGHT_BEHIND_THE_WINDOW = createLevel({
  id: "gecko-legacy-01",
  name: "A light behind the window",
  author: AUTHOR,
  ballSpeed: 280,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..bbbbbb..",
        "..b....b..",
        "..b.aa.b..",
        "..b.aa.b..",
        "..b....b..",
        "..bbbbbb..",
      ],
      { b: glass("blue"), a: glass("amber") },
      TOP,
    ),
  )
  .bonus("slow", 180, 330)
  .build();

// 02 — Chasing the light -----------------------------------------------------------
// The glow slides along the wall and leaves a trail. Two hard bricks: the first ones.
const CHASING_THE_LIGHT = createLevel({
  id: "gecko-legacy-02",
  name: "Chasing the light",
  author: AUTHOR,
  ballSpeed: 285,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "aa........",
        ".aab......",
        "...bbb....",
        ".....bbb..",
        "......bAb.",
        "..........",
      ],
      { a: glass("amber"), b: glass("blue"), A: hard("amber") },
      TOP,
    ),
  )
  .bonus("slow", 120, 330)
  .build();

// 03 — A lizard is born ------------------------------------------------------------
// The egg, cracked down the middle. The shell's rim is steel: the first wall that stays.
const A_LIZARD_IS_BORN = createLevel({
  id: "gecko-legacy-03",
  name: "A lizard is born",
  author: AUTHOR,
  ballSpeed: 285,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...pppp...",
        "..pp..pp..",
        ".#p.a..p#.",
        ".#p..a.p#.",
        ".#p.a..p#.",
        "..pp..pp..",
      ],
      { p: glass("pink"), a: glass("amber"), "#": steel("blue") },
      TOP,
    ),
  )
  .bonus("slow", 180, 340)
  .build();

// 04 — Crispy party ----------------------------------------------------------------
// Bugs around the beacon: small bright clusters. The first ×2 zone, off to one side.
const CRISPY_PARTY = createLevel({
  id: "gecko-legacy-04",
  name: "Crispy party",
  author: AUTHOR,
  ballSpeed: 290,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        ".ll....cc.",
        ".ll.aa.cc.",
        "....aa....",
        ".cc....ll.",
        ".cc.aa.ll.",
        "....aa....",
      ],
      { l: glass("lime"), c: glass("cyan"), a: glass("amber") },
      TOP,
    ),
  )
  .bonus("slow", 70, 330)
  .bonus("fast2", 290, 330)
  .build();

// 05 — First prints ----------------------------------------------------------------
// A trail of footprints across the dust, wandering left to right. A grow zone helps.
const FIRST_PRINTS = createLevel({
  id: "gecko-legacy-05",
  name: "First prints",
  author: AUTHOR,
  ballSpeed: 290,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "b........b",
        ".b......b.",
        "...b..b...",
        "....bb....",
        "...b..b...",
        ".b......b.",
        "b........b",
      ],
      { b: glass("blue") },
      TOP,
    ),
  )
  .zone("grow", 180, 340)
  .bonus("slow", 60, 400)
  .build();

// 06 — The beacon ------------------------------------------------------------------
// The pod's beacon: a steel mast, an amber lamp with a hard cap, glass light around it.
const THE_BEACON = createLevel({
  id: "gecko-legacy-06",
  name: "The beacon",
  author: AUTHOR,
  ballSpeed: 295,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "....AA....",
        "...aaaa...",
        "..a.##.a..",
        "....##....",
        "..a.##.a..",
        "....##....",
        "...c....c.",
      ],
      { A: hard("amber"), a: glass("amber"), c: glass("cyan"), "#": steel("blue") },
      TOP,
    ),
  )
  .bonus("slow", 60, 330)
  .bonus("slow", 300, 330)
  .build();

// 07 — Grey dust -------------------------------------------------------------------
// Two dunes of dust, cyan on blue. The first bumper sits between them.
const GREY_DUST = createLevel({
  id: "gecko-legacy-07",
  name: "Grey dust",
  author: AUTHOR,
  ballSpeed: 295,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "..cc....cc",
        ".cbbc..cbb",
        "cbbbbccbbb",
        "..........",
        "..........",
        "cc....cc..",
        "bbc..cbbc.",
      ],
      { c: glass("cyan"), b: glass("blue") },
      TOP,
    ),
  )
  .bumper(180, 320)
  .bonus("slow", 180, 420)
  .build();

// 08 — The ringed giant ------------------------------------------------------------
// The blue giant over the moon: a hard core, a glass ring seen edge-on.
const THE_RINGED_GIANT = createLevel({
  id: "gecko-legacy-08",
  name: "The ringed giant",
  author: AUTHOR,
  ballSpeed: 300,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...bbbb...",
        "..bBBBBb..",
        ".c.bbbb.c.",
        "..ccbbcc..",
        "....cc....",
        "..........",
        ".a......a.",
      ],
      { b: glass("blue"), B: hard("blue"), c: glass("cyan"), a: glass("amber") },
      TOP,
    ),
  )
  .bonus("slow", 180, 360)
  .build();

// 09 — Cold night ------------------------------------------------------------------
// Single stars scattered over the dark. A magnet in the middle pulls the ball around.
const COLD_NIGHT = createLevel({
  id: "gecko-legacy-09",
  name: "Cold night",
  author: AUTHOR,
  ballSpeed: 300,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "b...c...b.",
        "...b...c..",
        ".c...m...b",
        "...b...b..",
        "b...c.....",
        "..b...b.c.",
      ],
      { b: glass("blue"), c: glass("cyan"), m: piece("magnet", "violet") },
      TOP,
    ),
  )
  .bonus("slow", 90, 340)
  .bonus("slow", 270, 340)
  .build();

// 10 — The circled star ------------------------------------------------------------
// One star with a circle drawn around it: hard amber inside a ring of glass.
const THE_CIRCLED_STAR = createLevel({
  id: "gecko-legacy-10",
  name: "The circled star",
  author: AUTHOR,
  ballSpeed: 305,
})
  .background(BG, { dim: 0.55 })
  .brickRows(
    wall(
      [
        "...vvvvv...",
        "..v.....v..",
        ".v...A...v.",
        ".v..AAA..v.",
        ".v...A...v.",
        "..v.....v..",
        "...vvvvv...",
      ],
      { v: glass("violet"), A: hard("amber") },
      TOP,
    ),
  )
  .bonus("slow", 180, 340)
  .bonus("fast2", 300, 420)
  .build();

export const GECKO_LEGACY: StoryEpisodeDef = {
  slug: "gecko-legacy",
  title: "Gecko Legacy",
  order: 1,
  tagline: "Kal wakes up on a world that is not his own.",
  background: BG,
  chapters: [
    {
      slug: "a-light-behind-the-window",
      title: "A light behind the window",
      intro: "Something glows behind the glass of the pod. Kal does what every gecko does first: he climbs toward it.",
      xp: 100,
      level: A_LIGHT_BEHIND_THE_WINDOW,
    },
    {
      slug: "chasing-the-light",
      title: "Chasing the light",
      intro: "The light moves along the wall. Kal follows it, and the wall gives way under his feet.",
      xp: 120,
      level: CHASING_THE_LIGHT,
    },
    {
      slug: "a-lizard-is-born",
      title: "A lizard is born",
      intro: "Grey dust, thin air, a sky he does not know. Kal is out of the shell, and he is alone.",
      xp: 140,
      level: A_LIZARD_IS_BORN,
    },
    {
      slug: "crispy-party",
      title: "Crispy party",
      intro: "Bugs crackle around the pod's beacon, drawn by the same light. Kal eats. Tomorrow, he leaves.",
      xp: 160,
      level: CRISPY_PARTY,
    },
    {
      slug: "first-prints",
      title: "First prints",
      intro: "Nobody has walked here before. Kal's prints in the dust are the first, and they wander.",
      xp: 180,
      level: FIRST_PRINTS,
    },
    {
      slug: "the-beacon",
      title: "The beacon",
      intro: "The pod's lamp pulses in a rhythm Kal knows from inside the egg. He climbs it to be closer.",
      xp: 200,
      level: THE_BEACON,
    },
    {
      slug: "grey-dust",
      title: "Grey dust",
      intro: "Beyond the pod, dunes. Beyond the dunes, more dunes. The moon has nothing else to give him.",
      xp: 210,
      level: GREY_DUST,
    },
    {
      slug: "the-ringed-giant",
      title: "The ringed giant",
      intro: "A blue world fills half the sky, wearing a ring of ice. Kal watches it all night and does not know why he is sad.",
      xp: 220,
      level: THE_RINGED_GIANT,
    },
    {
      slug: "cold-night",
      title: "Cold night",
      intro: "The stars come out sharp and close. One of them pulls at him, the way the light behind the window did.",
      xp: 230,
      level: COLD_NIGHT,
    },
    {
      slug: "the-circled-star",
      title: "The circled star",
      intro: "Inside the pod, a chart of stars, and one of them circled. Kal puts a claw on it. Tomorrow, he leaves.",
      xp: 240,
      level: THE_CIRCLED_STAR,
    },
  ],
};
