import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function TimesheetLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Timesheets' }} />
      <Stack.Screen name="manual-entry" options={{ title: 'Manual Entry', presentation: 'modal' }} />
      <Stack.Screen name="trip-history" options={{ title: 'Trip History' }} />
    </Stack>
  );
}
