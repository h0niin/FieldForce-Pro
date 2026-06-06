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
import { invoicesApi } from '@/api/endpoints';
import { formatCurrency, formatDate } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Invoice } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: null,              label: 'All' },
  { key: 'draft',           label: 'Draft' },
  { key: 'sent',            label: 'Sent' },
  { key: 'viewed',          label: 'Viewed' },
  { key: 'partially_paid',  label: 'Partial' },
  { key: 'paid',            label: 'Paid' },
  { key: 'overdue',         label: 'Overdue' },
  { key: 'void',            label: 'Void' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  draft:          '#6c757d',
  sent:           '#0ea5e9',
  viewed:         '#6366f1',
  partially_paid: '#f59e0b',
  paid:           '#22c55e',
  overdue:        '#ef4444',
  void:           '#9ca3af',
};

const STATUS_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  draft:          'document-outline',
  sent:           'paper-plane-outline',
  viewed:         'eye-outline',
  partially_paid: 'hourglass-outline',
  paid:           'checkmark-circle-outline',
  overdue:        'alert-circle-outline',
  void:           'ban-outline',
};

function statusColor(s: string): string {
  return STATUS_COLORS[s] ?? colors.textLight;
}

function statusLabel(s: string): string {
  if (s === 'partially_paid') return 'Partial';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Invoice Card ─────────────────────────────────────────────────────────────

function InvoiceCard({ item, onPress }: { item: Invoice; onPress: () => void }) {
  const { colors: c, cardBg, borderColor } = useAppTheme();
  const sColor = statusColor(item.status);
  const balance = item.total - item.paid_amount;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: cardBg, borderColor }]} onPress={onPress} activeOpacity={0.7}>
      {/* Left icon */}
      <View style={[styles.cardIcon, { backgroundColor: sColor + '15' }]}>
        <Ionicons
          name={STATUS_ICONS[item.status] ?? 'receipt-outline'}
          size={22}
          color={sColor}
        />
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <Text style={[styles.cardNumber, { color: c.text }]} numberOfLines={1}>
          {item.invoice_number}
        </Text>

        {item.due_date && (
          <Text style={[styles.cardDue, { color: c.textSecondary }]} numberOfLines={1}>
            Due {formatDate(item.due_date)}
          </Text>
        )}

        <View style={styles.cardMeta}>
          <View style={[styles.metaChip, { backgroundColor: sColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: sColor }]} />
            <Text style={[styles.metaChipText, { color: sColor }]}>
              {statusLabel(item.status)}
            </Text>
          </View>

          {balance > 0 && item.status !== 'void' && (
            <View style={[styles.metaChip, { backgroundColor: c.error + '12' }]}>
              <Text style={[styles.metaChipText, { color: c.error }]}>
                {formatCurrency(balance, item.currency)} due
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Right: total + date + chevron */}
      <View style={styles.cardRight}>
        <Text style={[styles.cardTotal, { color: c.text }]}>{formatCurrency(item.total, item.currency)}</Text>
        <Text style={[styles.cardDate, { color: c.textLight }]}>{formatDate(item.created_at)}</Text>
        <Ionicons name="chevron-forward" size={16} color={c.textLight} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InvoiceListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [items, setItems] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(async () => {
    setFetchError(false);
    try {
      const res = await invoicesApi.getAll({ take: 100 });
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

  useEffect(() => {
    if (!searchQuery) return;
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await invoicesApi.getAll({ search: searchQuery.trim(), take: 100 } as any);
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

  // ── Derived data ─────────────────────────────────────────────────────────

  const filtered = items.filter((item) => {
    const matchesStatus = !activeStatus || item.status === activeStatus;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (item.invoice_number?.toLowerCase().includes(q) ?? false);
    return matchesStatus && matchesSearch;
  });

  const overdueCount = items.filter((i) => i.status === 'overdue').length;
  const unpaidCount  = items.filter((i) => ['sent', 'viewed', 'partially_paid', 'overdue'].includes(i.status)).length;
  const totalCollected = items
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.total), 0);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Invoices</Text>
          {!loading && totalCollected > 0 && (
            <Text style={[styles.headerSub, { color: c.success }]}>
              {formatCurrency(totalCollected)} collected
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/invoice/new')} style={styles.headerBtnRight} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="add" size={26} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      {!loading && items.length > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: c.error }]}>{overdueCount}</Text>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Overdue</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: c.divider }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: c.warning }]}>{unpaidCount}</Text>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Unpaid</Text>
          </View>
          <View style={[styles.summaryDivider, { backgroundColor: c.divider }]} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: c.text }]}>{items.length}</Text>
            <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Total</Text>
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
          placeholder="Search invoices…"
          placeholderTextColor={c.textLight}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
                  : { borderColor: c.border },
              ]}
              onPress={() => setActiveStatus(filter.key ?? null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { color: isActive ? '#fff' : c.textSecondary }]}>
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={ACCENT} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={fetchError ? 'cloud-offline-outline' : 'receipt-outline'}
                size={56}
                color={c.textLight}
              />
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                {fetchError
                  ? 'Could not load invoices'
                  : searchQuery || activeStatus
                    ? 'No invoices found'
                    : 'No invoices yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
                {fetchError
                  ? 'Check your connection and pull down to retry.'
                  : searchQuery || activeStatus
                    ? 'Try a different search or filter.'
                    : 'Invoices created in the web portal will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <InvoiceCard item={item} onPress={() => router.push(`/invoice/${item.id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },

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
  headerBtn:    { width: 40, alignItems: 'flex-start' },
  headerBtnRight: { width: 40, alignItems: 'flex-end' },
  headerCenter: { flex: 1 },
  headerTitle:  { ...typography.h4, color: colors.text },
  headerSub:    { ...typography.caption, color: colors.success, fontWeight: '600', marginTop: 1 },

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
  summaryItem:   { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue:  { ...typography.h4, fontWeight: '700' },
  summaryLabel:  { ...typography.caption, color: colors.textSecondary },
  summaryDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.divider },

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
  searchInput: { flex: 1, ...typography.body, color: colors.text, padding: 0 },

  chipList: { flexGrow: 0 },
  chipRow:  { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, gap: spacing.xs },
  chip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  chipText: { ...typography.caption, fontWeight: '600' },

  centered:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:           { flex: 1 },
  listContent:    { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  emptyContainer: { flex: 1, paddingHorizontal: spacing.lg },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing['5xl'],
  },
  emptyTitle:    { ...typography.h4, color: colors.text },
  emptySubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
  separator:     { height: spacing.sm },

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
  cardBody:  { flex: 1, gap: 3 },
  cardNumber: { ...typography.body, fontWeight: '700', color: colors.text },
  cardDue:   { ...typography.bodySmall, color: colors.textSecondary },
  cardMeta:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusDot:    { width: 6, height: 6, borderRadius: 3 },
  metaChipText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  cardRight:    { alignItems: 'flex-end', gap: 3, flexShrink: 0 },
  cardTotal:    { ...typography.body, fontWeight: '700', color: colors.text },
  cardDate:     { ...typography.caption, color: colors.textLight },
});
