import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Button, Space, Skeleton, Tag, Table, Row, Col,
  Tooltip, Steps, message, Tabs,
  Timeline, Collapse, Modal, Input, Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined, DeleteOutlined, FilePdfOutlined, CopyOutlined,
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { downloadEstimatePdf } from '@/utils/estimate-pdf';
import {
  useEstimate, useDeleteEstimate, useUpdateEstimateStatus,
  useSubmitEstimateForApproval, useAdminApproveEstimate, useAdminRejectEstimate, useGenerateInvoiceFromEstimate,
  useInternalApproveEstimate, useInternalRejectEstimate,
} from '@/hooks/use-estimates';
import { useEstimateLineItems } from '@/hooks/use-estimate-line-items';
import type { EstimateLineItem } from '@/types/models.types';
import PageHeader from '@/components/common/PageHeader';
import { showConfirmDialog } from '@/components/common/ConfirmDialog';
import { PermissionGuard } from '@/components/permissions';
import { formatDateTime } from '@/utils/format-date';
import { formatCurrency } from '@/utils/format-currency';
import ApprovalTrackingView from '@/components/estimates/ApprovalTrackingView';

const statusColors: Record<string, string> = {
  draft: 'default',
  pending_approval: 'orange',
  sent: 'blue',
  viewed: 'cyan',
  approved: 'green',
  rejected: 'red',
  expired: 'orange',
  converted_to_wo: 'purple',
  converted_to_invoice: 'geekblue',
};

