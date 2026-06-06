import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Table, Spin } from 'antd';
import { EditOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/hooks/use-users';
import { useSessions, useTerminateSession } from '@/hooks/use-auth';
import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDateTime, formatRelative } from '@/utils/format-date';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import UserDocumentsSection from '@/components/users/UserDocumentsSection';
import type { LoginSession, Role } from '@/types/models.types';

export default function UserDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading } = useUser(id!);
  const { data: sessions } = useSessions();
  const terminateSession = useTerminateSession();

  if (isLoading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  }

  if (!user) return null;

  const sessionColumns = [
    {
      title: t('userDetailPage.device'),
      key: 'device',
      render: (_: unknown, record: LoginSession) =>
        record.device_name || `${record.browser || ''} on ${record.os || t('userDetailPage.unknown')}`,
    },
    { title: t('userDetailPage.ipAddress'), dataIndex: 'ip_address', key: 'ip_address' },
    { title: t('userDetailPage.location'), dataIndex: 'location', key: 'location' },
    {
      title: t('userDetailPage.lastActivity'),
      dataIndex: 'last_activity_at',
      key: 'last_activity_at',
      render: (val: string) => formatRelative(val),
    },
    {
      title: t('userDetailPage.actions'),
      key: 'actions',
      render: (_: unknown, record: LoginSession) => (
        <Button
          danger
          size="small"
          onClick={() =>
            showConfirmDialog({
              title: t('userDetailPage.terminateSession'),
              content: t('userDetailPage.terminateSessionConfirm'),
              onOk: async () => { await terminateSession.mutateAsync(record.id); },
              danger: true,
            })
          }
        >
          {t('userDetailPage.terminate')}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('users.userDetails')}
        extra={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>
              {t('common.back')}
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/users/${id}/edit`)}
            >
              {t('common.edit')}
            </Button>
          </Space>
        }
      />

      <Card style={{ marginBottom: 24 }}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered>
          <Descriptions.Item label={t('users.name')}>
            {user.first_name} {user.last_name}
          </Descriptions.Item>
          <Descriptions.Item label={t('users.email')}>{user.email}</Descriptions.Item>
          <Descriptions.Item label={t('userDetailPage.phone')}>{user.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('users.status')}>
            <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
          </Descriptions.Item>
          <Descriptions.Item label={t('userDetailPage.timezone')}>{user.timezone}</Descriptions.Item>
          <Descriptions.Item label={t('userDetailPage.language')}>{user.language}</Descriptions.Item>
          <Descriptions.Item label={t('users.role')}>
            {user.roles
              ?.filter((r): r is Role => typeof r !== 'string')
              .map((r) => <Tag key={r.id}>{r.name}</Tag>) || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('users.lastLogin')}>
            {formatDateTime(user.last_login_at)}
          </Descriptions.Item>
          <Descriptions.Item label={t('userDetailPage.created')}>
            {formatDateTime(user.created_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('userDetailPage.activeSessions')} style={{ marginBottom: 24 }}>
        <Table
          columns={sessionColumns}
          dataSource={sessions || []}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>

      <UserDocumentsSection userId={id!} />
    </div>
  );
}