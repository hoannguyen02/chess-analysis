import DrawThemePracticePage from '@/components/DrawThemePracticePage';
import type { GetStaticProps } from 'next';

export default function PerpetualCheckPage() {
  return (
    <DrawThemePracticePage
      title="Chiếu vĩnh viễn"
      label="Luyện chiếu vĩnh viễn"
      endpoint="/api/perpetual-check-exercises"
    />
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    messages: {
      common: (await import(`@/locales/${locale || 'vi'}/common.json`)).default,
    },
  },
});
