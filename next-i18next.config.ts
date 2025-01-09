import path from 'path';

const nextI18NextConfig = {
  i18n: {
    locales: ['en', 'vi'], // Supported locales
    defaultLocale: 'en', // Default locale
  },
  localePath: path.resolve('./public/locales'),
};

export default nextI18NextConfig;
