import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import enCommon from '@/locales/en/common.json';
import viCommon from '@/locales/vi/common.json';
import { Lesson } from '@/types/lesson';
import { LocaleType } from '@/types/locale';
import { createServerAxios } from '@/utils/axiosInstance';
import { filteredQuery } from '@/utils/filteredQuery';
import { LessonsScreen } from '@/view-screens/lessons/LessonsScreen';
import { GetServerSidePropsContext } from 'next';

type Props = {
  initialLessons: Lesson[];
  locale: LocaleType;
  currentPage: number;
  totalPages: number;
};
const LessonsPage = (props: Props) => {
  return (
    <Layout>
      <LessonsScreen {...props} />
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async (ctx: GetServerSidePropsContext) => {
    const { locale, query } = ctx;
    try {
      const page = Number(query.page);
      const { search, difficulty } = query;

      const queryString = filteredQuery({
        difficulty,
        search,
        locale,
        page: page || 1,
      });

      const serverAxios = createServerAxios(ctx);
      const res = await serverAxios.get(`/v1/lessons/public?${queryString}`);

      const { items, lastPage, currentPage } = res.data || {};

      // Use fallback translations if import fails
      const translations: Record<LocaleType, any> = {
        en: enCommon,
        vi: viCommon,
      };
      const commonMessages = translations[locale as LocaleType];

      return {
        props: {
          messages: {
            common: commonMessages,
          },
          locale,
          initialLessons: items,
          currentPage,
          totalPages: lastPage,
        },
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return {
        props: {},
      };
    }
  }
);

export default LessonsPage;
