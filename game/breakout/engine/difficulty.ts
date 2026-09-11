/**
 * Difficulty rating — how hard a wall is, measured rather than guessed.
 *
 * The flawless autopilot proves the level can be cleared at all (the publish
 * rule). Then fallible pilots play it: a skill of 0.97 is a good player who
 * still fumbles, 0.94 an average one. Their clear rate over a fixed set of
 * seeds, plus how long a clear takes, become one 0–100 score and a tier.
 *
 * Deterministic: same level, same options, same rating — on the server, in a
 * worker, or in the editor. No DOM.
 */
import { Autopilot, proveClearable, type Proof } from "./autopilot";
import { Game } from "./game";
import type { Level } from "./types";

export interface DifficultyOptions {
  /** Pilot skills to sample, 0..1. */
  skills?: readonly number[];
  /** Games per skill. More is steadier and slower. */
  runs?: number;
  /** Give up on a run after this much game time. */
  maxSeconds?: number;
  /** Seeds to try for the flawless proof; `[]` skips the proof. */
  proofSeeds?: number[];
}

export interface SkillSample {
  skill: number;
  runs: number;
  wins: number;
  /** 0..1 */
  winRate: number;
  /** Mean game seconds of the winning runs; null without a win. */
  meanSeconds: number | null;
  /** Mean lives left at the clear; null without a win. */
  meanLivesLeft: number | null;
  timeouts: number;
}

export type DifficultyTier = 1 | 2 | 3 | 4 | 5;
export type DifficultyLabel = "Gentle" | "Easy" | "Fair" | "Hard" | "Brutal" | "Unproven";

export interface Difficulty {
  /** 0 = trivial, 100 = nobody clears it. */
  score: number;
  tier: DifficultyTier;
  label: DifficultyLabel;
  /** The flawless autopilot cleared it (or the proof was skipped). */
  clearable: boolean;
  proof: Proof | null;
  samples: SkillSample[];
  /** Mean clear time across every winning run, in game seconds. */
  meanSeconds: number | null;
}

export const DIFFICULTY_DEFAULTS = {
  skills: [0.97, 0.94] as readonly number[],
  runs: 12,
  maxSeconds: 300,
  proofSeeds: [1, 2, 3, 4, 5, 6],
} as const;

const TIERS: { max: number; tier: DifficultyTier; label: DifficultyLabel }[] = [
  { max: 15, tier: 1, label: "Gentle" },
  { max: 30, tier: 2, label: "Easy" },
  { max: 50, tier: 3, label: "Fair" },
  { max: 70, tier: 4, label: "Hard" },
  { max: 100, tier: 5, label: "Brutal" },
];

export function difficultyTier(score: number): { tier: DifficultyTier; label: DifficultyLabel } {
  const found = TIERS.find((t) => score < t.max) ?? TIERS[TIERS.length - 1];
  return { tier: found.tier, label: found.label };
}

/** One game with a fallible pilot. Seeds are derived from `index` so results repeat. */
export function sampleRun(level: Level, skill: number, index: number, maxSeconds: number) {
  const seed = 100 + index;
  const game = new Game(level, { seed });
  const pilot = new Autopilot(level, { seed: seed * 31 + 7, skill });
  const maxSteps = Math.round(maxSeconds * 240);
  for (let i = 0; i < maxSteps; i++) {
    game.step(pilot.input(game.state, game.bricks));
    if (game.state.phase === "cleared" || game.state.phase === "over") break;
  }
  const s = game.state;
  return {
    cleared: s.phase === "cleared",
    seconds: s.time,
    livesLeft: s.lives,
    paddleHits: s.totalPaddleHits,
    ending: s.ending,
  };
}

export function sampleSkill(level: Level, skill: number, runs: number, maxSeconds: number): SkillSample {
  let wins = 0;
  let seconds = 0;
  let lives = 0;
  let timeouts = 0;
  for (let i = 0; i < runs; i++) {
    const run = sampleRun(level, skill, i, maxSeconds);
    if (run.cleared) {
      wins += 1;
      seconds += run.seconds;
      lives += run.livesLeft;
    }
    if (run.ending === "timeout") timeouts += 1;
  }
  return {
    skill,
    runs,
    wins,
    winRate: runs > 0 ? wins / runs : 0,
    meanSeconds: wins > 0 ? seconds / wins : null,
    meanLivesLeft: wins > 0 ? lives / wins : null,
    timeouts,
  };
}

/** Rate a level. Expect a few hundred milliseconds; run it off the main thread in a browser. */
export function rateDifficulty(level: Level, options: DifficultyOptions = {}): Difficulty {
  const skills = options.skills ?? DIFFICULTY_DEFAULTS.skills;
  const runs = options.runs ?? DIFFICULTY_DEFAULTS.runs;
  const maxSeconds = options.maxSeconds ?? DIFFICULTY_DEFAULTS.maxSeconds;
  const proofSeeds = options.proofSeeds ?? [...DIFFICULTY_DEFAULTS.proofSeeds];

  const proof = proofSeeds.length > 0 ? proveClearable(level, { seeds: proofSeeds, maxSeconds }) : null;
  const clearable = proofSeeds.length === 0 || proof !== null;

  const samples = skills.map((skill) => sampleSkill(level, skill, runs, maxSeconds));
  const totalWins = samples.reduce((sum, s) => sum + s.wins, 0);
  const totalSeconds = samples.reduce((sum, s) => sum + (s.meanSeconds ?? 0) * s.wins, 0);
  const meanSeconds = totalWins > 0 ? totalSeconds / totalWins : null;

  if (!clearable) {
    return { score: 100, tier: 5, label: "Unproven", clearable, proof, samples, meanSeconds };
  }

  const meanWin = samples.length > 0 ? samples.reduce((sum, s) => sum + s.winRate, 0) / samples.length : 1;
  // Long walls wear a player down even when the pilots clear them: a two-minute
  // clear adds up to ten points, scaled by how much the pilots already struggle.
  const lengthPenalty = meanSeconds ? Math.min(10, (meanSeconds / 120) * 10) * (0.5 + 0.5 * (1 - meanWin)) : 0;
  const score = Math.max(0, Math.min(100, Math.round((1 - meanWin) * 100 + lengthPenalty)));
  const { tier, label } = difficultyTier(score);
  return { score, tier, label, clearable, proof, samples, meanSeconds };
}
