export { mountBreakout, type BreakoutHandle, type HudState, type MountOptions } from "./mount";
export { DEFAULT_SKIN_SET, type BallLook, type PaddleLook, type SkinColor, type SkinSet, type TrailStyle } from "../render/skins";
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
