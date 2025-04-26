import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true, // Recommended for development
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
