import { Prisma, type ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { reviewDue, type ReviewChoice } from "@/lib/review";
import { getSiteSettings } from "@/lib/tutorial";

/** Players who can still be asked. Mongo leaves the status unset until the first answer. */
export function openReviewWhere(userId: string): Prisma.UserWhereInput {
  return {
    id: userId,
    OR: [{ reviewStatus: { isSet: false } }, { reviewStatus: null }, { reviewStatus: "LATER" }],
  };
}

export function asReviewChoice(status: ReviewStatus | null | undefined): ReviewChoice {
  return status ?? null;
}

/** True when this player's next story clear (or the menu) should open the sheet. */
export async function shouldAskReview(userId: string): Promise<boolean> {
  const [settings, user, clears] = await Promise.all([
    getSiteSettings(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { reviewStatus: true, reviewAnchor: true },
    }),
    prisma.chapterClear.count({ where: { userId } }),
  ]);
  return reviewDue({
    clears,
    every: settings.reviewEvery,
    status: asReviewChoice(user?.reviewStatus),
    anchor: user?.reviewAnchor ?? 0,
  });
}
