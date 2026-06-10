import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Drawer, Form, Input, Select, Button, Space, Divider, Checkbox, Typography, Tag,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCreateCompany, useAllCompanies } from '@/hooks/use-companies';
import { useCompanyTypes, useCreateCompanyType } from '@/hooks/use-company-types';
import AddressPickerField from './AddressPickerField';
import type { Company } from '@/types/models.types';

const { TextArea } = Input;
const { Text } = Typography;

const STATIC_TYPES = [
  'Analyst', 'Competitor', 'Customer', 'Distributor', 'Integrator',
  'Investor', 'Other', 'Partner', 'Press', 'Prospect', 'Reseller',
  'Supplier', 'Vendor',
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (company: Company) => void;
}

export default function CompanyQuickCreateDrawer({ open, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const [showStep2, setShowStep2] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [addingType, setAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const newTypeInputRef = useRef<any>(null);

  const createCompany = useCreateCompany();
  const createCompanyType = useCreateCompanyType();
  const { data: customTypes = [] } = useCompanyTypes();
  const { data: allCompanies = [] } = useAllCompanies();

  const billingAddress = Form.useWatch('billing_address', form);

  // Keep service_address in sync when same-as is checked
  useEffect(() => {
    if (sameAsBilling) {
      form.setFieldValue('service_address', billingAddress || '');
    }
  }, [sameAsBilling, billingAddress, form]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      form.resetFields();
      setShowStep2(false);
      setSameAsBilling(false);
      setAddingType(false);
      setNewTypeName('');
    }
  }, [open, form]);

  // All unique tags from existing companies
  const existingTags = useMemo(() => {
    const tagSet = new Set<string>();
    (allCompanies ?? []).forEach((c) => (c.tags ?? []).forEach((t) => tagSet.add(t)));
    return [...tagSet].map((t) => ({ value: t, label: t }));
  }, [allCompanies]);

  // Merged type options (static + custom, deduplicated)
  const typeOptions = useMemo(() => {
    const customNames = customTypes.map((t) => t.name);
    const allNames = [...new Set([...STATIC_TYPES, ...customNames])].sort();
    return allNames.map((name) => ({ value: name, label: name }));
  }, [customTypes]);

  const handleAddType = async () => {
    const trimmed = newTypeName.trim();
    if (!trimmed) return;
    const res = await createCompanyType.mutateAsync({ name: trimmed });
    const created = (res as any)?.data?.data ?? { name: trimmed };
    form.setFieldValue('company_type', created.name);
    setNewTypeName('');
    setAddingType(false);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        last_name: values.last_name || '',
      };
      const res = await createCompany.mutateAsync(payload);
      const created: Company = (res as any)?.data?.data ?? res;
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
          loading={createCompany.isPending}
          onClick={() => form.submit()}
        >
          Create
        </Button>
      </Space>
    </div>
  );

  return (
    <Drawer
      title="Create Company"
      open={open}
      onClose={onClose}
      width={540}
      footer={footer}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} autoComplete="off">
        {/* ── Step 1 ── */}
        <Form.Item
          name="name"
          label="Company Name"
          rules={[{ required: true, message: 'Company name is required' }]}
        >
          <Input placeholder="e.g. Acme Industries" />
        </Form.Item>

        <Form.Item name="company_type" label="Company Type">
          <Select
            placeholder="— None —"
            allowClear
            showSearch
            options={typeOptions}
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                {addingType ? (
                  <div style={{ padding: '4px 8px', display: 'flex', gap: 8 }}>
                    <Input
                      ref={newTypeInputRef}
                      size="small"
                      placeholder="New type name"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      onPressEnter={handleAddType}
                      autoFocus
                      style={{ flex: 1 }}
                    />
                    <Button size="small" type="primary" onClick={handleAddType} loading={createCompanyType.isPending}>
                      Add
                    </Button>
                    <Button size="small" onClick={() => { setAddingType(false); setNewTypeName(''); }}>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => { setAddingType(true); setTimeout(() => newTypeInputRef.current?.focus(), 50); }}
                    style={{ width: '100%', textAlign: 'left', padding: '4px 12px' }}
                  >
                    + Add Type
                  </Button>
                )}
              </>
            )}
          />
        </Form.Item>

        <Form.Item name="phone" label="Phone">
          <Input placeholder="+1 (555) 000-0000" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Enter a valid email' }]}
        >
          <Input placeholder="info@company.com" type="email" />
        </Form.Item>

        {/* ── Step 2 (expanded) ── */}
        {showStep2 && (
          <>
            <Divider orientation="left" style={{ fontSize: 13, color: '#6b7280' }}>
              Additional Details
            </Divider>

            <Form.Item name="billing_address" label="Billing Address">
              <AddressPickerField placeholder="Search billing address..." />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  <span>Service Address</span>
                  <Checkbox
                    checked={sameAsBilling}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSameAsBilling(checked);
                      if (checked) {
                        form.setFieldValue('service_address', form.getFieldValue('billing_address') || '');
                      } else {
                        form.setFieldValue('service_address', '');
                      }
                    }}
                    style={{ fontWeight: 400, fontSize: 13 }}
                  >
                    Same as billing address
                  </Checkbox>
                </Space>
              }
              name="service_address"
            >
              <AddressPickerField
                placeholder="Search service address..."
                disabled={sameAsBilling}
              />
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

            <Form.Item name="notes" label="Notes">
              <TextArea rows={3} placeholder="Internal notes about this company..." />
            </Form.Item>

            <Divider orientation="left" style={{ fontSize: 13, color: '#6b7280' }}>
              Contacts
            </Divider>
            <div
              style={{
                padding: '12px 16px',
                background: '#f9fafb',
                borderRadius: 6,
                border: '1px dashed #d1d5db',
                textAlign: 'center',
              }}
            >
              <Text type="secondary" style={{ fontSize: 13 }}>
                No contacts yet — save this company, then add contacts from the main form.
              </Text>
            </div>
          </>
        )}
      </Form>
    </Drawer>
  );
}
