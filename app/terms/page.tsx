import type { Metadata } from "next";
import { VaultShell } from "@/components/vault-shell";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms of use for the King of Thieves showcase site.",
};

export default function TermsPage() {
  return (
    <VaultShell
      kicker="Terms"
      title="House rules."
      lede="This site is a showcase for a game that is not yet live. These terms cover the site you are on, not a finished multiplayer game."
    >
      <div className="space-y-8 text-base leading-8 text-ink-muted">
        <section>
          <h2 className="text-xl font-semibold text-ink">1. The showcase</h2>
          <p className="mt-2">
            Pages, copy, and the board preview are for information and
            demonstration. They do not grant access to a live game, scores, or
            player levels.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">2. Play</h2>
          <p className="mt-2">
            The Play control points to a future session. Until levels open, it
            does not start a ranked match or create an account with a
            score.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">3. Contact</h2>
          <p className="mt-2">
            Messages sent through Contact are inquiries only. Do not send
            secrets, payment details, or anything you cannot afford to have
            stored as ordinary email.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold text-ink">4. Changes</h2>
          <p className="mt-2">
            Rules, economy numbers, and this site will change as the game is
            built. If we ship a live product, a fuller agreement will replace
            this page.
          </p>
        </section>
      </div>
    </VaultShell>
  );
}
