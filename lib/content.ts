import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { FEATURED_TAG } from "./featured";
import { type ContentTier, parseContentTier } from "./tiers";

export type PostType = "article" | "image";

export interface PostFrontmatter {
  title: string;
  summary: string;
  authors: string[];
  date: string; // YYYY-MM-DD
  tags: string[];
  type: PostType;
  /**
   * What a signed-in human needs to read this post — not whether it is free to
   * the world. Callers without a session pay per item over MPP either way.
   * Defaults to `paid` when the frontmatter omits it.
   */
  access: ContentTier;
  /** Image posts only: filename of the full-resolution asset in content/assets/. */
  image?: string;
  /** Image posts only: public path to a low-detail preview derivative. */
  preview?: string;
}

export interface Post extends PostFrontmatter {
  /** URL-friendly id derived from the filename (e.g. better-living-advice). */
  id: string;
  /** Markdown body (the paid content). */
  contents: string;
  /** Rough minutes to read the body, estimated from its word count. */
  readingTimeMinutes: number;
}

export type PostPreview = Omit<Post, "contents"> & {
  /** A short, free teaser. Never the full paid body. */
  excerpt: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content");
export const ASSETS_DIR = path.join(CONTENT_DIR, "assets");

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v));
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

const WORDS_PER_MINUTE = 230;

/** Minutes to read a markdown body at a typical pace, rounded up, at least one. */
export function estimateReadingTimeMinutes(markdown: string): number {
  // Tokens without a letter or digit are markdown syntax (`-`, `>`, `|`, `---`).
  const words = markdown
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

function parseFile(filePath: string, id: string): Post {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const type: PostType = data.type === "image" ? "image" : "article";
  const contents = content.trim();
  return {
    id,
    title: String(data.title ?? id),
    summary: String(data.summary ?? ""),
    authors: normalizeStringArray(data.authors),
    date: String(data.date ?? ""),
    tags: normalizeStringArray(data.tags),
    type,
    access: parseContentTier(data.access),
    image: data.image ? String(data.image) : undefined,
    preview: data.preview ? String(data.preview) : undefined,
    contents,
    readingTimeMinutes: estimateReadingTimeMinutes(contents),
  };
}

/** Returns all posts sorted by date, newest first. Server-only. */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((f) =>
    parseFile(path.join(CONTENT_DIR, f), f.replace(/\.md$/, "")),
  );
  return posts.sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
  );
}

export function getPost(id: string): Post | null {
  const filePath = path.join(CONTENT_DIR, `${id}.md`);
  if (!fs.existsSync(filePath)) return null;
  return parseFile(filePath, id);
}

/** Builds a free teaser from the summary (never leaks the paid body). */
export function toPreview(post: Post): PostPreview {
  const { contents, ...rest } = post;
  return { ...rest, excerpt: post.summary };
}

export function getAllPreviews(): PostPreview[] {
  return getAllPosts().map(toPreview);
}

/**
 * Pulls the newest post tagged `featured` out of a newest-first list. Older
 * featured posts stay in `rest`.
 */
export function splitFeatured<T extends { tags: string[] }>(
  posts: T[],
): { featured: T | null; rest: T[] } {
  const featured = posts.find((p) => p.tags.includes(FEATURED_TAG)) ?? null;
  return { featured, rest: posts.filter((p) => p !== featured) };
}
