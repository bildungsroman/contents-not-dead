import { getAllPreviews } from "@/lib/content";
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
    access: p.access,
    preview: p.preview,
  }));

  return (
    <main className="container">
      <PostGrid initial={cards} />
    </main>
  );
}
