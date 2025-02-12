import Layout from '@/components/Layout';
import { DefaultLocale } from '@/constants';
import { withThemes } from '@/HOF/withThemes';
import { CreateUserForm } from '@/setting-screens/users/form';
import { Role, UserExpanded } from '@/types/user';
import { createServerAxios } from '@/utils/axiosInstance';
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  PreviewData,
} from 'next';
import { ParsedUrlQuery } from 'querystring';

type Props = {
  user: UserExpanded;
  roles: Role[];
};
const CoursePage = ({ user, roles }: Props) => {
  return (
    <Layout>
      <CreateUserForm user={user} roles={roles} />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = withThemes(
  async (ctx: GetServerSidePropsContext<ParsedUrlQuery, PreviewData>) => {
    const { locale, params } = ctx;
    // Helper function to load localization messages
    const loadMessages = async (locale: string) => {
      try {
        const commonMessages = (await import(`@/locales/${locale}/common.json`))
          .default;

        return {
          common: commonMessages,
        };
      } catch (err) {
        console.error('Localization loading error:', err);
        return {};
      }
    };

    // Initialize props
    const messages = await loadMessages(locale || DefaultLocale);

    try {
      const { id } = params as { id: string };
      const serverAxios = createServerAxios(ctx);
      const response = await serverAxios.get(`/v1/roles`);
      const userResponse = await serverAxios.get(`/v1/users/${id}`);

      return {
        props: {
          messages,
          roles: response.data.map((role: any) => ({
            value: role._id,
            label: role.title,
          })),
          user: userResponse.data,
          error: null,
        },
      };
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      return {
        props: {
          messages,
          error:
            error.response?.data.message || error.response?.data.message?.error,
          errorCode: error.response?.status,
        },
      };
    }
  }
);

export default CoursePage;
