import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Space, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useBlueprints, useDeleteBlueprint } from '@/hooks/use-blueprints';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';
import { formatDateTime } from '@/utils/format-date';

interface BlueprintRecord {
  id: string;
  name: string;
  entity_type: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function BlueprintListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useBlueprints({ page, take: pageSize, search } as Record<string, unknown> & { page: number; take: number });
  const deleteBlueprint = useDeleteBlueprint();

  const blueprints = (data?.data || []) as BlueprintRecord[];
  const meta = data?.meta;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (record: BlueprintRecord) => {
    showConfirmDialog({
      title: t('blueprints.deleteTitle'),
      content: t('blueprints.deleteContent', { name: record.name }),
      onOk: async () => {
        await deleteBlueprint.mutateAsync(record.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<BlueprintRecord> = [
    {
      title: t('blueprints.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('blueprints.columns.entityType'),
      dataIndex: 'entity_type',
      key: 'entity_type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: t('blueprints.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('blueprints.columns.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'default'}>
          {isActive ? t('blueprints.status.active') : t('blueprints.status.inactive')}
        </Tag>
      ),
    },
    {
      title: t('blueprints.columns.lastUpdated'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    },
    {
      title: t('blueprints.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="blueprints:read">
            <Tooltip title={t('blueprints.actions.view')}>
              <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/blueprints/${record.id}`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="blueprints:update">
            <Tooltip title={t('blueprints.actions.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/blueprints/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="blueprints:delete">
            <Tooltip title={t('blueprints.actions.delete')}>
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
        title={t('blueprints.title')}
        subtitle={t('blueprints.subtitle')}
        extra={
          <PermissionGuard permission="blueprints:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/blueprints/new')}>
              {t('blueprints.createButton')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder={t('blueprints.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={blueprints}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('blueprints.paginationTotal', { total }),
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