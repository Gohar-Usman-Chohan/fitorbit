import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
    formats: ['image/webp'],
  },
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
  experimental: {
    optimizePackageImports: [
      '@mui/material',
      '@radix-ui/react-select',
      'recharts',
      'lucide-react',
    ],
  },
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
};
export default nextConfig;
