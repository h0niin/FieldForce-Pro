import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Skeleton, Tag } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCommunication, useDeleteCommunication } from '@/hooks/use-communications';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';

const channelColors: Record<string, string> = {
  email: 'blue',
  sms: 'green',
  phone: 'orange',
  whatsapp: 'green',
  chat: 'purple',
};

const directionColors: Record<string, string> = {
  inbound: 'blue',
  outbound: 'green',
};

const statusColors: Record<string, string> = {
  pending: 'blue',
  sent: 'green',
  delivered: 'cyan',
  failed: 'red',
  read: 'purple',
};

function formatValue(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function CommunicationDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: communication, isLoading } = useCommunication(id!);
  const deleteCommunication = useDeleteCommunication();

  const handleDelete = () => {
    if (!communication) return;
    showConfirmDialog({
      title: t('communicationDetail.deleteTitle'),
      content: t('communicationDetail.deleteConfirm'),
      onOk: async () => {
        await deleteCommunication.mutateAsync(communication.id);
        navigate('/communications');
      },
      danger: true,
    });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('communicationDetail.title')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (!communication) {
    return (
      <div>
        <PageHeader title={t('communicationDetail.notFoundTitle')} />
        <Card>{t('communicationDetail.notFoundMessage')}</Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('communicationDetail.title')}
        onBack={() => navigate('/communications')}
        extra={
          <Space>
            <PermissionGuard permission="communications:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                {t('communicationDetail.delete')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      <Card title={t('communicationDetail.infoTitle')}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label={t('communicationDetail.contact')}>
            {communication.contact_id || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('communicationDetail.status')}>
            <Tag color={statusColors[communication.status] || 'default'}>
              {formatValue(communication.status)}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('communicationDetail.channel')}>
            <Tag color={channelColors[communication.channel] || 'default'}>
              {formatValue(communication.channel)}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('communicationDetail.direction')}>
            <Tag color={directionColors[communication.direction] || 'default'}>
              {formatValue(communication.direction)}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item label={t('communicationDetail.subject')} span={2}>
            {communication.subject || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('communicationDetail.body')} span={2}>
            <div style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
              {communication.body || <span style={{ opacity: 0.5 }}>-</span>}
            </div>
          </Descriptions.Item>

          <Descriptions.Item label={t('communicationDetail.sentAt')}>
            {communication.sent_at ? formatDateTime(communication.sent_at) : <span style={{ color: '#999' }}>{t('communicationDetail.notSentYet')}</span>}
          </Descriptions.Item>

          <Descriptions.Item label={t('communicationDetail.statusDetails')} span={2}>
            <span style={{ color: '#999' }}>{t('communicationDetail.metadataUnavailable')}</span>
          </Descriptions.Item>

          <Descriptions.Item label={t('communicationDetail.createdAt')}>
            {formatDateTime(communication.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label={t('communicationDetail.updatedAt')}>
            {formatDateTime(communication.updated_at)}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}