import { describe, expect, it } from "vitest";
import { getAllPosts, getPost } from "./content";

describe("post frontmatter access tier", () => {
  it("reads an explicit access tier", () => {
    expect(getPost("making-agents-pay")?.access).toBe("free");
  });

  // a-quiet-machine.md has no `access` field. Omission must mean paid, or
  // adding content would silently publish it.
  it("defaults a post with no access field to paid", () => {
    expect(getPost("a-quiet-machine")?.access).toBe("paid");
  });

  it("gives every post on disk a tier", () => {
    const posts = getAllPosts();
    expect(posts.length).toBeGreaterThan(0);
    for (const post of posts) {
      expect(["free", "paid"]).toContain(post.access);
    }
  });
});
