import "server-only";

import { Mppx, stripe as mppxStripe } from "mppx/server";
import { getStripe } from "./stripe";
import { PER_CONTENT_PRICE_USD } from "./config";

/**
 * A single, process-wide MPP handler for the Stripe SPT (fiat) rail.
 *
 * The `secretKey` used to HMAC-bind challenges is read from `MPP_SECRET_KEY`
 * and MUST be stable across deploys/instances, otherwise challenges issued by
 * one instance can't be verified by another. Generating a random key per
 * request (as some quickstarts show) would break verification on serverless.
 */
let cached: ReturnType<typeof buildMppx> | null = null;

function buildMppx() {
  const secretKey = process.env.MPP_SECRET_KEY;
  if (!secretKey || secretKey.length < 32) {
    throw new Error(
      "MPP_SECRET_KEY must be set to a stable value of at least 32 bytes",
    );
  }

  return Mppx.create({
    methods: [
      mppxStripe.charge({
        client: getStripe(),
        networkId: "internal",
        currency: "usd",
        decimals: 2,
        paymentMethodTypes: ["card", "link"],
      }),
    ],
    secretKey,
  });
}

export function getMppx() {
  if (!cached) cached = buildMppx();
  return cached;
}

export function isMppConfigured(): boolean {
  return Boolean(
    process.env.MPP_SECRET_KEY &&
      process.env.MPP_SECRET_KEY.length >= 32 &&
      process.env.STRIPE_SECRET_KEY,
  );
}

/**
 * Runs the MPP charge for a piece of content. Returns either a 402 challenge
 * `Response` or a `withReceipt` wrapper to attach to the successful response.
 */
export async function chargeForContent(request: Request, contentId: string) {
  const mppx = getMppx();
  return mppx.charge({
    amount: PER_CONTENT_PRICE_USD,
    description: `Access to "${contentId}" on Content's Not Dead`,
    metadata: { content_id: contentId },
    // Bind the challenge to this specific resource.
    scope: `content:${contentId}`,
  })(request);
}
