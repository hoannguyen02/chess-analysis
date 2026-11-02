import DrawThemePracticePage from '@/components/DrawThemePracticePage';
import type { GetStaticProps } from 'next';

export default function RepetitionDrawPage() {
  return (
    <DrawThemePracticePage
      title="Lặp lại thế cờ không cần chiếu"
      label="Luyện lặp lại thế cờ không cần chiếu"
      endpoint="/api/repetition-draw-exercises"
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
