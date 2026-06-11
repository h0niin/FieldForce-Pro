import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, InputNumber, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { useServiceCatalogItem, useCreateServiceCatalog, useUpdateServiceCatalog } from '@/hooks/use-services-catalog';
import PageHeader from '@/components/common/PageHeader';
import CustomFieldsSection from '@/components/common/CustomFieldsSection';

const { TextArea } = Input;

export default function ServiceFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: service, isLoading } = useServiceCatalogItem(id!);
  const createService = useCreateServiceCatalog();
  const updateService = useUpdateServiceCatalog();

  useEffect(() => {
    if (service) {
      form.setFieldsValue({
        name: service.name,
        description: service.description,
        default_price: service.default_price,
        tax_rate: service.tax_rate,
        duration_minutes: service.duration_minutes,
        category: service.category,
        is_active: service.is_active,
        custom_fields: service.custom_fields || {},
      });
    }
  }, [service, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (isEdit) {
        await updateService.mutateAsync({ id: id!, ...values });
      } else {
        await createService.mutateAsync(values as Record<string, unknown> & { name: string });
      }
      navigate('/catalog/services');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('serviceForm.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('serviceForm.editService') : t('serviceForm.createService')}
        onBack={() => navigate('/catalog/services')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ is_active: true }}
        >
          <Form.Item
            name="name"
            label={t('serviceForm.serviceName')}
            rules={[{ required: true, message: t('serviceForm.pleaseEnterServiceName') }]}
          >
            <Input placeholder={t('serviceForm.placeholderName')} />
          </Form.Item>

          <Form.Item name="description" label={t('serviceForm.description')}>
            <TextArea rows={4} placeholder={t('serviceForm.placeholderDescription')} />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="default_price" label={t('serviceForm.defaultPrice')} style={{ flex: 1 }}>
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                prefix="$"
                placeholder={t('serviceForm.placeholderPrice')}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item name="tax_rate" label={t('serviceForm.taxRate')} style={{ flex: 1 }}>
              <InputNumber
                min={0}
                max={100}
                step={0.01}
                precision={2}
                placeholder={t('serviceForm.placeholderPrice')}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Space>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="duration_minutes" label={t('serviceForm.duration')} style={{ flex: 1 }}>
              <InputNumber min={0} step={15} placeholder={t('serviceForm.placeholderDuration')} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="category" label={t('serviceForm.category')} style={{ flex: 1 }}>
              <Select placeholder={t('serviceForm.selectCategory')} allowClear>
                <Select.Option value="Installation">{t('serviceForm.categories.installation')}</Select.Option>
                <Select.Option value="Repair">{t('serviceForm.categories.repair')}</Select.Option>
                <Select.Option value="Maintenance">{t('serviceForm.categories.maintenance')}</Select.Option>
                <Select.Option value="Inspection">{t('serviceForm.categories.inspection')}</Select.Option>
                <Select.Option value="Consultation">{t('serviceForm.categories.consultation')}</Select.Option>
                <Select.Option value="Other">{t('serviceForm.categories.other')}</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item name="is_active" label={t('serviceForm.active')} valuePropName="checked">
            <Switch />
          </Form.Item>

          <CustomFieldsSection moduleName="Services Catalog" />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createService.isPending || updateService.isPending}
              >
                {isEdit ? t('serviceForm.update') : t('serviceForm.create')}
              </Button>
              <Button onClick={() => navigate('/catalog/services')}>{t('serviceForm.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}