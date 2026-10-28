import { describe, expect, it } from "vitest";
import { getAllPosts, getPost, splitFeatured } from "./content";

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

describe("post ordering", () => {
  it("returns posts on disk newest first", () => {
    const dates = getAllPosts().map((p) => p.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });
});

describe("splitFeatured", () => {
  const post = (id: string, tags: string[] = []) => ({ id, tags });

  it("pulls out the first featured post and keeps the rest in order", () => {
    const posts = [
      post("newest"),
      post("featured-newer", ["featured"]),
      post("middle", ["mpp"]),
      post("featured-older", ["featured"]),
      post("oldest"),
    ];
    const { featured, rest } = splitFeatured(posts);
    expect(featured?.id).toBe("featured-newer");
    expect(rest.map((p) => p.id)).toEqual([
      "newest",
      "middle",
      "featured-older",
      "oldest",
    ]);
  });

  it("returns every post when none is featured", () => {
    const posts = [post("a"), post("b", ["mpp"])];
    expect(splitFeatured(posts)).toEqual({ featured: null, rest: posts });
  });
});
