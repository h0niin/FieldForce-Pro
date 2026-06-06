import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { assetsApi, maintenancePlansApi } from '@/api/endpoints';
import { formatDate } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Asset, AssetMaintenancePlan } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function frequencyColor(frequency: string): string {
  switch (frequency) {
    case 'daily': return '#0ea5e9';
    case 'weekly': return '#10b981';
    case 'monthly': return '#6366f1';
    case 'quarterly': return '#f59e0b';
    case 'yearly': return '#8b5cf6';
    default: return colors.textLight;
  }
}

function dueDateStatus(dateStr: string | null): { color: string; label: string; isOverdue: boolean } {
  if (!dateStr) return { color: colors.textLight, label: 'No date set', isOverdue: false };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { color: '#ef4444', label: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
  if (diffDays === 0) return { color: '#f59e0b', label: 'Due today', isOverdue: false };
  if (diffDays <= 7) return { color: '#f59e0b', label: `Due in ${diffDays}d`, isOverdue: false };
  return { color: '#22c55e', label: `Due ${formatDate(dateStr)}`, isOverdue: false };
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ item, onPress }: { item: AssetMaintenancePlan; onPress: () => void }) {
  const freqColor = frequencyColor(item.frequency);
  const due = dueDateStatus(item.next_due_date);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Card header: frequency badge + active status */}
      <View style={styles.cardHeader}>
        <View style={[styles.freqBadge, { backgroundColor: freqColor + '20' }]}>
          <View style={[styles.freqDot, { backgroundColor: freqColor }]} />
          <Text style={[styles.freqBadgeText, { color: freqColor }]}>
            {item.frequency.charAt(0).toUpperCase() + item.frequency.slice(1)}
          </Text>
        </View>
        {!item.is_active && (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveBadgeText}>Inactive</Text>
          </View>
        )}
        {item.auto_create_wo && (
          <View style={styles.autoBadge}>
            <Ionicons name="repeat-outline" size={11} color={ACCENT} />
            <Text style={styles.autoBadgeText}>Auto WO</Text>
          </View>
        )}
      </View>

      {/* Plan name */}
      <Text style={styles.planName} numberOfLines={2}>
        {item.name}
      </Text>

      {/* Description */}
      {item.description ? (
        <Text style={styles.planDesc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      {/* Dates row */}
      <View style={styles.datesRow}>
        {item.next_due_date && (
          <View style={styles.dateItem}>
            <Ionicons
              name={due.isOverdue ? 'alert-circle-outline' : 'calendar-outline'}
              size={13}
              color={due.color}
            />
            <Text style={[styles.dateText, { color: due.color }]}>{due.label}</Text>
          </View>
        )}
        {item.last_completed_date && (
          <View style={styles.dateItem}>
            <Ionicons name="checkmark-done-outline" size={13} color="#22c55e" />
            <Text style={styles.dateTextSecondary}>
              Last done {formatDate(item.last_completed_date)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AssetMaintenanceScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [plans, setPlans] = useState<AssetMaintenancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const loadData = (isRefresh = false) => {
    if (!id) return;
    if (isRefresh) setRefreshing(true);
    setFetchError(false);

    Promise.allSettled([
      assetsApi.getById(id),
      maintenancePlansApi.getByAsset(id),
    ])
      .then(([assetResult, plansResult]) => {
        if (assetResult.status === 'fulfilled') {
          setAsset(assetResult.value.data.data ?? null);
        }
        if (plansResult.status === 'fulfilled') {
          setPlans(plansResult.value.data.data ?? []);
        } else {
          setFetchError(true);
        }
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // ── Header ────────────────────────────────────────────────────────────────

  const Header = (
    <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
        <Ionicons name="arrow-back" size={24} color={c.text} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
          Maintenance Schedule
        </Text>
        {asset && (
          <Text style={[styles.headerSubtitle, { color: c.textSecondary }]} numberOfLines={1}>
            {asset.name}
          </Text>
        )}
      </View>
      <View style={{ width: 40 }} />
    </View>
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        {Header}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </View>
    );
  }

  // ── Summary bar ───────────────────────────────────────────────────────────

  const activePlans = plans.filter((p) => p.is_active).length;
  const overduePlans = plans.filter((p) => {
    if (!p.next_due_date || !p.is_active) return false;
    return new Date(p.next_due_date) < new Date(new Date().setHours(0, 0, 0, 0));
  }).length;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      {Header}

      {plans.length > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{plans.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{activePlans}</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: overduePlans > 0 ? '#ef4444' : colors.text }]}>
              {overduePlans}
            </Text>
            <Text style={styles.summaryLabel}>Overdue</Text>
          </View>
        </View>
      )}

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          plans.length === 0 ? styles.emptyContainer : styles.listContent,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={ACCENT}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name={fetchError ? 'cloud-offline-outline' : 'calendar-outline'}
              size={56}
              color={colors.textLight}
            />
            <Text style={styles.emptyTitle}>
              {fetchError ? 'Could not load schedules' : 'No maintenance schedules'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {fetchError
                ? 'Check your connection and pull down to retry.'
                : 'Maintenance plans added for this asset will appear here.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <PlanCard
            item={item}
            onPress={() => router.push(`/asset/maintenance-plan/${item.id}`)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
  },
  headerSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Summary bar ───────────────────────────────────────────────────────────
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    ...typography.h3,
    color: colors.text,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },

  // ── List ──────────────────────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing['5xl'],
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  separator: {
    height: spacing.sm,
  },

  // ── Plan card ─────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  freqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  freqDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  freqBadgeText: {
    ...typography.bodySmall,
    fontWeight: '600',
    fontSize: 11,
  },
  inactiveBadge: {
    backgroundColor: '#ef444418',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  inactiveBadgeText: {
    ...typography.bodySmall,
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 11,
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: ACCENT + '18',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  autoBadgeText: {
    ...typography.bodySmall,
    color: ACCENT,
    fontWeight: '600',
    fontSize: 11,
  },
  planName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  planDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  datesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  dateTextSecondary: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});
