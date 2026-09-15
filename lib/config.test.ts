import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { apiRealm, apiUrl } from "./config";

const saved = {
  api: process.env.NEXT_PUBLIC_API_URL,
  app: process.env.NEXT_PUBLIC_APP_URL,
  vercel: process.env.VERCEL_URL,
};

describe("public origin resolution", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = saved.api;
    process.env.NEXT_PUBLIC_APP_URL = saved.app;
    process.env.VERCEL_URL = saved.vercel;
  });

  it("prefers the dedicated agent origin", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    process.env.NEXT_PUBLIC_APP_URL = "https://www.example.com";
    expect(apiUrl()).toBe("https://api.example.com");
  });

  it("falls back to the site origin for clones serving one host", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://www.example.com";
    expect(apiUrl()).toBe("https://www.example.com");
  });

  it("trims a trailing slash so joined paths never double up", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com/";
    expect(apiUrl()).toBe("https://api.example.com");
  });

  /**
   * The realm is what agents match a challenge against. Leaving it to mppx's
   * env chain resolved VERCEL_URL to the internal per-deployment hostname,
   * which is the "realm mismatch" discovery failure.
   */
  it("derives the realm from the public origin, ignoring VERCEL_URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    process.env.VERCEL_URL = "proj-abc123-team.vercel.app";
    expect(apiRealm()).toBe("api.example.com");
  });
});
