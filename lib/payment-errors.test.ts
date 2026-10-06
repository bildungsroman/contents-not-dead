import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Errors } from "mppx";
import {
  enrichChallenge,
  paymentServiceError,
  paymentsNotConfigured,
  troubleshootingMarkdown,
} from "./payment-errors";

const CHALLENGE =
  'Payment id="abc", realm="api.example.com", method="stripe", intent="charge", request="e30"';
const DEPOSIT = "0x1111111111111111111111111111111111111111";

/** A 402 shaped exactly as mppx's HTTP transport writes it. */
function mppx402(error?: Errors.PaymentError): Response {
  const headers = new Headers({ "WWW-Authenticate": CHALLENGE });
  if (!error) return new Response(null, { status: 402, headers });
  headers.set("Content-Type", "application/problem+json");
  return new Response(JSON.stringify(error.toProblemDetails("abc")), {
    status: error.status,
    headers,
  });
}

async function enriched(error?: Errors.PaymentError) {
  const response = await enrichChallenge(mppx402(error));
  return { response, body: await response.json() };
}

describe("enrichChallenge", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    delete process.env.MPP_CONTACT_EMAIL;
  });

  afterEach(() => {
    delete process.env.TEMPO_DEPOSIT_ADDRESS;
  });

  it("keeps mppx's status, challenge header, and detail", async () => {
    const { response, body } = await enriched(
      new Errors.PaymentExpiredError({ expires: "2026-01-01T00:00:00Z" }),
    );
    expect(response.status).toBe(402);
    expect(response.headers.get("WWW-Authenticate")).toBe(CHALLENGE);
    expect(response.headers.get("Content-Type")).toBe(
      "application/problem+json",
    );
    expect(body.type).toBe("https://paymentauth.org/problems/payment-expired");
    expect(body.detail).toContain("2026-01-01");
    expect(body.challengeId).toBe("abc");
  });

  it.each([
    [new Errors.PaymentExpiredError(), "unlikely", /expired/],
    [new Errors.InvalidChallengeError(), "unlikely", /content id/],
    [
      new Errors.VerificationFailedError({ reason: "wrong recipient" }),
      "possible",
      /didn't match/,
    ],
    [new Errors.PaymentInsufficientError(), "possible", /\$0\.50/],
    [new Errors.MalformedCredentialError(), "no", /valid MPP credential/],
    [new Errors.PaymentMethodUnsupportedError(), "no", /Accepted methods/],
    [new Errors.InternalPaymentError(), "possible", /temporary problem/],
  ])("replaces the generic hint for %s", async (error, charged, hint) => {
    const { body } = await enriched(error);
    expect(body.charged).toBe(charged);
    expect(body.hint).toMatch(hint);
    expect(body.hint).not.toMatch(/Use a supported wallet/);
    expect(body.docs).toBe(
      "https://api.example.com/.well-known/mpp.md#troubleshooting",
    );
    expect(body.acceptedMethods).toEqual(["stripe"]);
  });

  it("asks the caller to reconcile only when funds may have moved", async () => {
    process.env.MPP_CONTACT_EMAIL = "help@example.com";
    const possible = await enriched(new Errors.VerificationFailedError());
    expect(possible.body.support).toContain("help@example.com");
    expect(possible.body.support).toContain("challengeId abc");

    const no = await enriched(new Errors.MalformedCredentialError());
    expect(no.body.support).toBeUndefined();
  });

  it("explains a replayed payment rather than calling it a failed one", async () => {
    const { body } = await enriched(
      new Errors.VerificationFailedError({
        reason: "Transaction hash has already been used",
      }),
    );
    expect(body.charged).toBe("no");
    expect(body.hint).toMatch(/each payment unlocks/);
  });

  it("gives the bodiless initial 402 a payment-required problem", async () => {
    const { response, body } = await enriched();
    expect(response.headers.get("WWW-Authenticate")).toBe(CHALLENGE);
    expect(body.type).toBe("https://paymentauth.org/problems/payment-required");
    expect(body.charged).toBe("no");
    expect(body.hint).not.toMatch(/Tempo/);
  });

  it("names the Tempo testnet network when Tempo is offered", async () => {
    process.env.TEMPO_DEPOSIT_ADDRESS = DEPOSIT;
    const { body } = await enriched();
    expect(body.acceptedMethods).toEqual(["stripe", "tempo"]);
    expect(body.hint).toContain("Tempo testnet (chainId 42431, pathUSD)");
    expect(body.hint).toContain("mainnet wallets will refuse");
  });

  it("passes through problems it has no guidance for", async () => {
    const original = mppx402(new Errors.BadRequestError({ reason: "nope" }));
    const response = await enrichChallenge(original);
    expect(response).toBe(original);
  });
});

describe("paymentServiceError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  function stripeConnectionError() {
    return Object.assign(new Error("connect ECONNREFUSED"), {
      type: "StripeConnectionError",
    });
  }

  it("is a retryable 503 when a provider is unreachable", async () => {
    const response = paymentServiceError(stripeConnectionError(), {
      hadCredential: false,
    });
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(body.charged).toBe("no");
    expect(body.support).toBeUndefined();
  });

  it("is a non-retryable 503 for anything else", async () => {
    const response = paymentServiceError(new Error("boom"), {
      hadCredential: false,
    });
    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBeNull();
    expect((await response.json()).hint).toMatch(/unlikely to help/);
  });

  it("flags a possible charge when a credential was submitted", async () => {
    const body = await paymentServiceError(stripeConnectionError(), {
      hadCredential: true,
    }).json();
    expect(body.charged).toBe("unlikely");
    expect(body.support).toMatch(/If funds left your wallet/);
  });

  it("never echoes the error message to the caller", async () => {
    const text = await paymentServiceError(new Error("sk_test_secret"), {
      hadCredential: false,
    }).text();
    expect(text).not.toContain("sk_test_secret");
  });
});

describe("paymentsNotConfigured", () => {
  it("points to the subscription alternative", async () => {
    const response = paymentsNotConfigured();
    expect(response.status).toBe(503);
    expect((await response.json()).hint).toMatch(/\/subscribe/);
  });
});

describe("troubleshootingMarkdown", () => {
  it("documents every problem the site explains", () => {
    const md = troubleshootingMarkdown();
    for (const slug of [
      "payment-required",
      "payment-expired",
      "verification-failed",
      "internal-payment-error",
      "payments-unavailable",
    ]) {
      expect(md).toContain(`\`${slug}\``);
    }
  });
});
