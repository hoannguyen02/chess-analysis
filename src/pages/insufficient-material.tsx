import DrawThemePracticePage from '@/components/DrawThemePracticePage';
import type { GetStaticProps } from 'next';

export default function InsufficientMaterialPage() {
  return (
    <DrawThemePracticePage
      title="Đổi quân về thế không đủ lực chiếu hết"
      label="Luyện đổi quân về thế không đủ lực chiếu hết"
      endpoint="/api/insufficient-material-exercises"
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
