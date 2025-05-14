import path from 'path';

const nextI18NextConfig = {
  i18n: {
    locales: ['en', 'vi'],
    defaultLocale: 'en',
  },
  webpack: (config: any) => {
    config.resolve.alias['@/locales'] = path.join(__dirname, 'locales');
    return config;
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: true, // 301 Redirect
      },
    ];
  },
};

export default nextI18NextConfig;
