import { useState } from 'react';
import { Card, Table, Tag, Button, Space, Row, Col, Statistic, Input, Avatar, Tooltip, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import { useUsers } from '@/hooks/use-users';
import { formatDateTime } from '@/utils/format-date';
import type { User } from '@/types/models.types';

export default function AgentListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const { data: usersData, isLoading } = useUsers({
    page,
    take: pageSize,
    search: search || undefined,
  });

  const users = usersData?.data || [];
  const meta = usersData?.meta;

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  const columns: ColumnsType<User> = [
    {
      title: t('agentListPage.agent'),
      key: 'agent',
      render: (_, record) => (
        <Space>
          <Badge dot status={record.is_active ? 'success' : 'default'} offset={[-4, 28]}>
            <Avatar
              src={record.avatar_url}
              icon={!record.avatar_url && <UserOutlined />}
              size={36}
              style={{ backgroundColor: record.is_active ? '#1890ff' : '#d9d9d9' }}
            />
          </Badge>
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.first_name} {record.last_name}
            </div>
            <div style={{ fontSize: 12, color: '#999' }}>
              {record.roles?.map((r) => r.name).join(', ') || t('agentListPage.noRole')}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: t('agentListPage.contact'),
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <MailOutlined style={{ color: '#999', fontSize: 12 }} />
            <span style={{ fontSize: 13 }}>{record.email}</span>
          </Space>
          {record.phone && (
            <Space size={4}>
              <PhoneOutlined style={{ color: '#999', fontSize: 12 }} />
              <span style={{ fontSize: 13 }}>{record.phone}</span>
            </Space>
          )}
        </Space>
      ),
    },
    {
      title: t('agentListPage.status'),
      key: 'status',
      width: 100,
      render: (_, record) =>
        record.is_active ? (
          <Tag icon={<CheckCircleOutlined />} color="success">{t('agentListPage.active')}</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">{t('agentListPage.inactive')}</Tag>
        ),
      filters: [
        { text: t('agentListPage.active'), value: true },
        { text: t('agentListPage.inactive'), value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: t('agentListPage.verified'),
      key: 'verified',
      width: 120,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title={record.email_verified ? t('agentListPage.emailVerified') : t('agentListPage.emailNotVerified')}>
            <Tag color={record.email_verified ? 'green' : 'default'} style={{ fontSize: 11 }}>
              <MailOutlined /> {record.email_verified ? t('agentListPage.yes') : t('agentListPage.no')}
            </Tag>
          </Tooltip>
          <Tooltip title={record.phone_verified ? t('agentListPage.phoneVerified') : t('agentListPage.phoneNotVerified')}>
            <Tag color={record.phone_verified ? 'green' : 'default'} style={{ fontSize: 11 }}>
              <PhoneOutlined /> {record.phone_verified ? t('agentListPage.yes') : t('agentListPage.no')}
            </Tag>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: t('agentListPage.lastLogin'),
      dataIndex: 'last_login_at',
      key: 'last_login_at',
      width: 160,
      render: (val: string | null) =>
        val ? formatDateTime(val) : <span style={{ color: '#999' }}>{t('agentListPage.never')}</span>,
      sorter: (a, b) => {
        if (!a.last_login_at) return -1;
        if (!b.last_login_at) return 1;
        return new Date(a.last_login_at).getTime() - new Date(b.last_login_at).getTime();
      },
    },
    {
      title: t('agentListPage.actions'),
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title={t('agentListPage.viewProfile')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => navigate(`/users/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title={t('agentListPage.trackLocation')}>
            <Button
              type="text"
              icon={<EnvironmentOutlined />}
              size="small"
              onClick={() => navigate(`/tracking/live`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('nav.workforce')}
        subtitle={t('agentListPage.headerSubtitle')}
      />

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('agentListPage.totalAgents')}
              value={meta?.itemCount || users.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('agentListPage.active')}
              value={activeCount}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('agentListPage.inactive')}
              value={inactiveCount}
              valueStyle={{ color: '#999' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('agentListPage.verified')}
              value={users.filter((u) => u.email_verified).length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<MailOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Search & Table */}
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('agentListPage.searchPlaceholder')}
            prefix={<SearchOutlined />}
            allowClear
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ width: 400 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize,
            total: meta?.itemCount || 0,
            showSizeChanger: true,
            showTotal: (total) => t('agentListPage.totalAgentsCount', { total }),
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
        />
      </Card>
    </div>
  );
}