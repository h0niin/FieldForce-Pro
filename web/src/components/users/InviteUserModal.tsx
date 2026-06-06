import { useEffect } from 'react';
import { Modal, Form, Input, Select, Space, Alert } from 'antd';
import { MailOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAllRoles } from '@/hooks/use-roles';
import { useInviteUser, useCompanyUsage } from '@/hooks/use-users';
import type { InviteResult } from '@/api/users.api';

interface InviteUserModalProps {
  open: boolean;
  onClose: () => void;
  onInvited: (result: InviteResult) => void;
}

export default function InviteUserModal({ open, onClose, onInvited }: InviteUserModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { data: roles, isLoading: rolesLoading } = useAllRoles();
  const inviteUser = useInviteUser();
  const { data: usage } = useCompanyUsage();

  const usageCurrent = usage?.usage?.total_users?.current;
  const usageLimit = usage?.usage?.total_users?.limit;
  const isLimitReached = usageLimit != null && usageCurrent != null && usageCurrent >= usageLimit;

  useEffect(() => {
    if (!open) form.resetFields();
  }, [open, form]);

  const handleOk = () => {
    form.validateFields().then((values) => {
      inviteUser.mutate(values, {
        onSuccess: (res) => {
          const result = res.data.data!;
          onClose();
          onInvited(result);
        },
      });
    });
  };

  return (
    <Modal
      open={open}
      title={t('inviteUser.title')}
      okText={t('inviteUser.sendInvite')}
      cancelText={t('inviteUser.cancel')}
      confirmLoading={inviteUser.isPending}
      onOk={handleOk}
      onCancel={onClose}
      destroyOnClose
      width={480}
      okButtonProps={{ disabled: isLimitReached }}
    >
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }} size={12}>
        {isLimitReached ? (
          <Alert
            message="User Limit Reached"
            description="Your company has reached the maximum number of users allowed by your subscription plan. Please upgrade your plan to invite more users."
            type="warning"
            showIcon
          />
        ) : (
          <Alert
            message={t('inviteUser.alertMessage')}
            type="info"
            showIcon
          />
        )}
      </Space>

      <Form form={form} layout="vertical">
        <Form.Item
          name="first_name"
          label={t('inviteUser.firstNameLabel')}
          rules={[{ required: true, message: t('inviteUser.firstNameRequired') }]}
        >
          <Input prefix={<UserOutlined />} placeholder={t('inviteUser.firstNamePlaceholder')} />
        </Form.Item>

        <Form.Item
          name="last_name"
          label={t('inviteUser.lastNameLabel')}
          rules={[{ required: true, message: t('inviteUser.lastNameRequired') }]}
        >
          <Input prefix={<UserOutlined />} placeholder={t('inviteUser.lastNamePlaceholder')} />
        </Form.Item>

        <Form.Item
          name="email"
          label={t('inviteUser.emailLabel')}
          rules={[
            { required: true, message: t('inviteUser.emailRequired') },
            { type: 'email', message: t('inviteUser.emailInvalid') },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="user@example.com" />
        </Form.Item>

        <Form.Item
          name="role_id"
          label={t('inviteUser.roleLabel')}
          rules={[{ required: true, message: t('inviteUser.roleRequired') }]}
        >
          <Select
            placeholder={t('inviteUser.rolePlaceholder')}
            loading={rolesLoading}
            options={roles?.map((r) => ({ label: r.name, value: r.id }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}