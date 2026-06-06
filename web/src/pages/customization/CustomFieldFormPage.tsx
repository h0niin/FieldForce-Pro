import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Select, InputNumber, Switch } from 'antd';
import { useCustomField, useCreateCustomField, useUpdateCustomField } from '@/hooks/use-custom-fields';
import PageHeader from '@/components/common/PageHeader';
import { useTranslation } from 'react-i18next'; // Rule 1

const { TextArea } = Input;

export default function CustomFieldFormPage() {
  const { t } = useTranslation(); // Rule 2
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const FIELD_TYPES = [
    { value: 'text', label: t('customFields.fieldTypes.text') },
    { value: 'number', label: t('customFields.fieldTypes.number') },
    { value: 'email', label: t('customFields.fieldTypes.email') },
    { value: 'phone', label: t('customFields.fieldTypes.phone') },
    { value: 'url', label: t('customFields.fieldTypes.url') },
    { value: 'date', label: t('customFields.fieldTypes.date') },
    { value: 'datetime', label: t('customFields.fieldTypes.dateTime') },
    { value: 'time', label: t('customFields.fieldTypes.time') },
    { value: 'boolean', label: t('customFields.fieldTypes.boolean') },
    { value: 'select', label: t('customFields.fieldTypes.select') },
    { value: 'multiselect', label: t('customFields.fieldTypes.multiSelect') },
    { value: 'textarea', label: t('customFields.fieldTypes.textArea') },
    { value: 'currency', label: t('customFields.fieldTypes.currency') },
    { value: 'percentage', label: t('customFields.fieldTypes.percentage') },
    { value: 'file', label: t('customFields.fieldTypes.fileUpload') },
  ];

  const MODULES = [
    { value: 'work_orders', label: t('customFields.modules.workOrders') },
    { value: 'service_requests', label: t('customFields.modules.serviceRequests') },
    { value: 'estimates', label: t('customFields.modules.estimates') },
    { value: 'invoices', label: t('customFields.modules.invoices') },
    { value: 'contacts', label: t('customFields.modules.contacts') },
    { value: 'companies', label: t('customFields.modules.companies') },
    { value: 'assets', label: t('customFields.modules.assets') },
    { value: 'service_agreements', label: t('customFields.modules.serviceAgreements') },
  ];

  const { data: customField, isLoading } = useCustomField(id!);
  const createCustomField = useCreateCustomField();
  const updateCustomField = useUpdateCustomField();

  useEffect(() => {
    if (customField) {
      form.setFieldsValue({
        module: customField.module,
        field_name: customField.field_name,
        field_type: customField.field_type,
        options: typeof customField.options === 'string' ? customField.options : JSON.stringify(customField.options, null, 2),
        is_required: customField.is_required,
        sort_order: customField.sort_order,
      });
    }
  }, [customField, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      options: values.options ? JSON.parse(values.options as string) : null,
    };

    try {
      if (isEdit) {
        await updateCustomField.mutateAsync({ id: id!, ...payload });
      } else {
        await createCustomField.mutateAsync(payload as never);
      }
      navigate('/customization/custom-fields');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('customFields.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('customFields.editCustomField') : t('customFields.createCustomField')}
        onBack={() => navigate('/customization/custom-fields')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ is_required: false, sort_order: 0 }}
        >
          <Form.Item
            name="module"
            label={t('customFields.moduleLabel')}
            rules={[{ required: true, message: t('customFields.validation.selectModule') }]}
          >
            <Select
              placeholder={t('customFields.selectModulePlaceholder')}
              options={MODULES}
            />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item
              name="field_name"
              label={t('customFields.fieldNameLabel')}
              style={{ flex: 1 }}
              rules={[{ required: true, message: t('customFields.validation.enterFieldName') }]}
            >
              <Input placeholder="e.g. customer_priority" />
            </Form.Item>
            <Form.Item
              name="field_type"
              label={t('customFields.fieldTypeLabel')}
              style={{ flex: 1 }}
              rules={[{ required: true, message: t('customFields.validation.selectFieldType') }]}
            >
              <Select
                placeholder={t('customFields.selectTypePlaceholder')}
                options={FIELD_TYPES}
              />
            </Form.Item>
          </Space>

          <Form.Item
            name="options"
            label={t('customFields.optionsLabel')}
            rules={[
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error(t('customFields.validation.invalidJson')));
                  }
                },
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder={t('customFields.optionsPlaceholder')}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item name="is_required" label={t('customFields.requiredLabel')} valuePropName="checked" style={{ flex: 1 }}>
              <Switch checkedChildren={t('customFields.requiredSwitch')} unCheckedChildren={t('customFields.optionalSwitch')} />
            </Form.Item>
            <Form.Item
              name="sort_order"
              label={t('customFields.sortOrderLabel')}
              style={{ flex: 1 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
          </Space>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createCustomField.isPending || updateCustomField.isPending}
              >
                {isEdit ? t('common.update') : t('common.create')}
              </Button>
              <Button onClick={() => navigate('/customization/custom-fields')}>{t('common.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}