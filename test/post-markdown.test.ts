import { describe, expect, it } from "vitest";
import { stripLeadingH1 } from "@/lib/post-markdown";

/**
 * Post views render the title above the body, so a body that opens with its
 * own H1 shows the headline twice. Generated articles do exactly that.
 */
describe("stripLeadingH1", () => {
  it("drops a leading H1 and keeps the rest of the body", () => {
    const body = "# Small Daily Wins\n\nIn a world that feels overwhelming.\n";
    expect(stripLeadingH1(body)).toBe(
      "\nIn a world that feels overwhelming.\n",
    );
  });

  it("drops the heading when it is preceded by blank lines", () => {
    expect(stripLeadingH1("\n\n# Title\n\nBody.")).toBe("\nBody.");
  });

  it("leaves a body that starts with prose untouched", () => {
    const body = "Is content dead? That's the central premise.\n";
    expect(stripLeadingH1(body)).toBe(body);
  });

  it("leaves section headings untouched", () => {
    const body = "## The Beauty of Small Wins\n\nEvery morning.\n";
    expect(stripLeadingH1(body)).toBe(body);
  });

  it("only strips the first heading", () => {
    expect(stripLeadingH1("# One\n\n# Two\n\nBody.")).toBe("\n# Two\n\nBody.");
  });

  it("does not treat a hash without a space as a heading", () => {
    const body = "#hashtag is not a heading\n";
    expect(stripLeadingH1(body)).toBe(body);
  });

  it("handles a body that is only a heading", () => {
    expect(stripLeadingH1("# Just A Title")).toBe("");
  });
});
