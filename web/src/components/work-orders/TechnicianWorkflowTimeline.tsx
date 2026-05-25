import React from 'react';
import { Typography, Button, Tag, Empty, Spin, Alert } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CarOutlined,
  EnvironmentOutlined,
  UnorderedListOutlined,
  PhoneOutlined,
  ToolOutlined,
  PauseCircleOutlined,
  CameraOutlined,
  TrophyOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useWorkOrderSession } from '@/hooks/use-work-order-technician';
import type { TechnicianSession } from '@/api/work-order-technician.api';
import dayjs from 'dayjs';

const { Text } = Typography;

interface StepDef {
  step: string;
  label: string;
  icon: React.ReactNode;
  getTimestamp: (s: TechnicianSession) => string | null | undefined;
}

const STEP_DEFS: StepDef[] = [
  {
    step: 'pending_approval',
    label: 'Job Assigned',
    icon: <ClockCircleOutlined />,
    getTimestamp: (s) => s.created_at,
  },
  {
    step: 'approved',
    label: 'Job Accepted',
    icon: <CheckCircleOutlined />,
    getTimestamp: (s) => s.approved_at,
  },
  {
    step: 'trip_started',
    label: 'Trip Started',
    icon: <CarOutlined />,
    getTimestamp: (s) => s.trip_started_at,
  },
  {
    step: 'reached',
    label: 'Arrived at Site',
    icon: <EnvironmentOutlined />,
    getTimestamp: (s) => s.reached_at,
  },
  {
    step: 'items_confirmed',
    label: 'Items Verified',
    icon: <UnorderedListOutlined />,
    getTimestamp: (s) => s.items_confirmed_at,
  },
  {
    step: 'call_confirmed',
    label: 'Client Called',
    icon: <PhoneOutlined />,
    getTimestamp: (s) => s.call_confirmed_at,
  },
  {
    step: 'work_started',
    label: 'Work Started',
    icon: <ToolOutlined />,
    getTimestamp: (s) => s.work_started_at,
  },
  {
    step: 'after_photos',
    label: 'Photos Captured',
    icon: <CameraOutlined />,
    getTimestamp: (s) => s.before_photos_at || s.after_photos_at,
  },
  {
    step: 'finished',
    label: 'Job Complete',
    icon: <TrophyOutlined />,
    getTimestamp: (s) => s.finished_at,
  },
];

const STEP_ORDER = STEP_DEFS.map((s) => s.step);
// Insert paused/resumed which may appear between work_started and after_photos
const EXTENDED_ORDER = [
  'pending_approval', 'approved', 'trip_started', 'reached',
  'items_confirmed', 'call_confirmed', 'work_started', 'paused',
  'after_photos', 'finished',
];

function getStatus(itemStep: string, currentStep: string): 'done' | 'active' | 'pending' | 'rejected' {
  if (currentStep === 'rejected') {
    return itemStep === 'pending_approval' ? 'done' : 'pending';
  }
  if (currentStep === 'finished') return 'done';
  const itemIdx = EXTENDED_ORDER.indexOf(itemStep);
  const currIdx = EXTENDED_ORDER.indexOf(currentStep);
  if (itemIdx < currIdx) return 'done';
  if (itemIdx === currIdx) return 'active';
  return 'pending';
}

function formatTs(ts: string | null | undefined): string {
  if (!ts) return '';
  return dayjs(ts).format('MMM D, h:mm A');
}

interface Props {
  workOrderId: string;
  assignedTo?: string | null;
}

