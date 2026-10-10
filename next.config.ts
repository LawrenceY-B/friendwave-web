import type { NextConfig } from "next";

// Post photos upload straight from the browser to the API (lib/upload.ts), so the
// only file passing through Next is a profile picture, shrunk to ~100 KB in the browser.
// 6 MB leaves room for an un-shrinkable original (max 5 MB). On Vercel the hard cap
// is 4.5 MB per request whatever this says.
const UPLOAD_LIMIT = "6mb";

const nextConfig: NextConfig = {
  // Lets tests build a separate copy (e.g. NEXT_DIST_DIR=.next-test) without touching .next
  distDir: process.env.NEXT_DIST_DIR || ".next",
  experimental: {
    // Server Actions accept 1 MB by default
    serverActions: { bodySizeLimit: UPLOAD_LIMIT },
    // proxy.ts buffers request bodies up to 10 MB by default and silently cuts off the rest
    proxyClientMaxBodySize: UPLOAD_LIMIT,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
