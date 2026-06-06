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
import { assetsApi, maintenancePlansApi } from '@/api/endpoints';
import { formatDate } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Asset, AssetMaintenancePlan, WorkOrder } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Health helpers ───────────────────────────────────────────────────────────

function parseHealthScore(raw: number | string | null | undefined): number | null {
  if (raw == null) return null;
  const n = Number(raw);
  return isNaN(n) ? null : n;
}

function healthColor(n: number): string {
  if (n >= 80) return '#22c55e';
  if (n >= 60) return '#f59e0b';
  return '#ef4444';
}

function healthLabel(n: number): string {
  if (n >= 80) return 'Good';
  if (n >= 60) return 'Fair';
  return 'Poor';
}

// ─── Warranty helpers ─────────────────────────────────────────────────────────

function warrantyStatus(expiry: string | null): {
  label: string;
  color: string;
  icon: string;
} {
  if (!expiry) return { label: 'No warranty info', color: colors.textLight, icon: 'help-circle-outline' };
  const now = new Date();
  const exp = new Date(expiry);
  const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired', color: '#ef4444', icon: 'close-circle-outline' };
  if (diffDays <= 30) return { label: `Expires in ${diffDays}d`, color: '#f59e0b', icon: 'warning-outline' };
  return { label: `Valid · ${formatDate(expiry)}`, color: '#22c55e', icon: 'shield-checkmark-outline' };
}

// ─── Maintenance plan helpers ─────────────────────────────────────────────────

function dueDateStatus(dateStr: string | null): { color: string; label: string } {
  if (!dateStr) return { color: colors.textLight, label: 'No date set' };
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { color: '#ef4444', label: `Overdue by ${Math.abs(diffDays)}d` };
  if (diffDays === 0) return { color: '#f59e0b', label: 'Due today' };
  if (diffDays <= 7) return { color: '#f59e0b', label: `Due in ${diffDays}d` };
  return { color: '#22c55e', label: formatDate(dateStr) };
}

// ─── Work order helpers ───────────────────────────────────────────────────────

function woStatusColor(status: string): string {
  switch (status) {
    case 'completed': return '#22c55e';
    case 'in_progress': return ACCENT;
    case 'on_hold': return '#f59e0b';
    case 'cancelled': return '#ef4444';
    default: return colors.textLight;
  }
}

function woStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AssetDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [plans, setPlans] = useState<AssetMaintenancePlan[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [woLoading, setWoLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    assetsApi
      .getById(id)
      .then((res) => setAsset(res.data.data ?? null))
      .catch(() => setAsset(null))
      .finally(() => setLoading(false));

    maintenancePlansApi
      .getByAsset(id)
      .then((res) => setPlans(res.data.data ?? []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));

    assetsApi
      .getServiceHistory(id, { take: 20 })
      .then((res) => setWorkOrders(res.data.data ?? []))
      .catch(() => setWorkOrders([]))
      .finally(() => setWoLoading(false));
  }, [id]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!asset) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
        <Ionicons name="construct-outline" size={48} color={c.textLight} />
        <Text style={[styles.errorText, { color: c.textSecondary }]}>Asset not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.errorBack}>
          <Text style={styles.errorBackText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const healthScore = parseHealthScore(asset.health_score);
  const warranty = warrantyStatus(asset.warranty_expiry ?? null);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing['2xl'] },
      ]}
    >
      {/* Back button */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={c.text} />
      </TouchableOpacity>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Ionicons name="construct" size={36} color={c.textInverse} />
        </View>
        <Text style={[styles.name, { color: c.text }]}>{asset.name}</Text>
        {asset.category ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{asset.category}</Text>
          </View>
        ) : null}
      </View>

      {/* Health Score */}
      {healthScore !== null && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Health Score</Text>
          <View style={[styles.card, styles.healthCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.healthBarTrack}>
              <View
                style={[
                  styles.healthBarFill,
                  { flex: Math.min(100, Math.max(0, healthScore)), backgroundColor: healthColor(healthScore) },
                ]}
              />
              <View style={{ flex: 100 - Math.min(100, Math.max(0, healthScore)) }} />
            </View>
            <View style={styles.healthRow}>
              <Text style={[styles.healthScore, { color: healthColor(healthScore) }]}>
                {Math.round(healthScore)}%
              </Text>
              <Text style={[styles.healthLabel, { color: healthColor(healthScore) }]}>
                {healthLabel(healthScore)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Details */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Details</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.infoRow}>
            <Ionicons name="hardware-chip-outline" size={18} color={c.textSecondary} />
            <Text style={styles.infoLabel}>Manufacturer</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {asset.manufacturer ?? '—'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={18} color={c.textSecondary} />
            <Text style={styles.infoLabel}>Model</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {asset.model ?? '—'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="barcode-outline" size={18} color={c.textSecondary} />
            <Text style={styles.infoLabel}>Serial No.</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {asset.serial_number ?? '—'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={c.textSecondary} />
            <Text style={styles.infoLabel}>Installed</Text>
            <Text style={styles.infoValue}>{formatDate(asset.install_date)}</Text>
          </View>
        </View>
      </View>

      {/* Warranty */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Warranty</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.infoRow}>
            <Ionicons name={warranty.icon as any} size={18} color={warranty.color} />
            <Text style={[styles.warrantyLabel, { color: warranty.color }]}>
              {warranty.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Notes */}
      {asset.notes ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Notes</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={styles.notesText}>{asset.notes}</Text>
          </View>
        </View>
      ) : null}

      {/* Maintenance Schedule */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
          Maintenance Schedule{plans.length > 0 ? ` (${plans.length})` : ''}
        </Text>
        {plansLoading ? (
          <View style={[styles.historyLoading, { backgroundColor: cardBg, borderColor }]}>
            <ActivityIndicator size="small" color={ACCENT} />
          </View>
        ) : plans.length === 0 ? (
          <View style={[styles.emptyHistory, { backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="calendar-outline" size={32} color={c.textLight} />
            <Text style={styles.emptyText}>No maintenance schedules</Text>
          </View>
        ) : (
          <View>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {plans.slice(0, 3).map((plan, index) => {
                const due = dueDateStatus(plan.next_due_date);
                const freqColor = frequencyColor(plan.frequency);
                return (
                  <View key={plan.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <TouchableOpacity
                      style={styles.planRow}
                      onPress={() => router.push(`/asset/maintenance-plan/${plan.id}`)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.freqDot, { backgroundColor: freqColor }]} />
                      <View style={styles.planBody}>
                        <Text style={styles.planName} numberOfLines={1}>
                          {plan.name}
                        </Text>
                        <View style={styles.planMeta}>
                          <View style={[styles.freqBadge, { backgroundColor: freqColor + '20' }]}>
                            <Text style={[styles.freqBadgeText, { color: freqColor }]}>
                              {plan.frequency.charAt(0).toUpperCase() + plan.frequency.slice(1)}
                            </Text>
                          </View>
                          {plan.next_due_date && (
                            <Text style={[styles.dueDateText, { color: due.color }]}>
                              {due.label}
                            </Text>
                          )}
                        </View>
                      </View>
                      {!plan.is_active && (
                        <View style={styles.inactiveBadge}>
                          <Text style={styles.inactiveBadgeText}>Inactive</Text>
                        </View>
                      )}
                      <Ionicons name="chevron-forward" size={16} color={c.textLight} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
            {plans.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => router.push(`/asset/service-history?id=${asset.id}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View all {plans.length} schedules</Text>
                <Ionicons name="chevron-forward" size={14} color={ACCENT} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Work Orders */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
          Work Orders{workOrders.length > 0 ? ` (${workOrders.length})` : ''}
        </Text>
        {woLoading ? (
          <View style={[styles.historyLoading, { backgroundColor: cardBg, borderColor }]}>
            <ActivityIndicator size="small" color={ACCENT} />
          </View>
        ) : workOrders.length === 0 ? (
          <View style={[styles.emptyHistory, { backgroundColor: cardBg, borderColor }]}>
            <Ionicons name="clipboard-outline" size={32} color={c.textLight} />
            <Text style={styles.emptyText}>No work orders yet</Text>
          </View>
        ) : (
          <View>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {workOrders.slice(0, 3).map((wo, index) => (
                <View key={wo.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.planRow}
                    onPress={() => router.push(`/work-order/${wo.id}?fromAsset=${asset.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.freqDot, { backgroundColor: woStatusColor(wo.status) }]} />
                    <View style={styles.planBody}>
                      <Text style={styles.planName} numberOfLines={1}>
                        {wo.summary}
                      </Text>
                      <View style={styles.planMeta}>
                        <View style={[styles.freqBadge, { backgroundColor: woStatusColor(wo.status) + '20' }]}>
                          <Text style={[styles.freqBadgeText, { color: woStatusColor(wo.status) }]}>
                            {woStatusLabel(wo.status)}
                          </Text>
                        </View>
                        <Text style={styles.dueDateText}>
                          {wo.wo_number} · {formatDate(wo.created_at)}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={c.textLight} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            {workOrders.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => router.push(`/asset/work-orders?id=${asset.id}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllText}>View all {workOrders.length} work orders</Text>
                <Ionicons name="chevron-forward" size={14} color={ACCENT} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Record Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>Record Info</Text>
        <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Added</Text>
            <Text style={styles.metaValue}>{formatDate(asset.created_at)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Last updated</Text>
            <Text style={styles.metaValue}>{formatDate(asset.updated_at)}</Text>
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
  errorBack: {
    marginTop: spacing.sm,
  },
  errorBackText: {
    ...typography.body,
    color: ACCENT,
    fontWeight: '600',
  },
  backButton: {
    marginBottom: spacing.lg,
  },

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
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
  },
  categoryBadge: {
    backgroundColor: ACCENT + '18',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  categoryText: {
    ...typography.bodySmall,
    color: ACCENT,
    fontWeight: '600',
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: {
    marginBottom: spacing.xl,
  },
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

  // ── Health score ──────────────────────────────────────────────────────────
  healthCard: {
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  healthBarTrack: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  healthBarFill: {
    height: '100%',
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthScore: {
    ...typography.h3,
    fontWeight: '700',
  },
  healthLabel: {
    ...typography.body,
    fontWeight: '500',
  },

  // ── Info rows ─────────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
    width: 90,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  warrantyLabel: {
    ...typography.body,
    fontWeight: '500',
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 18 + spacing.md,
  },
  notesText: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
    paddingVertical: spacing.md,
  },

  // ── Maintenance schedule ───────────────────────────────────────────────────
  historyLoading: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: spacing.sm,
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  freqDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  planBody: {
    flex: 1,
    gap: 4,
  },
  planName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  planMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  freqBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  freqBadgeText: {
    ...typography.bodySmall,
    fontWeight: '600',
    fontSize: 11,
  },
  dueDateText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  inactiveBadge: {
    backgroundColor: '#ef444418',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    flexShrink: 0,
  },
  inactiveBadgeText: {
    ...typography.bodySmall,
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 11,
  },

  // ── View all button ───────────────────────────────────────────────────────
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  viewAllText: {
    ...typography.body,
    color: ACCENT,
    fontWeight: '600',
  },

  // ── Record info ───────────────────────────────────────────────────────────
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
