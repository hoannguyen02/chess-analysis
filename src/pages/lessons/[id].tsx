import Layout from '@/components/Layout';
import { withThemes } from '@/HOF/withThemes';
import { LessonFormScreen } from '@/screens/lessons/form';
import { Lesson } from '@/types/lesson';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

type Props = {
  lesson: Lesson;
};
const LessonPage = ({ lesson }: Props) => {
  return (
    <Layout>
      <LessonFormScreen lesson={lesson} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async (context: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>) => {
    const apiDomain = process.env.NEXT_PUBLIC_PHONG_CHESS_DOMAIN;
    const { id } = context.params as { id: string };

    try {
      const res = await fetch(`${apiDomain}/v1/lessons/${id}`);

      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.statusText}`);
      }

      const data = await res.json();

      return { props: { lesson: data } };
    } catch (error) {
      console.error('Fetch error:', error);
      return { props: { puzzles: [] } };
    }
  }
);

export default LessonPage;
