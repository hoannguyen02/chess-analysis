import { Button, Modal } from 'flowbite-react';
import { ReactNode } from 'react';

type Props = {
  onClose(): void;
  onOk(): void;
  onClose(): void;
  children?: ReactNode;
  title?: string;
};
export const ConfirmModal = ({
  title = '',
  children,
  onClose,
  onOk,
}: Props) => {
  return (
    <Modal show onClose={onClose}>
      <Modal.Header>{title}</Modal.Header>
      <Modal.Body>{children}</Modal.Body>
      <Modal.Footer className="flex justify-center">
        <Button onClick={onOk}>Confirm</Button>
        <Button color="gray" onClick={onClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
