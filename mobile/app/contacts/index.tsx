import { useState } from 'react';
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
import { useContactsList } from '@/hooks/use-customer-history';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Contact } from '@/types/models';

const ACCENT = '#4F6BF6';

function getInitials(contact: Contact): string {
  return `${contact.first_name[0] ?? ''}${contact.last_name[0] ?? ''}`.toUpperCase();
}

export default function ContactSearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors: c, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { contacts, loading, syncing, isOffline, sync } = useContactsList(searchQuery);

  const handleRefresh = () => {
    setRefreshing(true);
    sync();
    // Give sync a moment to complete before clearing the spinner
    setTimeout(() => setRefreshing(false), 1200);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? c.background : '#F8F9FB' }]}>
      {/* Navigation header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.text }]}>Contacts</Text>
        <TouchableOpacity onPress={() => router.push('/contacts/new')} style={styles.backBtn}>
          <Ionicons name="add" size={28} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* Offline / syncing status bar */}
      {(isOffline || syncing) && (
        <View style={[styles.statusBar, isOffline ? styles.statusOffline : styles.statusSyncing]}>
          <Ionicons
            name={isOffline ? 'cloud-offline-outline' : 'sync-outline'}
            size={14}
            color={colors.textInverse}
          />
          <Text style={styles.statusText}>
            {isOffline ? 'Offline — showing cached data' : 'Syncing…'}
          </Text>
        </View>
      )}

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor }]}>
        <Ionicons name="search-outline" size={18} color={c.textLight} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search name, email or phone…"
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

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            contacts.length === 0 ? styles.emptyContainer : styles.listContent,
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
              <Ionicons name="people-outline" size={56} color={c.textLight} />
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                {searchQuery ? 'No contacts found' : 'No contacts yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
                {searchQuery
                  ? 'Try a different name, email, or phone number.'
                  : 'Contacts added via the web portal will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: cardBg, borderColor }]}
              onPress={() => router.push(`/contacts/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(item)}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardName, { color: c.text }]} numberOfLines={1}>
                  {item.first_name} {item.last_name}
                </Text>
                {item.email ? (
                  <Text style={[styles.cardDetail, { color: c.textSecondary }]} numberOfLines={1}>
                    {item.email}
                  </Text>
                ) : null}
                {item.phone ? (
                  <Text style={[styles.cardDetail, { color: c.textSecondary }]} numberOfLines={1}>
                    {item.phone}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textLight} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    ...typography.h4,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  statusOffline: {
    backgroundColor: colors.textSecondary,
  },
  statusSyncing: {
    backgroundColor: ACCENT,
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.textInverse,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8F9FB',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
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
    gap: spacing.sm,
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    ...typography.label,
    color: colors.textInverse,
    fontSize: 16,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  cardDetail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  separator: {
    height: spacing.sm,
  },
});
