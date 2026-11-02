import DrawThemePracticePage from '@/components/DrawThemePracticePage';
import type { GetStaticProps } from 'next';

export default function FortressDrawPage() {
  return (
    <DrawThemePracticePage
      title="Pháo đài giữ hòa"
      label="Luyện phòng thủ pháo đài"
      endpoint="/api/fortress-draw-exercises"
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
