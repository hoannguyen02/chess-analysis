import axios from 'axios';
import { GetServerSidePropsContext } from 'next';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LIMA_BE_DOMAIN, // Base API URL
  withCredentials: true, // Automatically include cookies for client-side requests
});

export const setAxiosLocale = (locale: string) => {
  axiosInstance.defaults.headers.common['x-lang'] = locale;
};

// Wait for Next.js router to set the locale correctly
export const initializeAxiosLocale = (nextLocale?: string) => {
  const storedLocale =
    typeof window !== 'undefined' ? localStorage.getItem('locale') : null;

  const effectiveLocale = nextLocale || storedLocale || 'en'; // Use Next.js locale if available
  setAxiosLocale(effectiveLocale);
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
