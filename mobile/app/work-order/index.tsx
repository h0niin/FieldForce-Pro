import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { usePermission } from '@/hooks/usePermission';
import { workOrdersApi } from '@/api/endpoints';
import { JobCard } from '@/components/JobCard';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { PRIORITY_COLORS } from '@/utils/constants';
import { useAppTheme } from '@/hooks/useAppTheme';

const ACCENT = '#4F6BF6';
import type { WorkOrder } from '@/types/models';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterTab = 'today' | 'open' | 'in_progress' | 'urgent' | 'all';

interface Tab {
  key: FilterTab;
  label: string;
}

const TABS: Tab[] = [
  { key: 'all', label: 'All' },
  { key: 'today', label: 'Today' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'urgent', label: 'Urgent' },
];

// ─── Stat card ───────────────────────────────────────────────────────────────

interface StatItem {
  label: string;
  value: number;
  icon: string;
  color: string;
  tab: FilterTab;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { isTechnician } = usePermission();
  const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const firstName = user?.first_name
    ? user.first_name.charAt(0).toUpperCase() + user.first_name.slice(1)
    : 'Technician';

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  // ─── If Technician, show restricted view ──────────────────────────────────
  if (isTechnician) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
        <View style={[styles.empty, { paddingTop: insets.top }]}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Access Restricted</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
            Work orders list is not available for your role. Please check your assigned jobs on the Home screen.
          </Text>
          <TouchableOpacity
            style={{ marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, backgroundColor: ACCENT, borderRadius: borderRadius.full }}
            onPress={() => router.back()}
          >
            <Text style={{ color: colors.white, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Derived counts ────────────────────────────────────────────────────────
  const todayJobs = useMemo(
    () => workOrders.filter((w) => isToday(w.scheduled_start)),
    [workOrders],
  );
  const openJobs = useMemo(
    () => workOrders.filter((w) =>
      ['new', 'estimated', 'approved', 'scheduled', 'open', 'on_hold'].includes(w.status)
    ),
    [workOrders],
  );
  const inProgressJobs = useMemo(
    () => workOrders.filter((w) => w.status === 'in_progress'),
    [workOrders],
  );
  const urgentJobs = useMemo(
    () => workOrders.filter((w) => w.priority === 'urgent' && w.status !== 'completed' && w.status !== 'cancelled'),
    [workOrders],
  );
  const urgentCount = useMemo(() => urgentJobs.length, [urgentJobs]);

  const stats: StatItem[] = [
    { label: 'Today', value: todayJobs.length, icon: 'today-outline', color: ACCENT, tab: 'today' },
    { label: 'Open', value: openJobs.length, icon: 'folder-open-outline', color: colors.statusOpen, tab: 'open' },
    { label: 'In Progress', value: inProgressJobs.length, icon: 'construct-outline', color: colors.statusInProgress, tab: 'in_progress' },
    { label: 'Urgent', value: urgentCount, icon: 'alert-circle-outline', color: colors.priorityUrgent, tab: 'urgent' },
  ];

  // ─── Active list ───────────────────────────────────────────────────────────
  const visibleJobs = useMemo(() => {
    switch (activeTab) {
      case 'today': return todayJobs;
      case 'open': return openJobs;
      case 'in_progress': return inProgressJobs;
      case 'urgent': return urgentJobs;
      default: return workOrders;
    }
  }, [activeTab, todayJobs, openJobs, inProgressJobs, urgentJobs, workOrders]);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchWorkOrders = useCallback(async () => {
    try {
      const res = await workOrdersApi.getAll({ take: 10 });
      setWorkOrders(res.data.data ?? []);
    } catch {
      // Silently fail — offline mode will handle this
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWorkOrders();
    setRefreshing(false);
  }, [fetchWorkOrders]);

  // Refresh every time this tab comes into focus (catches new WOs from FAB)
  useFocusEffect(
    useCallback(() => {
      fetchWorkOrders();
    }, [fetchWorkOrders]),
  );

  const handleJobPress = (wo: WorkOrder) => router.push(`/work-order/${wo.id}`);

  // ─── Header component ─────────────────────────────────────────────────────
  const ListHeader = (
    <View style={{ paddingTop: insets.top + spacing.xl }}>
      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, { backgroundColor: cardBg, borderColor }, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section heading */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {activeTab === 'today' ? "Today's Jobs" :
            activeTab === 'open' ? 'Open Jobs' :
              activeTab === 'in_progress' ? 'In Progress' : 'Work Orders'}
        </Text>
        <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>{visibleJobs.length} job{visibleJobs.length !== 1 ? 's' : ''}</Text>
      </View>
    </View>
  );

  // ─── Empty state ──────────────────────────────────────────────────────────
  const EmptyState = (
    <View style={styles.empty}>
      <Ionicons
        name={loading ? 'hourglass-outline' : 'briefcase-outline'}
        size={48}
        color={colors.textLight}
      />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        {loading ? 'Loading jobs…' : activeTab === 'today' ? 'No jobs scheduled today' : 'No jobs found'}
      </Text>
      {!loading && (
        <Text style={[styles.emptySubtitle, { color: colors.textLight }]}>
          {activeTab === 'today'
            ? 'Enjoy your free time or switch to "All" to see every assignment.'
            : 'Pull down to refresh or try a different filter.'}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing['4xl'] }]}
        data={visibleJobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard workOrder={item} onPress={handleJobPress} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
      />

      {/* FAB – create new work order */}
      <TouchableOpacity
        style={[styles.fab, { bottom: spacing.xl }]}
        onPress={() => router.push('/work-order/new')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  list: { flex: 1 },
  content: { paddingHorizontal: spacing.lg },

  // ── Greeting ──────────────────────────────────────────────────────────────
  greetingWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  greetingLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  greeting: { ...typography.h2, color: colors.text },
  dateLabel: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2, marginBottom: 8 },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: colors.priorityUrgent + '15',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  urgentBadgeText: { ...typography.caption, color: colors.priorityUrgent, fontWeight: '700' },

  // ── Stats ──────────────────────────────────────────────────────────────────
  statsRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
    marginBottom: spacing.xl,
  },
  statCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
    width: 82,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { ...typography.h3 },
  statLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabsRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  tabText: { ...typography.label, color: colors.textSecondary },
  tabTextActive: { color: colors.white },

  // ── Section heading ───────────────────────────────────────────────────────
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.h4, color: colors.text },
  sectionCount: { ...typography.bodySmall, color: colors.textSecondary },

  // ── Empty ─────────────────────────────────────────────────────────────────
  empty: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { ...typography.h4, color: colors.textSecondary, textAlign: 'center' },
  emptySubtitle: { ...typography.body, color: colors.textLight, textAlign: 'center', lineHeight: 22 },

  // ── FAB ───────────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
