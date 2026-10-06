import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Challenge } from "mppx";
import {
  chargeForContent,
  isMppConfigured,
  mppMethods,
  resetMppxForTests,
  TEMPO_MAINNET_CHAIN_ID,
  TEMPO_TESTNET_CHAIN_ID,
  tempoRail,
} from "./mpp";

const DEPOSIT = "0x1111111111111111111111111111111111111111";

function challengesOf(response: Response) {
  return Challenge.fromResponseList(response);
}

async function unpaid(contentId = "a-quiet-machine") {
  const result = await chargeForContent(
    new Request(`https://api.example.com/api/content/${contentId}`),
    contentId,
  );
  if (result.status !== 402) throw new Error("expected a 402 challenge");
  return result.challenge;
}

describe("MPP challenge", () => {
  beforeEach(() => {
    resetMppxForTests();
    process.env.MPP_SECRET_KEY = "x".repeat(32);
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  afterEach(() => {
    delete process.env.TEMPO_DEPOSIT_ADDRESS;
    delete process.env.STRIPE_PROFILE_ID;
    vi.restoreAllMocks();
  });

  it("offers Tempo testnet alongside Stripe when a deposit address is set", async () => {
    process.env.TEMPO_DEPOSIT_ADDRESS = DEPOSIT;
    const challenges = challengesOf(await unpaid());

    expect(challenges.map((c) => c.method).sort()).toEqual(["stripe", "tempo"]);
    const tempo = challenges.find((c) => c.method === "tempo")!;
    expect(tempo.intent).toBe("charge");
    const methodDetails = tempo.request.methodDetails as { chainId?: number };
    expect(methodDetails.chainId).toBe(TEMPO_TESTNET_CHAIN_ID);
    expect(tempo.request.amount).toBe("500000");
    expect(String(tempo.request.recipient).toLowerCase()).toBe(DEPOSIT);
    expect(String(tempo.request.currency).toLowerCase()).toBe(
      tempoRail()!.currency.toLowerCase(),
    );
    expect(mppMethods()).toEqual(["stripe", "tempo"]);
  });

  it("offers only Stripe when no deposit address is set", async () => {
    const challenges = challengesOf(await unpaid());
    expect(challenges.map((c) => c.method)).toEqual(["stripe"]);
    expect(mppMethods()).toEqual(["stripe"]);
  });

  it("drops only the Tempo rail when the deposit address is invalid", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.TEMPO_DEPOSIT_ADDRESS = "0xnot-an-address";

    const challenges = challengesOf(await unpaid());
    expect(challenges.map((c) => c.method)).toEqual(["stripe"]);
    expect(mppMethods()).toEqual(["stripe"]);
    expect(error).toHaveBeenCalledTimes(1);
  });

  it("uses the Business Profile and Tempo mainnet with a live key", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_fake";
    process.env.STRIPE_PROFILE_ID = "profile_live_example";
    process.env.TEMPO_DEPOSIT_ADDRESS = DEPOSIT;

    const challenges = challengesOf(await unpaid());
    const stripe = challenges.find((c) => c.method === "stripe")!;
    const tempo = challenges.find((c) => c.method === "tempo")!;

    expect(
      (stripe.request.methodDetails as { networkId?: string }).networkId,
    ).toBe("profile_live_example");
    expect((tempo.request.methodDetails as { chainId?: number }).chainId).toBe(
      TEMPO_MAINNET_CHAIN_ID,
    );
  });

  it("requires a Business Profile when a live key is configured", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_fake";
    expect(isMppConfigured()).toBe(false);

    process.env.STRIPE_PROFILE_ID = "profile_live_example";
    expect(isMppConfigured()).toBe(true);
  });
});
