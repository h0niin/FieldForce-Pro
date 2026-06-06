import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotificationsFeed } from '@/hooks/use-notifications-feed';
import { communicationsApi } from '@/api/endpoints';
import { formatRelative } from '@/utils/format';
import { colors, spacing, typography, borderRadius } from '@/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import type { Notification } from '@/types/models';

const ACCENT = '#4F6BF6';

export default function NotificationsScreen() {
  const { colors: themeColors, isDark, cardBg, headerBg, inputBg, borderColor } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { data: notifications, isLoading, markAsRead, markAllAsRead, refetch } = useNotificationsFeed();
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleQuickReply = async (notification: Notification) => {
    if (!replyText.trim()) return;

    setIsSending(true);
    try {
      const contactId = notification.data?.contact_id as string | undefined;
      if (!contactId) throw new Error('No contact ID attached to notification');

      await communicationsApi.create({
        contact_id: contactId,
        channel: 'sms', // Defaulting to SMS for quick replies, could be dynamic
        direction: 'outbound',
        body: replyText,
      });

      // Mark as read after replying
      await markAsRead(notification.id);

      setReplyingTo(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to send quick reply:', err);
      alert('Failed to send reply. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const renderItem = ({ item }: { item: Notification }) => {
    const isMessage = item.type === 'message' || item.type === 'communication';
    const isReplying = replyingTo === item.id;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: cardBg, borderColor }, !item.is_read && styles.unread]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrapper, { backgroundColor: isDark ? themeColors.background : '#F1F5F9' }]}>
            <Ionicons
              name={isMessage ? "chatbubble-ellipses" : "notifications"}
              size={20}
              color={ACCENT}
            />
          </View>
          <View style={styles.textContent}>
            <Text style={[styles.notifTitle, { color: themeColors.text }]}>{item.title}</Text>
            <Text style={[styles.notifBody, { color: themeColors.textSecondary }]}>{item.body}</Text>
            <Text style={[styles.notifTime, { color: themeColors.textSecondary }]}>{formatRelative(item.created_at)}</Text>
          </View>
        </View>

        {isMessage && !isReplying && (
          <TouchableOpacity
            style={styles.replyButton}
            onPress={(e) => {
              e.stopPropagation();
              setReplyingTo(item.id);
            }}
          >
            <Ionicons name="arrow-undo-outline" size={16} color={ACCENT} />
            <Text style={styles.replyButtonText}>Quick Reply</Text>
          </TouchableOpacity>
        )}

        {isReplying && (
          <View style={styles.replyContainer}>
            <TextInput
              style={[styles.replyInput, { backgroundColor: inputBg, borderColor, color: themeColors.text }]}
              placeholder="Type your reply..."
              placeholderTextColor={themeColors.textSecondary}
              value={replyText}
              onChangeText={setReplyText}
              multiline
              autoFocus
            />
            <View style={styles.replyActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: themeColors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, !replyText.trim() && styles.sendButtonDisabled]}
                disabled={isSending || !replyText.trim()}
                onPress={() => handleQuickReply(item)}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.textInverse} />
                ) : (
                  <Text style={styles.sendButtonText}>Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && !notifications) {
    return (
      <View style={[styles.centered, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  const hasUnread = notifications?.some(n => !n.is_read);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: isDark ? themeColors.background : '#F8F9FB' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {hasUnread && (
        <View style={[styles.headerActions, { paddingTop: insets.top + spacing.md, backgroundColor: headerBg, borderBottomColor: borderColor }]}>
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Ionicons name="checkmark-done" size={18} color={ACCENT} />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: hasUnread ? 0 : insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing['4xl']
          }
        ]}
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={48} color={themeColors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No notifications</Text>
            <Text style={[styles.emptyText, { color: themeColors.textSecondary }]}>
              You'll be notified about new assignments and updates here.
            </Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  list: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
  },
  headerActions: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    alignItems: 'flex-end',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  markAllText: {
    ...typography.label,
    color: ACCENT,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FB',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: ACCENT,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    gap: spacing.xs,
  },
  notifTitle: {
    ...typography.label,
    color: colors.text,
  },
  notifBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  notifTime: {
    ...typography.caption,
    color: colors.textLight,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.sm,
    marginLeft: 40 + spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: ACCENT + '10',
    borderRadius: borderRadius.md,
  },
  replyButtonText: {
    ...typography.caption,
    color: ACCENT,
    fontWeight: '600',
  },
  replyContainer: {
    marginTop: spacing.md,
    marginLeft: 40 + spacing.md,
  },
  replyInput: {
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    minHeight: 60,
    ...typography.body,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  sendButton: {
    backgroundColor: ACCENT,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    ...typography.button,
    color: '#FFF',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.h4,
    color: colors.text,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
