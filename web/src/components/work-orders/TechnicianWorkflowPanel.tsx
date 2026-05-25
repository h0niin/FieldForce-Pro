import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import {
  CarOutlined,
  CheckOutlined,
  CloseOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  PauseCircleOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
  ToolOutlined,
  TrophyOutlined,
  UnorderedListOutlined,
  WarningOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { WorkOrder } from '@/types/models.types';
import type { TechnicianSession } from '@/api/work-order-technician.api';
import {
  useApproveWorkOrder,
  useRejectWorkOrder,
  useStartTrip,
  useMarkReached,
  useConfirmItems,
  useConfirmCall,
  useStartWork,
  usePauseWork,
  useResumeWork,
  useMarkBeforePhotos,
  useFinishJob,
} from '@/hooks/use-work-order-technician';
import { useEstimateLineItems } from '@/hooks/use-estimate-line-items';
import { useWorkOrderLineItems } from '@/hooks/use-work-order-line-items';
import { ServiceLocationMap } from './ServiceLocationMap';
import { workOrderAttachmentsApi } from '@/api/work-order-attachments.api';
import { useQueryClient } from '@tanstack/react-query';
import { useSlaTimers } from '@/hooks/use-sla-timers';
import { SlaTimerBadge } from './SlaTimerBadge';

const { Text, Title } = Typography;

// ── Step definitions for the mini progress indicator ──────────────────────────

const WORKFLOW_STEPS = [
  { key: 'pending_approval', label: 'Review',    short: '1' },
  { key: 'approved',         label: 'Head Over', short: '2' },
  { key: 'trip_started',     label: 'In Transit',short: '3' },
  { key: 'reached',          label: 'On Site',   short: '4' },
  { key: 'items_confirmed',  label: 'Verify',    short: '5' },
  { key: 'call_confirmed',   label: 'Call',      short: '6' },
  { key: 'work_started',     label: 'Working',   short: '7' },
  { key: 'after_photos',     label: 'Photos',    short: '8' },
  { key: 'finished',         label: 'Done',      short: '✓' },
];
const STEP_KEYS = WORKFLOW_STEPS.map((s) => s.key);

// ── Step header color schemes ─────────────────────────────────────────────────

const STEP_THEME: Record<string, { bg: string; border: string; iconColor: string; label: string }> = {
  pending_approval:  { bg: '#fffbe6', border: '#ffe58f',  iconColor: '#d48806', label: 'Step 1 — Review Assignment' },
  approved:          { bg: '#e6f4ff', border: '#91caff',  iconColor: '#1677ff', label: 'Step 2 — Head to Site' },
  trip_started:      { bg: '#e6f4ff', border: '#91caff',  iconColor: '#1677ff', label: 'Step 3 — In Transit' },
  reached:           { bg: '#f6ffed', border: '#b7eb8f',  iconColor: '#389e0d', label: 'Step 4 — Arrived on Site' },
  items_confirmed:   { bg: '#f9f0ff', border: '#d3adf7',  iconColor: '#531dab', label: 'Step 5 — Verify Parts & Materials' },
  call_confirmed:    { bg: '#e6fffb', border: '#87e8de',  iconColor: '#08979c', label: 'Step 6 — Client Communication' },
  work_started:      { bg: '#f6ffed', border: '#b7eb8f',  iconColor: '#389e0d', label: 'Step 7 — Work in Progress' },
  after_photos:      { bg: '#e6f4ff', border: '#91caff',  iconColor: '#1677ff', label: 'Step 8 — Document Your Work' },
  finished:          { bg: '#f6ffed', border: '#b7eb8f',  iconColor: '#389e0d', label: 'Job Complete' },
  rejected:          { bg: '#fff2f0', border: '#ffccc7',  iconColor: '#cf1322', label: 'Job Rejected' },
  paused:            { bg: '#fffbe6', border: '#ffe58f',  iconColor: '#d48806', label: 'Work Paused' },
};

function getTheme(step: string | null) {
  return STEP_THEME[step ?? ''] ?? { bg: '#fafafa', border: '#f0f0f0', iconColor: '#8c8c8c', label: 'Field Workflow' };
}

// ── Mini step progress bar ────────────────────────────────────────────────────

function MiniStepProgress({ currentStep }: { currentStep: string | null }) {
  const currentIdx = STEP_KEYS.indexOf(currentStep ?? '');
  const isFinished = currentStep === 'finished';

  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
      {WORKFLOW_STEPS.map((s, i) => {
        const isDone    = isFinished || i < currentIdx;
        const isActive  = !isFinished && i === currentIdx;
        const isPending = !isFinished && i > currentIdx;
        void isPending;
        return (
          <div
            key={s.key}
            title={s.label}
            style={{
              width: isActive ? 28 : 22,
              height: 22,
              borderRadius: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: isActive ? 700 : 400,
              background: isDone ? '#52c41a' : isActive ? '#1677ff' : '#f0f0f0',
              color: isDone || isActive ? '#fff' : '#bfbfbf',
              transition: 'all 0.2s',
              cursor: 'default',
              flexShrink: 0,
            }}
          >
            {isDone ? <CheckOutlined style={{ fontSize: 10 }} /> : s.short}
          </div>
        );
      })}
    </div>
  );
}

