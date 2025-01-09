import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '../../next-i18next.config';

export const getTranslations = async (
  locale: string,
  namespaces: string[] = ['common']
) => {
  return serverSideTranslations(locale, namespaces, nextI18NextConfig);
};
