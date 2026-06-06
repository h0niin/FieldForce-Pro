import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTemplate, useCreateTemplate, useUpdateTemplate } from '@/hooks/use-templates';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function TemplateFormPage() {
  const { t } = useTranslation();
  const TEMPLATE_TYPES = [
    { value: 'invoice', label: t('templateForm.types.invoice') },
    { value: 'estimate', label: t('templateForm.types.estimate') },
    { value: 'email', label: t('templateForm.types.email') },
    { value: 'report', label: t('templateForm.types.report') },
    { value: 'job_sheet', label: t('templateForm.types.jobSheet') },
    { value: 'work_order', label: t('templateForm.types.workOrder') },
    { value: 'contract', label: t('templateForm.types.contract') },
  ];

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: template, isLoading } = useTemplate(id!);
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();

  useEffect(() => {
    if (template) {
      form.setFieldsValue({
        type: template.type,
        name: template.name,
        content: template.content,
        is_default: template.is_default,
      });
    }
  }, [template, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (isEdit) {
        await updateTemplate.mutateAsync({ id: id!, ...values });
      } else {
        await createTemplate.mutateAsync(values as never);
      }
      navigate('/customization/templates');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('templateForm.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('templateForm.editTemplate') : t('templateForm.createTemplate')}
        onBack={() => navigate('/customization/templates')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ is_default: false }}
        >
          <Space size="large" style={{ display: 'flex' }}>
            <Form.Item
              name="type"
              label={t('templateForm.fields.type')}
              style={{ flex: 1 }}
              rules={[{ required: true, message: t('templateForm.rules.selectType') }]}
            >
              <Select
                placeholder={t('templateForm.placeholders.selectType')}
                options={TEMPLATE_TYPES}
              />
            </Form.Item>
            <Form.Item
              name="name"
              label={t('templateForm.fields.name')}
              style={{ flex: 1 }}
              rules={[{ required: true, message: t('templateForm.rules.enterName') }]}
            >
              <Input placeholder={t('templateForm.placeholders.name')} />
            </Form.Item>
          </Space>

          <Form.Item
            name="content"
            label={t('templateForm.fields.content')}
            rules={[{ required: true, message: t('templateForm.rules.enterContent') }]}
            extra={t('templateForm.extra.contentVariables')}
          >
            <TextArea
              rows={12}
              placeholder={t('templateForm.placeholders.content')}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item name="is_default" label={t('templateForm.fields.isDefault')} valuePropName="checked">
            <Switch checkedChildren={t('templateForm.common.default')} unCheckedChildren={t('templateForm.common.notDefault')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createTemplate.isPending || updateTemplate.isPending}
              >
                {isEdit ? t('templateForm.actions.update') : t('templateForm.actions.create')}
              </Button>
              <Button onClick={() => navigate('/customization/templates')}>{t('templateForm.actions.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}