// Manual transitions only — `approved` and `converted_to_wo` happen automatically
// when the customer signs via magic link (backend auto-converts to WO after signing)
const statusTransitions: Record<string, string[]> = {
  draft: ['sent'],
  sent: ['viewed', 'rejected', 'expired'],
  viewed: ['rejected', 'expired'],
  approved: [],
  rejected: [],
  expired: [],
  converted_to_wo: [],
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function EstimateDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: estimate, isLoading } = useEstimate(id!);
  const { data: lineItems, isLoading: lineItemsLoading } = useEstimateLineItems(id!);
  const deleteEstimate = useDeleteEstimate();
  const updateStatus = useUpdateEstimateStatus();
  const submitForApproval = useSubmitEstimateForApproval();
  const adminApprove = useAdminApproveEstimate();
  const adminReject = useAdminRejectEstimate();
  const generateInvoice = useGenerateInvoiceFromEstimate();
  const internalApprove = useInternalApproveEstimate();
  const internalReject = useInternalRejectEstimate();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleDelete = () => {
    if (!estimate) return;
    showConfirmDialog({
      title: t('estimateDetail.deleteConfirmTitle'),
      content: t('estimateDetail.deleteConfirmContent', { identifier: estimate.estimate_number || estimate.id }),
      onOk: async () => {
        await deleteEstimate.mutateAsync(estimate.id);
        navigate('/estimates');
      },
      danger: true,
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!estimate) return;
    await updateStatus.mutateAsync({ id: estimate.id, status: newStatus });
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title={t('estimateDetail.detailsTitle')} />
        <Card><Skeleton active /></Card>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div>
        <PageHeader title={t('estimateDetail.notFoundTitle')} />
        <Card>{t('estimateDetail.notFoundMessage')}</Card>
      </div>
    );
  }

  const availableTransitions = statusTransitions[estimate.status] || [];

  // Workflow stepper config
  const statusStepMap: Record<string, number> = {
    draft: 0, sent: 1, viewed: 2, approved: 3, rejected: 2, expired: 1, converted_to_wo: 4,
  };
  const currentStep = statusStepMap[estimate.status] ?? 0;
  const stepStatus = (['rejected', 'expired'].includes(estimate.status) ? 'error' : 'process') as 'process' | 'error';

  // Days until expiry
  const daysUntilExpiry = estimate.expiry_date
    ? Math.ceil((new Date(estimate.expiry_date).getTime() - Date.now()) / 86_400_000)
    : null;

  // Activity timeline
  const cf = estimate.custom_fields as Record<string, unknown> | undefined;
  const isCustomerSigned = !!(cf?.signed_at);
  const signedAt = cf?.signed_at as string | undefined;
  const getTimelineEvents = () => {
    const events = [{ label: t('estimateDetail.timeline.created'), time: estimate.created_at, color: 'gray' }];
    if (['sent', 'viewed', 'approved', 'rejected', 'expired', 'converted_to_wo'].includes(estimate.status))
      events.push({ label: t('estimateDetail.timeline.sentToCustomer'), time: estimate.updated_at, color: 'blue' });
    if (['viewed', 'approved', 'rejected'].includes(estimate.status))
      events.push({ label: t('estimateDetail.timeline.viewedByCustomer'), time: estimate.updated_at, color: 'cyan' });
    if (['approved', 'converted_to_wo'].includes(estimate.status))
      events.push({ label: isCustomerSigned ? t('estimateDetail.timeline.signedAndApproved') : t('estimateDetail.timeline.approvedByCustomer'), time: isCustomerSigned && signedAt ? signedAt : estimate.updated_at, color: 'green' });
    if (estimate.status === 'rejected')
      events.push({ label: t('estimateDetail.timeline.rejectedByCustomer'), time: estimate.updated_at, color: 'red' });
    if (estimate.status === 'converted_to_wo')
      events.push({ label: t('estimateDetail.timeline.convertedToWorkOrder'), time: estimate.updated_at, color: 'purple' });
    return events;
  };

  const lineItemColumns: ColumnsType<EstimateLineItem> = [
    {
      title: t('estimateDetail.columns.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{t(`estimateDetail.lineItemTypes.${type}`, { defaultValue: type.charAt(0).toUpperCase() + type.slice(1) })}</Tag>,
    },
    {
      title: t('estimateDetail.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: t('estimateDetail.columns.description'),
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => desc || <span style={{ opacity: 0.5 }}>-</span>,
    },
    {
      title: t('estimateDetail.columns.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: t('estimateDetail.columns.unitPrice'),
      dataIndex: 'unit_price',
      key: 'unit_price',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: t('estimateDetail.columns.taxRate'),
      dataIndex: 'tax_rate',
      key: 'tax_rate',
      render: (rate: number) => `${rate || 0}%`,
    },
    {
      title: t('estimateDetail.columns.discount'),
      dataIndex: 'discount',
      key: 'discount',
      render: (discount: number) => formatCurrency(discount || 0),
    },
    {
      title: t('estimateDetail.columns.total'),
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => <span style={{ fontWeight: 500 }}>{formatCurrency(total)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('estimateDetail.title', { number: estimate.estimate_number || '' })}
        onBack={() => navigate('/estimates')}
        extra={
          <Space>
            {(() => {
              const canDownload = ['approved', 'converted_to_wo'].includes(estimate.status);
              return (
                <Tooltip
                  title={
                    !canDownload
                      ? t('estimateDetail.pdfUnavailableTooltip')
                      : ''
                  }
                >
                  <Button
                    icon={<FilePdfOutlined />}
                    disabled={!canDownload}
                    onClick={() => downloadEstimatePdf(estimate, lineItems || [])}
                  >
                    {t('estimateDetail.actions.downloadPdf')}
                  </Button>
                </Tooltip>
              );
            })()}
            <PermissionGuard permission="estimates:update">
              <Button icon={<EditOutlined />} onClick={() => navigate(`/estimates/${estimate.id}/edit`)}>
                {t('estimateDetail.actions.edit')}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="estimates:delete">
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                {t('estimateDetail.actions.delete')}
              </Button>
            </PermissionGuard>
          </Space>
        }
      />

      {/* ── On-site estimate internal approval actions ── */}
      {estimate.estimate_type === 'on_site' && estimate.status === 'pending_internal_approval' && (
        <Card
          style={{ marginBottom: 16, borderColor: '#faad14' }}
          title={<span style={{ color: '#d48806' }}>Manager Review Required — On-Site Estimate</span>}
        >
          <Alert
            message={`Technician submitted an on-site estimate of ${formatCurrency(estimate.total || 0)}. Please review the line items and approve or reject.`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Space>
            <PermissionGuard permission="estimates:update">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={internalApprove.isPending}
                onClick={() => showConfirmDialog({
                  title: 'Approve & Send to Customer',
                  content: 'This will approve the estimate and send a review link to the customer via email.',
                  onOk: async () => { await internalApprove.mutateAsync(estimate.id); },
                })}
              >
                Approve &amp; Send to Customer
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="estimates:update">
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setRejectModalOpen(true)}
              >
                Reject &amp; Send Back
              </Button>
            </PermissionGuard>
          </Space>
        </Card>
      )}

      {/* ── Status banners for on-site estimates ── */}
      {estimate.estimate_type === 'on_site' && estimate.status === 'revision_required' && (
        <Alert
          message="Revision Required"
          description={`Manager feedback: ${estimate.internal_rejection_reason || 'Please revise the estimate.'}`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {estimate.estimate_type === 'on_site' && estimate.status === 'pending_customer_approval' && (
        <Alert
          message="Waiting for Customer Approval"
          description="The estimate has been sent to the customer for review and signature."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {estimate.estimate_type === 'on_site' && estimate.status === 'customer_approved' && (
        <Alert
          message="Customer Approved"
          description={`Signed by: ${estimate.customer_name_signed || 'Customer'}`}
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {estimate.estimate_type === 'on_site' && estimate.status === 'customer_rejected' && (
        <Alert
          message="Customer Declined"
          description={`Reason: ${estimate.customer_rejection_reason || 'No reason given.'}`}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* ── Workflow progress stepper ── */}
      <Card
        size="small"
        style={{ marginBottom: 16 }}
        bodyStyle={{ padding: '10px 20px' }}
      >
        <Steps
          current={currentStep}
          status={stepStatus}
          size="small"
          labelPlacement="vertical"
          items={[
            { title: t('estimateDetail.steps.draft') },
            { title: t('estimateDetail.steps.sent') },
            { title: t('estimateDetail.steps.viewed') },
            { title: t('estimateDetail.steps.approved') },
            { title: t('estimateDetail.steps.workOrder') },
          ]}
        />
      </Card>

      {/* ── Internal rejection modal ── */}
      <Modal
        title="Reject & Send Back for Revision"
        open={rejectModalOpen}
        onCancel={() => { setRejectModalOpen(false); setRejectReason(''); }}
        onOk={async () => {
          if (!rejectReason.trim()) { message.error('Please enter a rejection reason'); return; }
          await internalReject.mutateAsync({ id: estimate.id, reason: rejectReason });
          setRejectModalOpen(false);
          setRejectReason('');
        }}
        confirmLoading={internalReject.isPending}
        okText="Reject & Send Back"
        okButtonProps={{ danger: true }}
      >
        <p>The technician will be notified with your feedback and asked to revise the estimate.</p>
        <Input.TextArea
          rows={4}
          placeholder="Enter rejection reason (required)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card bodyStyle={{ padding: 0 }}>
            {/* Status transitions bar */}
            {availableTransitions.length > 0 && (
              <div style={{ padding: '10px 16px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                <Space wrap>
                  <span style={{ fontWeight: 500, color: '#666', fontSize: 13 }}>{t('estimateDetail.transitionTo')}</span>
                  {availableTransitions.map((status) => (
                    <Button key={status} type="primary" size="small" loading={updateStatus.isPending} onClick={() => handleStatusChange(status)}>
                      {t(`estimateDetail.statuses.${status}`, { defaultValue: formatStatus(status) })}
                    </Button>
                  ))}
                </Space>
              </div>
            )}

            <Tabs
              defaultActiveKey="overview"
              size="large"
              style={{ padding: '0 16px' }}
              items={[
                {
                  key: 'overview',
                  label: t('estimateDetail.tabs.overview'),
                  children: (
                    <div style={{ paddingBottom: 24 }}>
                      <Descriptions
                        column={2}
                        labelStyle={{ color: '#888', width: 130, paddingBottom: 16 }}
                        contentStyle={{ fontWeight: 500, paddingBottom: 16 }}
                        style={{ marginBottom: 8 }}
                      >
                        <Descriptions.Item label={t('estimateDetail.fields.customer')}>
                          {estimate.contact
                            ? `${estimate.contact.first_name} ${estimate.contact.last_name}`
                            : <span style={{ color: '#bbb' }}>—</span>}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('estimateDetail.fields.status')}>
                          <Tag color={statusColors[estimate.status] || 'default'}>
                            {t(`estimateDetail.statuses.${estimate.status}`, { defaultValue: formatStatus(estimate.status) })}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('estimateDetail.fields.estimateNo')}>
                          <Space size={4}>
                            <span>{estimate.estimate_number || '���'}</span>
                            {estimate.estimate_number && (
                              <CopyOutlined
                                style={{ fontSize: 11, color: '#bbb', cursor: 'pointer' }}
                                onClick={() => { void navigator.clipboard.writeText(estimate.estimate_number!); void message.success(t('estimateDetail.messages.copied')); }}
                              />
                            )}
                          </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label={t('estimateDetail.fields.expiryDate')}>
                          {estimate.expiry_date
                            ? <span style={{ color: daysUntilExpiry !== null && daysUntilExpiry <= 0 ? '#ff4d4f' : daysUntilExpiry !== null && daysUntilExpiry <= 3 ? '#fa8c16' : undefined }}>
                                {formatDateTime(estimate.expiry_date)}
                              </span>
                            : <span style={{ color: '#bbb' }}>—</span>}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('estimateDetail.fields.scheduledDate')}>
                          {estimate.scheduled_start ? formatDateTime(estimate.scheduled_start) : <span style={{ color: '#bbb' }}>—</span>}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('estimateDetail.fields.created')}>
                          {formatDateTime(estimate.created_at)}
                        </Descriptions.Item>
                        <Descriptions.Item label={t('estimateDetail.fields.lastUpdated')}>
                          {formatDateTime(estimate.updated_at)}
                        </Descriptions.Item>
                      </Descriptions>

                      <Descriptions
                        column={4}
                        bordered
                        labelStyle={{ color: '#888', textAlign: 'center', fontSize: 12, padding: '12px 8px' }}
                        contentStyle={{ textAlign: 'center', fontWeight: 500, padding: '12px 8px' }}
                        style={{ marginBottom: estimate.notes ? 24 : 0 }}
                      >
                        <Descriptions.Item label={t('estimateDetail.fields.subtotal')}>{formatCurrency(estimate.subtotal || 0)}</Descriptions.Item>
                        <Descriptions.Item label={t('estimateDetail.fields.tax')}>{formatCurrency(estimate.tax || 0)}</Descriptions.Item>
                        <Descriptions.Item label={t('estimateDetail.fields.discount')}>−{formatCurrency(estimate.discount || 0)}</Descriptions.Item>
                        <Descriptions.Item label={t('estimateDetail.fields.total')}>
                          <span style={{ fontWeight: 700, color: '#1677ff' }}>{formatCurrency(estimate.total || 0)}</span>
                        </Descriptions.Item>
                      </Descriptions>

                      {estimate.notes && (
                        <Descriptions column={1} labelStyle={{ color: '#888', paddingBottom: 16 }} contentStyle={{ paddingBottom: 16 }}>
                          <Descriptions.Item label={t('estimateDetail.fields.notes')}>
                            <span style={{ color: '#555' }}>{estimate.notes}</span>
                          </Descriptions.Item>
                        </Descriptions>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'line-items',
                  label: (() => {
                    const n = (lineItems || estimate.line_items || []).length;
                    return n > 0 ? t('estimateDetail.tabs.lineItemsWithCount', { count: n }) : t('estimateDetail.tabs.lineItems');
                  })(),
                  children: (
                    <div style={{ paddingBottom: 16 }}>
                      <Table
                        columns={lineItemColumns}
                        dataSource={lineItems || estimate.line_items || []}
                        rowKey="id"
                        loading={lineItemsLoading}
                        pagination={false}
                        locale={{ emptyText: t('estimateDetail.lineItemsEmpty') }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                        <Descriptions
                          column={1}
                          size="small"
                          bordered
                          style={{ width: 280 }}
                          labelStyle={{ color: '#888' }}
                          contentStyle={{ fontWeight: 500, textAlign: 'right' }}
                        >
                          <Descriptions.Item label={t('estimateDetail.fields.subtotal')}>{formatCurrency(estimate.subtotal || 0)}</Descriptions.Item>
                          <Descriptions.Item label={t('estimateDetail.fields.tax')}>{formatCurrency(estimate.tax || 0)}</Descriptions.Item>
                          <Descriptions.Item label={t('estimateDetail.fields.discount')}>−{formatCurrency(estimate.discount || 0)}</Descriptions.Item>
                          <Descriptions.Item label={<span style={{ fontWeight: 600 }}>{t('estimateDetail.fields.total')}</span>}>
                            <span style={{ fontWeight: 700, color: '#1677ff', fontSize: 15 }}>{formatCurrency(estimate.total || 0)}</span>
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Card>

          <Collapse
            style={{ marginTop: 16 }}
            expandIconPosition="end"
            items={[
              {
                key: 'activity',
                label: (
                  <Space size={8}>
                    <ClockCircleOutlined />
                    <span style={{ fontWeight: 500 }}>{t('estimateDetail.activity.title')}</span>
                  </Space>
                ),
                children: (
                  <Timeline
                    style={{ marginTop: 8 }}
                    items={getTimelineEvents().map((event, i) => ({
                      key: i,
                      color: event.color,
                      children: (
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{event.label}</div>
                          <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{formatDateTime(event.time)}</div>
                        </div>
                      ),
                    }))}
                  />
                ),
              },
            ]}
          />
        </Col>

        <Col xs={24} lg={8}>
          {/* ── Technician: Submit for Approval ── */}
          {estimate.status === 'draft' && (
            <Card style={{ marginBottom: 16 }}>
              <PermissionGuard permission="estimates:update">
                <Button
                  block
                  type="primary"
                  icon={<SendOutlined />}
                  loading={submitForApproval.isPending}
                  onClick={() => {
                    showConfirmDialog({
                      title: t('estimateDetail.submitConfirmTitle'),
                      content: t('estimateDetail.submitConfirmContent'),
                      onOk: async () => { await submitForApproval.mutateAsync(estimate.id); },
                    });
                  }}
                >
                  {t('estimateDetail.actions.submitForApproval')}
                </Button>
              </PermissionGuard>
            </Card>
          )}

          {/* ── Admin/Dispatcher: Approve or Reject ── */}
          {estimate.status === 'pending_approval' && (
            <Card title={t('estimateDetail.pendingApprovalTitle')} style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <PermissionGuard permission="estimates:update">
                  <Button
                    block
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={adminApprove.isPending}
                    onClick={() => {
                      showConfirmDialog({
                        title: t('estimateDetail.approveConfirmTitle'),
                        content: t('estimateDetail.approveConfirmContent'),
                        onOk: async () => { await adminApprove.mutateAsync(estimate.id); },
                      });
                    }}
                  >
                    {t('estimateDetail.actions.approve')}
                  </Button>
                  <Button
                    block
                    danger
                    icon={<CloseCircleOutlined />}
                    loading={adminReject.isPending}
                    onClick={() => {
                      showConfirmDialog({
                        title: t('estimateDetail.rejectConfirmTitle'),
                        content: t('estimateDetail.rejectConfirmContent'),
                        onOk: async () => { await adminReject.mutateAsync({ id: estimate.id }); },
                        danger: true,
                      });
                    }}
                  >
                    {t('estimateDetail.actions.reject')}
                  </Button>
                </PermissionGuard>
              </Space>
            </Card>
          )}

          {/* ── Generate Invoice ── */}
          {estimate.status === 'approved' && (
            <Card style={{ marginBottom: 16 }}>
              <PermissionGuard permission="invoices:create">
                <Button
                  block
                  type="primary"
                  icon={<FileTextOutlined />}
                  loading={generateInvoice.isPending}
                  onClick={async () => {
                    const res = await generateInvoice.mutateAsync(estimate.id);
                    const inv = res.data.data;
                    if (inv?.id) navigate(`/invoices/${inv.id}`);
                  }}
                >
                  {t('estimateDetail.actions.generateInvoice')}
                </Button>
              </PermissionGuard>
            </Card>
          )}

          <ApprovalTrackingView estimate={estimate} />
        </Col>
      </Row>

    </div>
  );
}