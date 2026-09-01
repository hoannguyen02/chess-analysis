import ErrorBoundary from '@/components/ErrorBoundary';
import { AppProvider } from '@/contexts/AppContext';
import '@/styles/globals.css';
import { LocaleType } from '@/types/locale';
import type { CustomFlowbiteTheme } from 'flowbite-react';
import { Flowbite } from 'flowbite-react';
import { NextIntlClientProvider } from 'next-intl';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Custom Flowbite theme
const customTheme: CustomFlowbiteTheme = {
  button: {
    color: {
      primary: 'bg-[var(--p-bg)] text-white',
    },
  },
};

const App = ({ Component, pageProps }: AppProps) => {
  const router = useRouter();

  const locale = router.locale;

  useEffect(() => {
    if (locale) {
      localStorage.setItem('locale', locale); // ✅ Store locale in localStorage
    }
  }, [locale]);

  const fontClass = locale === 'vi' ? 'font-vi' : 'font-en';

  return (
    <>
      <ErrorBoundary
        msg={locale === 'vi' ? 'Đã xảy ra lỗi!' : 'Something went wrong!'}
      >
        <Flowbite theme={{ theme: customTheme }}>
          <NextIntlClientProvider
            messages={pageProps.messages}
            locale={locale}
            timeZone="Asia/Ho_Chi_Minh"
          >
            <AppProvider
              locale={locale as LocaleType}
              isMobileSSR={pageProps.isMobileSSR}
            >
              <div className={fontClass}>
                <Component {...pageProps} locale={locale} />
              </div>
            </AppProvider>
          </NextIntlClientProvider>
        </Flowbite>
      </ErrorBoundary>
    </>
  );
};

export default App;
