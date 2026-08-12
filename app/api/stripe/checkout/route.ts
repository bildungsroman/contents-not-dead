import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/subscription";
import { appUrl } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ plan: z.enum(["monthly", "annual"]) });

const PRICE_IDS: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
};

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = PRICE_IDS[parsed.data.plan];
  if (!priceId) {
    return NextResponse.json(
      { error: "Subscription prices are not configured yet." },
      { status: 503 },
    );
  }

  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(userId);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl()}/account?checkout=success`,
    cancel_url: `${appUrl()}/subscribe?checkout=cancelled`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { clerkUserId: userId, app: "contents-not-dead" },
    },
  });

  return NextResponse.json({ url: session.url });
}
