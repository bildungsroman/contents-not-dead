import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type PostType = "article" | "image";

export interface PostFrontmatter {
  title: string;
  summary: string;
  authors: string[];
  date: string; // YYYY-MM-DD
  tags: string[];
  type: PostType;
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

function parseFile(filePath: string, id: string): Post {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const type: PostType = data.type === "image" ? "image" : "article";
  return {
    id,
    title: String(data.title ?? id),
    summary: String(data.summary ?? ""),
    authors: normalizeStringArray(data.authors),
    date: String(data.date ?? ""),
    tags: normalizeStringArray(data.tags),
    type,
    image: data.image ? String(data.image) : undefined,
    preview: data.preview ? String(data.preview) : undefined,
    contents: content.trim(),
  };
}

/** Returns all posts sorted by date, newest first. Server-only. */
export function getAllPosts(): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"));
  const posts = files.map((f) =>
    parseFile(path.join(CONTENT_DIR, f), f.replace(/\.md$/, "")),
  );
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
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
