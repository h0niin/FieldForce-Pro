import { useEffect } from 'react';
import { Card, Form, Input, Button, Space, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined, CheckOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCompleteOnboarding } from '@/hooks/use-magic-links';
import { useAuthStore } from '@/store/auth.store';

const { Title, Text } = Typography;

const schema = z
  .object({
    first_name: z.string().trim().min(1, 'onboarding.errors.firstNameRequired').max(100),
    last_name: z.string().trim().min(1, 'onboarding.errors.lastNameRequired').max(100),
    new_password: z
      .string()
      .min(8, 'onboarding.errors.passwordMinLength')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
        'onboarding.errors.passwordComplexity',
      ),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'onboarding.errors.passwordsDoNotMatch',
    path: ['confirm_password'],
  });

type FormValues = z.infer<typeof schema>;

export default function OnboardingSetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const completeOnboarding = useCompleteOnboarding();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  // If onboarding is already done, go to dashboard
  useEffect(() => {
    if (user?.onboarding_completed) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    completeOnboarding.mutate(
      {
        first_name: data.first_name,
        last_name: data.last_name,
        new_password: data.new_password,
      },
      {
        onSuccess: () => {
          if (user) {
            setUser({ ...user, first_name: data.first_name, last_name: data.last_name });
          }
          navigate('/dashboard', { replace: true });
        },
      },
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
        padding: 24,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 480 }}>
        <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }} size={4}>
          <Title level={3} style={{ margin: 0 }}>
            {t('onboarding.welcome')}
          </Title>
          <Text type="secondary">{t('onboarding.setupInstruction')}</Text>
        </Space>

        <Alert
          message={t('onboarding.alertMessage')}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label={t('onboarding.firstName')}
            validateStatus={errors.first_name ? 'error' : ''}
            help={errors.first_name?.message ? t(errors.first_name.message) : undefined}
          >
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <Input {...field} prefix={<UserOutlined />} placeholder={t('onboarding.firstNamePlaceholder')} size="large" />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('onboarding.lastName')}
            validateStatus={errors.last_name ? 'error' : ''}
            help={errors.last_name?.message ? t(errors.last_name.message) : undefined}
          >
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <Input {...field} prefix={<UserOutlined />} placeholder={t('onboarding.lastNamePlaceholder')} size="large" />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('onboarding.newPassword')}
            validateStatus={errors.new_password ? 'error' : ''}
            help={errors.new_password?.message ? t(errors.new_password.message) : undefined}
          >
            <Controller
              name="new_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder={t('onboarding.passwordPlaceholder')}
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('onboarding.confirmPassword')}
            validateStatus={errors.confirm_password ? 'error' : ''}
            help={errors.confirm_password?.message ? t(errors.confirm_password.message) : undefined}
          >
            <Controller
              name="confirm_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder={t('onboarding.confirmPasswordPlaceholder')}
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={completeOnboarding.isPending}
              size="large"
              icon={<CheckOutlined />}
              block
            >
              {t('onboarding.completeSetup')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}