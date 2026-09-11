/**
 * Browser plumbing for the difficulty rating: a worker when the browser has
 * one, the main thread otherwise. Only the latest request matters — an older
 * answer arriving after a newer request is dropped.
 */
import { rateDifficulty, type Difficulty, type DifficultyOptions } from "../engine/difficulty";
import type { Level } from "../engine/types";
import type { RateRequest, RateResponse } from "./difficulty.worker";

export interface DifficultyRater {
  /** Resolves with the rating, or `null` when a newer request superseded this one. */
  rate(level: Level, options?: DifficultyOptions): Promise<Difficulty | null>;
  destroy(): void;
}

/** Cheaper than the server defaults so the editor answers within a second on a phone. */
export const EDITOR_DIFFICULTY_OPTIONS: DifficultyOptions = {
  runs: 8,
  maxSeconds: 240,
  proofSeeds: [1, 2, 3],
};

export function createDifficultyRater(): DifficultyRater {
  let worker: Worker | null = null;
  let latest = 0;
  const waiting = new Map<number, (result: Difficulty | null) => void>();

  if (typeof Worker !== "undefined") {
    try {
      worker = new Worker(new URL("./difficulty.worker.ts", import.meta.url));
      worker.addEventListener("message", (event: MessageEvent<RateResponse>) => {
        const { id, result } = event.data;
        const resolve = waiting.get(id);
        waiting.delete(id);
        resolve?.(id === latest ? result : null);
      });
      worker.addEventListener("error", () => {
        // Fall back to the main thread for every pending and future request.
        worker?.terminate();
        worker = null;
        for (const [, resolve] of waiting) resolve(null);
        waiting.clear();
      });
    } catch {
      worker = null;
    }
  }

  return {
    rate(level, options) {
      const id = ++latest;
      // Older requests can never be the latest anymore: release them now.
      for (const [pendingId, resolve] of waiting) {
        if (pendingId !== id) {
          waiting.delete(pendingId);
          resolve(null);
        }
      }
      if (worker) {
        return new Promise((resolve) => {
          waiting.set(id, resolve);
          const request: RateRequest = { id, level, options };
          worker?.postMessage(request);
        });
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(id === latest ? rateDifficulty(level, options) : null);
        }, 0);
      });
    },
    destroy() {
      worker?.terminate();
      worker = null;
      for (const [, resolve] of waiting) resolve(null);
      waiting.clear();
    },
  };
}
