import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { LessonFormScreen } from '@/setting-screens/lessons/form';
import { LessonExpanded } from '@/types/lesson';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

type Props = {
  lesson: LessonExpanded;
};
const LessonPage = ({ lesson }: Props) => {
  return (
    <Layout>
      <LessonFormScreen lesson={lesson} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async (
    { params, locale }: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>,
    { apiDomain }
  ) => {
    const { id } = params as { id: string };

    try {
      const res = await fetch(`${apiDomain}/v1/lessons/${id}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.statusText}`);
      }

      const data = await res.json();

      const commonMessages = (
        await import(`@/locales/${locale || 'en'}/common.json`)
      ).default;

      return {
        props: {
          lesson: data,
          messages: {
            common: commonMessages,
          },
        },
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return { props: { puzzles: [] } };
    }
  }
);

export default LessonPage;
