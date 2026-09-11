/**
 * Page-wide paddle swipe preference, read by the mount every gesture.
 * The React provider keeps this in step with the `breeq-swipe` cookie.
 */
let anywhere = true;

export function setSwipeAnywhereEnabled(on: boolean): void {
  anywhere = on;
}

export function isSwipeAnywhereEnabled(): boolean {
  return anywhere;
}
