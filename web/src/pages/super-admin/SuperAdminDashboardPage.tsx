import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, Tag, Button, Space, Tooltip, Row, Col, Card, Statistic,
  Typography, Popconfirm, Input,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  TeamOutlined, FileTextOutlined,
  CheckCircleOutlined, StopOutlined, PlayCircleOutlined,
  EyeOutlined, SearchOutlined, ClusterOutlined, LinkOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import { usePlatformHealth, useAllTenants, useSuspendTenant, useActivateTenant } from '@/hooks/use-super-admin';
import type { TenantSummary } from '@/api/super-admin.api';
import { formatDateTime } from '@/utils/format-date';
import { useGenerateMagicLink } from '@/hooks/use-magic-links';
import MagicLinkModal from '@/components/magic-links/MagicLinkModal';

const { Text } = Typography;

export default function SuperAdminDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [magicLinkModal, setMagicLinkModal] = useState<{ link: string; expiresAt: string; purpose: string } | null>(null);

  const { data: health, isLoading: healthLoading } = usePlatformHealth();
  const { data: tenants = [], isLoading: tenantsLoading } = useAllTenants();
  const suspendTenant = useSuspendTenant();
  const activateTenant = useActivateTenant();
  const generateLink = useGenerateMagicLink();

  const handleSendOnboardingLink = (adminUserId: string) => {
    generateLink.mutate(
      { target_user_id: adminUserId, purpose: 'admin_onboarding' },
      {
        onSuccess: (res) => {
          const data = res.data.data;
          if (data) setMagicLinkModal({ link: data.link, expiresAt: data.expires_at, purpose: data.purpose });
        },
      },
    );
  };

  const filtered = tenants.filter((t) => {
    const q = search.toLowerCase();
    return (
      !q ||
      t.name.toLowerCase().includes(q) ||
      (t.admin_email ?? '').toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q)
    );
  });

  const columns: ColumnsType<TenantSummary> = [
    {
      title: t('superAdminDashboard.company'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>/{record.slug}</Text>
        </div>
      ),
    },
    {
      title: t('superAdminDashboard.adminEmail'),
      dataIndex: 'admin_email',
      key: 'admin_email',
      render: (email: string | null) =>
        email ? <Text copyable>{email}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: t('superAdminDashboard.registered'),
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (date: string) => formatDateTime(date),
    },
    {
      title: t('superAdminDashboard.users'),
      dataIndex: 'user_count',
      key: 'user_count',
      sorter: (a, b) => a.user_count - b.user_count,
      render: (count: number) => (
        <Space>
          <TeamOutlined style={{ color: '#1677ff' }} />
          {count}
        </Space>
      ),
    },
    {
      title: t('superAdminDashboard.serviceRequests'),
      dataIndex: 'service_request_count',
      key: 'service_request_count',
      sorter: (a, b) => a.service_request_count - b.service_request_count,
      render: (count: number) => (
        <Space>
          <FileTextOutlined style={{ color: '#722ed1' }} />
          {count}
        </Space>
      ),
    },
    {
      title: t('superAdminDashboard.plan'),
      dataIndex: 'subscription_plan',
      key: 'subscription_plan',
      render: (plan: string) => (
        <Tag color={plan === 'enterprise' ? 'gold' : plan === 'professional' ? 'blue' : 'default'}>
          {plan.charAt(0).toUpperCase() + plan.slice(1)}
        </Tag>
      ),
    },
    {
      title: t('superAdminDashboard.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      filters: [
        { text: t('superAdminDashboard.active'), value: true },
        { text: t('superAdminDashboard.suspended'), value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
      render: (isActive: boolean) =>
        isActive ? (
          <Tag icon={<CheckCircleOutlined />} color="success">{t('superAdminDashboard.active')}</Tag>
        ) : (
          <Tag icon={<StopOutlined />} color="error">{t('superAdminDashboard.suspended')}</Tag>
        ),
    },
    {
      title: t('superAdminDashboard.actions'),
      key: 'actions',
      fixed: 'right',
      width: 260,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('superAdminDashboard.viewTenantDashboard')}>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/tenants/${record.id}`)}
            >
              {t('superAdminDashboard.accessDashboard')}
            </Button>
          </Tooltip>
          {record.admin_user_id && (
            <Tooltip title={t('superAdminDashboard.sendOnboardingLink')}>
              <Button
                type="default"
                size="small"
                icon={<LinkOutlined />}
                loading={generateLink.isPending}
                onClick={() => handleSendOnboardingLink(record.admin_user_id!)}
              >
                {t('superAdminDashboard.onboardingLink')}
              </Button>
            </Tooltip>
          )}
          {record.is_active ? (
            <Popconfirm
              title={t('superAdminDashboard.suspendTenant')}
              description={t('superAdminDashboard.confirmSuspend', { name: record.name })}
              onConfirm={() => suspendTenant.mutate(record.id)}
              okText={t('superAdminDashboard.suspend')}
              okButtonProps={{ danger: true }}
            >
              <Tooltip title={t('superAdminDashboard.suspend')}>
                <Button type="text" danger size="small" icon={<StopOutlined />} />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Popconfirm
              title={t('superAdminDashboard.reactivateTenant')}
              description={t('superAdminDashboard.confirmReactivate', { name: record.name })}
              onConfirm={() => activateTenant.mutate(record.id)}
              okText={t('superAdminDashboard.reactivate')}
            >
              <Tooltip title={t('superAdminDashboard.reactivate')}>
                <Button type="text" size="small" icon={<PlayCircleOutlined />} style={{ color: '#52c41a' }} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('superAdminDashboard.title')}
        subtitle={t('superAdminDashboard.subtitle')}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card loading={healthLoading}>
            <Statistic
              title={t('superAdminDashboard.totalTenants')}
              value={health?.tenants.total ?? 0}
              prefix={<ClusterOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={healthLoading}>
            <Statistic
              title={t('superAdminDashboard.activeTenants')}
              value={health?.tenants.active ?? 0}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={healthLoading}>
            <Statistic
              title={t('superAdminDashboard.totalUsers')}
              value={health?.users.total ?? 0}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card loading={healthLoading}>
            <Statistic
              title={t('superAdminDashboard.serviceRequests')}
              value={health?.service_requests.total ?? 0}
              prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder={t('superAdminDashboard.searchPlaceholder')}
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ maxWidth: 400 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filtered}
        rowKey="id"
        loading={tenantsLoading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => t('superAdminDashboard.tableTotal', { total }),
        }}
        scroll={{ x: 1200 }}
      />

      {magicLinkModal && (
        <MagicLinkModal
          open={!!magicLinkModal}
          onClose={() => setMagicLinkModal(null)}
          link={magicLinkModal.link}
          expiresAt={magicLinkModal.expiresAt}
          purpose={magicLinkModal.purpose}
        />
      )}
    </div>
  );
}