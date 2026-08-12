import { getAllPreviews } from "@/lib/content";
import { appUrl, PER_CONTENT_PRICE_USD, SITE } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public markdown directory for agents: lists all content (metadata + teasers)
 * and the endpoints to discover, pay for, and subscribe to content. It never
 * includes paid bodies — those come from /api/content/{id} after payment.
 */
export async function GET() {
  const base = appUrl();
  const previews = getAllPreviews();

  const lines: string[] = [
    `# ${SITE.name} — Agent Directory`,
    "",
    SITE.description,
    "",
    "## Endpoints",
    "",
    `- Discovery (machine-readable): ${base}/.well-known/mpp.json`,
    `- LLM overview: ${base}/llms.txt`,
    `- Paid content (per item, $${PER_CONTENT_PRICE_USD} via MPP): ${base}/api/content/{id}`,
    `- Per-item markdown (metadata + teaser): ${base}/agents/{id}`,
    `- Subscribe (unlimited): ${base}/subscribe`,
    "",
    "## How to pay",
    "",
    `Request \`GET ${base}/api/content/{id}\`. If unpaid you receive HTTP 402 with an MPP`,
    "`WWW-Authenticate` challenge. Create a Stripe Shared Payment Token for the",
    "challenge amount and retry with the credential in the `Authorization` header.",
    "The response body is the full markdown; a `Payment-Receipt` header is included.",
    "",
    "## Content",
    "",
  ];

  for (const p of previews) {
    lines.push(`### ${p.title}`);
    lines.push("");
    lines.push(`- id: \`${p.id}\``);
    lines.push(`- type: ${p.type}`);
    lines.push(`- date: ${p.date}`);
    lines.push(`- tags: ${p.tags.join(", ")}`);
    lines.push(`- summary: ${p.summary}`);
    lines.push(`- paid content: ${base}/api/content/${p.id}`);
    lines.push(`- markdown: ${base}/agents/${p.id}`);
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
