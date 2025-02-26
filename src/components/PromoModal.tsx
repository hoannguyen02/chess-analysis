import { useAppContext } from '@/contexts/AppContext';
import { Button, Modal } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

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

  return (
    <Modal show={openModal} size="md" onClose={() => setOpenModal(false)}>
      <Modal.Header>{t('promotion.title')}</Modal.Header>
      <Modal.Body>
        <div className="text-center">
          <p className="text-gray-700">{t('promotion.message')}</p>
          <div className="flex justify-center">
            <Button
              outline
              gradientDuoTone="pinkToOrange"
              className="mt-4"
              onClick={() => {
                if (isLoggedIn) {
                  router.push('/register-guide');
                } else {
                  router.push('/register');
                }
              }}
            >
              {isLoggedIn
                ? t('button.subscribe-now')
                : t('button.register-now')}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
