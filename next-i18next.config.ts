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
};

export default nextI18NextConfig;
