import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function InvoiceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Invoices' }} />
      <Stack.Screen name="new" options={{ title: 'New Invoice', headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: 'Invoice' }} />
      <Stack.Screen name="receipt" options={{ title: 'Payment Receipt', headerLeft: () => null }} />
    </Stack>
  );
}
