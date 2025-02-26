'use client';
// https://flowbite-react.com/docs/components/modal

import { useAppContext } from '@/contexts/AppContext';
import { Button, Modal } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';

type Props = {
  onClose: () => void;
};

export const RegisterDialog = ({ onClose }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const { isLoggedIn } = useAppContext();
  return (
    <>
      <Modal show position="center" onClose={onClose}>
        <Modal.Header> {t('common.register-dialog.title')}</Modal.Header>
        <Modal.Body>
          <div className="space-y-6">{t('common.register-dialog.message')}</div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex justify-center w-full">
            {!isLoggedIn ? (
              <Button
                id="register-banner-button"
                outline
                gradientDuoTone="pinkToOrange"
                size="lg"
                className="mt-4 font-semibold flex"
                onClick={() => {
                  window?.dataLayer?.push({
                    event: 'register-banner-button',
                  });
                  router.push('/register');
                }}
              >
                {t('common.button.join-now')}
              </Button>
            ) : (
              <Button
                id="register-banner-button"
                outline
                gradientDuoTone="pinkToOrange"
                size="lg"
                className="mt-4 font-semibold flex"
                onClick={() => {
                  window?.dataLayer?.push({
                    event: 'register-banner-button',
                  });
                  router.push('/register-guide');
                }}
              >
                {t('common.button.subscribe-now')}
              </Button>
            )}
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};
