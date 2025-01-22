import { LocaleType } from '@/types/locale';
import axios from 'axios';
import { GetServerSidePropsContext } from 'next';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LIMA_BE_DOMAIN, // Base API URL
  withCredentials: true, // Automatically include cookies for client-side requests
});

export const setAxiosLocale = (locale: LocaleType) => {
  axiosInstance.interceptors.request.use((config) => {
    if (config.headers) {
      config.headers['x-lang'] = locale || 'en'; // Add the locale dynamically
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      config.headers = { 'x-lang': locale || 'en' }; // Ensure headers exist
    }
    return config;
  });
};

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
      'x-lang': ctx.locale || 'en', // Add locale as a custom header
    },
  });
};

export default axiosInstance;
