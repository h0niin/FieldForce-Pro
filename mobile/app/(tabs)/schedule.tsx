import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { appointmentsApi, documentApprovalsApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth.store';
import { StatusBadge } from '@/components/StatusBadge';
import { formatTime } from '@/utils/format';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { AppointmentStatus } from '@/types/models';
import type { Appointment } from '@/types/models';

const ACCENT = '#4F6BF6';
const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Date strip dimensions ────────────────────────────────────────────────────
const DATE_CHIP_W = 52;
const DATE_CHIP_GAP = 8;
const DATE_ITEM_W = DATE_CHIP_W + DATE_CHIP_GAP; // 60
const DATE_SIDE_PADDING = (SCREEN_WIDTH - DATE_CHIP_W) / 2;
const TOTAL_DAYS = 61; // 30 days before + today + 30 days after
const TODAY_INDEX = 30;

// ─── Config ───────────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: AppointmentStatus.SCHEDULED },
  { label: 'En Route', value: AppointmentStatus.EN_ROUTE },
  { label: 'On Site', value: AppointmentStatus.ON_SITE },
  { label: 'In Progress', value: AppointmentStatus.IN_PROGRESS },
  { label: 'Completed', value: AppointmentStatus.COMPLETED },
];

import { colors as defaultColors } from '@/theme';

function getStatusColor(status: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.EN_ROUTE: return defaultColors.statusEnRoute;
    case AppointmentStatus.ON_SITE: return defaultColors.statusOnSite;
    case AppointmentStatus.IN_PROGRESS: return defaultColors.statusInProgress;
    case AppointmentStatus.COMPLETED: return defaultColors.statusCompleted;
    case AppointmentStatus.CANCELLED: return defaultColors.statusCancelled;
    default: return defaultColors.statusOpen;
  }
}

