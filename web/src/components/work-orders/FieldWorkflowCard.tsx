import React, { useState, useEffect } from 'react';
import { Alert, Card, Skeleton, Tag } from 'antd';
import { CarOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useWorkOrderSession, useInitSession } from '@/hooks/use-work-order-technician';
import { useWorkOrderAppointments } from '@/hooks/use-appointments';
import { useMe } from '@/hooks/use-auth';
import { TechnicianWorkflowTimeline } from './TechnicianWorkflowTimeline';
import { TechnicianWorkflowPanel } from './TechnicianWorkflowPanel';
import type { WorkOrder } from '@/types/models.types';
import { Button } from 'antd';

const statusColors: Record<string, string> = {
  new: 'blue',
  estimated: 'gold',
  approved: 'green',
  scheduled: 'cyan',
  in_progress: 'processing',
  on_hold: 'orange',
  completed: 'green',
  closed: 'default',
  cancelled: 'red',
};

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

class FieldWorkflowErrorBoundary extends React.Component<
  { children: React.ReactNode; t: any },
  { hasError: boolean; error: string | null }
> {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <Alert
          type="error"
          showIcon
          message={this.props.t('fieldWorkflow.errorTitle')}
          description={this.state.error ?? this.props.t('fieldWorkflow.errorMessage')}
          style={{ margin: 16 }}
        />
      );
    }
    return this.props.children;
  }
}

interface FieldWorkflowCardProps {
  workOrderId: string;
  workOrder: WorkOrder;
  defaultExpanded?: boolean;
}

export default function FieldWorkflowCard({ workOrderId, workOrder, defaultExpanded = false }: FieldWorkflowCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { data: me } = useMe();
  const { data: session, isLoading: sessionLoading } = useWorkOrderSession(workOrderId);
  const initSession = useInitSession(workOrderId);
  const { data: appointments } = useWorkOrderAppointments(workOrderId);

  // Determine if current user is assigned technician
  const isAssignedByWO = !!(me && workOrder.assigned_to === me.id);
  const isAssignedBySession = !!(me && session && (session as unknown as Record<string, unknown>).user_id === me.id);
  const isAssignedByAppointment = !!(
    me &&
    appointments &&
    appointments.some((a) => a.agent_id === me.id)
  );
  const isAssignedTechnician = isAssignedByWO || isAssignedBySession || isAssignedByAppointment;

  // Auto-init session when expanded and assigned
  useEffect(() => {
    if (expanded && !sessionLoading && session === null && !initSession.isPending && isAssignedTechnician) {
      initSession.mutate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, sessionLoading, session, isAssignedTechnician]);

  // Sync with defaultExpanded changes (e.g. from notification deep-link)
  useEffect(() => {
    if (defaultExpanded) setExpanded(true);
  }, [defaultExpanded]);

  return (
    <Card
      size="small"
      style={{ borderRadius: 10, marginBottom: 12 }}
      styles={{ body: { padding: expanded ? 16 : 0 } }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: expanded ? '0 0 12px 0' : 16,
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {expanded ? <DownOutlined style={{ fontSize: 12 }} /> : <RightOutlined style={{ fontSize: 12 }} />}
          <CarOutlined style={{ fontSize: 16, color: '#1677ff' }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {workOrder.wo_number || t('fieldWorkflow.workOrder')}
          </span>
          <Tag color={statusColors[workOrder.status] || 'default'}>
            {formatStatus(workOrder.status)}
          </Tag>
        </div>
        <span style={{ fontSize: 12, color: '#999' }}>{workOrder.summary}</span>
      </div>

      {expanded && (
        <FieldWorkflowErrorBoundary t={t}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isAssignedTechnician ? '280px 1fr' : '1fr',
            gap: 16,
            alignItems: 'start',
          }}>
            <Card size="small" style={{ borderRadius: 10 }} styles={{ body: { padding: '16px' } }}>
              <TechnicianWorkflowTimeline
                workOrderId={workOrderId}
                assignedTo={workOrder.assigned_to}
              />
            </Card>

            {isAssignedTechnician && (
              <div>
                {sessionLoading || initSession.isPending ? (
                  <Card size="small" style={{ borderRadius: 10 }}>
                    <Skeleton active paragraph={{ rows: 4 }} />
                  </Card>
                ) : session === null ? (
                  <Card
                    size="small"
                    style={{ borderRadius: 10, border: '1px dashed #91caff', background: '#e6f4ff' }}
                  >
                    <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                      <CarOutlined style={{ fontSize: 40, color: '#1677ff', display: 'block', margin: '0 auto 12px' }} />
                      <Alert
                        type="info"
                        showIcon
                        message={t('fieldWorkflow.readyToBegin')}
                        description={t('fieldWorkflow.tapToStart')}
                        style={{ marginBottom: 16, borderRadius: 8, textAlign: 'left' }}
                      />
                      <Button
                        type="primary"
                        size="large"
                        icon={<CarOutlined />}
                        onClick={() => initSession.mutate()}
                        loading={initSession.isPending}
                        style={{ borderRadius: 8 }}
                      >
                        {t('fieldWorkflow.initializeWorkflow')}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <TechnicianWorkflowPanel
                    workOrderId={workOrderId}
                    workOrder={workOrder}
                    session={session ?? null}
                    isLoading={sessionLoading}
                  />
                )}
              </div>
            )}
          </div>
        </FieldWorkflowErrorBoundary>
      )}
    </Card>
  );
}