import type { Metadata } from "next";
import { GameModePicker } from "@/components/game-mode-picker";
import { requireProgress } from "@/lib/auth/session";
import { canPlayEarn } from "@/lib/progress";

export const metadata: Metadata = {
  title: "Play",
  description: "Choose Story or Earn and take the paddle.",
};

export default async function GameMenuPage() {
  const { user, progress } = await requireProgress();
  const label = user.username ?? user.name ?? "Player";
  const earnLocked = !canPlayEarn(user.role, progress.level);

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center px-4 pb-16 pt-28 sm:px-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Play
      </p>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Welcome back, {label}.
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-ink-muted">
        Two ways in. Story is the campaign. Earn opens at level 5.
      </p>
      <div className="mt-10">
        <GameModePicker earnLocked={earnLocked} />
      </div>
    </section>
  );
}
