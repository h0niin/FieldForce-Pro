import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

const asyncStorageAdapter: StateStorage = {
  setItem: async (name, value) => { await AsyncStorage.setItem(name, value); },
  getItem: async (name) => { const v = await AsyncStorage.getItem(name); return v ?? null; },
  removeItem: async (name) => { await AsyncStorage.removeItem(name); },
};

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => asyncStorageAdapter),
    },
  ),
);
