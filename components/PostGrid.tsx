"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PostCard, type CardData } from "./PostCard";
import { extras, useExtraCards } from "@/lib/extras";
import styles from "./PostGrid.module.css";

const BATCH = 6;
const LANES = [0, 1];

export function PostGrid({ initial }: { initial: CardData[] }) {
  const [visible, setVisible] = useState(BATCH);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const extraCards = useExtraCards();
  const all = useMemo(() => [...extraCards, ...initial], [extraCards, initial]);

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
      {/* Cards are dealt across the lanes in turn, so the newest sit side by
          side at the top and each lane stacks without gaps. */}
      <div className={styles.postGrid}>
        {LANES.map((lane) => (
          <div key={lane} className={styles.lane}>
            {shown.map((post, i) =>
              i % LANES.length === lane ? (
                <div key={post.id} style={{ order: i }}>
                  <PostCard post={post} />
                </div>
              ) : null,
            )}
          </div>
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
