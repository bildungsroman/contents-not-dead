import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Challenge, Credential } from "mppx";
import { getAllPreviews } from "@/lib/content";
import { resetMppxForTests } from "@/lib/mpp";
import { getStripe } from "@/lib/stripe";
import { GET } from "./route";

// No session in tests: every caller must pay.
vi.mock("@/lib/subscription", () => ({ hasFeature: async () => false }));
vi.mock("@/lib/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/stripe")>();
  return { ...actual, getStripe: vi.fn(actual.getStripe) };
});

const [postA, postB] = getAllPreviews().map((p) => p.id);

function get(id: string, authorization?: string) {
  return GET(
    new Request(`https://api.example.com/api/content/${id}`, {
      headers: authorization ? { Authorization: authorization } : {},
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe("GET /api/content/{id} payment errors", () => {
  beforeEach(() => {
    resetMppxForTests();
    process.env.MPP_SECRET_KEY = "x".repeat(32);
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(getStripe).mockClear();
  });

  it("explains how to pay on the first, uncredentialed request", async () => {
    const response = await get(postA);
    const body = await response.json();
    expect(response.status).toBe(402);
    expect(Challenge.fromResponseList(response).length).toBeGreaterThan(0);
    expect(body.type).toBe("https://paymentauth.org/problems/payment-required");
    expect(body.charged).toBe("no");
  });

  it("rejects a credential for a different item with a fresh challenge", async () => {
    const [challenge] = Challenge.fromResponseList(await get(postA));
    const credential = Credential.serialize(
      Credential.from({ challenge, payload: { spt: "spt_test_fake" } }),
    );

    const response = await get(postB, credential);
    const body = await response.json();
    expect(response.status).toBe(402);
    expect(body.type).toBe(
      "https://paymentauth.org/problems/invalid-challenge",
    );
    expect(body.hint).toMatch(/content id/);
    expect(body.charged).toBe("unlikely");
    const [fresh] = Challenge.fromResponseList(response);
    expect(fresh.id).not.toBe(challenge.id);
  });

  it("explains a malformed Authorization header", async () => {
    const response = await get(postA, "Payment not-a-credential");
    const body = await response.json();
    expect(response.status).toBe(402);
    expect(body.type).toBe(
      "https://paymentauth.org/problems/malformed-credential",
    );
    expect(body.hint).toMatch(/valid MPP credential/);
  });

  it("answers an unexpected server failure with a 503 problem body", async () => {
    vi.mocked(getStripe).mockImplementationOnce(() => {
      throw new Error("misconfigured");
    });
    const response = await get(postA);
    expect(response.status).toBe(503);
    expect(response.headers.get("Content-Type")).toBe(
      "application/problem+json",
    );
    expect((await response.json()).title).toBe("Payment Server Error");
  });

  it("points at subscribing when machine payments aren't configured", async () => {
    delete process.env.MPP_SECRET_KEY;
    const response = await get(postA);
    expect(response.status).toBe(503);
    expect((await response.json()).hint).toMatch(/\/subscribe/);
  });
});
