import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'https://autobot-back-dev.idxsolana.io',
    NEXT_PUBLIC_BACKEND_URL: process.env.BACKEND_URL || 'https://autobot-back-dev.idxsolana.io',
  },
};

export default nextConfig;
