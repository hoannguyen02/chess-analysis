'use client';

import { BOARD_THEME_MAP } from '@/constants/board-themes';
import { useAppContext } from '@/contexts/AppContext';
import { Button, Modal } from 'flowbite-react';
import { useTranslations } from 'next-intl';

type TeachingToolsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export const TeachingToolsDialog = ({
  open,
  onClose,
}: TeachingToolsDialogProps) => {
  const t = useTranslations();
  const { boardTheme } = useAppContext();
  const highlightColors = BOARD_THEME_MAP[boardTheme].highlightColors;

  return (
    <Modal show={open} onClose={onClose} size="2xl" popup>
      <Modal.Header />
      <Modal.Body>
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-slate-900">
              {t('common.teaching-tools.title')}
            </h3>
            <p className="text-sm text-slate-500">
              {t('common.teaching-tools.description')}
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-sm font-semibold text-slate-900">
                {t('common.teaching-tools.action-right-click')}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {t('common.teaching-tools.help-right-click')}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-sm font-semibold text-slate-900">
                {t('common.teaching-tools.action-multi-squares')}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {t('common.teaching-tools.help-multi-squares')}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-sm font-semibold text-slate-900">
                {t('common.teaching-tools.action-piece-legal')}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {t('common.teaching-tools.help-piece-legal')}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-sm font-semibold text-slate-900">
                {t('common.teaching-tools.action-piece-control')}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {t('common.teaching-tools.help-piece-control')}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-sm font-semibold text-slate-900">
                {t('common.teaching-tools.action-arrow')}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {t('common.teaching-tools.help-arrow')}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-sm font-semibold text-slate-900">
                {t('common.teaching-tools.action-rectangle')}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {t('common.teaching-tools.help-rectangle')}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-sm font-semibold text-slate-900">
                {t('common.teaching-tools.action-piece-captures')}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {t('common.teaching-tools.help-piece-captures')}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-sm font-semibold text-slate-900">
                {t('common.teaching-tools.action-piece-checks')}
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {t('common.teaching-tools.help-piece-checks')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-slate-900">
              {t('common.teaching-tools.colors')}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {highlightColors.map((color) => (
                <div
                  key={color.key}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <span className="rounded bg-slate-900 px-2 py-1 text-xs text-white">
                    {color.key}
                  </span>
                  <span
                    className="h-4 w-4 rounded-full border border-slate-200"
                    style={{ backgroundColor: color.arrow }}
                  />
                  <span className="text-sm text-slate-600">
                    {t(color.labelKey)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">
              {t('common.teaching-tools.quick-clear')}:
            </span>{' '}
            {t('common.teaching-tools.help-clear')}
          </div>

          <div className="flex justify-end">
            <Button color="gray" onClick={onClose}>
              {t('common.button.close')}
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
