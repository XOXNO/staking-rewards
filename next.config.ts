import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Recommended for development
  output: 'standalone',
  productionBrowserSourceMaps: false,
  experimental: {
    ppr: true,
    reactCompiler: true,
    webpackMemoryOptimizations: true,
    webpackBuildWorker: true,
    serverSourceMaps: false,
    staleTimes: {
      dynamic: 30,
    },
  },
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
        port: '', // Keep empty unless a specific port is needed
        pathname: '/assets-cdn/identities/**', // Be as specific as possible with the path
      },
      // Add other allowed hostnames here if needed
    ],
  },
};

export default nextConfig;
