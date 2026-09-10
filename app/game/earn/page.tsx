import type { Metadata } from "next";
import Link from "next/link";
import { BreakoutPreview } from "@/components/breakout-preview";
import { LOCKDOWN, UNDERTOW } from "@/game/breakout/levels";
import { GAME_MENU_PATH } from "@/lib/auth/paths";
import { requireEarn } from "@/lib/auth/session";

const EARN_LEVELS = [LOCKDOWN, UNDERTOW];

export const metadata: Metadata = {
  title: "Earn",
  description: "Publish or play levels to earn real money.",
};

export default async function EarnPage() {
  await requireEarn();

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col items-center justify-center gap-12 px-6 pb-20 pt-28 lg:flex-row">
      <div className="max-w-xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Earn
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Other players&apos; walls
        </h1>
        <p className="mt-5 text-lg leading-8 text-ink-muted">
          Publish or play levels to earn real money. Move over a board to take
          the paddle.
        </p>
        <Link href={GAME_MENU_PATH} className="nav-link mt-8 inline-flex min-h-11 items-center">
          Back to modes
        </Link>
      </div>
      <BreakoutPreview
        levels={EARN_LEVELS}
        seed={23}
        followQuery={false}
        controls="hybrid"
      />
    </section>
  );
}
