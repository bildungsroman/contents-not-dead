import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why Content's Not Dead uses the Machine Payments Protocol to help creators get paid for their work.",
};

export default function AboutPage() {
  return (
    <main className="container">
      <article className="prose">
        <h1>About {SITE.name}</h1>
        <p>
          Content should support the people who make it. {SITE.name} explores
          how the promise of the Machine Payments Protocol (MPP) can give
          creators a direct way to be paid for their writing and art, whether
          the audience is human or machine.
        </p>

        <h2>How to use this site</h2>
        <p>
          Human readers can browse the previews on the home page and{" "}
          <Link href="/subscribe">subscribe</Link> for unlimited access. Agents
          can discover available content and its machine-readable endpoints in
          the <Link href="/agents">/agents directory</Link>, then pay for only
          the items they request.
        </p>

        <h2>How it works</h2>
        <p>
          Humans pay through a familiar Stripe subscription. Agents use MPP to
          make a per-item payment without creating an account or completing a
          checkout form. When an agent requests protected content, the server
          responds with HTTP <code>402 Payment Required</code> and a payment
          challenge. The agent pays, retries the request with its payment
          credential, and receives the content with a receipt.
        </p>
        <p>
          This creates one content platform with two paths to access: a
          subscription for people and open, programmatic payments for agents.
          In both cases, the creator is paid for the work being consumed.
        </p>

        <h2>Learn more</h2>
        <ul>
          <li>
            Read the <Link href="/docs">documentation</Link> to set up and
            customize your own site.
          </li>
          <li>
            Explore the <Link href="/agents">agent directory</Link> to see how
            content is discovered programmatically.
          </li>
          <li>
            View the <a href={SITE.repo}>source repository</a> to inspect,
            clone, or contribute to the project.
          </li>
        </ul>
      </article>
    </main>
  );
}
