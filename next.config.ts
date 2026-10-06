import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 85 for the full-width room photos, which otherwise look soft on large screens
    qualities: [75, 85],
  },
};

export default nextConfig;
