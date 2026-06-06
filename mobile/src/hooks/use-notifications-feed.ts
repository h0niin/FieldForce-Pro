import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationsApi } from '@/api/endpoints';
import type { PageOptions, Notification } from '@/types/models';
import { useNotificationStore } from '@/store/notifications.store';

export const useNotificationsFeed = (params?: PageOptions) => {
    const [data, setData] = useState<Notification[] | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const lastPushReceivedAt = useNotificationStore(s => s.lastPushReceivedAt);

    const fetchNotifications = useCallback(async (isBackground = false) => {
        if (!isBackground) setIsLoading(true);
        setIsError(false);
        try {
            const res = await notificationsApi.getAll(params);
            const fetched = res.data?.data ?? [];
            setData(fetched);
            // Synced so we don't skew the badge
            // Synced so we don't skew the badge
            const unreadCount = fetched.filter(n => !n.is_read).length;
            useNotificationStore.getState().setUnreadCount(unreadCount);
        } catch (err: any) {
            if (err.message === 'Network Error') {
                // Silently ignore network errors that normally happen when backgrounding
            } else {
                console.error('Error fetching notifications:', err);
                setIsError(true);
            }
        } finally {
            if (!isBackground) setIsLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params ? JSON.stringify(params) : '']);

    // Refetch when the global push handler detects a new notification
    useEffect(() => {
        if (lastPushReceivedAt > 0) {
            fetchNotifications(true);
        }
    }, [lastPushReceivedAt, fetchNotifications]);

    useEffect(() => {
        fetchNotifications();

        // Also refetch when the app comes to the foreground (e.g. user tapped a notification)
        const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
            if (state === 'active') {
                fetchNotifications(true);
            }
        });

        return () => {
            appStateSub.remove();
        };
    }, [fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            await notificationsApi.markAsRead(id);
            setData((prev) =>
                prev?.map((n) => n.id === id ? { ...n, is_read: true } : n)
            );
            useNotificationStore.getState().decrementUnread();
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            setData((prev) =>
                prev?.map((n) => ({ ...n, is_read: true }))
            );
            useNotificationStore.getState().clearUnread();
        } catch (err) {
            console.error('Failed to mark all as read:', err);
        }
    };

    return {
        data,
        isLoading,
        isError,
        refetch: fetchNotifications,
        markAsRead,
        markAllAsRead
    };
};
