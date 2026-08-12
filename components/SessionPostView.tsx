"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSessionPost, type GeneratedPost } from "@/lib/session-posts";
import { Markdown } from "./Markdown";

/**
 * Client fallback for demo-generated posts, which exist only in the browser
 * session and are therefore never known to the server. Generated content is
 * free to the session that created it.
 */
export function SessionPostView({ id }: { id: string }) {
  const [post, setPost] = useState<GeneratedPost | null | undefined>(undefined);

  useEffect(() => {
    setPost(getSessionPost(id));
  }, [id]);

  if (post === undefined) {
    return (
      <div className="center">
        <span className="spinner" />
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="panel prose">
        <h2 style={{ marginTop: 0 }}>Not found</h2>
        <p>
          This post doesn&rsquo;t exist, or it was a generated post from a
          previous session (generated content disappears on reload).
        </p>
        <Link className="btn" href="/">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <article className="prose">
      <p className="meta">
        <Link href="/">← Home</Link> · generated · {post.date}
      </p>
      <h1>{post.title}</h1>
      {post.type === "image" && post.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image} alt={post.title} />
      ) : null}
      <Markdown>{post.contents}</Markdown>
    </article>
  );
}
