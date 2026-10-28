"use client";

import { useRouter } from "next/navigation";
import { FEATURED_TAG } from "@/lib/featured";
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

export function PostCard({
  post,
  featured = false,
}: {
  post: CardData;
  featured?: boolean;
}) {
  const router = useRouter();
  const href = `/post/${encodeURIComponent(post.id)}`;
  const topics = post.tags.filter((t) => t !== FEATURED_TAG);

  function open() {
    router.push(href);
  }

  return (
    <button
      className={
        featured ? `${styles.postCard} ${styles.featured}` : styles.postCard
      }
      onClick={open}
      aria-label={`Open ${post.title}`}
    >
      {featured ? (
        <span className={`${styles.tag} ${styles.featuredTag}`}>Featured</span>
      ) : null}
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
      {topics.length > 0 || post.access || post.session ? (
        <span className={styles.tagRow}>
          {post.session ? (
            <span className={`${styles.tag} ${styles.accessTag}`}>
              Generated
            </span>
          ) : post.access ? (
            <span className={`${styles.tag} ${styles.accessTag}`}>
              {TIER_BADGE[post.access]}
            </span>
          ) : null}
          {topics.slice(0, 4).map((t) => (
            <span className={styles.tag} key={t}>
              #{t}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
