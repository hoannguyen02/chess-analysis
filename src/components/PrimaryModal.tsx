import { Button, Modal } from 'flowbite-react';

type Props = {
  open: boolean;
  onClose(): void;
  title: string;
  children: React.ReactNode;
  onSubmit?(): void;
  submitTitle?: string;
  cancelTitle?: string;
  showFooter?: boolean;
  onCancel?(): void;
};
export const PrimaryModal = ({
  open,
  onClose,
  title,
  children,
  submitTitle = 'OK',
  cancelTitle = 'Cancel',
  onSubmit,
  onCancel,
  showFooter,
}: Props) => {
  return (
    <>
      <Modal show={open} position="center" onClose={onClose}>
        <Modal.Header>{title}</Modal.Header>
        <Modal.Body>{children}</Modal.Body>
        {showFooter && (
          <Modal.Footer>
            <Button onClick={onSubmit}>{submitTitle}</Button>
            <Button color="gray" onClick={onCancel}>
              {cancelTitle}
            </Button>
          </Modal.Footer>
        )}
      </Modal>
    </>
  );
};
