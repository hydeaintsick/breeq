/**
 * The Story campaign, as code. Episode 1 (Gecko Legacy) is hand-made in the
 * admin editor; these are the episodes that follow it. `pnpm story:seed`
 * proves every wall clearable and upserts them into the database.
 */
import { ASHEN_COURT } from "./ashen-court";
import { COLD_ORBIT } from "./cold-orbit";
import { EMPTY_NEST } from "./empty-nest";
import { GLASS_SKY } from "./glass-sky";
import { LUMEN_REEF } from "./lumen-reef";
import { SECOND_SUN } from "./second-sun";
import { THE_HUSH } from "./the-hush";

export { ASHEN_COURT, COLD_ORBIT, EMPTY_NEST, GLASS_SKY, LUMEN_REEF, SECOND_SUN, THE_HUSH };
export { GECKO_LEGACY_COPY } from "./gecko-legacy";
export type { StoryChapterDef, StoryEpisodeDef } from "./types";
export { wall, glass, hard, steel, piece, rowTop, brickWidthFor, type Legend } from "./shape";

/** Episodes after Gecko Legacy, in shelf order. */
export const STORY_EPISODES = [
  COLD_ORBIT,
  GLASS_SKY,
  EMPTY_NEST,
  LUMEN_REEF,
  ASHEN_COURT,
  THE_HUSH,
  SECOND_SUN,
] as const;
