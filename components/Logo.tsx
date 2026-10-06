import { useId } from "react";

/** Graffiti-style skull-and-crossbones mark. Uses currentColor so it adapts
 * to the surrounding text color; the eyes and nose are masked out so whatever
 * sits behind the logo shows through. */
export function Logo({ className }: { className?: string }) {
  // useId's output can contain characters that break `url(#…)` references.
  const maskId = `skull-cutouts-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Content's Not Dead skull and crossbones logo"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="64"
          height="64"
        >
          <rect width="64" height="64" fill="white" />
          <g stroke="black" strokeWidth="3.4" strokeLinecap="round">
            <line x1="18" y1="22" x2="26" y2="30" />
            <line x1="26" y1="22" x2="18" y2="30" />
            <line x1="38" y1="22" x2="46" y2="30" />
            <line x1="46" y1="22" x2="38" y2="30" />
          </g>
          <path d="M32 34l-3 6h6l-3-6Z" fill="black" />
        </mask>
      </defs>
      {/* crossbones */}
      <g
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.95"
      >
        <line x1="14" y1="40" x2="50" y2="60" />
        <line x1="50" y1="40" x2="14" y2="60" />
        <circle cx="12" cy="38" r="3.4" fill="currentColor" stroke="none" />
        <circle cx="52" cy="38" r="3.4" fill="currentColor" stroke="none" />
        <circle cx="12" cy="62" r="3.4" fill="currentColor" stroke="none" />
        <circle cx="52" cy="62" r="3.4" fill="currentColor" stroke="none" />
      </g>
      {/* skull, with x eyes + nose cut out */}
      <path
        d="M32 4C18.8 4 9 13.6 9 26.4c0 6.1 2.6 10.4 6.4 13.2 1.5 1.1 2.2 2 2.4 3.6l.6 4.3c.2 1.6 1.6 2.7 3.2 2.7h20.8c1.6 0 3-1.1 3.2-2.7l.6-4.3c.2-1.6.9-2.5 2.4-3.6C54.4 36.8 57 32.5 57 26.4 57 13.6 45.2 4 32 4Z"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}
