import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types/models';

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

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  biometricEnabled: boolean;
  biometricVerified: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  // Atomically logs in AND marks biometric as verified in one state update,
  // preventing the routing from briefly seeing isBiometricLocked=true.
  loginWithVerification: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setBiometricEnabled: (enabled: boolean) => void;
  setBiometricVerified: (verified: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      biometricEnabled: false,
      biometricVerified: false,

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        }),

      loginWithVerification: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          biometricVerified: true,
        }),

      logout: () =>
        set((state) => ({
          // Soft logout when biometrics are enabled: preserve user + refreshToken
          // so the login page can offer biometric re-authentication next visit.
          // The server session is kept alive in this case (see profile.tsx).
          // Full logout when biometrics are off: clear everything.
          user: state.biometricEnabled ? state.user : null,
          accessToken: null,
          refreshToken: state.biometricEnabled ? state.refreshToken : null,
          isAuthenticated: false,
          biometricVerified: false,
        })),

      setBiometricEnabled: (enabled) => set({ biometricEnabled: enabled }),

      setBiometricVerified: (verified) => set({ biometricVerified: verified }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => asyncStorageAdapter),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        biometricEnabled: state.biometricEnabled,
        // biometricVerified is intentionally excluded — must re-verify on every app launch
      }),
    },
  ),
);

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export function getRefreshToken(): string | null {
  return useAuthStore.getState().refreshToken;
}
