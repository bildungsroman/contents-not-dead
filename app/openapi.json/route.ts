import { getAllPreviews } from "@/lib/content";
import {
  apiUrl,
  appUrl,
  contactEmail,
  PER_CONTENT_PRICE_USD,
  SITE,
} from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Version of the public agent-facing contract, not of the app itself. */
const API_VERSION = "1.0.0";

/** Currency and payment method must mirror what `lib/mpp.ts` charges. */
const CURRENCY = "usd";
const MPP_METHOD = "stripe";
const MPP_INTENT = "charge";

/**
 * Discovery advertises price in decimal major units; the runtime challenge
 * carries minor units. Both derive from `PER_CONTENT_PRICE_USD` so they can't
 * drift apart.
 */
function decimalPrice(): string {
  return Number(PER_CONTENT_PRICE_USD).toFixed(6);
}

/**
 * Payment metadata for the one paid operation. Runtime `402` behavior remains
 * authoritative — this only has to agree with it.
 */
function paymentInfo() {
  return {
    price: {
      mode: "fixed",
      currency: CURRENCY.toUpperCase(),
      amount: decimalPrice(),
    },
    protocols: [
      {
        mpp: {
          method: MPP_METHOD,
          intent: MPP_INTENT,
          currency: CURRENCY,
        },
      },
    ],
  };
}

const MARKDOWN_BODY = {
  "text/markdown": {
    schema: { type: "string", description: "Markdown document." },
  },
};

/** Free operations still need an explicit auth mode, or discovery flags them. */
const FREE = { security: [] as unknown[] };

/**
 * OpenAPI 3.1.0 contract served at `/openapi.json`, the document MPPScan and
 * agent tooling resolve.
 *
 * Only independently invocable surfaces are listed. Signed asset URLs are
 * omitted deliberately: they are handed out after payment and answer an
 * unauthenticated probe with a bare `402` carrying no MPP challenge, so
 * advertising them as payable would misrepresent them.
 */
export async function GET() {
  const base = apiUrl();
  const previews = getAllPreviews();
  const email = contactEmail();
  // Gives probes a real id to substitute, so they reach the 402 challenge
  // instead of the not-found branch that precedes it.
  const sampleId = previews[0]?.id;

  const idParameter = {
    name: "id",
    in: "path",
    required: true,
    description: "Content item id, as listed in /agents or /.well-known/mpp.json.",
    schema: {
      type: "string",
      ...(previews.length > 0 ? { enum: previews.map((p) => p.id) } : {}),
    },
    ...(sampleId ? { example: sampleId } : {}),
  };

  const doc = {
    openapi: "3.1.0",
    info: {
      title: SITE.name,
      version: API_VERSION,
      description: SITE.description,
      "x-guidance":
        `Paid content is delivered as markdown by GET /api/content/{id} for ` +
        `$${PER_CONTENT_PRICE_USD} per item over MPP. Call it without credentials to ` +
        `receive an HTTP 402 with a "Payment" WWW-Authenticate challenge, pay it with ` +
        `a Stripe Shared Payment Token, and retry with the credential in the ` +
        `Authorization header. Browse ids for free at GET /agents; each item's ` +
        `metadata and teaser are free at GET /agents/{id}. Humans can subscribe ` +
        `instead at ${appUrl()}/subscribe.`,
      ...(email ? { contact: { email } } : {}),
      license: { name: "MIT", identifier: "MIT" },
    },
    servers: [{ url: base, description: "Production" }],
    "x-service-info": {
      categories: ["content", "publishing"],
      docs: {
        // Human-readable pages live on the site origin; llms.txt is part of
        // the agent surface declared in `paths` and stays on this one.
        homepage: appUrl(),
        llms: `${base}/llms.txt`,
        apiReference: `${appUrl()}/docs`,
      },
    },
    components: {
      securitySchemes: {
        mpp: {
          type: "http",
          scheme: "Payment",
          description:
            "MPP payment credential. Obtained by paying the WWW-Authenticate " +
            "challenge returned with HTTP 402.",
        },
      },
    },
    paths: {
      "/api/content/{id}": {
        get: {
          operationId: "getPaidContent",
          summary: "Full content item (paid)",
          description:
            "Returns the complete markdown body of a content item. Requires an " +
            "MPP payment credential, or a session already entitled to the item's tier.",
          security: [{ mpp: [] }],
          parameters: [idParameter],
          responses: {
            "200": {
              description: "Full content item as markdown.",
              content: MARKDOWN_BODY,
            },
            "402": {
              description:
                "Payment required. Carries an MPP challenge in the WWW-Authenticate header.",
              headers: {
                "WWW-Authenticate": {
                  description: 'MPP challenge, using the "Payment" scheme.',
                  schema: { type: "string" },
                },
              },
              content: {
                "application/problem+json": {
                  schema: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      title: { type: "string" },
                      status: { type: "integer" },
                      detail: { type: "string" },
                      hint: { type: "string" },
                      challengeId: { type: "string" },
                    },
                    required: ["type", "title", "status"],
                  },
                },
              },
            },
            "404": {
              description: "No content item with that id.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { error: { type: "string" } },
                    required: ["error"],
                  },
                },
              },
            },
          },
          "x-payment-info": paymentInfo(),
        },
      },
      "/agents": {
        get: {
          operationId: "listContent",
          summary: "Agent directory of all content (free)",
          description:
            "Markdown index of every content item: ids, metadata, teasers, and " +
            "the endpoints to pay for full access. Never includes paid bodies.",
          ...FREE,
          responses: {
            "200": {
              description: "Markdown directory.",
              content: MARKDOWN_BODY,
            },
          },
        },
      },
      "/agents/{id}": {
        get: {
          operationId: "getContentTeaser",
          summary: "Metadata and teaser for one item (free)",
          description:
            "Metadata plus a short teaser. The full body is delivered by " +
            "/api/content/{id} after payment.",
          ...FREE,
          parameters: [idParameter],
          responses: {
            "200": {
              description: "Markdown metadata and teaser.",
              content: MARKDOWN_BODY,
            },
            "404": { description: "No content item with that id." },
          },
        },
      },
      "/llms.txt": {
        get: {
          operationId: "getLlmsTxt",
          summary: "LLM-friendly site map (free)",
          ...FREE,
          responses: {
            "200": {
              description: "llms.txt document.",
              content: { "text/plain": { schema: { type: "string" } } },
            },
          },
        },
      },
      "/.well-known/mpp.json": {
        get: {
          operationId: "getMppDiscovery",
          summary: "MPP discovery document (free)",
          ...FREE,
          responses: {
            "200": {
              description: "MPP payment and resource metadata.",
              content: {
                "application/json": { schema: { type: "object" } },
              },
            },
          },
        },
      },
    },
  };

  return Response.json(doc, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
