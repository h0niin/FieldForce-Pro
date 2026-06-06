import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { timesheetApi } from '@/api/endpoints';
import AuditLogger, { AUDIT_ACTIONS, AUDIT_MODULES } from '@/utils/AuditLogger';
import { useAuthStore } from '@/store/auth.store';
import { startForegroundGPS, stopForegroundGPS } from '@/services/gps-tracking.service';
import { formatDate, formatTime, formatDuration } from '@/utils/format';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Timesheet } from '@/types/models';

const ACCENT = '#4F6BF6';

// AsyncStorage key for the currently active timesheet id
const ACTIVE_TIMESHEET_KEY = 'active_timesheet_id';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/** Compute duration in minutes between two ISO strings. Returns null if either is missing. */
function durationMinutes(clockIn: string, clockOut: string | null): number | null {
  if (!clockOut) return null;
  return Math.round((new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 60_000);
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TimesheetScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [current, setCurrent] = useState<Timesheet | null>(null);
  const [history, setHistory] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Live elapsed timer ──────────────────────────────────────────────────────
  const startTimer = useCallback((clockInTime: string) => {
    const clockInMs = new Date(clockInTime).getTime();
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - clockInMs) / 1000));
    tick();
    timerRef.current = setInterval(tick, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedSeconds(0);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Data fetching ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // ① Restore the in-progress timesheet from local storage
      const storedId = await AsyncStorage.getItem(ACTIVE_TIMESHEET_KEY);
      let active: Timesheet | null = null;

      if (storedId) {
        try {
          const res = await timesheetApi.getById(storedId);
          const ts = res.data.data ?? null;
          // If clock_out is already set, it was closed elsewhere — clear the key
          if (ts && !ts.clock_out) {
            active = ts;
          } else {
            await AsyncStorage.removeItem(ACTIVE_TIMESHEET_KEY);
          }
        } catch {
          // Entry not found or auth error — clear stale key
          await AsyncStorage.removeItem(ACTIVE_TIMESHEET_KEY);
        }
      }

      setCurrent(active);

      if (active) {
        stopTimer();
        startTimer(active.clock_in);
      } else {
        stopTimer();
      }

      // ② Fetch recent history for this user
      const historyRes = await timesheetApi.getByUser(user.id, { take: 20 });
      // Filter out the currently active entry from history to avoid duplication
      const rows = (historyRes.data.data ?? []).filter((t) => t.id !== active?.id);
      setHistory(rows);
    } catch {
      // Offline — keep existing state
    } finally {
      setLoading(false);
    }
  }, [user?.id, startTimer, stopTimer]);

  // Re-fetch every time this screen comes into focus (e.g. returning from
  // manual-entry or trip-history) so the list is always up to date.
  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // ── Clock in ─────────────────────────────────────────────────────────────────
  const handleClockIn = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No user session. Please log in again.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await timesheetApi.clockIn(user.id);
      const active = res.data.data ?? null;

      if (active) {
        // Persist the active timesheet id locally — the server has no /current endpoint
        await AsyncStorage.setItem(ACTIVE_TIMESHEET_KEY, active.id);
        setCurrent(active);
        startTimer(active.clock_in);
        AuditLogger.log({
          action: AUDIT_ACTIONS.CLOCK_IN,
          module: AUDIT_MODULES.TIMESHEETS,
          record_id: active.id,
          new_values: { timesheet_id: active.id, clock_in: active.clock_in },
        });
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Failed to clock in. Please try again.';
      Alert.alert('Clock In Failed', msg);
    } finally {
      setActionLoading(false);
    }

    // GPS is non-critical — run independently so any GPS failure never blocks clock-in
    startForegroundGPS().catch((e) => console.warn('[Timesheet] GPS start failed:', e));
  };

  // ── Clock out ─────────────────────────────────────────────────────────────────
  const handleClockOut = () => {
    Alert.alert('Clock Out', 'Are you sure you want to clock out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clock Out',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            const activeId = await AsyncStorage.getItem(ACTIVE_TIMESHEET_KEY);
            if (!activeId) throw new Error('No active timesheet found. Try refreshing the page.');

            await timesheetApi.clockOut(activeId);
            AuditLogger.log({
              action: AUDIT_ACTIONS.CLOCK_OUT,
              module: AUDIT_MODULES.TIMESHEETS,
              record_id: activeId,
              new_values: { timesheet_id: activeId, clock_out: new Date().toISOString() },
            });
            await AsyncStorage.removeItem(ACTIVE_TIMESHEET_KEY);
            setCurrent(null);
            stopTimer();
            await fetchData();
          } catch (err: any) {
            const msg =
              err?.response?.data?.message ??
              err?.message ??
              'Failed to clock out. Please try again.';
            Alert.alert('Clock Out Failed', msg);
          } finally {
            setActionLoading(false);
          }

          stopForegroundGPS().catch((e) => console.warn('[Timesheet] GPS stop failed:', e));
        },
      },
    ]);
  };

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  const isClockedIn = !!current;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
      >
        {/* ── Clock Card ─────────────────────────────────────────────────────── */}
        <View style={[styles.clockCard, { backgroundColor: cardBg, borderColor }]}>
          <Text style={[styles.clockTitle, { color: c.text }]}>
            {isClockedIn ? 'Currently Clocked In' : 'Not Clocked In'}
          </Text>

          {isClockedIn && current ? (
            <>
              <Text style={styles.elapsedTimer}>{formatElapsed(elapsedSeconds)}</Text>
              <Text style={[styles.clockSubtitle, { color: c.textSecondary }]}>
                Since {formatTime(current.clock_in)} · {formatDate(current.clock_in)}
              </Text>
            </>
          ) : (
            <Text style={[styles.clockSubtitle, { color: c.textSecondary }]}>Tap to start your shift</Text>
          )}

          <TouchableOpacity
            style={[
              styles.clockButton,
              isClockedIn ? styles.clockOutBtn : styles.clockInBtn,
              actionLoading && styles.clockButtonDisabled,
            ]}
            onPress={isClockedIn ? handleClockOut : handleClockIn}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color={c.textInverse} />
            ) : (
              <>
                <Ionicons
                  name={isClockedIn ? 'log-out-outline' : 'log-in-outline'}
                  size={22}
                  color={c.textInverse}
                />
                <Text style={styles.clockButtonText}>
                  {isClockedIn ? 'Clock Out' : 'Clock In'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualEntryLink}
            onPress={() => router.push('/timesheet/manual-entry')}
          >
            <Ionicons name="create-outline" size={16} color={ACCENT} />
            <Text style={styles.manualEntryText}>Add Manual Entry</Text>
          </TouchableOpacity>
        </View>

        {/* ── Quick Actions ───────────────────────────────────────────────────── */}
        <View style={[styles.quickActions, { backgroundColor: cardBg, borderColor }]}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/timesheet/trip-history')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.info + '20' }]}>
              <Ionicons name="car-outline" size={20} color={colors.info} />
            </View>
            <Text style={[styles.quickActionLabel, { color: c.text }]}>Trip History</Text>
            <Ionicons name="chevron-forward" size={16} color={c.textLight} />
          </TouchableOpacity>

          <View style={styles.quickActionDivider} />

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/timesheet/manual-entry')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.secondary + '20' }]}>
              <Ionicons name="pencil-outline" size={20} color={colors.secondary} />
            </View>
            <Text style={[styles.quickActionLabel, { color: c.text }]}>Manual Entry</Text>
            <Ionicons name="chevron-forward" size={16} color={c.textLight} />
          </TouchableOpacity>
        </View>

        {/* ── History ──────────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Timesheets</Text>

        {history.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={c.textLight} />
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>No timesheet entries yet</Text>
          </View>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const mins = durationMinutes(item.clock_in, item.clock_out);
              return (
                <View style={[styles.historyCard, { backgroundColor: cardBg, borderColor }]}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>{formatDate(item.clock_in)}</Text>
                    <StatusBadge status={item.status} />
                  </View>
                  <View style={styles.historyTimes}>
                    <View style={styles.historyTimeRow}>
                      <Ionicons name="log-in-outline" size={14} color={colors.success} />
                      <Text style={styles.historyTime}>{formatTime(item.clock_in)}</Text>
                    </View>
                    <View style={styles.historyTimeRow}>
                      <Ionicons name="log-out-outline" size={14} color={colors.error} />
                      <Text style={styles.historyTime}>
                        {item.clock_out ? formatTime(item.clock_out) : 'Active'}
                      </Text>
                    </View>
                    <Text style={styles.historyDuration}>
                      {mins != null ? formatDuration(mins) : '—'}
                    </Text>
                  </View>
                  {item.notes ? (
                    <Text style={styles.historyNotes} numberOfLines={1}>
                      {item.notes}
                    </Text>
                  ) : null}
                </View>
              );
            }}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
  },
  scrollContent: { padding: spacing.lg, gap: spacing.lg },

  // ── Clock Card ───────────────────────────────────────────────────────────────
  clockCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clockTitle: { ...typography.h3, color: colors.text, textAlign: 'center' },
  elapsedTimer: {
    fontSize: 48,
    fontWeight: '700',
    color: ACCENT,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  clockSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  clockButton: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    minWidth: 200,
  },
  clockInBtn: { backgroundColor: colors.success },
  clockOutBtn: { backgroundColor: colors.error },
  clockButtonDisabled: { opacity: 0.7 },
  clockButtonText: { ...typography.button, color: colors.textInverse },
  manualEntryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  manualEntryText: { ...typography.bodySmall, color: ACCENT },

  // ── Quick Actions ─────────────────────────────────────────────────────────────
  quickActions: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: { ...typography.body, color: colors.text, flex: 1 },
  quickActionDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 36 + spacing.md,
  },

  // ── Section Title ─────────────────────────────────────────────────────────────
  sectionTitle: { ...typography.h4, color: colors.text },

  // ── History Card ──────────────────────────────────────────────────────────────
  historyCard: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  historyDate: { ...typography.label, color: colors.text },
  historyTimes: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  historyTimeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  historyTime: { ...typography.body, color: colors.textSecondary },
  historyDuration: {
    ...typography.body,
    color: ACCENT,
    fontWeight: '600',
    marginLeft: 'auto',
  },
  historyNotes: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },

  // ── Empty ─────────────────────────────────────────────────────────────────────
  empty: { alignItems: 'center', paddingVertical: spacing['4xl'], gap: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary },
});
