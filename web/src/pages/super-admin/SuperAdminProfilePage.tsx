import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Button, Space, Alert, Row, Col,
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, MailOutlined, LockOutlined, SaveOutlined, KeyOutlined, LinkOutlined,
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import { useAuthStore } from '@/store/auth.store';
import { useChangePassword } from '@/hooks/use-auth';
import { useUpdateSuperAdminProfile, useChangeSuperAdminEmail } from '@/hooks/use-super-admin';
import { useGenerateMagicLink } from '@/hooks/use-magic-links';
import MagicLinkModal from '@/components/magic-links/MagicLinkModal';

// ── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  first_name: z.string().trim().min(1, 'First name is required').max(100),
  last_name: z.string().trim().min(1, 'Last name is required').max(100),
});

const emailSchema = z.object({
  new_email: z.string().trim().email('Enter a valid email address'),
  current_password: z.string().min(1, 'Password is required'),
});

const passwordSchema = z
  .object({
    old_password: z.string().min(1, 'Current password is required'),
    new_password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/,
        'Must contain uppercase, lowercase, number, and special character',
      ),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ProfileForm = z.infer<typeof profileSchema>;
type EmailForm = z.infer<typeof emailSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ── Profile Details Section ───────────────────────────────────────────────────

function ProfileDetailsCard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const updateProfile = useUpdateSuperAdminProfile();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { first_name: user?.first_name ?? '', last_name: user?.last_name ?? '' },
  });

  useEffect(() => {
    if (user) reset({ first_name: user.first_name, last_name: user.last_name });
  }, [user, reset]);

  const onSubmit = (data: ProfileForm) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        if (user) setUser({ ...user, first_name: data.first_name, last_name: data.last_name });
      },
    });
  };

  return (
    <Card
      title={<Space><UserOutlined /><span>{t('profile.details')}</span></Space>}
      style={{ marginBottom: 24 }}
    >
      <div style={{ maxWidth: 480 }}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('profile.firstName')}
                validateStatus={errors.first_name ? 'error' : ''}
                help={errors.first_name?.message}
              >
                <Controller
                  name="first_name"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} prefix={<UserOutlined />} placeholder={t('profile.firstNamePlaceholder')} size="large" />
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label={t('profile.lastName')}
                validateStatus={errors.last_name ? 'error' : ''}
                help={errors.last_name?.message}
              >
                <Controller
                  name="last_name"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} prefix={<UserOutlined />} placeholder={t('profile.lastNamePlaceholder')} size="large" />
                  )}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateProfile.isPending}
              size="large"
              icon={<SaveOutlined />}
            >
              {t('common.saveChanges')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Card>
  );
}

// ── Change Email Section ──────────────────────────────────────────────────────

function ChangeEmailCard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const changeEmail = useChangeSuperAdminEmail();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { new_email: '', current_password: '' },
  });

  const onSubmit = (data: EmailForm) => {
    changeEmail.mutate(data, {
      onSuccess: (res) => {
        const newEmail = res.data.data?.email ?? data.new_email;
        if (user) setUser({ ...user, email: newEmail });
        reset();
      },
    });
  };

  return (
    <Card
      title={<Space><MailOutlined /><span>{t('email.change')}</span></Space>}
      style={{ marginBottom: 24 }}
    >
      <div style={{ maxWidth: 480 }}>
        <Form.Item label={t('email.current')}>
          <Input
            value={user?.email ?? ''}
            disabled
            prefix={<MailOutlined />}
            size="large"
          />
        </Form.Item>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label={t('email.newAddress')}
            validateStatus={errors.new_email ? 'error' : ''}
            help={errors.new_email?.message}
          >
            <Controller
              name="new_email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  prefix={<MailOutlined />}
                  placeholder={t('email.newAddressPlaceholder')}
                  size="large"
                  autoComplete="off"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('email.confirmWithPassword')}
            validateStatus={errors.current_password ? 'error' : ''}
            help={errors.current_password?.message}
          >
            <Controller
              name="current_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder={t('email.passwordPlaceholder')}
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={changeEmail.isPending}
              size="large"
              icon={<MailOutlined />}
            >
              {t('email.update')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Card>
  );
}

// ── Change Password Section ───────────────────────────────────────────────────

function ChangePasswordCard() {
  const { t } = useTranslation();
  const changePasswordMutation = useChangePassword();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { old_password: '', new_password: '', confirm_password: '' },
  });

  const onSubmit = (data: PasswordForm) => {
    changePasswordMutation.mutate(
      { old_password: data.old_password, new_password: data.new_password },
      { onSuccess: () => reset() },
    );
  };

  return (
    <Card title={<Space><KeyOutlined /><span>{t('password.change')}</span></Space>}>
      <Alert
        message={t('password.warning')}
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />
      <div style={{ maxWidth: 480 }}>
        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label={t('password.current')}
            validateStatus={errors.old_password ? 'error' : ''}
            help={errors.old_password?.message}
          >
            <Controller
              name="old_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder={t('password.currentPlaceholder')}
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('password.new')}
            validateStatus={errors.new_password ? 'error' : ''}
            help={errors.new_password?.message}
          >
            <Controller
              name="new_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder={t('password.newPlaceholder')}
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item
            label={t('password.confirm')}
            validateStatus={errors.confirm_password ? 'error' : ''}
            help={errors.confirm_password?.message}
          >
            <Controller
              name="confirm_password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  prefix={<LockOutlined />}
                  placeholder={t('password.confirmPlaceholder')}
                  size="large"
                />
              )}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={changePasswordMutation.isPending}
              size="large"
              icon={<KeyOutlined />}
            >
              {t('password.change')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Card>
  );
}

// ── Super Admin Magic Link Section ───────────────────────────────────────────

function SuperAdminMagicLinkCard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const generateLink = useGenerateMagicLink();
  const [modalData, setModalData] = useState<{ link: string; expiresAt: string; purpose: string } | null>(null);

  const handleGenerate = () => {
    if (!user) return;
    generateLink.mutate(
      { target_user_id: user.id, purpose: 'super_admin_access' },
      {
        onSuccess: (res) => {
          const data = res.data.data;
          if (data) setModalData({ link: data.link, expiresAt: data.expires_at, purpose: data.purpose });
        },
      },
    );
  };

  return (
    <>
      <Card
        title={<Space><LinkOutlined /><span>{t('magicLink.title')}</span></Space>}
        style={{ marginBottom: 24 }}
      >
        <Alert
          message={t('magicLink.description')}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Button
          type="primary"
          icon={<LinkOutlined />}
          loading={generateLink.isPending}
          onClick={handleGenerate}
          size="large"
        >
          {t('magicLink.generate')}
        </Button>
      </Card>

      {modalData && (
        <MagicLinkModal
          open={!!modalData}
          onClose={() => setModalData(null)}
          link={modalData.link}
          expiresAt={modalData.expiresAt}
          purpose={modalData.purpose}
        />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SuperAdminProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/admin/tenants')}
          style={{ paddingLeft: 0 }}
        >
          {t('common.backToDashboard')}
        </Button>
      </div>

      <PageHeader
        title={t('profile.myProfile')}
        subtitle={t('profile.signedInAs', { email: user?.email ?? '' })}
      />

      <ProfileDetailsCard />
      <ChangeEmailCard />
      <ChangePasswordCard />
      <SuperAdminMagicLinkCard />
    </div>
  );
}