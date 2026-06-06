import { Form, Input, Button, Card, Switch, Spin } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { useTenant, useUpdateTenant } from '@/hooks/use-tenants';
import PageHeader from '@/components/common/PageHeader';
import { useEffect, useMemo } from 'react';

type SettingsForm = {
  name: string;
  domain?: string;
  is_active: boolean;
};

export default function GeneralSettingsPage() { 
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: tenant, isLoading } = useTenant(user?.tenant_id || '');
  const updateMutation = useUpdateTenant();

  const schema = useMemo(() => 
    z.object({
      name: z.string().min(1, t('settings.nameRequired')),
      domain: z.string().optional().or(z.literal('')),
      is_active: z.boolean(),
    }),
    [t]
  );

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', domain: '', is_active: true },
  });

  useEffect(() => {
    if (tenant) {
      reset({
        name: tenant.name,
        domain: tenant.domain || '',
        is_active: tenant.is_active,
      });
    }
  }, [tenant, reset]);

  const onSubmit = (data: SettingsForm) => {
    if (!tenant) return;
    updateMutation.mutate({ id: tenant.id, ...data });
  };

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  return (
    <div>
      <PageHeader title={t('settings.general')} />

      <Card style={{ maxWidth: 600 }}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label={t('settings.companyName')}
            validateStatus={errors.name ? 'error' : ''}
            help={errors.name?.message}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} />}
            />
          </Form.Item>

          <Form.Item label={t('settings.customDomain')}>
            <Controller
              name="domain"
              control={control}
              render={({ field }) => <Input {...field} placeholder={t('settings.domainPlaceholder')} />}
            />
          </Form.Item>

          <Form.Item label={t('settings.active')}>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateMutation.isPending}>
              {t('common.save')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}