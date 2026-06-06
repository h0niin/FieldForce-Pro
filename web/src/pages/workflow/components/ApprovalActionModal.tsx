import { Modal, Select, Input, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ApprovalAction } from '@/types/workflow.types';

interface ApprovalActionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (action: ApprovalAction, comments: string) => void;
  loading?: boolean;
  title?: string;
}

export default function ApprovalActionModal({
  open,
  onClose,
  onSubmit,
  loading,
  title,
}: ApprovalActionModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const actionOptions = [
    { value: 'APPROVE', label: t('approvalActionModal.actions.approve') },
    { value: 'REJECT', label: t('approvalActionModal.actions.reject') },
    { value: 'REQUEST_CORRECTION', label: t('approvalActionModal.actions.requestCorrection') },
    { value: 'SKIP', label: t('approvalActionModal.actions.skip') },
  ];

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values.action, values.comments || '');
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={title || t('approvalActionModal.title')}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText={t('approvalActionModal.submit')}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="action"
          label={t('approvalActionModal.actionLabel')}
          rules={[{ required: true, message: t('approvalActionModal.actionRequired') }]}
        >
          <Select options={actionOptions} placeholder={t('approvalActionModal.actionPlaceholder')} />
        </Form.Item>

        <Form.Item name="comments" label={t('approvalActionModal.commentsLabel')}>
          <Input.TextArea rows={4} placeholder={t('approvalActionModal.commentsPlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}