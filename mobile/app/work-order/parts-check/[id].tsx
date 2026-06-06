import { useCallback, useEffect, useState } from 'react';
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
import { workOrdersApi, partsCatalogApi } from '@/api/endpoints';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { LineItem, PartsCatalogItem, WorkOrder } from '@/types/models';

// ─── Types ────────────────────────────────────────────────────────────────────

type AvailabilityStatus = 'sufficient' | 'low' | 'out' | 'not_found';

interface PartCheck {
  lineItem: LineItem;
  catalogPart: PartsCatalogItem | null;
  status: AvailabilityStatus;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AvailabilityStatus,
  { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  sufficient: { label: 'In Stock', color: '#22c55e', icon: 'checkmark-circle' },
  low: { label: 'Low Stock', color: '#f59e0b', icon: 'warning' },
  out: { label: 'Out of Stock', color: '#ef4444', icon: 'close-circle' },
  not_found: { label: 'Not in Catalog', color: colors.textLight, icon: 'help-circle-outline' },
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function computeStatus(lineItem: LineItem, part: PartsCatalogItem | null): AvailabilityStatus {
  if (!part) return 'not_found';
  if (part.stock_qty === 0) return 'out';
  if (part.stock_qty < lineItem.quantity) return 'low';
  if (part.stock_qty <= part.reorder_level) return 'low';
  return 'sufficient';
}

function buildChecks(lineItems: LineItem[], catalog: PartsCatalogItem[]): PartCheck[] {
  return lineItems.map((li) => {
    const match =
      catalog.find((p) => normalizeName(p.name) === normalizeName(li.name)) ??
      (li.description
        ? catalog.find((p) => normalizeName(p.name) === normalizeName(li.description ?? ''))
        : null) ??
      null;
    return { lineItem: li, catalogPart: match, status: computeStatus(li, match) };
  });
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ checks }: { checks: PartCheck[] }) {
  const { colors, borderColor, cardBg } = useAppTheme();
  const found = checks.filter((c) => c.catalogPart !== null);
  const ready = checks.filter((c) => c.status === 'sufficient');
  const notFound = checks.filter((c) => c.status === 'not_found');
  const hasIssue = checks.some((c) => c.status === 'out' || c.status === 'low');

  const summaryColor = hasIssue ? '#ef4444' : ready.length === checks.length ? '#22c55e' : '#f59e0b';
  const summaryIcon = hasIssue ? 'alert-circle' : ready.length === checks.length ? 'checkmark-circle' : 'warning';
  const summaryLabel =
    checks.length === 0
      ? 'No parts on this work order'
      : ready.length === checks.length
        ? 'All parts available'
        : hasIssue
          ? 'Some parts unavailable'
          : 'Availability uncertain';

  return (
    <View style={[styles.summaryCard, { borderLeftColor: summaryColor, backgroundColor: cardBg, borderColor }]}>
      <View style={styles.summaryTop}>
        <Ionicons name={summaryIcon} size={28} color={summaryColor} />
        <View style={styles.summaryTextBlock}>
          <Text style={[styles.summaryLabel, { color: summaryColor }]}>{summaryLabel}</Text>
          {checks.length > 0 && (
            <Text style={styles.summarySubtitle}>
              {ready.length} of {found.length} catalog parts ready
              {notFound.length > 0 ? ` · ${notFound.length} not in catalog` : ''}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.summaryStats}>
        <StatPill label="Ready" value={ready.length} color="#22c55e" />
        <StatPill
          label="Low/Insuff."
          value={checks.filter((c) => c.status === 'low').length}
          color="#f59e0b"
        />
        <StatPill
          label="Out of Stock"
          value={checks.filter((c) => c.status === 'out').length}
          color="#ef4444"
        />
        <StatPill label="Not Found" value={notFound.length} color={colors.textLight} />
      </View>
    </View>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.statPill}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Part Row ─────────────────────────────────────────────────────────────────

function PartRow({ check }: { check: PartCheck }) {
  const { colors } = useAppTheme();
  const cfg = STATUS_CONFIG[check.status];
  const { lineItem, catalogPart } = check;

  return (
    <View style={styles.partRow}>
      <View style={[styles.partIconWrap, { backgroundColor: cfg.color + '18' }]}>
        <Ionicons name={cfg.icon} size={20} color={cfg.color} />
      </View>

      <View style={styles.partInfo}>
        <Text style={[styles.partName, { color: colors.text }]} numberOfLines={1}>
          {lineItem.name}
        </Text>
        <Text style={styles.partRequired}>Required: {lineItem.quantity}</Text>
        {catalogPart ? (
          <Text style={[styles.partStock, { color: cfg.color }]}>
            {catalogPart.stock_qty} in stock
            {catalogPart.sku ? ` · SKU: ${catalogPart.sku}` : ''}
          </Text>
        ) : (
          <Text style={styles.partNotFound}>Not found in parts catalog</Text>
        )}
      </View>

      <View style={[styles.statusBadge, { backgroundColor: cfg.color + '18' }]}>
        <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PartsCheckScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [checks, setChecks] = useState<PartCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const [woRes, partsRes] = await Promise.all([
        workOrdersApi.getById(id),
        partsCatalogApi.getAll({ take: 100 }),
      ]);

      const wo = woRes.data.data ?? null;
      const catalog: PartsCatalogItem[] = partsRes.data.data ?? [];

      setWorkOrder(wo);

      const lineItems = wo?.line_items ?? [];
      setChecks(buildChecks(lineItems, catalog));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Checking parts availability…</Text>
      </View>
    );
  }

  if (error || !workOrder) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={56} color={colors.textLight} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Could not load data</Text>
        <Text style={[styles.errorSub, { color: colors.textSecondary }]}>Check your connection and try again.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Parts Availability</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]} numberOfLines={1}>
            {workOrder.wo_number} · {workOrder.summary}
          </Text>
        </View>
        <TouchableOpacity onPress={load} style={styles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="refresh-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing['2xl'] },
        ]}
      >
        {/* Summary */}
        <SummaryCard checks={checks} />

        {/* Parts list */}
        {checks.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="cube-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No line items</Text>
            <Text style={styles.emptySub}>
              This work order has no line items to check against the parts catalog.
            </Text>
          </View>
        ) : (
          <View style={styles.listSection}>
            <Text style={[styles.listSectionTitle, { color: colors.textSecondary }]}>PARTS BREAKDOWN</Text>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
              {checks.map((check, idx) => (
                <View key={check.lineItem.id}>
                  <PartRow check={check} />
                  {idx < checks.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Legend */}
        <View style={styles.legendSection}>
          <Text style={[styles.listSectionTitle, { color: colors.textSecondary }]}>HOW THIS WORKS</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={styles.legendText}>
              Line items are matched against the parts catalog by name. Items not found in the
              catalog (e.g. labour or services) are shown as "Not in Catalog" and do not affect
              availability.
            </Text>
            <View style={styles.legendDivider} />
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <View key={key} style={styles.legendRow}>
                <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                <Text style={styles.legendRowLabel}>
                  <Text style={{ color: cfg.color, fontWeight: '600' }}>{cfg.label}</Text>
                  {key === 'sufficient' && ' — enough stock for the required quantity'}
                  {key === 'low' && ' — stock exists but below required qty or reorder level'}
                  {key === 'out' && ' — zero units in stock'}
                  {key === 'not_found' && ' — part name not matched in catalog'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    gap: spacing.sm,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerBtn: {
    width: 36,
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
  },
  headerSub: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // Loading / error
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  errorTitle: {
    ...typography.h4,
    color: colors.text,
  },
  errorSub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  retryBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
  },

  // Summary card
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1, borderColor: '#E2E8F0',
    borderLeftWidth: 4,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryTextBlock: {
    flex: 1,
  },
  summaryLabel: {
    ...typography.h4,
  },
  summarySubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingTop: spacing.md,
  },
  statPill: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...typography.h3,
    fontWeight: '700',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },

  // List section
  listSection: {
    gap: spacing.sm,
  },
  listSectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1, borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  // Part row
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  partIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  partInfo: {
    flex: 1,
    gap: 2,
  },
  partName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  partRequired: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  partStock: {
    ...typography.caption,
    fontWeight: '600',
  },
  partNotFound: {
    ...typography.caption,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  statusBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing['3xl'],
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text,
  },
  emptySub: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },

  // Legend
  legendSection: {
    gap: spacing.sm,
  },
  legendText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  legendDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  legendRowLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
