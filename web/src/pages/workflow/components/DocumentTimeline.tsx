import { useMemo } from 'react';
import { Timeline, Spin, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  MinusCircleOutlined,
  SwapOutlined,
  FileAddOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useApprovalsByDocument, useHistoryByDocument } from '@/hooks/use-workflow';
import { formatDateTime } from '@/utils/format-date';
import type { DocumentApproval, ApprovalHistory } from '@/types/workflow.types';

const { Text } = Typography;

const statusColors: Record<string, string> = {
  PENDING: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
  SKIPPED: 'default',
  CORRECTION_REQUIRED: 'gold',
};

const actionIcons: Record<string, React.ReactNode> = {
  APPROVE: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  REJECT: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  REQUEST_CORRECTION: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
  SKIP: <MinusCircleOutlined style={{ opacity: 0.5 }} />,
  DELEGATE: <SwapOutlined style={{ color: '#1890ff' }} />,
  ESCALATE: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
};

const statusIcons: Record<string, React.ReactNode> = {
  APPROVED: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  REJECTED: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
  PENDING: <ClockCircleOutlined style={{ color: '#faad14' }} />,
  SKIPPED: <MinusCircleOutlined style={{ opacity: 0.5 }} />,
  CORRECTION_REQUIRED: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
};

interface TimelineEntry {
  type: 'created' | 'submitted' | 'action' | 'pending';
  timestamp: string;
  order_no?: number;
  data: DocumentApproval | ApprovalHistory | null;
}

interface DocumentTimelineProps {
  documentId: string;
}

export default function DocumentTimeline({ documentId }: DocumentTimelineProps) {
  const { t } = useTranslation();
  const { data: steps, isLoading: stepsLoading } = useApprovalsByDocument(documentId);
  const { data: history, isLoading: historyLoading } = useHistoryByDocument(documentId);

  const isLoading = stepsLoading || historyLoading;

  const timelineItems = useMemo(() => {
    if (!steps || steps.length === 0) return [];

    const entries: TimelineEntry[] = [];
    const sorted = [...steps].sort((a, b) => a.order_no - b.order_no);

    const firstStep = sorted[0];
    entries.push({
      type: 'created',
      timestamp: firstStep.created_at,
      data: firstStep,
    });

    entries.push({
      type: 'submitted',
      timestamp: firstStep.created_at,
      order_no: firstStep.order_no,
      data: firstStep,
    });

    if (history && history.length > 0) {
      for (const h of history) {
        entries.push({
          type: 'action',
          timestamp: h.created_at,
          data: h,
        });
      }
    }

    for (const step of sorted) {
      if (step.status === 'PENDING') {
        entries.push({
          type: 'pending',
          timestamp: step.updated_at || step.created_at,
          order_no: step.order_no,
          data: step,
        });
      }
    }

    entries.sort((a, b) => {
      if (a.type === 'pending' && b.type !== 'pending') return 1;
      if (a.type !== 'pending' && b.type === 'pending') return -1;
      if (a.type === 'created' && b.type !== 'created') return -1;
      if (a.type !== 'created' && b.type === 'created') return 1;
      if (a.type === 'submitted' && b.type !== 'submitted' && b.type !== 'created') return -1;
      if (a.type !== 'submitted' && a.type !== 'created' && b.type === 'submitted') return 1;
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    return entries;
  }, [steps, history]);

  if (isLoading) {
    return <Spin style={{ display: 'block', padding: 24 }} />;
  }

  if (!steps || steps.length === 0) {
    return <Text type="secondary" style={{ padding: 16 }}>{t('documentTimeline.noStepsFound')}</Text>;
  }

  const docType = steps[0]?.document_type?.replace(/_/g, ' ') || t('documentTimeline.document');

  return (
    <div style={{ padding: '12px 24px' }}>
      <Timeline
        items={timelineItems.map((entry) => {
          if (entry.type === 'created') {
            return {
              dot: <FileAddOutlined style={{ color: '#1890ff' }} />,
              children: (
                <div>
                  <Text strong>{t('documentTimeline.submittedForApproval', { docType })}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDateTime(entry.timestamp)}
                  </Text>
                </div>
              ),
            };
          }

          if (entry.type === 'submitted') {
            const step = entry.data as DocumentApproval;
            const totalSteps = steps.length;
            return {
              dot: <SendOutlined style={{ color: '#722ed1' }} />,
              children: (
                <div>
                  <Text strong>{t('documentTimeline.chainStarted')}</Text>
                  <Tag color="purple" style={{ marginLeft: 8 }}>
                    {t('documentTimeline.stepCount', { count: totalSteps })}
                  </Tag>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('documentTimeline.workflow')}: {step.workflow_template?.name || t('documentTimeline.unknown')}
                  </Text>
                </div>
              ),
            };
          }

          if (entry.type === 'action') {
            const h = entry.data as ApprovalHistory;
            const actorName = h.actor
              ? `${h.actor.first_name} ${h.actor.last_name}`
              : h.actor_id.slice(0, 8);
            const actionLabel = h.action.replace(/_/g, ' ');

            return {
              dot: actionIcons[h.action] || <ClockCircleOutlined />,
              children: (
                <div>
                  <div>
                    <Text strong>{actionLabel}</Text>
                    <span style={{ marginLeft: 8, opacity: 0.5 }}>{t('documentTimeline.by', { actorName })}</span>
                    <Tag
                      color={statusColors[h.new_status] || 'default'}
                      style={{ marginLeft: 8 }}
                    >
                      {h.new_status.replace(/_/g, ' ')}
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDateTime(h.created_at)}
                  </Text>
                  {h.comments && (
                    <div>
                      <Text italic style={{ fontSize: 12, opacity: 0.5 }}>
                        &ldquo;{h.comments}&rdquo;
                      </Text>
                    </div>
                  )}
                </div>
              ),
            };
          }

          if (entry.type === 'pending') {
            const step = entry.data as DocumentApproval;
            const approverName = step.approver
              ? `${step.approver.first_name} ${step.approver.last_name}`
              : step.approver_id.slice(0, 8);

            return {
              dot: statusIcons[step.status] || <ClockCircleOutlined />,
              children: (
                <div>
                  <div>
                    <Text strong>{t('documentTimeline.stepNumber', { number: step.order_no })} — {approverName}</Text>
                    <Tag color="orange" style={{ marginLeft: 8 }}>{t('documentTimeline.pending')}</Tag>
                  </div>
                  <Text type="secondary" italic style={{ fontSize: 12 }}>
                    {t('documentTimeline.awaitingReview')}
                  </Text>
                  {step.due_date && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {t('documentTimeline.due')}: {formatDateTime(step.due_date)}
                      </Text>
                    </div>
                  )}
                </div>
              ),
            };
          }

          return { children: null };
        })}
      />
    </div>
  );
}