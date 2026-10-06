"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { VIEWS, VIEW_PARAM, activeView, viewHref, type View } from "@/lib/view";
import styles from "./ViewToggle.module.css";

const LABEL: Record<View, string> = { human: "HUMAN", agent: "AGENT" };

/** HUMAN/AGENT switch. Each side links to its homepage view; HUMAN is
 * highlighted everywhere except the homepage's agent view. */
export function ViewToggle() {
  return (
    <Suspense fallback={<Segments active={null} onHome={false} />}>
      <ActiveViewToggle />
    </Suspense>
  );
}

function ActiveViewToggle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return (
    <Segments
      active={activeView(pathname, searchParams.get(VIEW_PARAM))}
      onHome={pathname === "/"}
    />
  );
}

function Segments({
  active,
  onHome,
}: {
  active: View | null;
  onHome: boolean;
}) {
  return (
    <div className={styles.viewToggle} role="group" aria-label="Audience">
      {VIEWS.map((view) => (
        <Link
          key={view}
          href={viewHref(view)}
          className={styles.segment}
          data-active={view === active || undefined}
          aria-current={onHome && view === active ? "page" : undefined}
        >
          {LABEL[view]}
        </Link>
      ))}
    </div>
  );
}
