# Content's Not Dead

An open-source, themeable content platform that both **humans and agents** can
pay for — with full parity between them.

- **Free and paid tiers for humans** — signing in subscribes you to a $0/month
  Stripe plan that unlocks posts marked `access: free`; $5/month or $50/year
  unlocks everything. [Stripe Entitlements](https://docs.stripe.com/billing/entitlements)
  are the gate, so tiers are configured in Stripe rather than in code (auth by
  Clerk).
- **Per-item agent payments** — $0.50 per item over the
  [Machine Payments Protocol (MPP)](https://mpp.dev) using Stripe (Shared
  Payment Tokens, fiat rail), served through an HTTP `402` challenge flow.
  Agents pay for **every** item, including posts that are free to signed-in
  humans — "free" is a perk for having an account, not a public giveaway.
- **Agent-native discovery** — `/.well-known/mpp.json`, `/llms.txt`,
  `/openapi.json`, and a markdown `/agents` directory. Anything a human can
  read, an agent can discover and pay for. The header's HUMAN/AGENT toggle
  switches the homepage between the post grid and the agent payment guide.
- **Three themes** (minimalist, bookworm, maximalist) via CSS variables with
  light/dark that follows the OS or a header toggle — no CSS framework, just
  CSS Modules.
- **File-based content** — drop Markdown into `content/`.

It's built to be **cloned and personalized**: bring your own content, keys, and
theme and you have a working paid content site.

## Quick start

This project provisions its third-party services (auth, hosting) with
[Stripe Projects](https://projects.dev) — the Stripe CLI is the source of truth
for credentials and writes them straight into a git-ignored `.env`. No manual
key copying.

```bash
npm install

# Stripe CLI + Projects plugin (see https://docs.stripe.com/stripe-cli/install)
stripe plugin install projects

# Create the project and provision Clerk auth from the shared stack link,
# syncing keys into a git-ignored .env:
stripe projects init --from "https://projects.dev/s/v1:Clerk~auth,Vercel~project"
```

That covers every provider this app needs. Nothing else is required — the app
has no AI, queue, or cache dependencies.

Store the self-managed secrets and app config as project variables (these
aren't tied to a provisioned provider). Regenerate the MPP secrets with
`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`:

```bash
stripe projects variables set mpp-secret-key      --env-key MPP_SECRET_KEY      --value <32-byte-base64>
stripe projects variables set content-asset-secret --env-key CONTENT_ASSET_SECRET --value <32-byte-base64>
stripe projects variables set app-url             --env-key NEXT_PUBLIC_APP_URL --value http://localhost:3000
```

Create the subscription Products, Prices, and entitlement Features once, then
store the IDs as variables. The script is idempotent, so re-running it is safe:

```bash
node --env-file=.env scripts/setup-stripe.mjs
stripe projects variables set stripe-price-monthly --env-key STRIPE_PRICE_MONTHLY --value price_...
stripe projects variables set stripe-price-annual  --env-key STRIPE_PRICE_ANNUAL  --value price_...
stripe projects variables set stripe-price-free    --env-key STRIPE_PRICE_FREE    --value price_...
# Optional: lets agents pay in stablecoins on Tempo (see "Tempo payments" below)
stripe projects variables set tempo-deposit-address --env-key TEMPO_DEPOSIT_ADDRESS --value 0x...
```

The script also finds or creates a Stripe crypto deposit address on Tempo and
prints it as `TEMPO_DEPOSIT_ADDRESS`. If your account can't create one yet, it
prints a warning instead and everything else still succeeds.

It creates two entitlement features, `cnd_free_content` and `cnd_paid_content`,
and attaches them to the products that grant them:

| Product | Price | Grants |
| --- | --- | --- |
| Free | $0 / month | `cnd_free_content` |
| Unlimited | $5 / month or $50 / year | both features |

> `STRIPE_PRICE_FREE` is not optional. Without it nobody is ever granted an
> entitlement, so every post falls back to requiring a paid subscription or an
> MPP payment. The app logs a warning when it's missing.

Then start the app:

```bash
npm run dev
```

Then open http://localhost:3000.

### Environment

`stripe projects init` and the `variables set` commands above generate a
git-ignored `.env` — don't hand-edit it. Inspect what's wired up with:

```bash
stripe projects status --json   # provisioned resources
stripe projects env --json      # env var names (never values)
```

| Env var | Managed by |
| --- | --- |
| `STRIPE_SECRET_KEY`, `STRIPE_PROFILE_ID`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL`, `STRIPE_PRICE_FREE` | Stripe / project variables |
| `STRIPE_WEBHOOK_SECRET` | project variable (see webhooks below) |
| `CLERK_ENVIRONMENTS` | `stripe projects init` (Clerk keys as one JSON var; `lib/clerk-keys.ts` unpacks it) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | optional — set these instead if you configure Clerk by hand; they take precedence |
| `MPP_SECRET_KEY`, `CONTENT_ASSET_SECRET`, `NEXT_PUBLIC_APP_URL` | project variables |
| `NEXT_PUBLIC_API_URL`, `MPP_CONTACT_EMAIL` | optional self-managed env vars (agent discovery; see below) |
| `TEMPO_DEPOSIT_ADDRESS` | optional project variable (Tempo stablecoin payments; see below) |
| `NEXT_PUBLIC_DEFAULT_THEME` | optional self-managed env var (starting theme) |
| `LOCAL_FULL_ACCESS` | optional; set to `false` to test the paywall locally (see [Access tiers](#access-tiers)) |

`NEXT_PUBLIC_API_URL` is the public origin agents call. It sets `servers[0].url`
in `/openapi.json`, every paid-resource link in agent teasers and guides, and
the MPP `WWW-Authenticate` realm. Leave it unset to serve the agent surface
from `NEXT_PUBLIC_APP_URL`; set it when agents use a dedicated hostname. It
must name the origin agents actually reach — a realm pointing at an internal
or per-deployment host fails agent discovery. `MPP_CONTACT_EMAIL` is optional
and published in `/openapi.json` for origin ownership verification.

### Set the per-item price

The starter has one global machine-payment price for every content item. Change
`PER_CONTENT_PRICE_USD` in `lib/config.ts`:

```ts
export const PER_CONTENT_PRICE_USD = "0.50";
```

Use a decimal USD amount. The same value drives the runtime challenge, agent
guides, OpenAPI, and MPP discovery, and mppx converts it to each rail's minor
units (`"0.50"` becomes `50` cents for Stripe and `500000` units for a
6-decimal Tempo token). Because the endpoint offers card/Link SPTs, keep the
price at or above Stripe's $0.50 minimum. Tempo stablecoins alone support
amounts down to $0.01.

Pricing is global, not frontmatter-driven: this starter does not currently
support a different price for each post. Per-post pricing would require adding
a validated price field to content frontmatter and passing that value through
`chargeForContent` and every discovery representation.

### Tempo payments

With `TEMPO_DEPOSIT_ADDRESS` set, every `402` offers a second MPP challenge,
`method="tempo"`, next to the Stripe card/Link one. It is built by mppx's
`stripe.create()`: with a sandbox key (`sk_test_`/`rk_test_`) the challenge
names Tempo testnet (`chainId` 42431, pathUSD); with a live key, Tempo mainnet.
Payments land at the deposit address, are recorded as PaymentIntents, and
settle into your Stripe balance. Leave the variable unset to accept cards and
Link only. An invalid address disables just the Tempo rail and logs one error.
`/.well-known/mpp.json` keeps rail and currency metadata under
`payment.method_details` for each method: Stripe uses the `spt`/USD rail, while
Tempo uses TIP-20 on the configured network and token.

Try it against a local server (with `LOCAL_FULL_ACCESS=false`):

```bash
curl -fsSL https://tempo.xyz/install | bash
tempo wallet login && tempo wallet fund     # funds a testnet wallet
tempo request http://localhost:3000/api/content/a-quiet-machine
```

Replay protection for Tempo uses mppx's in-memory store, so on a
multi-instance deployment a used transaction hash is only rejected by the
instance that consumed it.

### Payment errors

Every payment-related failure from `/api/content/{id}` is an
`application/problem+json` body that says what went wrong, whether the caller
was charged (`charged`: `no`, `unlikely`, or `possible`), and what to do next.
Ordinary routing errors such as an unknown content id remain JSON `404`
responses. The `WWW-Authenticate` challenges mppx sets are always kept, so
wallets can retry directly. The full list is served at
`/.well-known/mpp.md#troubleshooting`. Server logs carry one
`[mpp] payment failed` or `[mpp] payment succeeded` line per attempt, with the
challenge id and the Tempo transaction hash or PaymentIntent id for
reconciliation. Payment-service failures return `503`; known provider outages
also include `Retry-After: 30`, while unexpected server faults tell callers
that retrying is unlikely to help.

Forward Stripe webhooks while developing and store the signing secret:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe projects variables set stripe-webhook-secret --env-key STRIPE_WEBHOOK_SECRET --value whsec_...
```

> The Stripe restricted key needs write access to Products, Prices, Checkout
> Sessions, Customers, Billing Portal, PaymentIntents, and Entitlements. For
> Tempo payments it also needs Crypto Deposit Addresses read and write
> (`crypto_deposit_address_read`/`_write`), or `setup-stripe.mjs` skips the
> deposit address with a permission warning.

## How it works

| Concern | Approach |
| --- | --- |
| Auth | Clerk. Subscription state and entitlement keys are written to the user's `publicMetadata` by Stripe webhooks and revalidated against Stripe when stale. |
| Access control | Stripe Entitlements. Each post declares `access: free` or `access: paid`; every gate resolves to `hasFeature(TIER_FEATURE[post.access])`. Changing who can read what is a Stripe config change, not a deploy. |
| Subscriptions | Stripe Checkout (`mode: subscription`) + Billing Portal. Every signed-in user holds a real subscription — the $0 one is created on first page load, and Checkout replaces it on upgrade. Stripe is the source of truth; no database required. |
| Agent payments | `mppx` (`mppx/server`) via `stripe.create()`: the Stripe SPT method, plus Tempo stablecoins when `TEMPO_DEPOSIT_ADDRESS` is set. `GET /api/content/{id}` returns a `402` with one challenge per method, then the full markdown + a `Payment-Receipt` on success. Applies to every post regardless of tier. |
| Paid images | Full assets live in `content/assets/` (outside `public/`) and are served via `/api/content/{id}/asset` only to entitled sessions or with a short-lived HMAC-signed URL. Low-detail previews in `public/previews/` stay public. |
| Themes | CSS variables keyed on `data-theme`; light/dark follows `prefers-color-scheme` unless the header toggle forces `data-scheme`. Both choices persist in cookies. See [Theming](#theming). |
| Homepage view | `/?view=agent` swaps the post grid for the agent payment guide. The HUMAN/AGENT toggle in the header links between the two; every other page counts as HUMAN. |
| Styles | `app/globals.css` for theme variables, base elements, layout/typography, and shared utilities. Component-specific styles are co-located CSS Modules. |

## Access tiers

Mark a post's tier in its frontmatter. Omitting the field means `paid`, so new
content is never published by accident:

```yaml
---
title: My Post
type: article
access: free   # or: paid (the default)
---
```

`access` answers one question: *what does a signed-in human need in order to
read this?* It is not a "free to the world" switch. Callers without a session
pay per item either way.

| Caller | `access: free` | `access: paid` |
| --- | --- | --- |
| Not signed in (human or agent) | `402` → pay $0.50 | `402` → pay $0.50 |
| Signed in, free tier | full content | paywall / teaser |
| Signed in, paid tier | full content | full content |

The real dividing line is whether the caller has a session, not whether they're
human. An agent is how a person buys a single article without subscribing, so
`/post/[id]` keeps pointing at the MPP flow for everyone.

What stays public: post titles, summaries, and tags — agents need them to
decide what's worth buying — plus the low-detail images in `public/previews/`.
Everything else needs an entitlement or a payment receipt.

Existing subscribers need no migration. Attaching a feature to a product grants
it to everyone already subscribed, and each user's cached entitlements refresh
on their next request.

> During local development `LOCAL_FULL_ACCESS=true` (the default) unlocks the
> website for localhost requests. It deliberately does **not** apply to
> `/api/content/*` or `/agents/*`, so the dev shortcut can never hand an agent
> content it should have paid for. Set it to `false` to exercise the real
> paywall.

## Testing

```bash
npm test        # unit tests (Vitest)
npm run lint    # tsc --noEmit
```

The suite covers tier defaulting, the tier-to-entitlement mapping, plan
resolution from price IDs, the access matrix above, the agent discovery
documents (`/openapi.json`, `/.well-known/mpp.json`), post markdown rendering,
and homepage view parsing.

There is also an opt-in integration test that creates and deletes real Clerk
users and Stripe customers to verify the whole provisioning path — free tier on
first sign-in, idempotency on repeat sign-ins, and the upgrade to paid:

```bash
RUN_INTEGRATION=1 node --env-file=.env ./node_modules/.bin/vitest run test/
```

Point it at a **test-mode** Stripe key and a Clerk development instance.

## Theming

Styles are split in two layers:

- **`app/globals.css`** — theme variables, base element styles, the page
  `.container`, and the `.prose` block that styles rendered Markdown (it has to
  be global, since `react-markdown` generates that HTML and can't carry hashed
  class names). It also contains the shared `.meta`, `.center`, `.warn`, and
  `.hidden` utilities.
- **`components/*.module.css`** — component-specific styles, co-located with
  the component that owns them. `PostCard.module.css` holds the card styles,
  `Button.module.css` the button styles, and so on.

A theme is a block of CSS variables selected by a `data-theme` attribute on
`<html>`. Adding one takes two steps, plus an optional third.

**1. Register the name** in `lib/config.ts` — `THEMES` drives both the `Theme`
type and the switcher:

```ts
export const THEMES = ["minimalist", "bookworm", "maximalist", "newsprint"] as const;
```

**2. Define the variables** in `app/globals.css`. Anything you omit falls back
to the `:root` defaults:

```css
[data-theme="newsprint"] {
  --font-body: "Iowan Old Style", Georgia, serif;
  --font-header: var(--font-body);   /* hero title + headings */
  --font-accent: var(--font-body);   /* hero subtitle, HUMAN/AGENT toggle, buttons */

  --bg: #fffdf7;             /* page background */
  --text: #1a1a1a;           /* body copy + hero title */
  --muted: #5f5f5f;          /* .meta text + hero subtitle */
  --border: #e0ddd3;

  --bg-header: #1a1a1a;      /* header bar */
  --text-header: #fffdf7;    /* nav links, skull home icon, header controls */

  --accent: #9b1d20;         /* links + primary buttons */
  --accent-contrast: #ffffff;
  --overlay: #f2efe4;        /* panels + footer */

  --card-bg: #f7f5ed;        /* post cards */
  --card-text: #1a1a1a;
  --card-border: #e0ddd3;

  /* Optional: --radius, --maxw, --gap */
  --radius: 2px;
}
```

Dark mode needs two blocks — one following the OS, one for an explicit toggle.
Override only what changes:

```css
@media (prefers-color-scheme: dark) {
  [data-theme="newsprint"]:not([data-scheme="light"]) {
    --bg: #14130f;
    --text: #f2efe4;
  }
}
[data-theme="newsprint"][data-scheme="dark"] {
  --bg: #14130f;
  --text: #f2efe4;
}
```

**3. Per-component tweaks (optional).** Most themes stop at variables. If yours
needs to restyle a specific component, put the rule in *that component's*
module, not in `globals.css`. `data-theme` is a global attribute and the class
is locally scoped, so they compose normally:

```css
/* components/PostCard.module.css */
[data-theme="newsprint"] .postCard {
  border-width: 2px;
  box-shadow: 4px 4px 0 var(--border);
}
```

One case to watch: the secondary `Button` variant is colored with `--text`,
which assumes the header background resembles the page background. The theme
above inverts the header (dark `--bg-header`, light `--bg`), so the "Sign in"
button renders dark-on-dark and disappears. Give it header colors explicitly:

```css
/* components/SiteHeader.module.css */
[data-theme="newsprint"] button.navButton {
  color: var(--text-header);
  border-color: var(--text-header);
}
```

The `button` element qualifier is deliberate — it raises specificity just
enough to beat `Button.module.css` no matter which stylesheet the bundler emits
first. A selector can also only reference classes from its own module; to
restyle a component defined elsewhere, pass a class through its `className`
prop, which is what `SiteHeader` does with `navButton`.

Set the starting theme with `NEXT_PUBLIC_DEFAULT_THEME` (defaults to
`minimalist`). The in-app switcher lets visitors override it, persisted in a
cookie and honored on the next server render.

## Routes

- `/` — hero plus a grid of previews (lazy-loaded), each card badged Free or Members
- `/?view=agent` — the same hero plus the MPP guide for agents (the header's HUMAN/AGENT toggle)
- `/post/[id]` — full content for entitled readers, otherwise a tier-aware paywall
- `/subscribe`, `/account` — plans (Free, monthly, annual) + billing management
- `/docs` — setup, theming, adding content
- `/about` — what the project is
- `/agents`, `/agents/[id]` — markdown for agents
- `/api/content/[id]` — MPP-protected machine endpoint
- `/.well-known/mpp.json`, `/.well-known/mpp.md`, `/llms.txt`, `/openapi.json` — discovery
- `/api/content/[id]/asset` — full-resolution images for entitled sessions or signed URLs
- `/api/stripe/checkout`, `/api/stripe/portal`, `/api/stripe/webhook` — billing

See [`/docs`](http://localhost:3000/docs) for the full guide.

## Deploy

Deploy to Vercel. Use a separate Stripe Projects environment for production so
credentials stay isolated from local dev:

```bash
stripe projects env create production --output .env.production
stripe projects env use production
# re-run the `variables set` steps for production, then point
# NEXT_PUBLIC_APP_URL at your domain
stripe projects variables set app-url --env-key NEXT_PUBLIC_APP_URL --value https://your-domain.com
```

### Enable live machine payments

The bundled demo uses a Stripe sandbox. A deployment switches to real payments
when `STRIPE_SECRET_KEY` is a live `sk_live_...` or `rk_live_...` key; mppx then
offers live Stripe SPTs and, when a live deposit address is configured, Tempo
mainnet (`chainId` 4217, USDC.e). Keep test and live keys, deposit addresses,
and MPP secrets in separate environments.

1. In the Stripe Dashboard's **live mode**, enable **Stablecoins and Crypto**
   under Payment methods and complete any requested review. Create a live
   restricted key with the permissions listed above, including Crypto Deposit
   Addresses read/write when Tempo is enabled.
2. Claim or configure the account's Stripe Business Profile, retrieve its
   `profile_...` ID, and set `STRIPE_PROFILE_ID`. Stripe scopes live Shared
   Payment Tokens to this profile:

   ```bash
   curl https://api.stripe.com/v2/network/business_profiles/me \
     -u "$STRIPE_SECRET_KEY:" \
     -H "Stripe-Version: 2026-07-29.preview"

   stripe projects variables set stripe-profile-id \
     --env-key STRIPE_PROFILE_ID --value profile_...
   ```

3. With the live key and profile loaded, provision production resources:

   ```bash
   node --env-file=.env.production scripts/setup-stripe.mjs
   ```

   Store the printed live `TEMPO_DEPOSIT_ADDRESS` in the production
   environment. Never reuse the sandbox deposit address. If Tempo is omitted,
   live card and Link payments still work.
4. Deploy, then validate the public agent origin:

   ```bash
   npx mppx@latest validate https://api.your-domain.com
   ```

   Live validation and `tempo request` can move real funds. Start with a small
   purchase and confirm both the MPP receipt and the PaymentIntent in the live
   Stripe Dashboard.

If agents call a dedicated hostname, attach it to the deployment and set
`NEXT_PUBLIC_API_URL` to it (e.g. `https://api.your-domain.com`). Verify both
halves of discovery agree before registering anywhere:

```bash
curl -s https://api.your-domain.com/openapi.json | head
curl -sI https://api.your-domain.com/api/content/<id> | grep -i www-authenticate
```

The `realm` in that header must be the same host you registered.

Sync every generated production value into your host's environment (Vercel,
etc.).

Add a Stripe webhook endpoint at `/api/stripe/webhook` subscribed to:

- `checkout.session.completed`
- `customer.subscription.created`, `.updated`, `.deleted`
- `entitlements.active_entitlement_summary.updated`

That last event is what keeps access current. Miss it and entitlement changes
only reach the app through the slower revalidation fallback.

Web Analytics and Speed Insights are already wired in.

## License

MIT — see [LICENSE](./LICENSE).
