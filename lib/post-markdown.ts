/**
 * Client-safe markdown normalization shared by the post views.
 */

/**
 * Removes a leading `# Heading` line from a markdown body.
 *
 * Post views render the title themselves, and content files keep their title
 * in frontmatter so their bodies never open with a heading. Generated articles
 * don't follow that convention — the model is asked for Markdown and typically
 * opens with the title as an H1 — so without this the title renders twice (and
 * the page ships two `h1`s).
 *
 * Only a top-level `#` is stripped; `##` and deeper headings are section
 * headings and are left alone.
 */
export function stripLeadingH1(markdown: string): string {
  return markdown.replace(/^\s*#[ \t]+[^\n]*\n?/, "");
}
