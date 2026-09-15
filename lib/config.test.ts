import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { apiRealm, apiUrl, authorizedOrigins } from "./config";

const saved = {
  api: process.env.NEXT_PUBLIC_API_URL,
  app: process.env.NEXT_PUBLIC_APP_URL,
  vercel: process.env.VERCEL_URL,
  branch: process.env.VERCEL_BRANCH_URL,
};

function restore(key: keyof typeof saved, name: string) {
  if (saved[key] === undefined) delete process.env[name];
  else process.env[name] = saved[key];
}

describe("public origin resolution", () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_BRANCH_URL;
  });

  afterEach(() => {
    restore("api", "NEXT_PUBLIC_API_URL");
    restore("app", "NEXT_PUBLIC_APP_URL");
    restore("vercel", "VERCEL_URL");
    restore("branch", "VERCEL_BRANCH_URL");
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

/**
 * A production Clerk instance on the root domain shares sessions across every
 * subdomain, so this list is what stops a sibling subdomain from presenting one.
 */
describe("authorized session origins", () => {
  beforeEach(() => {
    delete process.env.VERCEL_URL;
    delete process.env.VERCEL_BRANCH_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://www.example.com";
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  afterEach(() => {
    restore("api", "NEXT_PUBLIC_API_URL");
    restore("app", "NEXT_PUBLIC_APP_URL");
    restore("vercel", "VERCEL_URL");
    restore("branch", "VERCEL_BRANCH_URL");
  });

  it("allows both origins the app actually serves", () => {
    expect(authorizedOrigins().sort()).toEqual([
      "https://api.example.com",
      "https://www.example.com",
    ]);
  });

  it("excludes sibling subdomains that are not served", () => {
    expect(authorizedOrigins()).not.toContain("https://evil.example.com");
  });

  it("allows Vercel deployment hostnames so previews keep working", () => {
    process.env.VERCEL_URL = "proj-abc123-team.vercel.app";
    process.env.VERCEL_BRANCH_URL = "proj-git-branch-team.vercel.app";
    const origins = authorizedOrigins();
    expect(origins).toContain("https://proj-abc123-team.vercel.app");
    expect(origins).toContain("https://proj-git-branch-team.vercel.app");
  });

  it("does not duplicate when both origins resolve the same", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(authorizedOrigins()).toEqual(["https://www.example.com"]);
  });
});
