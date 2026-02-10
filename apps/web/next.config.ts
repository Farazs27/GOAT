import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@dentflow/database', '@dentflow/shared-types', '@dentflow/crypto'],
  serverExternalPackages: ['bcryptjs'],
};

export default nextConfig;
