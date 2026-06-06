import { useCallback, useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { tripsApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth.store';
import { openMapsNavigation } from '@/utils/map-navigation';
import { formatDate, formatDateTime, formatDuration } from '@/utils/format';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Trip } from '@/types/models';

const ACCENT = '#4F6BF6';

// ── Status icon mapping ───────────────────────────────────────────────────────
function TripStatusIcon({ status }: { status: string }) {
  const map: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    in_progress: { name: 'car', color: colors.warning },
    completed: { name: 'checkmark-circle', color: colors.success },
    cancelled: { name: 'close-circle-outline', color: colors.error },
  };
  const cfg = map[status] ?? { name: 'help-circle-outline', color: colors.textLight };
  return <Ionicons name={cfg.name} size={20} color={cfg.color} />;
}

// ── Summary card ──────────────────────────────────────────────────────────────
interface SummaryCardProps {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

function SummaryCard({ label, value, icon, color }: SummaryCardProps) {
  return (
    <View style={[summaryStyles.card, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={summaryStyles.value}>{value}</Text>
      <Text style={summaryStyles.label}>{label}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  value: {
    ...typography.h4,
    color: colors.text,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

// ── Trip card ─────────────────────────────────────────────────────────────────
interface TripCardProps {
  trip: Trip;
}

function TripCard({ trip }: TripCardProps) {
  const hasStart = trip.start_lat != null && trip.start_lng != null;
  const hasEnd = trip.end_lat != null && trip.end_lng != null;

  // Compute duration in minutes from start_time / end_time since server has no duration_minutes
  const durationMinutes =
    trip.start_time && trip.end_time
      ? (new Date(trip.end_time).getTime() - new Date(trip.start_time).getTime()) / 60_000
      : null;

  return (
    <View style={styles.card}>
      {/* Header: date + status */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <TripStatusIcon status={trip.status} />
          <Text style={styles.cardDate}>
            {trip.start_time ? formatDate(trip.start_time) : '—'}
          </Text>
        </View>
        <StatusBadge status={trip.status} />
      </View>

      {/* Times */}
      <View style={styles.timeRow}>
        <View style={styles.timeItem}>
          <Ionicons name="play-circle-outline" size={14} color={colors.success} />
          <Text style={styles.timeText}>
            {trip.start_time ? formatDateTime(trip.start_time) : 'Not started'}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={12} color={colors.textLight} />
        <View style={styles.timeItem}>
          <Ionicons name="stop-circle-outline" size={14} color={colors.error} />
          <Text style={styles.timeText}>
            {trip.end_time ? formatDateTime(trip.end_time) : '—'}
          </Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Ionicons name="speedometer-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metricText}>
            {trip.distance_km != null ? `${trip.distance_km.toFixed(1)} km` : '—'}
          </Text>
        </View>
        <View style={styles.metric}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metricText}>
            {durationMinutes != null ? formatDuration(durationMinutes) : '—'}
          </Text>
        </View>
      </View>

      {/* Navigation shortcut (if coordinates available) */}
      {hasEnd && (
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() =>
            openMapsNavigation('End location', trip.end_lat, trip.end_lng)
          }
        >
          <Ionicons name="map-outline" size={14} color={ACCENT} />
          <Text style={styles.mapButtonText}>View end location</Text>
        </TouchableOpacity>
      )}
      {!hasEnd && hasStart && (
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() =>
            openMapsNavigation('Start location', trip.start_lat, trip.start_lng)
          }
        >
          <Ionicons name="map-outline" size={14} color={ACCENT} />
          <Text style={styles.mapButtonText}>View start location</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function TripHistoryScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const res = await tripsApi.getByUser(user.id, { take: 50 });
      setTrips(res.data.data ?? []);
    } catch {
      // Offline — keep existing state
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrips();
    setRefreshing(false);
  }, [fetchTrips]);

  // ── Summary stats ────────────────────────────────────────────────────────────
  const totalDistanceKm = trips.reduce((sum, t) => sum + (t.distance_km ?? 0), 0);
  const totalMinutes = trips.reduce((sum, t) => {
    if (!t.start_time || !t.end_time) return sum;
    return sum + (new Date(t.end_time).getTime() - new Date(t.start_time).getTime()) / 60_000;
  }, 0);
  const completedCount = trips.filter((t) => t.status === 'completed').length;

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
        }
        ListHeaderComponent={
          trips.length > 0 ? (
            <View style={styles.summaryRow}>
              <SummaryCard
                label="Total Trips"
                value={String(completedCount)}
                icon="car-outline"
                color={ACCENT}
              />
              <SummaryCard
                label="Distance"
                value={`${totalDistanceKm.toFixed(1)} km`}
                icon="speedometer-outline"
                color={colors.info}
              />
              <SummaryCard
                label="Drive Time"
                value={formatDuration(totalMinutes)}
                icon="time-outline"
                color={colors.secondary}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => <TripCard trip={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="car-outline" size={56} color={c.textLight} />
            <Text style={[styles.emptyTitle, { color: c.text }]}>No trips yet</Text>
            <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
              Trips are created automatically when you navigate to a job site.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  // ── Trip Card ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardDate: {
    ...typography.label,
    color: colors.text,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  timeText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing['2xl'],
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metricText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: spacing.xs,
  },
  mapButtonText: {
    ...typography.bodySmall,
    color: ACCENT,
  },
  separator: {
    height: spacing.sm,
  },
  // ── Empty ────────────────────────────────────────────────────────────────────
  empty: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    gap: spacing.md,
    paddingHorizontal: spacing['3xl'],
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