// ── Step header banner ────────────────────────────────────────────────────────

function StepHeader({ step, icon }: { step: string | null; icon: React.ReactNode }) {
  const theme = getTheme(step);
  return (
    <div style={{
      background: theme.bg,
      border: `1px solid ${theme.border}`,
      borderRadius: '8px 8px 0 0',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      marginBottom: 0,
    }}>
      <div style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: '#fff',
        border: `2px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.iconColor,
        fontSize: 16,
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <Text strong style={{ fontSize: 14, color: '#262626', display: 'block', lineHeight: '20px' }}>
          {theme.label}
        </Text>
      </div>
    </div>
  );
}

// ── Action card wrapper ───────────────────────────────────────────────────────

function StepCard({
  step,
  icon,
  children,
}: {
  step: string | null;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = getTheme(step);
  return (
    <div style={{
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <StepHeader step={step} icon={icon} />
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  );
}

// ── Big CTA button ────────────────────────────────────────────────────────────

function PrimaryAction({
  onClick,
  loading,
  icon,
  label,
  sublabel,
  color,
  disabled,
}: {
  onClick: () => void;
  loading?: boolean;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: '100%',
        padding: '14px 20px',
        background: disabled ? '#f5f5f5' : (color ?? '#1677ff'),
        border: 'none',
        borderRadius: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        transition: 'all 0.2s',
        opacity: loading ? 0.8 : 1,
        boxShadow: disabled ? 'none' : '0 2px 8px rgba(0,0,0,0.15)',
      }}
    >
      {loading ? (
        <Spin size="small" style={{ filter: 'brightness(10)' }} />
      ) : (
        <span style={{ color: disabled ? '#8c8c8c' : '#fff', fontSize: 18 }}>{icon}</span>
      )}
      <div style={{ textAlign: 'left' }}>
        <div style={{ color: disabled ? '#8c8c8c' : '#fff', fontSize: 15, fontWeight: 600, lineHeight: '20px' }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ color: disabled ? '#bfbfbf' : 'rgba(255,255,255,0.8)', fontSize: 12, lineHeight: '16px', marginTop: 1 }}>
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  workOrderId: string;
  workOrder: WorkOrder;
  session: TechnicianSession | null;
  isLoading?: boolean;
}

export function TechnicianWorkflowPanel({ workOrderId, workOrder, session, isLoading }: Props) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [beforePhotoCount, setBeforePhotoCount] = useState(0);
  const [afterPhotoCount, setAfterPhotoCount] = useState(0);
  const [tripElapsed, setTripElapsed] = useState('');
  const [gpsAutoTrip, setGpsAutoTrip] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const autoTripFiredRef = useRef(false);

  const queryClient = useQueryClient();

  const approveMutation        = useApproveWorkOrder(workOrderId);
  const rejectMutation         = useRejectWorkOrder(workOrderId);
  const startTripMutation      = useStartTrip(workOrderId);
  const markReachedMutation    = useMarkReached(workOrderId);
  const confirmItemsMutation   = useConfirmItems(workOrderId);
  const confirmCallMutation    = useConfirmCall(workOrderId);
  const startWorkMutation      = useStartWork(workOrderId);
  const pauseWorkMutation      = usePauseWork(workOrderId);
  const resumeWorkMutation     = useResumeWork(workOrderId);
  const markBeforePhotosMutation = useMarkBeforePhotos(workOrderId);
  const finishJobMutation      = useFinishJob(workOrderId);

  const { data: slaTimers } = useSlaTimers(workOrderId);

  // Line items: WO items first, fall back to estimate items
  const { data: woLineItems }       = useWorkOrderLineItems(workOrderId);
  const { data: estimateLineItems } = useEstimateLineItems(workOrder.estimate_id ?? '');
  const lineItems = (woLineItems && woLineItems.length > 0) ? woLineItems : (estimateLineItems ?? []);

  // Service location from work order
  const serviceLat     = workOrder.location?.lat ?? null;
  const serviceLng     = workOrder.location?.lng ?? null;
  const serviceAddress = workOrder.location?.address ?? undefined;

  // Trip start coords — coerce to number and reject 0,0 (null island written when GPS unavailable)
  const tripStartLat = session?.trip_start_lat != null ? Number(session.trip_start_lat) : null;
  const tripStartLng = session?.trip_start_lng != null ? Number(session.trip_start_lng) : null;
  const hasValidTripOrigin =
    tripStartLat !== null && tripStartLng !== null &&
    !(tripStartLat === 0 && tripStartLng === 0);

  // Haversine distance in km
  const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Live trip duration timer
  useEffect(() => {
    if (session?.step !== 'trip_started' || !session.trip_started_at) return;
    const update = () => {
      const diffMs = Date.now() - new Date(session.trip_started_at!).getTime();
      const totalSecs = Math.floor(diffMs / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      setTripElapsed(hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : `${mins}m ${secs}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [session?.step, session?.trip_started_at]);

  // GPS auto-trip detection when step = approved
  useEffect(() => {
    if (session?.step !== 'approved' || autoTripFiredRef.current) return;
    if (!navigator.geolocation) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const speed = pos.coords.speed;
        if (speed !== null && speed > 2.78 && !autoTripFiredRef.current) {
          autoTripFiredRef.current = true;
          setGpsAutoTrip(true);
          startTripMutation.mutate({
            start_lat: pos.coords.latitude,
            start_lng: pos.coords.longitude,
            trip_start_type: 'auto_gps',
          });
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
        }
      },
      undefined,
      { enableHighAccuracy: true },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.step]);

  if (isLoading) return <Spin style={{ display: 'block', margin: '20px auto' }} />;

  const step = session?.step ?? null;

  const handleStartTripManual = () => {
    if (!navigator.geolocation) {
      message.warning('GPS not available. Starting trip without location tracking.');
      startTripMutation.mutate({ start_lat: 0, start_lng: 0, trip_start_type: 'manual' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startTripMutation.mutate({
          start_lat: pos.coords.latitude,
          start_lng: pos.coords.longitude,
          trip_start_type: 'manual',
        });
      },
      () => {
        message.warning('Could not get GPS location. Starting trip without location tracking.');
        startTripMutation.mutate({ start_lat: 0, start_lng: 0, trip_start_type: 'manual' });
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { message.warning('Please provide a reason'); return; }
    rejectMutation.mutate(rejectReason, {
      onSuccess: () => { setRejectModalOpen(false); setRejectReason(''); },
    });
  };

  const handleUploadPhotos = async (files: File[], photoType: 'before_work' | 'after_work') => {
    setUploadingPhotos(true);
    let successCount = 0;
    try {
      for (const file of files) {
        await workOrderAttachmentsApi.upload(file, workOrderId, photoType);
        successCount++;
      }
      queryClient.invalidateQueries({ queryKey: ['work-order-attachments', workOrderId] });
      if (photoType === 'before_work') setBeforePhotoCount((n) => n + successCount);
      else setAfterPhotoCount((n) => n + successCount);
      message.success(`${successCount} photo(s) uploaded`);
    } catch {
      message.error('Failed to upload some photos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleFinish = () => {
    finishJobMutation.mutate({});
  };

  if (!session) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '32px 16px',
        background: '#fafafa',
        borderRadius: 10,
        border: '1px dashed #d9d9d9',
      }}>
        <ClockCircleOutlined style={{ fontSize: 36, color: '#d9d9d9', display: 'block', margin: '0 auto 12px' }} />
        <Text style={{ display: 'block', color: '#8c8c8c', fontSize: 14 }}>Awaiting session initialization</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          The field workflow will appear here once the session is started.
        </Text>
      </div>
    );
  }

  // ── Step progress bar (top of panel) ────────────────────────────────────────

  const stepHeader = (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Your Progress
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {step === 'finished'
            ? <span style={{ color: '#52c41a', fontWeight: 600 }}>✓ Complete</span>
            : `Step ${Math.max(STEP_KEYS.indexOf(step ?? '') + 1, 1)} / ${WORKFLOW_STEPS.length}`
          }
        </Text>
      </div>
      <MiniStepProgress currentStep={step} />
    </div>
  );

  return (
    <div>
      {stepHeader}
      
      {slaTimers && (
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {slaTimers.acceptance && !slaTimers.acceptance.status.startsWith('completed') && (
            <SlaTimerBadge timer={slaTimers.acceptance} label="Acceptance SLA" />
          )}
          {slaTimers.travel && !slaTimers.travel.status.startsWith('completed') && (
            <SlaTimerBadge timer={slaTimers.travel} label="Travel SLA" />
          )}
          {slaTimers.on_site_prep && !slaTimers.on_site_prep.status.startsWith('completed') && (
            <SlaTimerBadge timer={slaTimers.on_site_prep} label="On-Site Prep SLA" />
          )}
          {slaTimers.work_completion && (
            <SlaTimerBadge timer={slaTimers.work_completion} label="Work Completion SLA" />
          )}
          {slaTimers.total_resolution && (
            <SlaTimerBadge timer={slaTimers.total_resolution} label="Total Resolution SLA" compact />
          )}
        </div>
      )}

      {/* Pause/Resume overlay — shown during work_started */}
      {step === 'work_started' && (
        <div style={{ marginBottom: 12 }}>
          <Button
            icon={<PauseCircleOutlined />}
            danger
            onClick={() => pauseWorkMutation.mutate()}
            loading={pauseWorkMutation.isPending}
            style={{ borderRadius: 8 }}
          >
            Pause Work
          </Button>
        </div>
      )}
      {step === 'paused' && (
        <Alert
          type="warning"
          icon={<PauseCircleOutlined />}
          showIcon
          message="Work is currently paused"
          action={
            <Button
              icon={<PlayCircleOutlined />}
              type="primary"
              onClick={() => resumeWorkMutation.mutate()}
              loading={resumeWorkMutation.isPending}
              size="small"
            >
              Resume Work
            </Button>
          }
          style={{ marginBottom: 12, borderRadius: 8 }}
        />
      )}

      {/* ── Step 1: Pending Approval ─────────────────────────────────────────── */}
      {step === 'pending_approval' && (
        <StepCard step={step} icon={<ClockCircleOutlined />}>
          <div style={{
            background: '#fffbe6',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 16,
            border: '1px solid #ffe58f',
          }}>
            <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
              {workOrder.wo_number}
            </Text>
            {workOrder.summary && (
              <Text type="secondary" style={{ fontSize: 13, display: 'block', lineHeight: '20px' }}>
                {workOrder.summary}
              </Text>
            )}
            {serviceAddress && (
              <div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <EnvironmentOutlined style={{ color: '#d48806', marginTop: 2, flexShrink: 0 }} />
                <Text style={{ fontSize: 13 }}>{serviceAddress}</Text>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <PrimaryAction
              onClick={() => approveMutation.mutate()}
              loading={approveMutation.isPending}
              icon={<CheckOutlined />}
              label="Accept Job"
              sublabel="I'll take this work order"
              color="#52c41a"
            />
            <button
              onClick={() => setRejectModalOpen(true)}
              style={{
                padding: '14px 12px',
                background: '#fff2f0',
                border: '1px solid #ffccc7',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <CloseOutlined style={{ color: '#cf1322', fontSize: 16 }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#cf1322', fontSize: 14, fontWeight: 600 }}>Reject</div>
                <div style={{ color: '#ff7875', fontSize: 11 }}>Can't take this job</div>
              </div>
            </button>
          </div>
        </StepCard>
      )}

      {/* ── Step 2: Approved — head to site ──────────────────────────────────── */}
      {step === 'approved' && (
        <StepCard step={step} icon={<CarOutlined />}>
          {gpsAutoTrip && (
            <Alert
              type="info"
              showIcon
              message="Movement detected — trip started automatically"
              style={{ marginBottom: 12, borderRadius: 8 }}
              closable
            />
          )}
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Navigate to the service location below. When you're ready to go, tap Start Trip.
            </Text>
          </div>
          <ServiceLocationMap
            serviceLat={serviceLat}
            serviceLng={serviceLng}
            serviceAddress={serviceAddress}
          />
          <div style={{ marginTop: 14 }}>
            <PrimaryAction
              onClick={handleStartTripManual}
              loading={startTripMutation.isPending}
              icon={<CarOutlined />}
              label="Start Trip"
              sublabel="Tap when you leave for the site"
              color="#1677ff"
            />
          </div>
        </StepCard>
      )}

      {/* ── Rejected ─────────────────────────────────────────────────────────── */}
      {step === 'rejected' && (
        <StepCard step={step} icon={<CloseOutlined />}>
          <Text>You rejected this work order.</Text>
          {session.rejection_reason && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff2f0', borderRadius: 8, border: '1px solid #ffccc7' }}>
              <Text strong style={{ fontSize: 13 }}>Reason: </Text>
              <Text style={{ fontSize: 13 }}>{session.rejection_reason}</Text>
            </div>
          )}
        </StepCard>
      )}

      {/* ── Step 3: Trip in Progress ─────────────────────────────────────────── */}
      {step === 'trip_started' && (
        <StepCard step={step} icon={<CarOutlined />}>
          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: hasValidTripOrigin && serviceLat && serviceLng
              ? 'repeat(3, 1fr)'
              : 'repeat(2, 1fr)',
            gap: 8,
            marginBottom: 14,
          }}>
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 12px', border: '1px solid #e5e7eb' }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>Started</Text>
              <Text strong style={{ fontSize: 14 }}>
                {session?.trip_started_at
                  ? new Date(session.trip_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </Text>
            </div>
            <div style={{ background: '#fff7e6', borderRadius: 8, padding: '10px 12px', border: '1px solid #ffd591' }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>Duration</Text>
              <Text strong style={{ fontSize: 14, color: '#fa8c16' }}>{tripElapsed || '—'}</Text>
            </div>
            {hasValidTripOrigin && serviceLat && serviceLng && (
              <div style={{ background: '#e6f4ff', borderRadius: 8, padding: '10px 12px', border: '1px solid #91caff' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>Distance</Text>
                <Text strong style={{ fontSize: 14, color: '#1677ff' }}>
                  {haversineKm(tripStartLat!, tripStartLng!, serviceLat, serviceLng).toFixed(1)} km
                </Text>
              </div>
            )}
          </div>

          {/* Route: FROM → TO */}
          <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 14px', marginBottom: 14, border: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#52c41a', marginTop: 4, flexShrink: 0 }} />
              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>FROM</Text>
                <Text style={{ fontSize: 13, display: 'block' }}>
                  {hasValidTripOrigin
                    ? `${tripStartLat!.toFixed(5)}, ${tripStartLng!.toFixed(5)}`
                    : 'Location not captured (GPS unavailable)'}
                </Text>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, margin: '0 4px 8px', alignItems: 'center' }}>
              <div style={{ width: 2, height: 16, background: '#d9d9d9' }} />
              <Tag color={session?.trip_start_type === 'auto_gps' ? 'blue' : 'green'} style={{ margin: 0, fontSize: 11 }}>
                {session?.trip_start_type === 'auto_gps' ? '📡 Auto GPS' : '✋ Manual'}
              </Tag>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4d4f', marginTop: 4, flexShrink: 0 }} />
              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>TO</Text>
                <Text style={{ fontSize: 13, display: 'block' }}>{serviceAddress || 'Service location'}</Text>
              </div>
            </div>
          </div>

          {/* Map */}
          <ServiceLocationMap
            serviceLat={serviceLat}
            serviceLng={serviceLng}
            serviceAddress={serviceAddress}
            originLat={hasValidTripOrigin ? tripStartLat : null}
            originLng={hasValidTripOrigin ? tripStartLng : null}
            originLabel="Trip Start Location"
          />

          <div style={{ marginTop: 14 }}>
            <PrimaryAction
              onClick={() => markReachedMutation.mutate()}
              loading={markReachedMutation.isPending}
              icon={<EnvironmentOutlined />}
              label="I've Arrived at the Location"
              sublabel="Tap when you reach the service site"
              color="#52c41a"
            />
          </div>
        </StepCard>
      )}

      {/* ── Step 4: Reached — confirm parts ─────────────────────────────────── */}
      {step === 'reached' && (
        <StepCard step={step} icon={<UnorderedListOutlined />}>
          {lineItems.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 13 }}>
                  {woLineItems && woLineItems.length > 0 ? 'Work order items:' : 'Items from estimate:'}
                </Text>
                <Tag color={checkedItems.size === lineItems.length ? 'success' : 'processing'}>
                  {checkedItems.size} / {lineItems.length} confirmed
                </Tag>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {lineItems.map((item) => {
                  const isChecked = checkedItems.has(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setCheckedItems((prev) => {
                        const next = new Set(prev);
                        if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                        return next;
                      })}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 8,
                        border: `1px solid ${isChecked ? '#b7eb8f' : '#e5e7eb'}`,
                        background: isChecked ? '#f6ffed' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Checkbox checked={isChecked} onChange={() => {}} style={{ marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text strong style={{ textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? '#8c8c8c' : undefined, fontSize: 14 }}>
                            {item.name}
                          </Text>
                          {item.type && <Tag style={{ fontSize: 11 }}>{item.type}</Tag>}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                          {item.quantity && item.quantity !== 1 && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Qty: {item.quantity}{(item as { unit?: string }).unit ? ` ${(item as { unit?: string }).unit}` : ''}
                            </Text>
                          )}
                          {Number(item.unit_price) > 0 && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              ${Number(item.unit_price).toFixed(2)} each
                            </Text>
                          )}
                        </div>
                        {(item as { description?: string }).description && (
                          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                            {(item as { description?: string }).description}
                          </Text>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {checkedItems.size < lineItems.length && (
                <Alert
                  type="info"
                  showIcon
                  message={`${lineItems.length - checkedItems.size} item(s) not yet confirmed`}
                  style={{ marginBottom: 14, borderRadius: 8 }}
                />
              )}
            </>
          ) : (
            <div style={{ padding: '12px 0', marginBottom: 14 }}>
              <Text type="secondary">No items linked to this work order.</Text>
            </div>
          )}
          <PrimaryAction
            onClick={() => confirmItemsMutation.mutate()}
            loading={confirmItemsMutation.isPending}
            icon={<CheckOutlined />}
            label={lineItems.length > 0 && checkedItems.size === lineItems.length
              ? 'All Items Confirmed — Proceed'
              : 'Confirm & Proceed'}
            sublabel={lineItems.length > 0 ? `${checkedItems.size}/${lineItems.length} items checked` : 'No items to check'}
            color="#531dab"
            disabled={lineItems.length > 0 && checkedItems.size < lineItems.length}
          />
        </StepCard>
      )}

      {/* ── Step 5: Items confirmed — call client ────────────────────────────── */}
      {step === 'items_confirmed' && (
        <StepCard step={step} icon={<PhoneOutlined />}>
          {workOrder.contact ? (
            <div style={{ padding: '12px 14px', background: '#e6fffb', borderRadius: 8, marginBottom: 14, border: '1px solid #87e8de' }}>
              <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
                {(workOrder.contact as unknown as { first_name?: string; last_name?: string })?.first_name}{' '}
                {(workOrder.contact as unknown as { last_name?: string })?.last_name}
              </Text>
              {(workOrder.contact as unknown as { phone?: string })?.phone && (
                <a
                  href={`tel:${(workOrder.contact as unknown as { phone?: string }).phone}`}
                  style={{ fontSize: 20, fontWeight: 600, color: '#08979c', textDecoration: 'none', display: 'block' }}
                >
                  📞 {(workOrder.contact as unknown as { phone?: string }).phone}
                </a>
              )}
            </div>
          ) : (
            <Alert type="warning" showIcon message="No contact information on this work order" style={{ marginBottom: 14, borderRadius: 8 }} />
          )}
          <Text type="secondary" style={{ display: 'block', marginBottom: 14, fontSize: 13 }}>
            Let the client know you're on-site and ready to begin. Then tap the button below.
          </Text>
          <PrimaryAction
            onClick={() => confirmCallMutation.mutate()}
            loading={confirmCallMutation.isPending}
            icon={<PhoneOutlined />}
            label="I've Called the Client"
            sublabel="Confirm the client is aware you're here"
            color="#08979c"
          />
        </StepCard>
      )}

      {/* ── Step 6: Call confirmed — upload before photos & start work ───────── */}
      {step === 'call_confirmed' && (
        <StepCard step={step} icon={<CameraOutlined />}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            Photograph the site and equipment <strong>before</strong> starting work. Then tap Start Work.
          </Text>
          <Upload.Dragger
            multiple
            accept="image/*"
            showUploadList={false}
            disabled={uploadingPhotos}
            beforeUpload={(file) => { handleUploadPhotos([file], 'before_work'); return false; }}
            style={{ borderRadius: 8, marginBottom: 12, border: '1px dashed #91caff', background: '#e6f4ff' }}
          >
            <div style={{ padding: '16px 0' }}>
              {uploadingPhotos ? <Spin size="large" /> : <CameraOutlined style={{ fontSize: 40, color: '#1677ff' }} />}
              <div style={{ marginTop: 8, fontSize: 14, color: '#1677ff', fontWeight: 500 }}>
                {uploadingPhotos ? 'Uploading…' : 'Tap to add before-work photos'}
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                JPG · PNG · HEIC · Multiple files
              </div>
            </div>
          </Upload.Dragger>
          {beforePhotoCount > 0 && (
            <Alert
              type="success"
              showIcon
              message={`${beforePhotoCount} photo${beforePhotoCount > 1 ? 's' : ''} uploaded`}
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
          )}
          <PrimaryAction
            onClick={() => startWorkMutation.mutate()}
            loading={startWorkMutation.isPending}
            icon={<ToolOutlined />}
            label={beforePhotoCount > 0 ? 'Photos Added — Start Work' : 'Skip Photos & Start Work'}
            sublabel="Begin the actual work on site"
            color="#389e0d"
          />
        </StepCard>
      )}

      {/* ── Step 7: Work started ─────────────────────────────────────────────── */}
      {step === 'work_started' && (
        <StepCard step={step} icon={<ToolOutlined />}>
          <div style={{ padding: '10px 12px', background: '#f6ffed', borderRadius: 8, marginBottom: 12, border: '1px solid #b7eb8f', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ToolOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            <div>
              <Text strong style={{ color: '#135200', fontSize: 14 }}>Work is in progress</Text>
              {session.work_started_at && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  Started {new Date(session.work_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </div>
          </div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            Optionally photograph the job in progress. When work is complete, tap Finish Work.
          </Text>
          <Upload.Dragger
            multiple
            accept="image/*"
            showUploadList={false}
            disabled={uploadingPhotos}
            beforeUpload={(file) => { handleUploadPhotos([file], 'after_work'); return false; }}
            style={{ borderRadius: 8, marginBottom: 12, border: '1px dashed #b7eb8f', background: '#f6ffed' }}
          >
            <div style={{ padding: '14px 0' }}>
              {uploadingPhotos ? <Spin size="large" /> : <CameraOutlined style={{ fontSize: 36, color: '#52c41a' }} />}
              <div style={{ marginTop: 8, fontSize: 13, color: '#52c41a', fontWeight: 500 }}>
                {uploadingPhotos ? 'Uploading…' : 'During-work photos (optional)'}
              </div>
            </div>
          </Upload.Dragger>
          {afterPhotoCount > 0 && (
            <Alert
              type="success"
              showIcon
              message={`${afterPhotoCount} photo${afterPhotoCount > 1 ? 's' : ''} added`}
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
          )}
          <PrimaryAction
            onClick={() => markBeforePhotosMutation.mutate()}
            loading={markBeforePhotosMutation.isPending}
            icon={<CheckOutlined />}
            label="Finish Work — Proceed to After Photos"
            sublabel="Move to the after-work documentation step"
            color="#389e0d"
          />
        </StepCard>
      )}

      {/* ── Step 8: After photos ─────────────────────────────────────────────── */}
      {step === 'after_photos' && (
        <StepCard step={step} icon={<CameraOutlined />}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            Photograph the completed work. These photos confirm the quality of your work to the client.
          </Text>
          <Upload.Dragger
            multiple
            accept="image/*"
            showUploadList={false}
            disabled={uploadingPhotos}
            beforeUpload={(file) => { handleUploadPhotos([file], 'after_work'); return false; }}
            style={{ borderRadius: 8, marginBottom: 12, border: '1px dashed #91caff', background: '#e6f4ff' }}
          >
            <div style={{ padding: '16px 0' }}>
              {uploadingPhotos ? <Spin size="large" /> : <CameraOutlined style={{ fontSize: 40, color: '#1677ff' }} />}
              <div style={{ marginTop: 8, fontSize: 14, color: '#1677ff', fontWeight: 500 }}>
                {uploadingPhotos ? 'Uploading…' : 'Tap to add after-work photos'}
              </div>
              <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                JPG · PNG · HEIC · Multiple files
              </div>
            </div>
          </Upload.Dragger>
          {afterPhotoCount > 0 && (
            <Alert
              type="success"
              showIcon
              message={`${afterPhotoCount} photo${afterPhotoCount > 1 ? 's' : ''} uploaded`}
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
          )}
          <PrimaryAction
            onClick={handleFinish}
            loading={finishJobMutation.isPending}
            icon={<TrophyOutlined />}
            label={afterPhotoCount > 0 ? 'Photos Done — Finish Job' : 'Skip — Finish Job'}
            sublabel="Complete the work order"
            color="#52c41a"
          />
        </StepCard>
      )}

      {/* ── Step 9: Finished ─────────────────────────────────────────────────── */}
      {step === 'finished' && (
        <div style={{
          textAlign: 'center',
          padding: '32px 20px',
          background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)',
          borderRadius: 12,
          border: '1px solid #b7eb8f',
          boxShadow: '0 2px 12px rgba(82,196,26,0.15)',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#52c41a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 16px rgba(82,196,26,0.35)',
          }}>
            <TrophyOutlined style={{ fontSize: 32, color: '#fff' }} />
          </div>
          <Title level={3} style={{ color: '#135200', margin: '0 0 8px' }}>Job Complete!</Title>
          <Text style={{ fontSize: 15, color: '#389e0d', display: 'block', marginBottom: 16 }}>
            Work order <strong>{workOrder.wo_number}</strong> has been finished.
          </Text>
          {session.finished_at && (
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
              Completed at {new Date(session.finished_at).toLocaleString()}
            </Text>
          )}
        </div>
      )}

      {/* ── Reject modal ─────────────────────────────────────────────────────── */}
      <Modal
        title={<Space><WarningOutlined style={{ color: '#faad14' }} /> Reject Work Order</Space>}
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleReject}
        okText="Reject"
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="Reason for rejection" required>
            <Input.TextArea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please explain why you cannot take this job…"
              autoFocus
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
