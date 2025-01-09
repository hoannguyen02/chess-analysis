import ErrorBoundary from '@/components/ErrorBoundary';
import { AppProvider } from '@/contexts/AppContext';
import '@/styles/globals.css';
import type { CustomFlowbiteTheme } from 'flowbite-react';
import { Flowbite } from 'flowbite-react';
import { appWithTranslation, UserConfig } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Poppins, Roboto } from 'next/font/google'; // Import additional fonts
import { useRouter } from 'next/router';
import nextI18NextConfig from '../../next-i18next.config';

// Load Poppins font
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

// Load Roboto font (for Vietnamese)
const roboto = Roboto({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '700'],
});

// Custom Flowbite theme
const customTheme: CustomFlowbiteTheme = {
  button: {
    color: {
      primary: 'bg-[var(--p-bg)] text-white',
    },
  },
};

// Empty initial config for i18next
const emptyInitialI18NextConfig: UserConfig = {
  i18n: {
    defaultLocale: nextI18NextConfig.i18n.defaultLocale,
    locales: nextI18NextConfig.i18n.locales,
  },
};

const App = ({ Component, pageProps }: AppProps) => {
  const { locale } = useRouter(); // Get current locale

  // Determine the font based on the locale
  const fontClass = locale === 'vi' ? roboto.className : poppins.className;

  return (
    <ErrorBoundary>
      <Flowbite theme={{ theme: customTheme }}>
        <AppProvider themes={pageProps.themes} apiDomain={pageProps.apiDomain}>
          <div className={fontClass}>
            {/* Apply the font class dynamically */}
            <Component {...pageProps} />
          </div>
        </AppProvider>
      </Flowbite>
    </ErrorBoundary>
  );
};

export default appWithTranslation(App, emptyInitialI18NextConfig);
