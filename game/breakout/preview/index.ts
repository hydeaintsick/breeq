export { mountBreakout, type BreakoutHandle, type HudState, type MountOptions } from "./mount";
export { setSwipeAnywhereEnabled, isSwipeAnywhereEnabled } from "./swipe";
export {
  canGoFullscreen,
  enterImmersive,
  exitImmersive,
  isImmersive,
  isStandalone,
  onImmersiveChange,
  wantsImmersive,
} from "./immersive";
export { createDifficultyRater, EDITOR_DIFFICULTY_OPTIONS, type DifficultyRater } from "./difficulty";
export type { CssRect } from "../render/renderer";
