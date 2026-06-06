import { Form, Input, Button, Card, Typography, Result } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useResetPassword } from '@/hooks/use-auth';

const { Title, Text } = Typography;

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, 'resetPassword.errors.minLength')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
        'resetPassword.errors.complexity',
      ),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'resetPassword.errors.mismatch',
    path: ['confirm_password'],
  });

type ResetPasswordForm = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const mutation = useResetPassword();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: '', confirm_password: '' },
  });

  const onSubmit = (data: ResetPasswordForm) => {
    if (!token) return;
    mutation.mutate({ token, new_password: data.new_password });
  };

  if (!token) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-color)',
        }}
      >
        <Card style={{ width: 420 }}>
          <Result
            status="error"
            title={t('resetPassword.invalidLink.title')}
            subTitle={t('resetPassword.invalidLink.subTitle')}
            extra={<Link to="/forgot-password">{t('resetPassword.invalidLink.action')}</Link>}
          />
        </Card>
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-color)',
        }}
      >
        <Card style={{ width: 420 }}>
          <Result
            status="success"
            title={t('resetPassword.success.title')}
            subTitle={t('resetPassword.success.subTitle')}
            extra={
              <Link to="/login">
                <Button type="primary" size="large">
                  {t('resetPassword.success.action')}
                </Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
      }}
    >
      <Card style={{ width: 420, padding: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 4 }}>
            {t('resetPassword.title')}
          </Title>
          <Text type="secondary">{t('resetPassword.subtitle')}</Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label={t('resetPassword.fields.newPassword.label')}
            validateStatus={errors.new_password ? 'error' : ''}
            help={errors.new_password ? t(errors.new_password.message as any) : ''}
          >
            <Controller
              name="new_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder={t('resetPassword.fields.newPassword.placeholder')}
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('resetPassword.fields.confirmPassword.label')}
            validateStatus={errors.confirm_password ? 'error' : ''}
            help={errors.confirm_password ? t(errors.confirm_password.message as any) : ''}
          >
            <Controller
              name="confirm_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder={t('resetPassword.fields.confirmPassword.placeholder')}
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
              block
              size="large"
            >
              {t('resetPassword.submit')}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login">{t('resetPassword.backToLogin')}</Link>
        </div>
      </Card>
    </div>
  );
}