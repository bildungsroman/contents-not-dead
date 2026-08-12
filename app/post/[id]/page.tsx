import type { Metadata } from "next";
import Link from "next/link";
import { getPost } from "@/lib/content";
import { currentUserHasActiveSubscription } from "@/lib/subscription";
import { signedAssetPath } from "@/lib/assets";
import { Markdown } from "@/components/Markdown";
import { Paywall } from "@/components/Paywall";
import { SessionPostView } from "@/components/SessionPostView";

// Paid content must always be evaluated per-request and never cached.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = getPost(id);
  if (!post) return { title: "Post" };
  return { title: post.title, description: post.summary };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = getPost(id);

  // Unknown to the server → likely a demo session-generated post.
  if (!post) {
    return (
      <main className="container">
        <SessionPostView id={id} />
      </main>
    );
  }

  const subscribed = await currentUserHasActiveSubscription();

  if (!subscribed) {
    return (
      <main className="container">
        <Paywall postId={post.id} postTitle={post.title} />
      </main>
    );
  }

  return (
    <main className="container">
      <article className="prose">
        <p className="meta">
          <Link href="/">← Home</Link> · {post.date}
          {post.authors.length ? ` · ${post.authors.join(", ")}` : ""}
        </p>
        <h1>{post.title}</h1>
        {post.type === "image" ? (
          // Subscriber view: full asset via a short-lived signed URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={signedAssetPath(post.id)} alt={post.title} />
        ) : null}
        <Markdown>{post.contents}</Markdown>
      </article>
    </main>
  );
}
