import { create } from 'zustand';

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  description?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  add: (notification: Omit<AppNotification, 'id'>, durationMs?: number) => void;
  remove: (id: string) => void;
  clear: () => void;
}

let notificationId = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  add: (notification, durationMs = 5000) => {
    const id = String(++notificationId);
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, durationMs);
  },

  remove: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clear: () => set({ notifications: [] }),
}));
