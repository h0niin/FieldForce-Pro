import { useEffect, useState } from 'react';
import { NativeModules } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/store/auth.store';
import { useAppTheme } from '@/hooks/useAppTheme';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useNotifications } from '@/hooks/use-notifications';

import { paymentsApi } from '@/api/endpoints';

SplashScreen.preventAutoHideAsync();

// Module-level flag — survives component remounts but resets on cold app start.
// Once the user authenticates (password or biometric) in this session, never
// redirect back to biometric-lock.
let sessionAuthenticated = false;

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled);

  // Initialize global push notifications listeners
  useNotifications();
  const { isDark } = useAppTheme();

  const fetchTokenProvider = async () => {
    try {
      const res = await paymentsApi.createStripeConnectionToken();
      if (res.data.status && res.data.data?.secret) {
        return res.data.data.secret;
      }
      throw new Error('Failed to fetch connection token');
    } catch (e) {
      console.error('Stripe Terminal Token Error:', e);
      throw e;
    }
  };

  // Wait for Zustand AsyncStorage rehydration before making routing decisions.
  const [storeHydrated, setStoreHydrated] = useState(
    useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setStoreHydrated(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (storeHydrated) {
      SplashScreen.hideAsync();
    }
  }, [storeHydrated]);

  useEffect(() => {
    if (!storeHydrated || !segments.length) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const onBiometricLock = segments[1] === 'biometric-lock';

    // Mark session active once user reaches tabs
    if (inTabsGroup) {
      sessionAuthenticated = true;
    }
    // Reset when user logs out
    if (!isAuthenticated) {
      sessionAuthenticated = false;
    }

    // Biometric lock ONLY on cold app start when:
    // - User was previously authenticated (persisted)
    // - Biometric is enabled
    // - User hasn't authenticated yet in THIS JS session
    const needsBiometricLock = isAuthenticated && biometricEnabled && !sessionAuthenticated;

    if (needsBiometricLock && !onBiometricLock) {
      router.replace('/(auth)/biometric-lock');
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      sessionAuthenticated = true;
      router.replace('/(tabs)/home');
    }
  }, [storeHydrated, isAuthenticated, biometricEnabled, segments, router]);

  const content = (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <OfflineIndicator />
      <Stack screenOptions={{ headerShown: false, animation: 'default' }} />
    </>
  );

  // Stripe Terminal requires a native module that isn't available in Expo Go.
  // We check for its existence before wrapping the app to avoid crashes.
  const isStripeSupported = !!NativeModules.StripeTerminalReactNative;

  if (isStripeSupported) {
    const { StripeTerminalProvider } = require('@stripe/stripe-terminal-react-native');
    return (
      <StripeTerminalProvider
        logLevel="verbose"
        tokenProvider={fetchTokenProvider}
      >
        {content}
      </StripeTerminalProvider>
    );
  }

  return content;
}
