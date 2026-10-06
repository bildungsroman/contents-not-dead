import "server-only";

import { Mppx, stripe as mppxStripe } from "mppx/server";
import { getStripe } from "./stripe";
import { apiRealm, PER_CONTENT_PRICE_USD } from "./config";

/** MPP method names this server can offer, in challenge order. */
export type MppMethod = "stripe" | "tempo";

/**
 * The Tempo network a challenge settles on. Token addresses mirror what
 * `stripe.create()` selects for each mode (pathUSD on testnet, USDC.e on
 * mainnet); `lib/mpp.test.ts` asserts they match the issued challenge.
 */
export type TempoRail = {
  recipient: `0x${string}`;
  testnet: boolean;
  chainId: number;
  network: "tempo-testnet" | "tempo";
  currency: `0x${string}`;
  currencySymbol: "pathUSD" | "USDC.e";
};

export const TEMPO_TESTNET_CHAIN_ID = 42431;
export const TEMPO_MAINNET_CHAIN_ID = 4217;
const TEMPO_PATH_USD = "0x20c0000000000000000000000000000000000000";
const TEMPO_USDC = "0x20C000000000000000000000b9537d11c60E8b50";

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

let warnedInvalidAddress = false;

/** Stripe sandbox keys settle Tempo charges on testnet; live keys on mainnet. */
function isLivemode(): boolean {
  return !(process.env.STRIPE_SECRET_KEY ?? "").includes("_test_");
}

/**
 * Stripe's public MPP network id is the account's Business Profile id. The
 * internal fallback keeps existing sandbox/demo setups working, but live mode
 * requires the real profile so SPTs are scoped to the accepting business.
 */
function stripeNetworkId(): string {
  const profileId = process.env.STRIPE_PROFILE_ID?.trim();
  if (profileId) return profileId;
  if (!isLivemode()) return "internal";
  throw new Error("STRIPE_PROFILE_ID must be set for live-mode MPP payments");
}

/**
 * The Tempo rail, when `TEMPO_DEPOSIT_ADDRESS` holds a valid address.
 *
 * An invalid value disables only this rail, so a typo can't take card
 * payments down with it.
 */
export function tempoRail(): TempoRail | null {
  const address = process.env.TEMPO_DEPOSIT_ADDRESS?.trim();
  if (!address) return null;
  if (!ADDRESS.test(address)) {
    if (!warnedInvalidAddress) {
      warnedInvalidAddress = true;
      console.error(
        "[mpp] TEMPO_DEPOSIT_ADDRESS is not a 0x-prefixed 20-byte address; Tempo payments are disabled.",
      );
    }
    return null;
  }
  const testnet = !isLivemode();
  return {
    recipient: address as `0x${string}`,
    testnet,
    chainId: testnet ? TEMPO_TESTNET_CHAIN_ID : TEMPO_MAINNET_CHAIN_ID,
    network: testnet ? "tempo-testnet" : "tempo",
    currency: testnet ? TEMPO_PATH_USD : TEMPO_USDC,
    currencySymbol: testnet ? "pathUSD" : "USDC.e",
  };
}

/** Methods actually offered by `chargeForContent`, for discovery documents. */
export function mppMethods(): MppMethod[] {
  return tempoRail() ? ["stripe", "tempo"] : ["stripe"];
}

/** e.g. "Tempo testnet (chainId 42431, pathUSD)". */
export function describeTempoRail(rail: TempoRail): string {
  return `Tempo ${rail.testnet ? "testnet" : "mainnet"} (chainId ${rail.chainId}, ${rail.currencySymbol})`;
}

/** One human-readable line per offered method, shared by docs and errors. */
export function describeAcceptedMethods(): string[] {
  const tempo = tempoRail();
  return [
    "`stripe`: a Stripe Shared Payment Token (cards and Link)",
    ...(tempo
      ? [
          `\`tempo\`: a stablecoin transfer on ${describeTempoRail(tempo)}` +
            (tempo.testnet
              ? "; mainnet wallets will refuse this challenge, and `tempo wallet fund` tops up a test wallet"
              : ""),
        ]
      : []),
  ];
}

/**
 * A single, process-wide MPP handler offering the Stripe SPT (card/Link) rail
 * and, when configured, Tempo stablecoin payments to a Stripe deposit address.
 *
 * The `secretKey` used to HMAC-bind challenges is read from `MPP_SECRET_KEY`
 * and MUST be stable across deploys/instances, otherwise challenges issued by
 * one instance can't be verified by another. Generating a random key per
 * request (as some quickstarts show) would break verification on serverless.
 *
 * `realm` is passed explicitly for the same reason it can't be left to mppx's
 * env fallback chain: on Vercel that chain lands on `VERCEL_URL`, stamping the
 * challenge with the internal per-deployment hostname instead of the origin
 * agents actually call.
 *
 * Tempo replay protection uses mppx's default in-memory store, which is
 * per-instance: on a multi-instance deployment a used transaction hash is only
 * rejected by the instance that consumed it.
 */
let cached: ReturnType<typeof buildMppx> | null = null;

function buildMppx() {
  const secretKey = process.env.MPP_SECRET_KEY;
  if (!secretKey || secretKey.length < 32) {
    throw new Error(
      "MPP_SECRET_KEY must be set to a stable value of at least 32 bytes",
    );
  }

  const tempo = tempoRail();
  const machinePayments = mppxStripe.create({
    client: getStripe(),
    networkId: stripeNetworkId(),
    livemode: isLivemode(),
    ...(tempo && { depositAddresses: { tempo: tempo.recipient } }),
  });

  const mppx = Mppx.create({
    methods: machinePayments.defaultMethods(),
    realm: apiRealm(),
    secretKey,
  });

  mppx.onPaymentFailed(({ challenge, error, method }) => {
    console.warn(
      "[mpp] payment failed",
      JSON.stringify({
        challengeId: challenge.id,
        method: method.name,
        type: error.type,
        detail: error.message,
      }),
    );
  });

  // mppx swallows errors from its own success hooks, including a failure to
  // record a Tempo payment in Stripe, so this line is the reconciliation trail.
  mppx.onPaymentSuccess(({ challenge, method, receipt }) => {
    console.info(
      "[mpp] payment succeeded",
      JSON.stringify({
        challengeId: challenge.id,
        method: method.name,
        reference: receipt.reference,
      }),
    );
  });

  return mppx;
}

export function getMppx() {
  if (!cached) cached = buildMppx();
  return cached;
}

export function isMppConfigured(): boolean {
  return Boolean(
    process.env.MPP_SECRET_KEY &&
    process.env.MPP_SECRET_KEY.length >= 32 &&
    process.env.STRIPE_SECRET_KEY &&
    (!isLivemode() || process.env.STRIPE_PROFILE_ID?.trim()),
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

/** Drops the cached handler so tests can rebuild it under a new environment. */
export function resetMppxForTests() {
  cached = null;
  warnedInvalidAddress = false;
}
