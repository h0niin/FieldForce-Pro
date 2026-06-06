import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { appointmentsApi, tripsApi, invoicesApi, jobSheetInstancesApi } from '@/api/endpoints';
import { goBack } from '@/utils/navigation';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, spacing, typography, borderRadius } from '@/theme';
const ACCENT = '#4F6BF6';
import { AppointmentStatus } from '@/types/models';
import type { Appointment, Invoice } from '@/types/models';

interface SummaryItem {
  label: string;
  value: string;
  icon: string;
  status: 'ok' | 'warn' | 'neutral';
}

export default function CompleteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [jobSheets, setJobSheets] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const appRes = await appointmentsApi.getById(id);
        const appData = appRes.data.data ?? null;
        setAppointment(appData);

        if (appData?.work_order_id) {
          const invRes = await invoicesApi.getByWorkOrder(appData.work_order_id);
          const foundInvoice = invRes.data.data?.[0] ?? null;
          setInvoice(foundInvoice);
        }

        // Fetch all Job Sheet instances for this work order
        if (appData?.work_order_id) {
          try {
            const jsRes = await jobSheetInstancesApi.getByWorkOrder(appData.work_order_id);
            setJobSheets(jsRes.data.data ?? []);
          } catch (e) {
            console.log('[Diagnostic] No jobsheets found for work order');
          }
        }

      } catch (error) {
        console.error('[Diagnostic] Error loading completion data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const getSummaryItems = (): SummaryItem[] => {
    if (!appointment) {
      return [
        { label: 'Status', value: 'Loading...', icon: 'time-outline', status: 'neutral' },
      ];
    }

    const photoCount = appointment.photos?.length ?? 0;
    const hasSignature = !!appointment.signature_url;
    const allJobSheetsDone = jobSheets.length > 0 && jobSheets.every((js) => js.status === 'completed');
    const someInProgress = jobSheets.some((js) => js.status !== 'completed');
    const sheetCount = jobSheets.length;

    return [
      {
        label: 'Job Sheets',
        value: sheetCount === 0
          ? 'None assigned'
          : allJobSheetsDone
            ? `${sheetCount} completed ✓`
            : `${jobSheets.filter((js) => js.status === 'completed').length}/${sheetCount} completed`,
        icon: 'clipboard-outline',
        status: allJobSheetsDone ? 'ok' : 'warn',
      },
      {
        label: 'Signature',
        value: hasSignature ? 'Captured ✓' : 'Not captured',
        icon: 'create-outline',
        status: hasSignature ? 'ok' : 'warn',
      },
      {
        label: 'Photos',
        value: photoCount > 0 ? `${photoCount} photo${photoCount > 1 ? 's' : ''} ✓` : 'None captured',
        icon: 'camera-outline',
        status: photoCount > 0 ? 'ok' : 'warn',
      },
      {
        label: 'Customer',
        value: appointment.customer_name,
        icon: 'person-outline',
        status: 'ok',
      },
      {
        label: 'Scheduled Time',
        value: `${new Date(appointment.scheduled_start).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })} – ${new Date(appointment.scheduled_end).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        icon: 'time-outline',
        status: 'neutral',
      },
    ];
  };

  const getStatusColor = (status: 'ok' | 'warn' | 'neutral') => {
    switch (status) {
      case 'ok':
        return colors.success;
      case 'warn':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const handleComplete = async () => {
    if (!id) {
      Alert.alert('Error', 'No appointment ID provided.');
      return;
    }

    // Check if all job sheets are completed
    const allSheetsDone = jobSheets.length === 0 || jobSheets.every((js) => js.status === 'completed');
    if (!allSheetsDone) {
      Alert.alert(
        'Incomplete Job Sheets',
        'You must complete all assigned job sheets before marking this work as complete.',
        [{ text: 'OK' }],
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update appointment status to completed
      await appointmentsApi.updateStatus(id, AppointmentStatus.COMPLETED);

      // 2. End any active trip
      try {
        const activeTrip = await tripsApi.getActive();
        if (activeTrip.data.data?.id) {
          await tripsApi.endTrip(activeTrip.data.data.id, {});
        }
      } catch {
        // Trip end failure is non-blocking
      }

      setIsCompleted(true);
    } catch {
      Alert.alert('Error', 'Failed to complete the job. Please try again.', [
        { text: 'Retry', onPress: handleComplete },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <View
        style={[
          styles.successContainer,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing['2xl'], backgroundColor: isDark ? themeColors.background : '#F8F9FB' },
        ]}
      >
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-done-circle" size={80} color={themeColors.success} />
        </View>
        <Text style={styles.successTitle}>Job Completed!</Text>
        <Text style={[styles.successSubtitle, { color: themeColors.textSecondary }]}>
          {appointment?.customer_name
            ? `Great work! The appointment for ${appointment.customer_name} has been marked as completed.`
            : 'The appointment has been marked as completed.'}
        </Text>

        <View style={styles.successActions}>
          {invoice && (Number(invoice.total) - Number(invoice.paid_amount) > 0) && (
            <TouchableOpacity
              style={styles.collectPaymentButton}
              onPress={() => router.push({ pathname: '/appointment/payment', params: { id } })}
            >
              <Ionicons name="card-outline" size={20} color={colors.textInverse} />
              <Text style={styles.homeButtonText}>Collect Payment</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Ionicons name="home-outline" size={20} color={colors.textInverse} />
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scheduleButton, { backgroundColor: cardBg, borderColor }]}
            onPress={() => router.replace('/(tabs)/schedule')}
          >
            <Ionicons name="calendar-outline" size={20} color={ACCENT} />
            <Text style={styles.scheduleButtonText}>View Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing['2xl'] },
      ]}
    >
      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => goBack()}>
        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-done" size={32} color={themeColors.success} />
        </View>
        <Text style={[styles.title, { color: themeColors.text }]}>Complete Job</Text>
        <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>Review the job summary and submit completion</Text>
      </View>

      {/* Summary */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={ACCENT} />
          <Text style={styles.loadingText}>Loading appointment details...</Text>
        </View>
      ) : (
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.summaryHeader, { color: themeColors.textSecondary }]}>Job Summary</Text>
          {getSummaryItems().map((item) => (
            <View key={item.label} style={styles.summaryRow}>
              <View
                style={[
                  styles.summaryIcon,
                  { backgroundColor: getStatusColor(item.status) + '20' },
                ]}
              >
                <Ionicons
                  name={item.icon as any}
                  size={18}
                  color={getStatusColor(item.status)}
                />
              </View>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text
                style={[
                  styles.summaryValue,
                  item.status === 'warn' && { color: colors.warning },
                  item.status === 'ok' && { color: colors.success },
                ]}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Missing signature warning */}
      {!loading && appointment && !appointment.signature_url && (
        <TouchableOpacity
          style={styles.signatureWarning}
          onPress={() => router.push(`/appointment/signature?id=${id}`)}
        >
          <Ionicons name="alert-circle" size={20} color={colors.warning} />
          <View style={styles.signatureWarningText}>
            <Text style={styles.signatureWarningTitle}>No signature captured</Text>
            <Text style={styles.signatureWarningSubtitle}>
              Tap to capture customer signature
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.warning} />
        </TouchableOpacity>
      )}

      {/* Missing or incomplete Job Sheet warning */}
      {!loading && appointment && jobSheets.length > 0 && !jobSheets.every((js) => js.status === 'completed') && (
        <TouchableOpacity
          style={styles.signatureWarning}
          onPress={() => {
            const incomplete = jobSheets.find((js) => js.status !== 'completed');
            if (jobSheets.length === 1 && incomplete) {
              router.push(`/work-order/checklist/${incomplete.work_order_id}?instanceId=${incomplete.id}&appointmentId=${id}`);
            } else {
              router.push(`/work-order/job-sheets?work_order_id=${appointment.work_order_id}&appointment_id=${id}`);
            }
          }}
        >
          <Ionicons name="clipboard-outline" size={20} color={colors.warning} />
          <View style={styles.signatureWarningText}>
            <Text style={styles.signatureWarningTitle}>Job Sheets incomplete</Text>
            <Text style={styles.signatureWarningSubtitle}>
              {`${jobSheets.filter((js) => js.status === 'completed').length}/${jobSheets.length} completed — tap to view`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.warning} />
        </TouchableOpacity>
      )}

      {/* Completion Notes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Completion Notes</Text>
        <TextInput
          style={[styles.notesInput, { backgroundColor: inputBg, borderColor, color: themeColors.text }]}
          placeholder="Add any final notes about the job, parts used, or follow-up required..."
          placeholderTextColor={themeColors.textLight}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          value={notes}
          onChangeText={setNotes}
        />
      </View>

      {/* Payment Section — always visible once loaded */}
      {!loading && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Payment</Text>
          {invoice ? (
            Number(invoice.total) - Number(invoice.paid_amount) > 0 ? (
              <View style={[styles.paymentCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentLabel, { color: themeColors.textSecondary }]}>Balance Due</Text>
                  <Text style={styles.paymentValue}>
                    ${(Number(invoice.total) - Number(invoice.paid_amount)).toFixed(2)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.paymentButton}
                  onPress={() => router.push({ pathname: '/appointment/payment', params: { id } })}
                >
                  <Ionicons name="card-outline" size={20} color={colors.textInverse} />
                  <Text style={styles.paymentButtonText}>Collect Payment</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.paymentCard, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <Text style={[styles.paymentLabel, { color: colors.success, fontWeight: '600' }]}>
                  Invoice fully paid
                </Text>
              </View>
            )
          ) : (
            <View style={[styles.paymentCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={styles.paymentInfo}>
                <Text style={[styles.paymentLabel, { color: themeColors.textSecondary }]}>No invoice found</Text>
                <Text style={styles.paymentHint}>
                  You can still collect payment — the payment screen will handle invoice lookup.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.paymentButton}
                onPress={() => router.push({ pathname: '/appointment/payment', params: { id } })}
              >
                <Ionicons name="card-outline" size={20} color={colors.textInverse} />
                <Text style={styles.paymentButtonText}>Collect Payment</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Complete Button */}
      <TouchableOpacity
        style={[styles.completeButton, isSubmitting && styles.completeButtonDisabled]}
        onPress={handleComplete}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
            <Text style={styles.completeButtonText}>Mark as Complete</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={[styles.disclaimer, { color: themeColors.textLight }]}>
        Marking as complete will notify the dispatcher and update the work order status.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  content: {
    padding: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing['2xl'],
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryHeader: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  summaryValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'right',
    maxWidth: 160,
  },
  signatureWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  signatureWarningText: {
    flex: 1,
  },
  signatureWarningTitle: {
    ...typography.label,
    color: colors.warning,
  },
  signatureWarningSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: spacing['2xl'],
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesInput: {
    ...typography.body,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    minHeight: 120,
    color: colors.text,
  },
  completeButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  completeButtonDisabled: {
    opacity: 0.7,
  },
  completeButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  disclaimer: {
    ...typography.bodySmall,
    color: colors.textLight,
    textAlign: 'center',
  },
  // Success state
  successContainer: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  successIcon: {
    marginBottom: spacing['2xl'],
  },
  successTitle: {
    ...typography.h1,
    color: colors.success,
    marginBottom: spacing.md,
  },
  successSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing['4xl'],
    paddingHorizontal: spacing.lg,
  },
  successActions: {
    width: '100%',
    gap: spacing.md,
  },
  homeButton: {
    flexDirection: 'row',
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
  },
  homeButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
  scheduleButton: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 52,
  },
  scheduleButtonText: {
    ...typography.button,
    color: ACCENT,
  },
  paymentCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentInfo: {
    flex: 1,
    gap: 2,
  },
  paymentLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  paymentHint: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  paymentValue: {
    ...typography.h3,
    color: ACCENT,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    gap: spacing.sm,
  },
  paymentButtonText: {
    ...typography.button,
    fontSize: 14,
    color: colors.textInverse,
  },
  collectPaymentButton: {
    flexDirection: 'row',
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
