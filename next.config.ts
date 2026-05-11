import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // playwright is only used in API routes; mark as external for server bundles
  serverExternalPackages: ['playwright', 'cheerio'],
};

export default withNextIntl(nextConfig);
