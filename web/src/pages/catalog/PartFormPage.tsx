import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, InputNumber, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { usePartsCatalogItem, useCreatePartsCatalog, useUpdatePartsCatalog } from '@/hooks/use-parts-catalog';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function PartFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: part, isLoading } = usePartsCatalogItem(id!);
  const createPart = useCreatePartsCatalog();
  const updatePart = useUpdatePartsCatalog();

  useEffect(() => {
    if (part) {
      form.setFieldsValue({
        name: part.name,
        sku: part.sku,
        description: part.description,
        unit_price: part.unit_price,
        stock_qty: part.stock_qty,
        reorder_level: part.reorder_level,
        supplier: part.supplier,
        category: part.category,
        is_active: part.is_active,
      });
    }
  }, [part, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (isEdit) {
        await updatePart.mutateAsync({ id: id!, ...values });
      } else {
        await createPart.mutateAsync(values as Record<string, unknown> & { name: string });
      }
      navigate('/catalog/parts');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('partForm.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('partForm.editPart') : t('partForm.createPart')}
        onBack={() => navigate('/catalog/parts')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ is_active: true, stock_qty: 0, reorder_level: 0 }}
        >
          <Form.Item
            name="name"
            label={t('partForm.partName')}
            rules={[{ required: true, message: t('partForm.pleaseEnterPartName') }]}
          >
            <Input placeholder={t('partForm.placeholderName')} />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="sku" label={t('partForm.sku')} style={{ flex: 1 }}>
              <Input placeholder={t('partForm.placeholderSku')} />
            </Form.Item>
            <Form.Item name="category" label={t('partForm.category')} style={{ flex: 1 }}>
              <Select placeholder={t('partForm.selectCategory')} allowClear>
                <Select.Option value="Electrical">{t('partForm.categories.electrical')}</Select.Option>
                <Select.Option value="Mechanical">{t('partForm.categories.mechanical')}</Select.Option>
                <Select.Option value="Plumbing">{t('partForm.categories.plumbing')}</Select.Option>
                <Select.Option value="HVAC">{t('partForm.categories.hvac')}</Select.Option>
                <Select.Option value="Filters">{t('partForm.categories.filters')}</Select.Option>
                <Select.Option value="Hardware">{t('partForm.categories.hardware')}</Select.Option>
                <Select.Option value="Safety">{t('partForm.categories.safety')}</Select.Option>
                <Select.Option value="Other">{t('partForm.categories.other')}</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item name="description" label={t('partForm.description')}>
            <TextArea rows={4} placeholder={t('partForm.placeholderDescription')} />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="unit_price" label={t('partForm.unitPrice')} style={{ flex: 1 }}>
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                prefix="$"
                placeholder="0.00"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item name="supplier" label={t('partForm.supplier')} style={{ flex: 1 }}>
              <Input placeholder={t('partForm.placeholderSupplier')} />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="stock_qty" label={t('partForm.stockQuantity')} style={{ flex: 1 }}>
              <InputNumber min={0} step={1} placeholder="0" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="reorder_level" label={t('partForm.reorderLevel')} style={{ flex: 1 }}>
              <InputNumber min={0} step={1} placeholder="0" style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="is_active" label={t('partForm.active')} valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createPart.isPending || updatePart.isPending}
              >
                {isEdit ? t('partForm.update') : t('partForm.create')}
              </Button>
              <Button onClick={() => navigate('/catalog/parts')}>{t('partForm.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}