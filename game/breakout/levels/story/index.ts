/**
 * The Story campaign, as code. Every episode lives here, Gecko Legacy
 * included; `pnpm story:seed` proves every wall clearable and upserts them
 * into the database. Seeded episodes are owned by the code.
 */
import { ASHEN_COURT } from "./ashen-court";
import { CANDLES_DEBT } from "./candles-debt";
import { COLD_ORBIT } from "./cold-orbit";
import { EMPTY_NEST } from "./empty-nest";
import { GECKO_LEGACY } from "./gecko-legacy";
import { GLASS_SKY } from "./glass-sky";
import { GLASSHOUSE } from "./glasshouse";
import { GREEN_STATIC } from "./green-static";
import { GREY_MOON } from "./grey-moon";
import { INTO_THE_HUSH } from "./into-the-hush";
import { KEEPERS } from "./keepers";
import { LUMEN_REEF } from "./lumen-reef";
import { MERIDIAN } from "./meridian";
import { NAME_FOR_THE_MOON } from "./name-for-the-moon";
import { NUL } from "./nul";
import { REEF_FLEET } from "./reef-fleet";
import { ROOTWAY } from "./rootway";
import { SECOND_SUN } from "./second-sun";
import { SEED_SHIP } from "./seed-ship";
import { SIEGE_OF_AUREL } from "./siege-of-aurel";
import { THE_HUSH } from "./the-hush";
import { THE_TALLY } from "./the-tally";
import { THE_VIVARIUM } from "./the-vivarium";
import { WALL_WALKER } from "./wall-walker";

export {
  ASHEN_COURT,
  CANDLES_DEBT,
  COLD_ORBIT,
  EMPTY_NEST,
  GECKO_LEGACY,
  GLASS_SKY,
  GLASSHOUSE,
  GREEN_STATIC,
  GREY_MOON,
  INTO_THE_HUSH,
  KEEPERS,
  LUMEN_REEF,
  MERIDIAN,
  NAME_FOR_THE_MOON,
  NUL,
  REEF_FLEET,
  ROOTWAY,
  SECOND_SUN,
  SEED_SHIP,
  SIEGE_OF_AUREL,
  THE_HUSH,
  THE_TALLY,
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
  // Season 3 — The Gleaner.
  SEED_SHIP,
  THE_TALLY,
  GREY_MOON,
  KEEPERS,
  REEF_FLEET,
  CANDLES_DEBT,
  NUL,
  SIEGE_OF_AUREL,
  INTO_THE_HUSH,
  NAME_FOR_THE_MOON,
] as const;
