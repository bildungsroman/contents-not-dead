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
  automatic light/dark — no CSS framework, just CSS Modules.
- **File-based content** — drop Markdown into `content/`.

It's built to be **cloned and personalized**: bring your own content, keys, and
theme and you have a working paid content site.

## Quick start

This project provisions its third-party services (auth) with
[Stripe Projects](https://projects.dev) — the Stripe CLI is the source of truth
for credentials and writes them straight into a git-ignored `.env`. No manual
key copying.

```bash
npm install

# Stripe CLI + Projects plugin (see https://docs.stripe.com/stripe-cli/install)
stripe plugin install projects

# Create the project and provision the full stack (Clerk auth) from the shared
# stack link, syncing keys into a git-ignored .env:
stripe projects init --from "https://projects.dev/s/v1:Clerk~auth"
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
| `MPP_SECRET_KEY`, `CONTENT_ASSET_SECRET`, `NEXT_PUBLIC_APP_URL` | project variables |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | optional self-managed env vars (rate limiting; in-memory fallback if unset) |

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
| Themes | CSS variables keyed on `data-theme`; light/dark via `prefers-color-scheme`. See [Theming](#theming). |
| Styles | `app/globals.css` for theme variables, base elements, layout/typography, and shared utilities. Component-specific styles are co-located CSS Modules. |

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
  --font-header: var(--font-body);
  --font-accent: var(--font-body);

  --bg: #fffdf7;             /* page background */
  --text: #1a1a1a;           /* body copy */
  --muted: #5f5f5f;          /* .meta secondary text */
  --border: #e0ddd3;

  --bg-header: #1a1a1a;      /* header bar */
  --text-header: #fffdf7;

  --accent: #9b1d20;         /* links + primary buttons */
  --accent-contrast: #ffffff;
  --overlay: #f2efe4;        /* panels + footer */

  --card-bg: #f7f5ed;        /* post cards */
  --card-text: #1a1a1a;
  --card-border: #e0ddd3;

  /* Optional: --radius, --maxw, --gap, --header-skew */
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

Set the starting theme with `NEXT_PUBLIC_DEFAULT_THEME`. The in-app switcher
only appears in demo mode (`NEXT_PUBLIC_IS_DEMO`).

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
