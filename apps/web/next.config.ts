import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@omega/shared",
    "@omega/ui",
    "@omega/config",
  ],
};

export default nextConfig;
