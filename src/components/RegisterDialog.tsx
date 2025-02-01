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
            <p className="text-base text-center leading-relaxed text-gray-500">
              {t('common.benefits.subtitle')}
            </p>
            <LimaBenefits />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex justify-center w-full">
            <Button
              outline
              gradientDuoTone="pinkToOrange"
              size="lg"
              className="mt-4 font-semibold flex"
              onClick={() => router.push('/register-guide')}
            >
              {t('common.button.join-now')}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
};
