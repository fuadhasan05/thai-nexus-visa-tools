import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Turbopack to use this project folder as the workspace root.
  // This prevents Next from inferring the wrong root when multiple lockfiles exist.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
