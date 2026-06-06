import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Descriptions, Button, Space, Spin, Tag, Empty, Row, Col, Timeline, Alert } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import PageHeader from '@/components/common/PageHeader';
import { usePayment, useDeletePayment } from '@/hooks/use-payments';
import { formatDateTime } from '@/utils/format-date';
import { formatCurrency } from '@/utils/format-currency';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';

const paymentStatusColors: Record<string, string> = {
  pending: 'default',
  processing: 'processing',
  completed: 'success',
  failed: 'error',
  refunded: 'warning',
  cancelled: 'default',
};

const paymentMethodIcons: Record<string, JSX.Element> = {
  credit_card: <CreditCardOutlined />,
  debit_card: <CreditCardOutlined />,
  cash: <DollarOutlined />,
  check: <FileTextOutlined />,
  bank_transfer: <DollarOutlined />,
  online: <CreditCardOutlined />,
};

export default function PaymentDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { data: payment, isLoading } = usePayment(id || '');
  const deletePayment = useDeletePayment();

  const handleDelete = () => {
    if (!payment) return;

    showConfirmDialog({
      title: t('paymentDetail.deletePayment'),
      content: t('paymentDetail.confirmDeleteMessage'),
      onOk: async () => {
        await deletePayment.mutateAsync(payment.id);
        navigate('/payments');
      },
      danger: true,
    });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={{ padding: 100 }}>
        <Empty description={t('paymentDetail.paymentNotFound')} />
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button onClick={() => navigate('/payments')}>{t('paymentDetail.backToPayments')}</Button>
        </div>
      </div>
    );
  }

  const getPaymentTimeline = () => {
    const events = [
      {
        label: t('paymentDetail.paymentCreated'),
        time: payment.created_at,
        icon: <FileTextOutlined />,
        color: 'blue',
      },
    ];

    if (payment.status === 'processing') {
      events.push({
        label: t('paymentDetail.paymentProcessing'),
        time: payment.updated_at,
        icon: <ClockCircleOutlined />,
        color: 'orange',
      });
    }

    if (payment.status === 'completed') {
      events.push({
        label: t('paymentDetail.paymentCompleted'),
        time: payment.updated_at,
        icon: <CheckCircleOutlined />,
        color: 'green',
      });
    }

    if (payment.status === 'failed') {
      events.push({
        label: t('paymentDetail.paymentFailed'),
        time: payment.updated_at,
        icon: <CloseCircleOutlined />,
        color: 'red',
      });
    }

    if (payment.status === 'refunded') {
      events.push({
        label: t('paymentDetail.paymentRefunded'),
        time: payment.updated_at,
        icon: <DollarOutlined />,
        color: 'purple',
      });
    }

    return events;
  };

  return (
    <div>
      <PageHeader
        title={t('paymentDetail.paymentDetails')}
        subtitle={`${t('paymentDetail.transaction')} #${payment.transaction_id || payment.id.slice(0, 8)}`}
        onBack={() => navigate('/payments')}
        extra={
          <Space>
            <PermissionGuard permission="payments:update">
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/payments/${id}/edit`)}
              >
                {t('paymentDetail.edit')}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="payments:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                {t('paymentDetail.delete')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      {payment.status === 'failed' && (
        <Alert
          message={t('paymentDetail.paymentFailed')}
          description={payment.notes || t('paymentDetail.failedDescription')}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {payment.status === 'refunded' && (
        <Alert
          message={t('paymentDetail.paymentRefunded')}
          description={t('paymentDetail.refundedDescription')}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title={t('paymentDetail.paymentInformation')} style={{ marginBottom: 24 }}>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label={t('paymentDetail.transactionId')} span={2}>
                <Tag color="blue">{payment.transaction_id || payment.id}</Tag>
              </Descriptions.Item>

              <Descriptions.Item label={t('paymentDetail.amount')}>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>
                  {formatCurrency(payment.amount)}
                </span>
              </Descriptions.Item>

              <Descriptions.Item label={t('paymentDetail.status')}>
                <Tag
                  color={paymentStatusColors[payment.status]}
                  icon={
                    payment.status === 'completed' ? (
                      <CheckCircleOutlined />
                    ) : payment.status === 'failed' ? (
                      <CloseCircleOutlined />
                    ) : (
                      <ClockCircleOutlined />
                    )
                  }
                >
                  {payment.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label={t('paymentDetail.paymentMethod')}>
                <Space>
                  {paymentMethodIcons[payment.payment_method]}
                  <span>
                    {payment.payment_method.replace('_', ' ').toUpperCase()}
                  </span>
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label={t('paymentDetail.paymentDate')}>
                {payment.payment_date ? formatDateTime(payment.payment_date) : '-'}
              </Descriptions.Item>

              <Descriptions.Item label={t('paymentDetail.invoice')}>
                {payment.invoice_id ? (
                  <Button
                    type="link"
                    onClick={() => navigate(`/invoices/${payment.invoice_id}`)}
                    style={{ padding: 0 }}
                  >
                    {t('paymentDetail.viewInvoice')}
                  </Button>
                ) : (
                  <span style={{ color: '#999' }}>{t('paymentDetail.noInvoiceLinked')}</span>
                )}
              </Descriptions.Item>

              <Descriptions.Item label={t('paymentDetail.referenceNumber')}>
                {payment.reference_number || <span style={{ opacity: 0.5 }}>-</span>}
              </Descriptions.Item>

              <Descriptions.Item label={t('paymentDetail.notes')} span={2}>
                {payment.notes || <span style={{ color: '#999' }}>{t('paymentDetail.noNotes')}</span>}
              </Descriptions.Item>

              <Descriptions.Item label={t('paymentDetail.createdAt')}>
                {formatDateTime(payment.created_at)}
              </Descriptions.Item>

              <Descriptions.Item label={t('paymentDetail.updatedAt')}>
                {formatDateTime(payment.updated_at)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {payment.custom_fields && Object.keys(payment.custom_fields).length > 0 && (
            <Card title={t('paymentDetail.additionalInformation')}>
              <Descriptions column={2} bordered>
                {Object.entries(payment.custom_fields).map(([key, value]) => (
                  <Descriptions.Item key={key} label={key.replace(/_/g, ' ').toUpperCase()}>
                    {String(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <Card title={t('paymentDetail.paymentTimeline')} style={{ marginBottom: 24 }}>
            <Timeline>
              {getPaymentTimeline().map((event, index) => (
                <Timeline.Item key={index} color={event.color} dot={event.icon}>
                  <div>
                    <strong>{event.label}</strong>
                    <div style={{ fontSize: 12, color: '#999' }}>
                      {formatDateTime(event.time)}
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>

          <Card title={t('paymentDetail.summary')}>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>{t('paymentDetail.amountPaid')}:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(payment.amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span>{t('paymentDetail.paymentMethod')}:</span>
                <span>{payment.payment_method.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{t('paymentDetail.status')}:</span>
                <Tag color={paymentStatusColors[payment.status]}>
                  {payment.status.toUpperCase()}
                </Tag>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}