import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  transpilePackages: ['@dentflow/database', '@dentflow/shared-types', '@dentflow/crypto'],
};

export default nextConfig;
