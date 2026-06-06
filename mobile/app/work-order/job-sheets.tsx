import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { jobSheetInstancesApi, jobSheetItemsApi } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { goBack } from '@/utils/navigation';

const ACCENT = '#4F6BF6';

interface JobSheetInstance {
  id: string;
  template_id: string;
  work_order_id: string;
  appointment_id?: string;
  status: string;
  custom_fields?: Record<string, any>;
  created_at: string;
  template?: { name: string };
}

interface ItemCountInfo {
  total: number;
  completed: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#6B7280', bg: '#6B728015' },
  in_progress: { label: 'In Progress', color: '#2563EB', bg: '#2563EB15' },
  completed: { label: 'Completed', color: '#16A34A', bg: '#16A34A15' },
  pending_approval: { label: 'Pending Approval', color: '#D97706', bg: '#D9770615' },
  approved: { label: 'Approved', color: '#16A34A', bg: '#16A34A15' },
};

export default function JobSheetsListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const { work_order_id, appointment_id } = useLocalSearchParams<{
    work_order_id: string;
    appointment_id: string;
  }>();

  const [instances, setInstances] = useState<JobSheetInstance[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, ItemCountInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!work_order_id) {
      setLoading(false);
      return;
    }
    loadInstances();
  }, [work_order_id]);

  const loadInstances = async () => {
    setError(null);
    try {
      // Try fetching by work order first; also try by appointment if available
      const res = await jobSheetInstancesApi.getByWorkOrder(work_order_id!);
      let data: JobSheetInstance[] = res.data.data ?? [];

      // If no results by work_order and we have an appointment_id, try that too
      if (data.length === 0 && appointment_id) {
        const aptRes = await jobSheetInstancesApi.getByAppointment(appointment_id);
        data = aptRes.data.data ?? [];
      }

      setInstances(data);

      // Load item counts for each instance
      const counts: Record<string, ItemCountInfo> = {};
      await Promise.all(
        data.map(async (inst) => {
          try {
            const itemsRes = await jobSheetItemsApi.getByInstance(inst.id);
            const items = itemsRes.data.data ?? [];
            const completed = items.filter((item: any) => {
              if (item.type === 'checkbox') return item.value === 'true';
              return item.value !== null && item.value !== '' && item.value !== undefined;
            }).length;
            counts[inst.id] = { total: items.length, completed };
          } catch {
            counts[inst.id] = { total: 0, completed: 0 };
          }
        }),
      );
      setItemCounts(counts);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to load job sheets';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) =>
    STATUS_CONFIG[status] ?? { label: status, color: '#6B7280', bg: '#6B728015' };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing['2xl'],
        },
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => goBack()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Job Sheets</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {instances.length > 0
          ? `${instances.length} sheet${instances.length > 1 ? 's' : ''} assigned to this work order`
          : 'No job sheets assigned'}
      </Text>

      {error ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.emptyTitle, { color: colors.error }]}>Failed to Load</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            style={{ marginTop: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, backgroundColor: ACCENT, borderRadius: borderRadius.md }}
            onPress={() => { setLoading(true); loadInstances(); }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : instances.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No Job Sheets</Text>
          <Text style={styles.emptySubtitle}>
            No job sheets have been assigned to this work order.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {instances.map((instance) => {
            const statusCfg = getStatusConfig(instance.status);
            const counts = itemCounts[instance.id];
            const templateName =
              instance.template?.name ?? 'Job Sheet';

            const isCompleted = instance.status === 'completed' ||
              (counts && counts.total > 0 && counts.completed === counts.total);

            return (
              <TouchableOpacity
                key={instance.id}
                style={[styles.card, { backgroundColor: cardBg, borderColor }, isCompleted && styles.cardCompleted]}
                activeOpacity={0.7}
                onPress={() =>
                  router.push(
                    `/work-order/checklist/${instance.work_order_id}?instanceId=${instance.id}&appointmentId=${appointment_id ?? ''}`,
                  )
                }
              >
                {isCompleted && (
                  <View style={styles.completedBanner}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                    <Text style={styles.completedBannerText}>Completed</Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Ionicons
                      name={isCompleted ? 'clipboard' : 'clipboard-outline'}
                      size={20}
                      color={isCompleted ? colors.success : ACCENT}
                    />
                    <Text style={[styles.cardTitle, { color: colors.text }, isCompleted && styles.cardTitleCompleted]} numberOfLines={1}>
                      {templateName}
                    </Text>
                  </View>
                  {!isCompleted && (
                    <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
                      <Text style={[styles.statusText, { color: statusCfg.color }]}>
                        {statusCfg.label}
                      </Text>
                    </View>
                  )}
                </View>

                {counts && counts.total > 0 && (
                  <View style={styles.progressRow}>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[
                          styles.progressBarFill,
                          {
                            width: `${(counts.completed / counts.total) * 100}%` as `${number}%`,
                            backgroundColor:
                              counts.completed === counts.total ? colors.success : ACCENT,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.progressLabel, isCompleted && { color: colors.success }]}>
                      {counts.completed}/{counts.total} items
                    </Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <Text style={styles.cardDate}>
                    Created {new Date(instance.created_at).toLocaleDateString()}
                  </Text>
                  <Ionicons
                    name={isCompleted ? 'checkmark-done' : 'chevron-forward'}
                    size={16}
                    color={isCompleted ? colors.success : colors.textLight}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing['2xl'],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.textSecondary,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textLight,
    textAlign: 'center',
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardCompleted: {
    backgroundColor: colors.success + '08',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  completedBannerText: {
    ...typography.label,
    color: colors.success,
    fontSize: 13,
  },
  cardTitleCompleted: {
    color: colors.textSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.sm,
  },
  cardTitle: {
    ...typography.label,
    color: colors.text,
    fontSize: 16,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    minWidth: 60,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardDate: {
    ...typography.bodySmall,
    color: colors.textLight,
  },
});
