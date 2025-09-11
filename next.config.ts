import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'https://apiautobot.idxsolana.io',
    NEXT_PUBLIC_BACKEND_URL: process.env.BACKEND_URL || 'https://apiautobot.idxsolana.io',
  },
};

export default nextConfig;
