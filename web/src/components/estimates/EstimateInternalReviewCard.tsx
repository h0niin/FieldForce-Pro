import { useState } from 'react';
import {
  Card, Space, Tag, Modal, Input, Alert, Typography, Progress, Spin, Avatar, Button,
} from 'antd';
import {
  TeamOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ExclamationCircleOutlined, LoadingOutlined, UserOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useApprovalsByDocument, useProcessApproval } from '@/hooks/use-workflow';
import { useMe } from '@/hooks/use-auth';
import { formatDateTime } from '@/utils/format-date';
import { formatCurrency } from '@/utils/format-currency';

interface EstimateInternalReviewCardProps {
  estimateId: string;
  estimateNumber?: string | null;
  estimateStatus?: string;
  estimateTotal?: number;
  defaultExpanded?: boolean;
  onAllApproved?: (estimateId: string) => void;
}

const statusColors: Record<string, string> = {
  draft: 'default',
  sent: 'blue',
  viewed: 'cyan',
  approved: 'green',
  rejected: 'red',
  expired: 'orange',
  converted_to_wo: 'purple',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

const getApprovalStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED': return '#52c41a';
    case 'REJECTED': return '#ff4d4f';
    case 'PENDING': return '#1677ff';
    default: return '#d9d9d9';
  }
};

