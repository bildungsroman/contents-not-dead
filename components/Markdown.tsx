import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { isExternalHref } from "@/lib/links";
import { ExternalLink } from "./ExternalLink";

const components: Components = {
  // Drop the hast `node` prop so it isn't spread onto the DOM element.
  a: ({ node: _node, href, ...rest }) =>
    isExternalHref(href) ? (
      <ExternalLink href={href} {...rest} />
    ) : (
      <a href={href} {...rest} />
    ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
