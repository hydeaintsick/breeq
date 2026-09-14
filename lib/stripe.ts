import Stripe from "stripe";

/**
 * Stripe is the only payment rail: gem packs are sold through Checkout
 * Sessions and credited when the session is paid (webhook, or the success
 * page asking Stripe directly). Keys come from the Vercel Stripe integration
 * or `.env`; without a secret key the top-up page says so and sells nothing.
 */

let client: Stripe | null = null;

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
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
