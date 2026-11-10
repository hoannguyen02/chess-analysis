import DrawThemePracticePage from '@/components/DrawThemePracticePage';
import type { GetStaticProps } from 'next';

export default function PerpetualCheckPage() {
  return (
    <DrawThemePracticePage
      title="Chiếu lặp lại để giữ hòa"
      label="Luyện chiếu lặp lại để giữ hòa"
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
