import type { Metadata } from "next";
import { GameModePicker } from "@/components/game-mode-picker";
import { requireProgress } from "@/lib/auth/session";
import { getEarnTeaser } from "@/lib/earn";
import { canPlayEarn, EARN_UNLOCK_LEVEL } from "@/lib/progress";
import { getStoryShelf } from "@/lib/story";
import { routeStand } from "@/lib/story-route";
import { getSiteSettings, getTutorialStatus } from "@/lib/tutorial";
import { repairGuestUsername } from "@/lib/guest";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Play",
    description: settings.earnEnabled
      ? "Choose Story or Earn and take the paddle."
      : "Take the paddle. Walk Kal home.",
  };
}

export default async function GameMenuPage() {
  const { user, progress } = await requireProgress();
  const [settings, tutorial, { episodes }] = await Promise.all([
    getSiteSettings(),
    getTutorialStatus(user.id),
    getStoryShelf(user.id),
  ]);
  // Closed means absent: no card, no "closed for now", no teaser query.
  const teaser = settings.earnEnabled ? await getEarnTeaser() : null;
  const stand = routeStand(episodes, tutorial.enabled ? { done: tutorial.done } : null);
  const label = (await repairGuestUsername(user.id)) ?? user.username ?? user.name ?? "Player";
  const earnLocked = settings.earnEnabled
    ? !canPlayEarn(user.role, progress.level, settings.earnEnabled)
    : false;

  return (
    <section className="page-gutter flex min-h-[100svh] flex-col justify-center pb-16 pt-28">
      <div className="mx-auto flex w-full max-w-6xl flex-col justify-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Play
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Welcome back, {label}.
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-ink-muted">
        {settings.earnEnabled
          ? `Two ways in. Story is the campaign. Earn opens at level ${EARN_UNLOCK_LEVEL}.`
          : "Story is the campaign. One wall, then the next."}
      </p>
      <div className="mt-10">
        <GameModePicker
          stand={stand}
          teaser={teaser}
          earnLocked={earnLocked}
          earnLockedHint={
            settings.earnEnabled
              ? `Reach level ${EARN_UNLOCK_LEVEL} in Story to unlock.`
              : undefined
          }
          tutorialRequired={tutorial.required}
        />
      </div>
      </div>
    </section>
  );
}
