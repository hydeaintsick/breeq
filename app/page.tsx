import Link from "next/link";
import { BreakoutPreview } from "@/components/breakout-preview";
import { PieceKit } from "@/components/piece-kit";
import { CATALOG, LEVEL_BUDGET } from "@/game/breakout/engine/catalog";

const steps = [
  {
    index: "01",
    title: "Your wall",
    body: "Every level is built by a player. Lay glass, hard, and steel bricks over a photo of your choice — then explosives, ghosts, keys and locks if you want the wall to fight back.",
  },
  {
    index: "02",
    title: "Zones and obstacles",
    body: "Drop zones onto the field and the ball obeys them: slow, ×2, ×3, gravity, portals, a mirror. Add bumpers, a fan, a sweeping guard. Where you put them is the whole design.",
  },
  {
    index: "03",
    title: "Lives, heat, rules",
    body: "One to five lives. The ball gets faster with rapid rebounds — the classic rule. Add a timer, make the wall descend, or force one color to fall first.",
  },
  {
    index: "04",
    title: "For players, by players",
    body: "Clear your own level before you publish it. Then it goes on the shelf for everyone, with your name and your photo behind the glass.",
  },
] as const;

const PIECE_COUNT = CATALOG.filter((entry) => entry.family !== "rule").length;

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
            your own photo from a kit of {PIECE_COUNT} pieces — bricks that
            explode or come back, zones that bend the ball, portals, bumpers, a
            black hole — and dare everyone else to clear it.
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

      <section id="kit" className="mx-auto w-full max-w-6xl px-6 pb-28">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          The kit
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {PIECE_COUNT} pieces. You <span className="text-neon">choose</span>.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
          Every piece costs points and a level has {LEVEL_BUDGET} to spend. The
          editor refuses a wall that cannot be cleared: portals must be paired,
          keys cannot be sealed in, nothing sits in the paddle lane, and the
          autopilot has to beat it once before you can publish.
        </p>
        <PieceKit />
      </section>
    </>
  );
}
