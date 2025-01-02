import ErrorBoundary from '@/components/ErrorBoundary';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';

import { Poppins } from 'next/font/google';

// Load Poppins font with specific styles
const poppins = Poppins({
  subsets: ['latin'], // Add subsets if needed
  weight: ['400', '600', '700'], // Specify font weights you need
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component className={poppins.className} {...pageProps} />
    </ErrorBoundary>
  );
}
