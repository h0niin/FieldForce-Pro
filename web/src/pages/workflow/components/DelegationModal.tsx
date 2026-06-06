import { Modal, Select, Input, Form } from 'antd';
import { useTranslation } from 'react-i18next';
import { useUsers } from '@/hooks/use-users';
import type { User } from '@/types/models.types';

interface DelegationModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (delegateToId: string, comments: string) => void;
  loading?: boolean;
}

export default function DelegationModal({
  open,
  onClose,
  onSubmit,
  loading,
}: DelegationModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { data: usersData } = useUsers({ take: 100 });
  const users = usersData?.data || [];

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values.delegate_to_id, values.comments || '');
    form.resetFields();
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={t('delegationModal.title')}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText={t('delegationModal.delegate')}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="delegate_to_id"
          label={t('delegationModal.delegateTo')}
          rules={[{ required: true, message: t('delegationModal.selectUserError') }]}
        >
          <Select
            placeholder={t('delegationModal.selectPlaceholder')}
            showSearch
            optionFilterProp="label"
            options={users.map((u: User) => ({
              value: u.id,
              label: `${u.first_name} ${u.last_name} (${u.email})`,
            }))}
          />
        </Form.Item>

        <Form.Item name="comments" label={t('delegationModal.reason')}>
          <Input.TextArea rows={3} placeholder={t('delegationModal.reasonPlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}