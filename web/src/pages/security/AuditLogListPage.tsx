import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Space, Tag, Tooltip, Select, DatePicker } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { useUsers } from '@/hooks/use-users';
import PageHeader from '@/components/common/PageHeader';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';
import { formatDateTime } from '@/utils/format-date';

const { RangePicker } = DatePicker;

interface AuditLogRecord {
  id: string;
  user_id: string;
  user?: { first_name: string; last_name: string };
  action: string;
  entity_type: string;
  entity_id: string;
  changes: unknown;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  read: 'default',
  login: 'cyan',
  logout: 'orange',
};

export default function AuditLogListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | undefined>(undefined);
  const [entityFilter, setEntityFilter] = useState<string | undefined>(undefined);
  const [userFilter, setUserFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  // Fetch users for filtering
  const { data: usersData } = useUsers({ take: 100 });
  const users = usersData?.data || [];

  const { data, isLoading } = useAuditLogs({ page, take: pageSize, search } as Record<string, unknown> & { page: number; take: number });

  const auditLogs = ((data?.data || []) as AuditLogRecord[]).filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (entityFilter && log.entity_type !== entityFilter) return false;
    if (userFilter && log.user_id !== userFilter) return false;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const logDate = new Date(log.created_at);
      const start = dateRange[0].startOf('day').toDate();
      const end = dateRange[1].endOf('day').toDate();
      if (logDate < start || logDate > end) return false;
    }
    return true;
  });
  const meta = data?.meta;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log(t('auditLog.exportLog'));
  };

  const columns: ColumnsType<AuditLogRecord> = [
    {
      title: t('auditLog.columns.user'),
      key: 'user',
      render: (_, record) =>
        record.user
          ? `${record.user.first_name} ${record.user.last_name}`
          : <span style={{ color: '#999' }}>{t('auditLog.system')}</span>,
    },
    {
      title: t('auditLog.columns.action'),
      dataIndex: 'action',
      key: 'action',
      render: (action: string, record: any) => (
        <Tag color={ACTION_COLORS[action] || 'default'}>
          {action ? action.toUpperCase() : '-'}
        </Tag>
      ),
    },
    {
      title: t('settings.submodules.subType', 'Sub Type'),
      dataIndex: 'entity_type',
      key: 'entity_type',
      render: (type: string, record: any) => <Tag>{type}</Tag>,
    },
    {
      title: t('auditLog.columns.entityId'),
      dataIndex: 'entity_id',
      key: 'entity_id',
      render: (id: string, record: any) => (
        <code style={{ fontSize: '11px' }}>
          {id ? id.substring(0, 8) + '...' : '-'}
        </code>
      ),
    },
    {
      title: t('auditLog.columns.ipAddress'),
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip: string, record: any) => <code style={{ fontSize: '11px' }}>{ip || '-'}</code>,
    },
    {
      title: t('auditLog.columns.timestamp'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string, record: any) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: t('auditLog.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 80,
      render: (_, record) => (
        <Space size="small">
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('auditLog.title')}
        subtitle="Track and monitor security events, configuration updates, and operational changes. Keep a chronological, immutable ledger of all system transactions to maintain regulatory compliance and operational visibility."
        extra={
          <PermissionGuard permission="audit-logs:export">
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              {t('auditLog.export')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <SearchFilter
          placeholder={t('auditLog.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          placeholder={t('auditLog.filterAction')}
          allowClear
          value={actionFilter}
          onChange={(value) => { setActionFilter(value); setPage(1); }}
          style={{ width: 140 }}
          options={[
            { value: 'create', label: t('auditLog.actions.create') },
            { value: 'update', label: t('auditLog.actions.update') },
            { value: 'delete', label: t('auditLog.actions.delete') },
            { value: 'read', label: t('auditLog.actions.read') },
            { value: 'login', label: t('auditLog.actions.login') },
            { value: 'logout', label: t('auditLog.actions.logout') },
          ]}
        />
        <Select
          placeholder={t('auditLog.filterUser', 'Filter By User')}
          allowClear
          value={userFilter}
          onChange={(value) => { setUserFilter(value); setPage(1); }}
          style={{ width: 180 }}
          options={users.map((u) => ({
            label: `${u.first_name} ${u.last_name}`,
            value: u.id,
          }))}
          showSearch
          optionFilterProp="label"
        />
        <Select
          placeholder={t('auditLog.filterSubType', 'Filter By Sub Type')}
          allowClear
          value={entityFilter}
          onChange={(value) => { setEntityFilter(value); setPage(1); }}
          style={{ width: 180 }}
          options={[
            { value: 'work_order', label: t('auditLog.entities.workOrder') },
            { value: 'contact', label: t('auditLog.entities.contact') },
            { value: 'user', label: t('auditLog.entities.user') },
            { value: 'estimate', label: t('auditLog.entities.estimate') },
            { value: 'invoice', label: t('auditLog.entities.invoice') },
          ]}
        />
        <RangePicker
          style={{ width: 260 }}
          value={dateRange}
          onChange={(dates) => { setDateRange(dates as any); setPage(1); }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={auditLogs}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('auditLog.totalLogs', { count: total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            if (newPageSize !== pageSize) {
              setPageSize(newPageSize);
              setPage(1);
            }
          },
        }}
      />
    </div>
  );
}