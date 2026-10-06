import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { AgentGuide } from "@/components/AgentGuide";
import { renderPaidMarkdown, renderTeaserMarkdown } from "@/lib/agent-format";
import { getAllPreviews, getPost } from "@/lib/content";

const API = "https://api.example.com";
const SITE = "https://www.example.com";

describe("agent payment links", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = API;
    process.env.NEXT_PUBLIC_APP_URL = SITE;
    process.env.CONTENT_ASSET_SECRET = "test-secret-long-enough";
  });

  it("uses the agent API origin in the public teaser", () => {
    const teaser = renderTeaserMarkdown(getAllPreviews()[0]);
    expect(teaser).toContain(`${API}/api/content/`);
    expect(teaser).not.toContain(`${SITE}/api/content/`);
    expect(teaser).toContain(`${SITE}/subscribe`);
  });

  it("uses the agent API origin throughout the agent guide", () => {
    const html = renderToStaticMarkup(createElement(AgentGuide));
    expect(html).toContain(`${API}/api/content/{id}`);
    expect(html).toContain(`${API}/.well-known/mpp.json`);
    expect(html).toContain(`${API}/.well-known/mpp.md#troubleshooting`);
    expect(html).not.toContain(`${SITE}/api/content/`);
  });

  it("uses the agent API origin for signed assets in paid markdown", () => {
    const post = getPost("a-quiet-machine");
    expect(post).toBeDefined();

    const markdown = renderPaidMarkdown(post!);
    expect(markdown).toContain(`${API}/api/content/a-quiet-machine/asset`);
    expect(markdown).not.toContain(`${SITE}/api/content/a-quiet-machine/asset`);
  });
});
