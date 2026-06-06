import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Space, Tag, Tooltip, Select } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useTemplates, useDeleteTemplate } from '@/hooks/use-templates';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';
import { formatDateTime } from '@/utils/format-date';

interface TemplateRecord {
  id: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  invoice: 'blue',
  estimate: 'cyan',
  email: 'green',
  report: 'purple',
};

export default function TemplateListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  const { data, isLoading } = useTemplates({ page, take: pageSize, search } as Record<string, unknown> & { page: number; take: number });
  const deleteTemplate = useDeleteTemplate();

  const templates = ((data?.data || []) as TemplateRecord[]).filter((tpl) => {
    if (typeFilter && tpl.type !== typeFilter) return false;
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

  const handleDelete = (record: TemplateRecord) => {
    showConfirmDialog({
      title: t('templates.deleteTemplate'),
      content: t('templates.confirmDelete', { name: record.name }),
      onOk: async () => {
        await deleteTemplate.mutateAsync(record.id);
      },
      danger: true,
    });
  };

  const columns: ColumnsType<TemplateRecord> = [
    {
      title: t('templates.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('templates.columns.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={TYPE_COLORS[type] || 'default'}>
          {type ? type.charAt(0).toUpperCase() + type.slice(1) : '-'}
        </Tag>
      ),
    },
    {
      title: t('templates.columns.subject'),
      dataIndex: 'subject',
      key: 'subject',
      render: (subject: string) => subject || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('templates.columns.default'),
      dataIndex: 'is_default',
      key: 'is_default',
      render: (isDefault: boolean) => (
        isDefault ? <Tag color="green">{t('templates.default')}</Tag> : null
      ),
    },
    {
      title: t('templates.columns.lastUpdated'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => formatDateTime(date),
      sorter: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    },
    {
      title: t('templates.columns.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="templates:read">
            <Tooltip title={t('templates.actions.view')}>
              <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => navigate(`/customization/templates/${record.id}`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="templates:update">
            <Tooltip title={t('templates.actions.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/customization/templates/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="templates:delete">
            <Tooltip title={t('templates.actions.delete')}>
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
        title={t('templates.title')}
        subtitle={t('templates.subtitle')}
        extra={
          <PermissionGuard permission="templates:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/customization/templates/new')}>
              {t('templates.createTemplate')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <SearchFilter
          placeholder={t('templates.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          placeholder={t('templates.filterPlaceholder')}
          allowClear
          value={typeFilter}
          onChange={(value) => { setTypeFilter(value); setPage(1); }}
          style={{ width: 200 }}
          options={[
            { value: 'invoice', label: t('templates.types.invoice') },
            { value: 'estimate', label: t('templates.types.estimate') },
            { value: 'email', label: t('templates.types.email') },
            { value: 'report', label: t('templates.types.report') },
          ]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={templates}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('templates.totalTemplates', { total }),
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