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
import { useSlaTimer } from '@/hooks/use-sla-timers';
import { SlaTimerBadge } from './SlaTimerBadge';
import { useTranslation } from 'react-i18next'; // Rule 1

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
  pending_approval:  { bg: 'rgba(250, 173, 20, 0.1)', border: 'rgba(250, 173, 20, 0.25)',  iconColor: '#faad14', label: 'Step 1 — Review Assignment' },
  approved:          { bg: 'rgba(22, 119, 255, 0.08)', border: 'rgba(22, 119, 255, 0.25)',  iconColor: '#1677ff', label: 'Step 2 — Head to Site' },
  trip_started:      { bg: 'rgba(22, 119, 255, 0.08)', border: 'rgba(22, 119, 255, 0.25)',  iconColor: '#1677ff', label: 'Step 3 — In Transit' },
  reached:           { bg: 'rgba(82, 196, 26, 0.1)', border: 'rgba(82, 196, 26, 0.25)',  iconColor: '#52c41a', label: 'Step 4 — Arrived on Site' },
  items_confirmed:   { bg: 'rgba(114, 46, 209, 0.1)', border: 'rgba(114, 46, 209, 0.25)',  iconColor: '#722ed1', label: 'Step 5 — Verify Parts & Materials' },
  call_confirmed:    { bg: 'rgba(19, 194, 194, 0.1)', border: 'rgba(19, 194, 194, 0.25)',  iconColor: '#13c2c2', label: 'Step 6 — Client Communication' },
  work_started:      { bg: 'rgba(82, 196, 26, 0.1)', border: 'rgba(82, 196, 26, 0.25)',  iconColor: '#52c41a', label: 'Step 7 — Work in Progress' },
  after_photos:      { bg: 'rgba(22, 119, 255, 0.08)', border: 'rgba(22, 119, 255, 0.25)',  iconColor: '#1677ff', label: 'Step 8 — Document Your Work' },
  finished:          { bg: 'rgba(82, 196, 26, 0.1)', border: 'rgba(82, 196, 26, 0.25)',  iconColor: '#52c41a', label: 'Job Complete' },
  rejected:          { bg: 'rgba(255, 77, 79, 0.1)', border: 'rgba(255, 77, 79, 0.25)',  iconColor: '#ff4d4f', label: 'Job Rejected' },
  paused:            { bg: 'rgba(250, 173, 20, 0.1)', border: 'rgba(250, 173, 20, 0.25)',  iconColor: '#faad14', label: 'Work Paused' },
};

function getTheme(step: string | null) {
  const { t } = useTranslation(); // Rule 2, for nested function
  return STEP_THEME[step ?? ''] ?? { bg: 'var(--bg-color)', border: 'var(--border-color)', iconColor: '#8c8c8c', label: t('technicianWorkflow.stepTheme.fieldWorkflow') };
}

// ── Mini step progress bar ────────────────────────────────────────────────────

