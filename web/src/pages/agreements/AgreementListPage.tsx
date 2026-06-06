import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Space, Tag, Tooltip, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useServiceAgreements, useDeleteServiceAgreement } from '@/hooks/use-service-agreements';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDate } from '@/utils/format-date';
import SearchFilter from '@/components/common/SearchFilter';

interface AgreementRecord {
  id: string;
  name: string;
  type: string;
  contact_id: string;
  contact?: { first_name: string; last_name: string };
  start_date: string;
  end_date: string;
  value: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  active: 'green',
  expired: 'red',
  cancelled: 'orange',
  renewed: 'blue',
};

export default function AgreementListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useServiceAgreements({ page, take: pageSize, search, status: statusFilter } as Record<string, unknown> & { page: number; take: number });
  const deleteAgreement = useDeleteServiceAgreement();

  const agreements = (data?.data || []) as AgreementRecord[];
  const meta = data?.meta;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (record: AgreementRecord) => {
    showConfirmDialog({
      title: t('serviceAgreements.deleteTitle'),
      content: t('serviceAgreements.deleteContent', { name: record.name }),
      onOk: async () => {
        await deleteAgreement.mutateAsync(record.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<AgreementRecord> = [
    {
      title: t('serviceAgreements.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('serviceAgreements.columns.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: t('serviceAgreements.columns.contact'),
      key: 'contact',
      render: (_, record) =>
        record.contact
          ? `${record.contact.first_name} ${record.contact.last_name}`
          : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('serviceAgreements.columns.startDate'),
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date: string) => formatDate(date),
      sorter: (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    },
    {
      title: t('serviceAgreements.columns.endDate'),
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date: string) => formatDate(date),
      sorter: (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime(),
    },
    {
      title: t('serviceAgreements.columns.value'),
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => value != null ? `$${value.toLocaleString()}` : <span style={{ opacity: 0.5 }}>-</span>,
      sorter: (a, b) => (a.value || 0) - (b.value || 0),
    },
    {
      title: t('serviceAgreements.columns.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {status ? status.charAt(0).toUpperCase() + status.slice(1) : '-'}
        </Tag>
      ),
    },
    {
      title: t('serviceAgreements.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="service-agreements:read">
            <Tooltip title={t('serviceAgreements.actions.view')}>
              <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/agreements/${record.id}`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="service-agreements:update">
            <Tooltip title={t('serviceAgreements.actions.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/agreements/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="service-agreements:delete">
            <Tooltip title={t('serviceAgreements.actions.delete')}>
              <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)} />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('nav.agreements', 'Service Agreements')}
        subtitle={t('serviceAgreements.subtitle')}
        extra={
          <PermissionGuard permission="service-agreements:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/agreements/new')}>
              {t('serviceAgreements.addAgreement')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <SearchFilter
          placeholder={t('serviceAgreements.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
        <Select
          placeholder={t('serviceAgreements.filterStatus')}
          allowClear
          value={statusFilter}
          onChange={(value) => { setStatusFilter(value); setPage(1); }}
          style={{ width: 200 }}
          options={[
            { value: 'draft', label: t('serviceAgreements.status.draft') },
            { value: 'active', label: t('serviceAgreements.status.active') },
            { value: 'expired', label: t('serviceAgreements.status.expired') },
            { value: 'cancelled', label: t('serviceAgreements.status.cancelled') },
            { value: 'renewed', label: t('serviceAgreements.status.renewed') },
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={agreements}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('serviceAgreements.total', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />
    </div>
  );
}