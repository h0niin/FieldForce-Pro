import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  RefreshControl,
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
import { useAppTheme } from '@/hooks/useAppTheme';
import { workOrdersApi, appointmentsApi } from '@/api/endpoints';
import { StatusBadge } from '@/components/StatusBadge';
import { useNotificationStore } from '@/store/notifications.store';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { formatTime } from '@/utils/format';
import { PRIORITY_COLORS } from '@/utils/constants';
import type { WorkOrder, Appointment } from '@/types/models';

const SCREEN_W = Dimensions.get('window').width;
const PAD = 20;
const CARD_GAP = 12;
const STAT_CARD_W = (SCREEN_W - PAD * 2 - CARD_GAP) / 2;

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

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getInitials(first?: string, last?: string): string {
  const f = first?.charAt(0)?.toUpperCase() || '';
  const l = last?.charAt(0)?.toUpperCase() || '';
  return f + l || '?';
}

function formatDateHeader(): string {
  const d = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = '#4F6BF6';
const CHART_BAR_MAX_H = 100;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface StatDef {
  key: string;
  label: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

const STAT_DEFS: StatDef[] = [
  { key: 'assigned', label: 'Assigned', icon: 'clipboard-outline', iconBg: '#EEF2FF', iconColor: ACCENT },
  { key: 'pending', label: 'Pending', icon: 'time-outline', iconBg: '#FFF7ED', iconColor: '#F97316' },
  { key: 'urgent', label: 'Urgent', icon: 'warning-outline', iconBg: '#FEF2F2', iconColor: '#EF4444' },
  { key: 'done', label: 'Done', icon: 'checkmark-circle-outline', iconBg: '#F0FDF4', iconColor: '#22C55E' },
];


// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { can, isTechnician } = usePermission();
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'User';
  const initials = getInitials(user?.first_name, user?.last_name);

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMoreUI, setLoadingMoreUI] = useState(false);
  const [hasMoreUI, setHasMoreUI] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  // ─── Technician state ──────────────────────────────────────────────────────
  const [techAppointments, setTechAppointments] = useState<Appointment[]>([]);
  const [techWorkOrders, setTechWorkOrders] = useState<WorkOrder[]>([]);

  // ─── Derived counts (non-tech) ────────────────────────────────────────────
  const adminStats = useMemo(() => {
    const assigned = workOrders.filter(w =>
      ['new', 'estimated', 'approved', 'scheduled'].includes(w.status)
    ).length;
    const pending = workOrders.filter(w => w.status === 'on_hold').length;
    const urgent = workOrders.filter(w =>
      w.priority === 'urgent' && w.status !== 'completed' && w.status !== 'cancelled'
    ).length;
    const done = workOrders.filter(w => w.status === 'completed').length;
    return { assigned, pending, urgent, done };
  }, [workOrders]);

  const todayOrders = useMemo(() => {
    const active = workOrders.filter(w => w.status !== 'cancelled');
    const sortByStatus = (a: WorkOrder, b: WorkOrder) => {
      const so = (s: string) => (s === 'in_progress' ? 0 : s === 'completed' ? 2 : 1);
      const diff = so(a.status) - so(b.status);
      if (diff !== 0) return diff;
      return new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime();
    };

    const today = active.filter(w => isToday(w.scheduled_start)).sort(sortByStatus);
    if (today.length > 0) return { items: today, label: "TODAY'S ORDERS" };

    // Find next day with orders
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const future = active
      .filter(w => {
        if (!w.scheduled_start) return false;
        const d = new Date(w.scheduled_start);
        d.setHours(0, 0, 0, 0);
        return d.getTime() > now.getTime();
      })
      .sort((a, b) => new Date(a.scheduled_start!).getTime() - new Date(b.scheduled_start!).getTime());

    if (future.length > 0) {
      const nextDate = new Date(future[0].scheduled_start!);
      nextDate.setHours(0, 0, 0, 0);
      const nextDayItems = future.filter(w => {
        const d = new Date(w.scheduled_start!);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === nextDate.getTime();
      }).sort(sortByStatus);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const isTomorrow = nextDate.getTime() === tomorrow.getTime();
      const dateLabel = isTomorrow
        ? "TOMORROW'S ORDERS"
        : `${days[nextDate.getDay()].toUpperCase()}, ${months[nextDate.getMonth()]} ${nextDate.getDate()}`;

      return { items: nextDayItems, label: dateLabel };
    }

    return { items: [] as WorkOrder[], label: "TODAY'S ORDERS" };
  }, [workOrders]);

  // ─── Derived counts (tech) ────────────────────────────────────────────────
  const techStats = useMemo(() => {
    let assigned = 0, pending = 0, urgent = 0, done = 0;
    techAppointments.forEach(a => {
      if (a.status === 'completed') done++;
      else if (a.status === 'on_hold') pending++;
      else if (a.status !== 'cancelled') assigned++;
    });
    techWorkOrders.forEach(w => {
      if (w.priority === 'urgent' && w.status !== 'completed' && w.status !== 'cancelled') urgent++;
    });
    return { assigned, pending, urgent, done };
  }, [techAppointments, techWorkOrders]);

  const todayAppointments = useMemo(() => {
    const active = techAppointments.filter(a => a.status !== 'cancelled');
    const sortByStatus = (a: Appointment, b: Appointment) => {
      const aA = ['en_route', 'on_site', 'in_progress'].includes(a.status) ? 0 : 1;
      const bA = ['en_route', 'on_site', 'in_progress'].includes(b.status) ? 0 : 1;
      if (aA !== bA) return aA - bA;
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;
      return new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime();
    };

    // Try today first
    const today = active.filter(a => isToday(a.scheduled_start)).sort(sortByStatus);
    if (today.length > 0) return { items: today, label: "TODAY'S ORDERS" };

    // If no today orders, find next day that has orders
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const future = active
      .filter(a => {
        const d = new Date(a.scheduled_start);
        d.setHours(0, 0, 0, 0);
        return d.getTime() > now.getTime();
      })
      .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime());

    if (future.length > 0) {
      const nextDate = new Date(future[0].scheduled_start);
      nextDate.setHours(0, 0, 0, 0);
      const nextDayItems = future.filter(a => {
        const d = new Date(a.scheduled_start);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === nextDate.getTime();
      }).sort(sortByStatus);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const isTomorrow = nextDate.getTime() === tomorrow.getTime();
      const dateLabel = isTomorrow
        ? "TOMORROW'S ORDERS"
        : `${days[nextDate.getDay()].toUpperCase()}, ${months[nextDate.getMonth()]} ${nextDate.getDate()}`;

      return { items: nextDayItems, label: dateLabel };
    }

    return { items: [] as Appointment[], label: "TODAY'S ORDERS" };
  }, [techAppointments]);

  const currentStats = isTechnician ? techStats : adminStats;

  // ─── Weekly activity chart data ──────────────────────────────────────────────
  const weeklyData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    // Monday-based: Mon=0..Sun=6
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
    const completedCounts = [0, 0, 0, 0, 0, 0, 0];

    const items = isTechnician ? techAppointments : workOrders;
    items.forEach((item) => {
      const dateStr = item.scheduled_start || item.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const diff = Math.floor((d.getTime() - monday.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < 7) {
        counts[diff]++;
        if (item.status === 'completed') completedCounts[diff]++;
      }
    });

    const max = Math.max(...counts, 1);
    return DAY_LABELS.map((label, i) => ({
      label,
      total: counts[i],
      completed: completedCounts[i],
      height: (counts[i] / max) * CHART_BAR_MAX_H,
      completedHeight: (completedCounts[i] / max) * CHART_BAR_MAX_H,
      isToday: i === mondayOffset,
    }));
  }, [isTechnician, techAppointments, workOrders]);

  // ─── Fetch (non-tech) ────────────────────────────────────────────────────
  const fetchWorkOrders = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
      if (!hasMoreRef.current || loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setLoadingMoreUI(true);
    } else {
      setLoading(true);
      setFetchError(null);
    }
    try {
      const page = isLoadMore ? pageRef.current + 1 : 1;
      const take = isLoadMore ? 20 : 100;
      const res = await workOrdersApi.getAll({ page, take });
      const newData = res.data?.data ?? [];
      const more = res.data?.meta?.hasNextPage ?? (newData.length === take);
      hasMoreRef.current = more;
      setHasMoreUI(more);
      if (isLoadMore) {
        setWorkOrders(prev => {
          const ids = new Set(prev.map(w => w.id));
          return [...prev, ...newData.filter(w => !ids.has(w.id))];
        });
        pageRef.current = page;
      } else {
        setWorkOrders(newData);
        pageRef.current = 1;
      }
    } catch (err: any) {
      console.error('[Home] Failed to fetch work orders:', err);
      setFetchError(err?.response?.status === 403 ? 'No permission to view work orders' : (err?.message || 'Failed to load'));
    } finally {
      if (isLoadMore) { loadingMoreRef.current = false; setLoadingMoreUI(false); }
      else setLoading(false);
    }
  }, []);

  // ─── Fetch (tech) ────────────────────────────────────────────────────────
  const fetchTechMetrics = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [aptResult, woResult] = await Promise.allSettled([
        appointmentsApi.getMyAppointments({ take: 100 }),
        workOrdersApi.getMyWorkOrders({ take: 100 }),
      ]);
      const errors: string[] = [];
      if (aptResult.status === 'rejected') {
        const status = aptResult.reason?.response?.status;
        errors.push(`Appointments: ${status || aptResult.reason?.message || 'failed'}`);
      }
      if (woResult.status === 'rejected') {
        const status = woResult.reason?.response?.status;
        errors.push(`Work orders: ${status || woResult.reason?.message || 'failed'}`);
      }
      const apts = aptResult.status === 'fulfilled' ? (aptResult.value.data?.data ?? []) : [];
      const wos = woResult.status === 'fulfilled' ? (woResult.value.data?.data ?? []) : [];
      setTechAppointments(apts);
      setTechWorkOrders(wos);
      if (errors.length > 0 && apts.length === 0 && wos.length === 0) {
        setFetchError(errors.join('. '));
      }
    } catch (err: any) {
      console.error('[Home] Failed to fetch tech metrics:', err);
      setFetchError(err?.message || 'Failed to load data');
    } finally { setLoading(false); }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isTechnician) fetchTechMetrics();
      else fetchWorkOrders(false);
    }, [isTechnician, fetchTechMetrics, fetchWorkOrders]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isTechnician) await fetchTechMetrics();
    else await fetchWorkOrders(false);
    setRefreshing(false);
  }, [isTechnician, fetchTechMetrics, fetchWorkOrders]);

  const statValues: Record<string, number> = {
    assigned: currentStats.assigned,
    pending: currentStats.pending,
    urgent: currentStats.urgent,
    done: currentStats.done,
  };

  // ─── List data ──────────────────────────────────────────────────────────────
  const orderData = isTechnician ? todayAppointments : todayOrders;
  const listData: (WorkOrder | Appointment)[] = orderData.items;
  const ordersLabel = orderData.label;

  // ─── Order card ─────────────────────────────────────────────────────────────
  const getStatusAccent = (status: string) => {
    if (['in_progress', 'en_route', 'on_site'].includes(status)) return ACCENT;
    if (status === 'completed') return '#22C55E';
    if (status === 'on_hold') return '#F97316';
    if (status === 'cancelled') return '#EF4444';
    return '#94A3B8';
  };

  const renderOrderCard = (item: WorkOrder | Appointment, index: number) => {
    const isAppt = 'customer_name' in item;
    const title = isAppt ? (item as Appointment).customer_name : (item as WorkOrder).summary;
    const woNum = isAppt ? null : (item as WorkOrder).wo_number;
    const priority = isAppt ? null : (item as WorkOrder).priority;
    const location = isAppt ? (item as Appointment).address : (item as WorkOrder).category;
    const time = isAppt
      ? formatTime((item as Appointment).scheduled_start)
      : formatTime((item as WorkOrder).scheduled_start);
    const status = item.status;
    const id = item.id;
    const priorityColor = priority ? (PRIORITY_COLORS[priority] ?? colors.textSecondary) : null;
    const accentColor = getStatusAccent(status);
    const isActive = ['in_progress', 'en_route', 'on_site'].includes(status);

    return (
      <TouchableOpacity
        key={id}
        style={[styles.orderCard, { backgroundColor: cardBg, borderColor }]}
        activeOpacity={0.7}
        onPress={() => {
          if (isAppt) router.push(`/appointment/${id}`);
          else router.push(`/work-order/${id}`);
        }}
      >
        {/* Left accent bar */}
        <View style={[styles.orderAccent, { backgroundColor: accentColor }]} />

        <View style={styles.orderContent}>
          {/* Top row: WO number / time + status badge */}
          <View style={styles.orderTopRow}>
            <View style={styles.orderTopLeft}>
              {woNum && (
                <View style={styles.orderWoNumWrap}>
                  <Text style={styles.orderWoNum}>{woNum}</Text>
                </View>
              )}
              {priorityColor && (
                <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '18' }]}>
                  <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
                  <Text style={[styles.priorityText, { color: priorityColor }]}>
                    {(priority ?? '').charAt(0).toUpperCase() + (priority ?? '').slice(1)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.orderTopRight}>
              <StatusBadge status={status} />
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.orderTitle, { color: colors.text }, isActive && styles.orderTitleActive]} numberOfLines={2}>
            {title || 'Untitled'}
          </Text>

          {/* Meta row */}
          <View style={styles.orderMeta}>
            {time ? (
              <View style={styles.orderMetaChip}>
                <Ionicons name="time-outline" size={13} color={ACCENT} />
                <Text style={styles.orderMetaChipText}>{time}</Text>
              </View>
            ) : null}
            {location ? (
              <View style={[styles.orderMetaItem, { flex: 1 }]}>
                <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.orderMetaText} numberOfLines={1}>{location}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Header ─────────────────────────────────────────────────────────────────
  const ListHeader = (
    <View style={[styles.headerWrap, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
      {/* Greeting bar */}
      <View style={[styles.greetingBar, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg }]}>
        <View style={styles.greetingLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={[styles.greetingSmall, { color: colors.textSecondary }]}>{greeting()}</Text>
            <Text style={[styles.greetingName, { color: colors.text }]}>{fullName}</Text>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDateHeader()}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerIconBtn, { backgroundColor: isDark ? colors.surface : '#F1F5F9' }]}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="search-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Stat cards 2x2 */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          {STAT_DEFS.map((def) => (
            <View key={def.key} style={[styles.statCard, { backgroundColor: cardBg, borderColor }]}>
              <View style={[styles.statIconWrap, { backgroundColor: def.iconBg }]}>
                <Ionicons name={def.icon as any} size={22} color={def.iconColor} />
              </View>
              <View style={styles.statText}>
                <Text style={[styles.statValue, { color: colors.text }]}>{statValues[def.key] ?? 0}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{def.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Weekly activity chart */}
      <View style={styles.chartSection}>
        <View style={[styles.chartCard, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Weekly Activity</Text>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: ACCENT }]} />
                <Text style={styles.legendText}>Total</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.legendText}>Done</Text>
              </View>
            </View>
          </View>
          <View style={styles.chartArea}>
            {weeklyData.map((bar) => (
              <View key={bar.label} style={styles.barCol}>
                <View style={styles.barTrack}>
                  {/* Total bar */}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(bar.height, bar.total > 0 ? 4 : 0),
                        backgroundColor: bar.isToday ? ACCENT : '#CBD5E1',
                      },
                    ]}
                  />
                  {/* Completed overlay */}
                  {bar.completed > 0 && (
                    <View
                      style={[
                        styles.barCompleted,
                        { height: Math.max(bar.completedHeight, 4) },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.barLabel,
                    bar.isToday && styles.barLabelToday,
                  ]}
                >
                  {bar.label}
                </Text>
                {bar.isToday && <View style={styles.todayIndicator} />}
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Orders heading */}
      <View style={styles.ordersHeader}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>{ordersLabel}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/schedule')}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Empty ──────────────────────────────────────────────────────────────────
  const EmptyState = (
    <View style={styles.emptyWrap}>
      {loading ? (
        <ActivityIndicator size="large" color={ACCENT} />
      ) : fetchError ? (
        <>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.emptyTitle}>Failed to load</Text>
          <Text style={styles.emptySub}>{fetchError}</Text>
        </>
      ) : (
        <>
          <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptySub}>No active orders available. Pull to refresh.</Text>
        </>
      )}
    </View>
  );

  const ListFooter = () => {
    if (loadingMoreUI) {
      return <View style={styles.footer}><ActivityIndicator size="small" color={ACCENT} /></View>;
    }
    return null;
  };

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
      <FlatList
        style={styles.list}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing['3xl'] }}
        data={listData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => renderOrderCard(item, index)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={ACCENT}
          />
        }
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyState}
        onEndReached={isTechnician ? undefined : () => fetchWorkOrders(true)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isTechnician ? null : ListFooter}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  list: { flex: 1 },

  // ── Header wrap ──────────────────────────────────────────────────────────
  headerWrap: {
    backgroundColor: '#F8F9FB',
  },

  // ── Greeting bar ─────────────────────────────────────────────────────────
  greetingBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingBottom: spacing.lg,
    backgroundColor: '#FFF',
  },
  greetingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  greetingSmall: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  greetingName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  dateText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },

  // ── Stats ────────────────────────────────────────────────────────────────
  statsSection: {
    paddingHorizontal: PAD,
    paddingTop: spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  statCard: {
    width: STAT_CARD_W,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 30,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // ── Chart ──────────────────────────────────────────────────────────────
  chartSection: {
    paddingHorizontal: PAD,
    paddingTop: spacing.xl,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_BAR_MAX_H + 30,
    paddingTop: 4,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    width: 24,
    height: CHART_BAR_MAX_H,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    width: 24,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
  },
  barCompleted: {
    width: 24,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    position: 'absolute',
    bottom: 0,
  },
  barLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontWeight: '500',
  },
  barLabelToday: {
    color: ACCENT,
    fontWeight: '700',
  },
  todayIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
    marginTop: 3,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: spacing.lg,
  },

  // ── Orders header ────────────────────────────────────────────────────────
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingTop: spacing.xl,
    marginBottom: spacing.md,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '600',
    color: ACCENT,
  },

  // ── Order card ───────────────────────────────────────────────────────────
  orderCard: {
    backgroundColor: '#FFF',
    marginHorizontal: PAD,
    marginBottom: CARD_GAP,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  orderAccent: {
    width: 4,
  },
  orderContent: {
    flex: 1,
    padding: spacing.lg,
    gap: 10,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  orderTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderWoNumWrap: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orderWoNum: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 21,
  },
  orderTitleActive: {
    color: '#1E293B',
    fontWeight: '700',
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  orderMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ACCENT + '0F',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  orderMetaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ACCENT,
  },
  orderMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // ── Empty ────────────────────────────────────────────────────────────────
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});
