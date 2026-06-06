import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Result, Spin, Typography, Button, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { magicLinksApi } from '@/api/magic-links.api';
import { useAuthStore } from '@/store/auth.store';
import { useTranslation } from 'react-i18next';
import type { User } from '@/types/models.types';

const { Text } = Typography;

type VerifyState = 'loading' | 'success' | 'error';

// Module-scoped guard: a magic-link token is single-use and consumed server-side
// on the first verify call. React 18 StrictMode double-invokes effects in dev,
// which would fire verify twice — the second call sees the token as already used.
// Tracking fired tokens at module scope survives the StrictMode unmount/remount so
// the request is sent exactly once per token.
const verifiedTokens = new Set<string>();

function extractErrorMessage(err: unknown, t: (key: string) => string): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string };
  return e?.response?.data?.message || e?.message || t('magicLink.errors.unexpected');
}

export default function MagicLinkVerifyPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [state, setState] = useState<VerifyState>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      setErrorMsg(t('magicLink.errors.noToken'));
      return;
    }

    // Guard against StrictMode double-invoke consuming the single-use token twice.
    if (verifiedTokens.has(token)) return;
    verifiedTokens.add(token);

    magicLinksApi
      .verify(token)
      .then((res) => {
        const { user, purpose } = res.data.data ?? {};
        if (!user) {
          setState('error');
          setErrorMsg(t('magicLink.errors.verificationFailed'));
          return;
        }

        const typedUser = user as unknown as User;
        login(typedUser);
        setState('success');

        setTimeout(() => {
          if (purpose === 'admin_onboarding') {
            navigate('/onboarding/setup', { replace: true });
          } else if (purpose === 'user_onboarding') {
            navigate('/onboarding/user-setup', { replace: true });
          } else if (typedUser.is_super_admin) {
            navigate('/admin/tenants', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 1200);
      })
      .catch((err) => {
        // Verification failed — allow a retry of this token on a future mount.
        verifiedTokens.delete(token);
        setState('error');
        setErrorMsg(extractErrorMessage(err, t));
      });
  }, [searchParams, navigate, login, t]);

  if (state === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <Spin size="large" />
        <Text type="secondary">{t('magicLink.status.verifying')}</Text>
      </div>
    );
  }

  if (state === 'error') {
    const isAlreadyUsed = errorMsg.toLowerCase().includes('already been used');
    const isExpired = errorMsg.toLowerCase().includes('expired');

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Result
          icon={
            isAlreadyUsed ? (
              <WarningOutlined style={{ color: '#faad14' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            )
          }
          title={
            isAlreadyUsed
              ? t('magicLink.errors.linkAlreadyUsed')
              : isExpired
                ? t('magicLink.errors.linkExpired')
                : t('magicLink.errors.invalidLink')
          }
          subTitle={errorMsg}
          extra={
            <Space direction="vertical" align="center">
              <Button type="primary" onClick={() => navigate('/login', { replace: true })}>
                {t('magicLink.buttons.goToLogin')}
              </Button>
            </Space>
          }
        />
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
      }}
    >
      <Result
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title={t('magicLink.status.verified')}
        subTitle={t('magicLink.status.redirecting')}
      />
    </div>
  );
}