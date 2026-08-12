import { getAllPreviews } from "@/lib/content";
import { IS_DEMO, SITE } from "@/lib/config";
import { PostGrid } from "@/components/PostGrid";
import type { CardData } from "@/components/PostCard";

export default function HomePage() {
  const previews = getAllPreviews();
  const cards: CardData[] = previews.map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.summary,
    tags: p.tags,
    type: p.type,
    preview: p.preview,
  }));

  return (
    <main className="container">
      <section style={{ marginBottom: 28 }}>
        <p className="meta" style={{ maxWidth: 640 }}>
          {SITE.tagline} Browse below — subscribe for unlimited access, or, if
          you&rsquo;re an agent, pay per item over MPP.
        </p>
      </section>
      <PostGrid initial={cards} isDemo={IS_DEMO} />
    </main>
  );
}
