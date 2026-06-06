import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { estimatesApi } from '@/api/endpoints';
import { formatCurrency, formatDate } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Estimate } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: null,              label: 'All' },
  { key: 'draft',           label: 'Draft' },
  { key: 'sent',            label: 'Sent' },
  { key: 'viewed',          label: 'Viewed' },
  { key: 'approved',        label: 'Approved' },
  { key: 'rejected',        label: 'Rejected' },
  { key: 'expired',         label: 'Expired' },
  { key: 'converted_to_wo', label: 'Converted' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  draft:           '#6c757d',
  sent:            '#0ea5e9',
  viewed:          '#6366f1',
  approved:        '#22c55e',
  rejected:        '#ef4444',
  expired:         '#f59e0b',
  converted_to_wo: '#10b981',
};

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  draft:           'document-outline',
  sent:            'paper-plane-outline',
  viewed:          'eye-outline',
  approved:        'checkmark-circle-outline',
  rejected:        'close-circle-outline',
  expired:         'timer-outline',
  converted_to_wo: 'construct-outline',
};

function statusColor(s: string): string {
  return STATUS_COLORS[s] ?? colors.textLight;
}

function statusLabel(s: string): string {
  if (s === 'converted_to_wo') return 'Converted to WO';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function expiryStatus(dateStr: string | null): { label: string; color: string } | null {
  if (!dateStr) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(dateStr);
  const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Expired', color: '#ef4444' };
  if (diffDays === 0) return { label: 'Expires today', color: '#f59e0b' };
  if (diffDays <= 3) return { label: `Expires in ${diffDays}d`, color: '#f59e0b' };
  return { label: `Expires ${formatDate(dateStr)}`, color: colors.textSecondary };
}

// ─── Estimate Card ────────────────────────────────────────────────────────────

function EstimateCard({ item, onPress }: { item: Estimate; onPress: () => void }) {
  const sColor = statusColor(item.status);
  const expiry = expiryStatus(item.expiry_date);
  const contactName = item.contact
    ? `${item.contact.first_name} ${item.contact.last_name}`
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Left icon */}
      <View style={[styles.cardIcon, { backgroundColor: sColor + '15' }]}>
        <Ionicons
          name={STATUS_ICONS[item.status] ?? 'document-outline'}
          size={22}
          color={sColor}
        />
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardNumber} numberOfLines={1}>
            {item.estimate_number ?? 'Draft Estimate'}
          </Text>
        </View>

        {contactName ? (
          <Text style={styles.cardContact} numberOfLines={1}>
            <Ionicons name="person-outline" size={11} color={colors.textSecondary} />
            {' '}{contactName}
          </Text>
        ) : null}

        {item.notes ? (
          <Text style={styles.cardNotes} numberOfLines={1}>
            {item.notes}
          </Text>
        ) : null}

        <View style={styles.cardMeta}>
          {/* Status */}
          <View style={[styles.metaChip, { backgroundColor: sColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: sColor }]} />
            <Text style={[styles.metaChipText, { color: sColor }]}>
              {statusLabel(item.status)}
            </Text>
          </View>

          {/* Line items count */}
          {item.line_items && item.line_items.length > 0 && (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>
                {item.line_items.length} item{item.line_items.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Expiry */}
          {expiry && (
            <View style={[styles.metaChip, { backgroundColor: expiry.color + '15' }]}>
              <Text style={[styles.metaChipText, { color: expiry.color }]}>
                {expiry.label}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right: total + chevron */}
      <View style={styles.cardRight}>
        <Text style={styles.cardTotal}>{formatCurrency(Number(item.total))}</Text>
        <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function EstimateListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [items, setItems] = useState<Estimate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(async () => {
    setFetchError(false);
    try {
      const res = await estimatesApi.getAll({ take: 100 });
      setItems(res.data.data ?? []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Re-fetch with debounce when search changes (server-side search)
  useEffect(() => {
    if (!searchQuery) return;
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await estimatesApi.getAll({ search: searchQuery.trim(), take: 100 } as any);
        setItems(res.data.data ?? []);
      } catch {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const filtered = items.filter((item) => {
    const matchesStatus = !activeStatus || item.status === activeStatus;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q
      || (item.estimate_number?.toLowerCase().includes(q) ?? false)
      || (item.notes?.toLowerCase().includes(q) ?? false)
      || (item.contact
        ? `${item.contact.first_name} ${item.contact.last_name}`.toLowerCase().includes(q)
        : false);
    return matchesStatus && matchesSearch;
  });

  // Summary stats (always from full unfiltered list)
  const pendingCount = items.filter((i) => ['sent', 'viewed'].includes(i.status)).length;
  const approvedCount = items.filter((i) => i.status === 'approved').length;
  const totalValue = items
    .filter((i) => !['rejected', 'expired'].includes(i.status))
    .reduce((sum, i) => sum + Number(i.total), 0);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Estimates</Text>
          {!loading && items.length > 0 && (
            <Text style={styles.headerSub}>
              {formatCurrency(totalValue)} pipeline
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/estimates/new')}
        >
          <Ionicons name="add" size={24} color={c.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      {!loading && items.length > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#0ea5e9' }]}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#22c55e' }]}>{approvedCount}</Text>
            <Text style={styles.summaryLabel}>Approved</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{items.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor }]}>
        <Ionicons name="search-outline" size={18} color={c.textLight} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search estimates…"
          placeholderTextColor={c.textLight}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={c.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status filter chips */}
      <FlatList
        data={STATUS_FILTERS}
        keyExtractor={(f) => f.key ?? '__all__'}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipList}
        contentContainerStyle={styles.chipRow}
        renderItem={({ item: filter }) => {
          const isActive = activeStatus === filter.key;
          const color = filter.key ? statusColor(filter.key) : ACCENT;
          return (
            <TouchableOpacity
              style={[
                styles.chip,
                isActive
                  ? { backgroundColor: color, borderColor: color }
                  : { borderColor: colors.border },
              ]}
              onPress={() => setActiveStatus(filter.key ?? null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { color: isActive ? '#fff' : colors.textSecondary }]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* List */}
      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            filtered.length === 0 ? styles.emptyContainer : styles.listContent,
            { paddingBottom: insets.bottom + spacing['2xl'] },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={ACCENT}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={fetchError ? 'cloud-offline-outline' : 'document-text-outline'}
                size={56}
                color={c.textLight}
              />
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                {fetchError
                  ? 'Could not load estimates'
                  : searchQuery || activeStatus
                    ? 'No estimates found'
                    : 'No estimates yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
                {fetchError
                  ? 'Check your connection and pull down to retry.'
                  : searchQuery || activeStatus
                    ? 'Try a different search or filter.'
                    : 'Estimates created in the web portal will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <EstimateCard
              item={item}
              onPress={() => router.push(`/estimates/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 40,
    alignItems: 'flex-start',
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
    color: ACCENT,
    fontWeight: '600',
    marginTop: 1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Summary bar ───────────────────────────────────────────────────────────
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    ...typography.h4,
    fontWeight: '700',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    margin: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },

  // ── Filter chips ──────────────────────────────────────────────────────────
  chipList: {
    flexGrow: 0,
  },
  chipRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  chip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: {
    ...typography.caption,
    fontWeight: '600',
  },

  // ── List ──────────────────────────────────────────────────────────────────
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardNumber: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  cardContact: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardNotes: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metaChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 3,
    flexShrink: 0,
  },
  cardTotal: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  cardDate: {
    ...typography.caption,
    color: colors.textLight,
  },
});
