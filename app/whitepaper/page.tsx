import type { Metadata } from "next";
import { VaultShell } from "@/components/vault-shell";

export const metadata: Metadata = {
  title: "Whitepaper",
  description:
    "The rules of King of Thieves: player-built walls, the piece kit, lives, heat, and the publish rule.",
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
            layout of bricks, zones and obstacles from a shared kit, a few
            rules, and a photo of their choice behind the glass. Everyone else
            plays it with a paddle and the lives the author allowed.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">Kit</h2>
          <p className="mt-2">
            Four families. <strong className="font-medium text-ink">Bricks</strong>{" "}
            are what you break: glass, hard, steel, explosive, ghost, regen,
            magnet, rotor, key and lock.{" "}
            <strong className="font-medium text-ink">Zones</strong> sit on the
            open field and act when the ball passes through: slow, ×2, ×3,
            gravity, anti-gravity, a portal pair, a fake portal, a mirror, fog, a
            split that adds a second ball, and paddle modifiers — shrink, grow,
            invert, ice, sticky.{" "}
            <strong className="font-medium text-ink">Obstacles</strong> are
            not part of the wall: bumper, rail, fan, sweeping guard, trampoline,
            black hole. <strong className="font-medium text-ink">Rules</strong>{" "}
            are set once: lives, a timer, a wall that descends, a color that
            must fall first.
          </p>
          <p className="mt-2">
            Every piece has a cost and a level has a budget. The player picks.
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
            A level cannot be published until its author has cleared it and a
            flawless autopilot has cleared it too. Before that, the editor
            refuses what cannot work: unpaired portals, keys sealed in by
            locks, pieces in the paddle lane, more than one split zone, a wall
            over budget. Difficulty is allowed. Impossibility is not.
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
