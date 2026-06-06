import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Descriptions,
  Tag,
  Button,
  Card,
  Space,
  Steps,
  Skeleton,
  Typography,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  ArrowLeftOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import {
  useWorkflowTemplate,
  useDeleteWorkflowTemplate,
  useActivateWorkflowTemplate,
  useDeactivateWorkflowTemplate,
} from '@/hooks/use-workflow';

const { Text } = Typography;

export default function WorkflowTemplateDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: template, isLoading } = useWorkflowTemplate(id || '');
  const deleteMutation = useDeleteWorkflowTemplate();
  const activateMutation = useActivateWorkflowTemplate();
  const deactivateMutation = useDeactivateWorkflowTemplate();

  const handleDelete = () => {
    showConfirmDialog({
      title: t('workflowTemplate.deleteTitle'),
      content: t('workflowTemplate.deleteContent'),
      onOk: async () => {
        await deleteMutation.mutateAsync(id!);
        navigate('/workflow/templates');
      },
    });
  };

  if (isLoading) {
    return <div style={{ padding: 24 }}><Skeleton active /></div>;
  }

  if (!template) {
    return <div style={{ padding: 24 }}>{t('workflowTemplate.notFound')}</div>;
  }

  const sortedApprovers = [...(template.approvers || [])].sort((a, b) => a.order_no - b.order_no);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/workflow/templates')}>
            {t('workflowTemplate.back')}
          </Button>
          <h2 style={{ margin: 0 }}>{template.name}</h2>
          <Tag color={template.is_active ? 'green' : 'default'}>
            {template.is_active ? t('workflowTemplate.active') : t('workflowTemplate.inactive')}
          </Tag>
        </Space>

        <Space>
          <PermissionGuard permission="workflow_templates:update">
            <Button
              icon={template.is_active ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() =>
                template.is_active
                  ? deactivateMutation.mutate(id!)
                  : activateMutation.mutate(id!)
              }
            >
              {template.is_active ? t('workflowTemplate.deactivate') : t('workflowTemplate.activate')}
            </Button>
            <Button
              icon={<EditOutlined />}
              onClick={() => navigate(`/workflow/templates/${id}/edit`)}
            >
              {t('workflowTemplate.edit')}
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="workflow_templates:delete">
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              {t('workflowTemplate.delete')}
            </Button>
          </PermissionGuard>
        </Space>
      </div>

      <Card title={t('workflowTemplate.details')} style={{ marginBottom: 16 }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label={t('workflowTemplate.name')}>{template.name}</Descriptions.Item>
          <Descriptions.Item label={t('workflowTemplate.version')}>v{template.version}</Descriptions.Item>
          <Descriptions.Item label={t('workflowTemplate.documentType')}>
            <Tag color="blue">{template.document_type?.replace(/_/g, ' ') || '-'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('workflowTemplate.category')}>
            <Tag color="green">{template.document_category || '-'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('workflowTemplate.description')} span={2}>
            {template.description || <Text type="secondary">{t('workflowTemplate.noDescription')}</Text>}
          </Descriptions.Item>
          <Descriptions.Item label={t('workflowTemplate.created')}>{formatDateTime(template.created_at)}</Descriptions.Item>
          <Descriptions.Item label={t('workflowTemplate.updated')}>{formatDateTime(template.updated_at)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('workflowTemplate.approvalSteps', { count: sortedApprovers.length })}>
        {sortedApprovers.length === 0 ? (
          <Text type="secondary">{t('workflowTemplate.noSteps')}</Text>
        ) : (
          <Steps
            direction="vertical"
            current={-1}
            items={sortedApprovers.map((approver) => ({
              title: (
                <Space>
                  <UserOutlined />
                  <span>
                    {approver.approver
                      ? `${approver.approver.first_name} ${approver.approver.last_name}`
                      : approver.approver_id}
                  </span>
                  {approver.is_required && <Tag color="red">{t('workflowTemplate.required')}</Tag>}
                  {approver.approval_authority && (
                    <Tag color="blue">{t('workflowTemplate.authority')}: {approver.approval_authority}</Tag>
                  )}
                </Space>
              ),
              description: (
                <div style={{ marginTop: 4 }}>
                  <Space wrap>
                    {approver.approver?.email && (
                      <Text type="secondary">{approver.approver.email}</Text>
                    )}
                    {approver.amount_threshold_min != null && (
                      <Tag>{t('workflowTemplate.min')}: ${approver.amount_threshold_min}</Tag>
                    )}
                    {approver.amount_threshold_max != null && (
                      <Tag>{t('workflowTemplate.max')}: ${approver.amount_threshold_max}</Tag>
                    )}
                    {approver.budget_threshold != null && (
                      <Tag>{t('workflowTemplate.budget')}: ${approver.budget_threshold}</Tag>
                    )}
                    {approver.notes && <Text type="secondary">{t('workflowTemplate.note')}: {approver.notes}</Text>}
                  </Space>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </div>
  );
}