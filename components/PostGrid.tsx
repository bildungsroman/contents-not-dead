"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PostCard, type CardData } from "./PostCard";
import { extras, useExtraCards } from "@/lib/extras";
import styles from "./PostGrid.module.css";

const BATCH = 6;

export function PostGrid({ initial }: { initial: CardData[] }) {
  const [visible, setVisible] = useState(BATCH);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const extraCards = useExtraCards();
  const all = useMemo(
    () => [...extraCards, ...initial],
    [extraCards, initial],
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
  const GridActions = extras.GridActions;

  return (
    <>
      <div className={styles.postGrid}>
        {shown.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {visible < all.length ? (
        <div ref={sentinel} className="center meta">
          Loading more…
        </div>
      ) : null}

      {GridActions ? <GridActions /> : null}
    </>
  );
}
