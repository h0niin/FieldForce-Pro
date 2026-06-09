import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Card, Space } from 'antd';
import {
  BankOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  CompassOutlined,
  TagsOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  SafetyOutlined,
  AuditOutlined,
  MailOutlined,
  WhatsAppOutlined,
  DownloadOutlined,
  RobotOutlined,
  MobileOutlined,
  KeyOutlined,
  LockOutlined,
  AppstoreOutlined,
  LayoutOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface SettingSubmodule {
  key: string;
  label: string;
  icon: JSX.Element;
  path: string;
}

interface SettingCategory {
  title: string;
  items: SettingSubmodule[];
}

export default function SettingsLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const categories: SettingCategory[] = [
    {
      title: t('settings.categories.general', 'General'),
      items: [
        {
          key: 'profile',
          label: t('settings.submodules.orgProfile', 'Organization Profile'),
          icon: <BankOutlined />,
          path: '/settings/profile',
        },
        {
          key: 'currency',
          label: t('settings.submodules.currency', 'Currency'),
          icon: <DollarOutlined />,
          path: '/settings/currency',
        },
        {
          key: 'service-locations',
          label: t('settings.submodules.serviceLocations', 'Service Locations'),
          icon: <EnvironmentOutlined />,
          path: '/settings/service-locations',
        },
        {
          key: 'chatbot',
          label: t('settings.submodules.chatbot', 'AI Chatbot'),
          icon: <RobotOutlined />,
          path: '/settings/chatbot',
        },
      ],
    },
    {
      title: t('settings.categories.workforce', 'Workforce'),
      items: [
        {
          key: 'users',
          label: t('settings.submodules.users', 'Users'),
          icon: <UserOutlined />,
          path: '/settings/users',
        },
        {
          key: 'territories',
          label: t('settings.submodules.territories', 'Territories'),
          icon: <CompassOutlined />,
          path: '/settings/territories',
        },
        {
          key: 'skills',
          label: t('settings.submodules.skills', 'Skills'),
          icon: <TagsOutlined />,
          path: '/settings/skills',
        },
        {
          key: 'shifts',
          label: t('settings.submodules.shifts', 'Shifts'),
          icon: <ClockCircleOutlined />,
          path: '/settings/shifts',
        },
        {
          key: 'holidays',
          label: t('settings.submodules.holiday', 'Holiday'),
          icon: <CalendarOutlined />,
          path: '/settings/holidays',
        },
      ],
    },
    {
      title: t('settings.categories.security', 'Security Control'),
      items: [
        {
          key: 'security',
          label: t('settings.submodules.security', 'Security Settings'),
          icon: <LockOutlined />,
          path: '/settings/security',
        },
        {
          key: 'profiles',
          label: t('settings.submodules.profiles', 'Profiles'),
          icon: <SafetyOutlined />,
          path: '/settings/profiles',
        },
        {
          key: 'audit-logs',
          label: t('settings.submodules.auditLog', 'Audit Log'),
          icon: <AuditOutlined />,
          path: '/settings/audit-logs',
        },
        {
          key: 'mobile-logs',
          label: t('settings.submodules.mobileLogs', 'Mobile Usage Logs'),
          icon: <MobileOutlined />,
          path: '/settings/mobile-logs',
        },
      ],
    },
    {
      title: t('settings.categories.integrations', 'Integrations'),
      items: [
        {
          key: 'api-keys',
          label: t('settings.submodules.apiKeys', 'API Keys'),
          icon: <KeyOutlined />,
          path: '/settings/api-keys',
        },
      ],
    },
    {
      title: t('settings.categories.channels', 'Channels'),
      items: [
        {
          key: 'email',
          label: t('settings.submodules.email', 'Email'),
          icon: <MailOutlined />,
          path: '/settings/channels/email',
        },
        {
          key: 'whatsapp',
          label: t('settings.submodules.whatsapp', 'WhatsApp'),
          icon: <WhatsAppOutlined />,
          path: '/settings/channels/whatsapp',
        },
      ],
    },
    {
      title: t('settings.categories.dataAdmin', 'Data Administration'),
      items: [
        {
          key: 'export',
          label: t('settings.submodules.dataExport', 'Data Export'),
          icon: <DownloadOutlined />,
          path: '/settings/export',
        },
      ],
    },
    {
      title: t('settings.categories.customization', 'Customization'),
      items: [
        {
          key: 'modules-fields',
          label: t('settings.submodules.modulesFields', 'Modules & Fields'),
          icon: <AppstoreOutlined />,
          path: '/settings/customization/modules',
        },
        {
          key: 'dispatch-layouts',
          label: t('settings.submodules.dispatchLayouts', 'Dispatch Console Layouts'),
          icon: <LayoutOutlined />,
          path: '/settings/customization/dispatch-layouts',
        },
        {
          key: 'module-mapping',
          label: t('settings.submodules.moduleMapping', 'Module Mapping'),
          icon: <SwapOutlined />,
          path: '/settings/customization/module-mapping',
        },
      ],
    },
  ];

  const currentPath = location.pathname;

  // Check if a path matches the current location or any of its child routes
  const isActive = (itemPath: string) => {
    if (itemPath === '/settings/profile' && currentPath === '/settings') return true;
    return currentPath === itemPath || currentPath.startsWith(itemPath + '/');
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: 'calc(100vh - 120px)',
        gap: 24,
        padding: '12px 0',
      }}
      className="fade-in-up"
    >
      {/* Settings Navigation Menu Sidebar */}
      <Card
        style={{
          width: 280,
          flexShrink: 0,
          height: 'fit-content',
          padding: '8px 0',
          position: 'sticky',
          top: 100,
          borderRadius: 16,
          boxShadow: 'var(--shadow-sm)',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '16px 20px 8px 20px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-color)' }}>
            {t('settings.title', 'Settings')}
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {t('settings.subtitle', 'Configure and customize your workspace')}
          </p>
        </div>

        <div style={{ padding: '8px 12px' }}>
          {categories.map((cat, catIdx) => (
            <div key={catIdx} style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  padding: '8px 12px 4px 12px',
                }}
              >
                {cat.title}
              </div>
              <Space direction="vertical" size={2} style={{ width: '100%' }}>
                {cat.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <div
                      key={item.key}
                      onClick={() => navigate(item.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                        backgroundColor: active ? 'var(--primary-light)' : 'transparent',
                        color: active ? 'var(--primary-color)' : 'var(--text-color)',
                        transition: 'all 0.2s ease-in-out',
                        borderLeft: active ? '4px solid var(--primary-color)' : '4px solid transparent',
                        paddingLeft: active ? 10 : 14,
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'var(--bg-color)';
                          e.currentTarget.style.color = 'var(--primary-color)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'var(--text-color)';
                        }
                      }}
                    >
                      <span style={{ fontSize: 16, display: 'flex', alignItems: 'center' }}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </Space>
            </div>
          ))}
        </div>
      </Card>

      {/* Settings Active View Content Area */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Card
          style={{
            borderRadius: 16,
            minHeight: '600px',
            boxShadow: 'var(--shadow-sm)',
          }}
          bodyStyle={{ padding: 24 }}
        >
          <Outlet />
        </Card>
      </div>
    </div>
  );
}
