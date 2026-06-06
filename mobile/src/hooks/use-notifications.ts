import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { notificationsApi, authApi } from '@/api/endpoints';
import { useNotificationStore } from '@/store/notifications.store';
import { useAuthStore } from '@/store/auth.store';

// expo-notifications is not available in Expo Go (SDK 53+), skip entirely
const isExpoGo = Constants.appOwnership === 'expo';

let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Notifications?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('expo-notifications is not available in this environment.');
  }
} else {
  console.log('Skipping expo-notifications in Expo Go.');
}

interface NotificationState {
  pushToken: string | null;
  notification: any | null;
  error: string | null;
}

export function useNotifications(): NotificationState {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  const triggerRefetch = useNotificationStore(s => s.triggerRefetch);
  const setUnreadCount = useNotificationStore(s => s.setUnreadCount);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationsApi.getUnread();
      setUnreadCount(res.data?.data?.length ?? 0);
    } catch (e: any) {
      if (e.message !== 'Network Error') {
        console.warn('Silent fail fetching unread count:', e);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    registerForPushNotifications()
      .then(async (token) => {
        if (!isMounted) return;
        setPushToken(token);

        // Sync token to backend if authenticated
        if (token && isAuthenticated) {
          try {
            await authApi.updateMe({ fcm_token: token });
          } catch (e) {
            console.warn('Failed to sync push token to backend:', e);
          }
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      });

    fetchUnreadCount();

    // Poll for new notifications every 30 seconds while authenticated
    const pollInterval = isAuthenticated
      ? setInterval(() => {
          fetchUnreadCount();
          triggerRefetch();
        }, 30_000)
      : null;

    if (Notifications) {
      notificationListener.current = Notifications.addNotificationReceivedListener((n) => {
        setNotification(n);
        fetchUnreadCount();
        triggerRefetch();
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
        router.push('/notifications');
      });
    }

    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        fetchUnreadCount();
        triggerRefetch();
      }
    });

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      notificationListener.current?.remove();
      responseListener.current?.remove();
      appStateSub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return { pushToken, notification, error };
}

async function registerForPushNotifications(): Promise<string | null> {
  if (!Notifications || !Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (err: any) {
    console.log('Push notifications not available in this environment (e.g. Expo Go):', err?.message);
    return null;
  }
}
