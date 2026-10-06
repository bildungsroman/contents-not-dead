import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isExternalHref } from "./links";

const savedAppUrl = process.env.NEXT_PUBLIC_APP_URL;

/** Decides which Markdown links open in a new tab. */
describe("isExternalHref", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://www.example.com";
  });

  afterEach(() => {
    if (savedAppUrl === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = savedAppUrl;
  });

  it("treats another site as external", () => {
    expect(isExternalHref("https://mpp.dev")).toBe(true);
    expect(isExternalHref("http://stripe.com/docs")).toBe(true);
  });

  it("keeps absolute links to this site internal", () => {
    expect(isExternalHref("https://www.example.com/post/abc")).toBe(false);
    expect(isExternalHref("https://www.example.com")).toBe(false);
  });

  it("treats a sibling subdomain as external", () => {
    expect(isExternalHref("https://api.example.com/openapi.json")).toBe(true);
  });

  it("keeps relative paths and fragments internal", () => {
    expect(isExternalHref("/agents")).toBe(false);
    expect(isExternalHref("#section")).toBe(false);
    expect(isExternalHref("post/abc")).toBe(false);
  });

  it("ignores non-http schemes", () => {
    expect(isExternalHref("mailto:hi@example.com")).toBe(false);
    expect(isExternalHref("javascript:alert(1)")).toBe(false);
  });

  it("handles a missing or malformed href", () => {
    expect(isExternalHref(undefined)).toBe(false);
    expect(isExternalHref("")).toBe(false);
    expect(isExternalHref("https://")).toBe(false);
  });
});
