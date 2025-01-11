import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { CourseFormScreen } from '@/setting-screens/courses/form';
import { CourseExpanded } from '@/types/course';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

type Props = {
  course: CourseExpanded;
};
const CoursePage = ({ course }: Props) => {
  return (
    <Layout>
      <CourseFormScreen course={course} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async ({
    params,
    locale,
  }: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>) => {
    const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;
    const { id } = params as { id: string };

    const commonMessages = (await import(`@/locales/${locale}/common.json`))
      .default;

    try {
      const res = await fetch(`${apiDomain}/v1/courses/${id}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.statusText}`);
      }

      const data = await res.json();

      return {
        props: {
          course: data,
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

export default CoursePage;
