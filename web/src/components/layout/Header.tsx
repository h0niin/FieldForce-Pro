import { Layout, Avatar, Dropdown, Input, Button, Badge, List, Typography, Empty, Space, Tag } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  SettingOutlined,
  BellOutlined,
  SearchOutlined,
  CheckOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { useLogout } from '@/hooks/use-auth';
import { useUnreadNotifications, useMarkNotificationAsRead, useMarkAllNotificationsAsRead } from '@/hooks/use-notifications';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const { Header: AntHeader } = Layout;

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const logoutMutation = useLogout();
  const { data: unreadNotifications } = useUnreadNotifications();
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  const currentLanguageLabel = {
    en: 'English',
    ar: 'العربية',
    ml: 'മലയാളം',
    hi: 'हिन्दी',
  }[i18n.language] || 'English';

  const languageMenuItems = [
    { key: 'en', label: 'English', onClick: () => handleLanguageChange('en') },
    { key: 'ar', label: 'العربية', onClick: () => handleLanguageChange('ar') },
    { key: 'ml', label: 'മലയാളം', onClick: () => handleLanguageChange('ml') },
    { key: 'hi', label: 'हिन्दी', onClick: () => handleLanguageChange('hi') },
  ];

  const unreadCount = unreadNotifications?.length || 0;

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate('/login');
  };

  const userMenuItems = [
    user?.is_super_admin
      ? {
          key: 'profile',
          icon: <UserOutlined />,
          label: t('header.myProfile'),
          onClick: () => navigate('/admin/profile'),
        }
      : {
          key: 'settings',
          icon: <SettingOutlined />,
          label: t('header.settings'),
          onClick: () => navigate('/settings'),
        },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('header.logout'),
      onClick: handleLogout,
    },
  ];

  // Helper to display role
  const getUserRole = () => {
    if (!user?.roles || user.roles.length === 0) return 'User';
    const role = user.roles[0];
    return typeof role === 'string' ? role : role.name;
  };

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: theme === 'dark' ? '#141414' : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 80, // Taller header like Solux
        borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
        zIndex: 99,
      }}
    >
      {/* Left: Search Bar */}
      <div style={{ flex: 1, maxWidth: 400 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
          placeholder={t('header.search')}
          style={{
            borderRadius: 999, // Pill shape
            backgroundColor: theme === 'dark' ? '#1f1f1f' : '#f9fafb',
            border: `1px solid ${theme === 'dark' ? '#303030' : '#e5e7eb'}`,
            padding: '8px 16px',
            color: theme === 'dark' ? '#fff' : '#000',
          }}
          bordered={false}
        />
      </div>

      {/* Right: Actions & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {/* Language Switcher */}
        <Dropdown menu={{ items: languageMenuItems }} placement="bottomRight">
          <Button
            type="text"
            icon={<GlobalOutlined style={{ fontSize: 18, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />}
            style={{
              borderRadius: 8,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: theme === 'dark' ? '#fff' : '#111827',
              border: `1px solid ${theme === 'dark' ? '#303030' : '#e5e7eb'}`,
              backgroundColor: theme === 'dark' ? '#1f1f1f' : '#f9fafb',
            }}
          >
            {currentLanguageLabel}
          </Button>
        </Dropdown>

        {/* Theme Toggle (Segmented Control) */}
        <div
          style={{
            background: theme === 'dark' ? '#1f1f1f' : '#f3f4f6',
            borderRadius: 999,
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            border: `1px solid ${theme === 'dark' ? '#303030' : '#e5e7eb'}`,
          }}
        >
          <div
            onClick={() => setTheme('light')}
            style={{
              cursor: 'pointer',
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: theme === 'light' ? '#fff' : 'transparent',
              boxShadow: theme === 'light' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
              color: theme === 'light' ? '#f59e0b' : '#9ca3af',
              transition: 'all 0.2s',
            }}
          >
            <SunOutlined />
          </div>
          <div
            onClick={() => setTheme('dark')}
            style={{
              cursor: 'pointer',
              width: 28,
              height: 28,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: theme === 'dark' ? '#2563eb' : 'transparent',
              boxShadow: theme === 'dark' ? '0 2px 4px rgba(37,99,235,0.3)' : 'none',
              color: theme === 'dark' ? '#fff' : '#9ca3af',
              transition: 'all 0.2s',
            }}
          >
            <MoonOutlined />
          </div>
        </div>

        {/* Notifications */}
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          dropdownRender={() => (
            <div
              style={{
                width: 380,
                background: theme === 'dark' ? '#1f1f1f' : '#fff',
                borderRadius: 8,
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                border: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
                maxHeight: 440,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text strong>{t('header.notifications')}</Text>
                {unreadCount > 0 && (
                  <Button
                    type="link"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAsRead.mutate();
                    }}
                  >
                    {t('header.markAllRead')}
                  </Button>
                )}
              </div>
              <div style={{ overflow: 'auto', maxHeight: 380 }}>
                {!unreadNotifications || unreadNotifications.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('header.noNewNotifications')}
                    style={{ padding: '24px 0' }}
                  />
                ) : (
                  <List
                    dataSource={unreadNotifications}
                    renderItem={(item: { id: string; title: string; body: string; type: string; created_at: string; data?: Record<string, unknown> }) => (
                      <List.Item
                        key={item.id}
                        style={{
                          padding: '10px 16px',
                          cursor: 'pointer',
                          background: theme === 'dark' ? '#1f1f1f' : '#f0f7ff',
                        }}
                        onClick={() => {
                          markAsRead.mutate(item.id);
                          if (item.data?.navigate_to === 'view_appointment' && item.data?.appointment_id) {
                            navigate(`/scheduling?appointment_id=${item.data.appointment_id as string}`);
                          } else if (item.data?.navigate_to === 'field_workflow' && item.data?.work_order_id) {
                            navigate(`/work-orders?wo_id=${item.data.work_order_id as string}#field-workflow`);
                          } else if (item.data?.navigate_to === 'create_schedule') {
                            navigate('/scheduling?tab=new');
                          } else if (item.data?.navigate_to === 'edit_estimate' && item.data?.estimate_id) {
                            navigate(`/estimates/${item.data.estimate_id}/edit`);
                          } else if (item.data?.navigate_to === 'create_estimate' && item.data?.service_request_id) {
                            navigate(`/estimates/new?service_request_id=${item.data.service_request_id}`);
                          } else if (item.data?.document_type === 'SERVICE_REQUEST' && item.data?.document_id) {
                            navigate(`/service-requests/${item.data.document_id}`);
                          } else if (item.data?.document_type === 'ESTIMATE_APPROVAL') {
                            navigate('/estimates?tab=internal-review');
                          } else if (
                            item.data?.document_type === 'FIELD_WORKFLOW' &&
                            item.data?.entity_id
                          ) {
                            navigate(`/work-orders?wo_id=${item.data.entity_id as string}#field-workflow`);
                          } else if (
                            (item.data?.document_type === 'WORK_ORDER' || item.data?.entity_type === 'work_order') &&
                            (item.data?.document_id || item.data?.entity_id)
                          ) {
                            navigate(`/work-orders#approvals`);
                          } else if (
                            item.data?.document_type === 'SCHEDULE' ||
                            item.data?.entity_type === 'schedule'
                          ) {
                            // Approval notifications → Document Approvals (technician accepts/rejects there)
                            // Other schedule notifications → Dispatch Board
                            if (item.type === 'approval_required') {
                              navigate('/workflow/document-approvals');
                            } else {
                              navigate('/scheduling?tab=review');
                            }
                          }
                        }}
                      >
                        <List.Item.Meta
                          title={
                            <Space size={4}>
                              <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                              <Tag color="blue" style={{ fontSize: 10 }}>{item.type}</Tag>
                            </Space>
                          }
                          description={
                            <div>
                              <Text
                                type="secondary"
                                style={{ fontSize: 12, display: 'block' }}
                                ellipsis={{ tooltip: item.body }}
                              >
                                {item.body}
                              </Text>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {new Date(item.created_at).toLocaleString()}
                              </Text>
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </div>
            </div>
          )}
        >
          <Badge count={unreadCount} size="small" offset={[-2, 2]}>
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: 18, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />}
              style={{ borderRadius: '50%', height: 40, width: 40 }}
            />
          </Badge>
        </Dropdown>

        {/* User Profile */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <Avatar
              size={40}
              src={user?.avatar_url}
              icon={<UserOutlined />}
              style={{
                border: `2px solid ${theme === 'dark' ? '#303030' : '#fff'}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontWeight: 600, color: theme === 'dark' ? '#fff' : '#111827', fontSize: 14 }}>
                {user ? `${user.first_name} ${user.last_name}` : 'Anderson Williams'}
              </span>
              <span style={{ fontSize: 12, color: theme === 'dark' ? '#9ca3af' : '#6b7280' }}>
                {getUserRole()}
              </span>
            </div>
          </div>
        </Dropdown>
      </div>
    </AntHeader>
  );
}
