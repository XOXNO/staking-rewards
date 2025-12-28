import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  productionBrowserSourceMaps: false,
  compress: false,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tools.multiversx.com',
        port: '',
        pathname: '/assets-cdn/identities/**',
      },
    ],
  },
};

export default nextConfig;
