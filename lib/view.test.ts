import { describe, expect, it } from "vitest";
import { activeView, parseView, viewHref } from "./view";

describe("parseView", () => {
  it("recognizes the agent view", () => {
    expect(parseView("agent")).toBe("agent");
  });

  it("falls back to human for missing or unknown values", () => {
    expect(parseView(undefined)).toBe("human");
    expect(parseView(null)).toBe("human");
    expect(parseView("")).toBe("human");
    expect(parseView("AGENT")).toBe("human");
    expect(parseView("robot")).toBe("human");
  });

  it("uses the first value of a repeated param", () => {
    expect(parseView(["agent", "human"])).toBe("agent");
    expect(parseView(["human", "agent"])).toBe("human");
  });
});

describe("activeView", () => {
  it("follows the view param on the homepage", () => {
    expect(activeView("/", "agent")).toBe("agent");
    expect(activeView("/", null)).toBe("human");
  });

  it("treats every other page as human, even with a view param", () => {
    for (const path of ["/subscribe", "/account", "/docs", "/post/x"]) {
      expect(activeView(path, null)).toBe("human");
      expect(activeView(path, "agent")).toBe("human");
    }
  });
});

describe("viewHref", () => {
  it("round-trips through parseView", () => {
    for (const view of ["human", "agent"] as const) {
      const url = new URL(viewHref(view), "http://localhost");
      expect(url.pathname).toBe("/");
      expect(parseView(url.searchParams.get("view"))).toBe(view);
    }
  });

  it("keeps the human view param-free", () => {
    expect(viewHref("human")).toBe("/");
  });
});
