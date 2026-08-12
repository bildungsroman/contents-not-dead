# Content's Not Dead

An open-source, themeable content platform that both **humans and agents** can
pay for — with full parity between them.

- **Subscriptions** for humans — $5/month or $50/year via Stripe Checkout
  (auth by Clerk).
- **Per-item agent payments** — $0.50 per item over the
  [Machine Payments Protocol (MPP)](https://mpp.dev) using Stripe (Shared
  Payment Tokens, fiat rail), served through an HTTP `402` challenge flow.
- **Agent-native discovery** — `/.well-known/mpp.json`, `/llms.txt`, and a
  markdown `/agents` directory. Anything a human can read, an agent can
  discover and pay for.
- **Three themes** (minimalist, bookworm, maximalist) via CSS variables with
  automatic light/dark — no CSS framework.
- **File-based content** — drop Markdown into `content/`.

It's built to be **cloned and personalized**: bring your own content, keys, and
theme and you have a working paid content site. A separate, optional
open-source [`@bildungsroman/content-generator`](https://www.npmjs.com/package/@bildungsroman/content-generator)
library powers on-demand AI content, but only on the official demo
deployment — clones run without it.

## Quick start

This project provisions its third-party services (auth, caching) with
[Stripe Projects](https://projects.dev) — the Stripe CLI is the source of truth
for credentials and writes them straight into a git-ignored `.env`. No manual
key copying.

```bash
npm install

# Stripe CLI + Projects plugin (see https://docs.stripe.com/stripe-cli/install)
stripe plugin install projects

# Create the project and provision the full stack (Clerk auth, OpenRouter,
# Upstash Redis) from the shared stack link, syncing keys into a git-ignored .env:
stripe projects init --from "https://projects.dev/s/v1:Clerk~auth,Upstash~redis"
```

That single `--from` import provisions every provider this app needs.

Store the self-managed secrets and app config as project variables (these
aren't tied to a provisioned provider). Regenerate the MPP secrets with
`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`:

```bash
stripe projects variables set mpp-secret-key      --env-key MPP_SECRET_KEY      --value <32-byte-base64>
stripe projects variables set content-asset-secret --env-key CONTENT_ASSET_SECRET --value <32-byte-base64>
stripe projects variables set app-url             --env-key NEXT_PUBLIC_APP_URL --value http://localhost:3000
```

Create the subscription Product + Prices once, then store the IDs as variables:

```bash
node --env-file=.env scripts/setup-stripe.mjs
stripe projects variables set stripe-price-monthly --env-key STRIPE_PRICE_MONTHLY --value price_...
stripe projects variables set stripe-price-annual  --env-key STRIPE_PRICE_ANNUAL  --value price_...
```

Then start the app:

```bash
npm run dev
```

Then open http://localhost:3000.

### Environment

`stripe projects init` and the `add` commands above generate a git-ignored
`.env` — don't hand-edit it. Inspect what's wired up with:

```bash
stripe projects status --json   # provisioned resources
stripe projects env --json      # env var names (never values)
```

| Env var | Managed by |
| --- | --- |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL` | Stripe / project variables |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | `stripe projects add clerk/auth` |
| `UPSTASH_*` | `stripe projects add upstash/redis` |
| `OPENROUTER_*`, `CONTENT_GENERATOR_*` | `stripe projects add openrouter/api` (demo only) |
| `MPP_SECRET_KEY`, `CONTENT_ASSET_SECRET`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_IS_DEMO`, `DEMO_HOST` | project variables |

Forward Stripe webhooks while developing and store the signing secret:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe projects variables set stripe-webhook-secret --env-key STRIPE_WEBHOOK_SECRET --value whsec_...
```

> The Stripe restricted key needs write access to Products, Prices, Checkout
> Sessions, Customers, Billing Portal, and PaymentIntents.

## How it works

| Concern | Approach |
| --- | --- |
| Auth | Clerk. Subscription state is written to the user's `publicMetadata` by Stripe webhooks and revalidated against Stripe when stale. |
| Subscriptions | Stripe Checkout (`mode: subscription`) + Billing Portal. Stripe is the source of truth; no database required. |
| Agent payments | `mppx` (`mppx/server`) with the Stripe SPT method. `GET /api/content/{id}` returns a `402` challenge, then the full markdown + a `Payment-Receipt` on success. |
| Paid images | Full assets live in `content/assets/` (outside `public/`) and are served via `/api/content/{id}/asset` only to subscribers or with a short-lived HMAC-signed URL. |
| Themes | CSS variables keyed on `data-theme`; light/dark via `prefers-color-scheme`. |
| Demo generation | `POST /api/generate`, gated to demo mode + the canonical host, with signed-session and Redis/IP rate limits; content is browser-session-only. |

## Routes

- `/` — home grid of previews (lazy-loaded)
- `/post/[id]` — full content (subscribers) or paywall
- `/subscribe`, `/account` — plans + billing management
- `/payments` — MPP guide for agents
- `/docs` — setup, theming, adding content
- `/agents`, `/agents/[id]` — markdown for agents
- `/api/content/[id]` — MPP-protected machine endpoint
- `/.well-known/mpp.json`, `/.well-known/mpp.md`, `/llms.txt` — discovery

See [`/docs`](http://localhost:3000/docs) for the full guide.

## Deploy

Deploy to Vercel. Use a separate Stripe Projects environment for production so
credentials stay isolated from local dev:

```bash
stripe projects env create production --output .env.production
stripe projects env use production
# re-run the `add` / `variables set` steps for production, then point
# NEXT_PUBLIC_APP_URL at your domain
stripe projects variables set app-url --env-key NEXT_PUBLIC_APP_URL --value https://your-domain.com
```

Sync the generated values into your host's env (Vercel, etc.) and add a Stripe
webhook endpoint at `/api/stripe/webhook`. Web Analytics and Speed Insights are
already wired in.

## License

MIT — see [LICENSE](./LICENSE).
