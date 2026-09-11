import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config";
import { CodeBlock } from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "Docs",
  description: "How to clone, configure, theme, and extend Content's Not Dead.",
};

export default function DocsPage() {
  return (
    <main className="container">
      <article className="prose">
        <h1>Documentation</h1>
        <p>
          {SITE.name} is an open-source, cloneable content platform. Sell your
          own writing and art with Stripe subscriptions and per-item{" "}
          <Link href="/payments">agent payments (MPP)</Link>.
        </p>

        <h2>1. Clone &amp; install</h2>
        <CodeBlock
          code={`git clone <your-fork> my-content-site
cd my-content-site
npm install
cp .env.example .env.local`}
        />

        <h2>2. Configure environment</h2>
        <p>Fill in <code>.env.local</code>:</p>
        <ul>
          <li>
            <strong>Stripe</strong> — <code>STRIPE_SECRET_KEY</code> (with
            Products, Prices, Checkout, Customers, Billing Portal, and
            PaymentIntents write access), then run{" "}
            <code>node --env-file=.env.local scripts/setup-stripe.mjs</code> to
            create the $5/mo and $50/yr prices and copy the printed{" "}
            <code>STRIPE_PRICE_MONTHLY</code>/<code>STRIPE_PRICE_ANNUAL</code>{" "}
            into your env.
          </li>
          <li>
            <strong>Clerk</strong> — <code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>{" "}
            and <code>CLERK_SECRET_KEY</code> (free tier is fine).
          </li>
          <li>
            <strong>MPP</strong> — <code>MPP_SECRET_KEY</code> (stable, ≥32
            bytes) and <code>CONTENT_ASSET_SECRET</code>. Generate with{" "}
            <code>
              node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;base64&apos;))&quot;
            </code>
            .
          </li>
          <li>
            <strong>Webhook</strong> — run{" "}
            <code>stripe listen --forward-to localhost:3000/api/stripe/webhook</code>{" "}
            and set <code>STRIPE_WEBHOOK_SECRET</code>.
          </li>
        </ul>
        <p>
          Using{" "}
          <a href="https://docs.stripe.com/stripe-cli">Stripe Projects</a>? Most
          of this is provisioned for you — run{" "}
          <code>stripe projects env --pull</code>.
        </p>

        <h2>3. Add your content</h2>
        <p>
          Drop Markdown files in <code>content/</code> with frontmatter:
        </p>
        <CodeBlock
          code={`---
title: My Post
summary: A one-line teaser shown on the home grid.
authors: [Your Name]
date: '2026-07-18'
tags: [essays]
type: article        # or: image
# image posts only:
# image: my-art.png       # full asset in content/assets/
# preview: /previews/my-art.png  # low-detail preview in public/
---

Your Markdown body here.`}
        />
        <p>
          Full-resolution images live in <code>content/assets/</code> (outside{" "}
          <code>public/</code>) and are served only after payment or a
          subscription via a short-lived signed URL. Put a low-detail preview in{" "}
          <code>public/previews/</code>. To place an image inside a post body,
          link it as{" "}
          <code>![alt](/content/assets/my-diagram.png)</code> — that path is
          rewritten to the same signed, access-checked URL when the post renders.
        </p>

        <h2>4. Theming</h2>
        <p>
          A theme is a block of CSS variables keyed on a{" "}
          <code>data-theme</code> attribute set on <code>&lt;html&gt;</code>.
          Three ship in <code>app/globals.css</code>: <code>minimalist</code>,{" "}
          <code>bookworm</code>, and <code>maximalist</code>. Light and dark
          follow the browser automatically, and a <code>data-scheme</code>{" "}
          attribute can force one. Set the starting theme with{" "}
          <code>NEXT_PUBLIC_DEFAULT_THEME</code>; the in-app theme switcher
          appears only in demo mode.
        </p>
        <p>
          Styles live in two places. <code>app/globals.css</code> holds the
          theme variables, base element styles, the page{" "}
          <code>.container</code>, and the <code>.prose</code> block that styles
          rendered Markdown, plus the shared <code>.meta</code>,{" "}
          <code>.center</code>, <code>.warn</code>, and <code>.hidden</code>{" "}
          utilities. Component-specific rules live in CSS Modules next to the
          components that own them, like{" "}
          <code>components/PostCard.module.css</code>.
        </p>

        <h3>Register the name</h3>
        <p>
          <code>THEMES</code> in <code>lib/config.ts</code> drives the{" "}
          <code>Theme</code> type and the switcher, so start there:
        </p>
        <CodeBlock
          code={`export const THEMES = [
  "minimalist",
  "bookworm",
  "maximalist",
  "newsprint",
] as const;`}
        />

        <h3>Define the variables</h3>
        <p>
          Add the block to <code>app/globals.css</code>. These are every
          variable the components read — miss one and it falls back to the{" "}
          <code>:root</code> default:
        </p>
        <CodeBlock
          code={`[data-theme="newsprint"] {
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
}`}
        />

        <h3>Add the dark variant</h3>
        <p>
          Two blocks, because dark mode can arrive two ways. The first follows
          the operating system; the second handles the user explicitly choosing
          dark with the toggle. Override only the variables that actually
          change:
        </p>
        <CodeBlock
          code={`@media (prefers-color-scheme: dark) {
  [data-theme="newsprint"]:not([data-scheme="light"]) {
    --bg: #14130f;
    --text: #f2efe4;
    --card-bg: #1d1b16;
  }
}
[data-theme="newsprint"][data-scheme="dark"] {
  --bg: #14130f;
  --text: #f2efe4;
  --card-bg: #1d1b16;
}`}
        />

        <h3>Per-component tweaks (optional)</h3>
        <p>
          Most themes need nothing beyond variables. If yours has to change a
          specific component, put that rule in <em>that component&rsquo;s</em>{" "}
          module rather than in <code>app/globals.css</code>. The{" "}
          <code>data-theme</code> attribute is global and the class is scoped
          locally, so the two combine normally:
        </p>
        <CodeBlock
          code={`/* components/PostCard.module.css */
[data-theme="newsprint"] .postCard {
  border-width: 2px;
  box-shadow: 4px 4px 0 var(--border);
}`}
        />
        <p>
          Watch out for one case in particular. The secondary{" "}
          <code>Button</code> variant is colored with <code>--text</code>, which
          assumes your header background looks like the page background. The
          example above inverts the header (<code>--bg-header</code> is dark
          while <code>--bg</code> is light), so the &ldquo;Sign in&rdquo; button
          turns dark-on-dark and vanishes. Give it the header colors explicitly:
        </p>
        <CodeBlock
          code={`/* components/SiteHeader.module.css */
[data-theme="newsprint"] button.navButton {
  color: var(--text-header);
  border-color: var(--text-header);
}`}
        />
        <p className="meta">
          The <code>button</code> element qualifier is deliberate — it raises
          specificity just enough to beat <code>Button.module.css</code>{" "}
          regardless of which stylesheet the bundler emits first. Note also that
          a selector can only reference classes from its own module; to style a
          component defined elsewhere, pass a class through its{" "}
          <code>className</code> prop, which is exactly what{" "}
          <code>SiteHeader</code> does with <code>navButton</code>.
        </p>

        <h2>5. Agent parity</h2>
        <p>Every piece of content is equally available to agents:</p>
        <ul>
          <li>
            <a href="/.well-known/mpp.json">/.well-known/mpp.json</a> — payment
            config
          </li>
          <li>
            <a href="/llms.txt">/llms.txt</a> — LLM overview/index
          </li>
          <li>
            <Link href="/agents">/agents</Link> — markdown directory
          </li>
          <li>
            <code>/api/content/&#123;id&#125;</code> — paid endpoint (<code>HTTP 402 →
            pay → full markdown</code>)
          </li>
        </ul>

        <h2>6. Deploy</h2>
        <p>
          Deploy to Vercel. Set all env vars in the project settings and point{" "}
          <code>NEXT_PUBLIC_APP_URL</code> at your domain. Configure a Stripe
          webhook endpoint at <code>/api/stripe/webhook</code>. Vercel Web
          Analytics and Speed Insights are already wired up.
        </p>
        <p className="meta">
          This demo and its AI content generator are only
          enabled on the official <code>contentsnotdead.com</code> deployment;
          clones run as a normal content platform without them.
        </p>
      </article>
    </main>
  );
}
