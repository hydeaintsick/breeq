import Link from "next/link";
import { BreakoutPreview } from "@/components/breakout-preview";

const steps = [
  {
    index: "01",
    title: "Your wall",
    body: "Every level is built by a player. Lay glass bricks, hard bricks, and steel posts over a photo of your choice. Your wall is the level everyone else has to clear.",
  },
  {
    index: "02",
    title: "Bonus zones",
    body: "Drop zones onto the field and the ball obeys them. Slow zones halve its speed. Fast zones push it to ×2 or ×3. Where you put them is the whole design.",
  },
  {
    index: "03",
    title: "Lives and heat",
    body: "Three lives. The ball gets faster the more it rebounds in quick succession — the classic rule — so a tight wall punishes sloppy paddles.",
  },
  {
    index: "04",
    title: "For players, by players",
    body: "Clear your own level before you publish it. Then it goes on the shelf for everyone, with your name and your photo behind the glass.",
  },
] as const;

export default function Home() {
  return (
    <>
      <section className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center gap-16 px-6 pb-20 pt-28 lg:flex-row lg:items-center lg:gap-20">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            King of Thieves · Brick breaker
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
            Build the wall.
            <br />
            <span className="text-neon">Break</span> the wall.
          </h1>
          <p className="mt-6 text-lg leading-8 text-ink-muted">
            A brick breaker made by players, for players. Design a level over
            your own photo, place zones that slow the ball or send it flying at
            ×3, and dare everyone else to clear it with three lives.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/play" className="btn-play play-shimmer">
              Play
            </Link>
            <a href="#how-it-works" className="nav-link">
              How it works
            </a>
          </div>
        </div>

        <BreakoutPreview />
      </section>

      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl px-6 pb-28"
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          How it works
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          You are not playing our levels. You are playing each other&apos;s.
        </h2>

        <ol className="mt-14 grid gap-5 md:grid-cols-2">
          {steps.map((step) => (
            <li key={step.index} className="glass p-7">
              <p className="font-mono text-xs tracking-[0.16em] text-accent">
                {step.index}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-ink-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
