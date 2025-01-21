import ErrorBoundary from '@/components/ErrorBoundary';
import { AppProvider } from '@/contexts/AppContext';
import '@/styles/globals.css';
import { LocaleType } from '@/types/locale';
import type { CustomFlowbiteTheme } from 'flowbite-react';
import { Flowbite } from 'flowbite-react';
import { NextIntlClientProvider } from 'next-intl';
import type { AppProps } from 'next/app';
import { Poppins, Roboto } from 'next/font/google'; // Import additional fonts
import { useRouter } from 'next/router';

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

const App = ({ Component, pageProps }: AppProps) => {
  const { locale } = useRouter();

  // Determine the font based on the locale
  const fontClass = locale === 'vi' ? roboto.className : poppins.className;

  return (
    <ErrorBoundary>
      <Flowbite theme={{ theme: customTheme }}>
        <NextIntlClientProvider
          messages={pageProps.messages}
          locale={locale}
          timeZone="Asia/Ho_Chi_Minh"
        >
          <AppProvider
            themes={pageProps.themes}
            tags={pageProps.tags}
            locale={locale as LocaleType}
            apiDomain={pageProps.apiDomain}
            isMobileSSR={pageProps.isMobileSSR}
            session={pageProps.session}
          >
            <div className={fontClass}>
              {/* Apply the font class dynamically */}
              <Component {...pageProps} />
            </div>
          </AppProvider>
        </NextIntlClientProvider>
      </Flowbite>
    </ErrorBoundary>
  );
};

export default App;
