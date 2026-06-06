import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { usePermission } from '@/hooks/usePermission';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { can } = usePermission();

  if (isAuthenticated) {
    if (can('work_orders:read')) {
      return <Redirect href="/(tabs)/home" />;
    }
    return <Redirect href="/(tabs)/profile" />;
  }

  return <Redirect href="/(auth)/login" />;
}
