'use client';
// https://flowbite-react.com/docs/components/modal

import { Button, Modal } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';
import { LimaBenefits } from './LimaBenefits';

type Props = {
  onClose: () => void;
};

export const RegisterDialog = ({ onClose }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  return (
    <>
      <Modal show position="center" onClose={onClose}>
        <Modal.Header> {t('common.benefits.title')}</Modal.Header>
        <Modal.Body>
          <div className="space-y-6 lg:px-6">
            <LimaBenefits />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex justify-center w-full">
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
              {t('common.button.join-now')}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};