export function TechnicianWorkflowTimeline({ workOrderId }: Props) {
  const { data: session, isLoading, refetch, isFetching } = useWorkOrderSession(workOrderId);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <Spin />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>Loading workflow…</Text>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <Empty
          description={<Text type="secondary" style={{ fontSize: 13 }}>Workflow not started yet</Text>}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
          loading={isFetching}
          size="small"
          style={{ marginTop: 12 }}
        >
          Refresh
        </Button>
      </div>
    );
  }

  if (session.step === 'rejected') {
    return (
      <div>
        <Alert
          type="error"
          icon={<CloseCircleOutlined />}
          showIcon
          message="Work Order Rejected"
          description={
            <div>
              <Text style={{ fontSize: 13 }}>The technician rejected this work order.</Text>
              {session.rejection_reason && (
                <div style={{ marginTop: 6 }}>
                  <Text strong style={{ fontSize: 12 }}>Reason: </Text>
                  <Text style={{ fontSize: 12 }}>{session.rejection_reason}</Text>
                </div>
              )}
              {session.rejected_at && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {formatTs(session.rejected_at)}
                  </Text>
                </div>
              )}
            </div>
          }
          style={{ marginBottom: 12 }}
        />
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isFetching} size="small">
          Refresh
        </Button>
      </div>
    );
  }

  const currentStep = session.step;
  const doneCount = STEP_DEFS.filter((s) => getStatus(s.step, currentStep) === 'done').length;
  const progressPct = Math.round((doneCount / STEP_DEFS.length) * 100);

  // Build display list, inserting paused/resumed entries if they happened
  const displaySteps: { step: string; label: string; icon: React.ReactNode; ts: string | null | undefined }[] = [];
  for (const def of STEP_DEFS) {
    displaySteps.push({ step: def.step, label: def.label, icon: def.icon, ts: def.getTimestamp(session) });
    if (def.step === 'work_started' && session.paused_at) {
      displaySteps.push({
        step: 'paused',
        label: 'Work Paused',
        icon: <PauseCircleOutlined />,
        ts: session.paused_at,
      });
    }
    if (def.step === 'work_started' && session.resumed_at) {
      displaySteps.push({
        step: 'resumed',
        label: 'Work Resumed',
        icon: <PlayCircleOutlined />,
        ts: session.resumed_at,
      });
    }
  }

  const currentStepDef = STEP_DEFS.find((s) => s.step === currentStep);
  const currentLabel = currentStepDef?.label ?? currentStep.replace(/_/g, ' ');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Text strong style={{ fontSize: 13, display: 'block' }}>Field Progress</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {doneCount} of {STEP_DEFS.length} steps done
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
          loading={isFetching}
          size="small"
          type="text"
        />
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          height: 6,
          background: '#f0f0f0',
          borderRadius: 3,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progressPct}%`,
            background: currentStep === 'finished'
              ? 'linear-gradient(90deg, #52c41a, #73d13d)'
              : 'linear-gradient(90deg, #1677ff, #69b1ff)',
            borderRadius: 3,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>{progressPct}% complete</Text>
          <Tag
            color={currentStep === 'finished' ? 'success' : currentStep === 'rejected' ? 'error' : 'processing'}
            style={{ fontSize: 11, lineHeight: '18px', height: 20 }}
          >
            {currentLabel}
          </Tag>
        </div>
      </div>

      {/* Step list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {displaySteps.map((item, idx) => {
          const status = getStatus(item.step, currentStep);
          const isLast = idx === displaySteps.length - 1;

          const dotColor =
            status === 'done' ? '#52c41a' :
            status === 'active' ? '#1677ff' :
            '#d9d9d9';

          const dotBg =
            status === 'done' ? '#f6ffed' :
            status === 'active' ? '#e6f4ff' :
            '#fafafa';

          return (
            <div key={`${item.step}-${idx}`} style={{ display: 'flex', gap: 0 }}>
              {/* Left: dot + connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
                {/* Dot */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: dotBg,
                  border: `2px solid ${dotColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: dotColor,
                  fontSize: 12,
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 1,
                  boxShadow: status === 'active' ? `0 0 0 3px rgba(22,119,255,0.15)` : 'none',
                  transition: 'all 0.3s',
                }}>
                  {status === 'done'
                    ? <CheckCircleOutlined style={{ fontSize: 13 }} />
                    : React.cloneElement(item.icon as React.ReactElement, { style: { fontSize: 12 } })
                  }
                </div>
                {/* Connector line */}
                {!isLast && (
                  <div style={{
                    width: 2,
                    flex: 1,
                    minHeight: 16,
                    background: status === 'done' ? '#52c41a' : '#f0f0f0',
                    margin: '2px 0',
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>

              {/* Right: label + timestamp */}
              <div style={{
                flex: 1,
                paddingLeft: 10,
                paddingBottom: isLast ? 0 : 12,
                paddingTop: 4,
              }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: status === 'active' ? 600 : 400,
                    color: status === 'pending' ? '#bfbfbf' : status === 'active' ? '#1677ff' : '#262626',
                    display: 'block',
                    lineHeight: '20px',
                  }}
                >
                  {item.label}
                </Text>
                {item.ts && (
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', lineHeight: '16px' }}>
                    {formatTs(item.ts)}
                  </Text>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
