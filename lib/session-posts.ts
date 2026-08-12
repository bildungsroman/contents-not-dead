"use client";

import type { GeneratedPost } from "./generator";

/**
 * Demo-generated posts live only in the browser session, so they vanish on
 * reload (as required by the spec). This module is the single source of truth
 * for reading/writing them.
 */
const KEY = "cnd_session_posts";

export type { GeneratedPost };

export function getSessionPosts(): GeneratedPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as GeneratedPost[]) : [];
  } catch {
    return [];
  }
}

export function getSessionPost(id: string): GeneratedPost | null {
  return getSessionPosts().find((p) => p.id === id) ?? null;
}

export function addSessionPost(post: GeneratedPost): void {
  if (typeof window === "undefined") return;
  const posts = getSessionPosts();
  posts.unshift(post);
  window.sessionStorage.setItem(KEY, JSON.stringify(posts));
  window.dispatchEvent(new CustomEvent("cnd:session-posts-changed"));
}
