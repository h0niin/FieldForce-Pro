import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { useJobSheetTemplate, useCreateJobSheetTemplate, useUpdateJobSheetTemplate } from '@/hooks/use-job-sheets';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function JobSheetTemplateFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: template, isLoading } = useJobSheetTemplate(id!);
  const createTemplate = useCreateJobSheetTemplate();
  const updateTemplate = useUpdateJobSheetTemplate();

  useEffect(() => {
    if (template) {
      form.setFieldsValue({
        name: template.name,
        description: template.description,
        category: template.category,
        is_active: template.is_active,
      });
    }
  }, [template, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
    };

    try {
      if (isEdit) {
        await updateTemplate.mutateAsync({ id: id!, ...payload });
      } else {
        await createTemplate.mutateAsync(payload as Record<string, unknown> & { name: string });
      }
      navigate('/settings/customization/job-sheets');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('jobSheetTemplate.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('jobSheetTemplate.editJobSheetTemplate') : t('jobSheetTemplate.createJobSheetTemplate')}
        onBack={() => navigate('/settings/customization/job-sheets')}
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
            label={t('jobSheetTemplate.name')}
            rules={[{ required: true, message: t('jobSheetTemplate.pleaseEnterATemplateName') }]}
          >
            <Input placeholder={t('jobSheetTemplate.placeholderName')} />
          </Form.Item>

          <Form.Item name="description" label={t('jobSheetTemplate.description')}>
            <TextArea rows={4} placeholder={t('jobSheetTemplate.placeholderDescription')} />
          </Form.Item>

          <Form.Item name="category" label={t('jobSheetTemplate.category')}>
            <Select placeholder={t('jobSheetTemplate.selectCategory')} allowClear>
              <Select.Option value="Inspection">{t('jobSheetTemplate.categories.inspection')}</Select.Option>
              <Select.Option value="Maintenance">{t('jobSheetTemplate.categories.maintenance')}</Select.Option>
              <Select.Option value="Repair">{t('jobSheetTemplate.categories.repair')}</Select.Option>
              <Select.Option value="Installation">{t('jobSheetTemplate.categories.installation')}</Select.Option>
              <Select.Option value="Safety">{t('jobSheetTemplate.categories.safety')}</Select.Option>
              <Select.Option value="General">{t('jobSheetTemplate.categories.general')}</Select.Option>
              <Select.Option value="Other">{t('jobSheetTemplate.categories.other')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="is_active" label={t('jobSheetTemplate.active')} valuePropName="checked">
            <Switch checkedChildren={t('jobSheetTemplate.active')} unCheckedChildren={t('jobSheetTemplate.inactive')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createTemplate.isPending || updateTemplate.isPending}
              >
                {isEdit ? t('jobSheetTemplate.update') : t('jobSheetTemplate.create')}
              </Button>
              <Button onClick={() => navigate('/settings/customization/job-sheets')}>{t('jobSheetTemplate.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}