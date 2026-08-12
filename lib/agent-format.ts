import "server-only";

import type { Post, PostPreview } from "./content";
import { appUrl, PER_CONTENT_PRICE_USD } from "./config";
import { signedAssetPath } from "./assets";

function frontmatter(post: Post | PostPreview): string {
  const fm = [
    "---",
    `id: ${post.id}`,
    `title: ${post.title}`,
    `type: ${post.type}`,
    `date: ${post.date}`,
    `authors: [${post.authors.join(", ")}]`,
    `tags: [${post.tags.join(", ")}]`,
    `summary: ${post.summary}`,
    "---",
  ];
  return fm.join("\n");
}

/** Full paid representation for a post — only returned after payment/subscription. */
export function renderPaidMarkdown(post: Post): string {
  let body = `${frontmatter(post)}\n\n# ${post.title}\n\n${post.contents}\n`;
  if (post.type === "image" && post.image) {
    const url = `${appUrl()}${signedAssetPath(post.id)}`;
    body += `\n![${post.title}](${url})\n\n> Full-resolution asset (signed, expires shortly): ${url}\n`;
  }
  return body;
}

/** Public, unpaid representation — metadata + teaser + how to pay. Never the body. */
export function renderTeaserMarkdown(post: PostPreview): string {
  const url = `${appUrl()}/api/content/${post.id}`;
  return [
    frontmatter(post),
    "",
    `# ${post.title}`,
    "",
    post.summary,
    "",
    `**This content is paid.** Retrieve the full item for $${PER_CONTENT_PRICE_USD} over MPP:`,
    "",
    "```",
    `GET ${url}`,
    "```",
    "",
    `Or subscribe for unlimited access: ${appUrl()}/subscribe`,
  ].join("\n");
}
