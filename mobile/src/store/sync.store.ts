import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStorageAdapter: StateStorage = {
  setItem: async (name, value) => {
    await AsyncStorage.setItem(name, value);
  },
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    return value ?? null;
  },
  removeItem: async (name) => {
    await AsyncStorage.removeItem(name);
  },
};

interface SyncState {
  lastSyncAt: string | null;
  isSyncing: boolean;
  pendingChanges: number;
  syncError: string | null;
  setLastSyncAt: (date: string) => void;
  setSyncing: (syncing: boolean) => void;
  incrementPending: () => void;
  decrementPending: (count?: number) => void;
  resetPending: () => void;
  setSyncError: (error: string | null) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      lastSyncAt: null,
      isSyncing: false,
      pendingChanges: 0,
      syncError: null,

      setLastSyncAt: (date) => set({ lastSyncAt: date, syncError: null }),

      setSyncing: (syncing) => set({ isSyncing: syncing }),

      incrementPending: () => set((state) => ({ pendingChanges: state.pendingChanges + 1 })),

      decrementPending: (count = 1) =>
        set((state) => ({
          pendingChanges: Math.max(0, state.pendingChanges - count),
        })),

      resetPending: () => set({ pendingChanges: 0 }),

      setSyncError: (error) => set({ syncError: error, isSyncing: false }),
    }),
    {
      name: 'sync-storage',
      storage: createJSONStorage(() => asyncStorageAdapter),
      partialize: (state) => ({
        lastSyncAt: state.lastSyncAt,
        pendingChanges: state.pendingChanges,
      }),
    },
  ),
);
