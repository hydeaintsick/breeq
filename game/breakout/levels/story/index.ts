/**
 * The Story campaign, as code. Every episode lives here, Gecko Legacy
 * included; `pnpm story:seed` proves every wall clearable and upserts them
 * into the database. Seeded episodes are owned by the code.
 */
import { ASHEN_COURT } from "./ashen-court";
import { COLD_ORBIT } from "./cold-orbit";
import { EMPTY_NEST } from "./empty-nest";
import { GECKO_LEGACY } from "./gecko-legacy";
import { GLASS_SKY } from "./glass-sky";
import { GLASSHOUSE } from "./glasshouse";
import { GREEN_STATIC } from "./green-static";
import { LUMEN_REEF } from "./lumen-reef";
import { MERIDIAN } from "./meridian";
import { ROOTWAY } from "./rootway";
import { SECOND_SUN } from "./second-sun";
import { THE_HUSH } from "./the-hush";
import { THE_VIVARIUM } from "./the-vivarium";
import { WALL_WALKER } from "./wall-walker";

export {
  ASHEN_COURT,
  COLD_ORBIT,
  EMPTY_NEST,
  GECKO_LEGACY,
  GLASS_SKY,
  GLASSHOUSE,
  GREEN_STATIC,
  LUMEN_REEF,
  MERIDIAN,
  ROOTWAY,
  SECOND_SUN,
  THE_HUSH,
  THE_VIVARIUM,
  WALL_WALKER,
};
export type { StoryChapterDef, StoryEpisodeDef } from "./types";
export { wall, glass, hard, steel, piece, rowTop, brickWidthFor, type Legend } from "./shape";

/** The whole campaign, in shelf order. */
export const STORY_EPISODES = [
  GECKO_LEGACY,
  COLD_ORBIT,
  GLASS_SKY,
  EMPTY_NEST,
  LUMEN_REEF,
  ASHEN_COURT,
  THE_HUSH,
  SECOND_SUN,
  // Season 2 — The Borrowed Egg.
  GREEN_STATIC,
  THE_VIVARIUM,
  GLASSHOUSE,
  ROOTWAY,
  WALL_WALKER,
  MERIDIAN,
] as const;
