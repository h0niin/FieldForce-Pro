import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Table, Space, Tag, Tooltip, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useWorkflowRules, useDeleteWorkflowRule, useUpdateWorkflowRule } from '@/hooks/use-workflow-rules';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import SearchFilter from '@/components/common/SearchFilter';
import { formatDateTime } from '@/utils/format-date';

interface WorkflowRuleRecord {
  id: string;
  name: string;
  entity_type: string;
  trigger_event: string;
  conditions: unknown;
  actions: unknown;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function WorkflowRuleListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useWorkflowRules({ page, take: pageSize, search } as Record<string, unknown> & { page: number; take: number });
  const deleteWorkflowRule = useDeleteWorkflowRule();
  const updateWorkflowRule = useUpdateWorkflowRule();

  const rules = (data?.data || []) as WorkflowRuleRecord[];
  const meta = data?.meta;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = (record: WorkflowRuleRecord) => {
    showConfirmDialog({
      title: t('workflowRules.deleteTitle'),
      content: t('workflowRules.deleteConfirm', { name: record.name }),
      onOk: async () => {
        await deleteWorkflowRule.mutateAsync(record.id);
      },
      danger: true,
    });
  };

  const handleToggleActive = async (record: WorkflowRuleRecord, checked: boolean) => {
    await updateWorkflowRule.mutateAsync({ id: record.id, is_active: checked });
  };

  const columns: ColumnsType<WorkflowRuleRecord> = [
    {
      title: t('workflowRules.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (<Link to={`/customization/workflow-rules/${record.id}`}><span style={{ fontWeight: 500 }}>{name}</span></Link>),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('workflowRules.entityType'),
      dataIndex: 'entity_type',
      key: 'entity_type',
      render: (type: string, record: any) => <Tag>{type}</Tag>,
    },
    {
      title: t('workflowRules.triggerEvent'),
      dataIndex: 'trigger_event',
      key: 'trigger_event',
      render: (event: string, record: any) => <Tag color="blue">{event}</Tag>,
    },
    {
      title: t('workflowRules.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive(record, checked)}
          checkedChildren={t('workflowRules.active')}
          unCheckedChildren={t('workflowRules.inactive')}
        />
      ),
    },
    {
      title: t('workflowRules.lastUpdated'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string, record: any) => formatDateTime(date),
      sorter: (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    },
    {
      title: t('workflowRules.actions'),
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <PermissionGuard permission="workflow-rules:read">
            
          </PermissionGuard>
          <PermissionGuard permission="workflow-rules:update">
            <Tooltip title={t('workflowRules.edit')}>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/customization/workflow-rules/${record.id}/edit`)} />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="workflow-rules:delete">
            <Tooltip title={t('workflowRules.delete')}>
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
        title={t('workflowRules.title')}
        subtitle={t('workflowRules.subtitle')}
        extra={
          <PermissionGuard permission="workflow-rules:create">
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/customization/workflow-rules/new')}>
              {t('workflowRules.createButton')}
            </Button>
          </PermissionGuard>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <SearchFilter
          placeholder={t('workflowRules.searchPlaceholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <Table
        columns={columns}
        dataSource={rules}
        rowKey="id"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize,
          total: meta?.itemCount || 0,
          showSizeChanger: true,
          showTotal: (total) => t('workflowRules.totalRules', { total }),
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