import { DragDropExample } from '@/components/DragDropExample';
import FormExample from '@/components/FormExample';
import Layout from '@/components/Layout';
import ModalExample from '@/components/ModalExample';
import { withThemes } from '@/HOF/withThemes';

export default function Home() {
  return (
    <Layout>
      <DragDropExample />
      <ModalExample />
      <FormExample />
    </Layout>
  );
}

export const getServerSideProps = withThemes(async () => {
  return {
    props: {},
  };
});
