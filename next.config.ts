import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist (via pdf-parse) dynamically loads a worker file at a path that
  // Turbopack's bundling breaks; run it as native Node require instead.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  // Vercel's serverless function tracer misses pdfjs-dist's worker file since
  // it's resolved at runtime rather than statically imported — force it in.
  outputFileTracingIncludes: {
    "/api/candidates": ["./node_modules/pdfjs-dist/**/*"],
  },
};

export default nextConfig;
