import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Space, Tooltip, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useJobSheetTemplates, useDeleteJobSheetTemplate } from '@/hooks/use-job-sheets';
import type { JobSheetTemplate } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import SearchFilter from '@/components/common/SearchFilter';

export default function JobSheetTemplateListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useJobSheetTemplates({ page, take: pageSize, search });
  const deleteTemplate = useDeleteJobSheetTemplate();

  const templates = data?.data || [];
  const meta = data?.meta;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (template: JobSheetTemplate) => {
    showConfirmDialog({
      title: t('jobSheetTemplates.deleteDialogTitle'),
      content: t('jobSheetTemplates.deleteDialogContent', { name: template.name }),
      onOk: async () => {
        await deleteTemplate.mutateAsync(template.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<JobSheetTemplate> = [
    {
      title: t('jobSheetTemplates.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('jobSheetTemplates.columns.category'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => category ? <Tag>{category}</Tag> : <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('jobSheetTemplates.columns.active'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) =>
        active ? <Tag color="green">{t('jobSheetTemplates.status.active')}</Tag> : <Tag color="red">{t('jobSheetTemplates.status.inactive')}</Tag>,
    },
    {
      title: t('jobSheetTemplates.columns.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: t('jobSheetTemplates.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="job-sheets:read">
            <Tooltip title={t('common.view')}>
              <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/job-sheets/templates/${record.id}`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="job-sheets:update">
            <Tooltip title={t('common.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/job-sheets/templates/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="job-sheets:delete">
            <Tooltip title={t('common.delete')}>
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
        title={t('jobSheetTemplates.title')}
        subtitle={t('jobSheetTemplates.subtitle')}
        extra={
          <PermissionGuard permission="job-sheets:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/job-sheets/templates/new')}>
              {t('jobSheetTemplates.addTemplate')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <SearchFilter
          placeholder={t('jobSheetTemplates.searchPlaceholder')}
          allowClear
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ width: 400 }}
        />
      </div>

      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('jobSheetTemplates.paginationTotal', { total }),
          onChange: (newPage, newPageSize) => {
            setPage(newPage);
            setPageSize(newPageSize);
          },
        }}
      />
    </div>
  );
}