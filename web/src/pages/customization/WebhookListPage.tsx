import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Table, Space, Tag, Tooltip, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useWebhooks, useDeleteWebhook, useUpdateWebhook } from '@/hooks/use-webhooks';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';
import { formatDateTime } from '@/utils/format-date';

interface WebhookRecord {
  id: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string;
  created_at: string;
  updated_at: string;
}

export default function WebhookListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useWebhooks({ page, take: pageSize, search } as Record<string, unknown> & { page: number; take: number });
  const deleteWebhook = useDeleteWebhook();
  const updateWebhook = useUpdateWebhook();

  const webhooks = (data?.data || []) as WebhookRecord[];
  const meta = data?.meta;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (record: WebhookRecord) => {
    showConfirmDialog({
      title: t('webhooks.deleteWebhook'),
      content: t('webhooks.deleteConfirm', { name: record.name }),
      onOk: async () => {
        await deleteWebhook.mutateAsync(record.id);
      },
      danger: true,
    });
  };

  const handleToggleActive = async (record: WebhookRecord, checked: boolean) => {
    await updateWebhook.mutateAsync({ id: record.id, is_active: checked });
  };

  const columns: ColumnsType<WebhookRecord> = [
    {
      title: t('webhooks.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (<Link to={`/customization/webhooks/${record.id}`}><span style={{ fontWeight: 500 }}>{name}</span></Link>),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('webhooks.url'),
      dataIndex: 'url',
      key: 'url',
      render: (url: string, record: any) => (
        <code style={{ fontSize: '12px', maxWidth: 300, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {url}
        </code>
      ),
    },
    {
      title: t('webhooks.events'),
      dataIndex: 'events',
      key: 'events',
      render: (events: string[], record: any) => (
        <Space size="small" wrap>
          {events?.slice(0, 3).map((event) => (
            <Tag key={event} color="blue">{event}</Tag>
          ))}
          {events?.length > 3 && <Tag>+{events.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: t('webhooks.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive(record, checked)}
          checkedChildren={t('webhooks.active')}
          unCheckedChildren={t('webhooks.inactive')}
        />
      ),
    },
    {
      title: t('webhooks.lastTriggered'),
      dataIndex: 'last_triggered_at',
      key: 'last_triggered_at',
      render: (date: string, record: any) => date ? formatDateTime(date) : <span style={{ color: '#999' }}>{t('webhooks.never')}</span>,
      sorter: (a, b) => {
        if (!a.last_triggered_at) return -1;
        if (!b.last_triggered_at) return 1;
        return new Date(a.last_triggered_at).getTime() - new Date(b.last_triggered_at).getTime();
      },
    },
    {
      title: t('webhooks.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="webhooks:read">
            
          </PermissionGuard>
          <PermissionGuard permission="webhooks:update">
            <Tooltip title={t('webhooks.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/customization/webhooks/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="webhooks:delete">
            <Tooltip title={t('webhooks.delete')}>
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
        title={t('webhooks.title')}
        subtitle={t('webhooks.subtitle')}
        extra={
          <PermissionGuard permission="webhooks:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/customization/webhooks/new')}>
              {t('webhooks.createButton')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder={t('webhooks.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={webhooks}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('webhooks.paginationTotal', { total }),
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