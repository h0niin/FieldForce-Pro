import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Space, Tag, Tooltip, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CodeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useWebforms, useDeleteWebform, useUpdateWebform } from '@/hooks/use-webforms';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';
import { formatDateTime } from '@/utils/format-date';

interface WebformRecord {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  submission_count: number;
  created_at: string;
  updated_at: string;
}

export default function WebformListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useWebforms({ page, take: pageSize, search } as Record<string, unknown> & { page: number; take: number });
  const deleteWebform = useDeleteWebform();
  const updateWebform = useUpdateWebform();

  const webforms = (data?.data || []) as WebformRecord[];
  const meta = data?.meta;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (record: WebformRecord) => {
    showConfirmDialog({
      title: t('webforms.deleteWebform'),
      content: t('webforms.confirmDelete', { name: record.name }),
      onOk: async () => {
        await deleteWebform.mutateAsync(record.id);
      },
      danger: true,
    });
  };

  const handleToggleActive = async (record: WebformRecord, checked: boolean) => {
    await updateWebform.mutateAsync({ id: record.id, is_active: checked });
  };

  const columns: ColumnsType<WebformRecord> = [
    {
      title: t('webforms.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => <span style={{ fontWeight: 500 }}>{name}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('webforms.description'),
      dataIndex: 'description',
      key: 'description',
      render: (desc: string, record: any) => desc || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('webforms.submissions'),
      dataIndex: 'submission_count',
      key: 'submission_count',
      render: (count: number, record: any) => count || 0,
      sorter: (a, b) => (a.submission_count || 0) - (b.submission_count || 0),
    },
    {
      title: t('webforms.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive(record, checked)}
          checkedChildren={t('webforms.active')}
          unCheckedChildren={t('webforms.inactive')}
        />
      ),
    },
    {
      title: t('webforms.lastUpdated'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string, record: any) => formatDateTime(date),
      sorter: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    },
    {
      title: t('webforms.actions'),
      key: 'actions',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="webforms:update">
            <Tooltip title={t('webforms.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/webforms/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="webforms:read">
            <Tooltip title={t('webforms.embedCode')}>
              <Button type="text" icon={<CodeOutlined />} size="small" onClick={() => navigate(`/webforms/${record.id}/embed`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="webforms:delete">
            <Tooltip title={t('webforms.delete')}>
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
        title={t('webforms.title')}
        subtitle={t('webforms.subtitle')}
        extra={
          <PermissionGuard permission="webforms:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/webforms/new')}>
              {t('webforms.createWebform')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder={t('webforms.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={webforms}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('webforms.paginationTotal', { total }),
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