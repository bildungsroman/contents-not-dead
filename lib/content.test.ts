import { describe, expect, it } from "vitest";
import {
  estimateReadingTimeMinutes,
  getAllPosts,
  getPost,
  splitFeatured,
} from "./content";

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

describe("reading time", () => {
  const words = (n: number) => Array(n).fill("word").join(" ");

  it("rounds the word count up to whole minutes at 230 words a minute", () => {
    expect(estimateReadingTimeMinutes(words(230))).toBe(1);
    expect(estimateReadingTimeMinutes(words(231))).toBe(2);
    expect(estimateReadingTimeMinutes(words(2300))).toBe(10);
  });

  it("never estimates less than a minute", () => {
    expect(estimateReadingTimeMinutes("")).toBe(1);
  });

  it("doesn't count markdown syntax as words", () => {
    const syntax = "\n- > | --- ** ```\n".repeat(100);
    expect(estimateReadingTimeMinutes(words(230) + syntax)).toBe(1);
  });

  it("counts non-Latin words", () => {
    expect(estimateReadingTimeMinutes(Array(231).fill("слово").join(" "))).toBe(
      2,
    );
  });

  it("estimates every post on disk from its body", () => {
    for (const post of getAllPosts()) {
      expect(post.readingTimeMinutes, post.id).toBe(
        estimateReadingTimeMinutes(post.contents),
      );
    }
    expect(
      getPost("a-history-of-open-source-software")!.readingTimeMinutes,
    ).toBeGreaterThan(getPost("a-quiet-machine")!.readingTimeMinutes);
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
