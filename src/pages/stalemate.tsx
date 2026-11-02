import DrawThemePracticePage from '@/components/DrawThemePracticePage';
import type { GetStaticProps } from 'next';

export default function StalematePage() {
  return (
    <DrawThemePracticePage
      title="Bẫy hết nước đi"
      label="Luyện cứu hòa bằng hết nước đi"
      endpoint="/api/stalemate-exercises"
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
