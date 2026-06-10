import { useState, useEffect, useMemo } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Divider } from 'antd';
import { useCreateContact } from '@/hooks/use-contacts';
import { useAllCompanies } from '@/hooks/use-companies';
import { useAllContacts } from '@/hooks/use-contacts';
import type { Contact } from '@/types/models.types';

const { TextArea } = Input;

const SALUTATIONS = ['-None-', 'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (contact: Contact) => void;
  defaultCompanyId?: string;
}

export default function ContactQuickCreateDrawer({
  open, onClose, onSuccess, defaultCompanyId,
}: Props) {
  const [form] = Form.useForm();
  const [showStep2, setShowStep2] = useState(false);

  const createContact = useCreateContact();
  const { data: companies = [] } = useAllCompanies();
  const { data: allContacts = [] } = useAllContacts();

  // Pre-fill company when drawer opens
  useEffect(() => {
    if (open && defaultCompanyId) {
      form.setFieldValue('company_id', defaultCompanyId);
    }
  }, [open, defaultCompanyId, form]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setShowStep2(false);
    }
  }, [open, form]);

  // All unique tags from existing contacts
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    (allContacts ?? []).forEach((c) => (c.tags ?? []).forEach((t) => tagSet.add(t)));
    return [...tagSet].map((t) => ({ value: t, label: t }));
  }, [allContacts]);

  const handleSubmit = async (values: any) => {
    try {
      const payload = { ...values };
      if (!payload.last_name) payload.last_name = '';
      if (payload.salutation === '-None-') delete payload.salutation;
      const res = await createContact.mutateAsync(payload);
      const created: Contact = (res as any)?.data?.data ?? res;
      onSuccess(created);
      onClose();
    } catch {
      // handled by hook
    }
  };

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Button
        type="link"
        onClick={() => setShowStep2((s) => !s)}
        style={{ padding: 0 }}
      >
        {showStep2 ? '↑ Less Details' : '↓ More Details'}
      </Button>
      <Space>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="primary"
          loading={createContact.isPending}
          onClick={() => form.submit()}
        >
          Create
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      title="Create Contact"
      open={open}
      onClose={onClose}
      width={520}
      footer={footer}
      destroyOnClose
      zIndex={1010}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        {/* ── Step 1 ── */}
        <Form.Item name="salutation" label="Salutation">
          <Select placeholder="— None —" allowClear>
            {SALUTATIONS.map((s) => (
              <Select.Option key={s} value={s}>{s}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="first_name"
          label="First Name"
          rules={[{ required: true, message: 'First name is required' }]}
        >
          <Input placeholder="John" />
        </Form.Item>

        <Form.Item name="last_name" label="Last Name">
          <Input placeholder="Doe" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Enter a valid email' }]}
        >
          <Input placeholder="john.doe@example.com" type="email" />
        </Form.Item>

        <Form.Item name="phone" label="Phone">
          <Input placeholder="+1 (555) 000-0000" />
        </Form.Item>

        <Form.Item name="mobile" label="Mobile">
          <Input placeholder="+1 (555) 000-0001" />
        </Form.Item>

        <Form.Item name="company_id" label="Company">
          <Select
            placeholder="Search company..."
            showSearch
            allowClear
            optionFilterProp="label"
            options={(companies ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>

        {/* ── Step 2 (expanded) ── */}
        {showStep2 && (
          <>
            <Divider orientation="left" style={{ fontSize: 13, color: '#6b7280' }}>
              Additional Details
            </Divider>

            <Form.Item
              name="secondary_email"
              label="Secondary Email"
              rules={[{ type: 'email', message: 'Enter a valid email' }]}
            >
              <Input placeholder="alt@example.com" type="email" />
            </Form.Item>

            <Form.Item name="department" label="Department">
              <Input placeholder="e.g. Engineering" />
            </Form.Item>

            <Form.Item name="title" label="Title / Job Role">
              <Input placeholder="e.g. Senior Engineer" />
            </Form.Item>

            <Form.Item name="tags" label="Tags">
              <Select
                mode="tags"
                placeholder="Add tags..."
                options={existingTags}
                style={{ width: '100%' }}
                tokenSeparators={[',']}
              />
            </Form.Item>

            <Form.Item name="notes" label="Notes" style={{ marginBottom: 0 }}>
              <TextArea rows={3} placeholder="Internal notes about this contact..." />
            </Form.Item>
          </>
        )}
      </Form>
    </Drawer>
  );
}
