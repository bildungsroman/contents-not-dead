/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The optional `@bildungsroman/content-generator` package is loaded at
  // runtime only in demo builds. Keeping it external prevents the bundler from
  // trying to resolve it when clones install without it.
  serverExternalPackages: ["@bildungsroman/content-generator"],
  async rewrites() {
    // Serve dynamic discovery docs from dotted .well-known paths (Next route
    // segments can't start with a dot).
    return [
      { source: "/.well-known/mpp.json", destination: "/well-known/mpp.json" },
      { source: "/.well-known/mpp.md", destination: "/well-known/mpp.md" },
    ];
  },
  async headers() {
    return [
      {
        // Paid/gated responses must never be cached by shared caches.
        source: "/api/content/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
      {
        source: "/agents/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
        ],
      },
    ];
  },
};

export default nextConfig;
