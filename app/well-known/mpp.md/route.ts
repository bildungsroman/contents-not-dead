import { appUrl, PER_CONTENT_PRICE_USD, SITE } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Human-readable MPP instructions (served at /.well-known/mpp.md). */
export async function GET() {
  const base = appUrl();
  const body = `# Machine Payments on ${SITE.name}

This service accepts machine payments via the Machine Payments Protocol (MPP,
https://mpp.dev) using Stripe as the payment rail (Shared Payment Tokens — fiat
cards and Link).

## Pay per item ($${PER_CONTENT_PRICE_USD})

1. Request the resource:

   GET ${base}/api/content/{id}

2. If payment is required, you receive HTTP 402 with a \`WWW-Authenticate\`
   challenge describing the amount and accepted method (\`stripe\`).

3. Create a Stripe Shared Payment Token for the challenge, then retry the
   request with the MPP credential in the \`Authorization\` header.

4. On success you receive HTTP 200 with the full markdown body and a
   \`Payment-Receipt\` header.

The \`mppx\` client (https://www.npmjs.com/package/mppx) implements this flow.

## Discover content

- Machine-readable config: ${base}/.well-known/mpp.json
- Agent directory: ${base}/agents
- LLM overview: ${base}/llms.txt

## Subscribe instead

Unlimited access is available at ${base}/subscribe ($5/month or $50/year).
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
