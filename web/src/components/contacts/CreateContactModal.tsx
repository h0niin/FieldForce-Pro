import { useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { useCreateContact } from '@/hooks/use-contacts';
import type { Contact } from '@/types/models.types';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

interface CreateContactModalProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: (contact: Contact) => void;
}

export default function CreateContactModal({
  open,
  onCancel,
  onSuccess,
}: CreateContactModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const createContact = useCreateContact();

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleSubmit = async (values: any) => {
    try {
      const newContact = await createContact.mutateAsync(values);
      message.success(t('createContact.messages.success'));
      form.resetFields();
      onSuccess(newContact);
    } catch (error) {
      // Error handled by mutation hook
    }
  };

  return (
    <Modal
      title={t('createContact.title')}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={createContact.isPending}
      okText={t('createContact.okText')}
      cancelText={t('createContact.cancelText')}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          name="first_name"
          label={t('createContact.fields.firstName.label')}
          rules={[{ required: true, message: t('createContact.fields.firstName.required') }]}
        >
          <Input placeholder={t('createContact.fields.firstName.placeholder')} />
        </Form.Item>

        <Form.Item
          name="last_name"
          label={t('createContact.fields.lastName.label')}
          rules={[{ required: true, message: t('createContact.fields.lastName.required') }]}
        >
          <Input placeholder={t('createContact.fields.lastName.placeholder')} />
        </Form.Item>

        <Form.Item
          name="email"
          label={t('createContact.fields.email.label')}
          rules={[{ type: 'email', message: t('createContact.fields.email.invalid') }]}
        >
          <Input placeholder={t('createContact.fields.email.placeholder')} />
        </Form.Item>

        <Form.Item name="phone" label={t('createContact.fields.phone.label')}>
          <Input placeholder={t('createContact.fields.phone.placeholder')} />
        </Form.Item>

        <Form.Item name="address" label={t('createContact.fields.address.label')}>
          <TextArea rows={3} placeholder={t('createContact.fields.address.placeholder')} />
        </Form.Item>

        <Form.Item name="tags" label={t('createContact.fields.tags.label')}>
          <Select
            mode="tags"
            placeholder={t('createContact.fields.tags.placeholder')}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}