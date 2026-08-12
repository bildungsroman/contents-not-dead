import { getAllPreviews } from "@/lib/content";
import { appUrl, PER_CONTENT_PRICE_USD, SITE, SUBSCRIPTION } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Machine-readable MPP discovery document (served at /.well-known/mpp.json). */
export async function GET() {
  const base = appUrl();
  const previews = getAllPreviews();

  const doc = {
    protocol: "https://mpp.dev",
    mpp_version: "0.8",
    service: SITE.name,
    description: SITE.description,
    payment: {
      methods: ["stripe"],
      rail: "spt",
      currency: "usd",
      resources: [
        {
          name: "content-item",
          pattern: `${base}/api/content/{id}`,
          price: PER_CONTENT_PRICE_USD,
          currency: "usd",
          description: "Full access to a single content item.",
        },
      ],
    },
    subscription: {
      url: `${base}/subscribe`,
      description: "Unlimited access to all content.",
      plans: [
        { interval: "month", amount: SUBSCRIPTION.monthly.amount, currency: "usd" },
        { interval: "year", amount: SUBSCRIPTION.annual.amount, currency: "usd" },
      ],
    },
    discovery: {
      agents_directory: `${base}/agents`,
      llms: `${base}/llms.txt`,
      instructions: `${base}/.well-known/mpp.md`,
    },
    content: previews.map((p) => ({
      id: p.id,
      type: p.type,
      title: p.title,
      tags: p.tags,
      resource: `${base}/api/content/${p.id}`,
    })),
  };

  return Response.json(doc, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
