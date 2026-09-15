import { beforeEach, describe, expect, it } from "vitest";
import { getAllPreviews } from "@/lib/content";
import { GET } from "./route";

/**
 * Guards the contract MPPScan and agent tooling resolve at /openapi.json.
 * Each assertion here maps to a documented discovery failure mode, so a
 * regression shows up as a test failure rather than a rejected registration.
 */
async function fetchDoc(): Promise<any> {
  return (await GET()).json();
}

describe("/openapi.json", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    delete process.env.MPP_CONTACT_EMAIL;
  });

  it("publishes the required top-level fields", async () => {
    const doc = await fetchDoc();
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.info.title).toBeTruthy();
    expect(doc.info.version).toBeTruthy();
    expect(doc.info["x-guidance"]).toBeTruthy();
    expect(Object.keys(doc.paths).length).toBeGreaterThan(0);
  });

  it("advertises the configured public origin at a root path", async () => {
    const doc = await fetchDoc();
    expect(doc.servers[0].url).toBe("https://api.example.com");
    // A non-root server path would mean paths must not repeat the base.
    expect(new URL(doc.servers[0].url).pathname).toBe("/");
  });

  it("includes contact only when one is configured", async () => {
    expect((await fetchDoc()).info.contact).toBeUndefined();
    process.env.MPP_CONTACT_EMAIL = "hi@example.com";
    expect((await fetchDoc()).info.contact.email).toBe("hi@example.com");
  });

  describe("the paid operation", () => {
    it("declares a 402 response carrying a WWW-Authenticate challenge", async () => {
      const op = (await fetchDoc()).paths["/api/content/{id}"].get;
      expect(op.responses["402"]).toBeDefined();
      expect(op.responses["402"].headers["WWW-Authenticate"]).toBeDefined();
    });

    it("declares price and protocols in x-payment-info", async () => {
      const info = (await fetchDoc()).paths["/api/content/{id}"].get[
        "x-payment-info"
      ];
      expect(info.price).toEqual({
        mode: "fixed",
        currency: "USD",
        amount: "0.500000",
      });
      expect(Array.isArray(info.protocols)).toBe(true);
      // Must match what lib/mpp.ts actually charges, or discovery and the
      // runtime challenge disagree.
      expect(info.protocols[0].mpp).toEqual({
        method: "stripe",
        intent: "charge",
        currency: "usd",
      });
    });

    it("declares an auth mode and both input and output schemas", async () => {
      const op = (await fetchDoc()).paths["/api/content/{id}"].get;
      expect(op.security).toEqual([{ mpp: [] }]);
      expect(op.parameters[0].schema).toBeDefined();
      expect(op.responses["200"].content["text/markdown"].schema).toBeDefined();
    });

    it("names a real content id so probes reach the 402 rather than the 404", async () => {
      const op = (await fetchDoc()).paths["/api/content/{id}"].get;
      const ids = getAllPreviews().map((p) => p.id);
      expect(ids).toContain(op.parameters[0].example);
      expect(op.parameters[0].schema.enum).toEqual(ids);
    });

    it("resolves the declared security scheme", async () => {
      const doc = await fetchDoc();
      const name = Object.keys(doc.paths["/api/content/{id}"].get.security[0])[0];
      expect(doc.components.securitySchemes[name]).toBeDefined();
    });
  });

  it("marks every free operation with an explicit empty security list", async () => {
    const doc = await fetchDoc();
    for (const path of [
      "/agents",
      "/agents/{id}",
      "/llms.txt",
      "/.well-known/mpp.json",
    ]) {
      expect(doc.paths[path].get.security, path).toEqual([]);
    }
  });

  it("omits post-payment asset URLs, which answer probes without a challenge", async () => {
    const doc = await fetchDoc();
    expect(Object.keys(doc.paths)).not.toContain("/api/content/{id}/asset");
  });

  it("omits internal Stripe routes", async () => {
    const doc = await fetchDoc();
    const stripeRoutes = Object.keys(doc.paths).filter((p) =>
      p.startsWith("/api/stripe"),
    );
    expect(stripeRoutes).toEqual([]);
  });
});
