"use server";

import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/auth/session";
import type { PlayTape } from "@/game/breakout/engine/tape";
import { prisma } from "@/lib/prisma";

const KINDS = new Set(["story", "tutorial", "earn"]);
const OUTCOMES = new Set(["cleared", "lives", "timeout", "crushed", "quit"]);
/** 45 minutes at 240 steps a second. */
const MAX_STEPS = 240 * 60 * 45;
const MAX_JSON = 4_000_000;
const KEEP = 40;

function isObjectId(id: string) {
  return /^[a-f\d]{24}$/i.test(id);
}

function isTape(value: unknown): value is PlayTape {
  if (!value || typeof value !== "object") return false;
  const tape = value as PlayTape;
  if (tape.v !== 1 || !Number.isInteger(tape.seed) || !Number.isInteger(tape.steps)) return false;
  if (tape.steps < 1 || tape.steps > MAX_STEPS) return false;
  if (!Array.isArray(tape.samples) || !Array.isArray(tape.revives)) return false;
  if (tape.samples.length === 0 || tape.samples.length > tape.steps) return false;

  let last = -1;
  for (const sample of tape.samples) {
    if (!sample || typeof sample !== "object") return false;
    if (!Number.isInteger(sample.i) || sample.i < 0 || sample.i >= tape.steps || sample.i <= last) return false;
    if (typeof sample.x !== "number" || !Number.isFinite(sample.x)) return false;
    if (sample.launch !== undefined && sample.launch !== 1) return false;
    if (sample.ax !== undefined && (typeof sample.ax !== "number" || !Number.isFinite(sample.ax))) return false;
    if (sample.ay !== undefined && (typeof sample.ay !== "number" || !Number.isFinite(sample.ay))) return false;
    last = sample.i;
  }

  last = -1;
  for (const revive of tape.revives) {
    if (!revive || typeof revive !== "object") return false;
    if (!Number.isInteger(revive.i) || revive.i < 0 || revive.i > tape.steps || revive.i < last) return false;
    if (!Number.isInteger(revive.lives) || revive.lives < 1 || revive.lives > 9) return false;
    last = revive.i;
  }
  return true;
}

export async function savePlayReplay(input: {
  clientKey: string;
  kind: string;
  title: string;
  ref: string | null;
  level: unknown;
  tape: PlayTape;
  outcome: string | null;
  score: number;
}): Promise<{ ok: boolean }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false };
  if (!/^[0-9a-f-]{36}$/i.test(input.clientKey)) return { ok: false };
  if (!KINDS.has(input.kind)) return { ok: false };
  if (input.outcome !== null && !OUTCOMES.has(input.outcome)) return { ok: false };
  if (!Number.isInteger(input.score) || input.score < 0 || input.score > 1_000_000_000) return { ok: false };
  if (!isTape(input.tape)) return { ok: false };
  if (!input.level || typeof input.level !== "object") return { ok: false };

  const title = input.title.trim().slice(0, 80);
  if (!title) return { ok: false };
  const ref = input.ref?.trim().slice(0, 64) || null;
  if (JSON.stringify(input.tape).length > MAX_JSON) return { ok: false };

  const existing = await prisma.playReplay.findUnique({
    where: { clientKey: input.clientKey },
    select: { userId: true },
  });
  if (existing && existing.userId !== userId) return { ok: false };

  const data = {
    kind: input.kind,
    title,
    ref,
    level: input.level as Prisma.InputJsonValue,
    tape: input.tape as unknown as Prisma.InputJsonValue,
    steps: input.tape.steps,
    score: input.score,
    outcome: input.outcome,
  };

  await prisma.playReplay.upsert({
    where: { clientKey: input.clientKey },
    create: { clientKey: input.clientKey, userId, ...data },
    update: data,
  });

  if (!existing) {
    const stale = await prisma.playReplay.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      skip: KEEP,
      select: { id: true },
    });
    if (stale.length > 0) {
      await prisma.playReplay.deleteMany({ where: { id: { in: stale.map((row) => row.id) } } });
    }
  }

  return { ok: true };
}

export async function getPlayReplay(id: string) {
  await requireAdmin();
  if (!isObjectId(id)) return null;
  const row = await prisma.playReplay.findUnique({
    where: { id },
    select: { id: true, title: true, kind: true, level: true, tape: true, steps: true, outcome: true, score: true },
  });
  if (!row || !isTape(row.tape)) return null;
  return row;
}
