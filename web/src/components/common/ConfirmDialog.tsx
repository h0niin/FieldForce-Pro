import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ConfirmDialogOptions {
  title?: string;
  content: string;
  onOk: () => void | Promise<void>;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
}

export function showConfirmDialog({
  title = 'Confirm',
  content,
  onOk,
  okText = 'Yes',
  cancelText = 'Cancel',
  danger = false,
}: ConfirmDialogOptions) {
  Modal.confirm({
    title,
    icon: <ExclamationCircleOutlined />,
    content,
    okText,
    cancelText,
    okButtonProps: { danger },
    onOk,
  });
}
