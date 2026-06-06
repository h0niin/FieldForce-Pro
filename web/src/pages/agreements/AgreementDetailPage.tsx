import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Skeleton, Tag, Modal, DatePicker, InputNumber, Form } from 'antd';
import { EditOutlined, DeleteOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import {
  useServiceAgreement,
  useDeleteServiceAgreement,
  useUpdateServiceAgreementStatus,
  useRenewServiceAgreement,
} from '@/hooks/use-service-agreements';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDate, formatDateTime } from '@/utils/format-date';

const STATUS_COLORS: Record<string, string> = {
  draft: 'default',
  active: 'green',
  expired: 'red',
  cancelled: 'orange',
  renewed: 'blue',
};

export default function AgreementDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: agreement, isLoading } = useServiceAgreement(id!);
  const deleteAgreement = useDeleteServiceAgreement();
  const updateStatus = useUpdateServiceAgreementStatus();
  const renewAgreement = useRenewServiceAgreement();
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [renewForm] = Form.useForm();

  const handleDelete = () => {
    if (!agreement) return;
    showConfirmDialog({
      title: t('agreementDetail.deleteTitle'),
      content: t('agreementDetail.deleteConfirm', { name: agreement.name }),
      onOk: async () => {
        await deleteAgreement.mutateAsync(agreement.id);
        navigate('/agreements');
      },
      danger: true,
    });
  };

  const handleCancel = () => {
    if (!agreement) return;
    showConfirmDialog({
      title: t('agreementDetail.cancelTitle'),
      content: t('agreementDetail.cancelConfirm', { name: agreement.name }),
      onOk: async () => {
        await updateStatus.mutateAsync({ id: agreement.id, status: 'cancelled' });
      },
      danger: true,
    });
  };

  const handleRenew = async (values: { end_date: dayjs.Dayjs; value?: number }) => {
    if (!agreement) return;
    await renewAgreement.mutateAsync({
      id: agreement.id,
      end_date: values.end_date.format('YYYY-MM-DD'),
      value: values.value,
    });
    setRenewModalOpen(false);
    renewForm.resetFields();
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('agreementDetail.details')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div>
        <PageHeader title={t('agreementDetail.notFoundTitle')} />
        <Card>{t('agreementDetail.notFoundMessage')}</Card>
      </div>
    );
  }

  const status = agreement.status || 'draft';

  return (
    <div>
      <PageHeader
        title={agreement.name}
        onBack={() => navigate('/agreements')}
        extra={
          <Space>
            {status === 'active' && (
              <PermissionGuard permission="service-agreements:update">
                <Button icon={<ReloadOutlined />} onClick={() => setRenewModalOpen(true)}>{t('agreementDetail.renew')}</Button>
              </PermissionGuard>
            )}
            {(status === 'active' || status === 'draft') && (
              <PermissionGuard permission="service-agreements:update">
                <Button danger icon={<StopOutlined />} onClick={handleCancel}>{t('agreementDetail.cancel')}</Button>
              </PermissionGuard>
            )}
            <PermissionGuard permission="service-agreements:update">
              <Button icon={<EditOutlined />} onClick={() => navigate(`/agreements/${agreement.id}/edit`)}>{t('agreementDetail.edit')}</Button>
            </PermissionGuard>
            <PermissionGuard permission="service-agreements:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>{t('agreementDetail.delete')}</Button>
            </PermissionGuard>
          </Space>
        }
      />

      <Card title={t('agreementDetail.infoTitle')}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label={t('agreementDetail.name')} span={2}>{agreement.name}</Descriptions.Item>
          <Descriptions.Item label={t('agreementDetail.type')}>{agreement.type || <span style={{ opacity: 0.5 }}>-</span>}</Descriptions.Item>
          <Descriptions.Item label={t('agreementDetail.status')}>
            <Tag color={STATUS_COLORS[status] || 'default'}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('agreementDetail.contact')}>
            {agreement.contact
              ? `${agreement.contact.first_name} ${agreement.contact.last_name}`
              : <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>
          <Descriptions.Item label={t('agreementDetail.value')}>
            {agreement.value != null ? `$${Number(agreement.value).toLocaleString()}` : <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>
          <Descriptions.Item label={t('agreementDetail.startDate')}>{formatDate(agreement.start_date)}</Descriptions.Item>
          <Descriptions.Item label={t('agreementDetail.endDate')}>{formatDate(agreement.end_date)}</Descriptions.Item>
          <Descriptions.Item label={t('agreementDetail.slaResponse')}>{agreement.sla_response_hours != null ? `${agreement.sla_response_hours}h` : <span style={{ opacity: 0.5 }}>-</span>}</Descriptions.Item>
          <Descriptions.Item label={t('agreementDetail.slaResolution')}>{agreement.sla_resolution_hours != null ? `${agreement.sla_resolution_hours}h` : <span style={{ opacity: 0.5 }}>-</span>}</Descriptions.Item>
          <Descriptions.Item label={t('agreementDetail.description')} span={2}>
            {agreement.description || <span style={{ opacity: 0.5 }}>-</span>}
          </Descriptions.Item>
          <Descriptions.Item label={t('agreementDetail.createdAt')}>{formatDateTime(agreement.created_at)}</Descriptions.Item>
          <Descriptions.Item label={t('agreementDetail.updatedAt')}>{formatDateTime(agreement.updated_at)}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title={t('agreementDetail.renewTitle')}
        open={renewModalOpen}
        onCancel={() => { setRenewModalOpen(false); renewForm.resetFields(); }}
        onOk={() => renewForm.submit()}
        confirmLoading={renewAgreement.isPending}
      >
        <Form form={renewForm} layout="vertical" onFinish={handleRenew}>
          <Form.Item
            name="end_date"
            label={t('agreementDetail.newEndDate')}
            rules={[{ required: true, message: t('agreementDetail.errorSelectEndDate') }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="value" label={t('agreementDetail.newValue')}>
            <InputNumber min={0} step={0.01} prefix="$" style={{ width: '100%' }} placeholder={t('agreementDetail.placeholderValue')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}