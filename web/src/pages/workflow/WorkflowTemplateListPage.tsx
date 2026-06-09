import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Tag, Space, Card, Tooltip } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import {
  useWorkflowTemplates,
  useDeleteWorkflowTemplate,
  useActivateWorkflowTemplate,
  useDeactivateWorkflowTemplate,
} from '@/hooks/use-workflow';
import type { WorkflowTemplate } from '@/types/workflow.types';

const categoryColors: Record<string, string> = {
  PROCUREMENT: 'blue',
  SERVICE: 'green',
  MAINTENANCE: 'orange',
  FINANCE: 'purple',
  VENDOR: 'gold',
  PROGRAM: 'geekblue',
  BUDGET: 'magenta',
  OTHER: 'default',
  OPERATIONS: 'cyan',
};

export default function WorkflowTemplateListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  const { data, isLoading } = useWorkflowTemplates({
    page,
    take: pageSize,
    search: searchDebounced || undefined,
  });

  const deleteMutation = useDeleteWorkflowTemplate();
  const activateMutation = useActivateWorkflowTemplate();
  const deactivateMutation = useDeactivateWorkflowTemplate();

  const handleSearch = (value: string) => {
    setSearch(value);
    setTimeout(() => {
      setSearchDebounced(value);
      setPage(1);
    }, 500);
  };

  const handleDelete = (id: string) => {
    showConfirmDialog({
      title: t('workflowTemplates.deleteTitle'),
      content: t('workflowTemplates.deleteConfirm'),
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleToggleActive = (record: WorkflowTemplate) => {
    if (record.is_active) {
      deactivateMutation.mutate(record.id);
    } else {
      activateMutation.mutate(record.id);
    }
  };

  const columns: ColumnsType<WorkflowTemplate> = [
    {
      title: t('workflowTemplates.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record) => (
        <a onClick={() => navigate(`/workflow/templates/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: t('workflowTemplates.documentType'),
      dataIndex: 'document_type',
      key: 'document_type',
      render: (type: string, record: any) => (
        type ? <Tag color="blue">{type.replace(/_/g, ' ')}</Tag> : '-'
      ),
    },
    {
      title: t('workflowTemplates.category'),
      dataIndex: 'document_category',
      key: 'document_category',
      render: (cat: string, record: any) => (
        cat ? <Tag color={categoryColors[cat] || 'default'}>{cat}</Tag> : '-'
      ),
    },
    {
      title: t('workflowTemplates.version'),
      dataIndex: 'version',
      key: 'version',
      width: 80,
      align: 'center',
      render: (v: number, record: any) => `v${v}`,
    },
    {
      title: t('workflowTemplates.approvers'),
      key: 'approvers',
      width: 100,
      align: 'center',
      render: (_: unknown, record) => record.approvers?.length || 0,
    },
    {
      title: t('workflowTemplates.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (active: boolean, record: any) => (
        <Tag color={active ? 'green' : 'default'}>{active ? t('workflowTemplates.active') : t('workflowTemplates.inactive')}</Tag>
      ),
    },
    {
      title: t('workflowTemplates.created'),
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string, record: any) => formatDateTime(date),
    },
    {
      title: t('workflowTemplates.actions'),
      key: 'actions',
      width: 180,
      render: (_: unknown, record) => (
        <Space>
          <Tooltip title={t('workflowTemplates.view')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/workflow/templates/${record.id}`)}
            />
          </Tooltip>
          <PermissionGuard permission="workflow_templates:update">
            <Tooltip title={t('workflowTemplates.edit')}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/workflow/templates/${record.id}/edit`)}
              />
            </Tooltip>
            <Tooltip title={record.is_active ? t('workflowTemplates.deactivate') : t('workflowTemplates.activate')}>
              <Button
                type="text"
                size="small"
                icon={record.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
                onClick={() => handleToggleActive(record)}
              />
            </Tooltip>
          </PermissionGuard>
          <PermissionGuard permission="workflow_templates:delete">
            <Tooltip title={t('workflowTemplates.delete')}>
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
              />
            </Tooltip>
          </PermissionGuard>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{t('workflowTemplates.title')}</h2>
        <PermissionGuard permission="workflow_templates:create">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/workflow/templates/new')}
          >
            {t('workflowTemplates.newTemplate')}
          </Button>
        </PermissionGuard>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder={t('workflowTemplates.searchPlaceholder')}
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ maxWidth: 400 }}
            allowClear
          />
        </div>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            total: data?.meta?.itemCount || 0,
            showSizeChanger: true,
            showTotal: (total) => t('workflowTemplates.totalTemplates', { total }),
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