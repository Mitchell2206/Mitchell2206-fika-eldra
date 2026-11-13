import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
  async redirects() {
    return [{ source: '/productos/vela-fehu', destination: '/productos/vela-ritual', permanent: true }];
  },
};

export default nextConfig;
