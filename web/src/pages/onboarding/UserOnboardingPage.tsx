import { useEffect } from 'react';
import { Card, Form, Input, Button, Space, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, CheckOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useCompleteOnboarding } from '@/hooks/use-magic-links';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const schema = z
  .object({
    first_name: z.string().trim().min(1, 'first_name_required').max(100),
    last_name: z.string().trim().min(1, 'last_name_required').max(100),
    phone: z.string().trim().max(30).optional(),
    new_password: z
      .string()
      .min(8, 'password_min_length')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
        'password_requirements',
      ),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'passwords_match',
    path: ['confirm_password'],
  });

type FormValues = z.infer<typeof schema>;

export default function UserOnboardingPage() {
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
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      phone: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    completeOnboarding.mutate(
      {
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone || undefined,
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
            {t('userOnboarding.welcomeTitle')}
          </Title>
          <Text type="secondary">{t('userOnboarding.subtitle')}</Text>
        </Space>

        <Alert
          message={t('userOnboarding.invitationMessage')}
          description={t('userOnboarding.invitationDescription')}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label={t('userOnboarding.firstName')}
            validateStatus={errors.first_name ? 'error' : ''}
            help={errors.first_name ? t(`userOnboarding.${errors.first_name.message}`) : ''}
          >
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <Input {...field} prefix={<UserOutlined />} placeholder={t('userOnboarding.firstNamePlaceholder')} size="large" />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('userOnboarding.lastName')}
            validateStatus={errors.last_name ? 'error' : ''}
            help={errors.last_name ? t(`userOnboarding.${errors.last_name.message}`) : ''}
          >
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <Input {...field} prefix={<UserOutlined />} placeholder={t('userOnboarding.lastNamePlaceholder')} size="large" />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('userOnboarding.phoneOptional')}
            validateStatus={errors.phone ? 'error' : ''}
            help={errors.phone?.message}
          >
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <Input {...field} prefix={<PhoneOutlined />} placeholder="+1 555 000 0000" size="large" />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('userOnboarding.password')}
            validateStatus={errors.new_password ? 'error' : ''}
            help={errors.new_password ? t(`userOnboarding.${errors.new_password.message}`) : ''}
          >
            <Controller
              name="new_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder={t('userOnboarding.passwordPlaceholder')}
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('userOnboarding.confirmPassword')}
            validateStatus={errors.confirm_password ? 'error' : ''}
            help={errors.confirm_password ? t(`userOnboarding.${errors.confirm_password.message}`) : ''}
          >
            <Controller
              name="confirm_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder={t('userOnboarding.confirmPasswordPlaceholder')}
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
              {t('userOnboarding.activateAccount')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}