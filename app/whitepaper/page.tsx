import type { Metadata } from "next";
import { VaultShell } from "@/components/vault-shell";

export const metadata: Metadata = {
  title: "Whitepaper",
  description:
    "The rules of King of Thieves: player-built walls, bonus zones, lives, heat, and the publish rule.",
};

export default function WhitepaperPage() {
  return (
    <VaultShell
      kicker="Whitepaper"
      title="The wall, on paper."
      lede="A short design brief for a brick breaker whose levels are made by the people who play it. This is the contract the product has to keep."
    >
      <div className="space-y-8 text-base leading-8 text-ink-muted">
        <section>
          <h2 className="text-xl font-semibold text-ink">Premise</h2>
          <p className="mt-2">
            There are no house levels. Every wall is authored by a player: a
            layout of bricks, a set of bonus zones, and a photo of their choice
            behind the glass. Everyone else plays it with a paddle and three
            lives.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Kit</h2>
          <p className="mt-2">
            Glass bricks break in one hit. Hard bricks take two and crack in
            between. Steel posts never break; they shape the path. Bonus zones
            sit on the open field and trigger when the ball passes through:
            slow halves the speed, ×2 doubles it, ×3 triples it, each for a few
            seconds.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Speed</h2>
          <p className="mt-2">
            The ball starts calm. Every few paddle hits it gains a notch — the
            classic rule — and rapid rebounds build heat that adds more. Heat
            cools when the ball travels freely. Losing a life resets everything.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Publish rule</h2>
          <p className="mt-2">
            A level cannot be published until its author has cleared it. That is
            the only fairness guarantee: if it shipped, it can be beaten.
            Difficulty is allowed. Impossibility is not.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Background</h2>
          <p className="mt-2">
            For now, a photo. It is dimmed behind the field so bricks stay
            readable, and it travels with the level wherever it is played.
          </p>
        </section>
      </div>
    </VaultShell>
  );
}
