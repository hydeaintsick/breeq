export { isSoundEnabled, isSoundSupported, setSoundEnabled, unlockSound } from "./bus";
export { BreakoutSfx } from "./sfx";
export { acquireStoryTheme, type StoryThemeHandle } from "./theme";

import { unlockSound } from "./bus";
import { Layer } from "./synth";

/**
 * Two soft glass notes, played when the player turns sound on so the choice is
 * heard at once. Must be called from the click itself (autoplay policy).
 */
export function playSoundCheck(): void {
  const bus = unlockSound();
  if (!bus) return;
  const layer = new Layer(bus, 7);
  layer.setActive(true);
  const at = bus.now + 0.02;
  layer.bell({ freq: 587.33, gain: 0.15, decay: 0.8, at, pan: -0.15, send: 0.8 });
  layer.bell({ freq: 880, gain: 0.11, decay: 0.9, at: at + 0.09, pan: 0.15, send: 0.85 });
  window.setTimeout(() => layer.destroy(), 2600);
}
