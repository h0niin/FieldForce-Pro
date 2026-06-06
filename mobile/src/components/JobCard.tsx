import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { PRIORITY_COLORS } from '@/utils/constants';
import { formatTime } from '@/utils/format';
import { StatusBadge } from './StatusBadge';
import type { WorkOrder } from '@/types/models';

interface JobCardProps {
  workOrder: WorkOrder;
  onPress: (workOrder: WorkOrder) => void;
}

export function JobCard({ workOrder, onPress }: JobCardProps) {
  const priorityColor = PRIORITY_COLORS[workOrder.priority] ?? colors.textSecondary;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(workOrder)}
      activeOpacity={0.7}
    >
      <View style={styles.top}>
        <View style={styles.topLeft}>
          <Text style={styles.woNumber}>{workOrder.wo_number}</Text>
          <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
        </View>
        <StatusBadge status={workOrder.status} />
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {workOrder.summary}
      </Text>

      <View style={styles.meta}>
        {workOrder.category ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>{workOrder.category}</Text>
          </View>
        ) : null}
        {workOrder.scheduled_start ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.metaText}>{formatTime(workOrder.scheduled_start)}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  woNumber: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
