import { router } from 'expo-router';

/**
 * Safe back navigation: goes back if there's history, otherwise navigates
 * to the given fallback route (defaults to the Schedule tab).
 */
export function goBack(fallback: string = '/(tabs)/schedule') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as any);
  }
}
