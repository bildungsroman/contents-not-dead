"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PostCard, type CardData } from "./PostCard";
import { GenerateModal } from "./GenerateModal";
import { getSessionPosts } from "@/lib/session-posts";

const BATCH = 6;

export function PostGrid({
  initial,
  isDemo,
}: {
  initial: CardData[];
  isDemo: boolean;
}) {
  const [sessionCards, setSessionCards] = useState<CardData[]>([]);
  const [visible, setVisible] = useState(BATCH);
  const [modalOpen, setModalOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const refreshSession = useCallback(() => {
    const cards: CardData[] = getSessionPosts().map((p) => ({
      id: p.id,
      title: p.title,
      summary: p.summary,
      tags: p.tags,
      type: p.type,
      preview: p.image,
      session: true,
    }));
    setSessionCards(cards);
  }, []);

  useEffect(() => {
    refreshSession();
    const handler = () => refreshSession();
    window.addEventListener("cnd:session-posts-changed", handler);
    return () =>
      window.removeEventListener("cnd:session-posts-changed", handler);
  }, [refreshSession]);

  const all = useMemo(
    () => [...sessionCards, ...initial],
    [sessionCards, initial],
  );

  // Infinite scroll: reveal more cards as the sentinel enters the viewport.
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setVisible((v) => Math.min(v + BATCH, all.length));
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [all.length]);

  const shown = all.slice(0, visible);

  return (
    <>
      <div className="post-grid">
        {shown.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {visible < all.length ? (
        <div ref={sentinel} className="center meta">
          Loading more…
        </div>
      ) : null}

      {isDemo ? (
        <div className="center">
          <button className="btn" onClick={() => setModalOpen(true)}>
            Generate content
          </button>
        </div>
      ) : null}

      {modalOpen ? (
        <GenerateModal
          onClose={() => setModalOpen(false)}
          onGenerated={refreshSession}
        />
      ) : null}
    </>
  );
}
