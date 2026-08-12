"use client";

import { useRouter } from "next/navigation";

export interface CardData {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  type: "article" | "image";
  /** Preview image src (public) for image posts. */
  preview?: string;
  /** True for demo session-generated posts (client-only). */
  session?: boolean;
}

export function PostCard({ post }: { post: CardData }) {
  const router = useRouter();
  const href = `/post/${encodeURIComponent(post.id)}`;

  function open() {
    router.push(href);
  }

  return (
    <button
      className="post-card"
      onClick={open}
      aria-label={`Open ${post.title}`}
    >
      {post.type === "image" ? (
        <>
          <span className="post-image-frame">
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
      {post.tags.length > 0 ? (
        <span className="tag-row">
          {post.tags.slice(0, 4).map((t) => (
            <span className="tag" key={t}>
              #{t}
            </span>
          ))}
        </span>
      ) : null}
    </button>
  );
}
