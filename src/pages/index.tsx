import { DragDropExample } from '@/components/DragDropExample';
import FormExample from '@/components/FormExample';
import Layout from '@/components/Layout';
import ModalExample from '@/components/Modal';

export default function Home() {
  return (
    <Layout>
      <DragDropExample />
      <ModalExample />
      <FormExample />
    </Layout>
  );
}
