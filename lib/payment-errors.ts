import "server-only";

import {
  apiUrl,
  appUrl,
  contactEmail,
  PER_CONTENT_PRICE_USD,
  SITE,
} from "./config";
import {
  describeAcceptedMethods,
  describeTempoRail,
  mppMethods,
  tempoRail,
} from "./mpp";

/**
 * Whether the failed attempt moved the caller's money. `possible` means the
 * caller should check their wallet or statement before paying again.
 */
export type Charged = "no" | "unlikely" | "possible";

type Guidance = { title: string; hint: string; charged: Charged };

const PROBLEM_BASE = "https://paymentauth.org/problems/";

/** Problem types this site issues itself, for failures outside mppx. */
const SITE_PROBLEMS = {
  unavailable: "payments-unavailable",
  error: "payments-error",
  notConfigured: "payments-not-configured",
} as const;

function troubleshootingUrl(): string {
  return `${apiUrl()}/.well-known/mpp.md#troubleshooting`;
}

function siteProblemType(slug: string): string {
  return `${apiUrl()}/.well-known/mpp.md#${slug}`;
}

function acceptedSentence(): string {
  return `Accepted methods: ${describeAcceptedMethods().join("; ")}.`;
}

/**
 * Site-specific guidance keyed by the slug of an mppx problem `type`
 * (`https://paymentauth.org/problems/<slug>`). Replaces mppx's generic
 * "use a supported wallet" hint with what to do on this server.
 */
function problemGuidance(): Record<string, Guidance> {
  const tempo = tempoRail();
  const network = tempo ? ` (for Tempo: ${describeTempoRail(tempo)})` : "";
  return {
    "payment-required": {
      title: "Payment Required",
      hint:
        `Pay $${PER_CONTENT_PRICE_USD} using one of the challenges in the WWW-Authenticate ` +
        `header, then retry with the credential in the Authorization header. ` +
        acceptedSentence(),
      charged: "no",
    },
    "payment-expired": {
      title: "Payment Expired",
      hint:
        "The challenge expired before the payment reached this server. Pay the fresh " +
        "challenge in this response's WWW-Authenticate header.",
      charged: "unlikely",
    },
    "invalid-challenge": {
      title: "Invalid Challenge",
      hint:
        "The credential answers a challenge this server didn't issue for this item " +
        "(each challenge is bound to one content id). Pay the fresh challenge in this " +
        "response instead.",
      charged: "unlikely",
    },
    "verification-failed": {
      title: "Verification Failed",
      hint:
        `The payment didn't match the challenge. Check it was sent on the network, ` +
        `token, amount, and recipient the challenge names${network}, then pay the ` +
        `fresh challenge in this response.`,
      charged: "possible",
    },
    "payment-insufficient": {
      title: "Payment Insufficient",
      hint:
        `Less than $${PER_CONTENT_PRICE_USD} arrived. Pay the full amount named in the ` +
        `fresh challenge in this response.`,
      charged: "possible",
    },
    "method-unsupported": {
      title: "Method Unsupported",
      hint: `This server doesn't accept that payment method. ${acceptedSentence()}`,
      charged: "no",
    },
    "malformed-credential": {
      title: "Malformed Credential",
      hint:
        "The Authorization header isn't a valid MPP credential. Build it from one of " +
        "the challenges in this response with an MPP client such as mppx or the Tempo CLI.",
      charged: "no",
    },
    "invalid-payload": {
      title: "Invalid Payload",
      hint:
        "The credential's payload doesn't fit the payment method it names. Rebuild it " +
        "from one of the challenges in this response with an MPP client.",
      charged: "no",
    },
    "payment-action-required": {
      title: "Payment Action Required",
      hint:
        "The card issuer needs an extra step, such as authentication. Complete it in " +
        "your wallet, then retry.",
      charged: "no",
    },
    "internal-payment-error": {
      title: "Internal Payment Error",
      hint:
        "We couldn't confirm your payment because of a temporary problem on our side. " +
        "Check your wallet or card statement before paying again.",
      charged: "possible",
    },
  };
}

/** A used transaction or proof is a replay, not a failed new payment. */
const REPLAY_GUIDANCE: Guidance = {
  title: "Verification Failed (already used)",
  hint:
    "That transaction or proof already unlocked a request, and each payment unlocks " +
    "one. Pay the fresh challenge in this response to read again.",
  charged: "no",
};

function guidanceFor(slug: string, detail: unknown): Guidance | undefined {
  if (
    slug === "verification-failed" &&
    typeof detail === "string" &&
    /already been used/i.test(detail)
  ) {
    return REPLAY_GUIDANCE;
  }
  return problemGuidance()[slug];
}

function supportLine(challengeId: unknown): string {
  const contact = contactEmail()
    ? `contact ${contactEmail()}`
    : `open an issue at ${SITE.repo}/issues`;
  const id =
    typeof challengeId === "string" ? ` with challengeId ${challengeId}` : "";
  return `If funds left your wallet or card, ${contact}${id} and your transaction hash or receipt.`;
}

