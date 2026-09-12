"use client";

import { useRouter } from "next/navigation";
import type { ContentTier } from "@/lib/tiers";
import styles from "./PostCard.module.css";

export interface CardData {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  type: "article" | "image";
  /** Tier a signed-in human needs. Absent for session-generated posts. */
  access?: ContentTier;
  /** Preview image src (public) for image posts. */
  preview?: string;
  /** True for demo session-generated posts (client-only). */
  session?: boolean;
}

const TIER_BADGE: Record<ContentTier, string> = {
  free: "Free",
  paid: "Members",
};

export function PostCard({ post }: { post: CardData }) {
  const router = useRouter();
  const href = `/post/${encodeURIComponent(post.id)}`;

  function open() {
    router.push(href);
  }

  return (
    <button
      className={styles.postCard}
      onClick={open}
      aria-label={`Open ${post.title}`}
    >
      {post.type === "image" ? (
        <>
          <span className={styles.postImageFrame}>
            {post.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.preview} alt={`${post.title} preview`} />
            ) : (
              <span>Image</span>
            )}
          </span>
          <h2>{post.title}</h2>
        </>
      ) : (
        <>
          <h2>{post.title}</h2>
          <p>{post.summary}</p>
        </>
      )}
      {post.tags.length > 0 || post.access ? (
        <span className={styles.tagRow}>
          {post.access ? (
            <span className={`${styles.tag} ${styles.accessTag}`}>
              {TIER_BADGE[post.access]}
            </span>
          ) : null}
          {post.tags.slice(0, 4).map((t) => (
            <span className={styles.tag} key={t}>
              #{t}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
