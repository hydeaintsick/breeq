"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth/session";
import { ADMIN_REVIEWS_PATH, ADMIN_SETTINGS_PATH, GAME_ROOT_PATH } from "@/lib/auth/paths";
import { ensureBalanceFields } from "@/lib/balances";
import { toBalances, type Balances } from "@/lib/earn";
import {
  REVIEW_EVERY_MAX,
  REVIEW_GEMS_DEFAULT,
  REVIEW_GEMS_MAX,
} from "@/lib/review";
import { openReviewWhere, shouldAskReview } from "@/lib/review-store";
import { SITE_SETTINGS_ID } from "@/lib/tutorial";

export type ReviewAccept =
  | { gems: number; balances: Balances; already?: false }
  | { already: true; gems: number; balances: Balances }
  | { error: string };

/** Admin: how often the sheet appears, and how many gems it pays. `every` of 0 turns it off. */
export async function setReviewOffer(
  every: number,
  gems: number,
): Promise<{ every: number; gems: number } | { error: string }> {
  await requireAdmin();
  if (!Number.isInteger(every) || every < 0 || every > REVIEW_EVERY_MAX) {
    return { error: `Use a whole number from 0 to ${REVIEW_EVERY_MAX}.` };
  }
  if (!Number.isInteger(gems) || gems < 1 || gems > REVIEW_GEMS_MAX) {
    return { error: `Use a whole number of gems from 1 to ${REVIEW_GEMS_MAX}.` };
  }
  const row = await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, reviewEvery: every, reviewGems: gems },
    update: { reviewEvery: every, reviewGems: gems },
    select: { reviewEvery: true, reviewGems: true },
  });
  revalidatePath(ADMIN_REVIEWS_PATH);
  revalidatePath(ADMIN_SETTINGS_PATH);
  revalidatePath(GAME_ROOT_PATH, "layout");
  return { every: row.reviewEvery, gems: row.reviewGems };
}

/** The sheet opened. A second call inside a few seconds does not count twice. */
export async function markReviewSeen(): Promise<void> {
  const user = await requireUser();
  const since = new Date(Date.now() - 10_000);
  const [recent, clears] = await Promise.all([
    prisma.reviewEvent.findFirst({
      where: { userId: user.id, kind: "SEEN", createdAt: { gt: since } },
      select: { id: true },
    }),
    prisma.chapterClear.count({ where: { userId: user.id } }),
  ]);
  if (recent) return;
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const gate = await tx.user.updateMany({
      where: openReviewWhere(user.id),
      data: { reviewSeen: { increment: 1 }, reviewSeenAt: now },
    });
    if (gate.count === 0) return;
    await tx.reviewEvent.create({
      data: { userId: user.id, kind: "SEEN", clears },
    });
  });
}

/** Not now: the next ask waits another full interval of clears. */
export async function snoozeReview(): Promise<void> {
  const user = await requireUser();
  const clears = await prisma.chapterClear.count({ where: { userId: user.id } });
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const gate = await tx.user.updateMany({
      where: openReviewWhere(user.id),
      data: {
        reviewStatus: "LATER",
        reviewAnchor: clears,
        reviewLater: { increment: 1 },
        reviewLaterAt: now,
      },
    });
    if (gate.count === 0) return;
    await tx.reviewEvent.create({
      data: { userId: user.id, kind: "LATER", clears },
    });
  });
  revalidatePath(GAME_ROOT_PATH, "layout");
  revalidatePath(ADMIN_REVIEWS_PATH);
}

/** Don't ask again. No gems. Permanent. */
export async function optOutReview(): Promise<void> {
  const user = await requireUser();
  const clears = await prisma.chapterClear.count({ where: { userId: user.id } });
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    const gate = await tx.user.updateMany({
      where: openReviewWhere(user.id),
      data: { reviewStatus: "OUT", reviewOptOutAt: now },
    });
    if (gate.count === 0) return;
    await tx.reviewEvent.create({
      data: { userId: user.id, kind: "OUT", clears },
    });
  });
  revalidatePath(GAME_ROOT_PATH, "layout");
  revalidatePath(ADMIN_REVIEWS_PATH);
}

/**
 * They took the 5 stars. One credit per account, and only while the ask is
 * actually open. Play does not confirm the review, so the tap is the gate.
 */
export async function acceptReview(): Promise<ReviewAccept> {
  const user = await requireUser();
  const due = await shouldAskReview(user.id);
  if (!due) {
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { reviewStatus: true, reviewReward: true, gems: true, ethGwei: true },
    });
    if (row?.reviewStatus === "RATED") {
      return { already: true, gems: row.reviewReward ?? 0, balances: toBalances(row) };
    }
    return { error: "This offer is not open right now." };
  }

  await ensureBalanceFields(user.id);
  const [settings, clears] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { id: SITE_SETTINGS_ID },
      select: { reviewGems: true },
    }),
    prisma.chapterClear.count({ where: { userId: user.id } }),
  ]);
  const gems = settings?.reviewGems ?? REVIEW_GEMS_DEFAULT;
  const now = new Date();
  const balances = await prisma.$transaction(async (tx) => {
    const gate = await tx.user.updateMany({
      where: openReviewWhere(user.id),
      data: {
        reviewStatus: "RATED",
        reviewRatedAt: now,
        reviewReward: gems,
        gems: { increment: gems },
      },
    });
    if (gate.count === 0) return null;
    await tx.ledgerEntry.create({
      data: { userId: user.id, kind: "REVIEW", gems, note: "Play review" },
    });
    await tx.reviewEvent.create({
      data: { userId: user.id, kind: "RATED", clears, gems },
    });
    const row = await tx.user.findUnique({
      where: { id: user.id },
      select: { gems: true, ethGwei: true },
    });
    return toBalances(row);
  });

  if (!balances) {
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: { reviewStatus: true, reviewReward: true, gems: true, ethGwei: true },
    });
    if (row?.reviewStatus === "RATED") {
      return { already: true, gems: row.reviewReward ?? 0, balances: toBalances(row) };
    }
    return { error: "Could not add the gems. Try again." };
  }

  revalidatePath(GAME_ROOT_PATH, "layout");
  revalidatePath(ADMIN_REVIEWS_PATH);
  return { gems, balances };
}
