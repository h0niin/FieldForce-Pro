import { useEffect } from 'react';
import { Alert, Space, Tag, Typography, List, Tooltip } from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useCheckAvailability, useDetectConflicts } from '@/hooks/use-scheduling';
import { formatDateTime } from '@/utils/format-date';

const { Text } = Typography;

interface ConflictDetectionAlertProps {
  /** Technician (agent) ID to check */
  agentId: string;
  /** Proposed start time (ISO string) */
  startTime: string;
  /** Proposed end time (ISO string) */
  endTime: string;
  /** Appointment ID to exclude (when editing an existing appointment) */
  excludeAppointmentId?: string;
  /** Whether to auto-trigger the check when props change */
  autoCheck?: boolean;
  /** Callback when conflict status changes */
  onConflictChange?: (hasConflicts: boolean) => void;
}

/**
 * Inline alert component that checks for scheduling conflicts
 * when assigning or rescheduling a technician.
 *
 * Usage:
 * ```tsx
 * <ConflictDetectionAlert
 *   agentId={selectedAgentId}
 *   startTime={scheduledStart}
 *   endTime={scheduledEnd}
 *   autoCheck
 *   onConflictChange={(has) => setHasConflict(has)}
 * />
 * ```
 */
export default function ConflictDetectionAlert({
  agentId,
  startTime,
  endTime,
  excludeAppointmentId,
  autoCheck = true,
  onConflictChange,
}: ConflictDetectionAlertProps) {
  const { t } = useTranslation();
  const availability = useCheckAvailability();
  const conflictCheck = useDetectConflicts();

  const result = availability.data?.data;
  const conflicts = conflictCheck.data?.data;

  // Auto-check when all required props are available
  useEffect(() => {
    if (!autoCheck || !agentId || !startTime || !endTime) return;

    const timer = setTimeout(() => {
      availability.mutate({ agent_id: agentId, start_time: startTime, end_time: endTime });
      conflictCheck.mutate({
        agent_id: agentId,
        start_time: startTime,
        end_time: endTime,
        exclude_appointment_id: excludeAppointmentId,
      });
    }, 500); // debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, startTime, endTime, excludeAppointmentId, autoCheck]);

  // Notify parent of conflict state
  useEffect(() => {
    if (onConflictChange && result !== undefined) {
      onConflictChange(!result.available);
    }
  }, [result, onConflictChange]);

  const isLoading = availability.isPending || conflictCheck.isPending;

  if (!agentId || !startTime || !endTime) {
    return null;
  }

  if (isLoading) {
    return (
      <Alert
        type="info"
        icon={<ClockCircleOutlined spin />}
        message={t('conflictAlert.checkingAvailability')}
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  if (!result) {
    return null;
  }

  // Available — no conflicts
  if (result.available) {
    return (
      <Alert
        type="success"
        icon={<CheckCircleOutlined />}
        message={t('conflictAlert.technicianAvailable')}
        description={t('conflictAlert.noConflicts')}
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  // Not available — show conflicts
  return (
    <div style={{ marginBottom: 16 }}>
      <Alert
        type="error"
        icon={<WarningOutlined />}
        message={t('conflictAlert.conflictDetected')}
        description={
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {result.reasons.map((reason, i) => (
              <Text key={i} type="danger">
                <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                {reason}
              </Text>
            ))}

            {conflicts && conflicts.conflicts.length > 0 && (
              <List
                size="small"
                header={<Text strong>{t('conflictAlert.conflictingAppointments')}</Text>}
                dataSource={conflicts.conflicts}
                renderItem={(item: any) => (
                  <List.Item>
                    <Space>
                      <Tag color="red">{t('conflictAlert.conflictTag')}</Tag>
                      <Text>
                        {formatDateTime(item.scheduled_start)} — {formatDateTime(item.scheduled_end)}
                      </Text>
                      {item.status && (
                        <Tag>{item.status.replace(/_/g, ' ')}</Tag>
                      )}
                      {item.work_order_id && (
                        <Tooltip title={t('conflictAlert.workOrderIdTooltip')}>
                          <Text type="secondary" copyable={{ text: item.work_order_id }}>
                            {item.work_order_id.slice(0, 8)}...
                          </Text>
                        </Tooltip>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Space>
        }
        showIcon
      />
    </div>
  );
}
