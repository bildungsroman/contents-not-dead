import { beforeEach, describe, expect, it } from "vitest";
import { renderPaidMarkdown, renderTeaserMarkdown } from "./agent-format";
import { getPost, toPreview } from "./content";

describe("agent markdown reading time", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  const post = getPost("a-history-of-open-source-software")!;
  const frontmatter = (markdown: string) => markdown.split("\n---\n")[0];

  it("is in the paid markdown's frontmatter", () => {
    expect(frontmatter(renderPaidMarkdown(post))).toContain(
      `readingTimeMinutes: ${post.readingTimeMinutes}`,
    );
  });

  it("is in the free teaser's frontmatter", () => {
    expect(frontmatter(renderTeaserMarkdown(toPreview(post)))).toContain(
      `readingTimeMinutes: ${post.readingTimeMinutes}`,
    );
  });
});
