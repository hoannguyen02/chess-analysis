import { useTranslations } from 'next-intl';
import { VscCheck } from 'react-icons/vsc';
import ConfettiEffect from '../ConfettiEffect';

export const CongratsBanner = ({ onClick }: { onClick: () => void }) => {
  const t = useTranslations();
  return (
    <>
      <ConfettiEffect />
      <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center">
          <VscCheck className="text-green-600 w-6 h-6 mr-3" />
          <div>
            <p className="text-green-800 font-medium">
              {t('common.title.congrats-course')}
            </p>
          </div>
        </div>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={onClick}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            {t('common.button.review-course')}
          </button>
        </div>
      </div>
    </>
  );
};
