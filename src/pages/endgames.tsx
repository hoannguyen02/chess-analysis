import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { Course } from '@/types/course';
import { LocaleType } from '@/types/locale';
import { filteredQuery } from '@/utils/filteredQuery';
import { ViewCourses } from '@/view-screens/view-courses';
import axios from 'axios';
import { GetServerSidePropsContext } from 'next';

type Props = {
  initialCourses: Course[];
  locale: LocaleType;
  currentPage: number;
  totalPages: number;
  tacticsOnly?: boolean;
  initialTheme?: string;
};
const EndgamesPage = (props: Props) => {
  return (
    <Layout>
      <ViewCourses {...props} />
    </Layout>
  );
};

export const getServerSideProps = withThemes(
  async ({ locale, query }: GetServerSidePropsContext, { apiDomain }) => {
    try {
      const page = Number(query.page);
      const { search, tags = 'Endgames', difficulty } = query;

      const queryString = filteredQuery({
        difficulty,
        search,
        locale,
        page: page || 1,
        tags,
      });

      const res = await axios.get(`${apiDomain}/v1/courses?${queryString}`);

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

export default EndgamesPage;
