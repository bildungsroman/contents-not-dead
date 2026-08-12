import { getPost } from "@/lib/content";
import { currentUserHasActiveSubscription } from "@/lib/subscription";
import { chargeForContent, isMppConfigured } from "@/lib/mpp";
import { renderPaidMarkdown } from "@/lib/agent-format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MD_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "no-store, max-age=0",
};

/**
 * MPP-protected machine endpoint. Delivers a post's full markdown only after:
 *   - a valid MPP payment credential ($0.50 SPT), or
 *   - an authenticated, active subscription.
 * Otherwise it returns an HTTP 402 challenge.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const post = getPost(id);
  if (!post) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Subscribers bypass MPP entirely.
  if (await currentUserHasActiveSubscription()) {
    return new Response(renderPaidMarkdown(post), { headers: MD_HEADERS });
  }

  if (!isMppConfigured()) {
    return Response.json(
      { error: "Machine payments are not configured on this server." },
      { status: 503 },
    );
  }

  const result = await chargeForContent(request, id);
  if (result.status === 402) {
    return result.challenge;
  }

  return result.withReceipt(
    new Response(renderPaidMarkdown(post), { headers: MD_HEADERS }),
  );
}