function problemResponse(
  body: Record<string, unknown>,
  status: number,
  headers: HeadersInit = {},
): Response {
  const h = new Headers(headers);
  h.set("Content-Type", "application/problem+json");
  h.set("Cache-Control", "no-store");
  h.delete("Content-Length");
  return new Response(JSON.stringify(body), { status, headers: h });
}

/**
 * Adds site-specific guidance to an mppx 402: a hint, whether the caller was
 * charged, the accepted methods, and a troubleshooting link. mppx's status,
 * `WWW-Authenticate` challenges, and `detail` are kept as-is; responses it
 * can't interpret are returned untouched.
 */
export async function enrichChallenge(response: Response): Promise<Response> {
  const text = await response.clone().text();
  let problem: Record<string, unknown>;
  if (!text) {
    problem = {
      type: `${PROBLEM_BASE}payment-required`,
      title: "Payment Required",
      status: response.status,
    };
  } else {
    if (!response.headers.get("Content-Type")?.includes("json"))
      return response;
    try {
      problem = JSON.parse(text);
    } catch {
      return response;
    }
  }

  const type = typeof problem.type === "string" ? problem.type : "";
  const guidance = type.startsWith(PROBLEM_BASE)
    ? guidanceFor(type.slice(PROBLEM_BASE.length), problem.detail)
    : undefined;
  if (!guidance) return response;

  return problemResponse(
    {
      ...problem,
      hint: guidance.hint,
      charged: guidance.charged,
      acceptedMethods: mppMethods(),
      docs: troubleshootingUrl(),
      ...(guidance.charged !== "no" && {
        support: supportLine(problem.challengeId),
      }),
    },
    response.status,
    response.headers,
  );
}

const TRANSIENT_ERRORS = new Set([
  // Stripe SDK error types.
  "StripeConnectionError",
  "StripeRateLimitError",
  "StripeAPIError",
  // viem transport errors from the Tempo RPC.
  "HttpRequestError",
  "TimeoutError",
  "RpcRequestError",
  "WebSocketRequestError",
]);

function errorKind(error: unknown): string {
  if (error && typeof error === "object") {
    const e = error as { type?: unknown; name?: unknown };
    if (typeof e.type === "string" && e.type.startsWith("Stripe"))
      return e.type;
    if (typeof e.name === "string") return e.name;
  }
  return "Unknown";
}

const RETRY_AFTER_SECONDS = 30;

/**
 * Response for an exception mppx didn't turn into a 402, such as Stripe or the
 * Tempo RPC being unreachable while issuing a challenge. Payment-service
 * failures are always a 503; known transient failures include `Retry-After`,
 * while unexpected server faults tell callers that retrying is unlikely to
 * help.
 */
export function paymentServiceError(
  error: unknown,
  { hadCredential }: { hadCredential: boolean },
): Response {
  const kind = errorKind(error);
  const transient = TRANSIENT_ERRORS.has(kind);
  console.error(
    "[mpp] payment service error",
    JSON.stringify({
      kind,
      transient,
      message: error instanceof Error ? error.message : String(error),
    }),
  );

  const charged: Charged = hadCredential ? "unlikely" : "no";
  const body = {
    type: siteProblemType(
      transient ? SITE_PROBLEMS.unavailable : SITE_PROBLEMS.error,
    ),
    title: transient
      ? "Payments Temporarily Unavailable"
      : "Payment Server Error",
    status: 503,
    detail: transient
      ? "A payment provider didn't respond, so this request couldn't be priced or settled."
      : "The payment server hit an unexpected error.",
    hint: transient
      ? `Retry in ${RETRY_AFTER_SECONDS} seconds.`
      : "Retrying is unlikely to help; this needs a fix on our side.",
    charged,
    docs: troubleshootingUrl(),
    ...(charged !== "no" && { support: supportLine(undefined) }),
  };
  return problemResponse(
    body,
    body.status,
    transient ? { "Retry-After": String(RETRY_AFTER_SECONDS) } : {},
  );
}

/** Response when the server has no MPP configuration at all. */
export function paymentsNotConfigured(): Response {
  return problemResponse(
    {
      type: siteProblemType(SITE_PROBLEMS.notConfigured),
      title: "Machine Payments Not Configured",
      status: 503,
      detail: "This server isn't set up to accept machine payments.",
      hint: `Subscribe for access at ${appUrl()}/subscribe instead.`,
      charged: "no",
      docs: troubleshootingUrl(),
    },
    503,
  );
}

/** Markdown table of every problem an agent can hit, for `/.well-known/mpp.md`. */
export function troubleshootingMarkdown(): string {
  const rows: [string, Guidance][] = [
    ...Object.entries(problemGuidance()),
    ["verification-failed", REPLAY_GUIDANCE],
  ];
  const lines = [
    "| Problem | Charged? | What to do |",
    "| --- | --- | --- |",
    ...rows.map(
      ([slug, g]) => `| \`${slug}\`: ${g.title} | ${g.charged} | ${g.hint} |`,
    ),
    `| \`${SITE_PROBLEMS.unavailable}\` (503) | no, or unlikely if you sent a credential | Retry after the \`Retry-After\` interval. |`,
    `| \`${SITE_PROBLEMS.error}\` (503) | no, or unlikely if you sent a credential | Retrying is unlikely to help; report it. |`,
  ];
  return lines.join("\n");
}
