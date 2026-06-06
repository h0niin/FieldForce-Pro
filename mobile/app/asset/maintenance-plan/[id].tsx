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
import { maintenancePlansApi } from '@/api/endpoints';
import { formatDate } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { AssetMaintenancePlan } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function frequencyColor(frequency: string): string {
  switch (frequency) {
    case 'daily':     return '#0ea5e9';
    case 'weekly':    return '#10b981';
    case 'monthly':   return '#6366f1';
    case 'quarterly': return '#f59e0b';
    case 'yearly':    return '#8b5cf6';
    default:          return colors.textLight;
  }
}

function frequencyIcon(frequency: string): string {
  switch (frequency) {
    case 'daily':     return 'sunny-outline';
    case 'weekly':    return 'calendar-outline';
    case 'monthly':   return 'calendar-number-outline';
    case 'quarterly': return 'stats-chart-outline';
    case 'yearly':    return 'ribbon-outline';
    default:          return 'time-outline';
  }
}

function dueDateInfo(dateStr: string | null): { color: string; label: string; icon: string } {
  if (!dateStr) return { color: colors.textLight, label: 'Not set', icon: 'calendar-outline' };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)
    return { color: '#ef4444', label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} · ${formatDate(dateStr)}`, icon: 'alert-circle-outline' };
  if (diffDays === 0)
    return { color: '#f59e0b', label: `Due today · ${formatDate(dateStr)}`, icon: 'warning-outline' };
  if (diffDays <= 7)
    return { color: '#f59e0b', label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'} · ${formatDate(dateStr)}`, icon: 'warning-outline' };
  return { color: '#22c55e', label: formatDate(dateStr), icon: 'calendar-outline' };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MaintenancePlanDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [plan, setPlan] = useState<AssetMaintenancePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    maintenancePlansApi
      .getById(id)
      .then((res) => setPlan(res.data.data ?? null))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <Ionicons name="calendar-outline" size={48} color={c.textLight} />
        <Text style={[styles.errorText, { color: c.textSecondary }]}>Maintenance plan not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const freqColor = frequencyColor(plan.frequency);
  const freqIcon = frequencyIcon(plan.frequency);
  const due = dueDateInfo(plan.next_due_date);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing['2xl'] },
      ]}
    >
      {/* Back */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={c.text} />
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: freqColor + '20' }]}>
          <Ionicons name={freqIcon as any} size={36} color={freqColor} />
        </View>
        <Text style={[styles.name, { color: c.text }]}>{plan.name}</Text>

        <View style={styles.badgeRow}>
          {/* Frequency badge */}
          <View style={[styles.freqBadge, { backgroundColor: freqColor + '18' }]}>
            <Text style={[styles.freqBadgeText, { color: freqColor }]}>
              {plan.frequency.charAt(0).toUpperCase() + plan.frequency.slice(1)}
            </Text>
          </View>

          {/* Active / Inactive */}
          {plan.is_active ? (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          ) : (
            <View style={styles.inactiveBadge}>
              <Text style={styles.inactiveBadgeText}>Inactive</Text>
            </View>
          )}

          {/* Auto WO badge */}
          {plan.auto_create_wo && (
            <View style={styles.autoBadge}>
              <Ionicons name="repeat-outline" size={11} color={ACCENT} />
              <Text style={styles.autoBadgeText}>Auto WO</Text>
            </View>
          )}
        </View>
      </View>

      {/* Schedule */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Schedule</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.infoRow}>
            <Ionicons name="refresh-outline" size={18} color={c.textSecondary} />
            <Text style={styles.infoLabel}>Frequency</Text>
            <Text style={[styles.infoValue, { color: freqColor }]}>
              {plan.frequency.charAt(0).toUpperCase() + plan.frequency.slice(1)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name={due.icon as any} size={18} color={due.color} />
            <Text style={styles.infoLabel}>Next due</Text>
            <Text style={[styles.infoValue, { color: due.color }]} numberOfLines={1}>
              {due.label}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="checkmark-done-outline" size={18} color={c.textSecondary} />
            <Text style={styles.infoLabel}>Last done</Text>
            <Text style={styles.infoValue}>
              {plan.last_completed_date ? formatDate(plan.last_completed_date) : '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Settings</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.infoRow}>
            <Ionicons
              name={plan.is_active ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={18}
              color={plan.is_active ? '#22c55e' : '#ef4444'}
            />
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, { color: plan.is_active ? '#22c55e' : '#ef4444' }]}>
              {plan.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons
              name={plan.auto_create_wo ? 'repeat' : 'repeat-outline'}
              size={18}
              color={plan.auto_create_wo ? ACCENT : colors.textSecondary}
            />
            <Text style={styles.infoLabel}>Auto create WO</Text>
            <Text style={[styles.infoValue, { color: plan.auto_create_wo ? ACCENT : colors.textSecondary }]}>
              {plan.auto_create_wo ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      {plan.description ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Description</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={styles.descText}>{plan.description}</Text>
          </View>
        </View>
      ) : null}

      {/* Record Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Record Info</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Created</Text>
            <Text style={styles.metaValue}>{formatDate(plan.created_at)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Last updated</Text>
            <Text style={styles.metaValue}>{formatDate(plan.updated_at)}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  errorBack: { marginTop: spacing.sm },
  errorBackText: {
    ...typography.body,
    color: ACCENT,
    fontWeight: '600',
  },
  backButton: { marginBottom: spacing.lg },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    gap: spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  freqBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  freqBadgeText: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: '#22c55e18',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  activeBadgeText: {
    ...typography.bodySmall,
    color: '#22c55e',
    fontWeight: '600',
  },
  inactiveBadge: {
    backgroundColor: '#ef444418',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  inactiveBadgeText: {
    ...typography.bodySmall,
    color: '#ef4444',
    fontWeight: '600',
  },
  autoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ACCENT + '18',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  autoBadgeText: {
    ...typography.bodySmall,
    color: ACCENT,
    fontWeight: '600',
  },

  // ── Section ───────────────────────────────────────────────────────────────
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'right',
    flexShrink: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 18 + spacing.md,
  },
  descText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    paddingVertical: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  metaLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  metaValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '500',
  },
});
