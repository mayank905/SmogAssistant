import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Standalone output is enabled in containerized environments (Docker / Google Cloud Run / CI)
  output: process.env.OUTPUT_STANDALONE === "true" ? "standalone" : undefined,
};

export default nextConfig;
