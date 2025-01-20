import axios from 'axios';
import { GetServerSidePropsContext } from 'next';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_LIMA_BE_DOMAIN, // Base API URL
  withCredentials: true, // Automatically include cookies for client-side requests
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
    },
  });
};

export default axiosInstance;
