'use client';
// https://flowbite-react.com/docs/components/modal

import { Button, Modal } from 'flowbite-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/router';

type Props = {
  onClose: () => void;
};

export const RegisterDialog = ({ onClose }: Props) => {
  const t = useTranslations('common');
  const router = useRouter();

  return (
    <>
      <Modal show position="center" onClose={onClose}>
        <Modal.Header> {t('promotion.title')}</Modal.Header>
        <Modal.Body>
          <p className="text-gray-700 mb-4">{t('promotion.guest-message')}</p>
        </Modal.Body>
        <Modal.Footer>
          <div className="w-full flex justify-center mt-8">
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
                <Button outline onClick={onClose}>
                  {t('button.skip')}
                </Button>
              </div>
            </div>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};