export default function EstimateInternalReviewCard({
  estimateId,
  estimateNumber,
  estimateStatus,
  estimateTotal,
  defaultExpanded = true,
  onAllApproved,
}: EstimateInternalReviewCardProps) {
  const { t } = useTranslation();
  const { data: internalApprovals, isLoading: approvalsLoading } = useApprovalsByDocument(estimateId);
  const processApproval = useProcessApproval();
  const { data: me } = useMe();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectComments, setRejectComments] = useState('');
  const [collapsed, setCollapsed] = useState(!defaultExpanded);

  const hasApprovals = (internalApprovals?.length ?? 0) > 0;
  const approvedCount = internalApprovals?.filter((a) => ['APPROVED', 'SKIPPED'].includes(a.status)).length ?? 0;
  const totalCount = internalApprovals?.length ?? 0;
  const allApproved = hasApprovals && approvedCount === totalCount;
  const anyRejected = internalApprovals?.some((a) => a.status === 'REJECTED');

  const getApprovalStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED': return t('estimateReview.status.approved');
      case 'REJECTED': return t('estimateReview.status.rejected');
      case 'PENDING': return t('estimateReview.status.pending');
      case 'SKIPPED': return t('estimateReview.status.skipped');
      default: return status;
    }
  };

  const handleApprove = async (approvalId: string) => {
    await processApproval.mutateAsync({ id: approvalId, action: 'APPROVE' });
    const pendingCount = internalApprovals?.filter((a) => a.status === 'PENDING').length ?? 0;
    if (pendingCount <= 1 && onAllApproved) {
      onAllApproved(estimateId);
    }
  };

  if (!approvalsLoading && !hasApprovals) return null;

  return (
    <>
      <Card
        size="small"
        style={{ marginBottom: 12 }}
        title={
          <div
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            onClick={() => setCollapsed((c) => !c)}
          >
            <Space size={8}>
              <TeamOutlined />
              <span style={{ fontWeight: 500 }}>
                {estimateNumber || estimateId.slice(0, 8)}
              </span>
              {estimateStatus && (
                <Tag color={statusColors[estimateStatus] || 'default'} style={{ margin: 0 }}>
                  {formatStatus(estimateStatus)}
                </Tag>
              )}
              {estimateTotal != null && (
                <span style={{ color: '#1677ff', fontWeight: 600, fontSize: 13 }}>
                  {formatCurrency(estimateTotal)}
                </span>
              )}
            </Space>
            <Space size={8}>
              {hasApprovals && (
                <Tag
                  color={allApproved ? 'success' : anyRejected ? 'error' : 'processing'}
                  style={{ margin: 0 }}
                >
                  {approvedCount}/{totalCount}
                </Tag>
              )}
              <span style={{ fontSize: 12, opacity: 0.5 }}>{collapsed ? t('estimateReview.expand') : t('estimateReview.collapse')}</span>
            </Space>
          </div>
        }
      >
        {collapsed ? null : approvalsLoading ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Spin indicator={<LoadingOutlined />} />
            <div style={{ marginTop: 8, opacity: 0.5, fontSize: 13 }}>{t('estimateReview.loadingApprovers')}</div>
          </div>
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>{t('estimateReview.progress')}</Typography.Text>
                <Typography.Text strong style={{ fontSize: 13 }}>{approvedCount} / {totalCount}</Typography.Text>
              </div>
              <Progress
                percent={totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0}
                strokeColor={anyRejected ? '#ff4d4f' : allApproved ? '#52c41a' : '#1677ff'}
                size="small"
              />
            </div>

            {internalApprovals?.find((a) => a.status === 'PENDING') && !anyRejected && (() => {
              const pending = internalApprovals.find((a) => a.status === 'PENDING')!;
              const approver = pending.approver as Record<string, unknown> | undefined;
              return (
                <Alert
                  message={
                    <Space size={4}>
                      <ExclamationCircleOutlined />
                      <span>{t('estimateReview.waitingFor', { name: `${approver?.first_name} ${approver?.last_name}` })}</span>
                    </Space>
                  }
                  type="warning"
                />
              );
            })()}

            {allApproved && (
              <Alert
                message={t('estimateReview.allApproved')}
                type="success"
                showIcon
                action={onAllApproved ? (
                  <Button
                    size="small"
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => onAllApproved(estimateId)}
                  >
                    {t('estimateReview.sendNow')}
                  </Button>
                ) : undefined}
              />
            )}
            {anyRejected && <Alert message={t('estimateReview.rejectedAlert')} type="error" showIcon />}

            <div>
              {internalApprovals!.map((a, index) => {
                const approver = a.approver as Record<string, unknown> | undefined;
                const firstName = approver?.first_name as string || '';
                const lastName = approver?.last_name as string || '';
                const email = approver?.email as string || '';
                const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                const isPending = a.status === 'PENDING';
                const isMyPending = isPending && me && a.approver_id === me.id;
                const isLast = index === internalApprovals!.length - 1;
                const dotColor = getApprovalStatusColor(a.status);
                return (
                  <div key={a.id} style={{ display: 'flex', gap: 10, paddingBottom: isLast ? 0 : 4 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: dotColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                        {a.status === 'APPROVED' ? '✓' : a.status === 'REJECTED' ? '✗' : a.status === 'SKIPPED' ? '—' : index + 1}
                      </div>
                      {!isLast && <div style={{ width: 2, flex: 1, minHeight: 12, background: 'var(--border-color)', marginTop: 3, marginBottom: 3 }} />}
                    </div>
                    <div style={{ flex: 1, marginBottom: isLast ? 0 : 6, padding: '8px 12px', borderRadius: 8, border: '1px solid ' + (isPending ? 'rgba(22, 119, 255, 0.25)' : 'var(--border-color)'), background: isPending ? 'rgba(22, 119, 255, 0.08)' : 'var(--bg-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size={28} style={{ background: dotColor, flexShrink: 0, fontSize: 11 }}>{initials || <UserOutlined />}</Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{firstName} {lastName}</div>
                          <div style={{ fontSize: 12, opacity: 0.5 }}>{email}</div>
                        </div>
                        <Tag color={a.status === 'APPROVED' ? 'success' : a.status === 'REJECTED' ? 'error' : a.status === 'PENDING' ? 'processing' : 'default'} style={{ marginRight: 0, flexShrink: 0 }}>
                          {getApprovalStatusLabel(a.status)}
                        </Tag>
                      </div>
                      {a.action_date && <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4, paddingLeft: 36 }}>{formatDateTime(a.action_date)}</div>}
                      {'comments' in a && !!(a as unknown as Record<string, unknown>).comments && <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4, paddingLeft: 36, fontStyle: 'italic' }}>&quot;{String((a as unknown as Record<string, unknown>).comments)}&quot;</div>}
                      {isMyPending && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(22, 119, 255, 0.25)', display: 'flex', gap: 6, paddingLeft: 36 }}>
                          <Button
                            type="primary"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            loading={processApproval.isPending}
                            onClick={() => void handleApprove(a.id)}
                          >
                            {t('estimateReview.approve')}
                          </Button>
                          <Button danger size="small" icon={<CloseCircleOutlined />} onClick={() => { setRejectId(a.id); setRejectComments(''); }}>{t('estimateReview.reject')}</Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Space>
        )}
      </Card>

      <Modal
        title={t('estimateReview.rejectModal.title')}
        open={!!rejectId}
        onOk={async () => {
          if (!rejectId) return;
          await processApproval.mutateAsync({ id: rejectId, action: 'REJECT', comments: rejectComments || undefined });
          setRejectId(null);
          setRejectComments('');
        }}
        onCancel={() => { setRejectId(null); setRejectComments(''); }}
        okText={t('estimateReview.rejectModal.confirm')}
        okButtonProps={{ danger: true }}
        confirmLoading={processApproval.isPending}
      >
        <Alert message={t('estimateReview.rejectModal.warning')} type="warning" showIcon style={{ marginBottom: 16 }} />
        <Typography.Text type="secondary">{t('estimateReview.rejectModal.commentsLabel')}</Typography.Text>
        <Input.TextArea rows={4} value={rejectComments} onChange={(e) => setRejectComments(e.target.value)} placeholder={t('estimateReview.rejectModal.placeholder')} style={{ marginTop: 8 }} />
      </Modal>
    </>
  );
}