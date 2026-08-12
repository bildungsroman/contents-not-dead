import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  fetchSubscriptionFromStripe,
  findUserByStripeCustomer,
  writeSubscriptionState,
} from "@/lib/subscription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveClerkUserId(
  stripe: Stripe,
  customerId: string,
  metaUserId?: string | null,
): Promise<string | null> {
  if (metaUserId) return metaUserId;
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer.deleted) {
      const id = (customer.metadata as Record<string, string>)?.clerkUserId;
      if (id) return id;
    }
  } catch {
    // ignore
  }
  return findUserByStripeCustomer(customerId);
}

async function syncCustomer(
  stripe: Stripe,
  customerId: string,
  metaUserId?: string | null,
) {
  const userId = await resolveClerkUserId(stripe, customerId, metaUserId);
  if (!userId) return;
  const derived = (await fetchSubscriptionFromStripe(customerId)) ?? {
    status: "none" as const,
  };
  await writeSubscriptionState(userId, customerId, derived);
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Signature verification requires the exact raw body.
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;
        if (customerId) {
          await syncCustomer(
            stripe,
            customerId,
            session.client_reference_id ||
              (session.metadata as Record<string, string>)?.clerkUserId,
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer.id;
        await syncCustomer(
          stripe,
          customerId,
          (sub.metadata as Record<string, string>)?.clerkUserId,
        );
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // Log and return 500 so Stripe retries.
    console.error("Webhook handler error:", (err as Error).message);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
