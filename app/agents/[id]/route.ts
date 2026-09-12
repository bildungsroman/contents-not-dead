import { getPost, toPreview } from "@/lib/content";
import { hasFeature } from "@/lib/subscription";
import { TIER_FEATURE } from "@/lib/tiers";
import { renderPaidMarkdown, renderTeaserMarkdown } from "@/lib/agent-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
};

/**
 * Per-post markdown for agents. A session holding the entitlement for the
 * post's tier gets the full body; everyone else gets a teaser (metadata + how
 * to pay) — never the body anonymously, free posts included. The body is
 * delivered by /api/content/{id} after MPP payment.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = getPost(id);
  if (!post) {
    return new Response("Not found", { status: 404 });
  }

  if (await hasFeature(TIER_FEATURE[post.access])) {
    return new Response(renderPaidMarkdown(post), { headers: MD_HEADERS });
  }

  return new Response(renderTeaserMarkdown(toPreview(post)), {
    headers: MD_HEADERS,
  });
}
