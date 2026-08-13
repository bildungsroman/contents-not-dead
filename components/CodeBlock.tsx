"use client";

import { useState } from "react";

/** Terminal-style code block with a copy-all button in the header and a
 * per-line copy icon revealed on hover. */
export function CodeBlock({ code }: { code: string }) {
  const lines = code.replace(/\n+$/, "").split("\n");
  return (
    <pre className="codeblock">
      <CopyButton text={code} className="copy-all" label="Copy all" />
      <code>
        {lines.map((line, i) => (
          <span className="code-line" key={i}>
            <span className="code-line-text">{line.length ? line : "\u00A0"}</span>
            {line.trim() ? (
              <CopyButton
                text={line}
                className="copy-line"
                label={`Copy line ${i + 1}`}
              />
            ) : null}
          </span>
        ))}
      </code>
    </pre>
  );
}

function CopyButton({
  text,
  className,
  label,
}: {
  text: string;
  className?: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable (e.g. insecure context) — ignore */
    }
  }

  return (
    <button
      type="button"
      className={`copy-btn${className ? ` ${className}` : ""}`}
      onClick={copy}
      aria-label={label}
      title={copied ? "Copied!" : label}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
    </button>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M5 15V5a2 2 0 0 1 2-2h8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
