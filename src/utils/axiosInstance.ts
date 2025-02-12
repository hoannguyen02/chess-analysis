import { DefaultLocale } from '@/constants';
import axios from 'axios';
import { GetServerSidePropsContext } from 'next';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LIMA_BE_DOMAIN, // Base API URL
  withCredentials: true, // Automatically include cookies for client-side requests
});

const getStoredLocale = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('locale') || DefaultLocale;
  }

  return DefaultLocale;
};

axiosInstance.interceptors.request.use((config) => {
  const locale = getStoredLocale();
  if (locale) {
    config.headers['x-lang'] = locale;
  }
  return config;
});

/**
 * A helper to create an Axios instance with server-side cookies.
 * This function should be used in `getServerSideProps`.
 */
export const createServerAxios = (ctx: GetServerSidePropsContext) => {
  const cookies = ctx.req.headers.cookie || '';
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_LIMA_BE_DOMAIN, // Use the same base URL
    withCredentials: true, // Automatically include cookies
    headers: {
      cookie: cookies, // Attach cookies for server-side requests
      'x-lang': ctx.locale || DefaultLocale, // Add locale as a custom header
    },
  });
};

export default axiosInstance;
