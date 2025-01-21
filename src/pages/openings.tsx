import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { Course } from '@/types/course';
import { LocaleType } from '@/types/locale';
import { createServerAxios } from '@/utils/axiosInstance';
import { filteredQuery } from '@/utils/filteredQuery';
import { ViewCourses } from '@/view-screens/view-courses';
import { GetServerSidePropsContext } from 'next';

type Props = {
  initialCourses: Course[];
  locale: LocaleType;
  currentPage: number;
  totalPages: number;
  tacticsOnly?: boolean;
  initialTheme?: string;
};
const OpeningsPage = (props: Props) => {
  return (
    <Layout>
      <ViewCourses {...props} />
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async (ctx: GetServerSidePropsContext) => {
    const { locale, query } = ctx;

    try {
      const page = Number(query.page);
      const { search, tags = 'Openings', difficulty } = query;

      const queryString = filteredQuery({
        difficulty,
        search,
        locale,
        page: page || 1,
        tags,
      });

      const serverAxios = createServerAxios(ctx);
      const res = await serverAxios.get(`/v1/courses/public?${queryString}`);

      const { items, lastPage, currentPage } = res.data || {};

      const commonMessages = (await import(`@/locales/${locale}/common.json`))
        .default;
      return {
        props: {
          messages: {
            common: commonMessages,
          },
          locale,
          initialCourses: items,
          currentPage,
          totalPages: lastPage,
          tags,
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

export default OpeningsPage;
