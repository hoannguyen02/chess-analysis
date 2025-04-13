import { Logo } from '@/components/Logo';
import { withThemes } from '@/HOF/withThemes';
import { Clipboard } from 'flowbite-react';
import { GetServerSidePropsContext } from 'next';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';

const PaymentGuidePage = () => {
  const t = useTranslations();
  return (
    <div className="min-h-screen flex flex-col items-center p-4">
      <div className="max-w-2xl w-full  mx-auto">
        <div className="flex justify-center my-4">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="mb-2">
          <p className="text-sm text-gray-600 mt-2">
            {t('payment.description')}
          </p>
          <ul className="text-sm text-gray-800 mt-2">
            <li>
              {t('payment.bank-name')} <strong>TP Bank</strong>
            </li>
            <li>
              {t('payment.account-name')} <strong>Nguyen Van Hoan</strong>
            </li>
            <li className="flex items-center">
              <div className="mr-2">
                {t('payment.account-number')} <strong>00004098236</strong>
              </div>
              <Clipboard
                valueToCopy="00004098236"
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
              {t('payment.payment-description')}
              <strong>{t('payment.payment-description-note')}</strong>
            </li>
          </ul>
          <Image
            alt="LIMA Chess QR"
            width={200}
            height={200}
            className="mt-1"
            src={`/images/lima_chess_qr.png`}
          />
        </div>

        <div className="mb-6">
          <ul className="text-sm text-gray-800 mt-2">
            <li>
              {t('payment.phone')} <strong> 0963908507</strong>
            </li>
            <li>
              {t('payment.gmail')} <strong> limachess102@gmail.com</strong>
            </li>
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
          </ul>
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
