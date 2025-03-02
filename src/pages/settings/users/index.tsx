import Layout from '@/components/Layout';
import { DefaultLocale } from '@/constants';
import { withThemes } from '@/HOF/withThemes';
import { UserListScreen } from '@/setting-screens/users/list';
import { Role } from '@/types/user';
import { createServerAxios } from '@/utils/axiosInstance';

type Props = {
  roles: Role[];
};
const UsersPage = ({ roles }: Props) => {
  return (
    <Layout>
      <UserListScreen roles={roles} />
    </Layout>
  );
};

export const getServerSideProps = withThemes(async (ctx) => {
  const { locale } = ctx;
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
    const serverAxios = createServerAxios(ctx);
    const response = await serverAxios.get(`/v1/roles`);

    return {
      props: {
        messages,
        roles: response.data.map((role: any) => ({
          value: role._id,
          label: role.title,
        })),
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
        data: null,
      },
    };
  }
});

export default UsersPage;
