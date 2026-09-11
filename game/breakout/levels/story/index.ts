/**
 * The Story campaign, as code. Episode 1 (Gecko Legacy) is hand-made in the
 * admin editor; these are the episodes that follow it. `pnpm story:seed`
 * proves every wall clearable and upserts them into the database.
 */
import { COLD_ORBIT } from "./cold-orbit";
import { GLASS_SKY } from "./glass-sky";

export { COLD_ORBIT, GLASS_SKY };
export { GECKO_LEGACY_COPY } from "./gecko-legacy";
export type { StoryChapterDef, StoryEpisodeDef } from "./types";
export { wall, glass, hard, steel, piece, rowTop, brickWidthFor, type Legend } from "./shape";

/** Episodes after Gecko Legacy, in shelf order. */
export const STORY_EPISODES = [COLD_ORBIT, GLASS_SKY] as const;
