/**
 * Immersive mode: the whole screen for the game, held in portrait.
 *
 * Progressive. Where the Fullscreen API exists (Android, desktop, iPad) the
 * document goes full screen and the orientation is locked to portrait, which
 * only works inside fullscreen. iPhone Safari has neither API for anything
 * but video; there the real full screen is the home-screen install
 * (`display: standalone` in the manifest, `viewport-fit=cover`), which this
 * module detects so callers can stop asking. Every call is safe to make from
 * any gesture and never throws.
 */

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = Element & {
  webkitRequestFullscreen?: (options?: FullscreenOptions) => Promise<void> | void;
};

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "portrait" | "landscape" | "natural" | "any") => Promise<void>;
  unlock?: () => void;
};

/** The page was opened from the home screen: already edge to edge. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

export function fullscreenElement(): Element | null {
  if (typeof document === "undefined") return null;
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/** True when the game already has the whole screen, one way or another. */
export function isImmersive(): boolean {
  return isStandalone() || fullscreenElement() !== null;
}

/**
 * Whether taking the whole screen is what this device wants: touch-first
 * (phones, tablets), where the browser chrome eats a third of the board. A
 * desktop click into Story must not throw the window into fullscreen.
 */
export function wantsImmersive(): boolean {
  if (typeof window === "undefined") return false;
  if (isImmersive()) return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

/** The Fullscreen API is there and allowed; false on iPhone Safari. */
export function canGoFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as FullscreenDocument & { webkitFullscreenEnabled?: boolean };
  if (doc.fullscreenEnabled === false && !doc.webkitFullscreenEnabled) return false;
  const root = document.documentElement as FullscreenElement;
  return typeof root.requestFullscreen === "function" || typeof root.webkitRequestFullscreen === "function";
}

/**
 * Ask for the screen, then for portrait. Call from a user gesture. Resolves to
 * whether the page is immersive afterwards (it may already have been).
 */
export async function enterImmersive(target: Element = document.documentElement): Promise<boolean> {
  if (isStandalone()) {
    await lockPortrait();
    return true;
  }
  if (fullscreenElement() === null && canGoFullscreen()) {
    const el = target as FullscreenElement;
    try {
      if (typeof el.requestFullscreen === "function") {
        await el.requestFullscreen({ navigationUI: "hide" });
      } else if (typeof el.webkitRequestFullscreen === "function") {
        await el.webkitRequestFullscreen();
      }
    } catch {
      // Denied or not from a gesture: the page stays as it is.
    }
  }
  if (fullscreenElement() !== null) await lockPortrait();
  return isImmersive();
}

/** Leave fullscreen and release the orientation; a no-op when not in it. */
export async function exitImmersive(): Promise<void> {
  unlockOrientation();
  if (fullscreenElement() === null) return;
  const doc = document as FullscreenDocument;
  try {
    if (typeof doc.exitFullscreen === "function") await doc.exitFullscreen();
    else if (typeof doc.webkitExitFullscreen === "function") await doc.webkitExitFullscreen();
  } catch {
    // Already out.
  }
}

async function lockPortrait(): Promise<void> {
  if (typeof screen === "undefined") return;
  const orientation = screen.orientation as LockableOrientation | undefined;
  if (!orientation || typeof orientation.lock !== "function") return;
  try {
    await orientation.lock("portrait");
  } catch {
    // Desktop browsers and iOS refuse; the page is portrait by layout anyway.
  }
}

function unlockOrientation(): void {
  if (typeof screen === "undefined") return;
  const orientation = screen.orientation as LockableOrientation | undefined;
  try {
    orientation?.unlock?.();
  } catch {
    // Nothing was locked.
  }
}

/** Fires on every fullscreen change (entering, leaving, or the system taking it back). */
export function onImmersiveChange(listener: (immersive: boolean) => void): () => void {
  const handler = () => listener(isImmersive());
  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler);
  return () => {
    document.removeEventListener("fullscreenchange", handler);
    document.removeEventListener("webkitfullscreenchange", handler);
  };
}
