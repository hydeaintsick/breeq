/**
 * Difficulty rating off the main thread. One message in (a level and options,
 * tagged with an id), one message out (the rating, same id). Rating a wall is a
 * few hundred simulated games; the editor stays smooth while it runs.
 */
import { rateDifficulty, type DifficultyOptions } from "../engine/difficulty";
import type { Level } from "../engine/types";

export interface RateRequest {
  id: number;
  level: Level;
  options?: DifficultyOptions;
}

export interface RateResponse {
  id: number;
  result: ReturnType<typeof rateDifficulty>;
}

self.addEventListener("message", (event: MessageEvent<RateRequest>) => {
  const { id, level, options } = event.data;
  const result = rateDifficulty(level, options);
  const response: RateResponse = { id, result };
  self.postMessage(response);
});
