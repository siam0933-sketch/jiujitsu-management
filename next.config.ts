import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Save memory by checking lint locally
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Save memory by checking types locally
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
