import { useState, useCallback } from 'react';
import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined, MobileOutlined, KeyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin, useVerifyMFA, useRequestMagicLink } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import CookieConsentModal from '@/components/auth/CookieConsentModal';

const { Title, Text } = Typography;

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type LoginForm = z.infer<typeof loginSchema>;
type MagicLinkForm = z.infer<typeof magicLinkSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [useMagicLink, setUseMagicLink] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaMethod, setMfaMethod] = useState<'email' | 'totp'>('email');
  const [mfaCode, setMfaCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');

  const handleMFARequired = useCallback((token: string, method?: 'email' | 'totp') => {
    setMfaToken(token);
    setMfaMethod(method || 'email');
    setMfaRequired(true);
  }, []);

  const loginMutation = useLogin(handleMFARequired);
  const verifyMFAMutation = useVerifyMFA();
  const requestMagicLinkMutation = useRequestMagicLink();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset: resetLogin
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    control: controlMagicLink,
    handleSubmit: handleMagicLinkSubmit,
    formState: { errors: magicLinkErrors },
    reset: resetMagicLink
  } = useForm<MagicLinkForm>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(
      { ...data, device_type: 'web' },
      {
        onSuccess: (response) => {
          const resData = response.data.data;
          if (!resData?.mfa_required) {
            navigate('/dashboard');
          }
        },
      },
    );
  };

  const onMagicLinkSubmit = (data: MagicLinkForm) => {
    requestMagicLinkMutation.mutate(
      { email: data.email },
      {
        onSuccess: () => {
          // Success is handled by notification
        }
      }
    );
  };

  const onMFASubmit = () => {
    const code = useRecoveryCode ? recoveryCode.trim() : mfaCode;
    verifyMFAMutation.mutate(
      { mfa_token: mfaToken, code, device_type: 'web' },
      {
        onSuccess: () => navigate('/dashboard'),
      },
    );
  };

  const handleResendCode = () => {
    // Re-trigger login to resend a new code
    const formValues = control._formValues;
    loginMutation.mutate({ email: formValues.email, password: formValues.password, device_type: 'web' });
  };

  if (mfaRequired) {
    const isTotp = mfaMethod === 'totp';

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-color)',
          fontFamily: "'Inter', sans-serif",
          position: 'relative',
          overflow: 'hidden',
          color:'var(--text-color)'
        }}
      >
        <Card style={{ 
          width: 460, 
          padding: '40px 32px', 
          borderRadius: 24,
          border: '1px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 20px 40px -10px rgba(37, 99, 235, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.05)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            {useRecoveryCode ? (
              <KeyOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
            ) : isTotp ? (
              <MobileOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            ) : (
              <SafetyOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            )}
            <Title level={3} style={{ marginBottom: 4 }}>
              {useRecoveryCode ? t('auth.recoveryCode') : t('auth.verificationRequired')}
            </Title>
            <Text type="secondary">
              {useRecoveryCode
                ? t('auth.enterRecoveryCode')
                : isTotp
                  ? t('auth.enterTotpCode')
                  : t('auth.enterEmailCode')}
            </Text>
          </div>

          <Form layout="vertical">
            {useRecoveryCode ? (
              <Form.Item label={t('auth.recoveryCode')}>
                <Input
                  size="large"
                  placeholder="XXXX-XXXX"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase().slice(0, 9))}
                  maxLength={9}
                  style={{ fontSize: 24, textAlign: 'center', letterSpacing: 4, fontFamily: 'monospace' }}
                />
              </Form.Item>
            ) : (
              <Form.Item label={t('auth.verificationCode')}>
                <Input
                  size="large"
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  style={{ fontSize: 24, textAlign: 'center', letterSpacing: 8 }}
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button
                type="primary"
                block
                size="large"
                loading={verifyMFAMutation.isPending}
                disabled={useRecoveryCode ? recoveryCode.length !== 9 : mfaCode.length !== 6}
                onClick={onMFASubmit}
              >
                {useRecoveryCode ? t('auth.verifyRecoveryCode') : t('auth.verifySignIn')}
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Space direction="vertical" size="small">
              {!useRecoveryCode && !isTotp && (
                <Button
                  type="link"
                  loading={loginMutation.isPending}
                  onClick={handleResendCode}
                >
                  {t('auth.resendCode')}
                </Button>
              )}
              <Button
                type="link"
                onClick={() => {
                  setUseRecoveryCode(!useRecoveryCode);
                  setRecoveryCode('');
                  setMfaCode('');
                }}
              >
                {useRecoveryCode ? t('auth.useVerificationCode') : t('auth.useRecoveryCode')}
              </Button>
              <Button
                type="link"
                onClick={() => {
                  setMfaRequired(false);
                  setMfaToken('');
                  setMfaCode('');
                  setUseRecoveryCode(false);
                  setRecoveryCode('');
                }}
              >
                {t('auth.backToLogin')}
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <CookieConsentModal />
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-color)',
          fontFamily: "'Inter', sans-serif",
          position: 'relative',
          overflow: 'hidden',
          color:'var(--text-color)'
        }}
      >
        {/* Background decorative orbs */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-10%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.04) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
        <Card style={{
          width: 460,
          padding: '40px 32px',
          borderRadius: 24,
          border: '1px solid rgba(59, 130, 246, 0.1)',
          boxShadow: '0 20px 40px -10px rgba(37, 99, 235, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.05)',
        }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={2} style={{ marginBottom: 4, letterSpacing: '-0.03em', fontWeight: 700 }}>
            FieldForce Pro
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>{t('auth.login')}</Text>
        </div>

        {useMagicLink ? (
          <Form key="magic-link-form" layout="vertical" onFinish={handleMagicLinkSubmit(onMagicLinkSubmit)}>
            <Form.Item
              label={t('auth.email')}
              validateStatus={magicLinkErrors.email ? 'error' : ''}
              help={magicLinkErrors.email?.message}
            >
              <Controller
                name="email"
                control={controlMagicLink}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<MailOutlined />}
                    placeholder="you@example.com"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={requestMagicLinkMutation.isPending}
                block
                size="large"
              >
                {t('auth.sendMagicLink')}
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Button type="link" onClick={() => {
                setUseMagicLink(false);
                resetMagicLink();
              }}>
                {t('auth.signInWithPassword')}
              </Button>
            </div>
          </Form>
        ) : (
          <Form key="password-form" layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label={t('auth.email')}
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<MailOutlined />}
                    placeholder="you@example.com"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={t('auth.password')}
              validateStatus={errors.password ? 'error' : ''}
              help={errors.password?.message}
            >
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <Input.Password
                    {...field}
                    prefix={<LockOutlined />}
                    placeholder={t('auth.password')}
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link to="/forgot-password">{t('auth.forgotPassword')}</Link>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loginMutation.isPending}
                block
                size="large"
              >
                {t('auth.login')}
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Button type="link" onClick={() => {
                setUseMagicLink(true);
                resetLogin();
              }}>
                {t('auth.signInWithMagicLink')}
              </Button>
            </div>
          </Form>
        )}

        <div style={{ textAlign: 'center' }}>
          <Space>
            <Text>{t('auth.noAccount')}</Text>
            <Link to="/register">{t('auth.register')}</Link>
          </Space>
        </div>
      </Card>
    </div>
    </>
  );
}
