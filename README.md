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

```bash
npm install
cp .env.example .env.local   # fill in your keys (see below)
npm run dev
```

Then open http://localhost:3000.

### Environment

See [`.env.example`](./.env.example) for the full list. At minimum you need
Stripe (`STRIPE_SECRET_KEY`), Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
`CLERK_SECRET_KEY`), and MPP secrets (`MPP_SECRET_KEY`, `CONTENT_ASSET_SECRET`).

Create the subscription prices once:

```bash
node --env-file=.env.local scripts/setup-stripe.mjs
# copy STRIPE_PRICE_MONTHLY / STRIPE_PRICE_ANNUAL into your env
```

Forward webhooks while developing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# set STRIPE_WEBHOOK_SECRET to the printed value
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

Deploy to Vercel, set the env vars, point `NEXT_PUBLIC_APP_URL` at your domain,
and add a Stripe webhook endpoint at `/api/stripe/webhook`. Web Analytics and
Speed Insights are already wired in.

## License

MIT — see [LICENSE](./LICENSE).
