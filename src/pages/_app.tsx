import ErrorBoundary from '@/components/ErrorBoundary';
import ToastContainer from '@/components/ToastContainer';
import { AppProvider } from '@/contexts/AppContext';
import { ToastProvider } from '@/contexts/ToastContext';
import '@/styles/globals.css';
import { LocaleType } from '@/types/locale';
import { pageview } from '@/utils/gtm';
import type { CustomFlowbiteTheme } from 'flowbite-react';
import { Flowbite } from 'flowbite-react';
import { NextIntlClientProvider } from 'next-intl';
import type { AppProps } from 'next/app';
import { Poppins, Roboto } from 'next/font/google'; // Import additional fonts
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect } from 'react';

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
  const router = useRouter();

  const locale = router.locale;

  useEffect(() => {
    if (locale) {
      localStorage.setItem('locale', locale); // ✅ Store locale in localStorage
    }
  }, [locale]);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      pageview(url);
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // Determine the font based on the locale
  const fontClass = locale === 'vi' ? roboto.className : poppins.className;

  return (
    <>
      {/* Google Tag Manager */}
      {process.env.NODE_ENV === 'production' && (
        <Script id="gtm-script" strategy="afterInteractive">
          {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-TFV27HSJ');
        `}
        </Script>
      )}

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
              apiDomain={pageProps.apiDomain}
              isMobileSSR={pageProps.isMobileSSR}
              session={pageProps.session}
            >
              {/* Apply the font class dynamically */}
              <div className={fontClass}>
                <ToastProvider>
                  <Component {...pageProps} locale={locale} />
                  <ToastContainer />
                </ToastProvider>
              </div>
            </AppProvider>
          </NextIntlClientProvider>
        </Flowbite>
      </ErrorBoundary>
    </>
  );
};

export default App;
