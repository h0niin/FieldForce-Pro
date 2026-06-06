import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  appointmentsApi,
  tripsApi,
  invoicesApi,
  jobSheetInstancesApi,
  workOrderLineItemsApi,
  reviewsApi,
  documentApprovalsApi,
} from '@/api/endpoints';
import { useAuthStore } from '@/store/auth.store';
import { StatusBadge } from '@/components/StatusBadge';
import { PhotoCapture } from '@/components/PhotoCapture';
import { ChecklistItem } from '@/components/ChecklistItem';
import { useLocation } from '@/hooks/use-location';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatDateTime, formatAppointmentTimeSpan } from '@/utils/format';
import { goBack } from '@/utils/navigation';
import { colors, spacing, typography, borderRadius } from '@/theme';
const ACCENT = '#4F6BF6';
import { AppointmentStatus } from '@/types/models';
import type { Appointment, ChecklistItemData } from '@/types/models';

const ARRIVAL_CHECKLIST: ChecklistItemData[] = [
  { id: 'arr_1', label: 'Arrived at location', completed: true, notes: null, photo_url: null },
  { id: 'arr_2', label: 'Customer contacted / introduced', completed: false, notes: null, photo_url: null },
  { id: 'arr_3', label: 'Safety assessment done', completed: false, notes: null, photo_url: null },
  { id: 'arr_4', label: 'Tools and parts ready', completed: false, notes: null, photo_url: null },
];

// ── Persist wizard progress per appointment ─────────────────────────────────
const STEP_STORAGE_KEY = (apptId: string) => `wizard_step_${apptId}`;

async function loadPersistedStep(apptId: string): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(STEP_STORAGE_KEY(apptId));
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

function persistStep(apptId: string, step: number) {
  AsyncStorage.setItem(STEP_STORAGE_KEY(apptId), String(step)).catch(() => {});
}

function clearPersistedStep(apptId: string) {
  AsyncStorage.removeItem(STEP_STORAGE_KEY(apptId)).catch(() => {});
}

// ── Step definitions ────────────────────────────────────────────────────────
interface StepDef {
  key: string;
  label: string;
  icon: string;
  statusRequired: AppointmentStatus[];
}

// Step indices:
// 0  start_trip      (scheduled)
// 1  navigation      (en_route)
// 2  call_customer   (on_site)
// 3  arrival_checklist(on_site)
// 4  parts_checklist (on_site, conditional)
// 5  before_photos   (on_site)
// 6  start_work      (on_site)
// 7  work_in_progress(in_progress / on_hold)
// 8  after_photos    (in_progress)
// 9  complete_job    (in_progress)
// 10 collect_payment (completed)
const STEPS: StepDef[] = [
  { key: 'start_trip', label: 'Start Trip', icon: 'car-outline', statusRequired: [AppointmentStatus.SCHEDULED] },
  { key: 'navigation', label: 'Navigation', icon: 'navigate-outline', statusRequired: [AppointmentStatus.EN_ROUTE] },
  { key: 'call_customer', label: 'Call Customer', icon: 'call-outline', statusRequired: [AppointmentStatus.ON_SITE] },
  { key: 'arrival_checklist', label: 'Arrival Checklist', icon: 'checkbox-outline', statusRequired: [AppointmentStatus.ON_SITE] },
  { key: 'parts_checklist', label: 'Parts Checklist', icon: 'construct-outline', statusRequired: [AppointmentStatus.ON_SITE] },
  { key: 'before_photos', label: 'Before Work Photos', icon: 'camera-outline', statusRequired: [AppointmentStatus.ON_SITE] },
  { key: 'start_work', label: 'Start Work', icon: 'play-circle-outline', statusRequired: [AppointmentStatus.ON_SITE] },
  { key: 'work_in_progress', label: 'Work In Progress', icon: 'hammer-outline', statusRequired: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.ON_HOLD] },
  { key: 'after_photos', label: 'After Work Photos', icon: 'camera-outline', statusRequired: [AppointmentStatus.IN_PROGRESS] },
  { key: 'complete_job', label: 'Complete Job Sheet', icon: 'clipboard-outline', statusRequired: [AppointmentStatus.IN_PROGRESS] },
  { key: 'collect_payment', label: 'Collect Payment', icon: 'card-outline', statusRequired: [AppointmentStatus.COMPLETED] },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Component ───────────────────────────────────────────────────────────────