function isUrgent(scheduledStart: string): boolean {
  const diff = dayjs(scheduledStart).diff(dayjs(), 'minute');
  return diff >= 0 && diff <= 30;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const [selectedIndex, setSelectedIndex] = useState(TODAY_INDEX);
  const [filter, setFilter] = useState<AppointmentStatus | 'all'>('all');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const dateListRef = useRef<FlatList>(null);
  const didInitialScroll = useRef(false);
  const isScrollingRef = useRef(false);

  // Fixed date array anchored to today — never changes
  const today = useMemo(() => dayjs().startOf('day'), []);
  const dates = useMemo(
    () => Array.from({ length: TOTAL_DAYS }, (_, i) => today.add(i - TODAY_INDEX, 'day')),
    [today],
  );

  const selectedDate = dates[selectedIndex];

  const onDateChange = (_event: unknown, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      const y = date.getFullYear();
      const m = date.getMonth();
      const d = date.getDate();
      const picked = dayjs(new Date(y, m, d));
      const diff = picked.diff(today, 'day');
      const newIndex = TODAY_INDEX + diff;
      const clamped = Math.max(0, Math.min(newIndex, TOTAL_DAYS - 1));
      setSelectedIndex(clamped);
      dateListRef.current?.scrollToOffset({
        offset: clamped * DATE_ITEM_W,
        animated: true,
      });
    }
  };

  const fetchAppointments = useCallback(async () => {
    setError(null);
    try {
      const response = await appointmentsApi.getMyAppointments({
        date: selectedDate.format('YYYY-MM-DD'),
      });
      setAppointments(response.data.data ?? []);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? err?.message ?? 'Failed to load appointments';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setLoading(true);
    setAppointments([]);
    fetchAppointments();
  }, [fetchAppointments, refreshTick]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAppointments();
  }, [fetchAppointments]);

  useFocusEffect(
    useCallback(() => {
      if (selectedIndex !== TODAY_INDEX) {
        setSelectedIndex(TODAY_INDEX);
        dateListRef.current?.scrollToOffset({
          offset: TODAY_INDEX * DATE_ITEM_W,
          animated: false,
        });
      } else {
        setRefreshTick((t) => t + 1);
      }
    }, []),
  );

  // Scroll to today on mount
  useEffect(() => {
    if (!didInitialScroll.current) {
      didInitialScroll.current = true;
      setTimeout(() => {
        dateListRef.current?.scrollToOffset({
          offset: TODAY_INDEX * DATE_ITEM_W,
          animated: false,
        });
      }, 50);
    }
  }, []);

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / DATE_ITEM_W);
    const clamped = Math.max(0, Math.min(index, TOTAL_DAYS - 1));
    if (clamped !== selectedIndex) {
      setSelectedIndex(clamped);
    }
    isScrollingRef.current = false;
  };

  const handleDateTap = (index: number) => {
    setSelectedIndex(index);
    dateListRef.current?.scrollToOffset({
      offset: index * DATE_ITEM_W,
      animated: true,
    });
  };

  const filtered =
    filter === 'all' ? appointments : appointments.filter((a) => a.status === filter);

  const totalToday = appointments.length;
  const completedToday = appointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length;
  const isToday = selectedDate.isSame(dayjs(), 'day');

  const handleReject = (item: Appointment) => {
    Alert.alert(
      'Reject Appointment',
      `Reject appointment for ${item.customer_name}? This will cancel it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const approvalsRes = await documentApprovalsApi.getByDocument(item.id);
              const pendingApproval = approvalsRes.data.data?.find(
                (app: any) =>
                  app.document_type === 'SCHEDULE' &&
                  app.status === 'PENDING' &&
                  app.approver_id === useAuthStore.getState().user?.id
              );

              if (pendingApproval) {
                await documentApprovalsApi.process(pendingApproval.id, {
                  action: 'REJECT',
                  comments: 'Rejected from schedule list',
                });
              } else {
                await appointmentsApi.updateStatus(item.id, AppointmentStatus.CANCELLED);
              }

              setAppointments((prev) =>
                prev.map((a) =>
                  a.id === item.id ? { ...a, status: AppointmentStatus.CANCELLED } : a,
                ),
              );
            } catch {
              Alert.alert('Error', 'Failed to reject the appointment.');
            }
          },
        },
      ],
    );
  };

  const handleAccept = async (item: Appointment) => {
    try {
      const approvalsRes = await documentApprovalsApi.getByDocument(item.id);
      const pendingApproval = approvalsRes.data.data?.find(
        (app: any) =>
          app.document_type === 'SCHEDULE' &&
          app.status === 'PENDING' &&
          app.approver_id === useAuthStore.getState().user?.id
      );

      if (pendingApproval) {
        await documentApprovalsApi.process(pendingApproval.id, {
          action: 'APPROVE',
          comments: 'Accepted from schedule list',
        });
      }
    } catch (err) {
      // Ignore error and navigate to detail anyway
    } finally {
      router.push(`/appointment/${item.id}`);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl, marginTop: spacing.sm, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { fontSize: typography.h3.fontSize, color: colors.text }]}>
              {selectedDate.format('dddd, MMMM D')}
            </Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {isToday ? 'Today' : selectedDate.format('YYYY')}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {totalToday > 0 && (
              <View style={styles.statsPill}>
                <Text style={styles.statsPillText}>
                  {completedToday}/{totalToday}
                </Text>
                <Text style={styles.statsPillLabel}>done</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate.toDate()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      {/* ── Date strip with stable center highlight ──────────────────────── */}
      <View style={[styles.dateStripWrapper, { backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        {/* Fixed blue highlight box — always centered */}
        <View style={styles.dateHighlight} pointerEvents="none" />

        <FlatList
          ref={dateListRef}
          data={dates}
          keyExtractor={(item) => item.format('YYYY-MM-DD')}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={DATE_ITEM_W}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={(e) => {
            // If no momentum (user drags slowly and lifts), treat as scroll end
            const velocity = e.nativeEvent.velocity?.x ?? 0;
            if (Math.abs(velocity) < 0.1) {
              handleScrollEnd(e);
            }
          }}
          onScrollBeginDrag={() => { isScrollingRef.current = true; }}
          contentContainerStyle={{ paddingHorizontal: DATE_SIDE_PADDING }}
          getItemLayout={(_, index) => ({
            length: DATE_ITEM_W,
            offset: DATE_ITEM_W * index,
            index,
          })}
          renderItem={({ item: date, index }) => {
            const isCentered = index === selectedIndex;
            const dateIsToday = date.isSame(today, 'day');
            return (
              <TouchableOpacity
                style={styles.dateChip}
                onPress={() => handleDateTap(index)}
                activeOpacity={0.75}
              >
                <Text style={[styles.dateChipDay, { color: colors.textSecondary }, isCentered && { color: colors.textInverse }]}>
                  {dateIsToday ? 'Today' : date.format('ddd')}
                </Text>
                <Text style={[styles.dateChipNum, { color: colors.text }, isCentered && { color: colors.textInverse }]}>
                  {date.format('D')}
                </Text>
                {dateIsToday && !isCentered && <View style={styles.todayDot} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── Filter chips ────────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.filterScrollView, { backgroundColor: headerBg, borderBottomColor: borderColor }]}
        contentContainerStyle={styles.filterStrip}
      >
        {FILTER_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.filterChip, { backgroundColor: inputBg, borderColor }, filter === opt.value && styles.filterChipActive]}
            onPress={() => setFilter(opt.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, { color: colors.textSecondary }, filter === opt.value && [styles.filterTextActive, { color: colors.textInverse }]]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Appointment list ────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading appointments...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => {
            const urgent = isUrgent(item.scheduled_start);
            const isScheduled = item.status === AppointmentStatus.SCHEDULED;
            const isCancelled = item.status === AppointmentStatus.CANCELLED;
            const statusColor = getStatusColor(item.status);

            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: cardBg, borderColor }, urgent && [styles.cardUrgent, { borderColor: colors.warning + '60' }], isCancelled && styles.cardCancelled]}
                onPress={() => router.push(`/appointment/${item.id}`)}
                activeOpacity={0.78}
              >
                <View style={[styles.cardAccent, { backgroundColor: statusColor }]} />

                <View style={styles.cardBody}>
                  <View style={styles.cardTopRow}>
                    <Text style={[styles.cardTime, urgent && { color: colors.warning }]}>
                      {formatTime(item.scheduled_start)} - {formatTime(item.scheduled_end)}
                    </Text>
                    <StatusBadge status={item.status} />
                  </View>

                  <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
                    {item.customer_name}
                  </Text>

                  <View style={styles.cardAddrRow}>
                    <Ionicons name="location-outline" size={12} color={colors.textLight} />
                    <Text style={[styles.cardAddr, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.address}
                    </Text>
                  </View>

                  {urgent && isScheduled && (
                    <View style={[styles.urgentBadge, { backgroundColor: colors.warning + '15' }]}>
                      <Ionicons name="flash" size={11} color={colors.warning} />
                      <Text style={[styles.urgentText, { color: colors.warning }]}>Starting soon</Text>
                    </View>
                  )}

                  {isScheduled && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.rejectBtn, { borderColor: colors.error + '60', backgroundColor: colors.error + '08' }]}
                        onPress={() => handleReject(item)}
                        hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                      >
                        <Ionicons name="close" size={13} color={colors.error} />
                        <Text style={[styles.rejectBtnText, { color: colors.error }]}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleAccept(item)}
                      >
                        <Ionicons name="checkmark" size={13} color="#fff" />
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            error ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, styles.emptyIconError, { backgroundColor: colors.error + '15' }]}>
                  <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.error }]}>Could not load</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{error}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchAppointments}>
                  <Text style={[styles.retryBtnText, { color: colors.textInverse }]}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: isDark ? colors.border : defaultColors.borderLight }]}>
                  <Ionicons name="calendar-outline" size={32} color={colors.textLight} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No appointments</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {isToday ? "You're all clear for today" : 'Nothing scheduled for this day'}
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  headerSub: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statsPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: ACCENT + '12',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statsPillText: {
    ...typography.label,
    color: ACCENT,
  },
  statsPillLabel: {
    ...typography.caption,
    color: ACCENT,
    opacity: 0.7,
  },

  // ── Date strip ──────────────────────────────────────────────────────────────
  dateStripWrapper: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    position: 'relative',
    paddingVertical: spacing.sm,
  },
  dateHighlight: {
    position: 'absolute',
    top: spacing.sm - 2,
    bottom: spacing.sm - 2,
    left: DATE_SIDE_PADDING - 2,
    width: DATE_CHIP_W + 4,
    borderRadius: borderRadius.lg,
    backgroundColor: ACCENT,
    zIndex: 0,
  },
  dateChip: {
    width: DATE_CHIP_W,
    marginRight: DATE_CHIP_GAP,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dateChipDay: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateChipNum: {
    ...typography.h4,
    color: colors.text,
    marginTop: 1,
  },
  dateChipTextCenter: {
    color: colors.textInverse,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ACCENT,
    marginTop: 3,
  },

  // ── Filter chips ────────────────────────────────────────────────────────────
  filterScrollView: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    height: 32,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  filterText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.textInverse,
    fontWeight: '600',
  },

  // ── Appointment list ────────────────────────────────────────────────────────
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 120,
    gap: spacing.sm,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardUrgent: {
    borderWidth: 1,
    borderColor: colors.warning + '60',
  },
  cardCancelled: {
    opacity: 0.55,
  },
  cardAccent: {
    width: 3,
  },
  cardBody: {
    flex: 1,
    padding: spacing.md,
    gap: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardTime: {
    ...typography.label,
    color: ACCENT,
  },
  cardName: {
    ...typography.h4,
    color: colors.text,
  },
  cardAddrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardAddr: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.warning + '15',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    marginTop: 2,
  },
  urgentText: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + '60',
    backgroundColor: colors.error + '08',
  },
  rejectBtnText: {
    ...typography.bodySmall,
    color: colors.error,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    backgroundColor: ACCENT,
  },
  acceptBtnText: {
    ...typography.bodySmall,
    color: '#fff',
    fontWeight: '600',
  },

  // ── Loading state ──────────────────────────────────────────────────────────
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing['4xl'],
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['4xl'],
    gap: spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  emptyIconError: {
    backgroundColor: colors.error + '15',
  },
  retryBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    backgroundColor: ACCENT,
  },
  retryBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
