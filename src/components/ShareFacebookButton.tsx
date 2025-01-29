import { Button } from 'flowbite-react';
import { useTranslations } from 'next-intl';

type Props = {
  url: string;
};
export const ShareFacebookButton = ({ url }: Props) => {
  const t = useTranslations('common');
  return (
    <Button
      onClick={() => {
        const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(facebookShareUrl, '_blank', 'width=600,height=400');
      }}
    >
      {t('button.share-facebook')}
    </Button>
  );
};
