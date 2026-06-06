import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { useWebform, useCreateWebform, useUpdateWebform } from '@/hooks/use-webforms';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function WebformFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: webform, isLoading } = useWebform(id!);
  const createWebform = useCreateWebform();
  const updateWebform = useUpdateWebform();

  useEffect(() => {
    if (webform) {
      form.setFieldsValue({
        name: webform.name,
        fields: typeof webform.fields === 'string' ? webform.fields : JSON.stringify(webform.fields, null, 2),
        styling: typeof webform.styling === 'string' ? webform.styling : JSON.stringify(webform.styling, null, 2),
        redirect_url: webform.redirect_url,
        is_active: webform.is_active,
      });
    }
  }, [webform, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      fields: values.fields ? JSON.parse(values.fields as string) : {},
      styling: values.styling ? JSON.parse(values.styling as string) : {},
    };

    try {
      if (isEdit) {
        await updateWebform.mutateAsync({ id: id!, ...payload });
      } else {
        await createWebform.mutateAsync(payload as never);
      }
      navigate('/webforms');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('webforms.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('webforms.editWebform') : t('webforms.createWebform')}
        onBack={() => navigate('/webforms')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ is_active: true, fields: '{}', styling: '{}' }}
        >
          <Form.Item
            name="name"
            label={t('webforms.name')}
            rules={[{ required: true, message: t('webforms.pleaseEnterName') }]}
          >
            <Input placeholder={t('webforms.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="fields"
            label={t('webforms.fieldsJson')}
            rules={[
              { required: true, message: t('webforms.pleaseEnterFields') },
              {
                validator: (_, value) => {
                  try {
                    if (value) JSON.parse(value);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error(t('webforms.invalidJson')));
                  }
                },
              },
            ]}
          >
            <TextArea
              rows={8}
              placeholder='{"email": {"type": "email", "required": true}, "message": {"type": "textarea", "required": true}}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="styling"
            label={t('webforms.stylingJson')}
            rules={[
              {
                validator: (_, value) => {
                  try {
                    if (value) JSON.parse(value);
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error(t('webforms.invalidJson')));
                  }
                },
              },
            ]}
          >
            <TextArea
              rows={6}
              placeholder='{"theme": "light", "primaryColor": "#1890ff"}'
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item name="redirect_url" label={t('webforms.redirectUrl')}>
            <Input placeholder="https://example.com/thank-you" />
          </Form.Item>

          <Form.Item name="is_active" label={t('webforms.active')} valuePropName="checked">
            <Switch checkedChildren={t('webforms.active')} unCheckedChildren={t('webforms.inactive')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createWebform.isPending || updateWebform.isPending}
              >
                {isEdit ? t('webforms.update') : t('webforms.create')}
              </Button>
              <Button onClick={() => navigate('/webforms')}>{t('webforms.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}