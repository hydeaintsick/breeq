import type { Metadata } from "next";
import { EconomyForm } from "@/components/economy-form";
import { requireAdmin } from "@/lib/auth/session";
import { getEconomy } from "@/lib/earn";
import { stripeReady } from "@/lib/stripe";

export const metadata: Metadata = {
  title: "Economy — Admin",
  description: "Gem price, ETH reference, payouts, packs.",
};

export default async function AdminEconomyPage() {
  await requireAdmin();
  const economy = await getEconomy();

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Admin space</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Economy</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted">
        One gem has a USD price; packs discount it. A win pays the multiplier times the ticket&apos;s USD value,
        converted to ETH at the reference and locked in when the ticket is paid. Stripe is{" "}
        {stripeReady()
          ? "connected"
          : "not configured — set STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY and STRIPE_WEBHOOK_SECRET"}
        .
      </p>
      <EconomyForm initial={economy} />
    </section>
  );
}
