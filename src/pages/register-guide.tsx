import { Logo } from '@/components/Logo';
import { withThemes } from '@/HOF/withThemes';
import { Clipboard } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const PaymentGuidePage = () => {
  const t = useTranslations();
  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <div className="max-w-2xl w-full  mx-auto">
        <div className="flex justify-center mt-8">
          <Link href="/" className="mb-6">
            <Logo />
          </Link>
        </div>
        <p className="text-gray-600 text-center mb-6">
          {t('payment.description')}
        </p>

        <div className="mb-6">
          <h2 className="text-lg font-semibold"> {t('payment.step-1')}</h2>
          <p className="text-sm text-gray-600 mt-2">
            {t('payment.step-1-description')}
          </p>
          <ul className="text-sm text-gray-800 mt-2">
            <li>
              <strong>{t('payment.bank-name')}</strong> TP Bank
            </li>
            <li>
              <strong>{t('payment.account-name')}</strong> Nguyen Van Hoan
            </li>
            <li className="flex items-center">
              <div className="mr-2">
                <strong>{t('payment.account-number')}</strong> 0912333224
              </div>
              <Clipboard
                valueToCopy="0912333224"
                label={t('payment.copy')}
                className="py-1 px-2"
                theme={{
                  button: {
                    base: 'bg-primary',
                    label: 'text-black',
                  },
                }}
              />
            </li>
            <li>
              <strong>{t('payment.payment-description')}</strong>{' '}
              {t('payment.payment-description-note')}
              {t('common.title.example')}{' '}
              <strong>0912333224 limachess102@gmail.com</strong>
            </li>
          </ul>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold"> {t('payment.step-2')}</h2>
          <p className="text-sm text-gray-600 mt-2">
            {t('payment.step-2-description')}
          </p>
          <ul className="text-sm text-gray-800 mt-2">
            <li>
              {t('payment.facebook')}
              <a
                href="https://m.me/limachess"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-2"
              >
                {t('payment.facebook-button')}
              </a>
            </li>
            <li>
              {t('payment.gmail')} <strong> limachess102@gmail.com</strong>
            </li>
            <li>
              {t('payment.phone')}
              <strong> 0912333224</strong>
            </li>
          </ul>
        </div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold"> {t('payment.step-3')}</h2>
          <p className="text-sm text-gray-600 mt-2">
            {t('payment.step-3-description')}
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-600 hover:underline"
            >
              {t('payment.video-link')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps = withThemes(
  async ({ locale }: GetServerSidePropsContext) => {
    try {
      const commonMessages = (await import(`@/locales/${locale}/common.json`))
        .default;
      const paymentMessages = (await import(`@/locales/${locale}/payment.json`))
        .default;

      return {
        props: {
          messages: {
            common: commonMessages,
            payment: paymentMessages,
          },
        },
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return {
        props: {},
      };
    }
  }
);

export default PaymentGuidePage;
