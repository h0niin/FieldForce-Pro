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
import { serviceRequestsApi } from '@/api/endpoints';
import { formatDate } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ServiceRequest } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: null, label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'triaged', label: 'Triaged' },
  { key: 'estimated', label: 'Estimated' },
  { key: 'approved', label: 'Approved' },
  { key: 'converted_to_wo', label: 'Converted' },
  { key: 'closed', label: 'Closed' },
  { key: 'spam', label: 'Spam' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  new: '#0ea5e9',
  triaged: '#6366f1',
  estimated: '#f59e0b',
  approved: '#22c55e',
  converted_to_wo: '#10b981',
  closed: '#6c757d',
  spam: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#6c757d',
  medium: '#0ea5e9',
  high: '#f59e0b',
  urgent: '#ef4444',
};

const CHANNEL_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  email: 'mail-outline',
  phone: 'call-outline',
  portal: 'globe-outline',
  webform: 'document-text-outline',
  api: 'code-slash-outline',
  whatsapp: 'chatbubble-ellipses-outline',
};

function statusColor(status: string): string {
  return STATUS_COLORS[status] ?? colors.textLight;
}

function statusLabel(status: string): string {
  if (status === 'converted_to_wo') return 'Converted to WO';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function priorityColor(priority: string): string {
  return PRIORITY_COLORS[priority] ?? colors.textLight;
}

function channelIcon(channel: string): keyof typeof Ionicons.glyphMap {
  return CHANNEL_ICONS[channel] ?? 'help-circle-outline';
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({
  item,
  onPress,
}: {
  item: ServiceRequest;
  onPress: () => void;
}) {
  const sColor = statusColor(item.status);
  const pColor = priorityColor(item.priority);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Left: channel icon */}
      <View style={[styles.cardIcon, { backgroundColor: sColor + '15' }]}>
        <Ionicons name={channelIcon(item.channel)} size={20} color={sColor} />
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardSubject} numberOfLines={1}>
            {item.subject}
          </Text>
          {item.priority === 'urgent' && (
            <Ionicons name="flash" size={14} color={pColor} />
          )}
        </View>

        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardMeta}>
          {/* Status badge */}
          <View style={[styles.metaChip, { backgroundColor: sColor + '15' }]}>
            <View style={[styles.statusDot, { backgroundColor: sColor }]} />
            <Text style={[styles.metaChipText, { color: sColor }]}>
              {statusLabel(item.status)}
            </Text>
          </View>

          {/* Priority badge */}
          <View style={[styles.metaChip, { backgroundColor: pColor + '15' }]}>
            <Text style={[styles.metaChipText, { color: pColor }]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </Text>
          </View>

          {/* Category */}
          {item.category ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{item.category}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Right: time + chevron */}
      <View style={styles.cardRight}>
        <Text style={styles.timeText}>{timeAgo(item.created_at)}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ServiceRequestListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();

  const [items, setItems] = useState<ServiceRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(async (query: string) => {
    setFetchError(false);
    try {
      const res = await serviceRequestsApi.getAll({
        search: query.trim() || undefined,
        take: 100,
      });
      setItems(res.data.data ?? []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    const delay = searchQuery ? 400 : 0;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchItems(searchQuery), delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, fetchItems]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems(searchQuery);
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const filtered = activeStatus
    ? items.filter((i) => i.status === activeStatus)
    : items;

  const newCount = items.filter((i) => i.status === 'new').length;
  const urgentCount = items.filter((i) => i.priority === 'urgent').length;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Service Requests</Text>
          {(newCount > 0 || urgentCount > 0) && !loading && (
            <Text style={styles.headerSub}>
              {[
                newCount > 0 && `${newCount} new`,
                urgentCount > 0 && `${urgentCount} urgent`,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/service-requests/new')}
        >
          <Ionicons name="add" size={24} color={c.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor }]}>
        <Ionicons name="search-outline" size={18} color={c.textLight} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search requests…"
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
                name={fetchError ? 'cloud-offline-outline' : 'clipboard-outline'}
                size={56}
                color={c.textLight}
              />
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                {fetchError
                  ? 'Could not load requests'
                  : searchQuery || activeStatus
                    ? 'No requests found'
                    : 'No service requests'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
                {fetchError
                  ? 'Check your connection and pull down to retry.'
                  : searchQuery || activeStatus
                    ? 'Try a different search or filter.'
                    : 'New requests submitted via any channel will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <RequestCard
              item={item}
              onPress={() => router.push(`/service-requests/${item.id}`)}
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
    color: colors.warning,
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

  // ── Status chips ──────────────────────────────────────────────────────────
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
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardSubject: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  cardDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 17,
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
    gap: spacing.xs,
    flexShrink: 0,
  },
  timeText: {
    ...typography.caption,
    color: colors.textLight,
  },
});
