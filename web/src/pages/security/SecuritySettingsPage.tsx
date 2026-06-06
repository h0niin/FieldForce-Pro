import { useState } from 'react';
import {
  Tabs,
  Space,
  Alert,
  Card,
  Table,
  Button,
  Tag,
  Typography,
  Form,
  Input,
  Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  SafetyOutlined,
  GlobalOutlined,
  LaptopOutlined,
  MobileOutlined,
  TabletOutlined,
  DesktopOutlined,
  LockOutlined,
  DeleteOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '@/components/common/PageHeader';
import MFASetupWizard from '@/components/security/MFASetupWizard';
import IPWhitelistManagement from '@/components/security/IPWhitelistManagement';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { formatDateTime } from '@/utils/format-date';
// Tokens are now in HTTP-only cookies, not accessible from JavaScript
import {
  useSessions,
  useTerminateSession,
  useLogoutAll,
  useChangePassword,
} from '@/hooks/use-auth';
import type { LoginSession } from '@/types/models.types';

const { Text, Title } = Typography;

// --- Helpers ---

// Note: With HTTP-only cookies, we can't decode JWT from JavaScript
// The backend identifies the current session from the cookie automatically
function getCurrentSessionId(): string | null {
  return null; // Backend handles current session identification
}

const DEVICE_ICONS: Record<string, typeof LaptopOutlined> = {
  web: LaptopOutlined,
  mobile: MobileOutlined,
  tablet: TabletOutlined,
  desktop: DesktopOutlined,
};

// --- Change Password Schema ---

const changePasswordSchema = z
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
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

// --- Active Sessions Tab ---

function ActiveSessionsTab() {
  const { t } = useTranslation();
  const { data: sessions = [], isLoading } = useSessions();
  const terminateMutation = useTerminateSession();
  const logoutAllMutation = useLogoutAll();
  const currentSessionId = getCurrentSessionId();

  const handleTerminate = (session: LoginSession) => {
    showConfirmDialog({
      title: t('security.terminateSession'),
      content: t('security.confirmTerminate', { device: session.device_name ? ` (${session.device_name})` : '' }),
      onOk: async () => {
        await terminateMutation.mutateAsync(session.id).catch(() => { });
      },
      danger: true,
    });
  };

  const handleTerminateAll = () => {
    showConfirmDialog({
      title: t('security.terminateAllSessions'),
      content: t('security.confirmTerminateAll'),
      onOk: async () => {
        await logoutAllMutation.mutateAsync().catch(() => { });
      },
      okText: t('security.logoutAllDevices'),
      danger: true,
    });
  };

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);

    if (diffMins < 1) return t('security.justNow');
    if (diffMins < 60) return t('security.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('security.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('security.daysAgo', { count: diffDays });
    return t('security.weeksAgo', { count: diffWeeks });
  };

  const getSessionExpiry = (createdAt: string) => {
    const created = new Date(createdAt);
    const expiryDate = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMs < 0) return t('security.expired');
    if (diffDays > 0) return t('security.expiresInDays', { count: diffDays });
    if (diffHours > 0) return t('security.expiresInHours', { count: diffHours });
    return t('security.expiresSoon');
  };

  const cleanIpAddress = (ip: string | null | undefined): string => {
    if (!ip) return '';

    if (ip.startsWith('::ffff:')) {
      return ip.replace('::ffff:', '');
    }

    if (ip === '::1') {
      return 'localhost';
    }

    return ip;
  };

  const getDeviceInfo = (session: LoginSession) => {
    const browser = session.browser || '';
    const deviceName = session.device_name || '';
    const os = session.os || '';

    let name = browser || deviceName || session.device_type || 'Web';

    if (os && !name.toLowerCase().includes(os.toLowerCase())) {
      name = `${name} on ${os}`;
    }

    return name;
  };

  return (
    <div >
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 4, fontSize: 20, fontWeight: 600 }}>
              {t('security.activeSessions')}
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              {t('security.manageDevices')}
            </Text>
          </div>
          {sessions.length > 1 && (
            <Button
              danger
              onClick={handleTerminateAll}
              loading={logoutAllMutation.isPending}
              size="small"
            >
              {t('security.terminateAll')}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <Card style={{ borderRadius: 12 }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary">{t('security.loadingSessions')}</Text>
          </div>
        </Card>
      ) : sessions.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty
            description={t('security.noActiveSessions')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: 40 }}
          />
        </Card>
      ) : (
        <Card style={{ borderRadius: 12, overflow: 'hidden' }} bodyStyle={{ padding: 0 }}>
          {sessions.map((session, index) => {
            const Icon = DEVICE_ICONS[session.device_type] || LaptopOutlined;
            const isCurrent = index === 0;
            const deviceInfo = getDeviceInfo(session);
            const cleanIp = cleanIpAddress(session.ip_address);
            const location = session.location || cleanIp || t('security.unknownLocation');
            const lastSeen = session.last_activity_at || session.created_at;

            return (
              <div key={session.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '15px 14px',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: '#fafafa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ fontSize: 20, color: '#595959' }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div >
                      <Text strong style={{ fontSize: 12, color: '#262626' }}>
                        {deviceInfo}
                      </Text>
                    </div>
                    <div>
                      {isCurrent ? (
                        <div style={{ fontSize: 12 }}>
                          <Space size={4}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              color: '#52c41a',
                            }}>
                              <span style={{
                                display: 'inline-block',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: '#52c41a',
                                marginRight: 6,
                              }}></span>
                              {t('security.currentSession')}
                            </span>
                            {location && (
                              <>
                                <span style={{ color: '#d9d9d9' }}>·</span>
                                <Text type="secondary" style={{ fontSize: 12 }}>{location}</Text>
                              </>
                            )}
                          </Space>
                        </div>
                      ) : (
                        <div style={{ fontSize: 12 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {t('security.locationLastSeen', { location, time: getRelativeTime(lastSeen) })}
                          </Text>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={() => handleTerminate(session)}
                    loading={terminateMutation.isPending}
                    style={{ flexShrink: 0 }}
                  >
                    {isCurrent ? t('security.signOut') : t('security.revoke')}
                  </Button>
                </div>
                {index < sessions.length - 1 && (
                  <div style={{ borderBottom: '1px solid #f5f5f5' }} />
                )}
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// --- Change Password Tab ---

function ChangePasswordTab() {
  const { t } = useTranslation();
  const changePasswordMutation = useChangePassword();
  const [submitted, setSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { old_password: '', new_password: '', confirm_password: '' },
  });

  const onSubmit = (data: ChangePasswordForm) => {
    changePasswordMutation.mutate(
      { old_password: data.old_password, new_password: data.new_password },
      {
        onSuccess: () => {
          setSubmitted(true);
          reset();
        },
      },
    );
  };

  if (submitted && changePasswordMutation.isSuccess) {
    return null;
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <KeyOutlined />
            <span>{t('security.changePassword')}</span>
          </Space>
        }
      >
        <Alert
          message={t('security.passwordWarning')}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <div style={{ maxWidth: 480 }}>
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item
              label={t('security.currentPassword')}
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
                    placeholder={t('security.enterCurrentPassword')}
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={t('security.newPassword')}
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
                    placeholder={t('security.enterNewPassword')}
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label={t('security.confirmNewPassword')}
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
                    placeholder={t('security.confirmNewPassword')}
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
                {t('security.changePassword')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Card>
    </div>
  );
}

// --- Main Page ---

export default function SecuritySettingsPage() {
  const { t } = useTranslation();
  const tabItems = [
    {
      key: 'sessions',
      label: (
        <Space>
          <LaptopOutlined />
          {t('security.activeSessions')}
        </Space>
      ),
      children: <ActiveSessionsTab />,
    },
    {
      key: 'password',
      label: (
        <Space>
          <KeyOutlined />
          {t('security.changePassword')}
        </Space>
      ),
      children: <ChangePasswordTab />,
    },
    {
      key: 'mfa',
      label: (
        <Space>
          <SafetyOutlined />
          {t('security.mfa')}
        </Space>
      ),
      children: (
        <div>
          <Alert
            message={t('security.mfaTitle')}
            description={t('security.mfaDescription')}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <MFASetupWizard />
        </div>
      ),
    },
    {
      key: 'ip-whitelist',
      label: (
        <Space>
          <GlobalOutlined />
          {t('security.ipWhitelisting')}
        </Space>
      ),
      children: (
        <div>
          <Alert
            message={t('security.ipWhitelisting')}
            description={t('security.ipWhitelistDescription')}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />
          <IPWhitelistManagement />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('security.securitySettings')}
        subtitle={t('security.manageSecurityPolicy')}
      />

      <Tabs items={tabItems} defaultActiveKey="sessions" />
    </div>
  );
}