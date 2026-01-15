import nextPwa from 'next-pwa';

const isCapacitorExport = process.env.CAPACITOR_BUILD === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: isCapacitorExport ? 'export' : undefined,
  images: {
    domains: ['flagcdn.com'],
    unoptimized: isCapacitorExport,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Augmenter le timeout pour Plasmic
  staticPageGenerationTimeout: 180,
  // autres options Next.js ici
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextPwa({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // désactive le SW en dev
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/eu\.i\.posthog\.com\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^https:\/\/eu-assets\.i\.posthog\.com\/.*/i,
      handler: 'NetworkOnly',
    },
    {
      urlPattern: /^https:\/\/.*\.ingest\..*/i,
      handler: 'NetworkOnly',
    },
  ],
})(nextConfig);
