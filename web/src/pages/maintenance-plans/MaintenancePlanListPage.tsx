import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Space, Tooltip, Badge, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import SearchFilter from '@/components/common/SearchFilter';
import { useMaintenancePlans, useDeleteMaintenancePlan } from '@/hooks/use-maintenance-plans';
import type { AssetMaintenancePlan } from '@/types/models.types';

export default function MaintenancePlanListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useMaintenancePlans({
    page,
    take: pageSize,
    search,
  });

  const deleteMaintenancePlan = useDeleteMaintenancePlan();

  const plans = data?.data || [];
  const meta = data?.meta;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (plan: AssetMaintenancePlan) => {
    showConfirmDialog({
      title: t('maintenancePlans.deleteConfirmTitle'),
      content: t('maintenancePlans.deleteConfirmContent', { name: plan.name }),
      onOk: async () => {
        await deleteMaintenancePlan.mutateAsync(plan.id);
      },
      danger: true,
    });
  };

  const getFrequencyColor = (frequency: string) => {
    const colors: Record<string, string> = {
      daily: 'blue',
      weekly: 'cyan',
      monthly: 'green',
      quarterly: 'orange',
      yearly: 'purple',
    };
    return colors[frequency] || 'default';
  };

  const columns: ColumnsType<AssetMaintenancePlan> = [
    {
      title: t('maintenancePlans.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: t('maintenancePlans.asset'),
      dataIndex: ['asset', 'name'],
      key: 'asset',
      render: (name: string | undefined, record) => (
        <Tooltip title={t('maintenancePlans.assetId', { id: record.asset_id })}>
          {name || <span style={{ color: '#999' }}>{t('maintenancePlans.assetPrefix', { id: record.asset_id.slice(0, 8) })}</span>}
        </Tooltip>
      ),
    },
    {
      title: t('maintenancePlans.frequency'),
      dataIndex: 'frequency',
      key: 'frequency',
      render: (frequency: string, record: any) => (
        <Tag color={getFrequencyColor(frequency)}>
          {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
        </Tag>
      ),
    },
    {
      title: t('maintenancePlans.nextDueDate'),
      dataIndex: 'next_due_date',
      key: 'next_due_date',
      render: (date: string | null, record: any) => {
        if (!date) return <span style={{ color: '#999' }}>{t('maintenancePlans.notScheduled')}</span>;
        const dueDate = new Date(date);
        const today = new Date();
        const isOverdue = dueDate < today;
        return (
          <Space>
            <CalendarOutlined style={{ color: isOverdue ? '#ff4d4f' : '#52c41a' }} />
            <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
              {formatDateTime(date)}
            </span>
            {isOverdue && <Badge status="error" text={t('maintenancePlans.overdue')} />}
          </Space>
        );
      },
      sorter: (a, b) => {
        if (!a.next_due_date) return 1;
        if (!b.next_due_date) return -1;
        return new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime();
      },
    },
    {
      title: t('maintenancePlans.lastCompleted'),
      dataIndex: 'last_completed_date',
      key: 'last_completed_date',
      render: (date: string | null, record: any) => date ? formatDateTime(date) : <span style={{ color: '#999' }}>{t('maintenancePlans.never')}</span>,
    },
    {
      title: t('maintenancePlans.autoCreateWo'),
      dataIndex: 'auto_create_wo',
      key: 'auto_create_wo',
      render: (auto: boolean, record: any) => (
        <Badge status={auto ? 'success' : 'default'} text={auto ? t('common.yes') : t('common.no')} />
      ),
    },
    {
      title: t('maintenancePlans.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean, record: any) => (
        <Badge status={active ? 'success' : 'warning'} text={active ? t('maintenancePlans.active') : t('maintenancePlans.inactive')} />
      ),
    },
    {
      title: t('maintenancePlans.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="asset_maintenance_plans:read">
            <Tooltip title={t('common.view')}>
              <Button
                type="text"
                icon={<EyeOutlined />}
                size="small"
                onClick={() => navigate(`/maintenance-plans/${record.id}`)}
              />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="asset_maintenance_plans:update">
            <Tooltip title={t('common.edit')}>
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => navigate(`/maintenance-plans/${record.id}/edit`)}
              />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="asset_maintenance_plans:delete">
            <Tooltip title={t('common.delete')}>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('maintenancePlans.title')}
        subtitle={t('maintenancePlans.subtitle')}
        extra={
          <PermissionGuard permission="asset_maintenance_plans:create">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/maintenance-plans/new')}
            >
              {t('maintenancePlans.addPlan')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder={t('maintenancePlans.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={plans}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('maintenancePlans.totalItems', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />
    </div>
  );
}