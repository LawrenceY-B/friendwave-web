import type { NextConfig } from "next";

// Posts can have up to 10 images of 5 MB each (the API's limits), plus multipart overhead
const UPLOAD_LIMIT = "52mb";

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