export default function AppointmentDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { location } = useLocation();
  const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  // Data state
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [jobSheets, setJobSheets] = useState<any[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);

  // Local wizard tracking for sub-steps within on_site / in_progress.
  // Persisted to AsyncStorage so it survives screen unmount/remount (Slot-based routing).
  const [localStep, setLocalStepRaw] = useState(0);
  const [stepRestored, setStepRestored] = useState(false);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [partsChecked, setPartsChecked] = useState<Record<string, boolean>>({});
  const [arrivalChecklist, setArrivalChecklist] = useState<ChecklistItemData[]>(ARRIVAL_CHECKLIST);

  // Wrapper: sets state AND persists to AsyncStorage
  const setLocalStep = useCallback((step: number) => {
    setLocalStepRaw(step);
    if (id) persistStep(id, step);
  }, [id]);

  // Restore persisted step on mount
  useEffect(() => {
    if (!id) return;
    loadPersistedStep(id).then((saved) => {
      setLocalStepRaw(saved);
      setStepRestored(true);
    });
  }, [id]);

  // Track previous status to detect server-side status changes on re-fetch
  const prevStatusRef = useRef<AppointmentStatus | null>(null);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data fetching ───────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const res = await appointmentsApi.getById(id);
      const appt = res.data.data ?? null;

      // If the server status changed to a genuinely different phase, reset localStep
      if (appt && prevStatusRef.current !== null && appt.status !== prevStatusRef.current) {
        const old = prevStatusRef.current;
        const samePhase =
          (old === AppointmentStatus.ON_HOLD && appt.status === AppointmentStatus.IN_PROGRESS) ||
          (old === AppointmentStatus.IN_PROGRESS && appt.status === AppointmentStatus.ON_HOLD);
        if (!samePhase) {
          setLocalStepRaw(0);
          if (id) clearPersistedStep(id);
        }
      }
      // Clear persisted step when reaching terminal states
      if (appt && (appt.status === AppointmentStatus.COMPLETED || appt.status === AppointmentStatus.CANCELLED)) {
        if (id) clearPersistedStep(id);
      }
      if (appt) prevStatusRef.current = appt.status;

      setAppointment(appt);

      if (appt?.work_order_id) {
        const [lineItemsRes, jobSheetRes, invoiceRes, reviewRes, approvalsRes] = await Promise.all([
          workOrderLineItemsApi.getByWorkOrder(appt.work_order_id).catch(() => null),
          jobSheetInstancesApi.getByWorkOrder(appt.work_order_id).catch(() => null),
          invoicesApi.getByWorkOrder(appt.work_order_id).catch(() => null),
          reviewsApi.getByWorkOrder(appt.work_order_id).catch(() => null),
          documentApprovalsApi.getByDocument(appt.id).catch(() => null),
        ]);

        if (lineItemsRes?.data?.data) {
          const partItems = (lineItemsRes.data.data as any[]).filter(
            (item: any) => item.type === 'part',
          );
          setParts(partItems);
        }
        if (jobSheetRes?.data?.data) setJobSheets(jobSheetRes.data.data);
        if (invoiceRes?.data?.data?.length) setInvoice(invoiceRes.data.data[0]);
        if (reviewRes?.data?.data?.length) setExistingReview(reviewRes.data.data[0]);
        if (approvalsRes?.data?.data) setApprovals(approvalsRes.data.data);
      }
    } catch {
      // handled by null appointment state
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial fetch
  useEffect(() => { fetchData(); }, [fetchData]);

  // Re-fetch on focus (returning from map, checklist, payment)
  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // ── Timer logic ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!appointment) return;
    const isTimerStatus =
      appointment.status === AppointmentStatus.EN_ROUTE ||
      appointment.status === AppointmentStatus.IN_PROGRESS;

    if (isTimerStatus && appointment.updated_at) {
      const baseline = new Date(appointment.updated_at).getTime();
      const updateElapsed = () => {
        setElapsed(Math.max(0, Math.floor((Date.now() - baseline) / 1000)));
      };
      updateElapsed();
      timerRef.current = setInterval(updateElapsed, 1000);
    } else {
      setElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appointment?.status, appointment?.updated_at]);

  // ── Status update helper ────────────────────────────────────────────────
  const handleUpdateStatus = async (newStatus: AppointmentStatus) => {
    if (updatingStatus || !appointment) return;
    const oldStatus = appointment.status;
    setUpdatingStatus(true);
    try {
      const res = await appointmentsApi.updateStatus(appointment.id, newStatus);
      setAppointment(res.data.data ?? null);
      // Only reset localStep when moving to a genuinely new phase
      // Don't reset when toggling on_hold <-> in_progress (same phase)
      const samePhase =
        (oldStatus === AppointmentStatus.ON_HOLD && newStatus === AppointmentStatus.IN_PROGRESS) ||
        (oldStatus === AppointmentStatus.IN_PROGRESS && newStatus === AppointmentStatus.ON_HOLD);
      if (!samePhase) {
        setLocalStepRaw(0);
        if (appointment.id) clearPersistedStep(appointment.id);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to update status.';
      Alert.alert('Update Failed', msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Step 1: Start Trip ──────────────────────────────────────────────────
  const handleStartTrip = async () => {
    if (!appointment || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      await appointmentsApi.updateStatus(appointment.id, AppointmentStatus.EN_ROUTE);
      await tripsApi.startTrip({
        appointment_id: appointment.id,
        start_lat: location?.coords.latitude || 0,
        start_lng: location?.coords.longitude || 0,
      });
      // Re-fetch to get updated status
      const res = await appointmentsApi.getById(appointment.id);
      setAppointment(res.data.data ?? null);
      // Auto-open map
      if (appointment.latitude != null && appointment.longitude != null) {
        router.push({
          pathname: '/appointment/navigate',
          params: {
            destLat: String(appointment.latitude),
            destLng: String(appointment.longitude),
            destTitle: appointment.address,
            appointmentId: appointment.id,
          },
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to start trip.';
      Alert.alert('Error', msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Reject ──────────────────────────────────────────────────────────────
  const handleReject = () => {
    if (!appointment) return;
    Alert.alert(
      'Reject Appointment',
      'Are you sure you want to reject this appointment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setRejecting(true);
            try {
              await appointmentsApi.updateStatus(appointment.id, AppointmentStatus.CANCELLED);
              setAppointment((prev) =>
                prev ? { ...prev, status: AppointmentStatus.CANCELLED } : prev,
              );
              Alert.alert('Rejected', 'The appointment has been cancelled.', [
                { text: 'OK', onPress: () => goBack() },
              ]);
            } catch {
              Alert.alert('Error', 'Failed to reject.');
            } finally {
              setRejecting(false);
            }
          },
        },
      ],
    );
  };

  // ── Upload photos helper ────────────────────────────────────────────────
  const uploadPhotos = async (photoUris: string[], prefix: string) => {
    if (!appointment || photoUris.length === 0) return;
    const formData = new FormData();
    photoUris.forEach((uri, index) => {
      formData.append('photos', {
        uri,
        name: `${prefix}_${index}.jpg`,
        type: 'image/jpeg',
      } as any);
    });
    try {
      await appointmentsApi.uploadPhotos(appointment.id, formData);
    } catch {
      // Non-blocking
    }
  };

  // Skip parts checklist step if no parts
  const shouldShowStep = (step: StepDef): boolean => {
    if (step.key === 'parts_checklist' && parts.length === 0) return false;
    return true;
  };

  // ── Loading / Error states ──────────────────────────────────────────────
  if (loading || !stepRestored) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
        <Ionicons name="alert-circle-outline" size={48} color={themeColors.textLight} />
        <Text style={[styles.errorText, { color: themeColors.textSecondary }]}>Appointment not found</Text>
      </View>
    );
  }

  const isCancelled = appointment.status === AppointmentStatus.CANCELLED;
  const isCompleted = appointment.status === AppointmentStatus.COMPLETED;
  const isOnHold = appointment.status === AppointmentStatus.ON_HOLD;
  const paymentCollected = invoice && Number(invoice.total || 0) - Number(invoice.paid_amount || 0) <= 0;
  const isFullyDone = isCompleted && paymentCollected;
  const showTimer =
    appointment.status === AppointmentStatus.EN_ROUTE ||
    (appointment.status === AppointmentStatus.IN_PROGRESS && localStep < 10);

  // ── Render step content ─────────────────────────────────────────────────
  const renderStepContent = (step: StepDef, index: number) => {
    const state = getEffectiveStepState(index);
    if (state !== 'active') return null;

    switch (step.key) {
      // Step 1: Start Trip
      case 'start_trip':
        return (
          <View style={[styles.stepBody, { borderTopColor: themeColors.divider }]}>
            <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
              Update status to En Route and open navigation.
            </Text>
            <View style={styles.stepActions}>
              <TouchableOpacity
                style={[styles.rejectBtn, rejecting && { opacity: 0.6 }]}
                onPress={handleReject}
                disabled={rejecting}
              >
                <Ionicons name="close-circle-outline" size={18} color={colors.error} />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }, updatingStatus && { opacity: 0.6 }]}
                onPress={handleStartTrip}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <>
                    <Ionicons name="car" size={18} color={colors.textInverse} />
                    <Text style={styles.primaryBtnText}>Start Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      // Step 2: Navigation
      case 'navigation':
        return (
          <View style={[styles.stepBody, { borderTopColor: themeColors.divider }]}>
            <View style={styles.timerDisplay}>
              <Ionicons name="time-outline" size={20} color={ACCENT} />
              <Text style={styles.timerText}>{formatTimer(elapsed)}</Text>
            </View>
            <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
              Navigating to {appointment.address}
            </Text>
            <View style={styles.stepButtonRow}>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => {
                  router.push({
                    pathname: '/appointment/navigate',
                    params: {
                      destLat: String(appointment.latitude ?? 0),
                      destLng: String(appointment.longitude ?? 0),
                      destTitle: appointment.address,
                      appointmentId: appointment.id,
                    },
                  });
                }}
              >
                <Ionicons name="map-outline" size={18} color={ACCENT} />
                <Text style={styles.secondaryBtnText}>Open Map</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }, updatingStatus && { opacity: 0.6 }]}
                onPress={() => handleUpdateStatus(AppointmentStatus.ON_SITE)}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <>
                    <Ionicons name="location" size={18} color={colors.textInverse} />
                    <Text style={styles.primaryBtnText}>I've Arrived</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );

      // Step 3: Call Customer
      case 'call_customer':
        return (
          <View style={[styles.stepBody, { borderTopColor: themeColors.divider }]}>
            <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
              Optionally call the customer to let them know you've arrived.
            </Text>
            <View style={styles.stepButtonRow}>
              {appointment.customer_phone ? (
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => Linking.openURL(`tel:${appointment.customer_phone}`)}
                >
                  <Ionicons name="call" size={18} color={ACCENT} />
                  <Text style={styles.secondaryBtnText}>Call {appointment.customer_phone}</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setLocalStep(1)}
              >
                <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
                <Text style={styles.primaryBtnText}>
                  {appointment.customer_phone ? 'Skip' : 'Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      // Step 4: Arrival Checklist
      case 'arrival_checklist': {
        const checklistDone = arrivalChecklist.filter((i) => i.completed).length;
        const checklistTotal = arrivalChecklist.length;
        return (
          <View style={[styles.stepBody, { borderTopColor: themeColors.divider }]}>
            <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
              Complete the arrival checklist before beginning work.
            </Text>
            {/* Progress */}
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(checklistDone / checklistTotal) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {checklistDone}/{checklistTotal} items completed
            </Text>
            {/* Checklist items */}
            <View style={styles.checklistCard}>
              {arrivalChecklist.map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={(itemId) =>
                    setArrivalChecklist((prev) =>
                      prev.map((i) =>
                        i.id === itemId ? { ...i, completed: !i.completed } : i,
                      ),
                    )
                  }
                  onNotesChange={(itemId, notes) =>
                    setArrivalChecklist((prev) =>
                      prev.map((i) => (i.id === itemId ? { ...i, notes } : i)),
                    )
                  }
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setLocalStep(2)}
            >
              <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );
      }

      // Step 5: Parts Checklist
      case 'parts_checklist':
        return (
          <View style={[styles.stepBody, { borderTopColor: themeColors.divider }]}>
            <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
              Verify you have all required parts.
            </Text>
            <View style={styles.partsCard}>
              {parts.map((part: any) => (
                <TouchableOpacity
                  key={part.id}
                  style={styles.partRow}
                  onPress={() =>
                    setPartsChecked((prev) => ({ ...prev, [part.id]: !prev[part.id] }))
                  }
                >
                  <Ionicons
                    name={partsChecked[part.id] ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={partsChecked[part.id] ? colors.success : colors.textLight}
                  />
                  <View style={styles.partInfo}>
                    <Text style={styles.partName}>{part.description || part.name || 'Part'}</Text>
                    <Text style={styles.partQty}>Qty: {part.quantity ?? 1}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setLocalStep(3)}
            >
              <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      // Step 6: Before Work Photos
      case 'before_photos':
        return (
          <View style={[styles.stepBody, { borderTopColor: themeColors.divider }]}>
            <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
              Capture photos of the site before starting work.
            </Text>
            <PhotoCapture photos={beforePhotos} onPhotosChange={setBeforePhotos} />
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: spacing.md }]}
              onPress={async () => {
                await uploadPhotos(beforePhotos, 'before');
                setLocalStep(4);
              }}
            >
              <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
              <Text style={styles.primaryBtnText}>
                {beforePhotos.length > 0 ? 'Save & Continue' : 'Skip'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      // Step 6: Start Work
      case 'start_work':
        return (
          <View style={[styles.stepBody, { borderTopColor: themeColors.divider }]}>
            <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
              Ready to begin work. Tap below to start.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, updatingStatus && { opacity: 0.6 }]}
              onPress={() => handleUpdateStatus(AppointmentStatus.IN_PROGRESS)}
              disabled={updatingStatus}
            >
              {updatingStatus ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="play-circle" size={18} color={colors.textInverse} />
                  <Text style={styles.primaryBtnText}>Start Work</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      // Step 7: Work In Progress
      case 'work_in_progress':
        return (
          <View style={[styles.stepBody, { borderTopColor: themeColors.divider }]}>
            {isOnHold ? (
              <View style={styles.onHoldBanner}>
                <Ionicons name="pause-circle" size={20} color="#E9A100" />
                <Text style={styles.onHoldText}>Job is on hold</Text>
              </View>
            ) : (
              <View style={styles.timerDisplay}>
                <Ionicons name="time-outline" size={20} color={ACCENT} />
                <Text style={styles.timerText}>{formatTimer(elapsed)}</Text>
              </View>
            )}
            <View style={styles.stepButtonRow}>
              {isOnHold ? (
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 1 }, updatingStatus && { opacity: 0.6 }]}
                  onPress={() => handleUpdateStatus(AppointmentStatus.IN_PROGRESS)}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <ActivityIndicator size="small" color={colors.textInverse} />
                  ) : (
                    <>
                      <Ionicons name="play-circle" size={18} color={colors.textInverse} />
                      <Text style={styles.primaryBtnText}>Resume</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.holdBtn, updatingStatus && { opacity: 0.6 }]}
                    onPress={() =>
                      Alert.alert('Pause Work', 'Put the job on hold?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Hold', onPress: () => handleUpdateStatus(AppointmentStatus.ON_HOLD) },
                      ])
                    }
                    disabled={updatingStatus}
                  >
                    <Ionicons name="pause-circle" size={18} color={colors.textInverse} />
                    <Text style={styles.primaryBtnText}>Pause</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1 }]}
                    onPress={() => {
                      // Advance: after photos → complete
                      // We just move the active step forward by setting status
                      // For now, after photos is next sub-step
                      setLocalStep(10); // signal to advance past WIP
                    }}
                  >
                    <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
                    <Text style={styles.primaryBtnText}>Finish Work</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        );

      // Step 8: After Work Photos
      case 'after_photos':
        return (
          <View style={[styles.stepBody, { borderTopColor: themeColors.divider }]}>
            {isOnHold && (
              <View style={[styles.onHoldBanner, { marginBottom: spacing.md }]}>
                <Ionicons name="pause-circle" size={20} color="#E9A100" />
                <Text style={styles.onHoldText}>Job is on hold</Text>
                <TouchableOpacity
                  style={[styles.resumeInlineBtn, updatingStatus && { opacity: 0.6 }]}
                  onPress={() => handleUpdateStatus(AppointmentStatus.IN_PROGRESS)}
                  disabled={updatingStatus}
                >
                  <Text style={styles.resumeInlineBtnText}>Resume</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
              Capture photos of the completed work.
            </Text>
            <PhotoCapture photos={afterPhotos} onPhotosChange={setAfterPhotos} />
            <TouchableOpacity
              style={[styles.primaryBtn, { marginTop: spacing.md }]}
              onPress={async () => {
                await uploadPhotos(afterPhotos, 'after');
                setLocalStep(11); // advance to complete job
              }}
            >
              <Ionicons name="arrow-forward" size={18} color={colors.textInverse} />
              <Text style={styles.primaryBtnText}>
                {afterPhotos.length > 0 ? 'Save & Continue' : 'Skip'}
              </Text>
            </TouchableOpacity>
          </View>
        );

      // Step 9: Complete Job Sheet
      case 'complete_job':
        return (
          <View style={[styles.stepBody, { borderTopColor: themeColors.divider }]}>
            {isOnHold && (
              <View style={[styles.onHoldBanner, { marginBottom: spacing.md }]}>
                <Ionicons name="pause-circle" size={20} color="#E9A100" />
                <Text style={styles.onHoldText}>Job is on hold</Text>
                <TouchableOpacity
                  style={[styles.resumeInlineBtn, updatingStatus && { opacity: 0.6 }]}
                  onPress={() => handleUpdateStatus(AppointmentStatus.IN_PROGRESS)}
                  disabled={updatingStatus}
                >
                  <Text style={styles.resumeInlineBtnText}>Resume</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.stepDescription, { color: themeColors.textSecondary }]}>
              {jobSheets.length > 0
                ? 'Complete the job sheet checklist, then mark the job as complete.'
                : 'Mark the job as complete.'}
            </Text>
            {jobSheets.length > 0 && (
              <TouchableOpacity
                style={[styles.secondaryBtn, { marginBottom: spacing.sm }]}
                onPress={() => {
                  if (jobSheets.length === 1) {
                    router.push(
                      `/work-order/checklist/${jobSheets[0].work_order_id}?instanceId=${jobSheets[0].id}&appointmentId=${appointment.id}`,
                    );
                  } else {
                    router.push(
                      `/work-order/job-sheets?work_order_id=${appointment.work_order_id}&appointment_id=${appointment.id}`,
                    );
                  }
                }}
              >
                <Ionicons name="clipboard-outline" size={18} color={ACCENT} />
                <Text style={styles.secondaryBtnText}>
                  Open Job Sheet{jobSheets.length > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.successBtn, updatingStatus && { opacity: 0.6 }]}
              onPress={() => handleUpdateStatus(AppointmentStatus.COMPLETED)}
              disabled={updatingStatus}
            >
              {updatingStatus ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={18} color={colors.textInverse} />
                  <Text style={styles.primaryBtnText}>Mark Complete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        );

      // Step 10: Collect Payment
      case 'collect_payment': {
        const paid = Number(invoice?.paid_amount || 0);
        const total = Number(invoice?.total || 0);
        const fullyPaid = invoice && total - paid <= 0;

        return (
          <View style={[styles.stepBody, { borderTopColor: themeColors.divider }]}>
            {fullyPaid ? (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={styles.completedBadgeText}>
                  Payment Collected (${paid.toFixed(2)})
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  router.push({
                    pathname: '/appointment/payment',
                    params: { id: appointment.id },
                  })
                }
              >
                <Ionicons name="card-outline" size={18} color={colors.textInverse} />
                <Text style={styles.primaryBtnText}>
                  {invoice
                    ? `Collect $${(total - paid).toFixed(2)}`
                    : 'Collect Payment'}
                </Text>
              </TouchableOpacity>
            )}
            {/* Review section */}
            {existingReview ? (
              <View style={[styles.completedBadge, { marginTop: spacing.sm }]}>
                <Ionicons name="star" size={18} color="#F59E0B" />
                <Text style={styles.completedBadgeText}>
                  Review Collected ({existingReview.rating}/5)
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.secondaryBtn, { marginTop: spacing.sm }]}
                onPress={() =>
                  router.push({
                    pathname: '/review-prompt' as any,
                    params: {
                      workOrderId: appointment.work_order_id ?? appointment.id,
                      contactId: (appointment as any).contact_id ?? '',
                      workOrderNumber: (appointment as any).work_order_number ?? '',
                      technicianName: (appointment as any).agent_name ?? '',
                      serviceSummary: (appointment as any).summary ?? '',
                    },
                  })
                }
              >
                <Ionicons name="star-outline" size={18} color={ACCENT} />
                <Text style={styles.secondaryBtnText}>Collect Review</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      }

      default:
        return null;
    }
  };

  // ── Selector for pending job assignment acceptance
  const { user } = useAuthStore();
  const pendingScheduleApproval = useMemo(() => {
    if (!appointment || appointment.status !== AppointmentStatus.SCHEDULED) return null;
    return approvals.find(
      (app) =>
        app.document_type === 'SCHEDULE' &&
        app.status === 'PENDING' &&
        app.approver_id === user?.id
    );
  }, [approvals, appointment, user]);

  // ── Unified active step calculation ─────────────────────────────────────
  // Merges server status with local sub-step tracking into a single step index.
  // on_site localStep: 0=call, 1=checklist, 2=parts, 3=before photos, 4=start work
  // in_progress localStep: 0-9=WIP, 10=after photos, 11+=complete job
  const getEffectiveActiveStep = (): number => {
    if (!appointment) return -1;
    const status = appointment.status;

    if (status === AppointmentStatus.SCHEDULED) return 0;  // Start Trip
    if (status === AppointmentStatus.EN_ROUTE) return 1;   // Navigation
    if (status === AppointmentStatus.ON_SITE) {
      const hasParts = parts.length > 0;
      if (localStep === 0) return 2;                       // Call Customer
      if (localStep === 1) return 3;                       // Arrival Checklist
      if (localStep === 2 && hasParts) return 4;           // Parts Checklist
      if (localStep === 2 && !hasParts) return 5;          // Skip parts → Before Photos
      if (localStep === 3) return 5;                       // Before Photos
      if (localStep >= 4) return 6;                        // Start Work
      return 2;
    }
    if (status === AppointmentStatus.IN_PROGRESS || status === AppointmentStatus.ON_HOLD) {
      if (localStep >= 11) return 9;                       // Complete Job Sheet
      if (localStep >= 10) return 8;                       // After Work Photos
      return 7;                                            // Work In Progress
    }
    if (status === AppointmentStatus.COMPLETED) return 10; // Collect Payment
    return -1;
  };

  const effectiveActive = getEffectiveActiveStep();

  const getEffectiveStepState = (index: number): 'done' | 'active' | 'pending' => {
    if (index < effectiveActive) return 'done';
    if (index === effectiveActive) return 'active';
    return 'pending';
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing['2xl'],
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.customerName, { color: themeColors.text }]} numberOfLines={1}>
            {appointment.customer_name}
          </Text>
          <View style={styles.headerMeta}>
            <StatusBadge status={appointment.status} />
            <Text style={[styles.scheduleText, { color: themeColors.textSecondary }]}>
              {formatAppointmentTimeSpan(appointment.scheduled_start, appointment.scheduled_end)}
            </Text>
          </View>
        </View>
        {!isCancelled && !isFullyDone && (
          <TouchableOpacity onPress={handleReject}>
            <Ionicons name="close-circle-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {/* Timer (shown during en_route and in_progress) */}
      {showTimer && (
        <View style={styles.globalTimer}>
          <Ionicons name="time-outline" size={16} color={ACCENT} />
          <Text style={styles.globalTimerText}>{formatTimer(elapsed)}</Text>
        </View>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <View style={styles.cancelledBanner}>
          <Ionicons name="close-circle" size={24} color={colors.error} />
          <Text style={styles.cancelledText}>Appointment Cancelled</Text>
        </View>
      )}

      {/* Completed banner — only after payment is also collected */}
      {isFullyDone && (
        <View style={styles.completedBanner}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={styles.completedText}>Appointment Completed</Text>
        </View>
      )}

      {/* Pending assignment acceptance banner */}
      {pendingScheduleApproval && (
        <View style={[styles.stepCard, { backgroundColor: cardBg, borderColor, borderLeftWidth: 4, borderLeftColor: ACCENT }]}>
          <Text style={[styles.stepTitle, { color: themeColors.text, fontWeight: '700', fontSize: 16, marginBottom: 8 }]}>
            New Job Assignment
          </Text>
          <Text style={[styles.stepDescription, { color: themeColors.textSecondary, marginBottom: 16 }]}>
            You have been assigned to this job. Please accept or decline the assignment below.
          </Text>
          <View style={styles.stepActions}>
            <TouchableOpacity
              style={[styles.rejectBtn, { flex: 1 }]}
              onPress={async () => {
                Alert.alert('Decline Assignment', 'Are you sure you want to decline this assignment?', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: async () => {
                      setUpdatingStatus(true);
                      try {
                        await documentApprovalsApi.process(pendingScheduleApproval.id, {
                          action: 'REJECT',
                          comments: 'Declined by technician via app',
                        });
                        Alert.alert('Declined', 'Assignment declined.', [
                          { text: 'OK', onPress: () => goBack() }
                        ]);
                      } catch (err: any) {
                        const msg = err?.response?.data?.message ?? 'Failed to decline assignment.';
                        Alert.alert('Error', msg);
                      } finally {
                        setUpdatingStatus(false);
                        fetchData();
                      }
                    }
                  }
                ]);
              }}
              disabled={updatingStatus}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.error} />
              <Text style={styles.rejectBtnText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1 }]}
              onPress={async () => {
                setUpdatingStatus(true);
                try {
                  await documentApprovalsApi.process(pendingScheduleApproval.id, {
                    action: 'APPROVE',
                    comments: 'Accepted by technician via app',
                  });
                  Alert.alert('Accepted', 'Assignment accepted successfully.', [
                    { text: 'OK', onPress: () => fetchData() }
                  ]);
                } catch (err: any) {
                  const msg = err?.response?.data?.message ?? 'Failed to accept assignment.';
                  Alert.alert('Error', msg);
                } finally {
                  setUpdatingStatus(false);
                }
              }}
              disabled={updatingStatus}
            >
              {updatingStatus ? (
                <ActivityIndicator size="small" color={themeColors.textInverse} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={themeColors.textInverse} />
                  <Text style={styles.primaryBtnText}>Accept Job</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Step cards — hide when fully done (completed + paid) or when acceptance is pending */}
      {!isCancelled && !isFullyDone && !pendingScheduleApproval &&
        STEPS.map((step, index) => {
          if (!shouldShowStep(step)) return null;
          const state = getEffectiveStepState(index);

          return (
            <View key={step.key} style={[styles.stepCard, { backgroundColor: cardBg, borderColor }]}>
              {/* Step indicator */}
              <View style={styles.stepHeader}>
                <View
                  style={[
                    styles.stepCircle,
                    state === 'done' && styles.stepCircleDone,
                    state === 'active' && styles.stepCircleActive,
                  ]}
                >
                  {state === 'done' ? (
                    <Ionicons name="checkmark" size={14} color={themeColors.textInverse} />
                  ) : (
                    <Ionicons
                      name={step.icon as any}
                      size={14}
                      color={state === 'active' ? themeColors.textInverse : themeColors.textLight}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepTitle,
                    state === 'done' && styles.stepTitleDone,
                    state === 'active' && [styles.stepTitleActive, { color: themeColors.text }],
                  ]}
                >
                  {step.label}
                </Text>
                {state === 'done' && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                )}
              </View>

              {/* Expanded content for active step */}
              {state === 'active' && renderStepContent(step, index)}
            </View>
          );
        })}

      {/* Customer Info (always visible at bottom) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Customer Info</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={[styles.infoRow, { borderBottomColor: themeColors.divider }]}>
            <Ionicons name="person-outline" size={18} color={themeColors.textSecondary} />
            <Text style={[styles.infoText, { color: themeColors.text }]}>{appointment.customer_name}</Text>
          </View>
          {appointment.customer_phone && (
            <TouchableOpacity
              style={[styles.infoRow, { borderBottomColor: themeColors.divider }]}
              onPress={() => Linking.openURL(`tel:${appointment.customer_phone}`)}
            >
              <Ionicons name="call-outline" size={18} color={ACCENT} />
              <Text style={[styles.infoText, { color: ACCENT }]}>
                {appointment.customer_phone}
              </Text>
            </TouchableOpacity>
          )}
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="location-outline" size={18} color={themeColors.textSecondary} />
            <Text style={[styles.infoText, { color: themeColors.text }]}>{appointment.address}</Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      {appointment.notes && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Notes</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.notesText, { color: themeColors.text }]}>{appointment.notes}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerCenter: {
    flex: 1,
    gap: 4,
  },
  customerName: {
    ...typography.h3,
    color: colors.text,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scheduleText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // Global timer
  globalTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ACCENT + '12',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  globalTimerText: {
    ...typography.h4,
    color: ACCENT,
    fontFamily: undefined,
    fontVariant: ['tabular-nums'],
  },

  // Terminal banners
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.error + '15',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderColor: colors.error + '40',
    marginBottom: spacing.lg,
  },
  cancelledText: {
    ...typography.h4,
    color: colors.error,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + '40',
    marginBottom: spacing.lg,
  },
  completedText: {
    ...typography.h4,
    color: colors.success,
  },

  // Step cards
  stepCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: {
    backgroundColor: colors.success,
  },
  stepCircleActive: {
    backgroundColor: ACCENT,
  },
  stepTitle: {
    ...typography.label,
    color: colors.textLight,
    flex: 1,
  },
  stepTitleDone: {
    color: colors.textSecondary,
  },
  stepTitleActive: {
    color: colors.text,
    fontWeight: '700',
  },

  // Step body (expanded content)
  stepBody: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  stepDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  stepActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepButtonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  // Buttons
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  primaryBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: ACCENT,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  secondaryBtnText: {
    ...typography.button,
    color: ACCENT,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  rejectBtnText: {
    ...typography.button,
    color: colors.error,
  },
  successBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  holdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#E9A100',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  // Arrival checklist
  progressBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: ACCENT,
    borderRadius: borderRadius.full,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  checklistCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },

  // Timer display
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: ACCENT + '10',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  timerText: {
    ...typography.h3,
    color: ACCENT,
    fontVariant: ['tabular-nums'],
  },

  // On Hold banner
  onHoldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#E9A10015',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: '#E9A10040',
    marginBottom: spacing.md,
  },
  onHoldText: {
    ...typography.body,
    color: '#E9A100',
    fontWeight: '600',
    flex: 1,
  },
  resumeInlineBtn: {
    backgroundColor: ACCENT,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  resumeInlineBtnText: {
    ...typography.bodySmall,
    color: colors.textInverse,
    fontWeight: '600',
  },

  // Parts checklist
  partsCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    ...typography.body,
    color: colors.text,
  },
  partQty: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // Completed badge (inline)
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '12',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  completedBadgeText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '600',
  },

  // Customer info section
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  infoText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  notesText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    paddingVertical: spacing.md,
  },
});
