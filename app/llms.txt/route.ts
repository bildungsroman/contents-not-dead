import { getAllPreviews } from "@/lib/content";
import { appUrl, PER_CONTENT_PRICE_USD, SITE } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** llms.txt — a concise, LLM-friendly map of the site (served at /llms.txt). */
export async function GET() {
  const base = appUrl();
  const previews = getAllPreviews();

  const lines: string[] = [
    `# ${SITE.name}`,
    "",
    `> ${SITE.description}`,
    "",
    "Humans subscribe for unlimited access; agents pay per item over MPP or",
    "subscribe. Full parity: anything a human can read, an agent can pay for.",
    "",
    "## Discovery",
    `- [MPP config](${base}/.well-known/mpp.json): machine-readable payment details`,
    `- [MPP instructions](${base}/.well-known/mpp.md): how to pay as an agent`,
    `- [Agent directory](${base}/agents): markdown index of all content`,
    "",
    "## Paying",
    `- Per item: $${PER_CONTENT_PRICE_USD} via MPP at ${base}/api/content/{id} (HTTP 402 challenge)`,
    `- Subscription: ${base}/subscribe ($5/month or $50/year)`,
    "",
    "## Content",
  ];
  for (const p of previews) {
    lines.push(
      `- [${p.title}](${base}/agents/${p.id}): ${p.summary} (pay: ${base}/api/content/${p.id})`,
    );
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
