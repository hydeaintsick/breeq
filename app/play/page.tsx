import type { Metadata } from "next";
import Link from "next/link";
import { BreakoutPreview } from "@/components/breakout-preview";

export const metadata: Metadata = {
  title: "Play",
  description: "The first player-built levels are being laid. Until then, take the paddle on a live one.",
};

export default function PlayPage() {
  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col items-center justify-center gap-12 px-6 pb-20 pt-28 lg:flex-row">
      <div className="max-w-xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Play
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          The first walls are still going up.
        </h1>
        <p className="mt-5 text-lg leading-8 text-ink-muted">
          Play opens with the first published levels. Until then, this one is
          live: move over the board to take the paddle, tap to launch. Same
          engine, same rules, no account.
        </p>
        <Link href="/#how-it-works" className="nav-link mt-8 inline-block">
          Read how it works
        </Link>
      </div>
      <BreakoutPreview />
    </section>
  );
}
