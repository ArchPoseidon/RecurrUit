import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist (via pdf-parse) dynamically loads a worker file at a path that
  // Turbopack's bundling breaks; run it as native Node require instead.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
