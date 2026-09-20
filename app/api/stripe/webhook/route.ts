import type Stripe from "stripe";
import { fulfilPaymentIntent, fulfilPurchase } from "@/lib/purchases";
import { stripe, stripeConfigured } from "@/lib/stripe";

/**
 * Stripe → Breeq. `payment_intent.succeeded` is the in-sheet payment;
 * `checkout.session.completed` covers sessions opened before payments moved
 * into the sheet. Either way the pack is credited once, whichever of this
 * hook or the shop sheet gets there first. Point Stripe at
 * `/api/stripe/webhook` and put the signing secret in `STRIPE_WEBHOOK_SECRET`.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeConfigured() || !secret) {
    return new Response("Stripe is not configured.", { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature.", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = stripe().webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    console.error("stripe webhook signature failed", error);
    return new Response("Bad signature.", { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    try {
      await fulfilPaymentIntent(event.data.object.id);
    } catch (error) {
      console.error("stripe fulfilment failed", error);
      return new Response("Fulfilment failed.", { status: 500 });
    }
  } else if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      try {
        await fulfilPurchase(session.id);
      } catch (error) {
        console.error("stripe fulfilment failed", error);
        return new Response("Fulfilment failed.", { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
}
