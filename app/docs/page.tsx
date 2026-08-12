import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config";

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
        <pre>
          <code>{`git clone <your-fork> my-content-site
cd my-content-site
npm install
cp .env.example .env.local`}</code>
        </pre>

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
        <pre>
          <code>{`---
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

Your Markdown body here.`}</code>
        </pre>
        <p>
          Full-resolution images live in <code>content/assets/</code> (outside{" "}
          <code>public/</code>) and are served only after payment or a
          subscription via a short-lived signed URL. Put a low-detail preview in{" "}
          <code>public/previews/</code>.
        </p>

        <h2>4. Theming</h2>
        <p>
          Three themes ship in <code>app/globals.css</code> as CSS variables:{" "}
          <code>minimalist</code>, <code>bookworm</code>, and{" "}
          <code>maximalist</code>. Light/dark follows the browser automatically.
          Set the default with <code>NEXT_PUBLIC_DEFAULT_THEME</code>. To add a
          theme, add a <code>[data-theme=&quot;yours&quot;]</code> block of
          variables. The in-app theme switcher appears only in demo mode.
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
            <code>/api/content/&#123;id&#125;</code> — paid endpoint (HTTP 402 →
            pay → full markdown)
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
          The demo (<code>IS_DEMO</code>) and its AI content generator are only
          enabled on the official <code>contentsnotdead.com</code> deployment;
          clones run as a normal content platform without them.
        </p>
      </article>
    </main>
  );
}
