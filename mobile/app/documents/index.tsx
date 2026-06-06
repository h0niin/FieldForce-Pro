import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { userDocumentsApi } from '@/api/endpoints';
import { useAppTheme } from '@/hooks/useAppTheme';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { DocumentType } from '@/types/models';
import type { UserDocument } from '@/types/models';

const ACCENT = '#4F6BF6';

const TYPE_ICONS: Record<DocumentType, keyof typeof Ionicons.glyphMap> = {
  [DocumentType.CERTIFICATION]: 'ribbon-outline',
  [DocumentType.LICENSE]: 'card-outline',
  [DocumentType.ID_PROOF]: 'finger-print-outline',
  [DocumentType.INSURANCE]: 'shield-checkmark-outline',
  [DocumentType.CONTRACT]: 'document-text-outline',
  [DocumentType.OTHER]: 'folder-outline',
};

function formatDocumentType(type: DocumentType): string {
  const labels: Record<DocumentType, string> = {
    [DocumentType.CERTIFICATION]: 'Certification',
    [DocumentType.LICENSE]: 'License',
    [DocumentType.ID_PROOF]: 'ID Proof',
    [DocumentType.INSURANCE]: 'Insurance',
    [DocumentType.CONTRACT]: 'Contract',
    [DocumentType.OTHER]: 'Other',
  };
  return labels[type] ?? type;
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// ─── Document Card ─────────────────────────────────────────────────────────────

import { colors as defaultColors } from '@/theme';

function DocumentCard({
  item,
  onPress,
  onDelete,
  cardBg,
  borderColor,
  colors,
}: {
  item: UserDocument;
  onPress: () => void;
  onDelete: () => void;
  cardBg: string;
  borderColor: string;
  colors: typeof defaultColors;
}) {
  const expired = isExpired(item.expiry_date);
  const icon = TYPE_ICONS[item.document_type] ?? 'document-outline';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      onPress={onPress}
      onLongPress={onDelete}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={colors.textInverse} />
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
          {item.document_name}
        </Text>
        <Text style={[styles.cardType, { color: colors.textSecondary }]}>{formatDocumentType(item.document_type)}</Text>

        <View style={styles.cardMeta}>
          {item.is_verified && (
            <View style={[styles.metaChip, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              <Text style={[styles.metaChipText, { color: colors.success }]}>Verified</Text>
            </View>
          )}
          {item.expiry_date && (
            <View
              style={[
                styles.metaChip,
                { backgroundColor: expired ? colors.error + '15' : colors.textLight + '20' },
              ]}
            >
              <Text
                style={[
                  styles.metaChipText,
                  { color: expired ? colors.error : colors.textSecondary },
                ]}
              >
                {expired ? 'Expired' : 'Expires'} {formatDate(item.expiry_date)}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </TouchableOpacity>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function DocumentListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDocuments = useCallback(async () => {
    setFetchError(false);
    try {
      const res = await userDocumentsApi.getMyDocuments();
      setDocuments(res.data.data ?? []);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchDocuments();
    }, [fetchDocuments]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDocuments();
  };

  const handleDelete = (doc: UserDocument) => {
    Alert.alert('Delete Document', `Remove "${doc.document_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await userDocumentsApi.delete(doc.id);
            setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
          } catch {
            Alert.alert('Error', 'Failed to delete document.');
          }
        },
      },
    ]);
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const filtered = documents.filter((doc) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      doc.document_name.toLowerCase().includes(q) ||
      formatDocumentType(doc.document_type).toLowerCase().includes(q)
    );
  });

  const expiredCount = documents.filter((d) => isExpired(d.expiry_date)).length;
  const verifiedCount = documents.filter((d) => d.is_verified).length;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F8F9FB' }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Documents</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/documents/upload')}
          style={styles.headerBtnRight}
        >
          <Ionicons name="add" size={26} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* Summary bar */}
      {!loading && documents.length > 0 && (
        <View style={[styles.summaryBar, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{documents.length}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.success }]}>{verifiedCount}</Text>
            <Text style={styles.summaryLabel}>Verified</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: expiredCount > 0 ? colors.error : colors.text }]}>
              {expiredCount}
            </Text>
            <Text style={styles.summaryLabel}>Expired</Text>
          </View>
        </View>
      )}

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor }]}>
        <Ionicons name="search-outline" size={18} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search documents..."
          placeholderTextColor={colors.textLight}
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
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

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
                color={colors.textLight}
              />
              <Text style={styles.emptyTitle}>
                {fetchError
                  ? 'Could not load documents'
                  : searchQuery
                    ? 'No documents found'
                    : 'No documents yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {fetchError
                  ? 'Check your connection and pull down to retry.'
                  : searchQuery
                    ? 'Try a different search term.'
                    : 'Tap + to upload your first document.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <DocumentCard
              item={item}
              onPress={() => router.push(`/documents/${item.id}`)}
              onDelete={() => handleDelete(item)}
              cardBg={cardBg}
              borderColor={borderColor}
              colors={colors}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

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
  headerBtn: { width: 40, alignItems: 'flex-start' },
  headerBtnRight: { width: 40, alignItems: 'flex-end' },
  headerCenter: { flex: 1 },
  headerTitle: { ...typography.h4, color: colors.text },

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
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryValue: { ...typography.h4, fontWeight: '700' },
  summaryLabel: { ...typography.caption, color: colors.textSecondary },
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

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  emptyContainer: { flex: 1, paddingHorizontal: spacing.lg },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing['5xl'],
  },
  emptyTitle: { ...typography.h4, color: colors.text },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },

  separator: { height: spacing.sm },

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
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 3 },
  cardTitle: { ...typography.body, fontWeight: '600', color: colors.text },
  cardType: { ...typography.bodySmall, color: colors.textSecondary },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  metaChipText: { fontSize: 11, fontWeight: '600' },
});
