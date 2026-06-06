import { create } from 'zustand';

interface NotificationState {
    unreadCount: number;
    lastPushReceivedAt: number;
    setUnreadCount: (count: number) => void;
    decrementUnread: () => void;
    clearUnread: () => void;
    triggerRefetch: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    unreadCount: 0,
    lastPushReceivedAt: 0,
    setUnreadCount: (count) => set({ unreadCount: count }),
    decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
    clearUnread: () => set({ unreadCount: 0 }),
    triggerRefetch: () => set({ lastPushReceivedAt: Date.now() }),
}));
