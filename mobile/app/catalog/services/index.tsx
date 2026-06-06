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
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { servicesCatalogApi } from '@/api/endpoints';
import { formatCurrency, formatDuration } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { ServiceCatalogItem } from '@/types/models';

const ACCENT = '#4F6BF6';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryColor(category: string | null): string {
  if (!category) return colors.textLight;
  const palette = [
    '#6366f1', '#0ea5e9', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
  item,
  onPress,
  theme,
}: {
  item: ServiceCatalogItem;
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const catColor = categoryColor(item.category);
  const { colors: c, isDark, cardBg, borderColor, inputBg } = theme;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: cardBg, borderColor }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.cardIcon, { backgroundColor: catColor + '18' }]}>
        <Ionicons name="construct-outline" size={22} color={catColor} />
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: c.text }]} numberOfLines={1}>
          {item.name}
        </Text>

        {item.description ? (
          <Text style={[styles.cardDesc, { color: c.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardMeta}>
          {item.duration_minutes ? (
            <View style={[styles.metaChip, { backgroundColor: isDark ? inputBg : '#F8F9FB' }]}>
              <Ionicons name="time-outline" size={12} color={c.textSecondary} />
              <Text style={[styles.metaChipText, { color: c.textSecondary }]}>{formatDuration(item.duration_minutes)}</Text>
            </View>
          ) : null}

          {item.category ? (
            <View style={[styles.metaChip, { backgroundColor: catColor + '18' }]}>
              <Text style={[styles.metaChipText, { color: catColor }]}>{item.category}</Text>
            </View>
          ) : null}

          {!item.is_active && (
            <View style={[styles.metaChip, { backgroundColor: '#ef444418' }]}>
              <Text style={[styles.metaChipText, { color: '#ef4444' }]}>Inactive</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.cardRight}>
        {item.default_price != null ? (
          <Text style={[styles.price, { color: c.text }]}>
            {formatCurrency(Number(item.default_price))}
          </Text>
        ) : (
          <Text style={[styles.priceEmpty, { color: c.textLight }]}>—</Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={c.textLight} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ServicesCatalogScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useAppTheme();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = theme;

  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchQueryRef = useRef('');
  const hasMounted = useRef(false);

  const fetchItems = useCallback(async (query: string) => {
    setFetchError(false);
    try {
      const res = await servicesCatalogApi.getAll({
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

  // Keep ref in sync so useFocusEffect can read current query without it being a dep
  useEffect(() => { searchQueryRef.current = searchQuery; }, [searchQuery]);

  // Initial load + debounced re-fetch on search change
  useEffect(() => {
    setLoading(true);
    const delay = searchQuery ? 400 : 0;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchItems(searchQuery), delay);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, fetchItems]);

  // Re-fetch whenever the screen regains focus (e.g. back from create/edit/detail)
  useFocusEffect(
    useCallback(() => {
      if (!hasMounted.current) {
        hasMounted.current = true;
        return; // initial load handled by useEffect above
      }
      setLoading(true);
      fetchItems(searchQueryRef.current);
    }, [fetchItems]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems(searchQuery);
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const categories = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean) as string[]),
  ).sort();

  const filtered = activeCategory
    ? items.filter((i) => i.category === activeCategory)
    : items;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Services</Text>
        <TouchableOpacity onPress={() => router.push('/catalog/services/new')} style={styles.headerBtn}>
          <Ionicons name="add" size={26} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor }]}>
        <Ionicons name="search-outline" size={18} color={c.textLight} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search services…"
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

      {/* Category filter chips */}
      {categories.length > 0 && (
        <FlatList
          data={[null, ...categories]}
          keyExtractor={(item) => item ?? '__all__'}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipList}
          contentContainerStyle={styles.chipRow}
          renderItem={({ item: cat }) => {
            const isActive = activeCategory === cat;
            const color = cat ? categoryColor(cat) : ACCENT;
            return (
              <TouchableOpacity
                style={[
                  styles.chip,
                  isActive
                    ? { backgroundColor: color, borderColor: color }
                    : { borderColor },
                ]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isActive ? '#fff' : c.textSecondary },
                  ]}
                >
                  {cat ?? 'All'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

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
                name={fetchError ? 'cloud-offline-outline' : 'construct-outline'}
                size={56}
                color={c.textLight}
              />
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                {fetchError
                  ? 'Could not load services'
                  : searchQuery || activeCategory
                    ? 'No services found'
                    : 'No services yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
                {fetchError
                  ? 'Check your connection and pull down to retry.'
                  : searchQuery || activeCategory
                    ? 'Try a different search or category.'
                    : 'Services added in the web portal will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ServiceCard
              item={item}
              onPress={() => router.push(`/catalog/services/${item.id}`)}
              theme={theme}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
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

  // ── Category chips ────────────────────────────────────────────────────────
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
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
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
    gap: 3,
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  metaChipText: {
    ...typography.bodySmall,
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
    flexShrink: 0,
  },
  price: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  priceEmpty: {
    ...typography.body,
    color: colors.textLight,
  },
});
