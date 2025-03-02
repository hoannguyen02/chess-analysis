import { useAppContext } from '@/contexts/AppContext';
import { Button, Modal } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { LimaBenefits } from './LimaBenefits';

export default function PromoModal() {
  const { isSubscriptionExpired, isLoggedIn } = useAppContext();
  const [openModal, setOpenModal] = useState(false);
  const t = useTranslations('common');
  const router = useRouter();

  useEffect(() => {
    if (isSubscriptionExpired || !isLoggedIn) {
      const hasSeenModal = sessionStorage.getItem('promo_modal_shown');

      // Prevent showing the modal if the user navigated recently
      if (!hasSeenModal && document.visibilityState === 'visible') {
        const timeout = setTimeout(() => {
          setOpenModal(true);
          sessionStorage.setItem('promo_modal_shown', 'true');
        }, 1000); // Show after 1 second

        return () => clearTimeout(timeout);
      }
    }
  }, [isLoggedIn, isSubscriptionExpired]);

  const message = useMemo(() => {
    return isLoggedIn ? t('promotion.message') : t('promotion.guest-message');
  }, [isLoggedIn, t]);

  return (
    <Modal show={openModal} size="md" onClose={() => setOpenModal(false)}>
      <Modal.Header>{t('promotion.title')}</Modal.Header>
      <Modal.Body>
        <div className="">
          <p className="text-gray-700 mb-4">{message}</p>
          {isLoggedIn && <LimaBenefits />}
          <div className="w-full flex justify-center mt-8">
            {isLoggedIn ? (
              <Button
                outline
                gradientDuoTone="pinkToOrange"
                className="mt-4"
                onClick={() => {
                  router.push('/register-guide');
                }}
              >
                {t('button.subscribe-now')}
              </Button>
            ) : (
              <div className="flex flex-col lg:flex-row">
                <div className="flex">
                  <Button
                    outline
                    gradientDuoTone="tealToLime"
                    className="ml-2"
                    onClick={() => {
                      router.push('/login');
                    }}
                  >
                    {t('navigation.login')}
                  </Button>
                  <Button
                    outline
                    gradientDuoTone="pinkToOrange"
                    className="ml-4"
                    onClick={() => {
                      router.push('/register');
                    }}
                  >
                    {t('navigation.register')}
                  </Button>
                </div>
                <div className="flex justify-center mt-4 lg:mt-0 lg:ml-4">
                  <Button outline onClick={() => setOpenModal(false)}>
                    {t('button.skip')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
