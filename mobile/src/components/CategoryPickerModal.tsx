import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '@/theme';

interface Props {
  visible: boolean;
  categories: string[];
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  title?: string;
}

export function CategoryPickerModal({
  visible,
  categories,
  value,
  onSelect,
  onClose,
  title = 'Select Category',
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) setQuery('');
  }, [visible]);

  const trimmed = query.trim();

  // Categories filtered by current search text
  const filtered = categories.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase()),
  );

  // True when typed text is non-empty and doesn't exactly match an existing category
  const isNewCategory =
    trimmed.length > 0 &&
    !categories.some((c) => c.toLowerCase() === trimmed.toLowerCase());

  const handleCreate = () => {
    if (trimmed) {
      onSelect(trimmed);
      onClose();
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: insets.top || spacing.xl }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={colors.textLight} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search or type new category..."
            placeholderTextColor={colors.textLight}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="words"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        {/* Always-visible Create option if it doesn't exist */}
        {isNewCategory && (
          <TouchableOpacity
            style={styles.createItem}
            onPress={handleCreate}
            activeOpacity={0.7}
          >
            <View style={styles.createIconBox}>
              <Ionicons name="add" size={20} color={colors.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.createLabel}>New Category</Text>
              <Text style={styles.createValue}>"{trimmed}"</Text>
            </View>
            <Text style={styles.tapToCreate}>Tap to create</Text>
          </TouchableOpacity>
        )}

        <ScrollView
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
        >
          {filtered.length === 0 && !isNewCategory ? (
            <View style={styles.center}>
              <Ionicons name="pricetags-outline" size={48} color={colors.textLight} />
              <Text style={styles.emptyText}>
                {query ? 'No matching categories' : 'No categories yet'}
              </Text>
            </View>
          ) : (
            filtered.map((cat) => {
              const selected = value === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={styles.item}
                  onPress={() => {
                    onSelect(cat);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
                    <Ionicons
                      name={selected ? 'checkmark' : 'pricetag-outline'}
                      size={18}
                      color={selected ? '#fff' : colors.textSecondary}
                    />
                  </View>
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {cat}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })
          )}

          {value && !query && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => {
                onSelect('');
                onClose();
              }}
            >
              <Text style={styles.clearText}>Clear selection</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.h4,
    color: colors.text,
    fontWeight: 'bold',
  },
  cancelText: {
    ...typography.body,
    color: colors.primary,
    width: 60,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    padding: 0,
  },
  createItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.primary + '08',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  createIconBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  createLabel: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  createValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  tapToCreate: {
    ...typography.caption,
    color: colors.textLight,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['4xl'],
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBoxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: 60,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  clearText: {
    ...typography.body,
    color: colors.error,
  },
});
