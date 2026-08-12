import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { getOrCreateStripeCustomer } from "@/lib/subscription";
import { appUrl } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const stripe = getStripe();
  const customerId = await getOrCreateStripeCustomer(userId);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl()}/account`,
  });
  return NextResponse.json({ url: session.url });
}
