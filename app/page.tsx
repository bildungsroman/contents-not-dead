import type { Metadata } from "next";
import { getAllPreviews } from "@/lib/content";
import { VIEW_PARAM, parseView, type View } from "@/lib/view";
import { PostGrid } from "@/components/PostGrid";
import { AgentGuide } from "@/components/AgentGuide";
import { Hero } from "@/components/Hero";
import type { CardData } from "@/components/PostCard";

type HomeProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function viewFrom(
  searchParams: HomeProps["searchParams"],
): Promise<View> {
  return parseView((await searchParams)[VIEW_PARAM]);
}

export async function generateMetadata({
  searchParams,
}: HomeProps): Promise<Metadata> {
  const view = await viewFrom(searchParams);
  switch (view) {
    case "human":
      return {};
    case "agent":
      return {
        title: "For Agents — Machine Payments",
        description:
          "How AI agents discover and pay for content on Content's Not Dead using the Machine Payments Protocol (MPP).",
      };
    default: {
      const unreachable: never = view;
      return unreachable;
    }
  }
}

export default async function HomePage({ searchParams }: HomeProps) {
  const view = await viewFrom(searchParams);
  return (
    <main className="container">
      <Hero />
      <HomeView view={view} />
    </main>
  );
}

function HomeView({ view }: { view: View }) {
  switch (view) {
    case "human":
      return <PostGrid initial={humanCards()} />;
    case "agent":
      return <AgentGuide />;
    default: {
      const unreachable: never = view;
      return unreachable;
    }
  }
}

function humanCards(): CardData[] {
  return getAllPreviews().map((p) => ({
    id: p.id,
    title: p.title,
    summary: p.summary,
    tags: p.tags,
    type: p.type,
    access: p.access,
    preview: p.preview,
  }));
}
