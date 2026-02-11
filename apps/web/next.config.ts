import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@dentflow/database', '@dentflow/shared-types', '@dentflow/crypto'],
  serverExternalPackages: ['bcryptjs', '@prisma/client', '.prisma/client'],
};

export default nextConfig;
