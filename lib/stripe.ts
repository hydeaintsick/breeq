import Stripe from "stripe";

/**
 * Stripe is the only payment rail: gem packs are paid inside the shop sheet
 * (a PaymentIntent confirmed by Stripe Elements — card, Apple Pay, Google
 * Pay) and credited when the intent succeeds (the sheet asking right away, or
 * the webhook). Keys come from the Vercel Stripe integration or `.env`;
 * without both keys the shop says so and sells nothing.
 */

let client: Stripe | null = null;

/** The secret key is set: the server can create and read payments. */
export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** The publishable key the browser needs for Stripe.js, or `null` when unset. */
export function stripePublishableKey(): string | null {
  return process.env.STRIPE_PUBLISHABLE_KEY || null;
}

/** Both keys are set: the shop can take a payment in the sheet. */
export function stripeReady() {
  return stripeConfigured() && stripePublishableKey() !== null;
}

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Stripe is not configured.");
  }
  if (!client) {
    client = new Stripe(key, { typescript: true });
  }
  return client;
}

/** Local play money: lets a dev credit gems without a card. Never on in production. */
export function earnSandbox() {
  return process.env.EARN_SANDBOX === "true" && process.env.NODE_ENV !== "production";
}
