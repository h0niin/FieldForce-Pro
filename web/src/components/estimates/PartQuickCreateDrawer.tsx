import { useState, useEffect, useMemo, useRef } from 'react';
import { Drawer, Form, Input, InputNumber, Select, Switch, Button, Space, Divider } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCreatePartsCatalog, useUpdatePartsCatalog, useAllPartsCatalog } from '@/hooks/use-parts-catalog';
import type { PartsCatalogItem } from '@/types/models.types';

const { TextArea } = Input;

interface Props {
  open: boolean;
  initialName?: string;
  /** When provided, drawer opens in edit mode pre-filled with this item */
  editItem?: PartsCatalogItem | null;
  onClose: () => void;
  onSuccess: (part: PartsCatalogItem) => void;
}

export default function PartQuickCreateDrawer({
  open,
  initialName,
  editItem,
  onClose,
  onSuccess,
}: Props) {
  const [form] = Form.useForm();
  const isEdit = !!editItem;

  const createPart = useCreatePartsCatalog();
  const updatePart = useUpdatePartsCatalog();

  // Category dropdown state
  const { data: allParts = [] } = useAllPartsCatalog();
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const categoryInputRef = useRef<any>(null);

  const existingCategories = useMemo(() => {
    const set = new Set<string>();
    allParts.forEach((p) => p.category && set.add(p.category));
    return [...set].sort();
  }, [allParts]);

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
          sku: editItem.sku,
          description: editItem.description,
          unit_price: editItem.unit_price,
          supplier: editItem.supplier,
          stock_qty: editItem.stock_qty,
          reorder_level: editItem.reorder_level,
          category: editItem.category,
          is_active: editItem.is_active,
        });
      } else {
        form.setFieldsValue({ name: initialName || '', is_active: true, stock_qty: 0, reorder_level: 0 });
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
        sku: values.sku || undefined,
        description: values.description || undefined,
        unit_price: values.unit_price ?? 0,
        supplier: values.supplier || undefined,
        stock_qty: values.stock_qty ?? 0,
        reorder_level: values.reorder_level ?? 0,
        category: values.category || undefined,
        is_active: values.is_active !== false,
      };

      let result: PartsCatalogItem;
      if (isEdit && editItem) {
        const res = await updatePart.mutateAsync({ id: editItem.id, ...payload });
        result = (res as any)?.data?.data ?? res;
      } else {
        const res = await createPart.mutateAsync(payload);
        result = (res as any)?.data?.data ?? res;
      }
      onSuccess(result);
      onClose();
    } catch {
      // error handled by hook
    }
  };

  const isPending = isEdit ? updatePart.isPending : createPart.isPending;

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
      title={isEdit ? 'Edit Part' : 'Create Part'}
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
        initialValues={{ is_active: true, unit_price: 0, stock_qty: 0, reorder_level: 0 }}
      >
        <Form.Item
          name="name"
          label="Part Name"
          rules={[{ required: true, message: 'Part name is required' }]}
        >
          <Input placeholder="e.g. Copper Pipe 1/2 inch" />
        </Form.Item>

        <Form.Item name="sku" label="SKU">
          <Input placeholder="e.g. CP-12-001" />
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

        <Form.Item name="description" label="Description">
          <TextArea rows={2} placeholder="Part description..." />
        </Form.Item>

        <Form.Item name="unit_price" label="Unit Price (₹)">
          <InputNumber min={0} step={0.01} prefix="₹" style={{ width: '100%' }} precision={2} />
        </Form.Item>

        <Form.Item name="supplier" label="Supplier">
          <Input placeholder="e.g. ABC Supplies Co." />
        </Form.Item>

        <Form.Item name="stock_qty" label="Stock Quantity">
          <InputNumber min={0} step={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="reorder_level" label="Reorder Level">
          <InputNumber min={0} step={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="is_active" label="Active" valuePropName="checked">
          <Switch defaultChecked />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
