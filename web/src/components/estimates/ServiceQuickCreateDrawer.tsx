import { useState, useEffect, useMemo, useRef } from 'react';
import { Drawer, Form, Input, InputNumber, Select, Switch, Button, Space, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCreateServiceCatalog, useUpdateServiceCatalog, useAllServicesCatalog } from '@/hooks/use-services-catalog';
import type { ServiceCatalogItem } from '@/types/models.types';

const { TextArea } = Input;

interface Props {
  open: boolean;
  initialName?: string;
  /** When provided, drawer opens in edit mode pre-filled with this item */
  editItem?: ServiceCatalogItem | null;
  onClose: () => void;
  onSuccess: (service: ServiceCatalogItem) => void;
}

export default function ServiceQuickCreateDrawer({
  open,
  initialName,
  editItem,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const isEdit = !!editItem;

  const createService = useCreateServiceCatalog();
  const updateService = useUpdateServiceCatalog();

  // Category dropdown state
  const { data: allServices = [] } = useAllServicesCatalog();
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const categoryInputRef = useRef<any>(null);

  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    allServices.forEach((s) => s.category && set.add(s.category));
    return [...set].sort();
  }, [allServices]);

  const categoryOptions = useMemo(() => {
    const set = new Set([...existingCategories, ...customCategories]);
    return [...set].sort().map((c) => ({ value: c, label: c }));
  }, [existingCategories, customCategories]);

  // Reset / pre-fill when drawer opens
  useEffect(() => {
    if (open) {
      form.resetFields();
      setAddingCategory(false);
      setNewCategoryName('');
      if (editItem) {
        form.setFieldsValue({
          name: editItem.name,
          description: editItem.description,
          default_price: editItem.default_price,
          tax_rate: editItem.tax_rate,
          duration_minutes: editItem.duration_minutes,
          category: editItem.category,
          is_active: editItem.is_active,
        });
      } else {
        form.setFieldsValue({ name: initialName || '', is_active: true });
      }
    }
  }, [open, initialName, editItem, form]);

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    setCustomCategories((prev) => [...new Set([...prev, trimmed])]);
    form.setFieldValue('category', trimmed);
    setNewCategoryName('');
    setAddingCategory(false);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        default_price: values.default_price ?? 0,
        tax_rate: values.tax_rate ?? 0,
        duration_minutes: values.duration_minutes || undefined,
        category: values.category || undefined,
        is_active: values.is_active !== false,
      };

      let result: ServiceCatalogItem;
      if (isEdit && editItem) {
        const res = await updateService.mutateAsync({ id: editItem.id, ...payload });
        result = (res as any)?.data?.data ?? res;
      } else {
        const res = await createService.mutateAsync(payload);
        result = (res as any)?.data?.data ?? res;
      }
      onSuccess(result);
      onClose();
    } catch {
      // error handled by hook
    }
  };

  const isPending = isEdit ? updateService.isPending : createService.isPending;

  const footer = (
    <Space>
      <Button onClick={onClose}>Cancel</Button>
      <Button type="primary" loading={isPending} onClick={() => form.submit()}>
        Save
      </Button>
    </Space>
  );

  return (
    <Drawer
      title={isEdit ? 'Edit Service' : 'Create Service'}
      open={open}
      onClose={onClose}
      width={480}
      footer={footer}
      destroyOnClose
      zIndex={1020}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
        initialValues={{ is_active: true, default_price: 0, tax_rate: 0 }}
      >
        <Form.Item
          name="name"
          label="Service Name"
          rules={[{ required: true, message: 'Service name is required' }]}
        >
          <Input placeholder="e.g. AC Installation" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Service description..." />
        </Form.Item>

        <Form.Item name="default_price" label="Default Price (₹)">
          <InputNumber min={0} step={0.01} prefix="₹" style={{ width: '100%' }} precision={2} />
        </Form.Item>

        <Form.Item name="tax_rate" label="Tax Rate (%)">
          <InputNumber min={0} max={100} step={0.5} suffix="%" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="duration_minutes" label="Duration (minutes)">
          <InputNumber min={0} step={15} style={{ width: '100%' }} placeholder="e.g. 60" />
        </Form.Item>

        <Form.Item name="category" label="Category">
          <Select
            placeholder="Select or type category"
            allowClear
            showSearch
            optionFilterProp="label"
            options={categoryOptions}
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: '4px 0' }} />
                {addingCategory ? (
                  <div style={{ padding: '4px 8px', display: 'flex', gap: 8 }}>
                    <Input
                      ref={categoryInputRef}
                      size="small"
                      placeholder="New category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onPressEnter={handleAddCategory}
                      autoFocus
                      style={{ flex: 1 }}
                    />
                    <Button size="small" type="primary" onClick={handleAddCategory}>
                      Add
                    </Button>
                    <Button
                      size="small"
                      onClick={() => { setAddingCategory(false); setNewCategoryName(''); }}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setAddingCategory(true);
                      setTimeout(() => categoryInputRef.current?.focus(), 50);
                    }}
                    style={{ width: '100%', textAlign: 'left', padding: '4px 12px' }}
                  >
                    + Add Category
                  </Button>
                )}
              </>
            )}
          />
        </Form.Item>

        <Form.Item name="is_active" label="Active" valuePropName="checked">
          <Switch defaultChecked />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