function MiniStepProgress({ currentStep }: { currentStep: string | null }) {
  const currentIdx = STEP_KEYS.indexOf(currentStep ?? '');
  const isFinished = currentStep === 'finished';

  // These labels are defined in WORKFLOW_STEPS outside the component, so they will be translated once.
  // We need `useTranslation` if we were defining them inside the component.
  // For `s.label` in `title={s.label}`, the `s.label` itself is already translated in WORKFLOW_STEPS.

  const { t } = useTranslation(); // Rule 2

  const translatedWorkflowSteps = WORKFLOW_STEPS.map(s => ({
    ...s,
    label: t(`technicianWorkflow.workflowSteps.${s.key.replace(/_(\w)/g, (g) => g[1].toUpperCase())}`),
  }));

  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
      {translatedWorkflowSteps.map((s, i) => {
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
              background: isDone ? '#52c41a' : isActive ? '#1677ff' : 'var(--border-color)',
              color: isDone || isActive ? '#fff' : 'inherit',
              opacity: isDone || isActive ? 1 : 0.5,
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

// ── Step header banner ─────────────���──────────────────────────────────────────

function StepHeader({ step, icon }: { step: string | null; icon: React.ReactNode }) {
  const { t } = useTranslation(); // Rule 2

  // Translate labels in STEP_THEME here or pass them directly as t() calls.
  // Since getTheme is called here, we need to make sure its internal `t()` call is defined.
  // It's probably cleaner to redefine STEP_THEME *once* with t() calls if it was purely within a component,
  // but since it's defined globally, it's better to translate its `label` values where they are consumed.
  const theme = getTheme(step);

  const translatedLabel = (() => {
    switch(step) {
      case 'pending_approval': return t('technicianWorkflow.stepTheme.reviewAssignment');
      case 'approved': return t('technicianWorkflow.stepTheme.headToSite');
      case 'trip_started': return t('technicianWorkflow.stepTheme.inTransit');
      case 'reached': return t('technicianWorkflow.stepTheme.arrivedOnSite');
      case 'items_confirmed': return t('technicianWorkflow.stepTheme.verifyPartsMaterials');
      case 'call_confirmed': return t('technicianWorkflow.stepTheme.clientCommunication');
      case 'work_started': return t('technicianWorkflow.stepTheme.workInProgress');
      case 'after_photos': return t('technicianWorkflow.stepTheme.documentYourWork');
      case 'finished': return t('technicianWorkflow.stepTheme.jobComplete');
      case 'rejected': return t('technicianWorkflow.stepTheme.jobRejected');
      case 'paused': return t('technicianWorkflow.stepTheme.workPaused');
      default: return t('technicianWorkflow.stepTheme.fieldWorkflow');
    }
  })();


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
        <Text strong style={{ fontSize: 14, display: 'block', lineHeight: '20px' }}>
          {translatedLabel}
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
  const theme = getTheme(step); // getTheme already uses t()
  return (
    <div style={{
      border: `1px solid ${theme.border}`,
      borderRadius: 10,
      overflow: 'hidden',
      background: 'var(--card-bg)',
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
  label, // This is a prop, will be translated by parent
  sublabel, // This is a prop, will be translated by parent
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
  const { t } = useTranslation(); // Rule 2
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: '100%',
        padding: '14px 20px',
        background: disabled ? 'rgba(128, 128, 128, 0.08)' : (color ?? '#1677ff'),
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
        <span style={{ color: disabled ? 'inherit' : '#fff', opacity: disabled ? 0.5 : 1, fontSize: 18 }}>{icon}</span>
      )}
      <div style={{ textAlign: 'left' }}>
        <div style={{ color: disabled ? 'inherit' : '#fff', opacity: disabled ? 0.5 : 1, fontSize: 15, fontWeight: 600, lineHeight: '20px' }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ color: disabled ? 'inherit' : 'rgba(255,255,255,0.8)', opacity: disabled ? 0.3 : 1, fontSize: 12, lineHeight: '16px', marginTop: 1 }}>
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
  const { t } = useTranslation(); // Rule 2
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

  const { data: slaTimer } = useSlaTimer(workOrderId);

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
      message.warning(t('technicianWorkflow.gpsNotAvailableWarning'));
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
        message.warning(t('technicianWorkflow.gpsLocationErrorWarning'));
        startTripMutation.mutate({ start_lat: 0, start_lng: 0, trip_start_type: 'manual' });
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  };

  const handleReject = () => {
    if (!rejectReason.trim()) { message.warning(t('technicianWorkflow.provideReasonWarning')); return; }
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
      message.success(t('technicianWorkflow.photosUploadedSuccess', { count: successCount }));
    } catch {
      message.error(t('technicianWorkflow.photosUploadFailedError'));
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
        background: 'transparent',
        borderRadius: 10,
        border: '1px dashed var(--border-color)',
      }}>
        <ClockCircleOutlined style={{ fontSize: 36, opacity: 0.3, display: 'block', margin: '0 auto 12px' }} />
        <Text style={{ display: 'block', opacity: 0.5, fontSize: 14 }}>{t('technicianWorkflow.awaitingSessionInit')}</Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('technicianWorkflow.fieldWorkflowAppearance')}
        </Text>
      </div>
    );
  }

  // ── Step progress bar (top of panel) ────────────────────────────────────────

  const stepHeader = (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong style={{ fontSize: 12, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {t('technicianWorkflow.yourProgress')}
        </Text>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {step === 'finished'
            ? <span style={{ color: '#52c41a', fontWeight: 600 }}>{t('technicianWorkflow.completeStatus')}</span>
            : t('technicianWorkflow.stepProgress', { current: Math.max(STEP_KEYS.indexOf(step ?? '') + 1, 1), total: WORKFLOW_STEPS.length })
          }
        </Text>
      </div>
      <MiniStepProgress currentStep={step} />
    </div>
  );

  return (
    <div>
      {stepHeader}

      {slaTimer && (
        <div style={{ marginBottom: 16 }}>
          <SlaTimerBadge timer={slaTimer} />
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
            {t('technicianWorkflow.pauseWorkButton')}
          </Button>
        </div>
      )}
      {step === 'paused' && (
        <Alert
          type="warning"
          icon={<PauseCircleOutlined />}
          showIcon
          message={t('technicianWorkflow.workPausedAlert')}
          action={
            <Button
              icon={<PlayCircleOutlined />}
              type="primary"
              onClick={() => resumeWorkMutation.mutate()}
              loading={resumeWorkMutation.isPending}
              size="small"
            >
              {t('technicianWorkflow.resumeWorkButton')}
            </Button>
          }
          style={{ marginBottom: 12, borderRadius: 8 }}
        />
      )}

      {/* ── Step 1: Pending Approval ─────────────────────────────────────────── */}
      {step === 'pending_approval' && (
        <StepCard step={step} icon={<ClockCircleOutlined />}>
          <div style={{
            background: 'rgba(250, 173, 20, 0.1)',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 16,
            border: '1px solid rgba(250, 173, 20, 0.25)',
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
                <EnvironmentOutlined style={{ color: '#faad14', marginTop: 2, flexShrink: 0 }} />
                <Text style={{ fontSize: 13 }}>{serviceAddress}</Text>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <PrimaryAction
              onClick={() => approveMutation.mutate()}
              loading={approveMutation.isPending}
              icon={<CheckOutlined />}
              label={t('technicianWorkflow.acceptJobLabel')}
              sublabel={t('technicianWorkflow.acceptJobSublabel')}
              color="#52c41a"
            />
            <button
              onClick={() => setRejectModalOpen(true)}
              style={{
                padding: '14px 12px',
                background: 'rgba(255, 77, 79, 0.1)',
                border: '1px solid rgba(255, 77, 79, 0.25)',
                borderRadius: 10,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <CloseOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#ff4d4f', fontSize: 14, fontWeight: 600 }}>{t('technicianWorkflow.rejectButton')}</div>
                <div style={{ color: '#ff4d4f', opacity: 0.6, fontSize: 11 }}>{t('technicianWorkflow.rejectSublabel')}</div>
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
              message={t('technicianWorkflow.gpsAutoTripMessage')}
              style={{ marginBottom: 12, borderRadius: 8 }}
              closable
            />
          )}
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('technicianWorkflow.navigateToSitePrompt')}
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
              label={t('technicianWorkflow.startTripLabel')}
              sublabel={t('technicianWorkflow.startTripSublabel')}
              color="#1677ff"
            />
          </div>
        </StepCard>
      )}

      {/* ── Rejected ─────────────────────────────────────────────────────────── */}
      {step === 'rejected' && (
        <StepCard step={step} icon={<CloseOutlined />}>
          <Text>{t('technicianWorkflow.rejectedWorkOrderMessage')}</Text>
          {session.rejection_reason && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255, 77, 79, 0.1)', borderRadius: 8, border: '1px solid rgba(255, 77, 79, 0.25)' }}>
              <Text strong style={{ fontSize: 13 }}>{t('technicianWorkflow.rejectionReasonLabel')}{' '}</Text>
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
            <div style={{ background: 'var(--bg-color)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border-color)' }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>{t('technicianWorkflow.tripStats.started')}</Text>
              <Text strong style={{ fontSize: 14 }}>
                {session?.trip_started_at
                  ? new Date(session.trip_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : t('technicianWorkflow.tripStats.notAvailable')}
              </Text>
            </div>
            <div style={{ background: 'rgba(250, 173, 20, 0.1)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(250, 173, 20, 0.25)' }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>{t('technicianWorkflow.tripStats.duration')}</Text>
              <Text strong style={{ fontSize: 14, color: '#fa8c16' }}>{tripElapsed || t('technicianWorkflow.tripStats.notAvailable')}</Text>
            </div>
            {hasValidTripOrigin && serviceLat && serviceLng && (
              <div style={{ background: 'rgba(22, 119, 255, 0.08)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(22, 119, 255, 0.25)' }}>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase' }}>{t('technicianWorkflow.tripStats.distance')}</Text>
                <Text strong style={{ fontSize: 14, color: '#1677ff' }}>
                  {haversineKm(tripStartLat!, tripStartLng!, serviceLat, serviceLng).toFixed(1)} {t('technicianWorkflow.tripStats.distanceUnit')}
                </Text>
              </div>
            )}
          </div>

          {/* Route: FROM → TO */}
          <div style={{ background: 'var(--bg-color)', borderRadius: 8, padding: '12px 14px', marginBottom: 14, border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#52c41a', marginTop: 4, flexShrink: 0 }} />
              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>{t('technicianWorkflow.tripRoute.from')}</Text>
                <Text style={{ fontSize: 13, display: 'block' }}>
                  {hasValidTripOrigin
                    ? `${tripStartLat!.toFixed(5)}, ${tripStartLng!.toFixed(5)}`
                    : t('technicianWorkflow.tripRoute.locationNotCaptured')}
                </Text>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, margin: '0 4px 8px', alignItems: 'center' }}>
              <div style={{ width: 2, height: 16, background: 'var(--border-color)' }} />
              <Tag color={session?.trip_start_type === 'auto_gps' ? 'blue' : 'green'} style={{ margin: 0, fontSize: 11 }}>
                {session?.trip_start_type === 'auto_gps' ? t('technicianWorkflow.tripType.autoGps') : t('technicianWorkflow.tripType.manual')}
              </Tag>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4d4f', marginTop: 4, flexShrink: 0 }} />
              <div>
                <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>{t('technicianWorkflow.tripRoute.to')}</Text>
                <Text style={{ fontSize: 13, display: 'block' }}>{serviceAddress || t('technicianWorkflow.tripRoute.serviceLocationFallback')}</Text>
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
            originLabel={t('technicianWorkflow.tripRoute.tripStartLocationLabel')}
          />

          <div style={{ marginTop: 14 }}>
            <PrimaryAction
              onClick={() => markReachedMutation.mutate()}
              loading={markReachedMutation.isPending}
              icon={<EnvironmentOutlined />}
              label={t('technicianWorkflow.arrivedLocationLabel')}
              sublabel={t('technicianWorkflow.arrivedLocationSublabel')}
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
                  {woLineItems && woLineItems.length > 0 ? t('technicianWorkflow.lineItems.workOrderItems') : t('technicianWorkflow.lineItems.estimateItems')}
                </Text>
                <Tag color={checkedItems.size === lineItems.length ? 'success' : 'processing'}>
                  {t('technicianWorkflow.lineItems.confirmedItems', { count: checkedItems.size, total: lineItems.length })}
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
                        border: '1px solid ' + (isChecked ? 'rgba(82, 196, 26, 0.25)' : 'var(--border-color)'),
                        background: isChecked ? 'rgba(82, 196, 26, 0.1)' : 'var(--bg-color)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Checkbox checked={isChecked} onChange={() => {}} style={{ marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <Text strong style={{ textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.5 : 1, fontSize: 14 }}>
                            {item.name}
                          </Text>
                          {item.type && <Tag style={{ fontSize: 11 }}>{item.type}</Tag>}
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 2, flexWrap: 'wrap' }}>
                          {item.quantity && item.quantity !== 1 && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {t('technicianWorkflow.lineItems.quantity', { quantity: item.quantity, unit: (item as { unit?: string }).unit })}
                            </Text>
                          )}
                          {Number(item.unit_price) > 0 && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {t('technicianWorkflow.lineItems.unitPrice', { price: Number(item.unit_price).toFixed(2) })}
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
                  message={t('technicianWorkflow.lineItems.itemsNotYetConfirmed', { count: lineItems.length - checkedItems.size })}
                  style={{ marginBottom: 14, borderRadius: 8 }}
                />
              )}
            </>
          ) : (
            <div style={{ padding: '12px 0', marginBottom: 14 }}>
              <Text type="secondary">{t('technicianWorkflow.lineItems.noItemsLinked')}</Text>
            </div>
          )}
          <PrimaryAction
            onClick={() => confirmItemsMutation.mutate()}
            loading={confirmItemsMutation.isPending}
            icon={<CheckOutlined />}
            label={lineItems.length > 0 && checkedItems.size === lineItems.length
              ? t('technicianWorkflow.lineItems.allItemsConfirmedProceed')
              : t('technicianWorkflow.lineItems.confirmProceed')}
            sublabel={lineItems.length > 0 ? t('technicianWorkflow.lineItems.itemsChecked', { checked: checkedItems.size, total: lineItems.length }) : t('technicianWorkflow.lineItems.noItemsToCheck')}
            color="#531dab"
            disabled={lineItems.length > 0 && checkedItems.size < lineItems.length}
          />
        </StepCard>
      )}

      {/* ── Step 5: Items confirmed — call client ────────────────────────────── */}
      {step === 'items_confirmed' && (
        <StepCard step={step} icon={<PhoneOutlined />}>
          {workOrder.contact ? (
            <div style={{ padding: '12px 14px', background: 'rgba(19, 194, 194, 0.1)', borderRadius: 8, marginBottom: 14, border: '1px solid rgba(19, 194, 194, 0.25)' }}>
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
            <Alert type="warning" showIcon message={t('technicianWorkflow.contactInfoMissingWarning')} style={{ marginBottom: 14, borderRadius: 8 }} />
          )}
          <Text type="secondary" style={{ display: 'block', marginBottom: 14, fontSize: 13 }}>
            {t('technicianWorkflow.callClientPrompt')}
          </Text>
          <PrimaryAction
            onClick={() => confirmCallMutation.mutate()}
            loading={confirmCallMutation.isPending}
            icon={<PhoneOutlined />}
            label={t('technicianWorkflow.calledClientLabel')}
            sublabel={t('technicianWorkflow.calledClientSublabel')}
            color="#08979c"
          />
        </StepCard>
      )}

      {/* ── Step 6: Call confirmed — upload before photos & start work ───────── */}
      {step === 'call_confirmed' && (
        <StepCard step={step} icon={<CameraOutlined />}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            {t('technicianWorkflow.beforeWorkPhotosPrompt')}
          </Text>
          <Upload.Dragger
            multiple
            accept="image/*"
            showUploadList={false}
            disabled={uploadingPhotos}
            beforeUpload={(file) => { handleUploadPhotos([file], 'before_work'); return false; }}
            style={{ borderRadius: 8, marginBottom: 12, border: '1px dashed rgba(22, 119, 255, 0.25)', background: 'rgba(22, 119, 255, 0.08)' }}
          >
            <div style={{ padding: '16px 0' }}>
              {uploadingPhotos ? <Spin size="large" /> : <CameraOutlined style={{ fontSize: 40, color: '#1677ff' }} />}
              <div style={{ marginTop: 8, fontSize: 14, color: '#1677ff', fontWeight: 500 }}>
                {uploadingPhotos ? t('technicianWorkflow.uploadingPhotos') : t('technicianWorkflow.addBeforeWorkPhotos')}
              </div>
              <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
                {t('technicianWorkflow.photoFileTypes')}
              </div>
            </div>
          </Upload.Dragger>
          {beforePhotoCount > 0 && (
            <Alert
              type="success"
              showIcon
              message={t('technicianWorkflow.beforePhotosUploadedSuccess', { count: beforePhotoCount })}
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
          )}
          <PrimaryAction
            onClick={() => startWorkMutation.mutate()}
            loading={startWorkMutation.isPending}
            icon={<ToolOutlined />}
            label={beforePhotoCount > 0 ? t('technicianWorkflow.photosAddedStartWorkLabel') : t('technicianWorkflow.skipPhotosStartWorkLabel')}
            sublabel={t('technicianWorkflow.beginActualWorkSublabel')}
            color="#389e0d"
          />
        </StepCard>
      )}

      {/* ── Step 7: Work started ─────────────────────────────────────────────── */}
      {step === 'work_started' && (
        <StepCard step={step} icon={<ToolOutlined />}>
          <div style={{ padding: '10px 12px', background: 'rgba(82, 196, 26, 0.1)', borderRadius: 8, marginBottom: 12, border: '1px solid rgba(82, 196, 26, 0.25)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ToolOutlined style={{ color: '#52c41a', fontSize: 20 }} />
            <div>
              <Text strong style={{ color: '#52c41a', fontSize: 14 }}>{t('technicianWorkflow.workInProgressStatus')}</Text>
              {session.work_started_at && (
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                  {t('technicianWorkflow.workStartedAt', { time: new Date(session.work_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
                </Text>
              )}
            </div>
          </div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            {t('technicianWorkflow.duringWorkPhotosPrompt')}
          </Text>
          <Upload.Dragger
            multiple
            accept="image/*"
            showUploadList={false}
            disabled={uploadingPhotos}
            beforeUpload={(file) => { handleUploadPhotos([file], 'after_work'); return false; }}
            style={{ borderRadius: 8, marginBottom: 12, border: '1px dashed rgba(82, 196, 26, 0.25)', background: 'rgba(82, 196, 26, 0.1)' }}
          >
            <div style={{ padding: '14px 0' }}>
              {uploadingPhotos ? <Spin size="large" /> : <CameraOutlined style={{ fontSize: 36, color: '#52c41a' }} />}
              <div style={{ marginTop: 8, fontSize: 13, color: '#52c41a', fontWeight: 500 }}>
                {uploadingPhotos ? t('technicianWorkflow.uploadingPhotos') : t('technicianWorkflow.duringWorkPhotosOptional')}
              </div>
            </div>
          </Upload.Dragger>
          {afterPhotoCount > 0 && (
            <Alert
              type="success"
              showIcon
              message={t('technicianWorkflow.afterPhotosAddedSuccess', { count: afterPhotoCount })}
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
          )}
          <PrimaryAction
            onClick={() => markBeforePhotosMutation.mutate()}
            loading={markBeforePhotosMutation.isPending}
            icon={<CheckOutlined />}
            label={t('technicianWorkflow.finishWorkProceedAfterPhotosLabel')}
            sublabel={t('technicianWorkflow.moveToDocumentationStepSublabel')}
            color="#389e0d"
          />
        </StepCard>
      )}

      {/* ── Step 8: After photos ─────────────────────────────────────────────── */}
      {step === 'after_photos' && (
        <StepCard step={step} icon={<CameraOutlined />}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
            {t('technicianWorkflow.afterWorkPhotosPrompt')}
          </Text>
          <Upload.Dragger
            multiple
            accept="image/*"
            showUploadList={false}
            disabled={uploadingPhotos}
            beforeUpload={(file) => { handleUploadPhotos([file], 'after_work'); return false; }}
            style={{ borderRadius: 8, marginBottom: 12, border: '1px dashed rgba(22, 119, 255, 0.25)', background: 'rgba(22, 119, 255, 0.08)' }}
          >
            <div style={{ padding: '16px 0' }}>
              {uploadingPhotos ? <Spin size="large" /> : <CameraOutlined style={{ fontSize: 40, color: '#1677ff' }} />}
              <div style={{ marginTop: 8, fontSize: 14, color: '#1677ff', fontWeight: 500 }}>
                {uploadingPhotos ? t('technicianWorkflow.uploadingPhotos') : t('technicianWorkflow.addAfterWorkPhotos')}
              </div>
              <div style={{ fontSize: 12, opacity: 0.5, marginTop: 4 }}>
                {t('technicianWorkflow.photoFileTypes')}
              </div>
            </div>
          </Upload.Dragger>
          {afterPhotoCount > 0 && (
            <Alert
              type="success"
              showIcon
              message={t('technicianWorkflow.afterPhotosUploadedSuccess', { count: afterPhotoCount })}
              style={{ marginBottom: 12, borderRadius: 8 }}
            />
          )}
          <PrimaryAction
            onClick={handleFinish}
            loading={finishJobMutation.isPending}
            icon={<TrophyOutlined />}
            label={afterPhotoCount > 0 ? t('technicianWorkflow.photosDoneFinishJobLabel') : t('technicianWorkflow.skipFinishJobLabel')}
            sublabel={t('technicianWorkflow.completeWorkOrderSublabel')}
            color="#52c41a"
          />
        </StepCard>
      )}

      {/* ── Step 9: Finished ─────────────────────────────────────────────────── */}
      {step === 'finished' && (
        <div style={{
          textAlign: 'center',
          padding: '32px 20px',
          background: 'linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(82, 196, 26, 0.2) 100%)',
          borderRadius: 12,
          border: '1px solid rgba(82, 196, 26, 0.25)',
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
          <Title level={3} style={{ color: '#52c41a', margin: '0 0 8px' }}>{t('technicianWorkflow.jobCompleteTitle')}</Title>
          <Text style={{ fontSize: 15, color: '#52c41a', display: 'block', marginBottom: 16 }}>
            {t('technicianWorkflow.workOrderFinishedMessage', { woNumber: workOrder.wo_number })}
          </Text>
          {session.finished_at && (
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
              {t('technicianWorkflow.completedAt', { datetime: new Date(session.finished_at).toLocaleString() })}
            </Text>
          )}
        </div>
      )}

      {/* ── Reject modal ─────────────────────────────────────────────────────── */}
      <Modal
        title={<Space><WarningOutlined style={{ color: '#faad14' }} /> {t('technicianWorkflow.rejectModal.title')}</Space>}
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        onOk={handleReject}
        okText={t('technicianWorkflow.rejectModal.okText')}
        okButtonProps={{ danger: true, loading: rejectMutation.isPending }}
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label={t('technicianWorkflow.rejectModal.reasonLabel')} required>
            <Input.TextArea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('technicianWorkflow.rejectModal.reasonPlaceholder')}
              autoFocus
              style={{ borderRadius: 8 }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}