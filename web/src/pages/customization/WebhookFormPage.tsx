import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Skeleton, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { useWebhook, useCreateWebhook, useUpdateWebhook } from '@/hooks/use-webhooks';
import PageHeader from '@/components/common/PageHeader';

const { TextArea } = Input;

export default function WebhookFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data: webhook, isLoading } = useWebhook(id!);
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();

  useEffect(() => {
    if (webhook) {
      form.setFieldsValue({
        name: webhook.name,
        url: webhook.url,
        events: typeof webhook.events === 'string' ? webhook.events : JSON.stringify(webhook.events, null, 2),
        secret: webhook.secret,
        is_active: webhook.is_active,
      });
    }
  }, [webhook, form]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      events: values.events ? JSON.parse(values.events as string) : [],
    };

    try {
      if (isEdit) {
        await updateWebhook.mutateAsync({ id: id!, ...payload });
      } else {
        await createWebhook.mutateAsync(payload as never);
      }
      navigate('/customization/webhooks');
    } catch {
      // Error handled by mutation hooks
    }
  };

  if (isEdit && isLoading) {
    return (
      <div>
        <PageHeader title={t('webhooks.loading')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('webhooks.editWebhook') : t('webhooks.createWebhook')}
        onBack={() => navigate('/customization/webhooks')}
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          style={{ maxWidth: 800 }}
          initialValues={{ is_active: true, events: '[]' }}
        >
          <Form.Item
            name="name"
            label={t('webhooks.name')}
            rules={[{ required: true, message: t('webhooks.pleaseEnterName') }]}
          >
            <Input placeholder={t('webhooks.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="url"
            label={t('webhooks.webhookUrl')}
            rules={[
              { required: true, message: t('webhooks.pleaseEnterWebhookUrl') },
              { type: 'url', message: t('webhooks.pleaseEnterValidUrl') },
            ]}
          >
            <Input placeholder={t('webhooks.urlPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="events"
            label={t('webhooks.eventsJson')}
            rules={[
              { required: true, message: t('webhooks.pleaseEnterEvents') },
              {
                validator: (_, value) => {
                  try {
                    if (value) {
                      const parsed = JSON.parse(value);
                      if (!Array.isArray(parsed)) {
                        return Promise.reject(new Error(t('webhooks.eventsMustBeArray')));
                      }
                    }
                    return Promise.resolve();
                  } catch {
                    return Promise.reject(new Error(t('webhooks.invalidJsonFormat')));
                  }
                },
              },
            ]}
            extra={t('webhooks.eventsHelp')}
          >
            <TextArea
              rows={6}
              placeholder={t('webhooks.eventsPlaceholder')}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="secret"
            label={t('webhooks.secretKey')}
            extra={t('webhooks.secretHelp')}
          >
            <Input.Password placeholder={t('webhooks.secretPlaceholder')} />
          </Form.Item>

          <Form.Item name="is_active" label={t('webhooks.active')} valuePropName="checked">
            <Switch checkedChildren={t('webhooks.active')} unCheckedChildren={t('webhooks.inactive')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createWebhook.isPending || updateWebhook.isPending}
              >
                {isEdit ? t('webhooks.update') : t('webhooks.create')}
              </Button>
              <Button onClick={() => navigate('/customization/webhooks')}>{t('webhooks.cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}