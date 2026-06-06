import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '@/theme';
import type { ChecklistItemData } from '@/types/models';

interface ChecklistItemProps {
  item: ChecklistItemData;
  onToggle: (id: string) => void;
  onNotesChange: (id: string, notes: string) => void;
  onPhotoPress?: (id: string) => void;
}

export function ChecklistItem({ item, onToggle, onNotesChange, onPhotoPress }: ChecklistItemProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.row} onPress={() => onToggle(item.id)}>
        <Ionicons
          name={item.completed ? 'checkbox' : 'square-outline'}
          size={24}
          color={item.completed ? colors.success : colors.textLight}
        />
        <Text style={[styles.label, item.completed && styles.completed]}>{item.label}</Text>
        {onPhotoPress && (
          <TouchableOpacity onPress={() => onPhotoPress(item.id)} hitSlop={8}>
            <Ionicons
              name={item.photo_url ? 'image' : 'camera-outline'}
              size={20}
              color={item.photo_url ? colors.primary : colors.textLight}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
      {item.completed && (
        <TextInput
          style={styles.notes}
          placeholder="Add notes..."
          placeholderTextColor={colors.textLight}
          value={item.notes ?? ''}
          onChangeText={(text) => onNotesChange(item.id, text)}
          multiline
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  completed: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  notes: {
    ...typography.bodySmall,
    color: colors.text,
    marginTop: spacing.sm,
    marginLeft: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    minHeight: 36,
  },
});
