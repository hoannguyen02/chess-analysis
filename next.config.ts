import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  i18n: {
    locales: ['en', 'vi'], // Supported locales
    defaultLocale: 'en', // Default locale
    localeDetection: false,
  },
  async headers() {
    return [
      // Page-wide isolation (if you need SAB / threads)
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
      // Worker script must ALSO carry COEP
      {
        source: '/stockfish/:path*',
        headers: [
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' }, // allow same-origin embedding
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://www.limachess.com',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: 'http://localhost:3000',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
